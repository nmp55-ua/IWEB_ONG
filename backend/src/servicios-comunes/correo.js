// Correo de texto en español. Si falla el envío se registra y NO se deshace la operación.
import nodemailer from 'nodemailer';
import { config } from '../config.js';

const opcionesBase = {
  host: config.smtp.host,
  port: config.smtp.puerto,
  secure: false,
};

const transporte = nodemailer.createTransport({ ...opcionesBase });

export async function enviarCorreo({ para, asunto, texto }, opciones = {}) {
  try {
    const tiempos = {};
    if (opciones.tiempoConexionMs !== undefined) tiempos.connectionTimeout = opciones.tiempoConexionMs;
    if (opciones.tiempoSaludoMs !== undefined) tiempos.greetingTimeout = opciones.tiempoSaludoMs;
    if (opciones.tiempoInactividadMs !== undefined) tiempos.socketTimeout = opciones.tiempoInactividadMs;

    const transporteEnvio = Object.keys(tiempos).length
      ? nodemailer.createTransport({ ...opcionesBase, ...tiempos })
      : transporte;
    await transporteEnvio.sendMail({ from: config.smtp.remitente, to: para, subject: asunto, text: texto });
    // La aceptación SMTP no acredita la recepción en el buzón destinatario.
    return true;
  } catch (error) {
    console.error(`No se pudo enviar el correo «${asunto}» a ${para}: ${error.message}`);
    return false;
  }
}
