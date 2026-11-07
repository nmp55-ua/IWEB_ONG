import { describe, expect, it } from 'vitest';
import { ErrorApi } from '../../middleware/errores.js';
import {
  normalizarDonante,
  normalizarImporte,
  normalizarNifNie,
  sonDatosDonanteEquivalentes,
} from './normalizacion.js';

const donante = Object.freeze({
  nombre: 'Ana María',
  apellidos: 'Pérez-López',
  nifNie: '12345678Z',
  correo: 'ana.perez+ong@example.test',
  direccion: 'C/ Mayor, 1, 2.º A',
});

function comprobarError(accion, campo) {
  let error;
  try {
    accion();
  } catch (recibido) {
    error = recibido;
  }
  expect(error).toBeInstanceOf(ErrorApi);
  expect(error).toMatchObject({ estado: 400, codigo: 'DATOS_INVALIDOS' });
  expect(error.campos[campo]).toEqual(expect.any(String));
}

describe('HU-01 · normalización de importes · FR-002 / P03', () => {
  it.each([
    ['1', 100, '1.00'],
    ['1.00', 100, '1.00'],
    ['1,00', 100, '1.00'],
    ['20,5', 2050, '20.50'],
    ['20.50', 2050, '20.50'],
    ['  00020,50  ', 2050, '20.50'],
    ['999999.99', 99999999, '999999.99'],
    ['999999,99', 99999999, '999999.99'],
  ])('normaliza %j sin perder céntimos', (entrada, centimos, importe) => {
    const resultado = normalizarImporte(entrada);
    expect(resultado).toEqual({ centimos, importe });
    expect(Number.isSafeInteger(resultado.centimos)).toBe(true);
    expect(normalizarImporte(resultado.importe)).toEqual(resultado);
  });

  it.each(
    [
      '',
      '   ',
      '0',
      '0.99',
      '-1',
      '-0',
      '+1',
      '1000000',
      '1000000.00',
      '1.001',
      '1,009',
      '999999.999',
      '1e2',
      '1E+2',
      '0x10',
      '1.000,00',
      '1,000.00',
      '1 000',
      '1\u00a0000',
      '1,2.3',
      '.50',
      '1.',
      'NaN',
      'Infinity',
      'texto',
      '20 €',
      '9007199254740993',
      '9'.repeat(400),
      null,
      undefined,
      20,
      NaN,
      Infinity,
      20n,
      true,
      [],
      {},
    ].map((entrada) => [entrada]),
  )('rechaza %s sin redondeo o conversión implícita', (entrada) => {
    comprobarError(() => normalizarImporte(entrada), 'importe');
  });
});

describe('HU-01 · NIF/NIE · FR-004 / P04', () => {
  it.each([
    ['12345678Z', '12345678Z'],
    [' 12 345 678-z ', '12345678Z'],
    ['00000000T', '00000000T'],
    ['99999999R', '99999999R'],
    ['x-123 4567-l', 'X1234567L'],
    ['Y1234567X', 'Y1234567X'],
    ['z1234567r', 'Z1234567R'],
  ])('normaliza y comprueba %j', (entrada, esperado) => {
    expect(normalizarNifNie(entrada)).toBe(esperado);
    expect(normalizarNifNie(esperado)).toBe(esperado);
  });

  it.each(
    [
      '',
      '  ',
      '12345678A',
      'X1234567A',
      'Y1234567A',
      'Z1234567A',
      '1234567L',
      '123456789Z',
      'A1234567L',
      'G00000000',
      '1234.5678Z',
      '１２３４５６７８Ｚ',
      '12345678',
      null,
      undefined,
      12345678,
      {},
      [],
    ].map((entrada) => [entrada]),
  )('rechaza identificador o letra no válidos: %j', (entrada) => {
    comprobarError(() => normalizarNifNie(entrada), 'nifNie');
  });
});

