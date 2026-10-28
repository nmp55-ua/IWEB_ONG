// Lee la configuración de .env y falla al arrancar si falta algo obligatorio.
const obligatorias = ['DATABASE_URL', 'SESSION_SECRET'];

const faltan = obligatorias.filter((nombre) => !process.env[nombre]);
if (faltan.length > 0 && process.env.NODE_ENV !== 'test') {
  throw new Error(`Faltan variables en .env: ${faltan.join(', ')}. Copia .env.example a .env.`);
}

export const config = {
  entorno: process.env.NODE_ENV ?? 'development',
  puerto: Number(process.env.PORT ?? 3000),
  urlBaseDatos: process.env.DATABASE_URL,
  secretoSesion: process.env.SESSION_SECRET ?? 'solo-para-pruebas',
  urlFrontend: process.env.FRONTEND_URL ?? 'http://localhost:4321',
  ong: {
    nombre: process.env.ONG_NOMBRE ?? 'ONG',
    cif: process.env.ONG_CIF ?? '',
    direccion: process.env.ONG_DIRECCION ?? '',
  },
  smtp: {
    host: process.env.SMTP_HOST ?? 'localhost',
    puerto: Number(process.env.SMTP_PORT ?? 1025),
    remitente: process.env.SMTP_FROM ?? 'ONG <no-responder@ong.test>',
  },
  stripe: {
    claveSecreta: process.env.STRIPE_SECRET_KEY ?? '',
    secretoWebhook: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  },
  ahoraSimulado: process.env.AHORA_SIMULADO ?? '',
};
