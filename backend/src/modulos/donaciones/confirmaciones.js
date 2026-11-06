import { ErrorApi } from '../../middleware/errores.js';

export function crearConfirmaciones(repo, enviarCorreo) {
  return {
    async enviar(aportacionId) {
      const actual = await repo.correo(aportacionId);
      if (!actual) return 'noPrevisto';
      if (actual.estado === 'enviado') return 'enviado';
      const intento = await repo.reclamarCorreo(aportacionId);
      if (!intento) throw new ErrorApi(409, 'CORREO_EN_ENVIO', 'El correo se está enviando.');
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
            asunto: 'Confirmación de aportación',
            texto: Object.entries(intento.resumen)
              .map(([campo, valor]) => `${campo}: ${valor ?? ''}`)
              .join('\n'),
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
      const estado = (await repo.correo(aportacionId)).estado;
      if (estado === 'enviando') throw new ErrorApi(409, 'CORREO_EN_ENVIO', 'El correo se está enviando.');
      return estado;
    },
  };
}
