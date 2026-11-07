// HU-01 · US2 (T055 y T056): reconciliación de facturas y suscripciones de socio con
// PostgreSQL real y recursos canónicos simulados con la forma del adaptador común.
// Los casos describen pasarela-stripe.md («Cuotas», «Entregas duplicadas…», «Próxima fecha
// y cancelación») y modelo-datos.md; no dependen de Stripe real ni del navegador.
import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { crearEntornoPruebas } from './pruebas/soporte.js';
import { crearServicio } from './servicio.js';
import { textoCorreoConfirmacion, textoCorreoFalloCuota } from './textoCorreo.js';

let entorno, fixtures, stripe, pasarela, enviar, servicio;
const DIA = 86400;
const ahora = () => Math.floor(Date.now() / 1000);
const clon = (x) => (x === undefined ? undefined : structuredClone(x));
const fechaMadrid = (segundos) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(segundos * 1000));
const req = () => ({
  session: {
    save(cb) {
      cb();
    },
  },
});
const invitado = {
  nombre: 'Invitado',
  apellidos: 'Sintetico',
  nifNie: '99999999R',
  correo: 'invitado@example.test',
  direccion: 'Calle Ejemplo 2',
};

function recurso(mapa, id) {
  const valor = mapa.get(id);
  if (!valor) throw Object.assign(new Error('Recurso sintético inexistente'), { estado: 503 });
  return clon(valor);
}

beforeAll(async () => {
  entorno = await crearEntornoPruebas();
  fixtures = await entorno.crearFixtures();
});
afterAll(async () => {
  await entorno?.cerrar();
});
beforeEach(() => {
  stripe = { facturas: new Map(), suscripciones: new Map(), sesiones: new Map() };
  pasarela = {
    prepararSesionPago: vi.fn((x) => ({
      mode: x.periodicidad ? 'subscription' : 'payment',
      metadata: { referencia: x.referencia, modulo: 'donaciones' },
    })),
    crearSesionPago: vi.fn(async () => ({
      id: 'cs_' + randomUUID(),
      url: 'https://checkout.stripe.test/alta',
    })),
    obtenerSesionPago: vi.fn(async (id) => recurso(stripe.sesiones, id)),
    obtenerSesionDeSuscripcion: vi.fn(async (id) => ({
      data: [...stripe.sesiones.values()]
        .filter((s) => s.subscription === id)
        .slice(0, 2)
        .map(clon),
      has_more: false,
    })),
    obtenerFactura: vi.fn(async (id) => recurso(stripe.facturas, id)),
    obtenerSuscripcion: vi.fn(async (id) => recurso(stripe.suscripciones, id)),
    obtenerPago: vi.fn(async () => {
      throw new Error('Una cuota no se reconcilia por PaymentIntent.');
    }),
  };
  enviar = vi.fn(async () => true);
  servicio = crearServicio({ pool: entorno.pool, pasarela, enviarCorreo: enviar });
});

// Crea un alta real (preparación + Checkout simulado) y sus recursos canónicos.
async function alta({ periodicidad = 'mensual', importe = '10.00', proyectoId = null } = {}) {
  const r = req();
  const creada = await servicio.crear(r, {
    claveSolicitud: randomUUID(),
    modalidad: 'socio',
    periodicidad,
    importe,
    proyectoId,
    donante: { ...invitado },
  });
  const a = (await entorno.pool.query('SELECT * FROM aportaciones WHERE referencia=$1', [creada.referencia]))
    .rows[0];
  const op = (await entorno.pool.query('SELECT * FROM operaciones_pago WHERE aportacion_id=$1', [a.id]))
    .rows[0];
  const subId = 'sub_' + randomUUID();
  const c = {
    req: r,
    referencia: creada.referencia,
    aportacionId: a.id,
    suscripcionId: a.suscripcion_socio_id,
    op,
    subId,
    centimos: Math.round(Number(importe) * 100),
    importe: a.importe,
    periodo: ahora() + 30 * DIA,
  };
  stripe.suscripciones.set(subId, {
    id: subId,
    metadata: { referencia: c.referencia, modulo: 'donaciones' },
    status: 'incomplete',
    latest_invoice: null,
    collection_method: 'charge_automatically',
    current_period_end: c.periodo,
    cancel_at_period_end: false,
    cancel_at: null,
    canceled_at: null,
    livemode: false,
  });
  stripe.sesiones.set(op.sesion_checkout_id, {
    id: op.sesion_checkout_id,
    status: 'complete',
    payment_status: 'paid',
    mode: 'subscription',
    client_reference_id: c.referencia,
    metadata: { referencia: c.referencia, modulo: 'donaciones' },
    payment_intent: null,
    subscription: subId,
    invoice: null,
    url: null,
    expires_at: ahora() + DIA,
    livemode: false,
  });
  return c;
}

