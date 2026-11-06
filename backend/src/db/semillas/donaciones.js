import { aIsoMadrid } from '../../servicios-comunes/fechas.js';

// Semillas de spec-001 (Nada): Donantes y aportaciones SINTÉTICAS para revisar resultados
// propios y ajenos y el reintento de correo sin llamar a Stripe. No son cobros reales: no
// tienen identificadores de pasarela. Idempotentes por NIF/NIE y referencia; no sobrescriben
// datos ni vínculos ya existentes, para conservar el caso inicialmente no vinculado.
const donantes = [
  // Mismo correo que donante@ong.test, SIN vínculo: sirve para probar /donar/vincular.
  {
    nifNie: '12345678Z',
    nombre: 'Lucía',
    apellidos: 'Donante Prueba',
    correo: 'donante@ong.test',
    direccion: 'Calle Mayor 1, Alicante',
    cuenta: null,
  },
  // Vinculado a donante2@ong.test: sus aportaciones son propias para esa cuenta y ajenas para otras.
  {
    nifNie: '87654321X',
    nombre: 'Pablo',
    apellidos: 'Donante Prueba',
    correo: 'donante2@ong.test',
    direccion: 'Avenida del Mar 5, Alicante',
    cuenta: 'donante2@ong.test',
  },
  // Donante invitado sin cuenta.
  {
    nifNie: 'Y1234567X',
    nombre: 'Elena',
    apellidos: 'Invitada Prueba',
    correo: 'invitada@ong.test',
    direccion: 'Plaza Nueva 2, Elche',
    cuenta: null,
  },
];

// correo: estado del correo de confirmación sintético (solo para confirmadas).
const aportaciones = [
  {
    ref: 'SEM-DON-0001',
    nif: '12345678Z',
    importe: '20.00',
    proyecto: null,
    estado: 'confirmada',
    dias: 20,
    correo: 'enviado',
  },
  {
    ref: 'SEM-DON-0002',
    nif: '12345678Z',
    importe: '35.50',
    proyecto: 'Agua potable',
    estado: 'confirmada',
    dias: 10,
    correo: 'enviado',
  },
  {
    ref: 'SEM-DON-0003',
    nif: '12345678Z',
    importe: '15.00',
    proyecto: null,
    estado: 'rechazada',
    motivo: 'El pago no se ha completado.',
  },
  {
    ref: 'SEM-DON-0004',
    nif: '87654321X',
    importe: '50.00',
    proyecto: 'Comedor social',
    estado: 'confirmada',
    dias: 5,
    correo: 'fallido',
  },
  { ref: 'SEM-DON-0005', nif: 'Y1234567X', importe: '10.00', proyecto: null, estado: 'pendiente' },
];

export async function sembrarDonaciones(pool) {
  for (const d of donantes) {
    await pool.query(
      `INSERT INTO donantes (usuario_id, nombre, apellidos, nif_nie, correo, direccion)
       VALUES ((SELECT id FROM usuarios WHERE correo = $1), $2, $3, $4, $5, $6)
       ON CONFLICT (nif_nie) DO NOTHING`,
      [d.cuenta, d.nombre, d.apellidos, d.nifNie, d.correo, d.direccion],
    );
  }
  let nuevas = 0;
  for (const a of aportaciones) {
    const { rows } = await pool.query(
      `INSERT INTO aportaciones (donante_id, proyecto_id, modalidad, importe, estado, fecha_cobro, referencia, motivo)
       SELECT d.id, (SELECT id FROM proyectos WHERE nombre = $2), 'puntual', $3::numeric, $4,
         CASE WHEN $4 = 'confirmada' THEN date_trunc('minute', now()) - make_interval(days => $5::int) END,
         $6, $7
       FROM donantes d WHERE d.nif_nie = $1
       ON CONFLICT (referencia) DO NOTHING
       RETURNING id, importe::text AS importe, fecha_cobro, referencia`,
      [a.nif, a.proyecto, a.importe, a.estado, a.dias ?? 0, a.ref, a.motivo ?? null],
    );
    if (!rows.length) continue;
    nuevas += 1;
    if (a.estado !== 'confirmada') continue;
    const fila = rows[0];
    const fechaCobro = aIsoMadrid(fila.fecha_cobro);
    await pool.query(
      `INSERT INTO correos_aportacion (aportacion_id, tipo, resumen, estado, intentos, enviado_en)
       VALUES ($1, 'confirmacion', $2, $3, 1, CASE WHEN $3 = 'enviado' THEN now() END)
       ON CONFLICT (aportacion_id, tipo) DO NOTHING`,
      [
        fila.id,
        {
          referencia: fila.referencia,
          importe: fila.importe,
          modalidad: 'puntual',
          destino: a.proyecto ?? 'fondo general',
          fechaCobro,
        },
        a.correo,
      ],
    );
  }
  console.log(
    `Semillas de donaciones: ${donantes.length} donantes y ${nuevas} aportaciones nuevas (sintéticas).`,
  );
}
