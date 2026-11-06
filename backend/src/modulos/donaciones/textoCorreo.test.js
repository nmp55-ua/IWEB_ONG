import { describe, expect, it } from 'vitest';
import {
  MINUTOS_VERIFICACION,
  formatearDestinoCorreo,
  formatearFechaCorreo,
  formatearImporteCorreo,
  textoCorreoConfirmacion,
  textoCorreoVerificacion,
} from './textoCorreo.js';

const resumen = Object.freeze({
  referencia: 'DON-0f2b9c1e-1111-4222-8333-944455556666',
  importe: '50.00',
  modalidad: 'puntual',
  destino: 'fondo general',
  fechaCobro: '2026-11-01T22:16:00+01:00',
});

describe('formatearImporteCorreo', () => {
  it.each([
    ['50.00', '50,00 €'],
    ['1.00', '1,00 €'],
    ['20.5', '20,50 €'],
    ['35.05', '35,05 €'],
    ['7', '7,00 €'],
    ['1234.50', '1.234,50 €'],
    ['999999.99', '999.999,99 €'],
    ['1000000.00', '1.000.000,00 €'],
  ])('%s → %s', (entrada, salida) => {
    expect(formatearImporteCorreo(entrada)).toBe(salida);
  });

  it('conserva céntimos exactos donde la coma flotante fallaría', () => {
    expect(formatearImporteCorreo('0.10')).toBe('0,10 €');
    expect(formatearImporteCorreo('9007199254740993.01')).toBe('9.007.199.254.740.993,01 €');
  });

  it('muestra tal cual un valor inesperado, sin inventar un importe', () => {
    expect(formatearImporteCorreo('abc')).toBe('abc');
    expect(formatearImporteCorreo(null)).toBe('');
  });
});

describe('formatearFechaCorreo', () => {
  it('usa dd/mm/aaaa en Europe/Madrid', () => {
    expect(formatearFechaCorreo('2026-11-01T22:16:00+01:00')).toBe('01/11/2026');
    expect(formatearFechaCorreo('2026-11-01T23:30:00Z')).toBe('02/11/2026');
  });

  it('respeta el cambio de hora de octubre (25/10/2026, CEST → CET)', () => {
    // 23:30 UTC del día 24 = 01:30 CEST del 25 en Madrid.
    expect(formatearFechaCorreo('2026-10-24T23:30:00Z')).toBe('25/10/2026');
    // 00:30 UTC del día 25 = 02:30 CEST; 01:30 UTC = 02:30 CET (hora repetida).
    expect(formatearFechaCorreo('2026-10-25T00:30:00Z')).toBe('25/10/2026');
    expect(formatearFechaCorreo('2026-10-25T01:30:00Z')).toBe('25/10/2026');
    // 22:30 UTC del día 25 = 23:30 CET; 23:30 UTC ya es 00:30 del 26.
    expect(formatearFechaCorreo('2026-10-25T22:30:00Z')).toBe('25/10/2026');
    expect(formatearFechaCorreo('2026-10-25T23:30:00Z')).toBe('26/10/2026');
  });

  it('sin fecha o con fecha no válida no muestra nada', () => {
    expect(formatearFechaCorreo(null)).toBe('');
    expect(formatearFechaCorreo('no-es-fecha')).toBe('');
  });
});

describe('formatearDestinoCorreo', () => {
  it('pone mayúscula inicial al fondo general y deja el proyecto tal cual', () => {
    expect(formatearDestinoCorreo('fondo general')).toBe('Fondo general');
    expect(formatearDestinoCorreo('Agua potable')).toBe('Agua potable');
    expect(formatearDestinoCorreo('comedor social')).toBe('comedor social');
  });
});

describe('textoCorreoConfirmacion', () => {
  it('presenta el resumen en español, en el orden de la pantalla', () => {
    expect(textoCorreoConfirmacion(resumen)).toBe(
      [
        'Hola:',
        '',
        'Gracias por tu aportación. Estos son los datos de tu donación:',
        '',
        'Importe: 50,00 €',
        'Fecha de cobro: 01/11/2026',
        'Modalidad: Donación puntual',
        'Destino: Fondo general',
        `Referencia: ${resumen.referencia}`,
        '',
        'Este es un correo automático.',
      ].join('\n'),
    );
  });

  it('muestra el nombre del proyecto, miles y la modalidad de cuota', () => {
    const texto = textoCorreoConfirmacion({
      ...resumen,
      importe: '1234.50',
      destino: 'Agua potable',
      modalidad: 'cuota_socio',
    });
    expect(texto).toContain('Importe: 1.234,50 €');
    expect(texto).toContain('Destino: Agua potable');
    expect(texto).toContain('Modalidad: Cuota de socio');
    expect(texto).not.toContain('Fondo general');
  });

  it('no vuelca claves internas ni valores en bruto', () => {
    const texto = textoCorreoConfirmacion(resumen);
    for (const bruto of ['importe:', 'modalidad:', 'fechaCobro', 'destino:', '50.00', ': puntual', 'T22:16'])
      expect(texto).not.toContain(bruto);
  });

  it('es pura y estable: el mismo resumen da el mismo texto y no se modifica', () => {
    const copia = structuredClone(resumen);
    expect(textoCorreoConfirmacion(copia)).toBe(textoCorreoConfirmacion(resumen));
    expect(copia).toEqual(resumen);
  });

  it('omite la línea de un dato que el resumen no contiene', () => {
    const texto = textoCorreoConfirmacion({ ...resumen, fechaCobro: null });
    expect(texto).not.toContain('Fecha de cobro');
  });
});

describe('textoCorreoVerificacion', () => {
  const enlace = 'http://localhost:4321/donar/vincular#token=' + 'A'.repeat(43);

  it('explica el propósito, la caducidad, el uso único y qué hacer si no se pidió', () => {
    const texto = textoCorreoVerificacion(enlace);
    expect(texto).toContain(enlace);
    expect(texto).toContain('vincular a ella las aportaciones hechas con esta dirección de correo');
    expect(texto).toContain(`caduca en ${MINUTOS_VERIFICACION} minutos`);
    expect(MINUTOS_VERIFICACION).toBe(30);
    expect(texto).toContain('solo funciona con la cuenta desde la que se pidió');
    expect(texto).toContain('una sola vez');
    expect(texto).toContain('Si no lo has pedido tú, puedes ignorar este correo.');
  });

  it('el token solo aparece en el fragmento del enlace', () => {
    const texto = textoCorreoVerificacion(enlace);
    expect(texto.match(/#token=([A-Za-z0-9_-]+)/)[1]).toBe('A'.repeat(43));
    expect(texto.split('A'.repeat(43))).toHaveLength(2);
  });
});
