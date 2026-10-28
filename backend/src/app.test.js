// Pruebas de la base común que no necesitan base de datos.
import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { ErrorApi, manejadorErrores, rutaNoEncontrada } from './middleware/errores.js';
import { requiereRol } from './middleware/roles.js';
import { asincrono } from './middleware/asincrono.js';

function appDePrueba(usuario) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => { req.usuario = usuario; next(); });
  app.get('/solo-coordinador', requiereRol('coordinador'), (req, res) => res.json({ ok: true }));
  app.get('/conflicto', asincrono(async () => {
    throw new ErrorApi(409, 'YA_INSCRITO', 'Ya estás inscrito en esta actividad.');
  }));
  app.post('/validar', asincrono(async (req, res) => {
    z.object({ importe: z.string().min(1, 'Indica el importe.') }).parse(req.body);
    res.json({ ok: true });
  }));
  app.use(rutaNoEncontrada);
  app.use(manejadorErrores);
  return app;
}

describe('control de acceso', () => {
  it('401 sin sesión', async () => {
    const res = await request(appDePrueba(null)).get('/solo-coordinador');
    expect(res.status).toBe(401);
    expect(res.body.error.codigo).toBe('NO_IDENTIFICADO');
  });

  it('403 con sesión pero sin el rol', async () => {
    const res = await request(appDePrueba({ id: 1, roles: ['voluntario'] })).get('/solo-coordinador');
    expect(res.status).toBe(403);
  });

  it('200 con el rol', async () => {
    const res = await request(appDePrueba({ id: 1, roles: ['coordinador'] })).get('/solo-coordinador');
    expect(res.status).toBe(200);
  });
});

describe('formato común de error', () => {
  it('ErrorApi llega con su código y mensaje', async () => {
    const res = await request(appDePrueba(null)).get('/conflicto');
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: { codigo: 'YA_INSCRITO', mensaje: 'Ya estás inscrito en esta actividad.' } });
  });

  it('los errores de validación incluyen el mensaje de cada campo', async () => {
    const res = await request(appDePrueba(null)).post('/validar').send({ importe: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.campos).toEqual({ importe: 'Indica el importe.' });
  });

  it('una ruta inexistente da 404 con el mismo formato', async () => {
    const res = await request(appDePrueba(null)).get('/no-existe');
    expect(res.status).toBe(404);
    expect(res.body.error.codigo).toBe('NO_ENCONTRADO');
  });
});
