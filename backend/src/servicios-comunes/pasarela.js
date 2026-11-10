// Única envoltura de Stripe (plan-comun.md §5). Ningún otro fichero importa 'stripe'.
// La ONG nunca recibe ni guarda datos de tarjeta: el pago ocurre en Stripe Checkout.
import Stripe from 'stripe';
import { config } from '../config.js';
import { ErrorApi } from '../middleware/errores.js';

let cliente = null;

function stripe() {
  if (!config.stripe.claveSecreta) {
    throw new ErrorApi(503, 'PASARELA_NO_CONFIGURADA', 'El pago no está disponible en este momento.');
  }
  cliente ??= new Stripe(config.stripe.claveSecreta, {
    apiVersion: '2025-02-24.acacia',
    timeout: 3000,
    maxNetworkRetries: 0,
  });
  return cliente;
}

const RECURRENCIAS = {
  mensual: { interval: 'month', interval_count: 1 },
  trimestral: { interval: 'month', interval_count: 3 },
  anual: { interval: 'year', interval_count: 1 },
};

// Crea una sesión de Checkout y devuelve { id, url }.
// periodicidad: undefined (puntual) | 'mensual' | 'trimestral' | 'anual'
export function prepararSesionPago({
  centimos,
  descripcion,
  correo,
  referencia,
  periodicidad,
  metadatos = {},
}) {
  const recurrente = RECURRENCIAS[periodicidad];
  const urlResultado = `${config.urlFrontend}/donar/resultado?ref=${encodeURIComponent(referencia)}`;
  const metadata = { ...metadatos, referencia, modulo: 'donaciones' };
  // Los metadatos de correlación no deben contener información fiscal.
  for (const campo of Object.keys(metadata)) {
    if (
      ['nif', 'nie', 'nifnie', 'direccion', 'nombre', 'apellidos', 'correo'].includes(
        campo.toLowerCase().replace(/_/g, ''),
      )
    ) {
      throw new ErrorApi(400, 'DATOS_INVALIDOS', 'Los metadatos no pueden contener datos personales.');
    }
  }
  if (periodicidad !== undefined && !recurrente) {
    throw new ErrorApi(400, 'DATOS_INVALIDOS', 'La periodicidad no es válida.');
  }
  return {
    mode: recurrente ? 'subscription' : 'payment',
    payment_method_types: ['card'],
    customer_email: correo,
    client_reference_id: referencia,
    metadata,
    ...(recurrente
      ? { subscription_data: { metadata: { ...metadata } } }
      : { payment_intent_data: { metadata: { ...metadata } } }),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: centimos,
          product_data: { name: descripcion },
          ...(recurrente && { recurring: { ...recurrente } }),
        },
      },
    ],
    success_url: urlResultado,
    cancel_url: `${urlResultado}&cancelado=1`,
  };
}

async function llamadaExterna(accion) {
  try {
    return await accion(stripe());
  } catch (error) {
    if (error instanceof ErrorApi) throw error;
    throw new ErrorApi(503, 'PAGO_NO_DISPONIBLE', 'El pago no está disponible en este momento.');
  }
}

export async function crearSesionPago(argumentos) {
  const cuerpo = argumentos.solicitudCheckout ?? prepararSesionPago(argumentos);
  const opciones =
    argumentos.claveIdempotencia === undefined ? {} : { idempotencyKey: argumentos.claveIdempotencia };
  const sesion = await llamadaExterna((sdk) => sdk.checkout.sessions.create(cuerpo, opciones));
  return { id: sesion.id, url: sesion.url };
}

// Verifica la firma de un webhook y devuelve el evento. cuerpoCrudo debe ser el Buffer original.
export function verificarEvento(cuerpoCrudo, firma) {
  try {
    return stripe().webhooks.constructEvent(cuerpoCrudo, firma, config.stripe.secretoWebhook);
  } catch {
    throw new ErrorApi(400, 'FIRMA_INVALIDA', 'Notificación de pago no válida.');
  }
}

const camposSesion = [
  'id',
  'status',
  'payment_status',
  'mode',
  'client_reference_id',
  'url',
  'expires_at',
  'livemode',
];
const camposPago = ['id', 'amount', 'amount_received', 'currency', 'status', 'livemode'];
const camposFactura = [
  'id',
  'billing_reason',
  'paid',
  'status',
  'paid_out_of_band',
  'amount_paid',
  'currency',
  'next_payment_attempt',
  'livemode',
];
const camposSuscripcion = [
  'id',
  'status',
  'collection_method',
  'current_period_end',
  'cancel_at_period_end',
  'cancel_at',
  'canceled_at',
  'livemode',
];

function seleccionar(objeto, campos) {
  return Object.fromEntries(campos.map((campo) => [campo, objeto[campo] ?? null]));
}

function idExterno(valor) {
  return typeof valor === 'string' ? valor : (valor?.id ?? null);
}

function metadatosCorrelacion(valor) {
  const resultado = {};
  for (const campo of ['referencia', 'modulo']) {
    if (valor?.[campo] !== undefined) resultado[campo] = valor[campo];
  }
  return resultado;
}

function proyectarPago(pago) {
  return pago == null
    ? null
    : {
        ...seleccionar(pago, camposPago),
        invoice: idExterno(pago.invoice),
        metadata: metadatosCorrelacion(pago.metadata),
      };
}

function proyectarSesion(sesion) {
  return sesion == null
    ? null
    : {
        ...seleccionar(sesion, camposSesion),
        metadata: metadatosCorrelacion(sesion.metadata),
        payment_intent: idExterno(sesion.payment_intent),
        subscription: idExterno(sesion.subscription),
        invoice: idExterno(sesion.invoice),
      };
}

export async function obtenerSesionPago(id) {
  return llamadaExterna(async (sdk) => proyectarSesion(await sdk.checkout.sessions.retrieve(id)));
}

export async function obtenerSesionDeSuscripcion(id) {
  return llamadaExterna(async (sdk) => {
    const pagina = await sdk.checkout.sessions.list({ subscription: id, limit: 2 });
    return { data: pagina.data.map(proyectarSesion), has_more: pagina.has_more };
  });
}

export async function obtenerPago(id) {
  return llamadaExterna(async (sdk) => proyectarPago(await sdk.paymentIntents.retrieve(id)));
}

export async function obtenerFactura(id) {
  return llamadaExterna(async (sdk) => {
    const factura = await sdk.invoices.retrieve(id, { expand: ['payment_intent'] });
    if (factura == null) return null;
    const pago =
      typeof factura.payment_intent === 'string'
        ? await sdk.paymentIntents.retrieve(factura.payment_intent)
        : factura.payment_intent;
    return {
      ...seleccionar(factura, camposFactura),
      subscription: idExterno(factura.subscription),
      payment_intent: proyectarPago(pago),
      status_transitions: { paid_at: factura.status_transitions?.paid_at ?? null },
    };
  });
}

export async function obtenerSuscripcion(id) {
  return llamadaExterna(async (sdk) => {
    const suscripcion = await sdk.subscriptions.retrieve(id);
    return suscripcion == null
      ? null
      : {
          ...seleccionar(suscripcion, camposSuscripcion),
          metadata: metadatosCorrelacion(suscripcion.metadata),
          latest_invoice: idExterno(suscripcion.latest_invoice),
        };
  });
}
