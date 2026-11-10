// Fixtures de HU-02: importar este módulo no abre conexiones ni arranca servicios.
import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { contrasenaPruebas, verificarEsquemaPruebas } from './soporte.js';

export async function insertarAportacionHistorial(pool, donanteId, datos = {}) {
  const {
    importe = '1.00',
    estado = 'confirmada',
    fecha = '2025-06-15T11:00:00Z',
    proyectoId = null,
    suscripcionId = null,
    id = null,
  } = datos;
  return (
    await pool.query(
      `INSERT INTO aportaciones
         (id,donante_id,proyecto_id,suscripcion_socio_id,modalidad,importe,estado,fecha_cobro,referencia,pasarela_pago_id)
       VALUES (COALESCE($1::bigint,nextval('aportaciones_id_seq')),$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        id,
        donanteId,
        proyectoId,
        suscripcionId,
        suscripcionId ? 'cuota_socio' : 'puntual',
        importe,
        estado,
        estado === 'confirmada' ? fecha : null,
        `DON-HU02-${randomUUID()}`,
        `pi_sintetico_${randomUUID()}`,
      ],
    )
  ).rows[0];
}

export async function crearFixturesHistorial(entorno) {
  if (process.env.NODE_ENV !== 'test') throw new Error('Fixtures permitidos únicamente en pruebas.');
  await verificarEsquemaPruebas(entorno.pool, entorno.esquema);
  const { pool } = entorno;
  const hash = await bcrypt.hash(contrasenaPruebas, 4);
  const cuentas = {};
  const nombres = [
    'principal',
    'otra',
    'sinVinculo',
    'vacio',
    'voluntario',
    'inactivo',
    'fechas',
    'grande',
    'empates',
    'extenso',
    'periodico',
  ];
  for (const [i, nombre] of nombres.entries()) {
    const correo = `${nombre.toLowerCase()}@historial.example.test`;
    const usuario = (
      await pool.query(
        `INSERT INTO usuarios (correo,hash_contrasena,nombre,roles,activo)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [correo, hash, nombre, [nombre === 'voluntario' ? 'voluntario' : 'donante'], nombre !== 'inactivo'],
      )
    ).rows[0];
    const numero = 10000000 + i;
    const nif = `${numero}${'TRWAGMYFPDXBNJZSQVHLCKE'[numero % 23]}`;
    const donante = (
      await pool.query(
        `INSERT INTO donantes (usuario_id,nombre,apellidos,nif_nie,correo,direccion)
       VALUES ($1,$2,'Sintetico',$3,$4,'Calle Prueba 1') RETURNING *`,
        [nombre === 'sinVinculo' ? null : usuario.id, nombre, nif, correo],
      )
    ).rows[0];
    cuentas[nombre] = { usuario, donante };
  }
  const proyecto = (
    await pool.query(
      "INSERT INTO proyectos (nombre,activo) VALUES ('Destino historico sintetico',false) RETURNING *",
    )
  ).rows[0];
  const aportar = (nombre, datos) => insertarAportacionHistorial(pool, cuentas[nombre].donante.id, datos);
  const suscripcion = async (nombre, importe, estado = 'activa') =>
    (
      await pool.query(
        `INSERT INTO suscripciones_socio (donante_id,importe,periodicidad,estado,fecha_alta)
     VALUES ($1,$2,'mensual',$3,'2021-01-15T11:00:00Z') RETURNING *`,
        [cuentas[nombre].donante.id, importe, estado],
      )
    ).rows[0];
  const socioCancelado = await suscripcion('principal', '30.00', 'cancelada');
  const principal = [
    await aportar('principal', { importe: '50.00', fecha: '2025-01-15T11:00:00Z' }),
    await aportar('principal', {
      importe: '30.00',
      fecha: '2025-12-15T11:00:00Z',
      proyectoId: proyecto.id,
      suscripcionId: socioCancelado.id,
    }),
    await aportar('principal', { importe: '20.00', fecha: '2026-01-15T11:00:00Z' }),
  ];
  await pool.query(
    "INSERT INTO correos_aportacion (aportacion_id,tipo,resumen,estado,intentos) VALUES ($1,'confirmacion',$2,'fallido',1)",
    [
      principal[1].id,
      {
        referencia: principal[1].referencia,
        importe: '30.00',
        modalidad: 'cuota_socio',
        destino: proyecto.nombre,
      },
    ],
  );
  for (const estado of ['pendiente', 'rechazada', 'cancelada'])
    await aportar('principal', { estado, importe: '99.99' });
  await aportar('otra', { importe: '7.00' });
  await aportar('sinVinculo', { importe: '9.00' });
  await aportar('fechas', { fecha: '2025-12-31T22:59:59Z' });
  await aportar('fechas', { fecha: '2025-12-31T23:00:00Z', importe: '2.00' });
  await aportar('grande', { importe: '999999.99' });
  await aportar('grande', { importe: '999999.99' });
  await aportar('empates', { id: '9007199254740992' });
  await aportar('empates', { id: '9007199254740993' });
  for (let i = 0; i < 61; i++) await aportar('extenso', {});
  const socioPeriodico = await suscripcion('periodico', '10.00');
  for (let anio = 2021; anio <= 2025; anio++) {
    for (let mes = 1; mes <= 12; mes++) {
      await aportar('periodico', {
        importe: '10.00',
        fecha: `${anio}-${String(mes).padStart(2, '0')}-15T11:00:00Z`,
        suscripcionId: socioPeriodico.id,
      });
    }
  }
  return { cuentas, proyecto, principal, socioCancelado, socioPeriodico };
}
