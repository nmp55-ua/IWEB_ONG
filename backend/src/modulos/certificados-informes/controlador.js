// HU-03: valida la entrada y da forma a la respuesta (contrato: specs/spec-003/contracts/api-certificados.md).
import { z } from 'zod';
import { generarPdf } from '../../servicios-comunes/pdf.js';
import { servicio as servicioComun } from './servicio.js';

const esquemaEjercicio = z.object({
  ejercicio: z.string().regex(/^\d{4}$/, 'Indica un ejercicio de 4 cifras.'),
});

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
  };
}
