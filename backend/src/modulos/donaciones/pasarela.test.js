import { beforeEach, describe, expect, it, vi } from 'vitest';

const simulado = vi.hoisted(() => ({ clientes: [], constructores: [], red: {} }));
vi.mock('stripe', async (importOriginal) => {
  const { default: StripeReal } = await importOriginal();
  return {
    default: function StripeSimulado(clave, opciones) {
      const cliente = new StripeReal(clave, opciones);
      simulado.constructores.push({ clave, opciones });
      cliente.checkout.sessions.create = simulado.red.crear;
      cliente.checkout.sessions.retrieve = simulado.red.sesion;
      cliente.checkout.sessions.list = simulado.red.listar;
      cliente.paymentIntents.retrieve = simulado.red.pago;
      cliente.invoices.retrieve = simulado.red.factura;
      cliente.subscriptions.retrieve = simulado.red.suscripcion;
      simulado.clientes.push(cliente);
      return cliente;
    },
  };
});
vi.mock('../../config.js', () => ({
  config: {
    urlFrontend: 'https://ong.example.test',
    stripe: { claveSecreta: 'sk_test_sintetica', secretoWebhook: 'whsec_sintetico' },
  },
}));

let api;
let config;
const entrada = {
  centimos: 2000,
  descripcion: 'Donación',
  correo: 'donante@example.test',
  referencia: 'DON /1',
};
const meta = { referencia: entrada.referencia, modulo: 'donaciones' };
const campos = {
  sesion: [
    'id',
    'status',
    'payment_status',
    'mode',
    'client_reference_id',
    'metadata',
    'payment_intent',
    'subscription',
    'invoice',
    'url',
    'expires_at',
    'livemode',
  ],
  pago: ['id', 'amount', 'amount_received', 'currency', 'status', 'invoice', 'metadata', 'livemode'],
  factura: [
    'id',
    'subscription',
    'payment_intent',
    'billing_reason',
    'paid',
    'status',
    'paid_out_of_band',
    'amount_paid',
    'currency',
    'status_transitions',
    'next_payment_attempt',
    'livemode',
  ],
  suscripcion: [
    'id',
    'metadata',
    'status',
    'latest_invoice',
    'collection_method',
    'current_period_end',
    'cancel_at_period_end',
    'cancel_at',
    'canceled_at',
    'livemode',
  ],
};
beforeEach(async () => {
  vi.resetModules();
  simulado.clientes.length = 0;
  simulado.constructores.length = 0;
  simulado.red = {
    crear: vi
      .fn()
      .mockResolvedValue({ id: 'cs_test', url: 'https://checkout.example.test', customer_details: {} }),
    sesion: vi.fn(),
    listar: vi.fn(),
    pago: vi.fn(),
    factura: vi.fn(),
    suscripcion: vi.fn(),
  };
  ({ config } = await import('../../config.js'));
  config.urlFrontend = 'https://ong.example.test';
  config.stripe.claveSecreta = 'sk_test_sintetica';
  config.stripe.secretoWebhook = 'whsec_sintetico';
  api = await import('../../servicios-comunes/pasarela.js');
});

