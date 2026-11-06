import { z } from 'zod';
import { config } from '../../config.js';
import { validarSolicitudNavegador } from './autorizacion.js';

const csrf = z.string();
const clave = z.string().uuid();
const id = z
  .string()
  .regex(/^[1-9][0-9]*$/)
  .refine((x) => BigInt(x) <= 9223372036854775807n);
const donante = z
  .object({
    nombre: z.string(),
    apellidos: z.string(),
    nifNie: z.string(),
    correo: z.string(),
    direccion: z.string(),
  })
  .strict();
const completa = z
  .object({
    tokenCsrf: csrf,
    claveSolicitud: clave,
    modalidad: z.literal('puntual'),
    importe: z.string(),
    proyectoId: id.nullable().optional(),
    donante,
  })
  .strict();
const corta = z.object({ tokenCsrf: csrf, claveSolicitud: clave }).strict();
const soloCsrf = z.object({ tokenCsrf: csrf }).strict();

export function crearControlador(servicio) {
  const navegador = (req, esquema) => {
    validarSolicitudNavegador(req, config.urlFrontend);
    return esquema.parse(req.body);
  };
  return {
    contexto: async (req, res) => {
      res.set('Cache-Control', 'no-store').json(await servicio.contexto(req));
    },
    crear: async (req, res) => {
      const datos = navegador(req, z.union([completa, corta]));
      const { nueva, ...resultado } = await servicio.crear(req, datos);
      res.status(nueva ? 201 : 200).json(resultado);
    },
    resultado: async (req, res) => {
      res.set('Cache-Control', 'no-store').json(await servicio.resultado(req, req.params.referencia));
    },
    correo: async (req, res) => {
      navegador(req, soloCsrf);
      res.json(await servicio.reintentarCorreo(req, req.params.referencia));
    },
    solicitarVinculo: async (req, res) => {
      navegador(req, soloCsrf);
      res.status(202).json(await servicio.solicitarVinculo(req));
    },
    confirmarVinculo: async (req, res) => {
      const datos = navegador(req, z.object({ tokenCsrf: csrf, token: z.string() }).strict());
      res.json(await servicio.confirmarVinculo(req, datos.token));
    },
    webhook: async (req, res) => {
      res.json(await servicio.webhook(req.body, req.get('stripe-signature')));
    },
  };
}
