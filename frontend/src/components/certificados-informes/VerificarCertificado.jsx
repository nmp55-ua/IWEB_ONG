import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { formatearEuros, formatearFecha } from '../../lib/formato.js';
import Aviso from '../comunes/Aviso.jsx';
import Boton from '../comunes/Boton.jsx';
import Campo from '../comunes/Campo.jsx';

// HU-03 (FR-011): página pública, sin sesión. Con «?codigo=…» en la dirección (como el enlace del
// PDF) lo comprueba al abrir. Un código no válido nunca muestra datos.
export default function VerificarCertificado() {
  const [codigo, setCodigo] = useState('');
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  async function comprobar(valor) {
    setCargando(true);
    setError(null);
    try {
      setResultado(await api.get(`/certificados/verificacion?codigo=${encodeURIComponent(valor)}`));
    } catch (e) {
      setResultado(null);
      setError(e);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    const inicial = new URLSearchParams(window.location.search).get('codigo');
    if (inicial) {
      setCodigo(inicial);
      comprobar(inicial);
    }
  }, []);

  function enviar(evento) {
    evento.preventDefault();
    comprobar(codigo);
  }

  return (
    <div className="max-w-lg space-y-4">
      <p className="text-gray-700">
        Introduce el código de verificación que aparece en el certificado fiscal para comprobar si es auténtico y
        sigue siendo válido.
      </p>
      <form onSubmit={enviar} className="bg-white rounded border border-gray-200 p-4">
        <Campo
          etiqueta="Código de verificación"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="XXXX-XXXX-XXXX-XXXX"
          autoComplete="off"
          required
        />
        <Boton type="submit" cargando={cargando}>
          Comprobar
        </Boton>
      </form>

      {error && <Aviso tipo="error">{error.message}</Aviso>}

      {resultado?.valido === true && (
        <Aviso tipo="exito" titulo="Certificado válido">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
            <dt className="font-medium">Ejercicio</dt>
            <dd>{resultado.ejercicio}</dd>
            <dt className="font-medium">Importe total</dt>
            <dd>{formatearEuros(resultado.importeTotal)}</dd>
            <dt className="font-medium">Fecha de emisión</dt>
            <dd>{formatearFecha(resultado.fechaEmision)}</dd>
            <dt className="font-medium">NIF/NIE</dt>
            <dd>{resultado.nifNieEnmascarado}</dd>
          </dl>
        </Aviso>
      )}

      {resultado?.valido === false && (
        <Aviso tipo="error" titulo="Código no válido">
          No corresponde a ningún certificado vigente. Si el certificado se ha actualizado, su código anterior deja de
          ser válido.
        </Aviso>
      )}
    </div>
  );
}
