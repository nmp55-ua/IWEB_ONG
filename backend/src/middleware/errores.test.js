// Mensajes de validación por defecto en español (pendiente común de reparto-entrega.md).
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { errorDeValidacion } from './errores.js';

const campos = (esquema, datos) => errorDeValidacion(esquema.safeParse(datos).error).campos;

describe('mensajes por defecto de zod en español', () => {
  const esquema = z
    .object({
      nombre: z.string().min(1),
      correo: z.string().email(),
      edad: z.number().int().min(18).max(99),
      tipo: z.enum(['a', 'b']),
    })
    .strict();

  it('campo ausente, tipo incorrecto, correo, rango, enumeración y campo no permitido', () => {
    expect(campos(esquema, {})).toMatchObject({
      nombre: 'Este campo es obligatorio.',
      correo: 'Este campo es obligatorio.',
    });
    expect(campos(esquema, { nombre: '', correo: 'x', edad: 'diez', tipo: 'c', otro: 1 })).toEqual({
      nombre: 'Este campo es obligatorio.',
      correo: 'Introduce un correo válido.',
      edad: 'El valor no tiene el tipo esperado.',
      tipo: 'Valor no válido.',
      _: 'Campo no permitido: otro.',
    });
    expect(campos(esquema, { nombre: 'a', correo: 'a@b.es', edad: 10, tipo: 'a' }).edad).toBe(
      'Debe ser mayor o igual que 18.',
    );
  });

  it('ningún mensaje por defecto queda en inglés', () => {
    const todos = Object.values(campos(esquema, { edad: 120, tipo: 1, extra: true }));
    for (const m of todos) expect(m).not.toMatch(/Required|Expected|Invalid|Unrecognized|Number must/);
  });

  it('el mensaje propio de un esquema tiene prioridad', () => {
    const conMensaje = z.object({ plazas: z.number({ invalid_type_error: 'Indica las plazas.' }) });
    expect(campos(conMensaje, { plazas: 'x' })).toEqual({ plazas: 'Indica las plazas.' });
  });
});
