// Correo de texto en español. Si falla el envío se registra y NO se deshace la operación.
import nodemailer from 'nodemailer';
import { config } from '../config.js';

const transporte = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.puerto,
  secure: false,
});

export async function enviarCorreo({ para, asunto, texto }) {
  try {
    await transporte.sendMail({ from: config.smtp.remitente, to: para, subject: asunto, text: texto });
    return true;
  } catch (error) {
    console.error(`No se pudo enviar el correo «${asunto}» a ${para}: ${error.message}`);
    return false;
  }
}
