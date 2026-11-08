// Pruebas de certificados.js con el ejecutor de Node (sin dependencias): en frontend/, `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ejerciciosConsultables, mensajeEjercicio, normalizarCodigo } from './certificados.js';

const certificados = [
  { ejercicio: 2025, importeTotal: '80.00', fechaEmision: '2026-01-01', codigoVerificacion: '7K2M-9QXR-4D8T-1HZP' },
  { ejercicio: 2024, importeTotal: '25.00', fechaEmision: '2025-01-01', codigoVerificacion: 'AAAA-BBBB-CCCC-DDDD' },
];

test('un ejercicio con certificado está disponible', () => {
  const r = mensajeEjercicio({ ejercicio: 2024, certificados, ejercicioEnCurso: 2026 });
  assert.equal(r.tipo, 'disponible');
  assert.equal(r.certificado.importeTotal, '25.00');
});

test('escenario 5: el ejercicio en curso se generará a partir del 1 de enero siguiente', () => {
  const r = mensajeEjercicio({ ejercicio: 2026, certificados, ejercicioEnCurso: 2026 });
  assert.deepEqual(r, { tipo: 'en-curso', mensaje: 'El certificado de 2026 se generará a partir del 01/01/2027.' });
});

test('escenario 4: un ejercicio cerrado sin certificado no tiene aportaciones', () => {
  const r = mensajeEjercicio({ ejercicio: 2023, certificados, ejercicioEnCurso: 2026 });
  assert.deepEqual(r, {
    tipo: 'sin-aportaciones',
    mensaje: 'No tienes aportaciones confirmadas en 2023, así que no hay certificado de ese ejercicio.',
  });
});

test('se puede consultar del ejercicio en curso a diez años atrás', () => {
  const anios = ejerciciosConsultables(2026);
  assert.equal(anios.length, 11);
  assert.equal(anios[0], 2026);
  assert.equal(anios.at(-1), 2016);
});

test('normaliza el código como el servidor', () => {
  assert.equal(normalizarCodigo('7k2m 9qxr-4d8t1hzp'), '7K2M-9QXR-4D8T-1HZP');
  assert.equal(normalizarCodigo(''), null);
  assert.equal(normalizarCodigo('7K2M-9QXR-4D8T'), null);
  assert.equal(normalizarCodigo('7K2M-9QXR-4D8T-1HZO'), null);
});
