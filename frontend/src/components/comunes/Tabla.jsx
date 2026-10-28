import EstadoVacio from './EstadoVacio.jsx';

// Tabla común. columnas: [{ clave, titulo, formato?(valor, fila), alinear? 'derecha' }]
export default function Tabla({ columnas, filas, claveFila = 'id', mensajeVacio = 'No hay datos que mostrar.', pie }) {
  if (!filas || filas.length === 0) return <EstadoVacio mensaje={mensajeVacio} />;
  const alinear = (c) => (c.alinear === 'derecha' ? 'text-right' : 'text-left');
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-white text-sm">
        <thead>
          <tr>
            {columnas.map((c) => (
              <th key={c.clave} className={`bg-marca-700 text-white px-3 py-2 font-semibold ${alinear(c)}`}>{c.titulo}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr key={fila[claveFila] ?? i} className="even:bg-marca-100">
              {columnas.map((c) => (
                <td key={c.clave} className={`border border-gray-200 px-3 py-2 ${alinear(c)}`}>
                  {c.formato ? c.formato(fila[c.clave], fila) : fila[c.clave]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {pie && <tfoot className="font-semibold">{pie}</tfoot>}
      </table>
    </div>
  );
}