function factura(
  c,
  {
    id = 'in_' + randomUUID(),
    motivo = 'subscription_cycle',
    pagada = true,
    centimos = c.centimos,
    pagadaEn = ahora() - 60,
    intento = null,
    moneda = 'eur',
    fueraDePasarela = false,
    facturaDelPago,
    pagoId = 'pi_' + randomUUID(),
    ultima = true,
  } = {},
) {
  const f = {
    id,
    subscription: c.subId,
    payment_intent: {
      id: pagoId,
      amount: centimos,
      amount_received: pagada ? centimos : 0,
      currency: moneda,
      status: pagada ? 'succeeded' : 'requires_payment_method',
      invoice: facturaDelPago ?? id,
      metadata: {},
      livemode: false,
    },
    billing_reason: motivo,
    paid: pagada,
    status: pagada ? 'paid' : 'open',
    paid_out_of_band: fueraDePasarela,
    amount_paid: pagada ? centimos : 0,
    currency: moneda,
    status_transitions: { paid_at: pagada ? pagadaEn : null },
    next_payment_attempt: intento,
    livemode: false,
  };
  stripe.facturas.set(id, f);
  const s = stripe.suscripciones.get(c.subId);
  if (ultima) s.latest_invoice = id;
  if (motivo === 'subscription_create') {
    stripe.sesiones.get(c.op.sesion_checkout_id).invoice = id;
    if (pagada) s.status = 'active';
  }
  return f;
}

const evento = (tipo, objeto, cambios = {}) => ({
  id: 'evt_' + randomUUID(),
  type: tipo,
  created: ahora(),
  api_version: '2025-02-24.acacia',
  livemode: false,
  data: { object: objeto },
  ...cambios,
});
const eventoFactura = (tipo, f) => evento(tipo, { id: f.id, subscription: f.subscription });
const eventoSuscripcion = (tipo, c) => evento(tipo, { id: c.subId });
const procesar = (e) => servicio.procesarEvento(e);

it.each(['2025-02-24.acacia', '2026-10-28.endive'])(
  'resuelve la factura %s por consulta acacia, sin confiar en la suscripción del evento',
  async (api_version) => {
    const c = await alta(),
      f = factura(c, { motivo: 'subscription_create' });
    const e = evento(
      'invoice.paid',
      {
        id: f.id,
        subscription: 'sub_falsa',
        parent: { type: 'subscription_details', subscription_details: { subscription: 'sub_tambien_falsa' } },
      },
      { api_version },
    );
    await procesar(e);
    expect((await cuotas(c))[0].estado).toBe('confirmada');
    expect(pasarela.obtenerSuscripcion).toHaveBeenCalledWith(c.subId);
    expect(pasarela.obtenerSuscripcion).not.toHaveBeenCalledWith('sub_falsa');
    expect((await estadoEvento(e)).estado).toBe('procesado');
  },
);
it('endive sin subscription superior usa solo el identificador y confirma la primera factura una vez', async () => {
  const c = await alta(),
    f = factura(c, { motivo: 'subscription_create' });
  const e = evento(
    'invoice.paid',
    { id: f.id, parent: { type: 'subscription_details', subscription_details: { subscription: c.subId } } },
    { api_version: '2026-10-28.endive' },
  );
  await Promise.all([procesar(e), procesar(e)]);
  expect(await sumaConfirmada(c)).toBe('10.00');
  expect(await cuotas(c)).toHaveLength(1);
});
it('una consulta preliminar fallida no ignora ni registra la factura', async () => {
  const c = await alta(),
    f = factura(c),
    e = eventoFactura('invoice.paid', f);
  pasarela.obtenerFactura.mockRejectedValueOnce(new Error('Timeout sintético'));
  await expect(procesar(e)).rejects.toMatchObject({ estado: 503 });
  expect(await estadoEvento(e)).toBeUndefined();
});
it('una factura canónica sin suscripción se ignora sin tomar la del evento', async () => {
  const c = await alta(),
    f = factura(c);
  stripe.facturas.set(f.id, { ...f, subscription: null });
  const e = eventoFactura('invoice.paid', f);
  await procesar(e);
  expect(pasarela.obtenerSuscripcion).not.toHaveBeenCalled();
  expect((await estadoEvento(e)).estado).toBe('ignorado');
  expect(await sumaConfirmada(c)).toBe('0');
});
it('si la suscripción difiere al releer bajo exclusión, no se procesa con el lock anterior', async () => {
  const c = await alta(),
    f = factura(c),
    e = eventoFactura('invoice.paid', f);
  pasarela.obtenerFactura
    .mockResolvedValueOnce(clon(f))
    .mockResolvedValueOnce({ ...f, subscription: 'sub_distinta' });
  await expect(procesar(e)).rejects.toMatchObject({ estado: 503 });
  expect(await estadoEvento(e)).toBeUndefined();
  expect(await sumaConfirmada(c)).toBe('0');
});
it('una factura canónica con identificador incompatible no se registra como ajena', async () => {
  const c = await alta(),
    f = factura(c),
    e = eventoFactura('invoice.paid', f);
  pasarela.obtenerFactura.mockResolvedValueOnce({ ...f, id: 'in_incompatible' });
  await expect(procesar(e)).rejects.toMatchObject({ estado: 503 });
  expect(await estadoEvento(e)).toBeUndefined();
});
it.each(['invoice.payment_failed', 'invoice.updated'])(
  'resuelve %s endive sin subscription superior ni parent',
  async (tipo) => {
    const c = await alta(),
      f = factura(c),
      e = evento(tipo, { id: f.id }, { api_version: '2026-10-28.endive' });
    await procesar(e);
    expect(pasarela.obtenerSuscripcion).toHaveBeenCalledWith(c.subId);
    expect((await estadoEvento(e)).estado).toBe('procesado');
    expect(await sumaConfirmada(c)).toBe('0');
  },
);
it('endive mantiene la cancelación canónica de suscripción', async () => {
  const c = await alta();
  await pagarInicial(c);
  stripe.suscripciones.get(c.subId).status = 'canceled';
  await procesar(
    evento('customer.subscription.deleted', { id: c.subId }, { api_version: '2026-10-28.endive' }),
  );
  expect((await suscripcion(c)).estado).toBe('cancelada');
  expect(await sumaConfirmada(c)).toBe('10.00');
});

