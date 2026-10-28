import { z } from 'zod';
import * as servicio from './servicio.js';

const esquemaRegistro = z.object({
  nombre: z.string().trim().min(1, 'Indica tu nombre.'),
  correo: z.string().trim().email('Introduce un correo válido.'),
  contrasena: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
  roles: z
    .array(z.enum(['donante', 'voluntario'], { message: 'Solo puedes registrarte como donante o voluntario.' }))
    .min(1, 'Elige si quieres colaborar como donante, como voluntario o ambos.'),
});

const esquemaSesion = z.object({
  correo: z.string().trim().min(1, 'Indica tu correo.'),
  contrasena: z.string().min(1, 'Indica tu contraseña.'),
});

function iniciarSesion(req, usuario) {
  return new Promise((resolver, rechazar) => {
    // Nueva sesión al identificarse, para evitar la fijación de sesión.
    req.session.regenerate((error) => {
      if (error) return rechazar(error);
      req.session.usuarioId = usuario.id;
      resolver();
    });
  });
}

export async function registro(req, res) {
  const datos = esquemaRegistro.parse(req.body);
  const usuario = await servicio.registrar({ ...datos, roles: [...new Set(datos.roles)] });
  await iniciarSesion(req, usuario);
  res.status(201).json(usuario);
}

export async function entrar(req, res) {
  const usuario = await servicio.comprobarCredenciales(esquemaSesion.parse(req.body));
  await iniciarSesion(req, usuario);
  res.json(usuario);
}

export function salir(req, res, next) {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie('ong.sid');
    res.status(204).end();
  });
}

export function yo(req, res) {
  res.json(req.usuario);
}
