import { useState } from 'react';
import { api } from '../../lib/api.js';
import Aviso from '../comunes/Aviso.jsx';
import Boton from '../comunes/Boton.jsx';
import Campo from '../comunes/Campo.jsx';

export default function FormEntrar({ volverA = '/' }) {
  const [datos, setDatos] = useState({ correo: '', contrasena: '' });
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      await api.post('/auth/sesion', datos);
      window.location.href = volverA;
    } catch (err) {
      setError(err);
      setCargando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="bg-white rounded shadow-sm p-6 max-w-md" noValidate>
      {error && !error.campos?.correo && <Aviso tipo="error">{error.message}</Aviso>}
      <Campo etiqueta="Correo electrónico" name="correo" tipo="email" autoComplete="email"
        value={datos.correo} onChange={cambiar} error={error?.campos?.correo} />
      <Campo etiqueta="Contraseña" name="contrasena" tipo="password" autoComplete="current-password"
        value={datos.contrasena} onChange={cambiar} error={error?.campos?.contrasena} />
      <Boton type="submit" cargando={cargando}>Entrar</Boton>
      <p className="mt-4 text-sm">¿No tienes cuenta? <a href="/registro" className="text-marca-500 underline">Crear cuenta</a></p>
    </form>
  );
}
