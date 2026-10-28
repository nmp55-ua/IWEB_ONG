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
  cliente ??= new Stripe(config.stripe.claveSecreta);
  return cliente;
}

const RECURRENCIAS = {
  mensual: { interval: 'month', interval_count: 1 },
  trimestral: { interval: 'month', interval_count: 3 },
  anual: { interval: 'year', interval_count: 1 },
};

// Crea una sesión de Checkout y devuelve { id, url }.
// periodicidad: undefined (puntual) | 'mensual' | 'trimestral' | 'anual'
export async function crearSesionPago({ centimos, descripcion, correo, referencia, periodicidad, metadatos = {} }) {
  const recurrente = RECURRENCIAS[periodicidad];
  const urlResultado = `${config.urlFrontend}/donar/resultado?ref=${encodeURIComponent(referencia)}`;

  const sesion = await stripe().checkout.sessions.create({
    mode: recurrente ? 'subscription' : 'payment',
    customer_email: correo,
    client_reference_id: referencia,
    metadata: { referencia, ...metadatos },
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'eur',
        unit_amount: centimos,
        product_data: { name: descripcion },
        ...(recurrente && { recurring: recurrente }),
      },
    }],
    success_url: urlResultado,
    cancel_url: `${urlResultado}&cancelado=1`,
  });
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
