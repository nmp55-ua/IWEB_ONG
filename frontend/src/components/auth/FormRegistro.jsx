import { useState } from 'react';
import { api } from '../../lib/api.js';
import Aviso from '../comunes/Aviso.jsx';
import Boton from '../comunes/Boton.jsx';
import Campo from '../comunes/Campo.jsx';

// Al registrarse solo se elige donante y/o voluntario (modelo-datos.md, usuarios).
export default function FormRegistro() {
  const [datos, setDatos] = useState({ nombre: '', correo: '', contrasena: '', donante: true, voluntario: false });
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  const cambiar = (e) => {
    const { name, type, checked, value } = e.target;
    setDatos({ ...datos, [name]: type === 'checkbox' ? checked : value });
  };

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    const roles = [datos.donante && 'donante', datos.voluntario && 'voluntario'].filter(Boolean);
    try {
      await api.post('/auth/registro', { nombre: datos.nombre, correo: datos.correo, contrasena: datos.contrasena, roles });
      window.location.href = '/';
    } catch (err) {
      setError(err);
      setCargando(false);
    }
  }

  const campos = error?.campos ?? {};
  return (
    <form onSubmit={enviar} className="bg-white rounded shadow-sm p-6 max-w-md" noValidate>
      {error && Object.keys(campos).length === 0 && <Aviso tipo="error">{error.message}</Aviso>}
      <Campo etiqueta="Nombre y apellidos" name="nombre" autoComplete="name"
        value={datos.nombre} onChange={cambiar} error={campos.nombre} />
      <Campo etiqueta="Correo electrónico" name="correo" tipo="email" autoComplete="email"
        value={datos.correo} onChange={cambiar} error={campos.correo} />
      <Campo etiqueta="Contraseña" name="contrasena" tipo="password" autoComplete="new-password"
        ayuda="Al menos 8 caracteres." value={datos.contrasena} onChange={cambiar} error={campos.contrasena} />
      <fieldset className="mb-2">
        <legend className="font-medium mb-2">¿Cómo quieres colaborar?</legend>
        <Campo tipo="checkbox" etiqueta="Como donante" name="donante" checked={datos.donante} onChange={cambiar} className="mb-1" />
        <Campo tipo="checkbox" etiqueta="Como voluntario" name="voluntario" checked={datos.voluntario} onChange={cambiar}
          error={campos.roles} />
      </fieldset>
      <Boton type="submit" cargando={cargando}>Crear cuenta</Boton>
    </form>
  );
}
