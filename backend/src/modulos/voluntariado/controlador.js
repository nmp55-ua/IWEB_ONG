import { z } from 'zod';
import * as servicio from './servicio.js';

const vacioAIndefinido = (valor) => (valor === '' ? undefined : valor);

const texto = (mensaje) =>
  z.string({ required_error: mensaje, invalid_type_error: mensaje }).trim().min(1, mensaje);

// «aaaa-mm-dd» que exista de verdad (no valen 2026-02-31 ni 2026-13-01).
function existeDia(texto) {
  const fecha = new Date(`${texto}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().startsWith(texto);
}

const dia = z.preprocess(
  vacioAIndefinido,
  z
    .string({ invalid_type_error: 'Fecha no válida.' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha no válida.')
    .refine(existeDia, 'Fecha no válida.')
    .optional(),
);

// «desde» no puede ser posterior a «hasta» (filtros de HU-05 y calendario de HU-06).
const desdeAntesQueHasta = [
  (f) => !f.desde || !f.hasta || f.desde <= f.hasta,
  { message: 'La fecha «desde» no puede ser posterior a «hasta».', path: ['hasta'] },
];

const esquemaFiltros = z
  .object({
    proyectoId: z.preprocess(
      vacioAIndefinido,
      z.coerce
        .number({ invalid_type_error: 'Proyecto no válido.' })
        .int('Proyecto no válido.')
        .positive('Proyecto no válido.')
        .optional(),
    ),
    desde: dia,
    hasta: dia,
  })
  .refine(...desdeAntesQueHasta);

// HU-06: cualquier otro parámetro (voluntarioId, usuarioId…) se descarta (research R1).
const esquemaCalendario = z.object({ desde: dia, hasta: dia }).refine(...desdeAntesQueHasta);

const esquemaPerfil = z
  .object({
    nombre: texto('Indica tu nombre.'),
    apellidos: texto('Indica tus apellidos.'),
    correo: z
      .string({
        required_error: 'Introduce un correo válido.',
        invalid_type_error: 'Introduce un correo válido.',
      })
      .trim()
      .email('Introduce un correo válido.'),
    telefono: z
      .string({
        required_error: 'Introduce un teléfono válido.',
        invalid_type_error: 'Introduce un teléfono válido.',
      })
      .trim()
      .refine((v) => /^\+?\d{9,15}$/.test(v.replace(/\s/g, '')), 'Introduce un teléfono válido.'),
  })
  .strict();

const esquemaInscripcion = z
  .object({
    aceptaRequisitos: z.literal(true, {
      errorMap: () => ({ message: 'Confirma que cumples los requisitos de la actividad.' }),
    }),
    listaEspera: z.boolean({ invalid_type_error: 'Valor no válido.' }).optional(),
  })
  .strict();

const esquemaCambio = z
  .object({ accion: z.literal('cancelar', { errorMap: () => ({ message: 'Acción no válida.' }) }) })
  .strict();

const idDe = (req) => Number(req.params.id);

// Público. Con sesión, cada actividad indica si el usuario ya está inscrito.
export async function disponibles(req, res) {
  res.json(await servicio.listarDisponibles(esquemaFiltros.parse(req.query), req.usuario));
}

export async function perfil(req, res) {
  servicio.exigirVoluntario(req.usuario);
  res.json(await servicio.obtenerPerfil(req.usuario));
}

export async function guardarPerfil(req, res) {
  servicio.exigirVoluntario(req.usuario);
  res.json(await servicio.guardarPerfil(req.usuario, esquemaPerfil.parse(req.body ?? {})));
}

export async function inscribir(req, res) {
  servicio.exigirVoluntario(req.usuario);
  const datos = esquemaInscripcion.parse(req.body ?? {});
  res.status(201).json(await servicio.inscribir(idDe(req), datos, req.usuario));
}

export async function modificarInscripcion(req, res) {
  servicio.exigirVoluntario(req.usuario);
  esquemaCambio.parse(req.body ?? {});
  res.json(await servicio.cancelar(idDe(req), req.usuario));
}

// HU-06: el rol lo comprueba requiereRol('voluntario') en la ruta; el calendario es siempre el propio.
export async function calendario(req, res) {
  res.json(await servicio.calendario(req.usuario, esquemaCalendario.parse(req.query)));
}
