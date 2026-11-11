# Migraciones

Numeración de dominio (ver `specs/modelo-datos.md`). El estado siguiente describe este
checkout; no acredita publicación o integración en otras ramas:

| Fichero                                                            | Dueño             | Estado                                                             |
| ------------------------------------------------------------------ | ----------------- | ------------------------------------------------------------------ |
| `001_usuarios.sql`                                                 | Común             | hecha                                                              |
| `002_sesiones.sql`                                                 | Común             | hecha                                                              |
| `003_proyectos.sql`                                                | Común             | hecha                                                              |
| `004_donaciones.sql` (donantes, suscripciones_socio, aportaciones) | Nada · spec-001   | revisada e incorporada mediante PR #4 |
| `005_actividades.sql`                                              | Nicole · spec-007 | hecha                                                              |
| `006_voluntariado.sql` (voluntarios, inscripciones)                | Javi · spec-005   | incorporada desde main; validación integrada en su informe         |
| `007_asistencias.sql`                                              | Nicole · spec-008 | pendiente                                                          |
| `008_certificados.sql` (certificados_fiscales)                     | Rubén · spec-003  | creada en spec-003; pendiente de PR                                |

Nunca se edita una migración ya subida a `main`. Los cambios posteriores usan `009` en adelante,
pidiendo el número al grupo.

## Ampliación operativa de HU-01

HU-01 revisada por el revisor asignado e incorporada a main mediante la PR #4; `009_operativa_donaciones.sql` es la numeración definitiva.

Contiene operaciones_pago, eventos_pasarela, verificaciones_donante y correos_aportacion.
Depende de 004 y su base común, sin referencias a 006–008.

El migrador registra nombres de archivo y aplica cada SQL pendiente en transacción.
No se renombran migraciones aplicadas para evitar su reaplicación. `npm run migrar`,
desde backend, aplica los SQL pendientes a DATABASE_URL.

Validaciones: [004](../../../../specs/spec-001/refinamiento/validacion-004-01.md),
[soporte operativo](../../../../specs/spec-001/refinamiento/validacion-local-01.md)
y [integración](../../../../specs/spec-001/refinamiento/integracion-main-01.md).
