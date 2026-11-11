import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { formatearFecha, formatearHoras } from '../../lib/formato.js';
import Aviso from '../comunes/Aviso.jsx';
import Tabla from '../comunes/Tabla.jsx';

const COLUMNAS = [
  { clave: 'titulo', titulo: 'Actividad' },
  { clave: 'inicio', titulo: 'Fecha', formato: formatearFecha },
  { clave: 'horas', titulo: 'Horas', alinear: 'derecha', formato: formatearHoras },
];

export default function MisHoras() {
  const [horas, setHoras] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/yo/horas').then(setHoras).catch(setError);
  }, []);

  if (error) return <Aviso tipo="error">{error.message}</Aviso>;
  if (!horas) return <p>Cargando…</p>;

  return (
    <div className="space-y-6">
      <p className="text-2xl font-semibold text-marca-700">Total: {formatearHoras(horas.totalHoras)}</p>
      <Tabla
        columnas={COLUMNAS}
        filas={horas.datos}
        claveFila="actividadId"
        mensajeVacio="Aún no tienes horas registradas."
      />
    </div>
  );
}
