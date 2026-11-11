// Los acumulados no tienen el limite de una aportacion ni se convierten a Number.
export function formatearTotalAnual(importe) {
  const partes = typeof importe === 'string' && /^(0|[1-9][0-9]*)\.([0-9]{2})$/.exec(importe);
  if (!partes || partes[0] !== importe) throw new TypeError('Importe del historial no válido.');
  return `${partes[1].replace(/\B(?=(?:[0-9]{3})+(?![0-9]))/g, '.')},${partes[2]} €`;
}

export function validarRespuestaHistorial(dto, anio) {
  const fallo = () => {
    throw new TypeError('Respuesta del historial no válida.');
  };
  if (
    !dto ||
    typeof dto.vinculado !== 'boolean' ||
    dto.filtroAnio !== anio ||
    !Array.isArray(dto.datos) ||
    !Array.isArray(dto.aniosDisponibles) ||
    !Number.isSafeInteger(dto.total) ||
    dto.total < 0 ||
    (dto.vinculado ? typeof dto.hayAportaciones !== 'boolean' : dto.hayAportaciones !== null)
  )
    fallo();
  const ids = new Set();
  for (const grupo of dto.datos) {
    if (!Number.isInteger(grupo.anio) || !Array.isArray(grupo.aportaciones)) fallo();
    formatearTotalAnual(grupo.importeTotal);
    for (const fila of grupo.aportaciones) {
      if (
        typeof fila.id !== 'string' ||
        !/^[1-9][0-9]*$/.test(fila.id) ||
        ids.has(fila.id) ||
        !['puntual', 'cuota_socio'].includes(fila.modalidad) ||
        typeof fila.destino !== 'string' ||
        !fila.destino ||
        typeof fila.fechaCobro !== 'string' ||
        !Number.isFinite(Date.parse(fila.fechaCobro))
      )
        fallo();
      formatearTotalAnual(fila.importe);
      ids.add(fila.id);
    }
  }
  if (
    ids.size !== dto.total ||
    (!dto.vinculado && (dto.total || dto.aniosDisponibles.length)) ||
    (!dto.hayAportaciones && dto.total)
  )
    fallo();
  return dto;
}

// Coordinacion pura; la isla invalida el gestor al desmontarse. No necesita modificar api.get.
export function crearConsultasHistorial({ obtener, actualizar }) {
  let secuencia = 0,
    activa = true,
    ultimoAnio = null;
  return {
    get ultimoAnio() {
      return ultimoAnio;
    },
    invalidar() {
      activa = false;
      secuencia++;
    },
    async consultar(anio) {
      if (!activa) return;
      const solicitud = ++secuencia;
      ultimoAnio = anio;
      actualizar({ cargando: true, datos: null, error: null, anioSolicitado: anio });
      try {
        const dto = await obtener('/yo/aportaciones' + (anio === null ? '' : `?anio=${anio}`));
        if (!activa || solicitud !== secuencia) return;
        const datos = validarRespuestaHistorial(dto, anio);
        actualizar({ cargando: false, datos, error: null, anioSolicitado: anio });
      } catch (error) {
        if (activa && solicitud === secuencia)
          actualizar({
            cargando: false,
            datos: null,
            error:
              error instanceof TypeError
                ? new Error('No se pudo mostrar el historial. Inténtalo de nuevo.')
                : error,
            anioSolicitado: anio,
          });
      }
    },
  };
}