async function pagarInicial(c, opciones = {}) {
  const f = factura(c, { motivo: 'subscription_create', ...opciones });
  await procesar(eventoFactura('invoice.paid', f));
  return f;
}
async function cuotas(c) {
  return (
    await entorno.pool.query('SELECT * FROM aportaciones WHERE suscripcion_socio_id=$1 ORDER BY id', [
      c.suscripcionId,
    ])
  ).rows;
}
async function suscripcion(c) {
  return (
    await entorno.pool.query(
      `SELECT *,to_char(fecha_proximo_cobro,'YYYY-MM-DD') AS proximo FROM suscripciones_socio WHERE id=$1`,
      [c.suscripcionId],
    )
  ).rows[0];
}
async function sumaConfirmada(c) {
  return (
    await entorno.pool.query(
      "SELECT coalesce(sum(importe),0)::text AS total FROM aportaciones WHERE suscripcion_socio_id=$1 AND estado='confirmada'",
      [c.suscripcionId],
    )
  ).rows[0].total;
}
async function correos(c, tipo) {
  return (
    await entorno.pool.query(
      `SELECT ca.* FROM correos_aportacion ca JOIN aportaciones a ON a.id=ca.aportacion_id
      WHERE a.suscripcion_socio_id=$1 AND ca.tipo=$2 ORDER BY ca.id`,
      [c.suscripcionId, tipo],
    )
  ).rows;
}
async function estadoEvento(e) {
  return (
    await entorno.pool.query('SELECT estado,error_codigo FROM eventos_pasarela WHERE pasarela_evento_id=$1', [
      e.id,
    ])
  ).rows[0];
}

