import { z } from 'zod';
import { ErrorApi } from '../../middleware/errores.js';
import { aCentimos, centimosATexto } from '../../servicios-comunes/importes.js';

const correoValido = z.string().email();
const letrasNif = 'TRWAGMYFPDXBNJZSQVHLCKE';
const prefijosNie = { X: '0', Y: '1', Z: '2' };
const camposDonante = ['nombre', 'apellidos', 'nifNie', 'correo', 'direccion'];

function datoInvalido(campo, mensaje) {
  return new ErrorApi(400, 'DATOS_INVALIDOS', 'Revisa los datos marcados.', { [campo]: mensaje });
}

function limpiarTexto(valor, campo) {
  if (typeof valor !== 'string') throw datoInvalido(campo, 'Introduce un texto válido.');
  const limpio = valor.normalize('NFC').trim();
  if (!limpio) throw datoInvalido(campo, 'Completa este campo.');
  return limpio;
}

export function normalizarImporte(texto) {
  const mensaje = 'Indica un importe entre 1,00 y 999.999,99 €, con un máximo de dos decimales.';
  if (typeof texto !== 'string') throw datoInvalido('importe', mensaje);
  const centimos = aCentimos(texto);
  if (!Number.isSafeInteger(centimos) || centimos < 100 || centimos > 99999999) {
    throw datoInvalido('importe', mensaje);
  }
  return { centimos, importe: centimosATexto(centimos) };
}

export function normalizarNifNie(texto) {
  const nifNie = limpiarTexto(texto, 'nifNie').replace(/[\s-]/gu, '').toUpperCase();
  const mensaje = 'Introduce un NIF/NIE con formato y letra de control válidos.';
  if (!/^(?:[0-9]{8}|[XYZ][0-9]{7})[A-Z]$/.test(nifNie)) {
    throw datoInvalido('nifNie', mensaje);
  }
  const digitos = (prefijosNie[nifNie[0]] ?? nifNie[0]) + nifNie.slice(1, -1);
  if (nifNie.at(-1) !== letrasNif[Number(digitos) % 23]) {
    throw datoInvalido('nifNie', mensaje);
  }
  return nifNie;
}

export function normalizarDonante(datos) {
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    throw datoInvalido('donante', 'Introduce los datos del donante.');
  }
  const nombre = limpiarTexto(datos.nombre, 'nombre').replace(/\s+/gu, ' ');
  const apellidos = limpiarTexto(datos.apellidos, 'apellidos').replace(/\s+/gu, ' ');
  const nifNie = normalizarNifNie(datos.nifNie);
  const correo = limpiarTexto(datos.correo, 'correo').toLowerCase().normalize('NFC');
  if (!correoValido.safeParse(correo).success) {
    throw datoInvalido('correo', 'Introduce un correo válido.');
  }
  const direccion = limpiarTexto(datos.direccion, 'direccion').replace(/\s+/gu, ' ');
  return { nombre, apellidos, nifNie, correo, direccion };
}

// Compara los cinco campos; una coincidencia no acredita identidad ni titularidad del correo.
export function sonDatosDonanteEquivalentes(primero, segundo) {
  const datosPrimero = normalizarDonante(primero);
  const datosSegundo = normalizarDonante(segundo);
  return camposDonante.every(
    (campo) =>
      datosPrimero[campo].toLowerCase().normalize('NFC') ===
      datosSegundo[campo].toLowerCase().normalize('NFC'),
  );
}
