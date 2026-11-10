import { z } from 'zod';
import { ErrorApi } from '../../middleware/errores.js';
import * as asistencias from './asistencias.js';
import * as servicio from './servicio.js';

const texto = (mensaje) =>
  z.string({ required_error: mensaje, invalid_type_error: mensaje }).trim().min(1, mensaje);
const fechaHora = (mensaje) =>
  z
    .string({ required_error: mensaje, invalid_type_error: mensaje })
    .datetime({ offset: true, message: mensaje });

const campos = {
  titulo: texto('Indica el título.'),
  descripcion: texto('Indica la descripción.'),
  proyectoId: z
    .number({ required_error: 'Elige un proyecto.', invalid_type_error: 'Elige un proyecto.' })
    .int('Elige un proyecto.')
    .positive('Elige un proyecto.'),
  inicio: fechaHora('Indica la fecha y hora de inicio.'),
  fin: fechaHora('Indica la fecha y hora de fin.'),
  lugar: texto('Indica el lugar.'),
  plazas: z
    .number({
      required_error: 'Las plazas deben ser un número entero mayor que cero.',
      invalid_type_error: 'Las plazas deben ser un número entero mayor que cero.',
    })
    .int('Las plazas deben ser un número entero mayor que cero.')
    .positive('Las plazas deben ser un número entero mayor que cero.'),
  requisitos: z.string().trim().default(''),
};

const esquemaActividad = z.object(campos).strict();
const esquemaEdicion = z.object(campos).partial().strict();
const esquemaAccion = z
  .object({
    accion: z.enum(['publicar', 'cancelar'], { message: 'Acción no válida.' }),
  })
  .strict();

const esquemaFiltros = z.object({
  estado: z.enum(['borrador', 'publicada', 'cancelada'], { message: 'Estado no válido.' }).optional(),
  proyectoId: z.coerce.number().int().positive().optional(),
});

const esquemaAsistencias = z
  .object({
    asistencias: z
      .array(
        z
          .object({
            inscripcionId: z
              .number({ message: 'Inscripción no válida.' })
              .int('Inscripción no válida.')
              .positive('Inscripción no válida.'),
            asistio: z.boolean({ message: 'Indica si asistió o no.' }),
          })
          .strict({ message: 'Cada fila solo admite inscripcionId y asistio.' }),
        { message: 'Indica la asistencia.' },
      )
      .min(1, 'Marca al menos una persona.')
      .max(500, 'Demasiadas filas.')
      .refine((filas) => new Set(filas.map((f) => f.inscripcionId)).size === filas.length, {
        message: 'Hay inscripciones repetidas.',
      }),
  }, { invalid_type_error: 'El cuerpo debe ser un objeto con asistencias.' })
  .strict({ message: 'El cuerpo solo admite asistencias.' });

const idDe = (req) => Number(req.params.id);

export async function listar(req, res) {
  res.json(await servicio.listar(esquemaFiltros.parse(req.query)));
}

export async function crear(req, res) {
  res.status(201).json(await servicio.crear(esquemaActividad.parse(req.body), req.usuario));
}

export async function obtener(req, res) {
  res.json(await servicio.obtener(idDe(req)));
}

// PATCH: o un cambio de estado ({ accion }) o una edición de campos, nunca las dos cosas.
export async function modificar(req, res) {
  const cuerpo = req.body ?? {};
  if ('accion' in cuerpo) {
    const { accion } = esquemaAccion.parse(cuerpo);
    res.json(accion === 'publicar' ? await servicio.publicar(idDe(req)) : await servicio.cancelar(idDe(req)));
    return;
  }
  const cambios = esquemaEdicion.parse(cuerpo);
  if (Object.keys(cambios).length === 0) {
    throw new ErrorApi(400, 'DATOS_INVALIDOS', 'No hay ningún cambio que guardar.');
  }
  res.json(await servicio.editar(idDe(req), cambios));
}

export async function inscripciones(req, res) {
  res.json(await servicio.listarInscripciones(idDe(req)));
}

export async function obtenerAsistencias(req, res) {
  res.json(await asistencias.obtenerAsistencia(idDe(req)));
}

export async function guardarAsistencias(req, res) {
  const { asistencias: filas } = esquemaAsistencias.parse(req.body ?? {});
  res.json(await asistencias.guardarAsistencia(idDe(req), filas, req.usuario));
}

export async function misHoras(req, res) {
  res.json(await asistencias.horasDeUsuario(req.usuario.id));
}
