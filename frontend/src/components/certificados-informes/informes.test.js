// Pruebas de informes.js con el ejecutor de Node (sin dependencias): en frontend/, `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MENSAJE_FIN_ANTERIOR,
  consultaInforme,
  filasParaTabla,
  filtrosDeInforme,
  rutaInforme,
  urlExportacion,
  validarPeriodo,
} from './informes.js';

test('el periodo necesita las dos fechas y el fin no puede ser anterior al inicio', () => {
  assert.deepEqual(validarPeriodo({ desde: '', hasta: '' }), {
    desde: 'Indica la fecha de inicio.',
    hasta: 'Indica la fecha de fin.',
  });
  assert.deepEqual(validarPeriodo({ desde: '2026-12-31', hasta: '2026-01-01' }), { hasta: MENSAJE_FIN_ANTERIOR });
  assert.deepEqual(validarPeriodo({ desde: '2026-01-01', hasta: '2026-01-01' }), {});
  assert.equal(MENSAJE_FIN_ANTERIOR, 'La fecha de fin no puede ser anterior a la de inicio.');
});

test('la consulta omite los filtros vacíos', () => {
  assert.equal(String(consultaInforme({ desde: '2026-01-01', hasta: '2026-12-31', proyectoId: '', agrupacion: '' })), 'desde=2026-01-01&hasta=2026-12-31');
  assert.equal(
    rutaInforme({ desde: '2026-01-01', hasta: '2026-12-31', proyectoId: '3', agrupacion: 'trimestre' }),
    '/informes?desde=2026-01-01&hasta=2026-12-31&proyectoId=3&agrupacion=trimestre',
  );
});

test('las exportaciones usan los mismos filtros que el informe en pantalla', () => {
  const informe = {
    filtros: { desde: '2026-01-01', hasta: '2026-12-31', proyecto: { id: '3', nombre: 'Agua' }, agrupacion: null },
    filas: [],
  };
  const filtros = filtrosDeInforme(informe);
  assert.equal(urlExportacion(filtros, 'csv'), '/api/informes/csv?desde=2026-01-01&hasta=2026-12-31&proyectoId=3');
  assert.equal(urlExportacion(filtros, 'pdf'), '/api/informes/pdf?desde=2026-01-01&hasta=2026-12-31&proyectoId=3');
});

test('nombra las filas y marca subtotales y total', () => {
  const periodo = { etiqueta: 'T1 2026', desde: '2026-01-01', hasta: '2026-03-31' };
  const filas = filasParaTabla({
    filas: [
      { tipo: 'proyecto', periodo, proyecto: { id: '1', nombre: 'Agua potable' } },
      { tipo: 'fondoGeneral', periodo, proyecto: null },
      { tipo: 'subtotal', periodo, proyecto: null },
      { tipo: 'total', periodo: null, proyecto: null },
    ],
  });
  assert.deepEqual(
    filas.map((f) => [f.nombre, f.etiquetaPeriodo, f.resaltada]),
    [
      ['Agua potable', 'T1 2026', false],
      ['Fondo general', 'T1 2026', false],
      ['Subtotal T1 2026', 'T1 2026', true],
      ['Total', '', true],
    ],
  );
  assert.equal(new Set(filas.map((f) => f.clave)).size, 4);
});
