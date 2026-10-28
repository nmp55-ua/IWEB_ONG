import { Router } from 'express';
import { requiereRol } from '../../middleware/roles.js';

// Todas las rutas de HU-07 son solo para coordinadores (FR-010). Cualquier coordinador
// gestiona cualquier actividad (PA7.1). :id solo admite dígitos para no capturar
// /actividades/disponibles de spec-005 (research R6).
export const rutasActividades = Router();

const soloCoordinador = requiereRol('coordinador');
