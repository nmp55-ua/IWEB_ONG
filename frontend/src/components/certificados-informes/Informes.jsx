import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { formatearEuros, formatearFecha, formatearHoras } from '../../lib/formato.js';
import Aviso from '../comunes/Aviso.jsx';
import Boton from '../comunes/Boton.jsx';
import Campo from '../comunes/Campo.jsx';
import EstadoVacio from '../comunes/EstadoVacio.jsx';
import Tabla from '../comunes/Tabla.jsx';
import { MENSAJE_VACIO, filasParaTabla, rutaInforme, validarPeriodo } from './informes.js';

// HU-04: informe de recaudación y voluntariado para la junta. Solo administración: quien decide
// el acceso es el servidor (FR-008). Solo muestra cifras agregadas (FR-009).
const AGRUPACIONES = [
  { valor: '', texto: 'Sin agrupar' },
  { valor: 'mes', texto: 'Por mes' },
  { valor: 'trimestre', texto: 'Por trimestre' },
  { valor: 'anio', texto: 'Por año' },
];

const anioActual = new Date().getFullYear();
const FILTROS_INICIALES = { desde: `${anioActual}-01-01`, hasta: `${anioActual}-12-31`, proyectoId: '', agrupacion: '' };

// En negrita las filas de subtotal y de totales.
const resaltar = (contenido, fila) => (fila.resaltada ? <strong>{contenido}</strong> : contenido);

function columnas(agrupado) {
  const cifra = (clave, titulo, formato = (v) => v) => ({
    clave,
    titulo,
    alinear: 'derecha',
    formato: (valor, fila) => resaltar(formato(valor), fila),
  });
  return [
    ...(agrupado ? [{ clave: 'etiquetaPeriodo', titulo: 'Periodo', formato: resaltar }] : []),
    { clave: 'nombre', titulo: 'Proyecto', formato: resaltar },
    cifra('recaudadoPuntual', 'Donaciones puntuales', formatearEuros),
    cifra('recaudadoCuotas', 'Cuotas de socio', formatearEuros),
    cifra('recaudadoTotal', 'Total recaudado', formatearEuros),
    cifra('aportaciones', 'Aportaciones'),
    cifra('actividades', 'Actividades celebradas'),
    cifra('voluntarios', 'Voluntarios'),
    cifra('horas', 'Horas', formatearHoras),
  ];
}

export default function Informes() {
  const [proyectos, setProyectos] = useState(null); // null = cargando
  const [denegado, setDenegado] = useState(null);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [informe, setInforme] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    api
      .get('/informes/proyectos')
      .then((r) => setProyectos(r.datos))
      .catch((e) => (e.estado === 401 || e.estado === 403 ? setDenegado(e) : setErrorGeneral(e.message)));
  }, []);

  if (denegado?.estado === 401) {
    return (
      <EstadoVacio
        mensaje="Inicia sesión con una cuenta de administración para ver los informes."
        accion={<Boton href="/entrar?volver=/informes">Entrar</Boton>}
      />
    );
  }
  if (denegado) {
    return <Aviso tipo="error" titulo="Acceso denegado">Solo la administración de la ONG puede ver los informes.</Aviso>;
  }

  const cambiar = (campo) => (evento) => setFiltros((f) => ({ ...f, [campo]: evento.target.value }));

  async function generar(evento) {
    evento.preventDefault();
    setErrorGeneral(null);
    const enCliente = validarPeriodo(filtros);
    setErrores(enCliente);
    if (Object.keys(enCliente).length > 0) return;
    setCargando(true);
    try {
      setInforme(await api.get(rutaInforme(filtros)));
    } catch (e) {
      setInforme(null);
      setErrores(e.campos ?? {});
      if (!e.campos || Object.keys(e.campos).length === 0) setErrorGeneral(e.message);
    } finally {
      setCargando(false);
    }
  }

  const opcionesProyecto = [
    { valor: '', texto: 'Todos (con fondo general)' },
    ...(proyectos ?? []).map((p) => ({ valor: p.id, texto: p.activo ? p.nombre : `${p.nombre} (inactivo)` })),
  ];

  return (
    <div className="space-y-6">
      <p className="text-gray-700">
        Dinero recaudado (aportaciones confirmadas, por fecha de cobro) y voluntariado (actividades celebradas, por
        su fecha de inicio), por proyecto y periodo. Solo cifras agregadas, sin datos personales.
      </p>

      <form onSubmit={generar} noValidate className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-start">
        <Campo etiqueta="Desde" tipo="date" value={filtros.desde} onChange={cambiar('desde')} error={errores.desde} />
        <Campo etiqueta="Hasta" tipo="date" value={filtros.hasta} onChange={cambiar('hasta')} error={errores.hasta} />
        <Campo
          etiqueta="Proyecto"
          tipo="select"
          opciones={opcionesProyecto}
          value={filtros.proyectoId}
          onChange={cambiar('proyectoId')}
          error={errores.proyectoId}
          disabled={proyectos === null}
        />
        <Campo
          etiqueta="Agrupación"
          tipo="select"
          opciones={AGRUPACIONES}
          value={filtros.agrupacion}
          onChange={cambiar('agrupacion')}
          error={errores.agrupacion}
        />
        <div className="sm:col-span-2 lg:col-span-4">
          <Boton type="submit" cargando={cargando}>
            Generar informe
          </Boton>
        </div>
      </form>

      <Aviso tipo="error">{errorGeneral}</Aviso>

      {informe && (
        <section className="space-y-4" aria-live="polite">
          <h2 className="text-lg font-semibold">
            Del {formatearFecha(informe.filtros.desde)} al {formatearFecha(informe.filtros.hasta)}
            {' · '}
            {informe.filtros.proyecto ? informe.filtros.proyecto.nombre : 'Todos los proyectos'}
            {' · '}
            {AGRUPACIONES.find((a) => a.valor === (informe.filtros.agrupacion ?? ''))?.texto}
          </h2>
          {informe.vacio ? (
            <EstadoVacio mensaje={MENSAJE_VACIO} />
          ) : (
            <Tabla columnas={columnas(Boolean(informe.filtros.agrupacion))} filas={filasParaTabla(informe)} claveFila="clave" />
          )}
        </section>
      )}
    </div>
  );
}
