// PDF común (certificado fiscal, informes), con el mismo encabezado de la ONG.
// definicion: { titulo, bloques: [ { tipo: 'texto', texto } | { tipo: 'tabla', columnas: [...], filas: [[...]] } ] }
import PDFDocument from 'pdfkit';
import { config } from '../config.js';

export function generarPdf(definicion) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  doc.fontSize(9).fillColor('#555555')
    .text(`${config.ong.nombre} · CIF ${config.ong.cif}`)
    .text(config.ong.direccion)
    .moveDown(2);
  doc.fontSize(16).fillColor('#1F4E79').text(definicion.titulo).moveDown();
  doc.fillColor('#000000').fontSize(11);

  for (const bloque of definicion.bloques ?? []) {
    if (bloque.tipo === 'texto') {
      doc.text(bloque.texto).moveDown();
    } else if (bloque.tipo === 'tabla') {
      const ancho = (doc.page.width - 100) / bloque.columnas.length;
      const escribirFila = (celdas, negrita) => {
        const y = doc.y;
        doc.font(negrita ? 'Helvetica-Bold' : 'Helvetica');
        celdas.forEach((valor, i) => {
          doc.text(String(valor ?? ''), 50 + i * ancho, y, { width: ancho - 6 });
        });
        doc.x = 50;
        doc.moveDown(0.5);
      };
      escribirFila(bloque.columnas, true);
      bloque.filas.forEach((fila) => escribirFila(fila, false));
      doc.font('Helvetica').moveDown();
    }
  }

  doc.end();
  return doc; // Es un stream: doc.pipe(res)
}
