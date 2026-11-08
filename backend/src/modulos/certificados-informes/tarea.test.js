// Pruebas de la tarea programada de HU-03 (sin base de datos).
import { describe, expect, it, vi } from 'vitest';
import { EXPRESION, ejecutarTarea, programarCertificados } from './tarea.js';

describe('tarea programada de certificados', () => {
  it('se programa cada hora en el minuto 5, hora de Madrid', () => {
    const programar = vi.fn(() => 'tarea');
    expect(programarCertificados({ programar })).toBe('tarea');
    expect(EXPRESION).toBe('5 * * * *');
    expect(programar).toHaveBeenCalledWith('5 * * * *', expect.any(Function), { timezone: 'Europe/Madrid' });
  });

  it('registra solo los ejercicios con cambios', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await ejecutarTarea(async () => [
      { ejercicio: 2024, emitidos: 0, regenerados: 0, correosFallidos: 0 },
      { ejercicio: 2025, emitidos: 2, regenerados: 1, correosFallidos: 0 },
    ]);
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0][0]).toBe('Certificados 2025: 2 emitidos, 1 regenerados, 0 correos fallidos.');
    log.mockRestore();
  });

  it('un error no tumba el proceso: se registra y la siguiente ejecución lo reintenta', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(
      ejecutarTarea(async () => {
        throw new Error('base caída');
      }),
    ).resolves.toBeUndefined();
    expect(error.mock.calls[0][0]).toContain('base caída');
    error.mockRestore();
  });
});
