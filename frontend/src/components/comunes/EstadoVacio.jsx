// Lo que se muestra cuando una lista no tiene datos: nunca una pantalla en blanco.
export default function EstadoVacio({ mensaje, accion }) {
  return (
    <div className="text-center bg-white border border-dashed border-gray-300 rounded p-8 text-gray-700">
      <p className="mb-3">{mensaje}</p>
      {accion}
    </div>
  );
}
