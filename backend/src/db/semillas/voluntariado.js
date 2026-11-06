// Semillas de spec-005: voluntarios e inscripciones de prueba de plan-comun.md §8 (idempotente).
// Usa las actividades de prueba de spec-007, buscándolas por título. Si al repetirse las inscripciones
// activas de esas actividades no son las de abajo, las pasa a «cancelada» y vuelve a crear las de prueba,
// así se puede repetir el quickstart desde cero (nunca se borra nada).

// voluntario3 … voluntario11: los 9 inscritos de «Limpieza de playa».
const NOMBRES = [
  ['Ana', 'García López'],
  ['Luis', 'Martínez Pérez'],
  ['Elena', 'Sánchez Gil'],
  ['David', 'López Ruiz'],
  ['Carmen', 'Ruiz Moreno'],
  ['Javier', 'Moreno Díaz'],
  ['Lucía', 'Navarro Sanz'],
  ['Sergio', 'Romero Vidal'],
  ['Paula', 'Torres Molina'],
];
const extra = NOMBRES.map(([nombre, apellidos], i) => ({
  correo: `voluntario${i + 3}@ong.test`,
  nombre,
  apellidos,
  telefono: `600 100 ${String(i + 3).padStart(3, '0')}`,
}));

// Todos tienen perfil; el escenario 11 (se piden los datos) se prueba con una cuenta nueva.
const perfiles = [
  { correo: 'voluntario@ong.test', nombre: 'Marta', apellidos: 'Voluntaria Ramos', telefono: '600 100 001' },
  { correo: 'voluntario2@ong.test', nombre: 'Jorge', apellidos: 'Voluntario Pons', telefono: '600 100 002' },
  ...extra,
];

// Por actividad, las inscripciones activas en orden de llegada.
const inscripciones = {
  'Limpieza de playa': extra.map((v) => [v.correo, 'confirmada']),
  'Reparto de alimentos': [
    ['voluntario3@ong.test', 'confirmada'],
    ['voluntario4@ong.test', 'confirmada'],
    ['voluntario5@ong.test', 'en_espera'],
  ],
  // Ya celebrada: spec-008 registra aquí la asistencia de voluntario2 (su quickstart 1.2).
  'Recogida de ropa': [
    ['voluntario@ong.test', 'confirmada'],
    ['voluntario2@ong.test', 'confirmada'],
  ],
};

export async function sembrarVoluntariado(pool, hash) {
  for (const v of extra) {
    await pool.query(
      `INSERT INTO usuarios (correo, hash_contrasena, nombre, roles) VALUES ($1, $2, $3, ARRAY['voluntario'])
       ON CONFLICT (correo) DO UPDATE SET hash_contrasena = EXCLUDED.hash_contrasena, nombre = EXCLUDED.nombre,
         roles = EXCLUDED.roles, activo = true, actualizado_en = now()`,
      [v.correo, hash, `${v.nombre} ${v.apellidos.split(' ')[0]}`],
    );
  }
  for (const p of perfiles) {
    await pool.query(
      `INSERT INTO voluntarios (usuario_id, nombre, apellidos, correo, telefono)
       SELECT id, $2, $3, $1, $4 FROM usuarios WHERE correo = $1
       ON CONFLICT (usuario_id) DO UPDATE SET nombre = EXCLUDED.nombre, apellidos = EXCLUDED.apellidos,
         correo = EXCLUDED.correo, telefono = EXCLUDED.telefono, actualizado_en = now()`,
      [p.correo, p.nombre, p.apellidos, p.telefono],
    );
  }

  let total = 0;
  for (const [titulo, previstas] of Object.entries(inscripciones)) {
    const { rows: actividades } = await pool.query('SELECT id FROM actividades WHERE titulo = $1', [titulo]);
    if (actividades.length === 0) {
      console.warn(`Semillas de voluntariado: no existe la actividad «${titulo}».`);
      continue;
    }
    const actividadId = actividades[0].id;
    const { rows: actuales } = await pool.query(
      `SELECT u.correo, i.estado FROM inscripciones i
       JOIN voluntarios v ON v.id = i.voluntario_id JOIN usuarios u ON u.id = v.usuario_id
       WHERE i.actividad_id = $1 AND i.estado IN ('confirmada', 'en_espera')
       ORDER BY i.fecha_inscripcion, i.id`,
      [actividadId],
    );
    const iguales =
      actuales.length === previstas.length &&
      actuales.every((fila, i) => fila.correo === previstas[i][0] && fila.estado === previstas[i][1]);
    if (!iguales) {
      await pool.query(
        `UPDATE inscripciones SET estado = 'cancelada', fecha_cancelacion = now(), actualizado_en = now()
         WHERE actividad_id = $1 AND estado IN ('confirmada', 'en_espera')`,
        [actividadId],
      );
      for (const [correo, estado] of previstas) {
        await pool.query(
          `INSERT INTO inscripciones (voluntario_id, actividad_id, estado, acepta_requisitos, fecha_inscripcion,
             fecha_confirmacion)
           SELECT v.id, $2, $3::text, true, clock_timestamp(), CASE WHEN $3::text = 'confirmada' THEN now() END
           FROM voluntarios v JOIN usuarios u ON u.id = v.usuario_id WHERE u.correo = $1`,
          [correo, actividadId, estado],
        );
      }
    }
    total += previstas.length;
  }
  console.log(`Semillas de voluntariado: ${perfiles.length} voluntarios y ${total} inscripciones activas.`);

  // Ids para los bordes del quickstart de spec-005 (cancelar tras el inicio, inscripción de otro).
  const { rows: celebrada } = await pool.query(
    `SELECT u.correo, i.id FROM inscripciones i
     JOIN voluntarios v ON v.id = i.voluntario_id JOIN usuarios u ON u.id = v.usuario_id
     JOIN actividades a ON a.id = i.actividad_id
     WHERE a.titulo = 'Recogida de ropa' AND i.estado = 'confirmada' ORDER BY i.id`,
  );
  for (const fila of celebrada)
    console.log(`  Recogida de ropa (celebrada): inscripción ${fila.id} de ${fila.correo}`);
}
