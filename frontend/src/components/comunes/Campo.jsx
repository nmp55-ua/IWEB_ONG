import { useId } from 'react';

// Campo de formulario con su etiqueta y su error debajo (CONVENCIONES.md §6).
// tipo: cualquier type de <input>, o 'select' (con opciones=[{ valor, texto }]) o 'textarea'.
export default function Campo({ etiqueta, error, ayuda, tipo = 'text', opciones = [], className = '', ...resto }) {
  const id = useId();
  const clasesControl = `w-full rounded border px-3 py-2 bg-white
    ${error ? 'border-peligro' : 'border-gray-300 focus:border-marca-500'}`;
  const props = { id, 'aria-invalid': Boolean(error), 'aria-describedby': error ? `${id}-error` : undefined, ...resto };

  let control;
  if (tipo === 'select') {
    control = (
      <select className={clasesControl} {...props}>
        {opciones.map((o) => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
      </select>
    );
  } else if (tipo === 'textarea') {
    control = <textarea className={clasesControl} rows={4} {...props} />;
  } else if (tipo === 'checkbox') {
    return (
      <div className={`mb-4 ${className}`}>
        <label htmlFor={id} className="flex items-start gap-2">
          <input type="checkbox" className="mt-1" {...props} />
          <span>{etiqueta}</span>
        </label>
        {error && <p id={`${id}-error`} className="text-sm text-peligro mt-1">{error}</p>}
      </div>
    );
  } else {
    control = <input type={tipo} className={clasesControl} {...props} />;
  }

  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={id} className="block font-medium mb-1">{etiqueta}</label>
      {control}
      {ayuda && !error && <p className="text-sm text-gray-600 mt-1">{ayuda}</p>}
      {error && <p id={`${id}-error`} className="text-sm text-peligro mt-1">{error}</p>}
    </div>
  );
}
