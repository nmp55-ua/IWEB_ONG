import { Router } from 'express';
import { asincrono } from '../../middleware/asincrono.js';
import { requiereRol } from '../../middleware/roles.js';
import * as controlador from './controlador.js';

export const rutasAuth = Router();

rutasAuth.post('/auth/registro', asincrono(controlador.registro));
rutasAuth.post('/auth/sesion', asincrono(controlador.entrar));
rutasAuth.delete('/auth/sesion', requiereRol(), controlador.salir);
rutasAuth.get('/auth/yo', requiereRol(), controlador.yo);
