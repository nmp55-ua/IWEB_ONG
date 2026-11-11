import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let banco;
let entrada;
let salida;

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('HU02_PUERTO_MEDICION', '44326');
  banco = {
    url: 'http://127.0.0.1:44326',
    cuentas: { periodico: 'periodico@historial.example.test' },
    entorno: {
      pool: {
        query: vi
          .fn()
          .mockResolvedValueOnce({ rows: [{ base: 'ong_test_hu01', esquema: 'hu01_sintetico' }] })
          .mockResolvedValueOnce({ rows: [] }),
      },
    },
    llamadas: vi.fn().mockResolvedValue({ stripe: 0, smtp: 0 }),
    cerrar: vi.fn().mockResolvedValue(undefined),
    recursosCerrados: vi.fn().mockReturnValue(true),
  };
  entrada = {
    close: vi.fn(),
    async *[Symbol.asyncIterator]() {
      yield 'cerrar';
    },
  };
  vi.doMock('./pruebas/historial-local.js', () => ({
    crearBancoHistorial: vi.fn().mockResolvedValue(banco),
  }));
  vi.doMock('node:readline', () => ({ createInterface: vi.fn().mockReturnValue(entrada) }));
  salida = vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.doUnmock('./pruebas/historial-local.js');
  vi.doUnmock('node:readline');
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('T036 · cierre del controlador de medición', () => {
  it('cierra el banco y conserva el mismo error si fallan los contadores', async () => {
    const fallo = new Error('Timeout sintético de contadores');
    banco.llamadas.mockRejectedValue(fallo);

    await expect(import('./pruebas/medicion-historial.js')).rejects.toBe(fallo);

    expect(entrada.close).toHaveBeenCalledOnce();
    expect(banco.cerrar).toHaveBeenCalledOnce();
    expect(banco.recursosCerrados).toHaveBeenCalledOnce();
    expect(salida).toHaveBeenCalledWith(JSON.stringify({ recursosCerrados: true }));
    expect(salida.mock.calls.some(([texto]) => texto.includes('"llamadas"'))).toBe(false);
  });

  it('espera al cierre antes de publicar su estado en el recorrido satisfactorio', async () => {
    const orden = [];
    banco.cerrar.mockImplementation(async () => {
      orden.push('inicia cierre');
      await Promise.resolve();
      orden.push('termina cierre');
    });
    banco.recursosCerrados.mockImplementation(() => {
      orden.push('consulta estado');
      return true;
    });

    await import('./pruebas/medicion-historial.js');

    expect(orden).toEqual(['inicia cierre', 'termina cierre', 'consulta estado']);
    expect(entrada.close).toHaveBeenCalledOnce();
    expect(banco.cerrar).toHaveBeenCalledOnce();
    expect(salida).toHaveBeenCalledWith(JSON.stringify({ llamadas: { stripe: 0, smtp: 0 } }));
  });

  it('libera el banco y conserva un fallo previo al preparar el conjunto', async () => {
    const fallo = new Error('Fallo SQL sintético de preparación');
    banco.entorno.pool.query.mockReset().mockRejectedValue(fallo);

    await expect(import('./pruebas/medicion-historial.js')).rejects.toBe(fallo);

    expect(entrada.close).toHaveBeenCalledOnce();
    expect(banco.llamadas).toHaveBeenCalledOnce();
    expect(banco.cerrar).toHaveBeenCalledOnce();
  });
});
