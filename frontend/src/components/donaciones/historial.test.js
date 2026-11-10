import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatearTotalAnual } from './historial.js';
import * as historial from './historial.js';

for (const [importe, esperado] of [
  ['0.00', '0,00 €'],
  ['80.00', '80,00 €'],
  ['1999999.98', '1.999.999,98 €'],
  ['9007199254740993.01', '9.007.199.254.740.993,01 €'],
  ['123456789012345678901234567890.99', '123.456.789.012.345.678.901.234.567.890,99 €'],
]) {
  test(`formato exacto del total ${importe}`, () => assert.equal(formatearTotalAnual(importe), esperado));
}

const respuesta = (filtroAnio = null) => ({
  vinculado: true,
  filtroAnio,
  hayAportaciones: true,
  aniosDisponibles: [2025],
  total: 1,
  datos: [
    {
      anio: 2025,
      importeTotal: '1.00',
      aportaciones: [
        {
          id: '9007199254740993',
          fechaCobro: '2025-01-15T12:00:00+01:00',
          importe: '1.00',
          modalidad: 'puntual',
          destino: 'fondo general',
        },
      ],
    },
  ],
});
const diferida = () => {
  let resolver, rechazar;
  const promesa = new Promise((resolve, reject) => {
    resolver = resolve;
    rechazar = reject;
  });
  return { promesa, resolver, rechazar };
};
test('una respuesta anterior no sobrescribe el filtro mas reciente', async () => {
  const a = diferida(),
    b = diferida(),
    estados = [],
    rutas = [];
  const g = historial.crearConsultasHistorial({
    obtener: (ruta) => {
      rutas.push(ruta);
      return rutas.length === 1 ? a.promesa : b.promesa;
    },
    actualizar: (x) => estados.push(x),
  });
  const primera = g.consultar(null),
    segunda = g.consultar(2025);
  b.resolver(respuesta(2025));
  await segunda;
  const ultima = estados.at(-1);
  a.resolver(respuesta());
  await primera;
  assert.equal(estados.at(-1), ultima);
  assert.equal(ultima.datos.filtroAnio, 2025);
  assert.deepEqual(rutas, ['/yo/aportaciones', '/yo/aportaciones?anio=2025']);
});
test('desmontar impide actualizar estado o iniciar nuevas consultas', async () => {
  const a = diferida(),
    estados = [];
  let llamadas = 0;
  const g = historial.crearConsultasHistorial({
    obtener: () => {
      llamadas++;
      return a.promesa;
    },
    actualizar: (x) => estados.push(x),
  });
  const primera = g.consultar(null);
  g.invalidar();
  a.resolver(respuesta());
  await primera;
  await g.consultar(2025);
  assert.equal(estados.length, 1);
  assert.equal(estados[0].cargando, true);
  assert.equal(llamadas, 1);
});
test('un error anterior tampoco sustituye una respuesta actual', async () => {
  const a = diferida(),
    estados = [];
  let llamadas = 0;
  const g = historial.crearConsultasHistorial({
    obtener: () => (++llamadas === 1 ? a.promesa : Promise.resolve(respuesta(2025))),
    actualizar: (x) => estados.push(x),
  });
  const primera = g.consultar(null);
  await g.consultar(2025);
  a.rechazar(new Error('fallo anterior'));
  await primera;
  assert.equal(estados.at(-1).datos.filtroAnio, 2025);
  assert.equal(estados.at(-1).error, null);
});
test('fallo y reintento conservan la consulta sin mostrar datos anteriores', async () => {
  const estados = [];
  let llamadas = 0;
  const fallo = Object.assign(new Error('Sin conexión'), { estado: 0 });
  const g = historial.crearConsultasHistorial({
    obtener: async () => {
      if (++llamadas === 1) throw fallo;
      return respuesta(2025);
    },
    actualizar: (x) => estados.push(x),
  });
  await g.consultar(2025);
  assert.equal(estados.at(-1).error, fallo);
  assert.equal(estados.at(-1).datos, null);
  assert.equal(g.ultimoAnio, 2025);
  await g.consultar(g.ultimoAnio);
  assert.equal(estados.at(-1).error, null);
  assert.equal(estados.at(-1).datos.filtroAnio, 2025);
});
test('una respuesta monetaria mal formada produce error, sin cero o exito falsos', async () => {
  const dto = respuesta();
  dto.datos[0].importeTotal = '1.009';
  const estados = [];
  const g = historial.crearConsultasHistorial({
    obtener: async () => dto,
    actualizar: (x) => estados.push(x),
  });
  await g.consultar(null);
  assert.equal(estados.at(-1).datos, null);
  assert.ok(estados.at(-1).error);
});
test('valida contrato, filtro y BIGINT textual sin convertirlo a Number', () => {
  const dto = respuesta();
  assert.equal(historial.validarRespuestaHistorial(dto, null), dto);
  assert.equal(dto.datos[0].aportaciones[0].id, '9007199254740993');
  for (const malo of [null, { ...dto, total: 2 }, { ...dto, filtroAnio: 2024 }]) {
    assert.throws(() => historial.validarRespuestaHistorial(malo, null), TypeError);
  }
});
for (const invalido of [
  null,
  undefined,
  20,
  '',
  '20',
  '20.0',
  '20.000',
  '-1.00',
  '+1.00',
  '01.00',
  '1,00',
  '1e3',
  'NaN',
  ' 1.00',
  '1.00\n',
]) {
  test(`rechaza total no canonico ${JSON.stringify(invalido)}`, () =>
    assert.throws(() => formatearTotalAnual(invalido), TypeError));
}
