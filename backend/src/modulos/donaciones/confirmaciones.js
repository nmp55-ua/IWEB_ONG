import { ErrorApi } from '../../middleware/errores.js';
import { textoCorreoConfirmacion, textoCorreoFalloCuota } from './textoCorreo.js';

// Cada tipo de mensaje es independiente (UNIQUE aportacion_id, tipo): el aviso de fallo de
// cuota no sustituye ni reutiliza la confirmación.
const MENSAJES = {
  confirmacion: { asunto: 'Confirmación de aportación', texto: textoCorreoConfirmacion },
  fallo_cuota: { asunto: 'Aviso de cuota de socio no cobrada', texto: textoCorreoFalloCuota },
};

export function crearConfirmaciones(repo, enviarCorreo) {
  return {
    async enviar(aportacionId, tipo = 'confirmacion') {
      const mensaje = MENSAJES[tipo];
      if (!mensaje) return 'noPrevisto';
      const actual = await repo.correo(aportacionId, tipo);
      if (!actual) return 'noPrevisto';
      if (actual.estado === 'enviado') return 'enviado';
      const intento = await repo.reclamarCorreo(aportacionId, tipo);
      if (!intento) {
        // Otro intento puede haber terminado entre la lectura y el UPDATE de reclamación.
        if ((await repo.correo(aportacionId, tipo))?.estado === 'enviado') return 'enviado';
        throw new ErrorApi(409, 'CORREO_EN_ENVIO', 'El correo se está enviando.');
      }
      let vigente = true;
      let renovacion = Promise.resolve();
      const temporizador = setInterval(() => {
        renovacion = renovacion
          .then(async () => {
            if (vigente) vigente = await repo.renovarCorreo(intento);
          })
          .catch(() => {
            vigente = false;
          });
      }, 10000);
      temporizador.unref?.();
      let aceptado = false;
      try {
        aceptado = await enviarCorreo(
          {
            para: actual.correo,
            asunto: mensaje.asunto,
            texto: mensaje.texto(intento.resumen),
          },
          { tiempoConexionMs: 3000, tiempoSaludoMs: 3000, tiempoInactividadMs: 5000 },
        );
      } catch {
        aceptado = false;
      } finally {
        clearInterval(temporizador);
        await renovacion;
      }
      if (vigente) await repo.terminarCorreo(intento, aceptado === true);
      const estado = (await repo.correo(aportacionId, tipo)).estado;
      if (estado === 'enviando') throw new ErrorApi(409, 'CORREO_EN_ENVIO', 'El correo se está enviando.');
      return estado;
    },
  };
}
