// HU-03: SQL del módulo certificados-informes.
// Las tablas de donaciones (spec-001) solo se LEEN, con consultas propias: no se importa su
// repositorio (plan-comun §1 y §7; specs/spec-003/research.md R1).
// Las funciones que reciben `cliente` se usan dentro de una transacción.
import { consulta } from '../../db/pool.js';

// Instante del primer cobro confirmado (o null), para saber desde qué ejercicio reconciliar.
export async function primerCobroConfirmado() {
  const { rows } = await consulta(
    "SELECT min(fecha_cobro) AS primero FROM aportaciones WHERE estado = 'confirmada'",
  );
  return rows[0].primero;
}

// Serializa las reconciliaciones de un mismo ejercicio (tarea horaria y orden manual).
export async function bloquearEjercicio(cliente, ejercicio) {
  await cliente.query("SELECT pg_advisory_xact_lock(hashtext('hu03:certificados'), $1)", [ejercicio]);
}

// Donantes con total > 0 de aportaciones confirmadas en [desde, hasta) cuyo certificado falta
// o tiene otro total. La suma y la comparación se hacen en NUMERIC (al céntimo).
export async function pendientesDeEjercicio(cliente, { ejercicio, desde, hasta }) {
  const { rows } = await cliente.query(
    `SELECT t.donante_id::text AS "donanteId", t.total::text AS "importeTotal",
            d.nombre, d.correo, (d.usuario_id IS NOT NULL) AS vinculado,
            (cf.id IS NOT NULL) AS existe
       FROM (SELECT donante_id, sum(importe) AS total
               FROM aportaciones
              WHERE estado = 'confirmada' AND fecha_cobro >= $1 AND fecha_cobro < $2
              GROUP BY donante_id) t
       JOIN donantes d ON d.id = t.donante_id
       LEFT JOIN certificados_fiscales cf ON cf.donante_id = t.donante_id AND cf.ejercicio = $3
      WHERE t.total > 0 AND (cf.id IS NULL OR cf.importe_total <> t.total)
      ORDER BY t.donante_id`,
    [desde, hasta, ejercicio],
  );
  return rows;
}

// Emite o regenera (misma fila) el certificado de un Donante y ejercicio.
export async function guardarCertificado(cliente, { donanteId, ejercicio, importeTotal, fechaEmision, codigo }) {
  await cliente.query(
    `INSERT INTO certificados_fiscales (donante_id, ejercicio, importe_total, fecha_emision, codigo_verificacion)
     VALUES ($1, $2, $3::numeric, $4::date, $5)
     ON CONFLICT (donante_id, ejercicio) DO UPDATE
       SET importe_total = EXCLUDED.importe_total,
           fecha_emision = EXCLUDED.fecha_emision,
           codigo_verificacion = EXCLUDED.codigo_verificacion,
           actualizado_en = now()`,
    [donanteId, ejercicio, importeTotal, fechaEmision, codigo],
  );
}

// Donante vinculado a una cuenta (vínculo verificado de HU-01), o null.
export async function donanteDeUsuario(usuarioId) {
  const { rows } = await consulta(
    `SELECT id::text AS id, nombre, apellidos, nif_nie AS "nifNie"
       FROM donantes WHERE usuario_id = $1`,
    [usuarioId],
  );
  return rows[0] ?? null;
}

const COLUMNAS_CERTIFICADO = `ejercicio, importe_total::text AS "importeTotal",
  to_char(fecha_emision, 'YYYY-MM-DD') AS "fechaEmision", codigo_verificacion AS "codigoVerificacion"`;

export async function certificadosDeDonante(donanteId) {
  const { rows } = await consulta(
    `SELECT ${COLUMNAS_CERTIFICADO} FROM certificados_fiscales WHERE donante_id = $1 ORDER BY ejercicio DESC`,
    [donanteId],
  );
  return rows;
}

export async function certificadoDeDonante(donanteId, ejercicio) {
  const { rows } = await consulta(
    `SELECT ${COLUMNAS_CERTIFICADO} FROM certificados_fiscales WHERE donante_id = $1 AND ejercicio = $2`,
    [donanteId, ejercicio],
  );
  return rows[0] ?? null;
}

