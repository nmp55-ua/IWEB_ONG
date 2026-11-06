import { beforeAll, afterAll, beforeEach, it, expect, vi } from 'vitest';
import { crearEntornoPruebas } from './pruebas/soporte.js';
import { randomUUID } from 'node:crypto';
import { crearRepositorio } from './repositorio.js';
import { crearConfirmaciones } from './confirmaciones.js';

let entorno, repo, aportacion, correo, fixtures;
beforeAll(async () => {
  entorno = await crearEntornoPruebas();
  repo = crearRepositorio(entorno.pool);
  fixtures = await entorno.crearFixtures();
});
afterAll(async () => {
  await entorno?.cerrar();
});
beforeEach(async () => {
  aportacion = (
    await entorno.pool.query(
      "INSERT INTO aportaciones(donante_id,modalidad,importe,referencia) VALUES($1,'puntual',20,$2) RETURNING *",
      [fixtures.invitado.id, randomUUID()],
    )
  ).rows[0];
  // Cada prueba conserva los datos anteriores; solo usa su propia aportación.
  correo = await repo.crearCorreo(entorno.pool, aportacion.id, {
    referencia: aportacion.referencia,
    importe: '20.00',
    modalidad: 'puntual',
    destino: 'fondo general',
    fechaCobro: '2026-11-06T12:00:00+01:00',
  });
});
it('crea una notificación lógica inmutable y reclama un único intento concurrente', async () => {
  await repo.crearCorreo(entorno.pool, aportacion.id, { importe: '99.00' });
  expect((await repo.correo(aportacion.id)).resumen.importe).toBe('20.00');
  const resultados = await Promise.all([
    repo.reclamarCorreo(aportacion.id),
    repo.reclamarCorreo(aportacion.id),
  ]);
  expect(resultados.filter(Boolean)).toHaveLength(1);
  const activo = resultados.find(Boolean);
  expect(activo.intentos).toBe(1);
  expect(activo.reservado_hasta.getTime() - Date.now()).toBeGreaterThan(28000);
});
it('renueva la reserva y cerca el intento antiguo después de recuperar una reserva vencida', async () => {
  const primero = await repo.reclamarCorreo(aportacion.id);
  expect(await repo.renovarCorreo(primero)).toBe(true);
  await entorno.pool.query(
    "UPDATE correos_aportacion SET reservado_hasta=clock_timestamp()-interval '1 second' WHERE id=$1",
    [correo.id],
  );
  expect(await repo.renovarCorreo(primero)).toBe(false);
  const segundo = await repo.reclamarCorreo(aportacion.id);
  expect(segundo.intentos).toBe(2);
  expect(await repo.terminarCorreo(primero, true)).toBe(false);
  expect(await repo.terminarCorreo(segundo, false)).toBe(true);
  expect((await repo.correo(aportacion.id)).estado).toBe('fallido');
});
it.each([true, false])('envía fuera de transacción y conserva el resumen; SMTP=%s', async (aceptado) => {
  const enviar = vi.fn(async () => {
    const activos = await entorno.pool.query(
      "SELECT count(*) FROM pg_stat_activity WHERE datname=current_database() AND state='idle in transaction' AND query LIKE '%correos_aportacion%'",
    );
    expect(activos.rows[0].count).toBe('0');
    return aceptado;
  });
  const servicio = crearConfirmaciones(repo, enviar);
  expect(await servicio.enviar(aportacion.id)).toBe(aceptado ? 'enviado' : 'fallido');
  expect(enviar).toHaveBeenCalledWith(
    expect.objectContaining({
      para: 'invitado@example.test',
      texto: expect.stringContaining(aportacion.referencia),
    }),
    { tiempoConexionMs: 3000, tiempoSaludoMs: 3000, tiempoInactividadMs: 5000 },
  );
  expect(
    (await entorno.pool.query('SELECT estado FROM aportaciones WHERE id=$1', [aportacion.id])).rows[0].estado,
  ).toBe('pendiente');
  if (aceptado) {
    await servicio.enviar(aportacion.id);
    expect(enviar).toHaveBeenCalledTimes(1);
  }
});
it('una reserva viva devuelve conflicto y no envía', async () => {
  await repo.reclamarCorreo(aportacion.id);
  const enviar = vi.fn();
  await expect(crearConfirmaciones(repo, enviar).enviar(aportacion.id)).rejects.toMatchObject({
    estado: 409,
    codigo: 'CORREO_EN_ENVIO',
  });
  expect(enviar).not.toHaveBeenCalled();
});
it('renueva cada diez segundos mientras espera SMTP y convierte excepciones en fallo', async () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
  const renovar = vi.spyOn(repo, 'renovarCorreo');
  let rechazar;
  const iniciado = new Promise((resolver) => {
    const enviar = () => {
      resolver();
      return new Promise((_, rechazo) => {
        rechazar = rechazo;
      });
    };
    correo.resultado = crearConfirmaciones(repo, enviar).enviar(aportacion.id);
  });
  try {
    await iniciado;
    await vi.advanceTimersByTimeAsync(10000);
    expect(renovar).toHaveBeenCalledTimes(1);
    rechazar(new Error('SMTP sintético'));
    expect(await correo.resultado).toBe('fallido');
  } finally {
    vi.useRealTimers();
    renovar.mockRestore();
  }
});
