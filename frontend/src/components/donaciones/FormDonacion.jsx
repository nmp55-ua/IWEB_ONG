import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import Aviso from '../comunes/Aviso.jsx';
import Boton from '../comunes/Boton.jsx';
import Campo from '../comunes/Campo.jsx';
import { EnlaceVincular, guardarClaveSolicitud, leerClaveSolicitud } from './comunDonacion.jsx';

// HU-01 · Formulario de donación puntual. Sin cuenta obligatoria. El servidor valida todo;
// aquí solo se adelantan los errores evidentes para no llamar a la pasarela en balde.
const VACIO = { importe: '', destino: '', nombre: '', apellidos: '', nifNie: '', correo: '', direccion: '' };
const IMPORTE = /^\d+([.,]\d{1,2})?$/;
const MENSAJE_IMPORTE = 'Indica un importe entre 1,00 y 999.999,99 €, con un máximo de dos decimales.';
const CAMPOS_DONANTE = ['nombre', 'apellidos', 'nifNie', 'correo', 'direccion'];

function validar(datos) {
  const errores = {};
  const importe = datos.importe.trim();
  if (!IMPORTE.test(importe)) errores.importe = MENSAJE_IMPORTE;
  else {
    const [entero, decimales = ''] = importe.replace(',', '.').split('.');
    const centimos = Number(entero) * 100 + Number(decimales.padEnd(2, '0'));
    if (centimos < 100 || centimos > 99999999) errores.importe = MENSAJE_IMPORTE;
  }
  if (!datos.destino) errores.destino = 'Elige el fondo general o un proyecto.';
  for (const campo of CAMPOS_DONANTE) if (!datos[campo].trim()) errores[campo] = 'Completa este campo.';
  if (!errores.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo.trim()))
    errores.correo = 'Introduce un correo válido.';
  return errores;
}

const MENSAJES = {
  DATOS_DONANTE_INCOMPATIBLES: 'Revisa los datos introducidos para continuar.',
  PROYECTO_NO_DISPONIBLE: 'El proyecto elegido ya no está disponible. Elige otro destino o el fondo general.',
  OPERACION_EN_CURSO: 'Tu pago se está preparando. Espera unos segundos y vuelve a intentarlo.',
  OPERACION_REQUIERE_REVISION: 'La preparación del pago requiere revisión.',
  PAGO_NO_DISPONIBLE:
    'No hemos podido confirmar el estado del pago. Si ya lo habías iniciado, no lo repitas: vuelve a intentar continuar en unos minutos para conocer su estado.',
  SOLICITUD_INCOMPATIBLE:
    'Ya tienes una donación en preparación en esta pestaña con otros datos. Continúa el pago de esa donación.',
  APORTACION_NO_DISPONIBLE: 'No podemos recuperar la donación en preparación desde este navegador.',
};

