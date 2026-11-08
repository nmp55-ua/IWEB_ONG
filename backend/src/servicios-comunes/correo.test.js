import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const smtp = vi.hoisted(() => ({ crearTransporte: vi.fn() }));

vi.mock('nodemailer', () => ({ default: { createTransport: smtp.crearTransporte } }));
vi.mock('../config.js', () => ({
  config: {
    smtp: Object.freeze({
      host: 'smtp.example.test',
      puerto: 2525,
      remitente: 'ONG <no-responder@example.test>',
    }),
  },
}));

const configuracionBase = Object.freeze({ host: 'smtp.example.test', port: 2525, secure: false });
const opcionesHu01 = Object.freeze({
  tiempoConexionMs: 3000,
  tiempoSaludoMs: 3000,
  tiempoInactividadMs: 5000,
});
const mensaje = Object.freeze({
  para: 'destino@example.test',
  asunto: 'Confirmación',
  texto: 'Aportación registrada.',
});
const mensajeSmtp = Object.freeze({
  from: 'ONG <no-responder@example.test>',
  to: mensaje.para,
  subject: mensaje.asunto,
  text: mensaje.texto,
});
const aceptacionSmtp = Object.freeze({ accepted: [mensaje.para], messageId: 'mensaje-sintetico' });

function comprobarLlamadaUnica(simulado, argumento) {
  expect(simulado).toHaveBeenCalledTimes(1);
  expect(simulado).toHaveBeenCalledWith(argumento);
}

let enviarCorreo;
let transportes;

