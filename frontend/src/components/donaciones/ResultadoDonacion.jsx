import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { formatearEuros, formatearFecha } from '../../lib/formato.js';
import Aviso from '../comunes/Aviso.jsx';
import Boton from '../comunes/Boton.jsx';
import { EnlaceVincular, MODALIDADES, borrarClaveSolicitud, leerClaveSolicitud } from './comunDonacion.jsx';

// HU-01 · Resultado de una aportación. La referencia de la URL es solo un identificador:
// el servidor decide si este navegador puede verla (permiso de la operación o cuenta vinculada).
const CONSULTA_MS = 5000;
const MAX_CONSULTAS = 24; // unos dos minutos de espera visible mientras siga pendiente

const TEXTO_CORREO = {
  pendiente: 'El correo de confirmación está pendiente de envío.',
  enviando: 'El correo de confirmación se está enviando.',
  enviado: 'El servidor de correo ha aceptado el envío del resumen a tu dirección.',
  fallido: 'No se ha podido enviar el correo de confirmación. Tu donación sigue confirmada.',
};

const PERIODICIDADES = { mensual: 'Mensual', trimestral: 'Trimestral', anual: 'Anual' };
const ESTADOS_SUSCRIPCION = {
  pendiente: 'Pendiente de confirmación del primer cobro',
  activa: 'Activa',
  cancelada: 'Cancelada',
};

// DATE «aaaa-mm-dd» → «dd/mm/aaaa», sin convertir zonas (ya es la fecha de Madrid).
function formatearDia(texto) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto ?? '');
  return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : null;
}

// Estado actual de la suscripción, separado del resumen histórico de la cuota. La próxima
// fecha es solo la que devuelve el servidor; null se muestra como «Pendiente de confirmación».
function Suscripcion({ s }) {
  const filas = [
    ['Periodicidad', PERIODICIDADES[s.periodicidad] ?? s.periodicidad],
    ['Suscripción', ESTADOS_SUSCRIPCION[s.estado] ?? s.estado],
    ...(s.estado === 'cancelada'
      ? []
      : [['Próximo cobro', formatearDia(s.fechaProximoCobro) ?? 'Pendiente de confirmación']]),
  ];
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 bg-white rounded shadow-sm p-6 mb-4">
      {filas.map(([etiqueta, valor]) => (
        <div key={etiqueta} className="contents">
          <dt className="font-medium">{etiqueta}</dt>
          <dd>{valor}</dd>
        </div>
      ))}
    </dl>
  );
}

