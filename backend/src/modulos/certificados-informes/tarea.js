// HU-03: tarea programada (research R3). Cada hora en el minuto 5, hora de Madrid; la primera del
// año es el 1 de enero a las 00:05 (FR-001) y las demás recogen las confirmaciones tardías (FR-008).
// La programa servidor.js; las pruebas usan crearApp y no la activan.
import cron from 'node-cron';
import { servicio } from './servicio.js';

export const EXPRESION = '5 * * * *';

export async function ejecutarTarea(reconciliar = () => servicio.reconciliarCerrados()) {
  try {
    const resultados = await reconciliar();
    for (const r of resultados) {
      if (r.emitidos || r.regenerados || r.correosFallidos) {
        console.log(
          `Certificados ${r.ejercicio}: ${r.emitidos} emitidos, ${r.regenerados} regenerados, ${r.correosFallidos} correos fallidos.`,
        );
      }
    }
  } catch (error) {
    // No se tumba el servidor: la siguiente ejecución lo vuelve a intentar.
    console.error(`Error al generar certificados: ${error.message}`);
  }
}

export function programarCertificados({ programar = cron.schedule } = {}) {
  return programar(EXPRESION, () => ejecutarTarea(), { timezone: 'Europe/Madrid' });
}
