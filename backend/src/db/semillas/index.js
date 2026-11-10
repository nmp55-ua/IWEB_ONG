// Datos de prueba comunes (plan-comun.md §8). Se pueden ejecutar varias veces.
// Cada spec añade aquí su fichero de semillas (por ejemplo, donaciones.js) y lo importa al final.
import bcrypt from 'bcrypt';
import { pool } from '../pool.js';
import { sembrarActividades } from './actividades.js';
import { sembrarDonaciones } from './donaciones.js';
import { sembrarAsistencias } from './asistencias.js';
import { sembrarVoluntariado } from './voluntariado.js';

const contrasena = process.env.CONTRASENA_SEMILLAS;
if (!contrasena) {
  console.error('Define CONTRASENA_SEMILLAS en .env (contraseña común de los usuarios de prueba).');
  process.exit(1);
}

const usuarios = [
  { correo: 'donante@ong.test', nombre: 'Lucía Donante', roles: ['donante'] },
  { correo: 'donante2@ong.test', nombre: 'Pablo Donante', roles: ['donante'] },
  { correo: 'voluntario@ong.test', nombre: 'Marta Voluntaria', roles: ['voluntario'] },
  { correo: 'voluntario2@ong.test', nombre: 'Jorge Voluntario', roles: ['voluntario', 'donante'] },
  { correo: 'coordinador@ong.test', nombre: 'Carmen Coordinadora', roles: ['coordinador'] },
  { correo: 'admin@ong.test', nombre: 'Alberto Administrador', roles: ['administrador'] },
];

const proyectos = [
  { nombre: 'Agua potable', descripcion: 'Pozos y depuración de agua en comunidades rurales.', activo: true },
  { nombre: 'Comedor social', descripcion: 'Comidas diarias para personas sin recursos.', activo: true },
  { nombre: 'Campaña 2024', descripcion: 'Campaña de invierno ya finalizada.', activo: false },
];

const hash = await bcrypt.hash(contrasena, 12);
for (const usuario of usuarios) {
  await pool.query(
    `INSERT INTO usuarios (correo, hash_contrasena, nombre, roles) VALUES ($1, $2, $3, $4)
     ON CONFLICT (correo) DO UPDATE SET hash_contrasena = EXCLUDED.hash_contrasena,
       nombre = EXCLUDED.nombre, roles = EXCLUDED.roles, activo = true, actualizado_en = now()`,
    [usuario.correo, hash, usuario.nombre, usuario.roles],
  );
}
for (const proyecto of proyectos) {
  await pool.query(
    `INSERT INTO proyectos (nombre, descripcion, activo) VALUES ($1, $2, $3)
     ON CONFLICT (nombre) DO UPDATE SET descripcion = EXCLUDED.descripcion,
       activo = EXCLUDED.activo, actualizado_en = now()`,
    [proyecto.nombre, proyecto.descripcion, proyecto.activo],
  );
}
console.log(`Semillas comunes: ${usuarios.length} usuarios y ${proyectos.length} proyectos.`);

await sembrarActividades(pool); // spec-007
await sembrarDonaciones(pool); // spec-001: usa los usuarios y proyectos comunes de arriba
await sembrarVoluntariado(pool, hash); // spec-005
await sembrarAsistencias(pool); // spec-008

await pool.end();
