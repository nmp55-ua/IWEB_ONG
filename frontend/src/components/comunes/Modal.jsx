import Boton from './Boton.jsx';

// Ventana de confirmación. Se cierra con «Cancelar» o pulsando fuera.
export default function Modal({ abierto, titulo, children, textoConfirmar = 'Confirmar', variante = 'principal', cargando, onConfirmar, onCerrar }) {
  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCerrar}>
      <div role="dialog" aria-modal="true" aria-label={titulo}
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
