import ActividadCalendario from './ActividadCalendario.jsx';

// Vista de lista de HU-06 (la que se abre primero): por fecha, con la siguiente marcada (SC-002). La
// siguiente es la primera confirmada que no ha empezado (research R4).
export default function ListaCalendario({ entradas, onCancelada }) {
  const siguiente = entradas.find((e) => e.estado === 'confirmada' && !e.enCurso);
  return (
    <ol className="space-y-3">
      {entradas.map((entrada) => (
        <li key={entrada.id}>
          <ActividadCalendario
            entrada={entrada}
            siguiente={entrada === siguiente}
            onCancelada={onCancelada}
          />
        </li>
      ))}
    </ol>
  );
}
