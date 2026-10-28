// CSV para Excel en español: separador «;», decimales con coma, UTF-8 con BOM.
// columnas: [{ clave, titulo, tipo? }], con tipo 'importe' o 'horas' para usar coma decimal.
function celda(valor, tipo) {
  if (valor === null || valor === undefined) return '';
  let texto = String(valor);
  if (tipo === 'importe' || tipo === 'horas') texto = texto.replace('.', ',');
  return /[";\n\r]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
}

export function generarCsv(columnas, filas) {
  const lineas = [columnas.map((columna) => celda(columna.titulo)).join(';')];
  for (const fila of filas) {
    lineas.push(columnas.map((columna) => celda(fila[columna.clave], columna.tipo)).join(';'));
  }
  return '﻿' + lineas.join('\r\n') + '\r\n';
}
