// HU-04: funciones puras del informe para la isla Informes.jsx (se prueban con node --test).
// El servidor vuelve a validar todo: esto solo evita peticiones que ya se sabe que fallan.

export const MENSAJE_FIN_ANTERIOR = 'La fecha de fin no puede ser anterior a la de inicio.';
export const MENSAJE_VACIO = 'No hay aportaciones confirmadas ni actividades celebradas en este periodo.';

// Errores por campo, como los de la API ({ desde?, hasta? }). Las fechas llegan como «aaaa-mm-dd».
export function validarPeriodo({ desde, hasta }) {
  const errores = {};
  if (!desde) errores.desde = 'Indica la fecha de inicio.';
  if (!hasta) errores.hasta = 'Indica la fecha de fin.';
  if (desde && hasta && hasta < desde) errores.hasta = MENSAJE_FIN_ANTERIOR;
  return errores;
}

// Parámetros de la consulta, sin los vacíos: desde, hasta, proyectoId y agrupacion.
export function consultaInforme({ desde, hasta, proyectoId, agrupacion }) {
  const parametros = new URLSearchParams();
  for (const [clave, valor] of Object.entries({ desde, hasta, proyectoId, agrupacion })) {
    if (valor !== undefined && valor !== null && valor !== '') parametros.set(clave, String(valor));
  }
  return parametros;
}

// Ruta de la API para el JSON (formato = null) o la descarga en CSV o PDF.
export function rutaInforme(filtros, formato = null) {
  return `/informes${formato ? `/${formato}` : ''}?${consultaInforme(filtros)}`;
}

export const urlExportacion = (filtros, formato) => `/api${rutaInforme(filtros, formato)}`;

// Los filtros que devolvió el servidor, en el formato de la consulta (para exportar justo lo que se ve).
export function filtrosDeInforme(informe) {
  const { desde, hasta, proyecto, agrupacion } = informe.filtros;
  return { desde, hasta, proyectoId: proyecto?.id ?? '', agrupacion: agrupacion ?? '' };
}

function nombreFila(fila) {
  if (fila.tipo === 'proyecto') return fila.proyecto.nombre;
  if (fila.tipo === 'fondoGeneral') return 'Fondo general';
  if (fila.tipo === 'subtotal') return `Subtotal ${fila.periodo.etiqueta}`;
  return 'Total';
}

// Filas para la Tabla común: con su nombre, la etiqueta del periodo y una clave única.
export function filasParaTabla(informe) {
  return informe.filas.map((fila, i) => ({
    ...fila,
    nombre: nombreFila(fila),
    etiquetaPeriodo: fila.periodo?.etiqueta ?? '',
    resaltada: fila.tipo === 'subtotal' || fila.tipo === 'total',
    clave: `${i}-${fila.tipo}-${fila.periodo?.desde ?? ''}-${fila.proyecto?.id ?? ''}`,
  }));
}
