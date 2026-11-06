// SQL de la tabla actividades (dueño: spec-007). Devuelve filas en snake_case.
// Nunca consulta inscripciones: para eso está ./inscripciones.js.
import { consulta } from '../../db/pool.js';

const COLUMNAS = `a.id, a.proyecto_id, p.nombre AS proyecto_nombre, a.titulo, a.descripcion, a.inicio,
  a.fin, a.lugar, a.plazas, a.requisitos, a.estado, a.creada_por, a.creado_en, a.actualizado_en`;

// Campos editables: clave de la API → columna.
const EDITABLES = {
  proyectoId: 'proyecto_id',
  titulo: 'titulo',
  descripcion: 'descripcion',
  inicio: 'inicio',
  fin: 'fin',
  lugar: 'lugar',
  plazas: 'plazas',
  requisitos: 'requisitos',
  estado: 'estado',
};

const ejecutar = (cliente, sql, parametros) =>
  cliente ? cliente.query(sql, parametros) : consulta(sql, parametros);

export async function insertar(datos, cliente) {
  const { rows } = await ejecutar(
    cliente,
    `INSERT INTO actividades (proyecto_id, titulo, descripcion, inicio, fin, lugar, plazas, requisitos, estado, creada_por)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
    [
      datos.proyectoId,
      datos.titulo,
      datos.descripcion,
      datos.inicio,
      datos.fin,
      datos.lugar,
      datos.plazas,
      datos.requisitos,
      datos.estado,
      datos.creadaPor,
    ],
  );
  return obtenerPorId(rows[0].id, cliente);
}

export async function obtenerPorId(id, cliente) {
  const { rows } = await ejecutar(
    cliente,
    `SELECT ${COLUMNAS} FROM actividades a JOIN proyectos p ON p.id = a.proyecto_id WHERE a.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

// Bloquea la fila hasta el final de la transacción (aforo con peticiones simultáneas).
export async function bloquearPorId(id, cliente) {
  await cliente.query('SELECT id FROM actividades WHERE id = $1 FOR UPDATE', [id]);
  return obtenerPorId(id, cliente);
}

export async function actualizar(id, cambios, cliente) {
  const asignaciones = [];
  const parametros = [];
  for (const [clave, columna] of Object.entries(EDITABLES)) {
    if (cambios[clave] === undefined) continue;
    parametros.push(cambios[clave]);
    asignaciones.push(`${columna} = $${parametros.length}`);
  }
  if (asignaciones.length > 0) {
    parametros.push(id);
    await ejecutar(
      cliente,
      `UPDATE actividades SET ${asignaciones.join(', ')}, actualizado_en = now() WHERE id = $${parametros.length}`,
      parametros,
    );
  }
  return obtenerPorId(id, cliente);
}

export async function listar({ estado, proyectoId } = {}) {
  const condiciones = [];
  const parametros = [];
  if (estado) {
    parametros.push(estado);
    condiciones.push(`a.estado = $${parametros.length}`);
  }
  if (proyectoId) {
    parametros.push(proyectoId);
    condiciones.push(`a.proyecto_id = $${parametros.length}`);
  }
  const donde = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  const { rows } = await consulta(
    `SELECT ${COLUMNAS} FROM actividades a JOIN proyectos p ON p.id = a.proyecto_id ${donde} ORDER BY a.inicio DESC`,
    parametros,
  );
  return rows;
}

export async function obtenerProyecto(id, cliente) {
  const { rows } = await ejecutar(cliente, 'SELECT id, activo FROM proyectos WHERE id = $1', [id]);
  return rows[0] ?? null;
}

// --- Asistencias (spec-008). Solo asistencias y actividades: las inscripciones, vía ./inscripciones.js.

export async function listarAsistencias(inscripcionIds) {
  const { rows } = await consulta(
    'SELECT inscripcion_id, asistio FROM asistencias WHERE inscripcion_id = ANY($1::bigint[])',
    [inscripcionIds],
  );
  return rows;
}

// Horas de la actividad, calculadas sobre los instantes (22:00–01:00 = 3; research R5).
export async function horasDeActividad(id, cliente) {
  const { rows } = await ejecutar(
    cliente,
    'SELECT ROUND(EXTRACT(EPOCH FROM fin - inicio) / 3600, 2) AS horas FROM actividades WHERE id = $1',
    [id],
  );
  return Number(rows[0].horas);
}

// Una fila por inscripción: repetir no duplica y corregir solo cambia la fila (research R1).
export async function guardarAsistencias(filas, cliente) {
  for (const fila of filas) {
    await ejecutar(
      cliente,
      `INSERT INTO asistencias (inscripcion_id, asistio, horas, registrada_por, fecha_registro)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (inscripcion_id) DO UPDATE SET asistio = EXCLUDED.asistio, horas = EXCLUDED.horas,
         registrada_por = EXCLUDED.registrada_por, fecha_registro = EXCLUDED.fecha_registro`,
      [fila.inscripcionId, fila.asistio, fila.horas, fila.registradaPor, fila.fechaRegistro],
    );
  }
}

// pares: [{ inscripcionId, actividadId }] de listarInscripcionesDeUsuario. asistencias no tiene
// actividad_id: el enlace con actividades sale de cada par, sin consultar inscripciones (research R3).
export async function sumarHorasDeInscripciones(pares) {
  const parametros = [pares.map((p) => p.inscripcionId), pares.map((p) => p.actividadId)];
  const desde = `FROM unnest($1::bigint[], $2::bigint[]) AS p(inscripcion_id, actividad_id)
    JOIN asistencias s ON s.inscripcion_id = p.inscripcion_id
    JOIN actividades a ON a.id = p.actividad_id
    WHERE s.asistio`;
  const { rows: total } = await consulta(`SELECT COALESCE(SUM(s.horas), 0) AS total ${desde}`, parametros);
  const { rows: filas } = await consulta(
    `SELECT a.id AS actividad_id, a.titulo, a.inicio, s.horas ${desde} ORDER BY a.inicio DESC`,
    parametros,
  );
  return {
    totalHoras: Number(total[0].total),
    filas: filas.map((f) => ({ ...f, horas: Number(f.horas) })),
  };
}
