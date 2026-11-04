import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { config } from './config.js';
import { pool } from './db/pool.js';
import { cargarUsuario } from './middleware/autenticacion.js';
import { manejadorErrores, rutaNoEncontrada } from './middleware/errores.js';
import { rutasAuth } from './modulos/auth/rutas.js';
import { rutasProyectos } from './modulos/proyectos/rutas.js';
import { rutasVoluntariado } from './modulos/voluntariado/rutas.js';
import { rutasActividades } from './modulos/actividades/rutas.js';

// Cada módulo registra aquí su router cuando lo tenga (ver modulos/LEEME.md).

export function crearApp({ almacenSesiones } = {}) {
  const app = express();
  app.disable('x-powered-by');
  if (config.entorno === 'production') app.set('trust proxy', 1);

  // El webhook de la pasarela necesita el cuerpo sin procesar para verificar la firma.
  app.use('/api/pasarela/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json());

  const AlmacenPg = connectPgSimple(session);
  app.use(session({
    name: 'ong.sid',
    secret: config.secretoSesion,
    store: almacenSesiones ?? new AlmacenPg({ pool, tableName: 'sesiones' }),
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.entorno === 'production',
      maxAge: 8 * 60 * 60 * 1000, // 8 h de inactividad
    },
  }));
  app.use(cargarUsuario);

  const api = express.Router();
  api.use(rutasAuth);
  api.use(rutasProyectos);
  // api.use(rutasDonaciones);            ← Nada (spec-001, spec-002)
  // api.use(rutasCertificadosInformes);  ← Rubén (spec-003, spec-004)
  api.use(rutasVoluntariado);             // Javi (spec-005, spec-006)
  api.use(rutasActividades);              // Nicole (spec-007, spec-008)
  app.use('/api', api);

  app.use(rutaNoEncontrada);
  app.use(manejadorErrores);
  return app;
}
