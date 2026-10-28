// Mensaje destacado. tipo: 'info' | 'exito' | 'aviso' | 'error'
const ESTILOS = {
  info: 'bg-marca-100 border-marca-500 text-marca-900',
  exito: 'bg-green-50 border-exito text-exito',
  aviso: 'bg-amber-50 border-aviso text-aviso',
  error: 'bg-red-50 border-peligro text-peligro',
};

export default function Aviso({ tipo = 'info', titulo, children }) {
  if (!children && !titulo) return null;
  return (
    <div role={tipo === 'error' ? 'alert' : 'status'} className={`border-l-4 rounded p-4 mb-4 ${ESTILOS[tipo]}`}>
      {titulo && <p className="font-semibold">{titulo}</p>}
      {children && <div>{children}</div>}
    </div>
  );
}
