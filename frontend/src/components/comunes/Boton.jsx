// Botón común. variante: 'principal' | 'secundario' | 'peligro'. Con href se pinta como enlace.
const ESTILOS = {
  principal: 'bg-marca-700 text-white hover:bg-marca-900',
  secundario: 'bg-white text-marca-700 border border-marca-700 hover:bg-marca-50',
  peligro: 'bg-peligro text-white hover:opacity-90',
};

export default function Boton({ variante = 'principal', href, cargando = false, disabled, children, className = '', ...resto }) {
  const clases = `inline-flex items-center justify-center gap-2 px-4 py-2 rounded font-medium
    disabled:opacity-50 disabled:cursor-not-allowed ${ESTILOS[variante]} ${className}`;
  if (href) return <a href={href} className={clases} {...resto}>{children}</a>;
  return (
    <button type="button" className={clases} disabled={disabled || cargando} {...resto}>
      {cargando ? 'Un momento…' : children}
    </button>
  );
}
