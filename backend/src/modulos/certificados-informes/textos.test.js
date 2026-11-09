// Pruebas de HU-03 sin base de datos: código, enmascarado, formato, correo y definición del PDF.
import { describe, expect, it } from 'vitest';
import {
  ALFABETO_CODIGO,
  MENSAJE_INFORME_VACIO,
  columnasInforme,
  csvInforme,
  definicionPdfInforme,
  definicionPdf,
  enmascararNifNie,
  etiquetaPeriodo,
  formatearEuros,
  formatearFechaDia,
  formatearHorasInforme,
  generarCodigo,
  nombreFicheroInforme,
  nombreFilaInforme,
  normalizarCodigo,
  textoAgrupacion,
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
    // Total anual por encima de lo que cabe en NUMERIC(10,2): se muestra exacto.
    expect(sinEspaciosRaros(formatearEuros('100999999.99'))).toBe('100.999.999,99 €');
    expect(sinEspaciosRaros(formatearEuros('9999999999999.99'))).toBe('9.999.999.999.999,99 €');
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

  it('indica dónde verificarlo, con la dirección sola en su bloque', () => {
    const ultimo = definicion.bloques.at(-1);
    expect(ultimo).toEqual({
      tipo: 'texto',
      texto: 'http://ong.test/verificar-certificado?codigo=7K2M-9QXR-4D8T-1HZP',
    });
  });
});

describe('informe (HU-04)', () => {
  it('etiqueta los periodos por mes, trimestre y año', () => {
    expect(etiquetaPeriodo('mes', '2026-01-01')).toBe('01/2026');
    expect(etiquetaPeriodo('mes', '2026-12-01')).toBe('12/2026');
    expect(etiquetaPeriodo('trimestre', '2026-01-01')).toBe('T1 2026');
    expect(etiquetaPeriodo('trimestre', '2026-04-01')).toBe('T2 2026');
    expect(etiquetaPeriodo('trimestre', '2026-10-01')).toBe('T4 2026');
    expect(etiquetaPeriodo('anio', '2026-01-01')).toBe('2026');
  });

  it('pone la columna Periodo solo si se agrupa', () => {
    const titulos = (a) => columnasInforme(a).map((c) => c.titulo);
    expect(titulos(null)).toEqual([
      'Proyecto',
      'Donaciones puntuales',
      'Cuotas de socio',
      'Total recaudado',
      'Aportaciones',
      'Actividades celebradas',
      'Voluntarios',
      'Horas',
    ]);
    expect(titulos('trimestre')[0]).toBe('Periodo');
    expect(titulos('trimestre')).toHaveLength(9);
  });

  it('nombra cada tipo de fila', () => {
    const periodo = { etiqueta: 'T1 2026' };
    expect(nombreFilaInforme({ tipo: 'proyecto', proyecto: { nombre: 'Agua potable' } })).toBe('Agua potable');
    expect(nombreFilaInforme({ tipo: 'fondoGeneral', proyecto: null })).toBe('Fondo general');
    expect(nombreFilaInforme({ tipo: 'subtotal', periodo })).toBe('Subtotal T1 2026');
    expect(nombreFilaInforme({ tipo: 'total' })).toBe('Total');
  });

  it('horas con un decimal y coma', () => {
    expect(formatearHorasInforme('3.50')).toBe('3,5 h');
    expect(formatearHorasInforme('0.00')).toBe('0 h');
    expect(formatearHorasInforme('13.00')).toBe('13 h');
    expect(formatearHorasInforme('1234.25')).toBe('1234,3 h');
  });

  it('textos de agrupación y del informe vacío', () => {
    expect(textoAgrupacion('trimestre')).toBe('Por trimestre');
    expect(textoAgrupacion(null)).toBe('Sin agrupar');
    expect(MENSAJE_INFORME_VACIO).toBe('No hay aportaciones confirmadas ni actividades celebradas en este periodo.');
  });
});

