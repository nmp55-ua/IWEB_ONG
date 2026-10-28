import { describe, expect, it } from 'vitest';
import { aCentimos, centimosATexto } from './importes.js';
import { generarCsv } from './csv.js';
import { aIsoMadrid, anioEnMadrid, rangoAnio, rangoTrimestre } from './fechas.js';

describe('importes', () => {
  it('acepta coma o punto y hasta 2 decimales', () => {
    expect(aCentimos('20')).toBe(2000);
    expect(aCentimos('20,5')).toBe(2050);
    expect(aCentimos('1500.00')).toBe(150000);
  });

  it('rechaza importes no válidos', () => {
    for (const malo of ['', 'abc', '-5', '10,555', '1.2.3']) expect(aCentimos(malo)).toBeNull();
  });

  it('formatea céntimos como texto con 2 decimales', () => {
    expect(centimosATexto(8000)).toBe('80.00');
    expect(centimosATexto(5)).toBe('0.05');
  });
});

describe('csv', () => {
  it('usa «;», coma decimal y BOM', () => {
    const csv = generarCsv(
      [{ clave: 'proyecto', titulo: 'Proyecto' }, { clave: 'total', titulo: 'Total', tipo: 'importe' }],
      [{ proyecto: 'Agua; potable', total: '80.00' }],
    );
    expect(csv).toBe('﻿Proyecto;Total\r\n"Agua; potable";80,00\r\n');
  });
});

describe('fechas en Madrid', () => {
  it('el año 2025 empieza el 1 de enero a las 00:00 de Madrid', () => {
    expect(rangoAnio(2025).desde.toISOString()).toBe('2024-12-31T23:00:00.000Z');
    expect(rangoAnio(2025).hasta.toISOString()).toBe('2025-12-31T23:00:00.000Z');
  });

  it('el 31/12 a las 23:59 de Madrid sigue siendo de ese año', () => {
    expect(anioEnMadrid(new Date('2025-12-31T22:59:00Z'))).toBe(2025);
    expect(anioEnMadrid(new Date('2025-12-31T23:00:00Z'))).toBe(2026);
  });

  it('respeta el horario de verano', () => {
    expect(rangoTrimestre(2026, 2).desde.toISOString()).toBe('2026-03-31T22:00:00.000Z');
    expect(aIsoMadrid(new Date('2026-07-01T08:00:00Z'))).toBe('2026-07-01T10:00:00+02:00');
    expect(aIsoMadrid(new Date('2026-10-28T09:00:00Z'))).toBe('2026-10-28T10:00:00+01:00');
  });
});
