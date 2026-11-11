// Una sesión controlada T030, sin proxy adicional ni precarga del historial.
import { crearBancoHistorial } from './historial-local.js';
import { createInterface } from 'node:readline';
import os from 'node:os';

const puertoProxy = Number(process.env.HU02_PUERTO_MEDICION ?? 44326);
if (!Number.isInteger(puertoProxy) || puertoProxy < 1024 || puertoProxy > 65535) {
  throw new Error('Puerto de medición inválido.');
}
const banco = await crearBancoHistorial({ puertoProxy, trazaNavegador: true });
const entrada = createInterface({ input: process.stdin });
try {
  const identidad = (
    await banco.entorno.pool.query('SELECT current_database() AS base,current_schema() AS esquema')
  ).rows[0];
  const grupos = (
    await banco.entorno.pool.query(
      `SELECT EXTRACT(YEAR FROM a.fecha_cobro AT TIME ZONE 'Europe/Madrid')::int AS anio,
    count(*)::int AS cuotas,sum(a.importe)::text AS total FROM aportaciones a
    JOIN donantes d ON d.id=a.donante_id JOIN usuarios u ON u.id=d.usuario_id
    WHERE u.correo=$1 AND u.activo AND 'donante'=ANY(u.roles) AND a.estado='confirmada'
    GROUP BY 1 ORDER BY 1 DESC`,
      [banco.cuentas.periodico],
    )
  ).rows;
  console.log(
    JSON.stringify({
      url: banco.url,
      identidad,
      grupos,
      entorno: {
        sistema: os.version(),
        cpu: os.cpus()[0]?.model,
        memoriaLibre: os.freemem(),
        memoriaTotal: os.totalmem(),
        node: process.version,
      },
      cuenta: banco.cuentas.periodico,
    }),
  );
  for await (const linea of entrada) {
    if (linea.trim() === 'cerrar') break;
  }
} finally {
  entrada.close();
  try {
    console.log(JSON.stringify({ llamadas: await banco.llamadas() }));
  } finally {
    await banco.cerrar();
    console.log(JSON.stringify({ recursosCerrados: banco.recursosCerrados() }));
  }
}
