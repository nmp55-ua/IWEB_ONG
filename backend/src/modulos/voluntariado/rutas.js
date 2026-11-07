import { Router } from 'express';
import { asincrono } from '../../middleware/asincrono.js';
import { requiereRol } from '../../middleware/roles.js';
import * as controlador from './controlador.js';

// Rutas de HU-05 y HU-06. El listado es público; el resto exige sesión (401) y el rol de voluntario.
// En las de HU-05 el rol se comprueba en el servicio para dar un mensaje propio (research R5 de
// spec-005); el calendario usa el requiereRol común (research R1 de spec-006). :id solo admite dígitos.
export const rutasVoluntariado = Router();

const conSesion = requiereRol();

rutasVoluntariado.get('/actividades/disponibles', asincrono(controlador.disponibles));
rutasVoluntariado.post('/actividades/:id(\\d+)/inscripciones', conSesion, asincrono(controlador.inscribir));
rutasVoluntariado.patch(
  '/yo/inscripciones/:id(\\d+)',
  conSesion,
  asincrono(controlador.modificarInscripcion),
);
rutasVoluntariado.get('/yo/perfil-voluntario', conSesion, asincrono(controlador.perfil));
rutasVoluntariado.put('/yo/perfil-voluntario', conSesion, asincrono(controlador.guardarPerfil));
rutasVoluntariado.get('/yo/calendario', requiereRol('voluntario'), asincrono(controlador.calendario));
