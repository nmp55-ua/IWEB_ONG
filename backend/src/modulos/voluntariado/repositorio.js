// SQL de voluntarios e inscripciones (dueño: spec-005). Devuelve filas en snake_case.
// Nunca consulta actividades: para eso está ./actividades.js.
import { consulta } from '../../db/pool.js';

const ACTIVAS = "('confirmada', 'en_espera')";

// Posición en la lista de espera: orden de llegada entre las «en_espera» de la misma actividad.
const POSICION = `CASE WHEN i.estado = 'en_espera' THEN (
    SELECT count(*)::int FROM inscripciones o
    WHERE o.actividad_id = i.actividad_id AND o.estado = 'en_espera'
      AND (o.fecha_inscripcion, o.id) <= (i.fecha_inscripcion, i.id)
  ) END AS posicion`;

const COLUMNAS = `i.id, i.voluntario_id, i.actividad_id, i.estado, i.fecha_inscripcion, i.fecha_confirmacion,
  i.fecha_cancelacion, ${POSICION}`;

const ejecutar = (cliente, sql, parametros) =>
  cliente ? cliente.query(sql, parametros) : consulta(sql, parametros);

export async function obtenerVoluntarioDeUsuario(usuarioId, cliente) {
  const { rows } = await ejecutar(
    cliente,
    'SELECT id, usuario_id, nombre, apellidos, correo, telefono FROM voluntarios WHERE usuario_id = $1',
    [usuarioId],
  );
  return rows[0] ?? null;
}

// Crea el perfil la primera vez y lo actualiza las siguientes (un voluntario por usuario).
export async function guardarVoluntario(usuarioId, { nombre, apellidos, correo, telefono }) {
  const { rows } = await consulta(
    `INSERT INTO voluntarios (usuario_id, nombre, apellidos, correo, telefono) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (usuario_id) DO UPDATE SET nombre = EXCLUDED.nombre, apellidos = EXCLUDED.apellidos,
       correo = EXCLUDED.correo, telefono = EXCLUDED.telefono, actualizado_en = now()
     RETURNING id, usuario_id, nombre, apellidos, correo, telefono`,
    [usuarioId, nombre, apellidos, correo, telefono],
  );
  return rows[0];
}

// Inscripción con los datos del voluntario que hacen falta para comprobar el dueño y avisarle.
export async function obtenerInscripcion(id, cliente) {
  const { rows } = await ejecutar(
    cliente,
    `SELECT ${COLUMNAS}, v.usuario_id, v.nombre, v.correo
     FROM inscripciones i JOIN voluntarios v ON v.id = i.voluntario_id WHERE i.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function obtenerActiva(voluntarioId, actividadId, cliente) {
  const { rows } = await ejecutar(
    cliente,
    `SELECT id FROM inscripciones WHERE voluntario_id = $1 AND actividad_id = $2 AND estado IN ${ACTIVAS}`,
    [voluntarioId, actividadId],
  );
  return rows[0] ?? null;
}

export async function insertar({ voluntarioId, actividadId, estado }, cliente) {
  const { rows } = await ejecutar(
    cliente,
    `INSERT INTO inscripciones (voluntario_id, actividad_id, estado, acepta_requisitos, fecha_confirmacion)
     VALUES ($1, $2, $3::text, true, CASE WHEN $3::text = 'confirmada' THEN now() END) RETURNING id`,
    [voluntarioId, actividadId, estado],
  );
  return obtenerInscripcion(rows[0].id, cliente);
}

export async function cancelar(id, cliente) {
  await ejecutar(
    cliente,
    `UPDATE inscripciones SET estado = 'cancelada', fecha_cancelacion = now(), actualizado_en = now()
     WHERE id = $1`,
    [id],
  );
}

export async function contarConfirmadas(actividadId, cliente) {
  const { rows } = await ejecutar(
    cliente,
    "SELECT count(*)::int AS total FROM inscripciones WHERE actividad_id = $1 AND estado = 'confirmada'",
    [actividadId],
  );
  return rows[0].total;
}

// Inscripciones activas de una actividad con los datos de contacto, por orden de llegada.
export async function listarActivasDeActividad(actividadId, cliente) {
  const { rows } = await ejecutar(
    cliente,
    `SELECT i.id, i.estado, i.fecha_inscripcion, i.fecha_confirmacion,
       v.nombre, v.apellidos, v.correo, v.telefono
     FROM inscripciones i JOIN voluntarios v ON v.id = i.voluntario_id
     WHERE i.actividad_id = $1 AND i.estado IN ${ACTIVAS}
     ORDER BY i.fecha_inscripcion, i.id`,
    [actividadId],
  );
  return rows;
}

// Confirma, por orden de llegada, las primeras «cuantas» personas en espera.
export async function confirmarPrimerasEnEspera(actividadId, cuantas, cliente) {
  const { rows } = await ejecutar(
    cliente,
    `WITH elegidas AS (
       SELECT id FROM inscripciones WHERE actividad_id = $1 AND estado = 'en_espera'
       ORDER BY fecha_inscripcion, id LIMIT $2
     )
     UPDATE inscripciones i
     SET estado = 'confirmada', fecha_confirmacion = now(), actualizado_en = now()
     FROM elegidas e, voluntarios v
     WHERE i.id = e.id AND v.id = i.voluntario_id
     RETURNING i.id, i.fecha_inscripcion, v.nombre, v.correo`,
    [actividadId, cuantas],
  );
  return rows.sort((a, b) => a.fecha_inscripcion - b.fecha_inscripcion || a.id - b.id);
}

export async function cancelarActivasDeActividad(actividadId, cliente) {
  const { rows } = await ejecutar(
    cliente,
    `WITH afectadas AS (
       SELECT id, estado FROM inscripciones WHERE actividad_id = $1 AND estado IN ${ACTIVAS}
     )
     UPDATE inscripciones i
     SET estado = 'cancelada', fecha_cancelacion = now(), actualizado_en = now()
     FROM afectadas a, voluntarios v
     WHERE i.id = a.id AND v.id = i.voluntario_id
     RETURNING i.id, v.nombre, v.correo, a.estado AS estado_anterior`,
    [actividadId],
  );
  return rows;
}

// Inscripciones activas de un usuario (para marcar en el listado las actividades en las que está).
export async function listarActivasDeUsuario(usuarioId) {
  const { rows } = await consulta(
    `SELECT ${COLUMNAS} FROM inscripciones i JOIN voluntarios v ON v.id = i.voluntario_id
     WHERE v.usuario_id = $1 AND i.estado IN ${ACTIVAS}`,
    [usuarioId],
  );
  return rows;
}

export async function listarDeUsuario(usuarioId) {
  const { rows } = await consulta(
    `SELECT i.id, i.actividad_id FROM inscripciones i JOIN voluntarios v ON v.id = i.voluntario_id
     WHERE v.usuario_id = $1 ORDER BY i.id`,
    [usuarioId],
  );
  return rows;
}
