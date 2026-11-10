import { describe, expect, it, vi } from 'vitest';
import {
  prepararContextoDonaciones,
  registrarPermisoOperacion,
  autorizarAportacion,
  validarSolicitudNavegador,
} from './autorizacion.js';

const inicio = 1800000000000;
const ochoHoras = 8 * 60 * 60 * 1000;
const propietario = '9007199254740993';
const vecino = '9007199254740992';
const filaA = Object.freeze({ referencia: 'A', usuarioIdDonante: propietario });
const filaB = Object.freeze({ referencia: 'B', usuarioIdDonante: propietario });
const origen = 'https://ong.example.test';
function peticion() {
  return { session: { save: vi.fn((callback) => callback()) }, headers: {}, body: {}, usuario: null };
}
function cuenta(id = propietario, roles = ['donante']) {
  const req = peticion();
  req.session.usuarioId = id;
  req.usuario = { id, roles, correo: 'persona@example.test' };
  return req;
}
function deniega(accion, estado = 404, codigo = 'APORTACION_NO_DISPONIBLE') {
  expect(accion).toThrow(expect.objectContaining({ estado, codigo }));
}

describe('HU-01 · sesión persistida antes de continuar', () => {
  it('genera CSRF aleatorio, estable y separado de usuarioId', async () => {
    const req = cuenta();
    const primero = await prepararContextoDonaciones(req);
    expect(primero.tokenCsrf).toMatch(/^[a-f0-9]{64}$/);
    expect(await prepararContextoDonaciones(req)).toEqual(primero);
    const otra = await prepararContextoDonaciones(peticion());
    expect(otra.tokenCsrf).not.toBe(primero.tokenCsrf);
    expect(req.session.usuarioId).toBe(propietario);
    expect(req.session.save).toHaveBeenCalledTimes(2);
  });
  it('espera el callback de save antes de permitir la continuación', async () => {
    const req = peticion();
    let callback;
    req.session.save.mockImplementation((cb) => {
      callback = cb;
    });
    const continuar = vi.fn();
    const pendiente = registrarPermisoOperacion(req, 'A', inicio).then(continuar);
    await Promise.resolve();
    expect(continuar).not.toHaveBeenCalled();
    callback();
    await pendiente;
    expect(continuar).toHaveBeenCalledTimes(1);
  });
  it.each(['contexto', 'permiso'])(
    'revierte el estado local y no continúa si falla guardar %s',
    async (modo) => {
      const req = peticion();
      req.session.save.mockImplementation((cb) => cb(new Error('detalle privado')));
      const continuar = vi.fn();
      const llamada =
        modo === 'contexto' ? prepararContextoDonaciones(req) : registrarPermisoOperacion(req, 'A', inicio);
      await expect(llamada.then(continuar)).rejects.toMatchObject({
        estado: 503,
        codigo: 'SESION_NO_DISPONIBLE',
      });
      expect(req.session.donaciones).toBeUndefined();
      expect(continuar).not.toHaveBeenCalled();
      deniega(() => autorizarAportacion(req, 'A', filaA, inicio));
    },
  );
  it('conserva permisos previos ante un fallo síncrono de guardado', async () => {
    const req = peticion();
    await registrarPermisoOperacion(req, 'A', inicio);
    const antes = structuredClone(req.session.donaciones);
    req.session.save.mockImplementation(() => {
      throw new Error('fallo sintético');
    });
    await expect(registrarPermisoOperacion(req, 'B', inicio)).rejects.toMatchObject({ estado: 503 });
    expect(req.session.donaciones).toEqual(antes);
    expect(autorizarAportacion(req, 'A', filaA, inicio)).toBe(true);
    deniega(() => autorizarAportacion(req, 'B', filaB, inicio));
  });
  it('falla sin sesión o sin mecanismo de guardado', async () => {
    for (const req of [{}, { session: {} }]) {
      await expect(prepararContextoDonaciones(req)).rejects.toMatchObject({ estado: 503 });
      await expect(registrarPermisoOperacion(req, 'A', inicio)).rejects.toMatchObject({ estado: 503 });
    }
  });
});

describe('HU-01 · permiso absoluto por operación', () => {
  it.each([0, ochoHoras - 1])(
    'autoriza A a los %i ms, sin renovar al consultar o repetir',
    async (transcurrido) => {
      const req = peticion();
      await registrarPermisoOperacion(req, 'A', inicio);
      const antes = structuredClone(req.session.donaciones);
      expect(autorizarAportacion(req, 'A', filaA, inicio + transcurrido)).toBe(true);
      await registrarPermisoOperacion(req, 'A', inicio + transcurrido);
      expect(req.session.donaciones).toEqual(antes);
    },
  );
  it.each([ochoHoras, ochoHoras + 1])(
    'deniega en el límite vencido %i sin conceder un permiso nuevo',
    async (transcurrido) => {
      const req = peticion();
      await registrarPermisoOperacion(req, 'A', inicio);
      const antes = structuredClone(req.session.donaciones);
      deniega(() => autorizarAportacion(req, 'A', filaA, inicio + transcurrido));
      await expect(registrarPermisoOperacion(req, 'A', inicio + transcurrido)).rejects.toMatchObject({
        estado: 404,
      });
      expect(req.session.donaciones).toEqual(antes);
    },
  );
  it('separa sesiones y operaciones A/B, incluidas cuotas posteriores', async () => {
    const req = peticion();
    const otra = peticion();
    await registrarPermisoOperacion(req, 'A', inicio);
    deniega(() => autorizarAportacion(otra, 'A', filaA, inicio));
    deniega(() => autorizarAportacion(req, 'B', filaB, inicio));
    await registrarPermisoOperacion(req, 'B', inicio + 100);
    expect(autorizarAportacion(req, 'B', filaB, inicio + 100)).toBe(true);
    expect(req.session.donaciones.permisos.A.creadoEn).toBe(inicio);
  });
  it('deniega referencias inexistentes o discordantes aun con permiso', async () => {
    const req = peticion();
    await registrarPermisoOperacion(req, 'A', inicio);
    deniega(() => autorizarAportacion(req, 'A', null, inicio));
    deniega(() => autorizarAportacion(req, 'A', filaB, inicio));
  });
  it('no concede acceso por cookie vacía, correo, UUID o referencia del cliente', () => {
    const req = peticion();
    req.body = {
      referencia: 'A',
      claveSolicitud: 'uuid',
      correo: 'persona@example.test',
      usuarioId: propietario,
      usuarioIdDonante: propietario,
      roles: ['donante'],
      verificado: true,
    };
    deniega(() => autorizarAportacion(req, 'A', filaA, inicio));
    deniega(() => autorizarAportacion(req, 'A', null, inicio));
  });
  it('rechaza permisos heredados del prototipo, corruptos o con plazo prolongado', () => {
    const req = peticion();
    req.session.donaciones = { permisos: {} };
    deniega(() => autorizarAportacion(req, 'toString', { referencia: 'toString' }, inicio));
    for (const permiso of [
      null,
      {},
      { creadoEn: inicio, venceEn: inicio + ochoHoras + 1 },
      { creadoEn: '1800000000000', venceEn: inicio + ochoHoras },
    ]) {
      req.session.donaciones.permisos.A = permiso;
      deniega(() => autorizarAportacion(req, 'A', filaA, inicio));
    }
  });
});

