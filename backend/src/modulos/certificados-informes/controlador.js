// HU-03: valida la entrada y da forma a la respuesta (contrato: specs/spec-003/contracts/api-certificados.md).
// HU-04: filtros del informe (contrato: specs/spec-004/contracts/api-informes.md).
import { z } from 'zod';
import { generarPdf } from '../../servicios-comunes/pdf.js';
import { csvInforme, definicionPdfInforme, nombreFicheroInforme } from './textos.js';
import { servicio as servicioComun } from './servicio.js';

const esquemaEjercicio = z.object({
  ejercicio: z.string().regex(/^\d{4}$/, 'Indica un ejercicio de 4 cifras.'),
});

// «aaaa-mm-dd» que además es una fecha real (no 2026-02-30).
const esFechaReal = (texto) => {
  const [anio, mes, dia] = texto.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
};
const fechaDia = (nombre) =>
  z
    .string({ required_error: `Indica la fecha ${nombre}.` })
    .regex(/^\d{4}-\d{2}-\d{2}$/, `Indica la fecha ${nombre} como aaaa-mm-dd.`)
    .refine(esFechaReal, `La fecha ${nombre} no existe.`);

const esquemaInforme = z.object({
  desde: fechaDia('de inicio'),
  hasta: fechaDia('de fin'),
  proyectoId: z
    .string()
    .regex(/^[1-9]\d{0,17}$/, 'Elige un proyecto de la lista.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  agrupacion: z
    .enum(['mes', 'trimestre', 'anio'], { errorMap: () => ({ message: 'Elige mes, trimestre o año.' }) })
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

// Solo los parámetros del informe, como texto (Express puede dar arrays si se repiten).
export function filtrosInforme(query) {
  const { desde, hasta, proyectoId, agrupacion } = esquemaInforme.parse(query);
  return { desde, hasta, proyectoId: proyectoId ?? null, agrupacion: agrupacion ?? null };
}

export function crearControlador(servicio = servicioComun) {
  return {
    async listar(req, res) {
      res.json(await servicio.listarPropios(req.usuario));
    },

    async pdf(req, res) {
      const ejercicio = Number(esquemaEjercicio.parse(req.params).ejercicio);
      const definicion = await servicio.pdfPropio(req.usuario, ejercicio);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificado-${ejercicio}.pdf"`,
      });
      generarPdf(definicion).pipe(res);
    },

    // Cualquier entrada (vacía, repetida o no textual) se trata como un código no válido.
    async verificar(req, res) {
      const codigo = typeof req.query.codigo === 'string' ? req.query.codigo : '';
      res.json(await servicio.verificar(codigo));
    },

    // HU-04: el JSON de la pantalla.
    async informe(req, res) {
      res.json(await servicio.generarInforme(filtrosInforme(req.query)));
    },

    // CSV y PDF salen de la MISMA llamada al servicio que la pantalla (FR-006, research R2).
    async csv(req, res) {
      const filtros = filtrosInforme(req.query);
      const informe = await servicio.generarInforme(filtros);
      res.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${nombreFicheroInforme(filtros, 'csv')}"`,
      });
      res.send(csvInforme(informe));
    },

    async pdfInforme(req, res) {
      const filtros = filtrosInforme(req.query);
      const informe = await servicio.generarInforme(filtros);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${nombreFicheroInforme(filtros, 'pdf')}"`,
      });
      generarPdf(definicionPdfInforme(informe)).pipe(res);
    },

    async proyectosInforme(req, res) {
      res.json(await servicio.listarProyectosInforme());
    },
  };
}
