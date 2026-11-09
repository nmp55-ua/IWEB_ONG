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
      // Letra opcional para tablas con muchas columnas (p. ej. el informe de HU-04); por defecto, 11.
      doc.fontSize(bloque.tamanoLetra ?? 11);
      const ancho = (doc.page.width - 100) / bloque.columnas.length;
      // La fila ocupa lo que su celda más alta; si no cabe en la página, pasa a la siguiente.
      const escribirFila = (celdas, negrita) => {
        doc.font(negrita ? 'Helvetica-Bold' : 'Helvetica');
        const textos = celdas.map((valor) => String(valor ?? ''));
        const alto = Math.max(...textos.map((t) => doc.heightOfString(t, { width: ancho - 6 })));
        if (doc.y + alto > doc.page.height - doc.page.margins.bottom) doc.addPage();
        const y = doc.y;
        textos.forEach((texto, i) => doc.text(texto, 50 + i * ancho, y, { width: ancho - 6 }));
        doc.x = 50;
        doc.y = y + alto;
        doc.moveDown(0.5);
      };
      escribirFila(bloque.columnas, true);
      bloque.filas.forEach((fila) => escribirFila(fila, false));
      doc.font('Helvetica').fontSize(11).moveDown();
    }
  }

  doc.end();
  return doc; // Es un stream: doc.pipe(res)
}
