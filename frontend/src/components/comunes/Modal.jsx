import { useEffect, useRef } from 'react';
import Boton from './Boton.jsx';

const ENFOCABLES = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Ventana de confirmación. Se cierra con «Cancelar», con Escape o pulsando fuera.
// Al abrirse lleva el foco dentro, lo mantiene dentro con Tab y al cerrarse lo devuelve a donde estaba.
export default function Modal({ abierto, titulo, children, textoConfirmar = 'Confirmar', variante = 'principal', cargando, onConfirmar, onCerrar }) {
  const caja = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    const anterior = document.activeElement;
    const enfocables = () => [...(caja.current?.querySelectorAll(ENFOCABLES) ?? [])];
    (enfocables().find((el) => el.matches('input, select, textarea')) ?? enfocables()[0] ?? caja.current)?.focus();
    const alPulsar = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onCerrar?.(); return; }
      if (e.key !== 'Tab') return;
      const lista = enfocables();
      if (!lista.length) return;
      const primero = lista[0], ultimo = lista[lista.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    };
    document.addEventListener('keydown', alPulsar);
    return () => {
      document.removeEventListener('keydown', alPulsar);
      if (anterior instanceof HTMLElement && anterior.isConnected) anterior.focus();
    };
  }, [abierto]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCerrar}>
      <div ref={caja} role="dialog" aria-modal="true" aria-label={titulo} tabIndex={-1}
        className="bg-white rounded shadow-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-marca-700 mb-3">{titulo}</h2>
        <div className="mb-6">{children}</div>
        <div className="flex justify-end gap-3">
          <Boton variante="secundario" onClick={onCerrar}>Cancelar</Boton>
          {onConfirmar && <Boton variante={variante} cargando={cargando} onClick={onConfirmar}>{textoConfirmar}</Boton>}
        </div>
      </div>
    </div>
  );
}
