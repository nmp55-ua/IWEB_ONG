import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import Aviso from '../comunes/Aviso.jsx';
import Boton from '../comunes/Boton.jsx';
import Campo from '../comunes/Campo.jsx';
import { isoALocalMadrid, localAIsoMadrid } from './fechasFormulario.js';

// Alta (sin «actividad») y edición (con «actividad») de una actividad.
export default function FormActividad({ actividad, onGuardada }) {
  const [datos, setDatos] = useState(() => ({
    titulo: actividad?.titulo ?? '',
    descripcion: actividad?.descripcion ?? '',
    proyectoId: actividad ? String(actividad.proyecto.id) : '',
    inicio: isoALocalMadrid(actividad?.inicio),
    fin: isoALocalMadrid(actividad?.fin),
    lugar: actividad?.lugar ?? '',
    plazas: actividad ? String(actividad.plazas) : '',
    requisitos: actividad?.requisitos ?? '',
  }));
  const [proyectos, setProyectos] = useState([]);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    api
      .get('/proyectos')
      .then(({ datos: activos }) => {
        // Si la actividad es de un proyecto ya inactivo, se sigue mostrando como opción.
        const lista = activos.map((p) => ({ valor: String(p.id), texto: p.nombre }));
        if (actividad && !lista.some((p) => p.valor === String(actividad.proyecto.id))) {
          lista.push({
            valor: String(actividad.proyecto.id),
            texto: `${actividad.proyecto.nombre} (inactivo)`,
          });
        }
        setProyectos(lista);
      })
      .catch(setError);
  }, [actividad]);

  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    setExito(false);
    const cuerpo = {
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      proyectoId: datos.proyectoId ? Number(datos.proyectoId) : undefined,
      inicio: localAIsoMadrid(datos.inicio) || undefined,
      fin: localAIsoMadrid(datos.fin) || undefined,
      lugar: datos.lugar,
      plazas: datos.plazas === '' ? undefined : Number(datos.plazas),
      requisitos: datos.requisitos,
    };
    try {
      const guardada = actividad
        ? await api.patch(`/actividades/${actividad.id}`, cuerpo)
        : await api.post('/actividades', cuerpo);
      if (!actividad) {
        // Alta: se continúa en el detalle de la nueva actividad (en borrador).
        window.location.href = `/coordinacion/actividades/${guardada.id}?creada=1`;
        return;
      }
      setExito(true);
      onGuardada?.(guardada);
    } catch (err) {
      setError(err);
    } finally {
      setCargando(false);
    }
  }

  const campos = error?.campos ?? {};
  const hayErrorDeCampo = Object.keys(campos).length > 0;

  return (
    <form onSubmit={enviar} className="bg-white rounded shadow-sm p-6 max-w-2xl" noValidate>
      {error && <Aviso tipo="error">{hayErrorDeCampo ? 'Revisa los datos marcados.' : error.message}</Aviso>}
      {exito && <Aviso tipo="exito">Cambios guardados.</Aviso>}
      <Campo etiqueta="Título" name="titulo" value={datos.titulo} onChange={cambiar} error={campos.titulo} />
      <Campo
        etiqueta="Descripción"
        name="descripcion"
        tipo="textarea"
        value={datos.descripcion}
        onChange={cambiar}
        error={campos.descripcion}
      />
      <Campo
        etiqueta="Proyecto"
        name="proyectoId"
        tipo="select"
        value={datos.proyectoId}
        onChange={cambiar}
        error={campos.proyectoId}
        opciones={[{ valor: '', texto: 'Elige un proyecto' }, ...proyectos]}
      />
      <div className="grid gap-x-4 sm:grid-cols-2">
        <Campo
          etiqueta="Inicio"
          name="inicio"
          tipo="datetime-local"
          value={datos.inicio}
          onChange={cambiar}
          error={campos.inicio}
        />
        <Campo
          etiqueta="Fin"
          name="fin"
          tipo="datetime-local"
          value={datos.fin}
          onChange={cambiar}
          error={campos.fin}
        />
      </div>
      <Campo etiqueta="Lugar" name="lugar" value={datos.lugar} onChange={cambiar} error={campos.lugar} />
      <Campo
        etiqueta="Plazas"
        name="plazas"
        tipo="number"
        min="1"
        step="1"
        value={datos.plazas}
        onChange={cambiar}
        error={campos.plazas}
      />
      <Campo
        etiqueta="Requisitos"
        name="requisitos"
        tipo="textarea"
        value={datos.requisitos}
        onChange={cambiar}
        error={campos.requisitos}
        ayuda="Opcional. Por ejemplo: mayor de edad, traer guantes…"
      />
      <Boton type="submit" cargando={cargando}>
        Guardar
      </Boton>
    </form>
  );
}