describe('T055 · primera factura, ciclos, reentregas y desorden', () => {
  it.each(['mensual', 'trimestral', 'anual'])(
    'S01/S09: la factura inicial pagada (%s) confirma la aportación del alta y activa la suscripción sin navegador',
    async (periodicidad) => {
      const c = await alta({ periodicidad });
      const pagadaEn = ahora() - 120;
      const f = await pagarInicial(c, { pagadaEn });
      const filas = await cuotas(c);
      expect(filas).toHaveLength(1);
      expect(filas[0]).toMatchObject({
        id: c.aportacionId,
        referencia: c.referencia,
        modalidad: 'cuota_socio',
        estado: 'confirmada',
        pasarela_factura_id: f.id,
        pasarela_pago_id: f.payment_intent.id,
      });
      expect(filas[0].fecha_cobro.getTime()).toBe(pagadaEn * 1000);
      const s = await suscripcion(c);
      expect(s).toMatchObject({ estado: 'activa', periodicidad, pasarela_suscripcion_id: c.subId });
      expect(s.fecha_alta.getTime()).toBe(pagadaEn * 1000);
      expect(s.pasarela_proximo_cobro_en.getTime()).toBe(c.periodo * 1000);
      expect(s.proximo).toBe(fechaMadrid(c.periodo));
      expect(
        (await entorno.pool.query('SELECT estado FROM operaciones_pago WHERE id=$1', [c.op.id])).rows[0]
          .estado,
      ).toBe('cerrada');
      const [confirmacion] = await correos(c, 'confirmacion');
      expect(confirmacion.resumen).toMatchObject({
        referencia: c.referencia,
        importe: '10.00',
        modalidad: 'cuota_socio',
        destino: 'fondo general',
        periodicidad,
        fechaProximoCobro: fechaMadrid(c.periodo),
      });
      expect(enviar).toHaveBeenCalledTimes(1);
      expect(enviar.mock.calls[0][0].texto).toBe(textoCorreoConfirmacion(confirmacion.resumen));
      expect(await correos(c, 'fallo_cuota')).toHaveLength(0);
      expect(pasarela.obtenerPago).not.toHaveBeenCalled();
    },
  );

  it('Checkout completado antes o después de la factura solo correlaciona; reentregas y entregas simultáneas no duplican', async () => {
    const antes = await alta();
    const sesion = stripe.sesiones.get(antes.op.sesion_checkout_id);
    await procesar(evento('checkout.session.completed', { id: sesion.id }));
    expect((await suscripcion(antes)).pasarela_suscripcion_id).toBe(antes.subId);
    expect((await suscripcion(antes)).estado).toBe('pendiente');
    expect((await cuotas(antes))[0].estado).toBe('pendiente');
    expect(await correos(antes, 'confirmacion')).toHaveLength(0);
    const f = factura(antes, { motivo: 'subscription_create' });
    const e = eventoFactura('invoice.paid', f);
    await Promise.all([procesar(e), procesar(e), procesar(eventoFactura('invoice.paid', f))]);
    await procesar(e);
    expect(await cuotas(antes)).toHaveLength(1);
    expect((await cuotas(antes))[0].estado).toBe('confirmada');
    expect(await correos(antes, 'confirmacion')).toHaveLength(1);
    expect(enviar).toHaveBeenCalledTimes(1);

    const despues = await alta();
    await pagarInicial(despues);
    const confirmada = (await cuotas(despues))[0];
    await procesar(evento('checkout.session.completed', { id: despues.op.sesion_checkout_id }));
    expect(await cuotas(despues)).toEqual([confirmada]);
    expect((await suscripcion(despues)).estado).toBe('activa');
    expect(await correos(despues, 'confirmacion')).toHaveLength(1);
  });

  it('S02: una factura de ciclo pagada crea una sola cuota nueva y el total aumenta exactamente su importe', async () => {
    // Proyecto activo propio, independiente del estado en que otras pruebas dejen los fixtures.
    const proyecto = (
      await entorno.pool.query('INSERT INTO proyectos (nombre) VALUES ($1) RETURNING *', [
        'Proyecto cuotas ' + randomUUID(),
      ])
    ).rows[0];
    const c = await alta({ proyectoId: proyecto.id, importe: '12.34' });
    await pagarInicial(c, { pagadaEn: ahora() - 40 * DIA });
    const s0 = await suscripcion(c);
    expect(await sumaConfirmada(c)).toBe('12.34');
    const pagadaEn = ahora() - 300;
    const ciclo = factura(c, { pagadaEn });
    const e = eventoFactura('invoice.paid', ciclo);
    await Promise.all([procesar(e), procesar(eventoFactura('invoice.paid', ciclo)), procesar(e)]);
    const filas = await cuotas(c);
    expect(filas).toHaveLength(2);
    const nueva = filas[1];
    expect(nueva).toMatchObject({
      modalidad: 'cuota_socio',
      estado: 'confirmada',
      pasarela_factura_id: ciclo.id,
      pasarela_pago_id: ciclo.payment_intent.id,
      donante_id: filas[0].donante_id,
      proyecto_id: proyecto.id,
      importe: '12.34',
    });
    expect(nueva.referencia).not.toBe(c.referencia);
    expect(nueva.fecha_cobro.getTime()).toBe(pagadaEn * 1000);
    expect(await sumaConfirmada(c)).toBe('24.68');
    expect((await suscripcion(c)).fecha_alta).toEqual(s0.fecha_alta);
    const confirmaciones = await correos(c, 'confirmacion');
    expect(confirmaciones).toHaveLength(2);
    expect(confirmaciones[1].resumen).toMatchObject({
      referencia: nueva.referencia,
      destino: proyecto.nombre,
    });
    expect(
      (await entorno.pool.query('SELECT count(*) FROM operaciones_pago WHERE aportacion_id=$1', [nueva.id]))
        .rows[0].count,
    ).toBe('0');
  });

  it('un ciclo notificado antes del primer cobro local recupera y valida la factura inicial desde la Session del alta', async () => {
    const c = await alta();
    const inicioEn = ahora() - 35 * DIA;
    const inicial = factura(c, { motivo: 'subscription_create', pagadaEn: inicioEn, ultima: false });
    const ciclo = factura(c, { pagadaEn: ahora() - 600 });
    await procesar(eventoFactura('invoice.paid', ciclo));
    expect(pasarela.obtenerSesionPago).toHaveBeenCalledWith(c.op.sesion_checkout_id);
    const filas = await cuotas(c);
    expect(filas).toHaveLength(2);
    expect(filas[0]).toMatchObject({
      id: c.aportacionId,
      estado: 'confirmada',
      pasarela_factura_id: inicial.id,
    });
    expect(filas[0].fecha_cobro.getTime()).toBe(inicioEn * 1000);
    expect(filas[1]).toMatchObject({ estado: 'confirmada', pasarela_factura_id: ciclo.id });
    const s = await suscripcion(c);
    expect(s.estado).toBe('activa');
    expect(s.fecha_alta.getTime()).toBe(inicioEn * 1000);
    const envios = enviar.mock.calls.length;
    await procesar(eventoFactura('invoice.paid', inicial));
    expect(await cuotas(c)).toEqual(filas);
    expect(await correos(c, 'confirmacion')).toHaveLength(2);
    expect(enviar).toHaveBeenCalledTimes(envios);
  });

  it('sin Session conocida el listado por suscripción exige una única coincidencia; la ambigüedad no inventa el pago', async () => {
    const c = await alta();
    await entorno.pool.query(
      'UPDATE operaciones_pago SET sesion_checkout_id=NULL,url_checkout=NULL WHERE id=$1',
      [c.op.id],
    );
    const inicial = factura(c, { motivo: 'subscription_create', ultima: false });
    await procesar(eventoFactura('invoice.paid', factura(c)));
    expect(pasarela.obtenerSesionDeSuscripcion).toHaveBeenCalledWith(c.subId);
    expect((await cuotas(c)).map((a) => [a.pasarela_factura_id, a.estado])[0]).toEqual([
      inicial.id,
      'confirmada',
    ]);

    const d = await alta();
    await entorno.pool.query(
      'UPDATE operaciones_pago SET sesion_checkout_id=NULL,url_checkout=NULL WHERE id=$1',
      [d.op.id],
    );
    factura(d, { motivo: 'subscription_create', ultima: false });
    stripe.sesiones.set('cs_duplicada', {
      ...stripe.sesiones.get(d.op.sesion_checkout_id),
      id: 'cs_duplicada',
    });
    const e = eventoFactura('invoice.paid', factura(d));
    await procesar(e);
    expect(await estadoEvento(e)).toMatchObject({ estado: 'incidencia' });
    const filas = await cuotas(d);
    expect(filas).toHaveLength(1);
    expect(filas[0].estado).toBe('pendiente');
    expect((await suscripcion(d)).estado).toBe('pendiente');
  });

  it.each([
    ['importe distinto', { centimos: 1001 }],
    ['otra moneda', { moneda: 'usd' }],
    ['pagada fuera de pasarela', { fueraDePasarela: true }],
    ['pago de otra factura', { facturaDelPago: 'in_ajena' }],
    ['sin fecha de pago', { pagadaEn: null }],
  ])('una factura de ciclo con %s se registra como incidencia y no suma', async (_caso, cambios) => {
    const c = await alta();
    await pagarInicial(c);
    const e = eventoFactura('invoice.paid', factura(c, cambios));
    await procesar(e);
    expect(await estadoEvento(e)).toMatchObject({ estado: 'incidencia' });
    expect(await cuotas(c)).toHaveLength(1);
    expect(await sumaConfirmada(c)).toBe('10.00');
  });

  it('una factura de una suscripción ajena se ignora y otra razón de facturación queda como incidencia', async () => {
    const c = await alta();
    await pagarInicial(c);
    const ajena = { ...c, subId: 'sub_ajena_' + randomUUID() };
    stripe.suscripciones.set(ajena.subId, {
      ...stripe.suscripciones.get(c.subId),
      id: ajena.subId,
      metadata: { referencia: 'OTRA-' + randomUUID(), modulo: 'otro' },
    });
    const eAjena = eventoFactura('invoice.paid', factura(ajena));
    await procesar(eAjena);
    expect(await estadoEvento(eAjena)).toMatchObject({ estado: 'ignorado' });
    const e = eventoFactura('invoice.paid', factura(c, { motivo: 'subscription_update' }));
    await procesar(e);
    expect(await estadoEvento(e)).toMatchObject({ estado: 'incidencia' });
    expect(await cuotas(c)).toHaveLength(1);
  });

  it('fallo seguido de éxito de la misma factura de ciclo confirma la misma fila sin duplicar la suma', async () => {
    const c = await alta();
    await pagarInicial(c);
    const fallida = factura(c, { pagada: false, intento: ahora() + 3 * DIA });
    await procesar(eventoFactura('invoice.payment_failed', fallida));
    const rechazada = (await cuotas(c))[1];
    expect(rechazada).toMatchObject({ estado: 'rechazada', pasarela_factura_id: fallida.id });
    const pagadaEn = ahora() - 30;
    factura(c, { id: fallida.id, pagoId: fallida.payment_intent.id, pagadaEn });
    await procesar(eventoFactura('invoice.paid', fallida));
    const filas = await cuotas(c);
    expect(filas).toHaveLength(2);
    expect(filas[1]).toMatchObject({
      id: rechazada.id,
      referencia: rechazada.referencia,
      estado: 'confirmada',
    });
    expect(filas[1].fecha_cobro.getTime()).toBe(pagadaEn * 1000);
    expect(await sumaConfirmada(c)).toBe('20.00');
    expect(await correos(c, 'fallo_cuota')).toHaveLength(1);
    const confirmaciones = await correos(c, 'confirmacion');
    expect(confirmaciones.map((x) => x.aportacion_id)).toEqual([c.aportacionId, rechazada.id]);
  });

  it('S03: el primer cobro fallido deja el alta pendiente sin cuota confirmada; solo el cierre definitivo la cancela', async () => {
    const c = await alta();
    const f = factura(c, { motivo: 'subscription_create', pagada: false, intento: ahora() + DIA });
    await procesar(eventoFactura('invoice.payment_failed', f));
    let s = await suscripcion(c);
    expect(s).toMatchObject({ estado: 'pendiente', fecha_alta: null, pasarela_proximo_cobro_en: null });
    expect((await cuotas(c))[0].estado).not.toBe('confirmada');
    expect(await correos(c, 'fallo_cuota')).toHaveLength(0);
    expect(await correos(c, 'confirmacion')).toHaveLength(0);
    stripe.suscripciones.get(c.subId).status = 'past_due';
    await procesar(eventoSuscripcion('customer.subscription.updated', c));
    expect((await suscripcion(c)).estado).toBe('pendiente');
    stripe.suscripciones.get(c.subId).status = 'incomplete_expired';
    await procesar(eventoSuscripcion('customer.subscription.updated', c));
    s = await suscripcion(c);
    expect(s).toMatchObject({
      estado: 'cancelada',
      fecha_proximo_cobro: null,
      pasarela_proximo_cobro_en: null,
    });
    expect((await cuotas(c))[0].estado).toBe('cancelada');
    expect(await sumaConfirmada(c)).toBe('0');
  });
});

