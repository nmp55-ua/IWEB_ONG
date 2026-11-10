import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';

// Enlaces por rol. Cada spec añade aquí los suyos cuando tenga la página.
// Solo es comodidad: quien decide el acceso es siempre el servidor.
const ENLACES = [
  { rol: null, href: '/actividades', texto: 'Actividades' }, // spec-005
  { rol: null, href: '/donar', texto: 'Donar' }, // spec-001
  { rol: 'donante', href: '/mis-aportaciones', texto: 'Mis aportaciones' }, // spec-002
  { rol: 'donante', href: '/mis-certificados', texto: 'Certificados' }, // spec-003
  { rol: 'voluntario', href: '/mi-calendario', texto: 'Mi calendario' }, // spec-006
  { rol: 'coordinador', href: '/coordinacion/actividades', texto: 'Gestionar actividades' }, // spec-007
  // { rol: 'administrador', href: '/informes', texto: 'Informes' },               ← spec-004
];

export default function Menu() {
  const [usuario, setUsuario] = useState(undefined); // undefined = cargando, null = sin sesión

  useEffect(() => {
    api
      .get('/auth/yo')
      .then(setUsuario)
      .catch(() => setUsuario(null));
  }, []);

  async function salir() {
    await api.delete('/auth/sesion').catch(() => {});
    window.location.href = '/';
  }

  const visibles = ENLACES.filter((e) => e.rol === null || usuario?.roles?.includes(e.rol));

  return (
    <nav className="flex flex-wrap items-center gap-4 text-sm">
      {visibles.map((e) => (
        <a key={e.href} href={e.href} className="hover:underline">
          {e.texto}
        </a>
      ))}
      {usuario === null && (
        <>
          <a href="/entrar" className="hover:underline">
            Entrar
          </a>
          <a href="/registro" className="bg-white text-marca-700 px-3 py-1 rounded font-medium">
            Crear cuenta
          </a>
        </>
      )}
      {usuario && (
        <>
          <span className="opacity-80">Hola, {usuario.nombre}</span>
          <button type="button" onClick={salir} className="hover:underline">
            Salir
          </button>
        </>
      )}
    </nav>
  );
}