beforeEach(async () => {
  vi.resetModules();
  transportes = [];
  smtp.crearTransporte.mockReset();
  smtp.crearTransporte.mockImplementation((opciones) => {
    Object.freeze(opciones);
    const transporte = Object.freeze({
      options: opciones,
      sendMail: vi.fn().mockResolvedValue(aceptacionSmtp),
    });
    transportes.push(transporte);
    return transporte;
  });
  vi.spyOn(console, 'error').mockImplementation(() => {});
  ({ enviarCorreo } = await import('./correo.js'));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('HU-01 · P-03 · compatibilidad del correo sin opciones', () => {
  it('crea una sola vez el transporte original sin introducir tiempos globales', () => {
    comprobarLlamadaUnica(smtp.crearTransporte, configuracionBase);
    expect(transportes[0].options).toEqual(configuracionBase);
  });

  it('conserva el mensaje y devuelve true al aceptar SMTP, sin acreditar recepción', async () => {
    expect(aceptacionSmtp).not.toHaveProperty('delivered');
    expect(await enviarCorreo(mensaje)).toBe(true);
    comprobarLlamadaUnica(transportes[0].sendMail, mensajeSmtp);
    expect(smtp.crearTransporte).toHaveBeenCalledTimes(1);
    expect(mensaje).toEqual({ para: mensajeSmtp.to, asunto: mensajeSmtp.subject, texto: mensajeSmtp.text });
  });

  it('reutiliza el mismo transporte en llamadas existentes sucesivas', async () => {
    await enviarCorreo(mensaje);
    await enviarCorreo({ ...mensaje, asunto: 'Actividad modificada' });
    expect(smtp.crearTransporte).toHaveBeenCalledTimes(1);
    expect(transportes[0].sendMail).toHaveBeenCalledTimes(2);
    expect(transportes[0].sendMail.mock.calls[1][0].subject).toBe('Actividad modificada');
  });

  it.each([
    ['omitidas', undefined],
    ['vacías', {}],
  ])('mantiene el transporte con opciones %s', async (_, opciones) => {
    expect(await enviarCorreo(mensaje, opciones)).toBe(true);
    expect(smtp.crearTransporte).toHaveBeenCalledTimes(1);
    comprobarLlamadaUnica(transportes[0].sendMail, mensajeSmtp);
  });

  it('devuelve false y registra el fallo sin reintentar automáticamente', async () => {
    transportes[0].sendMail.mockRejectedValueOnce(new Error('SMTP simulado no disponible'));
    expect(await enviarCorreo(mensaje)).toBe(false);
    expect(transportes[0].sendMail).toHaveBeenCalledTimes(1);
    comprobarLlamadaUnica(
      console.error,
      'No se pudo enviar el correo «Confirmación» a destino@example.test: SMTP simulado no disponible',
    );
  });
});

describe('HU-01 · P-03 · tiempos de un transporte separado', () => {
  it.each([
    ['tiempoConexionMs', 'connectionTimeout', 3000],
    ['tiempoSaludoMs', 'greetingTimeout', 3000],
    ['tiempoInactividadMs', 'socketTimeout', 5000],
  ])('traduce únicamente %s a %s', async (campo, opcionSmtp, valor) => {
    expect(await enviarCorreo(mensaje, { [campo]: valor })).toBe(true);
    expect(smtp.crearTransporte).toHaveBeenCalledTimes(2);
    expect(transportes[1].options).toEqual({ ...configuracionBase, [opcionSmtp]: valor });
    comprobarLlamadaUnica(transportes[1].sendMail, mensajeSmtp);
    expect(transportes[0].sendMail).not.toHaveBeenCalled();
  });

  it('aplica 3000/3000/5000 sin mutar mensaje, opciones o transporte heredado', async () => {
    expect(await enviarCorreo(mensaje, opcionesHu01)).toBe(true);
    expect(transportes[1].options).toEqual({
      ...configuracionBase,
      connectionTimeout: 3000,
      greetingTimeout: 3000,
      socketTimeout: 5000,
    });
    comprobarLlamadaUnica(transportes[1].sendMail, mensajeSmtp);
    expect(transportes[0].options).toEqual(configuracionBase);
    expect(opcionesHu01).toEqual({ tiempoConexionMs: 3000, tiempoSaludoMs: 3000, tiempoInactividadMs: 5000 });
  });

  it('no introduce campos undefined en las opciones del transporte nuevo', async () => {
    await enviarCorreo(mensaje, { tiempoConexionMs: 3000, tiempoSaludoMs: undefined });
    expect(transportes[1].options).toEqual({ ...configuracionBase, connectionTimeout: 3000 });
  });

  it('solo admite los nombres de tiempos previstos, sin propagar host o remitente arbitrarios', async () => {
    await enviarCorreo(mensaje, {
      tiempoConexionMs: 3000,
      host: 'otro.example.test',
      from: 'ajeno@example.test',
    });
    expect(transportes[1].options).toEqual({ ...configuracionBase, connectionTimeout: 3000 });
    comprobarLlamadaUnica(transportes[1].sendMail, mensajeSmtp);
  });

  it('conserva el transporte original al alternar envíos con y sin tiempos', async () => {
    const otro = {
      para: 'actividad@example.test',
      asunto: 'Cambio de lugar',
      texto: 'Nuevo lugar de la actividad.',
    };
    await enviarCorreo(mensaje, opcionesHu01);
    await enviarCorreo(otro);
    expect(smtp.crearTransporte).toHaveBeenCalledTimes(2);
    expect(transportes[0].options).toEqual(configuracionBase);
    comprobarLlamadaUnica(transportes[0].sendMail, {
      from: mensajeSmtp.from,
      to: otro.para,
      subject: otro.asunto,
      text: otro.texto,
    });
  });

  it('aísla dos configuraciones de tiempos distintas y una llamada heredada concurrente', async () => {
    expect(
      await Promise.all([
        enviarCorreo(mensaje, opcionesHu01),
        enviarCorreo(mensaje, { tiempoConexionMs: 4500 }),
        enviarCorreo(mensaje),
      ]),
    ).toEqual([true, true, true]);
    expect(smtp.crearTransporte).toHaveBeenCalledTimes(3);
    expect(transportes[0].options).toEqual(configuracionBase);
    expect(transportes[1].options).toEqual({
      ...configuracionBase,
      connectionTimeout: 3000,
      greetingTimeout: 3000,
      socketTimeout: 5000,
    });
    expect(transportes[2].options).toEqual({ ...configuracionBase, connectionTimeout: 4500 });
    for (const transporte of transportes) comprobarLlamadaUnica(transporte.sendMail, mensajeSmtp);
  });

  it('devuelve false cuando falla el envío con tiempos y mantiene disponible el transporte heredado', async () => {
    const envioFallido = vi.fn().mockRejectedValueOnce(new Error('Fallo SMTP sintético'));
    smtp.crearTransporte.mockReturnValueOnce({ sendMail: envioFallido });
    expect(await enviarCorreo(mensaje, opcionesHu01)).toBe(false);
    comprobarLlamadaUnica(envioFallido, mensajeSmtp);
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(await enviarCorreo(mensaje)).toBe(true);
    comprobarLlamadaUnica(transportes[0].sendMail, mensajeSmtp);
  });

  it('devuelve false si no puede crear el transporte opcional, sin usar otro para reintentar', async () => {
    smtp.crearTransporte.mockImplementationOnce(() => {
      throw new Error('Error de transporte simulado');
    });
    expect(await enviarCorreo(mensaje, opcionesHu01)).toBe(false);
    expect(transportes[0].sendMail).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledTimes(1);
  });
});