describe('CONV-002 · recuperación del aviso histórico', () => {
  it.each(['pago', 'cancelacion'])(
    'no presenta el fallo/previsión como actuales tras %s y reentrega',
    async (posterior) => {
      const c = await alta();
      await pagarInicial(c);
      const intento = ahora() + 2 * DIA;
      const f = factura(c, { pagada: false, intento });
      const e = eventoFactura('invoice.payment_failed', f);
      enviar.mockResolvedValueOnce(false);
      await procesar(e);
      const [aviso] = await correos(c, 'fallo_cuota');
      expect(aviso).toMatchObject({ estado: 'fallido', intentos: 1, enviado_en: null });
      if (posterior === 'pago') {
        factura(c, { id: f.id, pagoId: f.payment_intent.id, pagadaEn: ahora() - 30 });
        await procesar(eventoFactura('invoice.paid', f));
        expect((await cuotas(c))[1].estado).toBe('confirmada');
      } else {
        Object.assign(stripe.suscripciones.get(c.subId), { status: 'canceled', canceled_at: ahora() });
        await procesar(eventoSuscripcion('customer.subscription.deleted', c));
        expect((await suscripcion(c)).estado).toBe('cancelada');
      }
      const antes = {
        cuotas: await cuotas(c),
        suscripcion: await suscripcion(c),
        confirmaciones: await correos(c, 'confirmacion'),
      };
      const checkoutAntes = pasarela.crearSesionPago.mock.calls.length,
        smtpAntes = enviar.mock.calls.length;
      await procesar(e);
      expect(enviar).toHaveBeenCalledTimes(smtpAntes + 1);
      expect(pasarela.crearSesionPago).toHaveBeenCalledTimes(checkoutAntes);
      expect(await cuotas(c)).toEqual(antes.cuotas);
      expect(await suscripcion(c)).toEqual(antes.suscripcion);
      expect(await correos(c, 'confirmacion')).toEqual(antes.confirmaciones);
      const [recuperado] = await correos(c, 'fallo_cuota');
      expect(recuperado).toMatchObject({
        id: aviso.id,
        resumen: aviso.resumen,
        estado: 'enviado',
        intentos: 2,
      });
      const texto = enviar.mock.calls.at(-1)[0].texto;
      expect(texto).toContain((await cuotas(c))[1].referencia);
      expect(texto).toContain('En el intento al que se refiere este aviso');
      expect(texto).toContain('No determina el estado actual de la cuota ni anuncia un nuevo cobro.');
      expect(texto).toContain('Previsión comunicada en aquel momento: ');
      expect(texto).not.toContain('Esa cuota no se ha contabilizado como pagada.');
      expect(texto).not.toContain('Próximo intento de cobro:');
      await procesar(e);
      expect(enviar).toHaveBeenCalledTimes(smtpAntes + 1);
    },
  );
});

