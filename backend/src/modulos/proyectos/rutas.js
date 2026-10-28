import { Router } from 'express';
import { consulta } from '../../db/pool.js';
import { asincrono } from '../../middleware/asincrono.js';

export const rutasProyectos = Router();

// Público: proyectos activos que se pueden elegir como destino o para actividades nuevas.
rutasProyectos.get('/proyectos', asincrono(async (req, res) => {
  const { rows } = await consulta(
    'SELECT id, nombre, descripcion FROM proyectos WHERE activo ORDER BY nombre',
  );
  res.json({ datos: rows, total: rows.length });
}));
