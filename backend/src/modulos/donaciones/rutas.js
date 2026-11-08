import { Router } from 'express';
import { pool } from '../../db/pool.js';
import * as pasarela from '../../servicios-comunes/pasarela.js';
import { enviarCorreo } from '../../servicios-comunes/correo.js';
import { asincrono } from '../../middleware/asincrono.js';
import { requiereRol } from '../../middleware/roles.js';
import { crearServicio } from './servicio.js';
import { crearControlador } from './controlador.js';

const servicio = crearServicio({ pool, pasarela, enviarCorreo });
export function crearRutasDonaciones(servicioDonaciones) {
  const r = Router(),
    c = crearControlador(servicioDonaciones);
  r.get('/donaciones/contexto', asincrono(c.contexto));
  r.post('/aportaciones', asincrono(c.crear));
  r.get('/aportaciones/referencia/:referencia', asincrono(c.resultado));
  r.post('/aportaciones/referencia/:referencia/correo', asincrono(c.correo));
  r.post('/donantes/vinculaciones', requiereRol('donante'), asincrono(c.solicitarVinculo));
  r.post('/donantes/vinculaciones/confirmar', requiereRol('donante'), asincrono(c.confirmarVinculo));
  return r;
}
export const crearWebhook = (servicioDonaciones) => asincrono(crearControlador(servicioDonaciones).webhook);
export const rutasDonaciones = crearRutasDonaciones(servicio);
export const webhookDonaciones = crearWebhook(servicio);