describe('HU-01 · datos del donante · FR-004 / FR-015 / P17', () => {
  it('aplica NFC, recorte y colapso de espacios sin cambiar tildes, puntuación o presentación', () => {
    expect(
      normalizarDonante({
        nombre: '  Ana\t Mari\u0301a\u00a0',
        apellidos: ' Pe\u0301rez-Lo\u0301pez ',
        nifNie: '12 345 678-z',
        correo: '  ANA.PEREZ+ONG@EXAMPLE.TEST  ',
        direccion: '\nC/  Mayor,\t1,  2.º A ',
      }),
    ).toEqual(donante);
  });

  it('devuelve un objeto nuevo y no modifica los datos recibidos', () => {
    const entrada = Object.freeze({ ...donante, nombre: '  Ana   María  ' });
    const resultado = normalizarDonante(entrada);
    expect(resultado).not.toBe(entrada);
    expect(resultado).toEqual(donante);
    expect(entrada.nombre).toBe('  Ana   María  ');
    expect(normalizarDonante(resultado)).toEqual(resultado);
  });

  it('considera equivalentes NFC, espacios y mayúsculas solo según las reglas de cada campo', () => {
    const alternativa = Object.freeze({
      nombre: ' ANA  MARI\u0301A ',
      apellidos: ' PE\u0301REZ-LO\u0301PEZ ',
      nifNie: '12-345-678-z',
      correo: ' ANA.PEREZ+ONG@EXAMPLE.TEST ',
      direccion: ' c/  MAYOR, 1, 2.º a ',
    });
    expect(sonDatosDonanteEquivalentes(donante, alternativa)).toBe(true);
    expect(sonDatosDonanteEquivalentes(alternativa, donante)).toBe(true);
    expect(alternativa.nombre).toBe(' ANA  MARI\u0301A ');
  });

  it.each([
    ['nombre', 'Ana Maria'],
    ['nombre', 'Ana María Isabel'],
    ['apellidos', 'Pérez López'],
    ['apellidos', 'Pérez-Lopez'],
    ['nifNie', '00000000T'],
    ['correo', 'anaperez+ong@example.test'],
    ['correo', 'ana.perez@example.test'],
    ['correo', 'ana.perez+otra@example.test'],
    ['correo', 'ana.perez+ong@example.org'],
    ['direccion', 'Calle Mayor, 1, 2.º A'],
    ['direccion', 'C/ Mayor 1, 2.º A'],
    ['direccion', 'C/ Mayor, 2, 2.º A'],
  ])('conserva como cambio real %s = %j', (campo, valor) => {
    const alternativa = Object.freeze({ ...donante, [campo]: valor });
    expect(sonDatosDonanteEquivalentes(donante, alternativa)).toBe(false);
    expect(sonDatosDonanteEquivalentes(alternativa, donante)).toBe(false);
  });

  it('conserva las particularidades del correo con recorte de espacios Unicode y minúsculas', () => {
    const correo = '\u00a0ANA.PEREZ+ONG@EXAMPLE.TEST\u2003';
    expect(normalizarDonante({ ...donante, correo }).correo).toBe(donante.correo);
  });

  it.each([
    'sin-arroba',
    'ana@@example.test',
    'ana @example.test',
    'ana@ example.test',
    'ana\nperez@example.test',
  ])('rechaza el correo inválido sin corregir espacios interiores: %j', (correo) =>
    comprobarError(() => normalizarDonante({ ...donante, correo }), 'correo'),
  );

  it.each(['nombre', 'apellidos', 'nifNie', 'correo', 'direccion'])(
    'rechaza %s ausente, vacío o de tipo incorrecto',
    (campo) => {
      for (const valor of [undefined, null, '', '  \t\n', 17, {}, []]) {
        comprobarError(() => normalizarDonante({ ...donante, [campo]: valor }), campo);
      }
    },
  );

  it.each([null, undefined, 'texto', 3, []].map((datos) => [datos]))(
    'rechaza una estructura de datos inválida: %j',
    (datos) => comprobarError(() => normalizarDonante(datos), 'donante'),
  );

  it('no considera equivalentes dos entradas idénticas pero inválidas', () => {
    const datos = { ...donante, nifNie: '12345678A' };
    comprobarError(() => sonDatosDonanteEquivalentes(datos, datos), 'nifNie');
  });
});
