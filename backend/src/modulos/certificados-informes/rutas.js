// Rutas de certificados-informes. HU-03: certificado fiscal (spec-003). HU-04: informes (spec-004).
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

// HU-04: solo administración (FR-008).
const administrador = requiereRol('administrador');
rutasCertificadosInformes.get('/informes', administrador, asincrono(c.informe));
rutasCertificadosInformes.get('/informes/csv', administrador, asincrono(c.csv));
rutasCertificadosInformes.get('/informes/pdf', administrador, asincrono(c.pdfInforme));
rutasCertificadosInformes.get('/informes/proyectos', administrador, asincrono(c.proyectosInforme));
