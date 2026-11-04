import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import Aviso from '../comunes/Aviso.jsx';
import Campo from '../comunes/Campo.jsx';
import Modal from '../comunes/Modal.jsx';

const SIN_PERFIL = { nombre: '', apellidos: '', correo: '', telefono: '' };

// Ventana de inscripción de HU-05: requisitos (FR-004), datos de contacto la primera vez (FR-011) y
// lista de espera solo si se pide (FR-007).
export default function FormInscripcion({
  abierto,
  actividad,
  usuario,
  listaEspera: pedirEspera,
  onCerrar,
  onHecho,
}) {
  const [perfil, setPerfil] = useState(undefined); // undefined = cargando, null = todavía no tiene
  const [datos, setDatos] = useState(SIN_PERFIL);
  const [acepta, setAcepta] = useState(false);
  const [listaEspera, setListaEspera] = useState(pedirEspera);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setPerfil(undefined);
    setAcepta(false);
    setListaEspera(pedirEspera);
    setError(null);
    api
      .get('/yo/perfil-voluntario')
      .then(setPerfil)
      .catch((err) => {
        if (err.estado === 404) {
          setPerfil(null);
          setDatos({ ...SIN_PERFIL, correo: usuario?.correo ?? '' });
        } else {
          setError(err); // 403: no es voluntario (FR-004)
        }
      });
  }, [abierto, pedirEspera, usuario]);

  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  async function confirmar() {
    setCargando(true);
    setError(null);
    try {
      if (perfil === null) setPerfil(await api.put('/yo/perfil-voluntario', datos));
      const inscripcion = await api.post(`/actividades/${actividad.id}/inscripciones`, {
        aceptaRequisitos: acepta,
        listaEspera,
      });
      onHecho(inscripcion);
    } catch (err) {
      // Si otra persona se acaba de llevar la última plaza, se ofrece la lista de espera (FR-007).
      if (err.codigo === 'PLAZAS_AGOTADAS') setListaEspera(true);
      setError(err);
    } finally {
      setCargando(false);
    }
  }

  const denegado = error?.estado === 403;
  const campos = error?.campos ?? {};

  return (
    <Modal
      abierto={abierto}
      titulo={listaEspera ? 'Apuntarme a la lista de espera' : 'Inscribirme'}
      textoConfirmar={listaEspera ? 'Apuntarme a la lista de espera' : 'Confirmar inscripción'}
      cargando={cargando}
      onConfirmar={denegado || perfil === undefined ? undefined : confirmar}
      onCerrar={onCerrar}
    >
      <p className="font-medium mb-2">{actividad.titulo}</p>
      {error && Object.keys(campos).length === 0 && (
        <Aviso tipo={error.codigo === 'PLAZAS_AGOTADAS' ? 'aviso' : 'error'}>{error.message}</Aviso>
      )}
      {!denegado && perfil === undefined && <p>Cargando…</p>}
      {!denegado && perfil !== undefined && (
        <>
          {listaEspera && (
            <p className="text-sm mb-3">
              Ahora no quedan plazas. Si se libera una, quedarás inscrito automáticamente y te avisaremos por
              correo.
            </p>
          )}
          <p className="text-sm mb-1 font-medium">Requisitos</p>
          <p className="text-sm mb-3">{actividad.requisitos || 'Sin requisitos'}</p>
          <Campo
            tipo="checkbox"
            etiqueta="Cumplo los requisitos de esta actividad"
            checked={acepta}
            onChange={(e) => setAcepta(e.target.checked)}
            error={campos.aceptaRequisitos}
          />
          {perfil === null && (
            <fieldset>
              <legend className="font-medium mb-2">Tus datos de contacto</legend>
              <Campo
                etiqueta="Nombre"
                name="nombre"
                value={datos.nombre}
                onChange={cambiar}
                error={campos.nombre}
              />
              <Campo
                etiqueta="Apellidos"
                name="apellidos"
                value={datos.apellidos}
                onChange={cambiar}
                error={campos.apellidos}
              />
              <Campo
                etiqueta="Correo electrónico"
                name="correo"
                tipo="email"
                value={datos.correo}
                onChange={cambiar}
                error={campos.correo}
              />
              <Campo
                etiqueta="Teléfono"
                name="telefono"
                tipo="tel"
                value={datos.telefono}
                onChange={cambiar}
                error={campos.telefono}
              />
            </fieldset>
          )}
        </>
      )}
    </Modal>
  );
}
