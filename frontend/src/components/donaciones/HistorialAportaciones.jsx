import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { formatearEuros, formatearFecha } from '../../lib/formato.js';
import Tabla from '../comunes/Tabla.jsx';
import Campo from '../comunes/Campo.jsx';
import Boton from '../comunes/Boton.jsx';
import Aviso from '../comunes/Aviso.jsx';
import EstadoVacio from '../comunes/EstadoVacio.jsx';
import { crearConsultasHistorial, formatearTotalAnual } from './historial.js';

const columnas = [
  {
    clave: 'fechaCobro',
    titulo: 'Fecha',
    formato: (fecha, fila) => <span data-hu02-aportacion={fila.id}>{formatearFecha(fecha)}</span>,
  },
  { clave: 'importe', titulo: 'Importe', alinear: 'derecha', formato: formatearEuros },
  {
    clave: 'modalidad',
    titulo: 'Modalidad',
    formato: (tipo) => (tipo === 'puntual' ? 'Puntual' : 'Cuota de socio'),
  },
  { clave: 'destino', titulo: 'Destino' },
];

export default function HistorialAportaciones() {
  const [estado, setEstado] = useState({ cargando: true, datos: null, error: null, anioSolicitado: null });
  const [anio, setAnio] = useState('');
  const [errorAnio, setErrorAnio] = useState(null);
  const [vinculado, setVinculado] = useState(false);
  const gestor = useRef(null);
  useEffect(() => {
    const consultas = crearConsultasHistorial({
      obtener: api.get,
      actualizar: (nuevo) => {
        setEstado(nuevo);
        if (nuevo.datos) setVinculado(nuevo.datos.vinculado);
        if ([401, 403].includes(nuevo.error?.estado)) setVinculado(false);
      },
    });
    gestor.current = consultas;
    consultas.consultar(null);
    return () => consultas.invalidar();
  }, []);

  function filtrar(evento) {
    evento.preventDefault();
    if (!/^[1-9][0-9]{3}$/.test(anio)) {
      setErrorAnio('Introduce un año de cuatro cifras entre 1000 y 9999.');
      return;
    }
    setErrorAnio(null);
    gestor.current?.consultar(Number(anio));
  }
  function quitarFiltro() {
    setAnio('');
    setErrorAnio(null);
    gestor.current?.consultar(null);
  }

  const { cargando, datos, error } = estado;
  return (
    <section id="historial-aportaciones" aria-label="Historial de aportaciones" aria-busy={cargando}>
      {vinculado && (
        <form onSubmit={filtrar} noValidate className="flex flex-wrap items-end gap-3 mb-6">
          <Campo
            etiqueta="Año"
            name="anio"
            tipo="number"
            min="1000"
            max="9999"
            step="1"
            value={anio}
            onChange={(evento) => {
              setAnio(evento.target.value);
              setErrorAnio(null);
            }}
            error={errorAnio || error?.campos?.anio}
          />
          <Boton type="submit" className="mb-4">
            Filtrar
          </Boton>
          <Boton variante="secundario" onClick={quitarFiltro} className="mb-4">
            Todos los años
          </Boton>
        </form>
      )}
      {cargando && <Aviso>Cargando tus aportaciones…</Aviso>}
      {error && (
        <>
          <Aviso tipo="error">{error.message}</Aviso>
          {error.estado === 401 ? (
            <Boton href="/entrar?volver=/mis-aportaciones">Entrar</Boton>
          ) : (
            error.estado !== 403 && (
              <Boton onClick={() => gestor.current?.consultar(gestor.current.ultimoAnio)}>Reintentar</Boton>
            )
          )}
        </>
      )}
      {!cargando &&
        !error &&
        datos &&
        (!datos.vinculado ? (
          <EstadoVacio
            mensaje="Para consultar tu historial, primero debes vincular las aportaciones a tu cuenta mediante la verificación del correo."
            accion={<Boton href="/donar/vincular">Vincular aportaciones</Boton>}
          />
        ) : !datos.hayAportaciones ? (
          <EstadoVacio
            mensaje="Todavía no has realizado ninguna aportación"
            accion={<Boton href="/donar">Donar</Boton>}
          />
        ) : datos.datos.length === 0 ? (
          <EstadoVacio mensaje={`No hay aportaciones confirmadas en ${datos.filtroAnio}`} />
        ) : (
          datos.datos.map((grupo) => (
            <section
              key={grupo.anio}
              data-hu02-anio={grupo.anio}
              data-hu02-total={grupo.importeTotal}
              aria-labelledby={`historial-anio-${grupo.anio}`}
              className="mb-8"
            >
              <h2 id={`historial-anio-${grupo.anio}`} className="text-xl font-semibold mb-3">
                {grupo.anio}
              </h2>
              <p className="font-semibold mb-3">
                Total de {grupo.anio}:{' '}
                <span data-hu02-total-visible className="whitespace-nowrap">
                  {formatearTotalAnual(grupo.importeTotal)}
                </span>
              </p>
              <Tabla columnas={columnas} filas={grupo.aportaciones} />
            </section>
          ))
        ))}
    </section>
  );
}
