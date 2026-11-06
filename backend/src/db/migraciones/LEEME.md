# Migraciones

Numeración reservada (ver `specs/modelo-datos.md`):

| Fichero                                                            | Dueño             | Estado    |
| ------------------------------------------------------------------ | ----------------- | --------- |
| `001_usuarios.sql`                                                 | Común             | hecha     |
| `002_sesiones.sql`                                                 | Común             | hecha     |
| `003_proyectos.sql`                                                | Común             | hecha     |
| `004_donaciones.sql` (donantes, suscripciones_socio, aportaciones) | Nada · spec-001   | pendiente |
| `005_actividades.sql`                                              | Nicole · spec-007 | hecha     |
| `006_voluntariado.sql` (voluntarios, inscripciones)                | Javi · spec-005   | pendiente |
| `007_asistencias.sql`                                              | Nicole · spec-008 | pendiente |
| `008_certificados.sql`                                             | Rubén · spec-003  | pendiente |

Nunca se edita una migración ya subida a `main`. Los cambios posteriores usan `009` en adelante,
pidiendo el número al grupo.

## Propuesta local de HU-01 (2026-11-06)

`009_operativa_donaciones.sql` se prepara en spec-001 como numeración provisional
autorizada para desarrollo local. **No está reservada colectivamente** ni incorporada
a main. T007 (coordinación del número) y T006 (revisión de Rubén) siguen pendientes;
ambas son requisitos anteriores a la incorporación compartida.

Contiene únicamente operaciones_pago, eventos_pasarela, verificaciones_donante y
correos_aportacion del modelo vigente. Depende de 004 y de su base común, sin referencias
a 006–008. No modifica 004 ni las migraciones anteriores. Si la coordinación exige otro
número, deberá resolverse antes de incorporar esta propuesta.

Las pruebas y el soporte usan esquemas temporales de ong_test_hu01; no aplican esta
migración en public o en bases de desarrollo. Evidencia: [validacion-local-01.md](../../../../specs/spec-001/refinamiento/validacion-local-01.md).
