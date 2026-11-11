import { Router } from 'express';
import { asincrono } from '../../middleware/asincrono.js';
import { requiereRol } from '../../middleware/roles.js';
import * as controlador from './controlador.js';

// HU-08: cualquier usuario identificado; sin identificador en la ruta (plan-comun §3).
export const rutasYoActividades = Router();

rutasYoActividades.get('/yo/horas', requiereRol(), asincrono(controlador.misHoras));
