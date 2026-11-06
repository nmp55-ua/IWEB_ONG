// Pruebas de vuelta.js con el ejecutor de Node (sin dependencias): en frontend/, `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { crearVuelta } from './vuelta.js';

function preparar(opciones) {
  let recargas = 0;
  const vuelta = crearVuelta(() => recargas++, opciones);
  return { vuelta, recargas: () => recargas };
}

test('volver justo después de una carga también recarga (revisión del PR #3)', () => {
  // Antes se descartaba si la última petición había salido hacía menos de 2 s: una plaza liberada
  // mientras tanto no aparecía hasta otra acción.
  const { vuelta, recargas } = preparar();
  vuelta.salir();
  vuelta.volver();
  assert.equal(recargas(), 1);
});

test('«visibilitychange» y «focus» seguidos al volver dan una sola recarga', () => {
  const { vuelta, recargas } = preparar();
  vuelta.salir(); // visibilitychange (oculta)
  vuelta.salir(); // blur
  vuelta.volver(); // visibilitychange (visible)
  vuelta.volver(); // focus
  assert.equal(recargas(), 1);
});

test('un «focus» sin haber salido no recarga (la carga inicial ya está en marcha)', () => {
  const { vuelta, recargas } = preparar();
  vuelta.volver();
  assert.equal(recargas(), 0);
});

test('cada salida y vuelta recarga una vez, aunque sean muy seguidas', () => {
  const { vuelta, recargas } = preparar();
  for (let i = 0; i < 3; i++) {
    vuelta.salir();
    vuelta.volver();
    vuelta.volver();
  }
  assert.equal(recargas(), 3);
});

test('si la página se abrió en segundo plano, recarga la primera vez que se ve', () => {
  const { vuelta, recargas } = preparar({ fueraAlEmpezar: true });
  vuelta.volver();
  vuelta.volver();
  assert.equal(recargas(), 1);
});
