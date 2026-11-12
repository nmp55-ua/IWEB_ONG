// HU-03: funciones puras del certificado fiscal (código, enmascarado, correo y PDF).
// Decisiones en specs/spec-003/research.md (R4–R8).
import { randomInt } from 'node:crypto';
import { generarCsv } from '../../servicios-comunes/csv.js';

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

// ── HU-04: informe de recaudación y voluntariado (specs/spec-004/research.md R4, R6 y R8) ──

export const MENSAJE_INFORME_VACIO = 'No hay aportaciones confirmadas ni actividades celebradas en este periodo.';

const TEXTO_AGRUPACION = { mes: 'Por mes', trimestre: 'Por trimestre', anio: 'Por año' };

// Primer día del periodo («2026-04-01») → «04/2026», «T2 2026» o «2026».
export function etiquetaPeriodo(agrupacion, inicioPeriodo) {
  const [anio, mes] = String(inicioPeriodo).split('-');
  if (agrupacion === 'mes') return `${mes}/${anio}`;
  if (agrupacion === 'trimestre') return `T${Math.floor((Number(mes) - 1) / 3) + 1} ${anio}`;
  return anio;
}

// Las mismas columnas en pantalla, CSV y PDF. «Periodo» solo si se agrupa.
export function columnasInforme(agrupacion) {
  return [
    ...(agrupacion ? [{ clave: 'periodo', titulo: 'Periodo' }] : []),
    { clave: 'nombre', titulo: 'Proyecto' },
    { clave: 'recaudadoPuntual', titulo: 'Donaciones puntuales', tipo: 'importe' },
    { clave: 'recaudadoCuotas', titulo: 'Cuotas de socio', tipo: 'importe' },
    { clave: 'recaudadoTotal', titulo: 'Total recaudado', tipo: 'importe' },
    { clave: 'aportaciones', titulo: 'Aportaciones' },
    { clave: 'actividades', titulo: 'Actividades celebradas' },
    { clave: 'voluntarios', titulo: 'Voluntarios' },
    { clave: 'horas', titulo: 'Horas', tipo: 'horas' },
  ];
}

// Lo que va en la columna «Proyecto» según el tipo de fila.
export function nombreFilaInforme(fila) {
  if (fila.tipo === 'proyecto') return fila.proyecto.nombre;
  if (fila.tipo === 'fondoGeneral') return 'Fondo general';
  if (fila.tipo === 'subtotal') return `Subtotal ${fila.periodo.etiqueta}`;
  return 'Total';
}

// Horas con un decimal, como en la interfaz (plan-comun §4): «3.50» → «3,5».
export function horasUnDecimal(horas) {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1, useGrouping: false }).format(Number(horas));
}

export function formatearHorasInforme(horas) {
  return `${horasUnDecimal(horas)} h`;
}

export function textoAgrupacion(agrupacion) {
  return TEXTO_AGRUPACION[agrupacion] ?? 'Sin agrupar';
}

// Valor de una celda del informe ya preparado para cada salida (las cifras, las mismas).
function celdasInforme(fila, { importe, horas }) {
  return {
    periodo: fila.periodo?.etiqueta ?? '',
    nombre: nombreFilaInforme(fila),
    recaudadoPuntual: importe(fila.recaudadoPuntual),
    recaudadoCuotas: importe(fila.recaudadoCuotas),
    recaudadoTotal: importe(fila.recaudadoTotal),
    aportaciones: fila.aportaciones,
    actividades: fila.actividades,
    voluntarios: fila.voluntarios,
    horas: horas(fila.horas),
  };
}

// FR-006: CSV común («;», coma decimal, BOM). Importes «1234,50» y horas «3,5»; vacío = solo cabecera.
export function csvInforme(informe) {
  const columnas = columnasInforme(informe.filtros.agrupacion);
  const filas = informe.filas.map((fila) => celdasInforme(fila, { importe: (v) => v, horas: horasUnDecimal }));
  return generarCsv(columnas, filas);
}

export function nombreFicheroInforme({ desde, hasta }, extension) {
  return `informe-${desde}-${hasta}.${extension}`;
}

// FR-006: definición para generarPdf con el periodo, los filtros y la misma tabla.
export function definicionPdfInforme(informe) {
  const { desde, hasta, proyecto, agrupacion } = informe.filtros;
  const columnas = columnasInforme(agrupacion);
  const bloques = [
    {
      tipo: 'texto',
      texto:
        `Periodo: ${formatearFechaDia(desde)} – ${formatearFechaDia(hasta)} · ` +
        `Proyecto: ${proyecto ? proyecto.nombre : 'Todos'} · Agrupación: ${textoAgrupacion(agrupacion)}`,
    },
  ];
  if (informe.vacio) {
    bloques.push({ tipo: 'texto', texto: MENSAJE_INFORME_VACIO });
  } else {
    bloques.push({
      tipo: 'tabla',
      tamanoLetra: 7.5, // 9 columnas en A4 vertical sin partir palabras
      columnas: columnas.map((c) => c.titulo),
      filas: informe.filas.map((fila) => {
        const celdas = celdasInforme(fila, { importe: formatearEuros, horas: formatearHorasInforme });
        return columnas.map((c) => String(celdas[c.clave]));
      }),
    });
  }
  return { titulo: 'Informe de recaudación y voluntariado', bloques };
}
