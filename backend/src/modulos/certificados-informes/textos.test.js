// Pruebas de HU-03 sin base de datos: código, enmascarado, formato, correo y definición del PDF.
import { describe, expect, it } from 'vitest';
import {
  ALFABETO_CODIGO,
  definicionPdf,
  enmascararNifNie,
  formatearEuros,
  formatearFechaDia,
  generarCodigo,
  normalizarCodigo,
  textoCorreo,
} from './textos.js';

const sinEspaciosRaros = (texto) => texto.replace(/\s/g, ' ');

describe('código de verificación', () => {
  it('tiene 4 grupos de 4 caracteres de Crockford base32, sin I, L, O ni U', () => {
    for (let i = 0; i < 200; i++) {
      const codigo = generarCodigo();
      expect(codigo).toMatch(/^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){3}$/);
    }
    expect(ALFABETO_CODIGO).toHaveLength(32);
    expect(ALFABETO_CODIGO).not.toMatch(/[ILOU]/);
  });

  it('usa el generador aleatorio que se le pasa', () => {
    expect(generarCodigo(() => 0)).toBe('0000-0000-0000-0000');
    expect(generarCodigo(() => 31)).toBe('ZZZZ-ZZZZ-ZZZZ-ZZZZ');
  });

  it('dos códigos seguidos son distintos', () => {
    expect(generarCodigo()).not.toBe(generarCodigo());
  });

  it('normaliza minúsculas, espacios y guiones', () => {
    expect(normalizarCodigo('7k2m9qxr4d8t1hzp')).toBe('7K2M-9QXR-4D8T-1HZP');
    expect(normalizarCodigo(' 7K2M 9QXR-4D8T 1HZP ')).toBe('7K2M-9QXR-4D8T-1HZP');
    expect(normalizarCodigo('7K2M-9QXR-4D8T-1HZP')).toBe('7K2M-9QXR-4D8T-1HZP');
  });

  it('devuelve null si no puede ser un código', () => {
    expect(normalizarCodigo('')).toBeNull();
    expect(normalizarCodigo(undefined)).toBeNull();
    expect(normalizarCodigo('7K2M-9QXR-4D8T')).toBeNull();
    expect(normalizarCodigo('7K2M-9QXR-4D8T-1HZPA')).toBeNull();
    expect(normalizarCodigo('7K2M-9QXR-4D8T-1HZO')).toBeNull(); // O no está en el alfabeto
    expect(normalizarCodigo("7K2M-9QXR-4D8T-1HZ'")).toBeNull();
  });
});

describe('NIF/NIE enmascarado', () => {
  it('deja visibles solo los 4 últimos dígitos, con formato fijo', () => {
    expect(enmascararNifNie('12344567Z')).toBe('***4567*');
    expect(enmascararNifNie('X1234567L')).toBe('***4567*');
    expect(enmascararNifNie('11111111H')).toBe('***1111*');
  });
});

describe('formato', () => {
  it('importes en euros con 2 decimales y coma', () => {
    expect(sinEspaciosRaros(formatearEuros('80.00'))).toBe('80,00 €');
    expect(sinEspaciosRaros(formatearEuros('100.50'))).toBe('100,50 €');
  });

  it('fechas dd/mm/aaaa', () => {
    expect(formatearFechaDia('2026-01-02')).toBe('02/01/2026');
  });
});

describe('correo de aviso', () => {
  const base = { nombre: 'Ana', ejercicio: 2025, importeTotal: '80.00', urlFrontend: 'http://ong.test' };

  it('emisión con cuenta vinculada: disponible, importe y enlace al área personal', () => {
    const { asunto, texto } = textoCorreo({ ...base, regenerado: false, vinculado: true });
    expect(asunto).toBe('Tu certificado fiscal de 2025 está disponible');
    expect(sinEspaciosRaros(texto)).toContain('80,00 €');
    expect(texto).toContain('http://ong.test/mis-certificados');
    expect(texto).not.toContain('/donar/vincular');
    expect(texto).not.toContain('código de verificación anterior');
  });

  it('regeneración: se ha actualizado y el código anterior ya no es válido', () => {
    const { asunto, texto } = textoCorreo({ ...base, importeTotal: '100.00', regenerado: true, vinculado: true });
    expect(asunto).toBe('Tu certificado fiscal de 2025 se ha actualizado');
    expect(sinEspaciosRaros(texto)).toContain('100,00 €');
    expect(texto).toContain('El código de verificación anterior ya no es válido');
  });

  it('sin cuenta vinculada: invita a crear o usar una cuenta de donante y vincularla', () => {
    const { texto } = textoCorreo({ ...base, regenerado: false, vinculado: false });
    expect(texto).toContain('Crea una cuenta de donante (o entra con la tuya)');
    expect(texto).toContain('http://ong.test/donar/vincular');
  });

  it('no lleva NIF/NIE', () => {
    const { texto } = textoCorreo({ ...base, regenerado: false, vinculado: false });
    expect(texto).not.toMatch(/NIF|NIE/);
  });
});

describe('definición del PDF', () => {
  const definicion = definicionPdf({
    ong: { nombre: 'ONG de Prueba', cif: 'G12345678' },
    donante: { nombre: 'Ana', apellidos: 'Certificado Prueba', nifNie: '11111111H' },
    certificado: {
      ejercicio: 2025,
      importeTotal: '80.00',
      fechaEmision: '2026-01-01',
      codigoVerificacion: '7K2M-9QXR-4D8T-1HZP',
    },
    urlFrontend: 'http://ong.test',
  });
  const todo = sinEspaciosRaros(
    JSON.stringify([definicion.titulo, ...definicion.bloques.map((b) => b.texto ?? b.filas)]),
  );

  it('contiene los datos de FR-003', () => {
    for (const dato of [
      'ONG de Prueba',
      'G12345678',
      'Ana',
      'Certificado Prueba',
      '11111111H',
      '2025',
      '80,00 €',
      '01/01/2026',
      '7K2M-9QXR-4D8T-1HZP',
    ]) {
      expect(todo).toContain(dato);
    }
  });

  it('indica dónde verificarlo', () => {
    expect(todo).toContain('http://ong.test/verificar-certificado?codigo=7K2M-9QXR-4D8T-1HZP');
  });
});
