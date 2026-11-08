// Rutas de certificados-informes. HU-03: certificado fiscal (spec-003).
// Las personales llevan /yo y requiereRol('donante'): no aceptan el identificador de nadie.
import { Router } from 'express';
import { asincrono } from '../../middleware/asincrono.js';
import { requiereRol } from '../../middleware/roles.js';
import { crearControlador } from './controlador.js';

const c = crearControlador();

export const rutasCertificadosInformes = Router();

rutasCertificadosInformes.get('/yo/certificados', requiereRol('donante'), asincrono(c.listar));
rutasCertificadosInformes.get('/yo/certificados/:ejercicio/pdf', requiereRol('donante'), asincrono(c.pdf));
// Pública, sin sesión (FR-011).
rutasCertificadosInformes.get('/certificados/verificacion', asincrono(c.verificar));
