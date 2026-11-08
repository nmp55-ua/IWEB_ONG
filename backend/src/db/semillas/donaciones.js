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

// Casos SINTÉTICOS de socio (T071), todos del Donante vinculado a donante2@ong.test para que
// esa cuenta pueda consultarlos. No hay Subscription, Invoice ni PaymentIntent reales: los
// identificadores de pasarela quedan NULL y nada llama a Stripe. Fechas relativas a now(); la
// previsión guarda juntos el instante y su DATE de Madrid. Idempotentes por la referencia de la
// primera cuota (alta): si ya existe, el caso completo no se vuelve a crear.
const socios = [
  {
    // a) Activa: alta y un ciclo confirmados, próxima fecha futura.
    periodicidad: 'mensual',
    importe: '10.00',
    proyecto: 'Agua potable',
    estado: 'activa',
    proximoEnDias: 20,
    cuotas: [
      { ref: 'SEM-SOC-0001', estado: 'confirmada', dias: 40, correo: 'enviado' },
      { ref: 'SEM-SOC-0002', estado: 'confirmada', dias: 10, correo: 'enviado' },
    ],
  },
  {
    // b) Activa con una cuota de ciclo rechazada, su aviso de fallo y sin previsión.
    periodicidad: 'mensual',
    importe: '15.00',
    proyecto: null,
    estado: 'activa',
    proximoEnDias: null,
    cuotas: [
      { ref: 'SEM-SOC-0011', estado: 'confirmada', dias: 35, correo: 'enviado' },
      { ref: 'SEM-SOC-0012', estado: 'rechazada', motivo: 'La cuota no se ha podido cobrar.', aviso: 'enviado' },
    ],
  },
  {
    // c) Alta pendiente: sin fecha de alta, de cobro ni previsión.
    periodicidad: 'trimestral',
    importe: '30.00',
    proyecto: null,
    estado: 'pendiente',
    proximoEnDias: null,
    cuotas: [{ ref: 'SEM-SOC-0021', estado: 'pendiente' }],
  },
  {
    // d) Cancelada: conserva sus cuotas confirmadas; previsión NULL.
    periodicidad: 'anual',
    importe: '60.00',
    proyecto: 'Comedor social',
    estado: 'cancelada',
    proximoEnDias: null,
    cuotas: [
      { ref: 'SEM-SOC-0031', estado: 'confirmada', dias: 400, correo: 'enviado' },
      { ref: 'SEM-SOC-0032', estado: 'confirmada', dias: 35, correo: 'enviado' },
    ],
  },
];
const NIF_SOCIO = '87654321X';

// Crea un caso completo en una transacción; devuelve el número de aportaciones nuevas.
async function sembrarSocio(pool, caso) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    // Serializa ejecuciones simultáneas de las semillas antes de comprobar la referencia.
    await cliente.query("SELECT pg_advisory_xact_lock(hashtext('semillas:donaciones:socios'))");
    const alta = caso.cuotas[0];
    const existe = await cliente.query('SELECT 1 FROM aportaciones WHERE referencia = $1', [alta.ref]);
    const donante = (await cliente.query('SELECT id FROM donantes WHERE nif_nie = $1', [NIF_SOCIO])).rows[0];
    if (existe.rowCount || !donante) {
      await cliente.query('COMMIT');
      return 0;
    }
    const s = (
      await cliente.query(
        `INSERT INTO suscripciones_socio (donante_id, proyecto_id, importe, periodicidad, estado, fecha_alta,
           fecha_proximo_cobro, pasarela_proximo_cobro_en)
         SELECT $1, (SELECT id FROM proyectos WHERE nombre = $2), $3::numeric, $4, $5,
           CASE WHEN $6::int IS NOT NULL THEN date_trunc('minute', now()) - make_interval(days => $6::int) END,
           (p.en AT TIME ZONE 'Europe/Madrid')::date, p.en
         FROM (SELECT CASE WHEN $7::int IS NOT NULL
           THEN date_trunc('minute', now()) + make_interval(days => $7::int) END AS en) p
         RETURNING id, proyecto_id, to_char(fecha_proximo_cobro, 'YYYY-MM-DD') AS proximo`,
        [
          donante.id,
          caso.proyecto,
          caso.importe,
          caso.periodicidad,
          caso.estado,
          alta.estado === 'confirmada' ? alta.dias : null,
          caso.proximoEnDias,
        ],
      )
    ).rows[0];
    for (const cuota of caso.cuotas) {
      const fila = (
        await cliente.query(
          `INSERT INTO aportaciones (donante_id, proyecto_id, suscripcion_socio_id, modalidad, importe, estado,
             fecha_cobro, referencia, motivo)
           VALUES ($1, $2, $3, 'cuota_socio', $4::numeric, $5,
             CASE WHEN $5 = 'confirmada' THEN date_trunc('minute', now()) - make_interval(days => $6::int) END,
             $7, $8)
           RETURNING id, importe::text AS importe, fecha_cobro, referencia`,
          [donante.id, s.proyecto_id, s.id, caso.importe, cuota.estado, cuota.dias ?? 0, cuota.ref, cuota.motivo ?? null],
        )
      ).rows[0];
      const correo = (tipo, resumen, estado) =>
        cliente.query(
          `INSERT INTO correos_aportacion (aportacion_id, tipo, resumen, estado, intentos, enviado_en)
           VALUES ($1, $2, $3, $4, 1, CASE WHEN $4 = 'enviado' THEN now() END)
           ON CONFLICT (aportacion_id, tipo) DO NOTHING`,
          [fila.id, tipo, resumen, estado],
        );
      if (cuota.estado === 'confirmada') {
        await correo(
          'confirmacion',
          {
            referencia: fila.referencia,
            importe: fila.importe,
            modalidad: 'cuota_socio',
            destino: caso.proyecto ?? 'fondo general',
            fechaCobro: aIsoMadrid(fila.fecha_cobro),
            periodicidad: caso.periodicidad,
            fechaProximoCobro: s.proximo,
          },
          cuota.correo,
        );
      }
      if (cuota.aviso) {
        await correo(
          'fallo_cuota',
          { referencia: fila.referencia, importe: fila.importe, motivo: cuota.motivo, fechaProximoCobro: null },
          cuota.aviso,
        );
      }
    }
    await cliente.query('COMMIT');
    return caso.cuotas.length;
  } catch (error) {
    await cliente.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    cliente.release();
  }
}

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
  let cuotas = 0;
  for (const caso of socios) cuotas += await sembrarSocio(pool, caso);
  console.log(
    `Semillas de donaciones: ${donantes.length} donantes, ${nuevas} aportaciones puntuales y ` +
      `${cuotas} cuotas de socio nuevas (sintéticas).`,
  );
}
