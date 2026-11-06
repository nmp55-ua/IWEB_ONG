import { beforeAll, afterAll, beforeEach, it, expect, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { crearEntornoPruebas } from './pruebas/soporte.js';
import { crearServicio } from './servicio.js';
let entorno, fixtures, servicio, pasarela, enviar, aporte, pago;
const evento = (tipo = 'payment_intent.succeeded', cambios = {}) => ({
  id: 'evt_' + randomUUID(),
  type: tipo,
  created: 1800000000,
  api_version: '2025-02-24.acacia',
  livemode: false,
  data: { object: { id: pago.id } },
  ...cambios,
});
beforeAll(async () => {
  entorno = await crearEntornoPruebas();
  fixtures = await entorno.crearFixtures();
});
afterAll(async () => {
  await entorno?.cerrar();
});
beforeEach(async () => {
  aporte = (
    await entorno.pool.query(
      "INSERT INTO aportaciones(donante_id,modalidad,importe,referencia) VALUES($1,'puntual',20,$2) RETURNING *",
      [fixtures.invitado.id, randomUUID()],
    )
  ).rows[0];
  pago = {
    id: 'pi_' + randomUUID(),
    amount: 2000,
    amount_received: 2000,
    currency: 'eur',
    status: 'succeeded',
    invoice: null,
    metadata: { referencia: aporte.referencia, modulo: 'donaciones' },
    livemode: false,
  };
  pasarela = { obtenerPago: vi.fn(async () => ({ ...pago })) };
  enviar = vi.fn(async () => true);
  servicio = crearServicio({ pool: entorno.pool, pasarela, enviarCorreo: enviar });
});
it('confirma una vez con evento repetido, distinto y concurrente; conserva fecha y resumen', async () => {
  const e = evento();
  await Promise.all([
    servicio.procesarEvento(e),
    servicio.procesarEvento(e),
    servicio.procesarEvento(evento()),
  ]);
  const a = (await entorno.pool.query('SELECT * FROM aportaciones WHERE id=$1', [aporte.id])).rows[0];
  expect(a.estado).toBe('confirmada');
  expect(a.pasarela_pago_id).toBe(pago.id);
  expect(a.fecha_cobro.toISOString()).toBe(new Date(1800000000 * 1000).toISOString());
  expect(
    (await entorno.pool.query('SELECT count(*) FROM correos_aportacion WHERE aportacion_id=$1', [aporte.id]))
      .rows[0].count,
  ).toBe('1');
  expect(enviar).toHaveBeenCalledTimes(1);
  await servicio.procesarEvento(evento('payment_intent.payment_failed', { created: 1700000000 }));
  expect((await entorno.pool.query('SELECT * FROM aportaciones WHERE id=$1', [aporte.id])).rows[0]).toEqual(
    a,
  );
});
it('rechazo seguido de éxito del mismo pago reutiliza la fila; SMTP fallido no revierte', async () => {
  pago.status = 'requires_payment_method';
  pago.amount_received = 0;
  await servicio.procesarEvento(evento('payment_intent.payment_failed'));
  expect(
    (await entorno.pool.query('SELECT estado FROM aportaciones WHERE id=$1', [aporte.id])).rows[0].estado,
  ).toBe('rechazada');
  pago.status = 'succeeded';
  pago.amount_received = 2000;
  enviar.mockResolvedValue(false);
  await servicio.procesarEvento(evento());
  expect(
    (await entorno.pool.query('SELECT estado FROM aportaciones WHERE id=$1', [aporte.id])).rows[0].estado,
  ).toBe('confirmada');
  expect((await servicio.repo.correo(aporte.id)).estado).toBe('fallido');
});
it('un fallo tardío conserva cancelada y un cobro acreditado posterior confirma la misma fila', async () => {
  await entorno.pool.query("UPDATE aportaciones SET estado='cancelada' WHERE id=$1", [aporte.id]);
  pago.status = 'requires_payment_method';
  pago.amount_received = 0;
  await servicio.procesarEvento(evento('payment_intent.payment_failed'));
  expect(
    (await entorno.pool.query('SELECT estado FROM aportaciones WHERE id=$1', [aporte.id])).rows[0].estado,
  ).toBe('cancelada');
  pago.status = 'succeeded';
  pago.amount_received = 2000;
  await servicio.procesarEvento(evento());
  expect(
    (await entorno.pool.query('SELECT estado FROM aportaciones WHERE id=$1', [aporte.id])).rows[0].estado,
  ).toBe('confirmada');
});

it.each([
  { amount: 1999 },
  { amount_received: 1999 },
  { currency: 'usd' },
  { invoice: 'in_ajena' },
  { livemode: true },
  { metadata: { modulo: 'otro', referencia: 'ajena' } },
])('no confirma recursos incompatibles %j', async (cambio) => {
  Object.assign(pago, cambio);
  await servicio.procesarEvento(evento());
  expect(
    (await entorno.pool.query('SELECT estado FROM aportaciones WHERE id=$1', [aporte.id])).rows[0].estado,
  ).toBe('pendiente');
  expect(enviar).not.toHaveBeenCalled();
});
it('fallo transitorio no registra evento y Stripe se consulta sin transacción abierta', async () => {
  const e = evento();
  pasarela.obtenerPago.mockImplementationOnce(async () => {
    const r = await entorno.pool.query(
      "SELECT count(*) FROM pg_stat_activity WHERE datname=current_database() AND state='idle in transaction' AND query LIKE '%advisory%'",
    );
    expect(r.rows[0].count).toBe('0');
    throw new Error('red sintética');
  });
  await expect(servicio.procesarEvento(e)).rejects.toMatchObject({ estado: 503 });
  expect(
    (await entorno.pool.query('SELECT count(*) FROM eventos_pasarela WHERE pasarela_evento_id=$1', [e.id]))
      .rows[0].count,
  ).toBe('0');
  await servicio.procesarEvento(e);
});
it('rechaza versión y estructura incompatibles antes de consultar la pasarela', async () => {
  await expect(servicio.procesarEvento(evento(undefined, { api_version: 'otra' }))).rejects.toMatchObject({
    estado: 400,
  });
  await expect(servicio.procesarEvento({ id: 'incompleto' })).rejects.toMatchObject({ estado: 400 });
  expect(pasarela.obtenerPago).not.toHaveBeenCalled();
});
it('un rollback conserva evento, dinero y correo sin cambios; una reentrega puede confirmar', async () => {
  const c = await entorno.conectar(),
    e = evento();
  // Un bloqueo de la tabla de correo fuerza un error SQL tras intentar el cambio financiero.
  await c.query('BEGIN');
  await c.query('LOCK TABLE correos_aportacion IN ACCESS EXCLUSIVE MODE');
  const original = servicio.repo.guardarPago.bind(servicio.repo);
  vi.spyOn(servicio.repo, 'guardarPago').mockImplementationOnce(async (cliente, ...args) => {
    await cliente.query("SET lock_timeout='100ms'");
    try {
      return await original(cliente, ...args);
    } finally {
      await cliente.query('RESET lock_timeout');
    }
  });
  try {
    await expect(servicio.procesarEvento(e)).rejects.toMatchObject({ estado: 503 });
  } finally {
    await c.query('ROLLBACK');
    c.release();
  }
  expect(
    (await entorno.pool.query('SELECT estado FROM aportaciones WHERE id=$1', [aporte.id])).rows[0].estado,
  ).toBe('pendiente');
  expect(
    (await entorno.pool.query('SELECT count(*) FROM eventos_pasarela WHERE pasarela_evento_id=$1', [e.id]))
      .rows[0].count,
  ).toBe('0');
  expect(await servicio.repo.correo(aporte.id)).toBeUndefined();
  await servicio.procesarEvento(e);
  expect(
    (await entorno.pool.query('SELECT estado FROM aportaciones WHERE id=$1', [aporte.id])).rows[0].estado,
  ).toBe('confirmada');
});
it('pagos distintos que reclaman la misma aportación no sobrescriben una confirmación', async () => {
  const primero = { ...pago },
    segundo = { ...pago, id: 'pi_' + randomUUID() };
  pasarela.obtenerPago.mockImplementation(async (id) => (id === primero.id ? primero : segundo));
  await Promise.all([
    servicio.procesarEvento(evento()),
    servicio.procesarEvento(evento(undefined, { data: { object: { id: segundo.id } } })),
  ]);
  const a = (await entorno.pool.query('SELECT * FROM aportaciones WHERE id=$1', [aporte.id])).rows[0];
  expect([primero.id, segundo.id]).toContain(a.pasarela_pago_id);
  expect(a.estado).toBe('confirmada');
  expect(
    (await entorno.pool.query("SELECT count(*) FROM eventos_pasarela WHERE estado='incidencia'")).rows[0]
      .count,
  ).not.toBe('0');
  expect(
    (await entorno.pool.query('SELECT count(*) FROM correos_aportacion WHERE aportacion_id=$1', [aporte.id]))
      .rows[0].count,
  ).toBe('1');
});
it('Checkout completado solo correlaciona, expirado actual cancela y éxito tardío confirma la misma fila', async () => {
  const sesion = {
    id: 'cs_' + randomUUID(),
    mode: 'payment',
    status: 'complete',
    payment_status: 'paid',
    metadata: pago.metadata,
    client_reference_id: aporte.referencia,
    invoice: null,
    subscription: null,
    livemode: false,
    url: null,
    payment_intent: pago.id,
  };
  const preparar = { id: 'cs_sin_red', url: 'https://checkout.stripe.test' };
  await entorno.pool.query(
    `INSERT INTO operaciones_pago(solicitud_id,aportacion_id,huella_solicitud,solicitud_checkout,estado) VALUES($1,$2,'huella',$3,'preparada')`,
    [randomUUID(), aporte.id, preparar],
  );
  pasarela.obtenerSesionPago = vi.fn(async () => ({ ...sesion }));
  await servicio.procesarEvento(
    evento('checkout.session.completed', { data: { object: { id: sesion.id } } }),
  );
  expect(
    (await entorno.pool.query('SELECT estado FROM aportaciones WHERE id=$1', [aporte.id])).rows[0].estado,
  ).toBe('pendiente');
  sesion.status = 'expired';
  sesion.payment_status = 'unpaid';
  await servicio.procesarEvento(evento('checkout.session.expired', { data: { object: { id: sesion.id } } }));
  expect(
    (await entorno.pool.query('SELECT estado FROM aportaciones WHERE id=$1', [aporte.id])).rows[0].estado,
  ).toBe('cancelada');
  await servicio.procesarEvento(evento());
  expect(
    (await entorno.pool.query('SELECT estado FROM aportaciones WHERE id=$1', [aporte.id])).rows[0].estado,
  ).toBe('confirmada');
  await servicio.procesarEvento(evento('checkout.session.expired', { data: { object: { id: sesion.id } } }));
  expect(
    (await entorno.pool.query('SELECT estado FROM aportaciones WHERE id=$1', [aporte.id])).rows[0].estado,
  ).toBe('confirmada');
});
it('una reentrega ya registrada recupera solo el correo sin depender otra vez de Stripe', async () => {
  const e = evento();
  enviar.mockResolvedValueOnce(false);
  await servicio.procesarEvento(e);
  const llamadas = pasarela.obtenerPago.mock.calls.length;
  pasarela.obtenerPago.mockRejectedValue(new Error('Stripe no disponible'));
  await servicio.procesarEvento(e);
  expect(pasarela.obtenerPago).toHaveBeenCalledTimes(llamadas);
  expect((await servicio.repo.correo(aporte.id)).estado).toBe('enviado');
});
