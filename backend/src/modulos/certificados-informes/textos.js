// HU-03: funciones puras del certificado fiscal (código, enmascarado, correo y PDF).
// Decisiones en specs/spec-003/research.md (R4–R8).
import { randomInt } from 'node:crypto';

// Crockford base32: sin I, L, O ni U para que se pueda dictar y teclear sin confusiones.
export const ALFABETO_CODIGO = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const LONGITUD_CODIGO = 16;

const agrupar = (texto) => texto.match(/.{4}/g).join('-');

// 16 caracteres aleatorios (80 bits) en grupos de cuatro: «7K2M-9QXR-4D8T-1HZP».
export function generarCodigo(aleatorio = randomInt) {
  let codigo = '';
  for (let i = 0; i < LONGITUD_CODIGO; i++) codigo += ALFABETO_CODIGO[aleatorio(ALFABETO_CODIGO.length)];
  return agrupar(codigo);
}

// Lo que teclea quien verifica: admite minúsculas, espacios y guiones. null si no es un código posible.
export function normalizarCodigo(texto) {
  const limpio = String(texto ?? '')
    .toUpperCase()
    .replace(/[\s-]/g, '');
  if (limpio.length !== LONGITUD_CODIGO) return null;
  if (![...limpio].every((c) => ALFABETO_CODIGO.includes(c))) return null;
  return agrupar(limpio);
}

// Solo los 4 últimos dígitos visibles, con formato fijo: «12344567Z» y «X1234567L» → «***4567*».
export function enmascararNifNie(nifNie) {
  const digitos = String(nifNie ?? '').replace(/\D/g, '');
  return `***${digitos.slice(-4)}*`;
}

const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });

// «80.00» (texto de NUMERIC) → «80,00 €». Solo para mostrar: las sumas se hacen en SQL.
export function formatearEuros(importe) {
  return euros.format(Number(importe));
}

// «2026-01-02» → «02/01/2026»
export function formatearFechaDia(dia) {
  const [anio, mes, d] = String(dia).split('-');
  return `${d}/${mes}/${anio}`;
}

// Correo de aviso (FR-009): sin PDF adjunto ni NIF/NIE.
export function textoCorreo({ nombre, ejercicio, importeTotal, regenerado, vinculado, urlFrontend }) {
  const asunto = regenerado
    ? `Tu certificado fiscal de ${ejercicio} se ha actualizado`
    : `Tu certificado fiscal de ${ejercicio} está disponible`;
  const lineas = [
    `Hola, ${nombre}:`,
    '',
    regenerado
      ? `Hemos actualizado tu certificado fiscal de donaciones del ejercicio ${ejercicio} porque se ha confirmado una aportación de ese año. El nuevo importe total es ${formatearEuros(importeTotal)}.`
      : `Ya está disponible tu certificado fiscal de donaciones del ejercicio ${ejercicio}, por un importe total de ${formatearEuros(importeTotal)}.`,
  ];
  if (regenerado) {
    lineas.push('', 'El código de verificación anterior ya no es válido: usa el del certificado nuevo.');
  }
  lineas.push('', `Puedes descargarlo en tu área personal: ${urlFrontend}/mis-certificados`);
  if (!vinculado) {
    lineas.push(
      '',
      'Para verlo necesitas una cuenta de donante vinculada a tus donaciones. Crea una cuenta de donante (o entra con la tuya) y vincúlala desde',
      `${urlFrontend}/donar/vincular`,
    );
  }
  lineas.push('', 'Gracias por tu colaboración.');
  return { asunto, texto: lineas.join('\n') };
}

// Definición para generarPdf de servicios-comunes/pdf.js (FR-003). El encabezado común ya lleva
// nombre y CIF de la ONG; se repiten en el cuerpo porque son parte del certificado.
export function definicionPdf({ ong, donante, certificado, urlFrontend }) {
  const nombreCompleto = `${donante.nombre} ${donante.apellidos}`;
  const importe = formatearEuros(certificado.importeTotal);
  return {
    titulo: `Certificado de donaciones · Ejercicio ${certificado.ejercicio}`,
    bloques: [
      {
        tipo: 'texto',
        texto:
          `${ong.nombre}, con CIF ${ong.cif}, certifica que ${nombreCompleto}, con NIF/NIE ${donante.nifNie}, ` +
          `ha realizado durante el ejercicio ${certificado.ejercicio} donaciones a esta entidad por un importe total de ${importe}.`,
      },
      {
        tipo: 'tabla',
        columnas: ['Dato', 'Valor'],
        filas: [
          ['Entidad', ong.nombre],
          ['CIF', ong.cif],
          ['Donante', nombreCompleto],
          ['NIF/NIE', donante.nifNie],
          ['Ejercicio', String(certificado.ejercicio)],
          ['Importe total', importe],
          ['Fecha de emisión', formatearFechaDia(certificado.fechaEmision)],
          ['Código de verificación', certificado.codigoVerificacion],
        ],
      },
      // La dirección va sola en su línea para que no se parta y se pueda teclear desde el papel.
      { tipo: 'texto', texto: 'Puede comprobarse la autenticidad de este certificado en esta dirección:' },
      { tipo: 'texto', texto: `${urlFrontend}/verificar-certificado?codigo=${certificado.codigoVerificacion}` },
    ],
  };
}