describe('HU-01 · constructor y creación Checkout', () => {
  it('construye sin cliente ni red y protege referencia/módulo', () => {
    const cuerpo = api.prepararSesionPago({
      ...entrada,
      metadatos: { origen: 'web', referencia: 'ajena', modulo: 'ajeno' },
    });
    expect(simulado.constructores).toEqual([]);
    expect(cuerpo).toEqual({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: entrada.correo,
      client_reference_id: entrada.referencia,
      metadata: { ...meta, origen: 'web' },
      payment_intent_data: { metadata: { ...meta, origen: 'web' } },
      line_items: [
        {
          quantity: 1,
          price_data: { currency: 'eur', unit_amount: 2000, product_data: { name: 'Donación' } },
        },
      ],
      success_url: 'https://ong.example.test/donar/resultado?ref=DON%20%2F1',
      cancel_url: 'https://ong.example.test/donar/resultado?ref=DON%20%2F1&cancelado=1',
    });
  });
  it.each([
    ['mensual', 'month', 1],
    ['trimestral', 'month', 3],
    ['anual', 'year', 1],
  ])('prepara recurrencia %s', (periodicidad, interval, interval_count) => {
    const cuerpo = api.prepararSesionPago({ ...entrada, periodicidad });
    expect(cuerpo.mode).toBe('subscription');
    expect(cuerpo.subscription_data).toEqual({ metadata: meta });
    expect(cuerpo).not.toHaveProperty('payment_intent_data');
    expect(cuerpo.line_items[0].price_data.recurring).toEqual({ interval, interval_count });
  });
  it('mantiene llamada anterior y salida mínima, con configuración explícita del SDK', async () => {
    expect(await api.crearSesionPago(entrada)).toEqual({
      id: 'cs_test',
      url: 'https://checkout.example.test',
    });
    expect(simulado.red.crear.mock.calls[0][0]).toEqual(api.prepararSesionPago(entrada));
    expect(simulado.constructores[0]).toEqual({
      clave: 'sk_test_sintetica',
      opciones: { apiVersion: '2025-02-24.acacia', timeout: 3000, maxNetworkRetries: 0 },
    });
  });
  it('envía la instantánea intacta y la misma clave aunque cambien configuración y argumentos', async () => {
    const solicitudCheckout = api.prepararSesionPago(entrada);
    const copia = structuredClone(solicitudCheckout);
    Object.freeze(solicitudCheckout);
    config.urlFrontend = 'https://otra.example.test';
    const datos = {
      ...entrada,
      descripcion: 'Otra descripción',
      solicitudCheckout,
      claveIdempotencia: 'hu01:uuid-sintetico',
    };
    await api.crearSesionPago(datos);
    await api.crearSesionPago(datos);
    for (const llamada of simulado.red.crear.mock.calls) {
      expect(llamada).toEqual([copia, { idempotencyKey: datos.claveIdempotencia }]);
      expect(llamada[0]).toBe(solicitudCheckout);
    }
    expect(solicitudCheckout).toEqual(copia);
  });
  it('no comparte objetos mutables entre cuerpos preparados', () => {
    const uno = api.prepararSesionPago(entrada);
    uno.metadata.referencia = 'modificada';
    uno.line_items[0].price_data.currency = 'usd';
    expect(api.prepararSesionPago(entrada).metadata).toEqual(meta);
    expect(api.prepararSesionPago(entrada).line_items[0].price_data.currency).toBe('eur');
  });
});

it('aísla la recurrencia entre cuerpos de sesiones periódicas', () => {
  const datos = { ...entrada, periodicidad: 'mensual' };
  const primera = api.prepararSesionPago(datos);
  primera.line_items[0].price_data.recurring.interval_count = 99;
  expect(api.prepararSesionPago(datos).line_items[0].price_data.recurring).toEqual({
    interval: 'month',
    interval_count: 1,
  });
});

describe('HU-01 · firma real con secreto y cuerpo sintéticos, sin red', () => {
  it.each(['2025-02-24.acacia', '2026-10-28.endive'])(
    'verifica la firma %s y conserva el evento íntegro',
    async (api_version) => {
      const { default: StripeReal } = await vi.importActual('stripe');
      const cuerpo = JSON.stringify({
        id: 'evt_test',
        object: 'event',
        api_version,
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_test' } },
      });
      const firma = StripeReal.webhooks.generateTestHeaderString({
        payload: cuerpo,
        secret: 'whsec_sintetico',
      });
      expect(api.verificarEvento(Buffer.from(cuerpo), firma)).toEqual(JSON.parse(cuerpo));
      expect(simulado.red.crear).not.toHaveBeenCalled();
    },
  );
  it.each(['firma-invalida', 'cuerpo-alterado'])('rechaza %s', async (caso) => {
    const { default: StripeReal } = await vi.importActual('stripe');
    const cuerpo = '{"id":"evt_test"}';
    const firma = StripeReal.webhooks.generateTestHeaderString({
      payload: cuerpo,
      secret: 'whsec_sintetico',
    });
    expect(() =>
      api.verificarEvento(
        Buffer.from(caso === 'cuerpo-alterado' ? cuerpo + ' ' : cuerpo),
        caso === 'firma-invalida' ? 'invalida' : firma,
      ),
    ).toThrow(expect.objectContaining({ estado: 400, codigo: 'FIRMA_INVALIDA' }));
  });
});