describe('exportación del informe (HU-04, FR-006)', () => {
  const periodo = { etiqueta: 'T1 2026', desde: '2026-01-01', hasta: '2026-03-31' };
  const cifras = (total, extra = {}) => ({
    recaudadoPuntual: total,
    recaudadoCuotas: '0.00',
    recaudadoTotal: total,
    aportaciones: 2,
    actividades: 1,
    voluntarios: 3,
    horas: '3.50',
    ...extra,
  });
  const informe = {
    filtros: { desde: '2026-01-01', hasta: '2026-12-31', proyecto: null, agrupacion: 'trimestre' },
    vacio: false,
    filas: [
      { tipo: 'proyecto', periodo, proyecto: { id: '1', nombre: 'Agua; potable "norte"' }, ...cifras('1234.50', { recaudadoCuotas: '10.00' }) },
      { tipo: 'fondoGeneral', periodo, proyecto: null, ...cifras('30.00') },
      { tipo: 'subtotal', periodo, proyecto: null, ...cifras('1264.50') },
      { tipo: 'total', periodo: null, proyecto: null, ...cifras('1264.50') },
    ],
  };
  const CABECERA =
    'Periodo;Proyecto;Donaciones puntuales;Cuotas de socio;Total recaudado;Aportaciones;Actividades celebradas;Voluntarios;Horas';

  it('CSV: cabecera, una línea por fila, «;», BOM, coma decimal y comillas cuando hace falta', () => {
    const csv = csvInforme(informe);
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv.slice(1).split('\r\n').filter(Boolean)).toEqual([
      CABECERA,
      'T1 2026;"Agua; potable ""norte""";1234,50;10,00;1234,50;2;1;3;3,5',
      'T1 2026;Fondo general;30,00;0,00;30,00;2;1;3;3,5',
      'T1 2026;Subtotal T1 2026;1264,50;0,00;1264,50;2;1;3;3,5',
      ';Total;1264,50;0,00;1264,50;2;1;3;3,5',
    ]);
  });

  it('CSV sin agrupar no lleva la columna Periodo; vacío, solo la cabecera', () => {
    const sinAgrupar = { ...informe, filtros: { ...informe.filtros, agrupacion: null }, filas: [informe.filas[3]] };
    expect(csvInforme(sinAgrupar).split('\r\n')[1]).toBe('Total;1264,50;0,00;1264,50;2;1;3;3,5');
    expect(csvInforme({ ...informe, vacio: true, filas: [] }).slice(1)).toBe(`${CABECERA}\r\n`);
  });

  it('PDF: periodo y filtros, y la misma tabla que el CSV con euros y horas', () => {
    const { titulo, bloques } = definicionPdfInforme({
      ...informe,
      filtros: { ...informe.filtros, proyecto: { id: '1', nombre: 'Agua' } },
    });
    expect(titulo).toBe('Informe de recaudación y voluntariado');
    expect(bloques[0].texto).toBe('Periodo: 01/01/2026 – 31/12/2026 · Proyecto: Agua · Agrupación: Por trimestre');
    const tabla = bloques[1];
    expect(tabla.columnas).toEqual(columnasInforme('trimestre').map((c) => c.titulo));
    expect(tabla.filas.map((f) => sinEspaciosRaros(f.join('|')))).toEqual([
      'T1 2026|Agua; potable "norte"|1234,50 €|10,00 €|1234,50 €|2|1|3|3,5 h',
      'T1 2026|Fondo general|30,00 €|0,00 €|30,00 €|2|1|3|3,5 h',
      'T1 2026|Subtotal T1 2026|1264,50 €|0,00 €|1264,50 €|2|1|3|3,5 h',
      '|Total|1264,50 €|0,00 €|1264,50 €|2|1|3|3,5 h',
    ]);
  });

  it('PDF de un informe vacío: el mensaje en lugar de la tabla; sin filtros, «Todos» y «Sin agrupar»', () => {
    const { bloques } = definicionPdfInforme({
      filtros: { desde: '2019-01-01', hasta: '2019-12-31', proyecto: null, agrupacion: null },
      vacio: true,
      filas: [],
    });
    expect(bloques).toEqual([
      { tipo: 'texto', texto: 'Periodo: 01/01/2019 – 31/12/2019 · Proyecto: Todos · Agrupación: Sin agrupar' },
      { tipo: 'texto', texto: MENSAJE_INFORME_VACIO },
    ]);
  });

  it('nombre de los ficheros', () => {
    expect(nombreFicheroInforme({ desde: '2026-01-01', hasta: '2026-12-31' }, 'csv')).toBe('informe-2026-01-01-2026-12-31.csv');
  });
});
