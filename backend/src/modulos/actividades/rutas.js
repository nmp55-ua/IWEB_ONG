import { Router } from 'express';
import { asincrono } from '../../middleware/asincrono.js';
import { requiereRol } from '../../middleware/roles.js';
import * as controlador from './controlador.js';

// Todas las rutas de HU-07 son solo para coordinadores (FR-010). Cualquier coordinador
// gestiona cualquier actividad (PA7.1). :id solo admite dígitos para no capturar
// /actividades/disponibles de spec-005 (research R6).
export const rutasActividades = Router();

const soloCoordinador = requiereRol('coordinador');

rutasActividades.get('/actividades', soloCoordinador, asincrono(controlador.listar));
rutasActividades.post('/actividades', soloCoordinador, asincrono(controlador.crear));
rutasActividades.get('/actividades/:id(\\d+)', soloCoordinador, asincrono(controlador.obtener));
rutasActividades.patch('/actividades/:id(\\d+)', soloCoordinador, asincrono(controlador.modificar));
rutasActividades.get(
  '/actividades/:id(\\d+)/inscripciones',
  soloCoordinador,
  asincrono(controlador.inscripciones),
);
// HU-08: cualquier coordinador, en cualquier actividad (FR-008).
rutasActividades.get(
  '/actividades/:id(\\d+)/asistencias',
  soloCoordinador,
  asincrono(controlador.obtenerAsistencias),
);
rutasActividades.put(
  '/actividades/:id(\\d+)/asistencias',
  soloCoordinador,
  asincrono(controlador.guardarAsistencias),
);