describe('HU-01 · consultas y proyecciones Acacia', () => {
  it.each([
    ['obtenerSesionPago', 'sesion'],
    ['obtenerPago', 'pago'],
    ['obtenerFactura', 'factura'],
    ['obtenerSuscripcion', 'suscripcion'],
  ])('%s conserva solo los campos pactados y nulls', async (funcion, recurso) => {
    const original = Object.fromEntries(campos[recurso].map((campo) => [campo, null]));
    original.id = 'recurso_test';
    original.livemode = false;
    if (campos[recurso].includes('metadata'))
      original.metadata = { referencia: 'DON-1', modulo: 'donaciones' };
    if (recurso === 'factura') original.status_transitions = { paid_at: null, finalized_at: 123 };
    simulado.red[recurso].mockResolvedValue({
      ...original,
      payment_method: { card: { last4: '4242' } },
      customer_email: 'privado@example.test',
    });
    const resultado = await api[funcion]('recurso_test');
    expect(Object.keys(resultado).sort()).toEqual([...campos[recurso]].sort());
    expect(resultado).toEqual({
      ...original,
      ...(recurso === 'factura' && { status_transitions: { paid_at: null } }),
    });
    expect(simulado.red[recurso]).toHaveBeenCalledTimes(1);
    expect(simulado.red[recurso].mock.calls[0]).toEqual(
      recurso === 'factura' ? ['recurso_test', { expand: ['payment_intent'] }] : ['recurso_test'],
    );
  });
  it('proyecta el PaymentIntent expandido de factura, sin detalles de tarjeta', async () => {
    simulado.red.factura.mockResolvedValue({
      id: 'in_test',
      subscription: { id: 'sub_test' },
      paid: true,
      paid_out_of_band: false,
      amount_paid: 2000,
      currency: 'eur',
      billing_reason: 'subscription_create',
      status: 'paid',
      next_payment_attempt: null,
      livemode: false,
      status_transitions: { paid_at: 123, finalized_at: 100 },
      payment_intent: {
        id: 'pi_test',
        amount: 2000,
        amount_received: 2000,
        currency: 'eur',
        status: 'succeeded',
        invoice: { id: 'in_test' },
        metadata: meta,
        livemode: false,
        payment_method: { card: {} },
      },
    });
    const factura = await api.obtenerFactura('in_test');
    expect(factura.subscription).toBe('sub_test');
    expect(factura.status_transitions).toEqual({ paid_at: 123 });
    expect(factura.payment_intent).toEqual({
      id: 'pi_test',
      amount: 2000,
      amount_received: 2000,
      currency: 'eur',
      status: 'succeeded',
      invoice: 'in_test',
      metadata: meta,
      livemode: false,
    });
  });
  it('normaliza referencias expandidas de Session y Subscription a identificadores', async () => {
    simulado.red.sesion.mockResolvedValue({
      id: 'cs_test',
      invoice: { id: 'in_test' },
      payment_intent: { id: 'pi_test' },
      subscription: { id: 'sub_test' },
    });
    expect(await api.obtenerSesionPago('cs_test')).toMatchObject({
      invoice: 'in_test',
      payment_intent: 'pi_test',
      subscription: 'sub_test',
    });
    simulado.red.suscripcion.mockResolvedValue({
      id: 'sub_test',
      latest_invoice: { id: 'in_test' },
      current_period_end: 123,
      cancel_at_period_end: false,
    });
    expect(await api.obtenerSuscripcion('sub_test')).toMatchObject({
      latest_invoice: 'in_test',
      current_period_end: 123,
      cancel_at_period_end: false,
    });
  });
  it('lista una sola página con límite 2 sin paginar ni exigir unicidad en el adaptador', async () => {
    simulado.red.listar.mockResolvedValue({ data: [{ id: 'cs_1' }, { id: 'cs_2' }], has_more: true });
    const resultado = await api.obtenerSesionDeSuscripcion('sub_test');
    expect(resultado.data.map((s) => s.id)).toEqual(['cs_1', 'cs_2']);
    expect(resultado.has_more).toBe(true);
    expect(simulado.red.listar.mock.calls).toEqual([[{ subscription: 'sub_test', limit: 2 }]]);
  });
  it('admite listado vacío', async () => {
    simulado.red.listar.mockResolvedValue({ data: [], has_more: false });
    expect(await api.obtenerSesionDeSuscripcion('sub_test')).toEqual({ data: [], has_more: false });
  });
  it.each([
    ['obtenerSesionPago', 'sesion'],
    ['obtenerPago', 'pago'],
    ['obtenerFactura', 'factura'],
    ['obtenerSuscripcion', 'suscripcion'],
    ['obtenerSesionDeSuscripcion', 'listar'],
    ['crearSesionPago', 'crear'],
  ])('convierte el fallo de %s a ErrorApi 503 sin exponer la respuesta', async (funcion, recurso) => {
    simulado.red[recurso].mockRejectedValue(new Error('detalle privado sintético'));
    await expect(api[funcion](funcion === 'crearSesionPago' ? entrada : 'id_test')).rejects.toMatchObject({
      estado: 503,
    });
    await expect(
      api[funcion](funcion === 'crearSesionPago' ? entrada : 'id_test'),
    ).rejects.not.toHaveProperty('message', 'detalle privado sintético');
  });
  it.each([
    [
      'obtenerSesionPago',
      'sesion',
      {
        id: 'cs_1',
        status: 'complete',
        payment_status: 'paid',
        mode: 'payment',
        client_reference_id: 'DON-1',
        metadata: meta,
        payment_intent: 'pi_1',
        subscription: null,
        invoice: null,
        url: null,
        expires_at: 1700000000,
        livemode: false,
      },
    ],
    [
      'obtenerPago',
      'pago',
      {
        id: 'pi_1',
        amount: 2000,
        amount_received: 2000,
        currency: 'eur',
        status: 'succeeded',
        invoice: 'in_1',
        metadata: meta,
        livemode: false,
      },
    ],
    [
      'obtenerFactura',
      'factura',
      {
        id: 'in_1',
        subscription: 'sub_1',
        payment_intent: null,
        billing_reason: 'subscription_cycle',
        paid: true,
        status: 'paid',
        paid_out_of_band: false,
        amount_paid: 2000,
        currency: 'eur',
        status_transitions: { paid_at: 1700000000 },
        next_payment_attempt: 1700003600,
        livemode: false,
      },
    ],
    [
      'obtenerSuscripcion',
      'suscripcion',
      {
        id: 'sub_1',
        metadata: meta,
        status: 'active',
        latest_invoice: 'in_1',
        collection_method: 'charge_automatically',
        current_period_end: 1700003600,
        cancel_at_period_end: false,
        cancel_at: null,
        canceled_at: null,
        livemode: false,
      },
    ],
  ])(
    '%s conserva valores de negocio sin confirmar dinero en el adaptador',
    async (funcion, recurso, esperado) => {
      simulado.red[recurso].mockResolvedValue({ ...esperado, detalles_tarjeta: { numero: 'sintetico' } });
      expect(await api[funcion](esperado.id)).toEqual(esperado);
    },
  );
  it.each([
    ['obtenerSesionPago', 'sesion'],
    ['obtenerPago', 'pago'],
    ['obtenerFactura', 'factura'],
    ['obtenerSuscripcion', 'suscripcion'],
  ])('%s conserva un recurso null sin inventar datos', async (funcion, recurso) => {
    simulado.red[recurso].mockResolvedValue(null);
    expect(await api[funcion]('id_test')).toBeNull();
  });
  it('recupera una sola vez el PaymentIntent si llega como identificador pese a expand', async () => {
    simulado.red.factura.mockResolvedValue({ id: 'in_1', payment_intent: 'pi_1' });
    simulado.red.pago.mockResolvedValue({ id: 'pi_1', amount_received: 2000 });
    expect((await api.obtenerFactura('in_1')).payment_intent).toMatchObject({
      id: 'pi_1',
      amount_received: 2000,
    });
    expect(simulado.red.pago.mock.calls).toEqual([['pi_1']]);
  });
  it('excluye datos personales conocidos de metadatos y de las proyecciones', async () => {
    expect(() => api.prepararSesionPago({ ...entrada, metadatos: { nifNie: 'dato-sintetico' } })).toThrow(
      expect.objectContaining({ estado: 400 }),
    );
    simulado.red.pago.mockResolvedValue({
      id: 'pi_1',
      metadata: { ...meta, nifNie: 'dato-sintetico', direccion: 'dato-sintetico' },
    });
    expect((await api.obtenerPago('pi_1')).metadata).toEqual(meta);
  });
  it('falla sin clave configurada antes de realizar red', async () => {
    config.stripe.claveSecreta = '';
    await expect(api.obtenerPago('pi_test')).rejects.toMatchObject({
      estado: 503,
      codigo: 'PASARELA_NO_CONFIGURADA',
    });
    expect(simulado.red.pago).not.toHaveBeenCalled();
  });
});