describe('T056 · fallo posterior, previsión y cancelación', () => {
  it('S10: una cuota posterior fallida queda rechazada, avisa una vez y no suma, cancela ni ordena cobros', async () => {
    const c = await alta();
    await pagarInicial(c);
    const previa = (await cuotas(c))[0];
    const creaciones = pasarela.crearSesionPago.mock.calls.length;
    const intento = ahora() + 2 * DIA;
    const f = factura(c, { pagada: false, intento });
    const e = eventoFactura('invoice.payment_failed', f);
    await Promise.all([procesar(e), procesar(eventoFactura('invoice.payment_failed', f))]);
    await procesar(e);
    const filas = await cuotas(c);
    expect(filas).toHaveLength(2);
    expect(filas[0]).toEqual(previa);
    expect(filas[1]).toMatchObject({ estado: 'rechazada', fecha_cobro: null, pasarela_factura_id: f.id });
    expect(filas[1].motivo).toBeTruthy();
    expect(await sumaConfirmada(c)).toBe('10.00');
    expect((await suscripcion(c)).estado).toBe('activa');
    const [aviso] = await correos(c, 'fallo_cuota');
    expect(await correos(c, 'fallo_cuota')).toHaveLength(1);
    expect(aviso.resumen).toMatchObject({
      referencia: filas[1].referencia,
      importe: '10.00',
      fechaProximoCobro: fechaMadrid(intento),
    });
    expect(aviso.resumen).not.toHaveProperty('nifNie');
    expect(enviar.mock.calls.map(([m]) => m.texto)).toContain(textoCorreoFalloCuota(aviso.resumen));
    expect(pasarela.crearSesionPago).toHaveBeenCalledTimes(creaciones);
    expect(pasarela.obtenerPago).not.toHaveBeenCalled();
  });

  it('S11: tras el fallo solo se muestra el next_payment_attempt futuro y invoice.updated lo actualiza', async () => {
    const c = await alta();
    await pagarInicial(c);
    const primero = ahora() + 2 * DIA;
    const f = factura(c, { pagada: false, intento: primero });
    await procesar(eventoFactura('invoice.payment_failed', f));
    expect((await suscripcion(c)).proximo).toBe(fechaMadrid(primero));
    expect((await servicio.resultado(c.req, c.referencia)).suscripcion).toEqual({
      estado: 'activa',
      periodicidad: 'mensual',
      fechaProximoCobro: fechaMadrid(primero),
    });
    const segundo = ahora() + 5 * DIA;
    stripe.facturas.get(f.id).next_payment_attempt = segundo;
    await procesar(eventoFactura('invoice.updated', f));
    const s = await suscripcion(c);
    expect(s.pasarela_proximo_cobro_en.getTime()).toBe(segundo * 1000);
    expect(s.proximo).toBe(fechaMadrid(segundo));
    expect(s.proximo).not.toBe(fechaMadrid(c.periodo));
    expect(await cuotas(c)).toHaveLength(2);
  });

  it('S12: una previsión nula o pasada se devuelve null, también al vencer sin otro webhook', async () => {
    const c = await alta();
    await pagarInicial(c);
    const f = factura(c, { pagada: false, intento: null });
    await procesar(eventoFactura('invoice.payment_failed', f));
    expect(await suscripcion(c)).toMatchObject({ proximo: null, pasarela_proximo_cobro_en: null });
    expect((await correos(c, 'fallo_cuota'))[0].resumen.fechaProximoCobro).toBeNull();
    stripe.facturas.get(f.id).next_payment_attempt = ahora() - 60;
    await procesar(eventoFactura('invoice.updated', f));
    expect(await suscripcion(c)).toMatchObject({ proximo: null, pasarela_proximo_cobro_en: null });
    expect((await servicio.resultado(c.req, c.referencia)).suscripcion.fechaProximoCobro).toBeNull();
    stripe.facturas.get(f.id).next_payment_attempt = ahora() + 3600;
    await procesar(eventoFactura('invoice.updated', f));
    expect((await servicio.resultado(c.req, c.referencia)).suscripcion.fechaProximoCobro).not.toBeNull();
    // Vence dentro del mismo día sin otra notificación.
    await entorno.pool.query(
      "UPDATE suscripciones_socio SET pasarela_proximo_cobro_en=clock_timestamp()-interval '1 second' WHERE id=$1",
      [c.suscripcionId],
    );
    expect((await servicio.resultado(c.req, c.referencia)).suscripcion.fechaProximoCobro).toBeNull();
  });

  it.each([
    ['cancelación al final del periodo', { cancel_at_period_end: true }],
    ['cancelación programada anterior', { cancel_at: 'antes' }],
    ['cobro no automático', { collection_method: 'send_invoice' }],
    ['periodo ya vencido', { current_period_end: 'pasado' }],
  ])('sin fallo pendiente, %s impide anunciar current_period_end', async (_caso, cambios) => {
    const c = await alta();
    await pagarInicial(c);
    expect((await suscripcion(c)).proximo).toBe(fechaMadrid(c.periodo));
    const s = stripe.suscripciones.get(c.subId);
    Object.assign(s, cambios);
    if (cambios.cancel_at === 'antes') s.cancel_at = c.periodo - DIA;
    if (cambios.current_period_end === 'pasado') s.current_period_end = ahora() - 60;
    await procesar(eventoSuscripcion('customer.subscription.updated', c));
    expect(await suscripcion(c)).toMatchObject({
      estado: 'activa',
      proximo: null,
      pasarela_proximo_cobro_en: null,
    });
  });

  it('una factura antigua no reemplaza la previsión vigente ni registra un rechazo si ya está pagada', async () => {
    const c = await alta();
    await pagarInicial(c);
    const antigua = factura(c, { pagada: false, intento: ahora() + DIA, ultima: false });
    const pagada = factura(c);
    await procesar(eventoFactura('invoice.paid', pagada));
    await procesar(eventoFactura('invoice.payment_failed', antigua));
    expect((await suscripcion(c)).proximo).toBe(fechaMadrid(c.periodo));
    const avisos = (await correos(c, 'fallo_cuota')).length;
    const tardio = eventoFactura('invoice.payment_failed', pagada);
    await procesar(tardio);
    const fila = (await cuotas(c)).find((a) => a.pasarela_factura_id === pagada.id);
    expect(fila.estado).toBe('confirmada');
    expect(await correos(c, 'fallo_cuota')).toHaveLength(avisos);
    expect(await estadoEvento(tardio)).toMatchObject({ estado: 'procesado' });
  });

  it.each(['past_due', 'unpaid'])('%s no cancela por sí solo una suscripción activa', async (estado) => {
    const c = await alta();
    await pagarInicial(c);
    factura(c, { pagada: false, intento: ahora() + DIA });
    stripe.suscripciones.get(c.subId).status = estado;
    await procesar(eventoSuscripcion('customer.subscription.updated', c));
    expect((await suscripcion(c)).estado).toBe('activa');
  });

  it('S13: la cancelación tras un fallo conserva las cuotas y un evento antiguo no reactiva ni anuncia otro cobro', async () => {
    const c = await alta();
    await pagarInicial(c);
    await procesar(eventoFactura('invoice.paid', factura(c)));
    const fallida = factura(c, { pagada: false, intento: ahora() + 2 * DIA });
    await procesar(eventoFactura('invoice.payment_failed', fallida));
    const confirmadas = (await cuotas(c)).filter((a) => a.estado === 'confirmada');
    expect(confirmadas).toHaveLength(2);
    const creaciones = pasarela.crearSesionPago.mock.calls.length;
    Object.assign(stripe.suscripciones.get(c.subId), { status: 'canceled', canceled_at: ahora() });
    await procesar(eventoSuscripcion('customer.subscription.deleted', c));
    expect(await suscripcion(c)).toMatchObject({
      estado: 'cancelada',
      proximo: null,
      pasarela_proximo_cobro_en: null,
    });
    expect((await cuotas(c)).filter((a) => a.estado === 'confirmada')).toEqual(confirmadas);
    expect((await servicio.resultado(c.req, c.referencia)).suscripcion).toMatchObject({
      estado: 'cancelada',
      fechaProximoCobro: null,
    });
    const avisos = (await correos(c, 'fallo_cuota')).length;
    await procesar(eventoFactura('invoice.updated', fallida));
    await procesar(eventoSuscripcion('customer.subscription.updated', c));
    const otraFallida = factura(c, { pagada: false, intento: ahora() + 4 * DIA });
    await procesar(eventoFactura('invoice.payment_failed', otraFallida));
    expect(await suscripcion(c)).toMatchObject({ estado: 'cancelada', proximo: null });
    expect(await correos(c, 'fallo_cuota')).toHaveLength(avisos);
    // Un cobro tardío realmente acreditado se registra sin reactivar la suscripción.
    factura(c, { id: fallida.id, pagoId: fallida.payment_intent.id });
    await procesar(eventoFactura('invoice.paid', fallida));
    expect((await cuotas(c)).find((a) => a.pasarela_factura_id === fallida.id).estado).toBe('confirmada');
    expect(await suscripcion(c)).toMatchObject({ estado: 'cancelada', proximo: null });
    expect(pasarela.crearSesionPago).toHaveBeenCalledTimes(creaciones);
  });
});
