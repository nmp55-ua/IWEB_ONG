import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import Aviso from '../comunes/Aviso.jsx';
import Boton from '../comunes/Boton.jsx';
import EstadoVacio from '../comunes/EstadoVacio.jsx';
import { desplazarMes, mesActual, semanasDelMes } from './fechas.js';
import ListaCalendario from './ListaCalendario.jsx';
import MesCalendario from './MesCalendario.jsx';
import { crearVuelta } from './vuelta.js';

// HU-06: calendario personal del voluntario. La lista se abre primero (clarify Q4); el mes pide al
// servidor solo sus semanas (research R3). Se actualiza al abrir, tras cancelar y al volver a la
// pestaña o a la ventana (FR-005, research R5).

export default function CalendarioVoluntario() {
  const [vista, setVista] = useState('lista'); // 'lista' | 'mes'
  const [mes, setMes] = useState(mesActual);
  const [entradas, setEntradas] = useState(null); // null = cargando
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const ultimaPeticion = useRef(0);

  let ruta = '/yo/calendario';
  if (vista === 'mes') {
    const semanas = semanasDelMes(mes);
    ruta += `?desde=${semanas[0][0]}&hasta=${semanas.at(-1)[6]}`;
  }

  // Si llegan dos respuestas desordenadas (por ejemplo, al cambiar de mes deprisa), vale la última.
  // Si falla, se conserva lo que ya se veía y el error sale encima (research R5).
  const cargar = useCallback(() => {
    const numero = ++ultimaPeticion.current;
    return api
      .get(ruta)
      .then(({ datos }) => {
        if (numero !== ultimaPeticion.current) return;
        setEntradas(datos);
        setError(null);
      })
      .catch((err) => {
        if (numero !== ultimaPeticion.current) return;
        setError(err);
      });
  }, [ruta]);

  // Al abrir y al cambiar de vista o de mes, con «Cargando…».
  useEffect(() => {
    setEntradas(null);
    cargar();
  }, [cargar]);

  // Al volver a la pestaña (visibilitychange), a la ventana desde otra (focus) o atrás con el navegador
  // (pageshow desde su caché): sin vaciar la pantalla. Se recarga una vez por cada salida (vuelta.js).
  useEffect(() => {
    const vuelta = crearVuelta(cargar, { fueraAlEmpezar: document.visibilityState !== 'visible' });
    const alCambiarVisibilidad = () =>
      document.visibilityState === 'visible' ? vuelta.volver() : vuelta.salir();
    const alRestaurar = (evento) => {
      if (evento.persisted) cargar();
    };
    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    window.addEventListener('blur', vuelta.salir);
    window.addEventListener('focus', vuelta.volver);
    window.addEventListener('pageshow', alRestaurar);
    return () => {
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      window.removeEventListener('blur', vuelta.salir);
      window.removeEventListener('focus', vuelta.volver);
      window.removeEventListener('pageshow', alRestaurar);
    };
  }, [cargar]);

  function alCancelar(entrada) {
    setMensaje(
      entrada.estado === 'en_espera'
        ? `Has salido de la lista de espera de «${entrada.actividad.titulo}».`
        : `Has cancelado tu inscripción en «${entrada.actividad.titulo}».`,
    );
    cargar();
  }

  function cambiarVista(nueva) {
    setMensaje(null);
    setVista(nueva);
  }

  if (error?.estado === 401) {
    return (
      <EstadoVacio
        mensaje="Inicia sesión para ver tu calendario."
        accion={<Boton href="/entrar?volver=/mi-calendario">Entrar</Boton>}
      />
    );
  }
  // Sin el rol de voluntario no hay calendario: solo el aviso, sin las pestañas.
  if (error?.estado === 403) return <Aviso tipo="error">{error.message}</Aviso>;

  const boton = (valor, texto) => (
    <button
      type="button"
      aria-pressed={vista === valor}
      onClick={() => cambiarVista(valor)}
      className={`px-4 py-2 font-medium ${vista === valor ? 'bg-marca-700 text-white' : 'bg-white text-marca-700'}`}
    >
      {texto}
    </button>
  );

  return (
    <div>
      <div
        role="group"
        aria-label="Vista del calendario"
        className="inline-flex rounded border border-marca-700 overflow-hidden mb-4"
      >
        {boton('lista', 'Lista')}
        {boton('mes', 'Mes')}
      </div>

      {mensaje && <Aviso tipo="exito">{mensaje}</Aviso>}
      {error && <Aviso tipo="error">{error.message}</Aviso>}
      {!error && entradas === null && vista === 'lista' && <p>Cargando…</p>}

      {entradas &&
        vista === 'lista' &&
        (entradas.length === 0 ? (
          <EstadoVacio
            mensaje="Todavía no tienes actividades por delante."
            accion={<Boton href="/actividades">Ver actividades disponibles</Boton>}
          />
        ) : (
          <ListaCalendario entradas={entradas} onCancelada={alCancelar} onRecargar={cargar} />
        ))}

      {/* La cabecera del mes no se desmonta al cambiar de mes: el foco sigue en «‹» o «›». */}
      {vista === 'mes' && (
        <MesCalendario
          mes={mes}
          entradas={entradas}
          cargando={entradas === null && !error}
          puedeRetroceder={mes.anio * 12 + mes.mes > mesActual().anio * 12 + mesActual().mes}
          onMes={(cuantos) => setMes(desplazarMes(mes, cuantos))}
          onCancelada={alCancelar}
          onRecargar={cargar}
        />
      )}
    </div>
  );
}