// Certificado vigente con ese código y el NIF/NIE de su Donante (para enmascararlo), o null.
export async function certificadoPorCodigo(codigo) {
  const { rows } = await consulta(
    `SELECT cf.ejercicio, cf.importe_total::text AS "importeTotal",
            to_char(cf.fecha_emision, 'YYYY-MM-DD') AS "fechaEmision", d.nif_nie AS "nifNie"
       FROM certificados_fiscales cf JOIN donantes d ON d.id = cf.donante_id
      WHERE cf.codigo_verificacion = $1`,
    [codigo],
  );
  return rows[0] ?? null;
}

// ── HU-04: informe (specs/spec-004/research.md R1, R3–R5) ──
// Solo LEE aportaciones (spec-001), actividades (spec-007) y proyectos (común), y nunca columnas
// personales de donantes o voluntarios (FR-009). Cada consulta devuelve, con GROUPING SETS, las
// filas (nivel 0), los subtotales por periodo (nivel 1) y el total (nivel 3); en NUMERIC.

const TRUNCADO = { mes: 'month', trimestre: 'quarter', anio: 'year' };

// date_trunc(NULL, …) es NULL: sin agrupación, todas las filas tienen periodo NULL.
const periodoSql = (columna) => `date_trunc($4::text, ${columna} AT TIME ZONE 'Europe/Madrid')`;

const COLUMNAS_NIVEL = `GROUPING(periodo, proyecto_id) AS nivel,
            to_char(periodo, 'YYYY-MM-DD') AS periodo,
            proyecto_id::text AS "proyectoId"`;

const AGRUPACION_SQL = 'GROUP BY GROUPING SETS ((periodo, proyecto_id), (periodo), ())';

export async function recaudacionInforme({ desde, hasta, proyectoId = null, agrupacion = null }) {
  const { rows } = await consulta(
    `WITH base AS (
       SELECT ${periodoSql('fecha_cobro')} AS periodo, proyecto_id, modalidad, importe
         FROM aportaciones
        WHERE estado = 'confirmada' AND fecha_cobro >= $1 AND fecha_cobro < $2
          AND ($3::bigint IS NULL OR proyecto_id = $3)
     )
     SELECT ${COLUMNAS_NIVEL},
            round(coalesce(sum(importe) FILTER (WHERE modalidad = 'puntual'), 0), 2)::text AS "recaudadoPuntual",
            round(coalesce(sum(importe) FILTER (WHERE modalidad = 'cuota_socio'), 0), 2)::text AS "recaudadoCuotas",
            round(coalesce(sum(importe), 0), 2)::text AS "recaudadoTotal",
            count(*)::int AS aportaciones
       FROM base
      ${AGRUPACION_SQL}`,
    [desde, hasta, proyectoId, TRUNCADO[agrupacion] ?? null],
  );
  return rows;
}

// Actividades celebradas (publicadas y ya empezadas según «ahora»), en el periodo de su inicio.
// Voluntarios y horas necesitan la tabla asistencias de HU-08 (tasks.md, fase 6): hasta entonces, 0.
export async function voluntariadoInforme({ desde, hasta, proyectoId = null, agrupacion = null, ahora }) {
  const { rows } = await consulta(
    `WITH base AS (
       SELECT ${periodoSql('inicio')} AS periodo, proyecto_id, id
         FROM actividades
        WHERE estado = 'publicada' AND inicio <= $5 AND inicio >= $1 AND inicio < $2
          AND ($3::bigint IS NULL OR proyecto_id = $3)
     )
     SELECT ${COLUMNAS_NIVEL},
            count(*)::int AS actividades,
            0 AS voluntarios,
            '0.00' AS horas
       FROM base
      ${AGRUPACION_SQL}`,
    [desde, hasta, proyectoId, TRUNCADO[agrupacion] ?? null, ahora],
  );
  return rows;
}

export async function proyectoPorId(id) {
  const { rows } = await consulta('SELECT id::text, nombre, activo FROM proyectos WHERE id = $1', [id]);
  return rows[0] ?? null;
}

// Todos, también los inactivos: siguen apareciendo si tienen datos (research R7).
export async function todosLosProyectos() {
  const { rows } = await consulta('SELECT id::text, nombre, activo FROM proyectos ORDER BY nombre');
  return rows;
}
