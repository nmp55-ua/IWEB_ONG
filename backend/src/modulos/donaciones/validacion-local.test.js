import { beforeAll, afterAll, it, expect } from 'vitest';
import { crearBancoLocal } from './pruebas/banco-local.js';

let banco;
beforeAll(async () => {
  banco = await crearBancoLocal();
});
afterAll(async () => {
  await banco?.cerrar();
});
const ruta = (caso) => '/api/aportaciones/referencia/' + banco.referencias[caso];

it('G1/P05: motivo y Checkout recuperable; cancelado=1 no escribe ni cancela ni confirma', async () => {
  const antes = await banco.balance();
  const rechazo = (await banco.agente.get(ruta('rechazada')).expect(200)).body;
  expect(rechazo.estado).toBe('rechazada');
  expect(rechazo.motivo).toBeTruthy();
  expect(rechazo.urlPago).toBeTruthy();
  for (const caso of ['pendiente', 'rechazada', 'puntual']) {
    const a = (await banco.agente.get(ruta(caso)).expect(200)).body;
    const b = (await banco.agente.get(ruta(caso) + '?cancelado=1').expect(200)).body;
    expect(b).toEqual(a);
  }
  const recuperada = (
    await banco.agente
      .post('/api/aportaciones')
      .set('origin', banco.origen)
      .send({ claveSolicitud: rechazo.preparacion.claveSolicitud, tokenCsrf: banco.tokenCsrf })
      .expect(200)
  ).body;
  expect(recuperada.referencia).toBe(rechazo.referencia);
  expect(recuperada.urlPago).toBe(rechazo.urlPago);
  const despues = await banco.balance();
  expect(despues.aportaciones).toEqual(antes.aportaciones);
  expect(despues.operaciones).toEqual(antes.operaciones);
  expect(despues.llamadas.checkout).toBe(antes.llamadas.checkout);
});
it.each(['nombre', 'apellidos', 'direccion'])(
  'G2/P16: cuenta vinculada no cambia %s ni llega a Stripe',
  async (campo) => {
    const antes = await banco.balance();
    const datos = banco.dto();
    datos.donante[campo] += ' Cambio real';
    const r = await banco.agente
      .post('/api/aportaciones')
      .set('origin', banco.origen)
      .send({ ...datos, tokenCsrf: banco.tokenCsrf })
      .expect(409);
    expect(r.body.error.codigo).toBe('DATOS_DONANTE_INCOMPATIBLES');
    expect(JSON.stringify(r.body)).not.toContain(antes.identidad.correo);
    const despues = await banco.balance();
    expect(despues.identidad).toEqual(antes.identidad);
    expect(despues.aportaciones).toEqual(antes.aportaciones);
    expect(despues.operaciones).toEqual(antes.operaciones);
    expect(despues.llamadas.checkout).toBe(antes.llamadas.checkout);
  },
);
it('G3/P08/P10: segundo fallo HTTP conserva cobro, resumen y reintento sin otra llamada Checkout', async () => {
  const antes = await banco.balance();
  const inicial = (await banco.agente.get(ruta('puntual')).expect(200)).body;
  expect(inicial).toMatchObject({
    estado: 'confirmada',
    correo: { estado: 'fallido', puedeReintentar: true },
  });
  const r = await banco.agente
    .post(ruta('puntual') + '/correo')
    .set('origin', banco.origen)
    .send({ tokenCsrf: banco.tokenCsrf })
    .expect(200);
  expect(r.body.estadoCorreo).toBe('fallido');
  expect((await banco.agente.get(ruta('puntual')).expect(200)).body).toEqual(inicial);
  const despues = await banco.balance();
  expect(despues.aportaciones).toEqual(antes.aportaciones);
  expect(despues.operaciones).toEqual(antes.operaciones);
  expect(despues.llamadas.checkout).toBe(antes.llamadas.checkout);
  const id = antes.aportaciones.find((x) => x.referencia === banco.referencias.puntual).id;
  expect(despues.correos.find((x) => x.aportacion_id === id)).toMatchObject({
    estado: 'fallido',
    intentos: 2,
    enviado_en: null,
  });
});
it('G3/S05: cuota confirmada y socio activo con correo fallido, periodicidad y previsión', async () => {
  const r = (await banco.agente.get(ruta('socio')).expect(200)).body;
  expect(r).toMatchObject({
    estado: 'confirmada',
    modalidad: 'cuota_socio',
    importe: '20.00',
    correo: { estado: 'fallido', puedeReintentar: true },
    suscripcion: { estado: 'activa', periodicidad: 'mensual' },
  });
  expect(r.suscripcion.fechaProximoCobro).toBeTruthy();
  expect(r.resumenConfirmacion.referencia).toBe(banco.referencias.socio);
});