export default function FormDonacion() {
  const [contexto, setContexto] = useState(null);
  const [proyectos, setProyectos] = useState([]);
  const [datos, setDatos] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [pendiente, setPendiente] = useState(null); // UUID conservado en la pestaña
  const [heredada, setHeredada] = useState(false); // la clave procede de un intento anterior

  useEffect(() => {
    const clave = leerClaveSolicitud();
    setPendiente(clave);
    setHeredada(Boolean(clave));
    api.get('/donaciones/contexto').then(setContexto).catch(setError);
    api
      .get('/proyectos')
      .then((r) => setProyectos(r.datos ?? []))
      .catch(() => setProyectos([]));
  }, []);

  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  // Envía la solicitud y redirige a Checkout o al resultado. La clave nunca se rota por un error.
  async function solicitar(cuerpo) {
    setCargando(true);
    setError(null);
    try {
      const r = await api.post('/aportaciones', { tokenCsrf: contexto.tokenCsrf, ...cuerpo });
      if (r.urlPago) window.location.assign(r.urlPago);
      else window.location.assign(`/donar/resultado?ref=${encodeURIComponent(r.referencia)}`);
    } catch (err) {
      if (err.codigo === 'DATOS_INVALIDOS') setErrores(err.campos ?? {});
      if (err.codigo === 'SOLICITUD_INCOMPATIBLE') setHeredada(true);
      setError(err);
      setCargando(false);
    }
  }

  function enviar(e) {
    e.preventDefault();
    const encontrados = validar(datos);
    setErrores(encontrados);
    setError(null);
    if (Object.keys(encontrados).length) return;
    let clave = pendiente;
    if (!clave) {
      clave = crypto.randomUUID();
      guardarClaveSolicitud(clave);
      setPendiente(clave);
    }
    solicitar({
      claveSolicitud: clave,
      modalidad: 'puntual',
      importe: datos.importe.trim(),
      proyectoId: datos.destino === 'general' ? null : datos.destino,
      donante: Object.fromEntries(CAMPOS_DONANTE.map((c) => [c, datos[c]])),
    });
  }

  if (!contexto && !error) return <p>Cargando…</p>;
  if (!contexto) return <Aviso tipo="error">{error.message}</Aviso>;

  const codigo = error?.codigo;
  const revision = codigo === 'OPERACION_REQUIERE_REVISION';
  const opciones = [
    { valor: '', texto: 'Elige un destino' },
    { valor: 'general', texto: 'Fondo general' },
    ...proyectos.map((p) => ({ valor: String(p.id), texto: p.nombre })),
  ];

  return (
    <div className="max-w-2xl">
      {heredada && pendiente && (
        <Aviso tipo="info" titulo="Tienes una donación en preparación en esta pestaña">
          <p className="mb-3">Puedes continuar con su pago; se reanudará la misma operación.</p>
          <div className="flex flex-wrap gap-3">
            <Boton
              cargando={cargando}
              disabled={revision}
              onClick={() => solicitar({ claveSolicitud: pendiente })}
            >
              Continuar el pago
            </Boton>
          </div>
        </Aviso>
      )}

      {error && codigo !== 'DATOS_INVALIDOS' && (
        <Aviso tipo={revision ? 'aviso' : 'error'}>{MENSAJES[codigo] ?? error.message}</Aviso>
      )}
      {codigo === 'DATOS_INVALIDOS' && <Aviso tipo="error">Revisa los datos marcados.</Aviso>}

      <form onSubmit={enviar} className="bg-white rounded shadow-sm p-6" noValidate>
        <h2 className="text-lg font-semibold text-marca-700 mb-4">Tu donación</h2>
        <p className="mb-4 text-sm text-gray-600">
          Donación puntual con tarjeta, en euros. No necesitas cuenta.
        </p>
        <Campo
          etiqueta="Importe (€)"
          name="importe"
          inputMode="decimal"
          autoComplete="off"
          placeholder="20,00"
          value={datos.importe}
          onChange={cambiar}
          error={errores.importe}
          ayuda="Entre 1,00 y 999.999,99 €, con un máximo de dos decimales."
        />
        <Campo
          etiqueta="Destino"
          name="destino"
          tipo="select"
          opciones={opciones}
          value={datos.destino}
          onChange={cambiar}
          error={errores.destino ?? errores.proyectoId}
        />

        <h2 className="text-lg font-semibold text-marca-700 mt-6 mb-4">Datos fiscales</h2>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Campo
            etiqueta="Nombre"
            name="nombre"
            autoComplete="given-name"
            value={datos.nombre}
            onChange={cambiar}
            error={errores.nombre}
          />
          <Campo
            etiqueta="Apellidos"
            name="apellidos"
            autoComplete="family-name"
            value={datos.apellidos}
            onChange={cambiar}
            error={errores.apellidos}
          />
          <Campo
            etiqueta="NIF/NIE"
            name="nifNie"
            autoComplete="off"
            value={datos.nifNie}
            onChange={cambiar}
            error={errores.nifNie}
          />
          <Campo
            etiqueta="Correo electrónico"
            name="correo"
            tipo="email"
            autoComplete="email"
            value={datos.correo}
            onChange={cambiar}
            error={errores.correo}
          />
        </div>
        <Campo
          etiqueta="Dirección"
          name="direccion"
          autoComplete="street-address"
          value={datos.direccion}
          onChange={cambiar}
          error={errores.direccion}
        />

        <Boton type="submit" cargando={cargando} disabled={revision || heredada}>
          Continuar al pago seguro
        </Boton>
        {heredada && (
          <p className="mt-2 text-sm text-gray-600">Continúa antes el pago de la donación en preparación.</p>
        )}
        <EnlaceVincular />
      </form>
    </div>
  );
}
