import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import FormEntrar from '../auth/FormEntrar.jsx';
import Aviso from '../comunes/Aviso.jsx';
import Boton from '../comunes/Boton.jsx';
import {
  avisoVinculacion,
  borrarTokenVinculo,
  esTokenVinculo,
  guardarTokenVinculo,
  leerTokenVinculo,
} from './comunDonacion.jsx';

// HU-01 · Vincular aportaciones a la cuenta. Nada ocurre al abrir la página: solicitar el
// enlace y confirmar el vínculo son siempre acciones explícitas (POST) de la cuenta.
export default function VincularDonante() {
  const [contexto, setContexto] = useState(null);
  const [token, setToken] = useState(null);
  const [estado, setEstado] = useState(null); // { tipo, texto, otro? }
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    // El token del correo llega en el fragmento: se retira de la URL y queda en esta pestaña.
    const fragmento = new URLSearchParams(window.location.hash.slice(1)).get('token');
    if (window.location.hash) {
      if (esTokenVinculo(fragmento)) guardarTokenVinculo(fragmento);
      window.history.replaceState(null, '', window.location.pathname);
    }
    setToken(leerTokenVinculo());
    api.get('/donaciones/contexto').then(setContexto).catch(setError);
  }, []);

  async function solicitar() {
    setCargando(true);
    setEstado(null);
    try {
      await api.post('/donantes/vinculaciones', { tokenCsrf: contexto.tokenCsrf });
      setEstado({ tipo: 'info', texto: avisoVinculacion });
    } catch (err) {
      setEstado({ tipo: 'error', texto: err.message });
    }
    setCargando(false);
  }

  async function confirmar() {
    setCargando(true);
    setEstado(null);
    try {
      await api.post('/donantes/vinculaciones/confirmar', { tokenCsrf: contexto.tokenCsrf, token });
      borrarTokenVinculo();
      setToken(null);
      setEstado({
        tipo: 'exito',
        texto: 'Vinculación completada. Tus aportaciones quedan asociadas a esta cuenta.',
      });
    } catch (err) {
      if (err.codigo === 'ENLACE_NO_VALIDO')
        setEstado({
          tipo: 'error',
          texto: 'El enlace no es válido: puede haber caducado, haberse usado ya o pertenecer a otra cuenta.',
          otro: true,
        });
      else if (err.codigo === 'VINCULACION_NO_DISPONIBLE') {
        borrarTokenVinculo();
        setToken(null);
        setEstado({ tipo: 'error', texto: 'La vinculación no está disponible para esta cuenta.' });
      } else setEstado({ tipo: 'error', texto: err.message });
    }
    setCargando(false);
  }

  // Limpia el token local y vuelve al estado sin token; no envía nada por sí solo.
  function solicitarOtro() {
    borrarTokenVinculo();
    setToken(null);
    setEstado(null);
  }

  if (!contexto && !error) return <p>Cargando…</p>;
  if (!contexto) return <Aviso tipo="error">{error.message}</Aviso>;

  const usuario = contexto.usuario;
  return (
    <div className="max-w-2xl">
      <p className="mb-4">
        Puedes vincular a tu cuenta las aportaciones hechas con el mismo correo electrónico de la cuenta. Para
        comprobar que ese buzón es tuyo, te enviaremos un enlace de verificación.
      </p>

      {!usuario && (
        <>
          <Aviso tipo="info">
            {token
              ? 'Entra con la cuenta que solicitó el enlace para confirmar la vinculación.'
              : 'Entra con tu cuenta para solicitar el enlace.'}
          </Aviso>
          <FormEntrar volverA="/donar/vincular" />
        </>
      )}

      {usuario && !usuario.roles?.includes('donante') && (
        <Aviso tipo="error">No tienes permiso para realizar esta acción.</Aviso>
      )}

      {usuario?.roles?.includes('donante') && (
        <>
          {estado && <Aviso tipo={estado.tipo}>{estado.texto}</Aviso>}
          {token ? (
            <div className="flex flex-wrap gap-3">
              {!estado?.otro && (
                <Boton cargando={cargando} onClick={confirmar}>
                  Confirmar vinculación
                </Boton>
              )}
              {estado?.otro && (
                <Boton variante="secundario" onClick={solicitarOtro}>
                  Solicitar otro enlace
                </Boton>
              )}
            </div>
          ) : (
            estado?.tipo !== 'exito' && (
              <Boton cargando={cargando} onClick={solicitar}>
                Enviar enlace de verificación
              </Boton>
            )
          )}
        </>
      )}

      <p className="mt-6 text-sm">
        <a href="/donar" className="text-marca-500 underline">
          Volver al formulario de donación
        </a>
      </p>
    </div>
  );
}