function Resumen({ r }) {
  const s = r.resumenConfirmacion ?? r;
  const destino = String(s.destino ?? '').trim().toLowerCase() === 'fondo general' ? 'Fondo general' : s.destino;
  const filas = [
    ['Importe', formatearEuros(s.importe)],
    ...(s.fechaCobro ? [['Fecha', formatearFecha(s.fechaCobro)]] : []),
    ['Modalidad', MODALIDADES[s.modalidad] ?? s.modalidad],
    ['Destino', destino],
    ['Referencia', s.referencia],
  ];
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 bg-white rounded shadow-sm p-6 mb-4">
      {filas.map(([etiqueta, valor]) => (
        <div key={etiqueta} className="contents">
          <dt className="font-medium">{etiqueta}</dt>
          <dd>{valor}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function ResultadoDonacion() {
  const [referencia, setReferencia] = useState(null);
  const [cancelado, setCancelado] = useState(false);
  const [resultado, setResultado] = useState(undefined); // undefined = cargando, null = sin acceso
  const [error, setError] = useState(null);
  const [accion, setAccion] = useState(null); // aviso de la última acción
  const [cargando, setCargando] = useState(false);
  const consultas = useRef(0);

  async function cargar(ref) {
    try {
      const r = await api.get(`/aportaciones/referencia/${encodeURIComponent(ref)}`);
      setResultado(r);
      setError(null);
      // Cobro confirmado: la preparación de esta pestaña ya no se puede reanudar.
      if (r.estado === 'confirmada' && r.preparacion?.claveSolicitud === leerClaveSolicitud())
        borrarClaveSolicitud();
      return r;
    } catch (err) {
      if (err.estado === 404) setResultado(null);
      else setError(err);
      return null;
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    setCancelado(params.get('cancelado') === '1');
    if (!ref) {
      setResultado(null);
      return undefined;
    }
    setReferencia(ref);
    let temporizador;
    const ciclo = async () => {
      const r = await cargar(ref);
      consultas.current += 1;
      if (r?.estado === 'pendiente' && consultas.current < MAX_CONSULTAS)
        temporizador = setTimeout(ciclo, CONSULTA_MS);
    };
    ciclo();
    return () => clearTimeout(temporizador);
  }, []);

  async function contextoCsrf() {
    return (await api.get('/donaciones/contexto')).tokenCsrf;
  }

  async function reintentarCorreo() {
    setCargando(true);
    setAccion(null);
    try {
      const { estadoCorreo } = await api.post(
        `/aportaciones/referencia/${encodeURIComponent(referencia)}/correo`,
        { tokenCsrf: await contextoCsrf() },
      );
      setAccion(
        estadoCorreo === 'enviado'
          ? { tipo: 'exito', texto: 'El servidor de correo ha aceptado el reenvío del resumen.' }
          : { tipo: 'error', texto: 'El reenvío ha vuelto a fallar. Tu donación sigue confirmada.' },
      );
    } catch (err) {
      setAccion({
        tipo: 'aviso',
        texto:
          err.codigo === 'CORREO_EN_ENVIO'
            ? 'El correo ya se está enviando. Espera un momento.'
            : err.message,
      });
    }
    await cargar(referencia);
    setCargando(false);
  }

  // Reanuda la misma operación autorizada (DTO corto); nunca crea otra con una clave nueva.
  async function reanudarPago() {
    setCargando(true);
    setAccion(null);
    try {
      const r = await api.post('/aportaciones', {
        tokenCsrf: await contextoCsrf(),
        claveSolicitud: resultado.preparacion.claveSolicitud,
      });
      if (r.urlPago) {
        window.location.assign(r.urlPago);
        return;
      }
      setAccion({ tipo: 'aviso', texto: 'Ahora mismo no hay un pago abierto para esta donación.' });
    } catch (err) {
      setAccion({
        tipo: 'error',
        texto:
          err.codigo === 'OPERACION_REQUIERE_REVISION'
            ? 'La preparación del pago requiere revisión.'
            : err.codigo === 'PAGO_NO_DISPONIBLE'
              ? 'El pago no está disponible en este momento. Inténtalo más tarde.'
              : err.message,
      });
    }
    await cargar(referencia);
    setCargando(false);
  }

  // Solo tras un cierre sin cobro informado por el servidor: libera la clave de esta operación.
  function hacerOtra() {
    if (resultado.preparacion?.claveSolicitud === leerClaveSolicitud()) borrarClaveSolicitud();
    window.location.assign('/donar');
  }

  if (resultado === undefined && !error) return <p>Cargando…</p>;
  if (error && !resultado)
    return (
      <>
        <Aviso tipo="error">{error.message}</Aviso>
        <Boton variante="secundario" onClick={() => window.location.reload()}>
          Volver a consultar
        </Boton>
      </>
    );
  if (resultado === null)
    return (
      <>
        <Aviso tipo="aviso" titulo="No podemos mostrar esta aportación">
          Este navegador no tiene permiso para consultarla. Si donaste sin cuenta, el resultado solo se puede
          ver en el navegador y la sesión en que hiciste la donación.
        </Aviso>
        <Boton href="/donar">Hacer una donación</Boton>
        <EnlaceVincular />
      </>
    );

  const r = resultado;
  const revision = r.preparacion?.requiereRevision;
  const puedeReanudar = !revision && r.preparacion && r.estado !== 'confirmada';
  const cuota = r.modalidad === 'cuota_socio';
  // Una cuota posterior no tiene operación de este navegador: su rechazo no cierra el alta.
  const cuotaPosterior = cuota && !r.preparacion;
  const cerrada = r.estado === 'rechazada' || r.estado === 'cancelada';

  return (
    <div className="max-w-2xl">
      {cancelado && r.estado !== 'confirmada' && (
        <Aviso tipo="info">
          Has vuelto sin completar el pago. Volver de la pasarela no cancela ni confirma nada por sí solo;
          abajo ves el estado real de la donación.
        </Aviso>
      )}

      {r.estado === 'confirmada' && (
        <Aviso
          tipo="exito"
          titulo={cuota ? '¡Gracias! Esta cuota de socio está confirmada' : '¡Gracias! Tu donación está confirmada'}
        />
      )}
      {r.estado === 'pendiente' && (
        <Aviso tipo="info" titulo="Pago pendiente de confirmación">
          Todavía no tenemos la confirmación de la pasarela. Esta página se actualiza sola durante unos
          minutos; no hace falta que vuelvas a pagar.
        </Aviso>
      )}
      {cerrada && cuotaPosterior && (
        <Aviso tipo="error" titulo="Esta cuota no se ha podido cobrar">
          {r.motivo ?? 'La pasarela no ha confirmado el cobro de esta cuota.'} No consta como pagada ni se
          suma a tus aportaciones. Las cuotas anteriores no cambian.
        </Aviso>
      )}
      {cerrada && !cuotaPosterior && (
        <Aviso
          tipo="error"
          titulo={r.estado === 'rechazada' ? 'El pago no se ha completado' : 'El pago se ha cancelado'}
        >
          {r.motivo ?? 'No se ha realizado ningún cobro.'} No hay ninguna aportación confirmada.
        </Aviso>
      )}
      {revision && r.estado !== 'confirmada' && (
        <Aviso tipo="aviso">La preparación del pago requiere revisión.</Aviso>
      )}

      <Resumen r={r} />

      {r.suscripcion && <Suscripcion s={r.suscripcion} />}
      {r.suscripcion?.estado === 'cancelada' && (
        <Aviso tipo="info">
          La suscripción está cancelada. Las cuotas ya cobradas se conservan.
        </Aviso>
      )}

      {/* Tras un reenvío aceptado basta el aviso de la acción: un único mensaje de éxito. */}
      {r.estado === 'confirmada' && accion?.tipo !== 'exito' && (
        <Aviso tipo={r.correo.estado === 'enviado' ? 'info' : 'aviso'}>
          {TEXTO_CORREO[r.correo.estado] ?? 'No hay correo de confirmación previsto.'}
        </Aviso>
      )}
      {accion && <Aviso tipo={accion.tipo}>{accion.texto}</Aviso>}

      <div className="flex flex-wrap gap-3">
        {r.estado === 'confirmada' && r.correo.puedeReintentar && (
          <Boton cargando={cargando} onClick={reintentarCorreo}>
            Reintentar solo el correo
          </Boton>
        )}
        {r.urlPago && (
          <Boton href={r.urlPago}>{r.estado === 'pendiente' ? 'Volver al pago' : 'Reintentar el pago'}</Boton>
        )}
        {!r.urlPago && puedeReanudar && (
          <Boton cargando={cargando} onClick={reanudarPago}>
            Reintentar el pago
          </Boton>
        )}
        {r.estado === 'pendiente' && (
          <Boton variante="secundario" disabled={cargando} onClick={() => cargar(referencia)}>
            Actualizar estado
          </Boton>
        )}
        {cerrada && !revision && !cuotaPosterior && (
          <Boton variante="secundario" disabled={cargando} onClick={hacerOtra}>
            Hacer otra donación
          </Boton>
        )}
      </div>

      <EnlaceVincular />
    </div>
  );
}
