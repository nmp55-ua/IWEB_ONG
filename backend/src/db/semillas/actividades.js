// Semillas de spec-007: actividades de prueba de plan-comun.md §8 (idempotente, por título).
// Las inscripciones de prueba (9 inscritos, 1 en espera, 2 en la celebrada) las añade spec-005.
import { inicioDia, ZONA } from '../../servicios-comunes/fechas.js';

// Instante de «hoy + dias» a la hora hh:mm de Madrid.
function enMadrid(dias, hh, mm = 0) {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: ZONA, year: 'numeric', month: 'numeric', day: 'numeric' })
      .formatToParts(new Date())
      .map((p) => [p.type, Number(p.value)]),
  );
  // inicioDia da la medianoche de Madrid de ese día; se le suman las horas.
  const medianoche = inicioDia(partes.year, partes.month, partes.day + dias);
  return new Date(medianoche.getTime() + (hh * 60 + mm) * 60_000);
}

export async function sembrarActividades(pool) {
  const {
    rows: [coordinador],
  } = await pool.query("SELECT id FROM usuarios WHERE correo = 'coordinador@ong.test'");
  const { rows: proyectos } = await pool.query('SELECT id, nombre FROM proyectos');
  const proyecto = Object.fromEntries(proyectos.map((p) => [p.nombre, p.id]));

  const actividades = [
    {
      titulo: 'Limpieza de playa',
      proyecto: 'Agua potable',
      inicio: enMadrid(14, 10),
      fin: enMadrid(14, 13),
      lugar: 'Playa de San Juan',
      plazas: 10,
      estado: 'publicada',
      requisitos: 'Traer guantes.',
    },
    {
      titulo: 'Reparto de alimentos',
      proyecto: 'Comedor social',
      inicio: enMadrid(7, 9),
      fin: enMadrid(7, 12),
      lugar: 'Calle Mayor 3',
      plazas: 2,
      estado: 'publicada',
      requisitos: '',
    },
    {
      titulo: 'Taller de reciclaje',
      proyecto: 'Agua potable',
      inicio: enMadrid(21, 17),
      fin: enMadrid(21, 19),
      lugar: 'Centro cívico',
      plazas: 15,
      estado: 'borrador',
      requisitos: '',
    },
    {
      titulo: 'Mercadillo solidario',
      proyecto: 'Comedor social',
      inicio: enMadrid(10, 10),
      fin: enMadrid(10, 14),
      lugar: 'Plaza de España',
      plazas: 8,
      estado: 'cancelada',
      requisitos: '',
    },
    {
      titulo: 'Recogida de ropa',
      proyecto: 'Comedor social',
      inicio: enMadrid(-3, 10),
      fin: enMadrid(-3, 13, 30),
      lugar: 'Parroquia del barrio',
      plazas: 10,
      estado: 'publicada',
      requisitos: '',
    },
    {
      // spec-008: la asistencia de 2 h de voluntario@ong.test (semillas/asistencias.js).
      titulo: 'Banco de alimentos',
      proyecto: 'Comedor social',
      inicio: enMadrid(-10, 17),
      fin: enMadrid(-10, 19),
      lugar: 'Calle Mayor 3',
      plazas: 10,
      estado: 'publicada',
      requisitos: '',
    },
  ];

  for (const a of actividades) {
    const valores = [
      proyecto[a.proyecto],
      a.titulo,
      `Actividad de prueba: ${a.titulo.toLowerCase()}.`,
      a.inicio,
      a.fin,
      a.lugar,
      a.plazas,
      a.requisitos,
      a.estado,
      coordinador.id,
    ];
    const { rowCount } = await pool.query(
      `UPDATE actividades SET proyecto_id = $1, descripcion = $3, inicio = $4, fin = $5, lugar = $6,
         plazas = $7, requisitos = $8, estado = $9, creada_por = $10, actualizado_en = now()
       WHERE titulo = $2`,
      valores,
    );
    if (rowCount === 0) {
      await pool.query(
        `INSERT INTO actividades (proyecto_id, titulo, descripcion, inicio, fin, lugar, plazas, requisitos, estado, creada_por)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        valores,
      );
    }
  }
  console.log(`Semillas de actividades: ${actividades.length} actividades.`);
}
