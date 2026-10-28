// Texto del estado tal como lo ve el coordinador. «Celebrada» es derivado (publicada con inicio pasado).
export function textoEstado(actividad) {
  if (actividad.celebrada) return 'Celebrada';
  return (
    { borrador: 'Borrador', publicada: 'Publicada', cancelada: 'Cancelada' }[actividad.estado] ??
    actividad.estado
  );
}

export const esEditable = (actividad) => actividad.estado !== 'cancelada' && !actividad.celebrada;
