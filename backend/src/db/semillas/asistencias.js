// Semillas de spec-008: asistencia de 2 h de voluntario@ong.test en «Banco de alimentos» (idempotente).
// «Recogida de ropa» queda sin asistencias para los escenarios 1.2–1.4 y 2.1 del quickstart.
export async function sembrarAsistencias(pool) {
  const {
    rows: [datos],
  } = await pool.query(
    `SELECT a.id AS actividad_id, v.id AS voluntario_id,
       (SELECT id FROM usuarios WHERE correo = 'coordinador@ong.test') AS coordinador_id
     FROM actividades a, voluntarios v JOIN usuarios u ON u.id = v.usuario_id
     WHERE a.titulo = 'Banco de alimentos' AND u.correo = 'voluntario@ong.test'`,
  );
  if (!datos) {
    console.warn('Semillas de asistencias: falta la actividad o el voluntario de prueba.');
    return;
  }
  const { rows: existentes } = await pool.query(
    `SELECT id FROM inscripciones WHERE actividad_id = $1 AND voluntario_id = $2 AND estado = 'confirmada'`,
    [datos.actividad_id, datos.voluntario_id],
  );
  const inscripcionId =
    existentes[0]?.id ??
    (
      await pool.query(
        `INSERT INTO inscripciones (voluntario_id, actividad_id, estado, acepta_requisitos, fecha_confirmacion)
         VALUES ($1, $2, 'confirmada', true, now()) RETURNING id`,
        [datos.voluntario_id, datos.actividad_id],
      )
    ).rows[0].id;
  await pool.query(
    `INSERT INTO asistencias (inscripcion_id, asistio, horas, registrada_por, fecha_registro)
     VALUES ($1, true, 2, $2, now())
     ON CONFLICT (inscripcion_id) DO UPDATE SET asistio = true, horas = 2`,
    [inscripcionId, datos.coordinador_id],
  );
  console.log('Semillas de asistencias: 2 h de voluntario@ong.test en «Banco de alimentos».');
}