describe('HU-01 · propiedad obtenida en servidor', () => {
  it('autoriza cuenta donante propia con vínculo y BIGINT textual sin pérdida', () => {
    expect(autorizarAportacion(cuenta(), 'A', filaA, inicio)).toBe(true);
    deniega(() => autorizarAportacion(cuenta(vecino), 'A', filaA, inicio));
  });
  it.each([
    ['sin rol', propietario, ['voluntario'], propietario],
    ['sin vínculo', propietario, ['donante'], null],
    ['ID numérico inseguro', Number(propietario), ['donante'], propietario],
    ['ID de propietario numérico', propietario, ['donante'], Number(propietario)],
  ])('deniega %s', (_, id, roles, usuarioIdDonante) => {
    deniega(() => autorizarAportacion(cuenta(id, roles), 'A', { referencia: 'A', usuarioIdDonante }, inicio));
  });
  it('exige coherencia entre cuenta cargada y sesión, sin confiar en el cuerpo', () => {
    const req = cuenta();
    req.session.usuarioId = vecino;
    req.body = { usuarioId: propietario, donanteId: propietario };
    deniega(() => autorizarAportacion(req, 'A', filaA, inicio));
  });
  it('la vía de cuenta propia no renueva el permiso invitado ya vencido', async () => {
    const req = cuenta();
    await registrarPermisoOperacion(req, 'A', inicio);
    const antes = structuredClone(req.session.donaciones);
    expect(autorizarAportacion(req, 'A', filaA, inicio + ochoHoras)).toBe(true);
    expect(req.session.donaciones).toEqual(antes);
  });
  it('mantiene independiente la vía invitada de los roles y admite varios roles en cuenta', async () => {
    const req = cuenta(vecino, ['voluntario']);
    await registrarPermisoOperacion(req, 'A', inicio);
    expect(autorizarAportacion(req, 'A', filaA, inicio)).toBe(true);
    expect(autorizarAportacion(cuenta(propietario, ['voluntario', 'donante']), 'A', filaA, inicio)).toBe(
      true,
    );
  });
});

describe('HU-01 · origen y CSRF del navegador', () => {
  it('valida origen y token de la misma sesión sin alterar permisos', async () => {
    const req = peticion();
    const { tokenCsrf } = await prepararContextoDonaciones(req);
    req.headers.origin = origen;
    req.body.tokenCsrf = tokenCsrf;
    expect(validarSolicitudNavegador(req, origen)).toBeUndefined();
  });
  it.each([
    undefined,
    'null',
    'https://ong.example.test.evil.test',
    'http://ong.example.test',
    'https://ong.example.test:444',
  ])('deniega origen %s', async (origin) => {
    const req = peticion();
    const contexto = await prepararContextoDonaciones(req);
    req.headers.origin = origin;
    req.body.tokenCsrf = contexto.tokenCsrf;
    deniega(() => validarSolicitudNavegador(req, origen), 403, 'SOLICITUD_NO_AUTORIZADA');
  });
  it.each([undefined, null, '', 'otro', ['token'], {}].map((token) => [token]))(
    'deniega token inválido %s',
    async (token) => {
      const req = peticion();
      await prepararContextoDonaciones(req);
      req.headers.origin = origen;
      req.body.tokenCsrf = token;
      deniega(() => validarSolicitudNavegador(req, origen), 403, 'SOLICITUD_NO_AUTORIZADA');
    },
  );
  it('no acepta el token de otra sesión ni un token sin sesión', async () => {
    const req = peticion();
    const otra = peticion();
    await prepararContextoDonaciones(req);
    const contexto = await prepararContextoDonaciones(otra);
    req.headers.origin = origen;
    req.body.tokenCsrf = contexto.tokenCsrf;
    deniega(() => validarSolicitudNavegador(req, origen), 403, 'SOLICITUD_NO_AUTORIZADA');
    deniega(
      () =>
        validarSolicitudNavegador(
          { headers: { origin: origen }, body: { tokenCsrf: contexto.tokenCsrf } },
          origen,
        ),
      403,
      'SOLICITUD_NO_AUTORIZADA',
    );
  });
});
