# Migraciones

Numeración de dominio (ver `specs/modelo-datos.md`). El estado siguiente describe este
checkout; no acredita publicación o integración en otras ramas:

| Fichero                                                            | Dueño             | Estado                                                 |
| ------------------------------------------------------------------ | ----------------- | ------------------------------------------------------ |
| `001_usuarios.sql`                                                 | Común             | hecha                                                  |
| `002_sesiones.sql`                                                 | Común             | hecha                                                  |
| `003_proyectos.sql`                                                | Común             | hecha                                                  |
| `004_donaciones.sql` (donantes, suscripciones_socio, aportaciones) | Nada · spec-001   | creada y validada en spec-001; revisión T006 pendiente |
| `005_actividades.sql`                                              | Nicole · spec-007 | hecha                                                  |
| `006_voluntariado.sql` (voluntarios, inscripciones)                | Javi · spec-005   | pendiente                                              |
| `007_asistencias.sql`                                              | Nicole · spec-008 | pendiente                                              |
| `008_certificados.sql`                                             | Rubén · spec-003  | pendiente                                              |

Nunca se edita una migración ya subida a `main`. Los cambios posteriores usan `009` en adelante,
pidiendo el número al grupo.

## Propuesta local de HU-01 (2026-11-06)

`009_operativa_donaciones.sql` se prepara en spec-001 como numeración provisional
autorizada para desarrollo local. **No está reservada colectivamente** ni incorporada
a main. T007 (coordinación del número) y T006 (revisión de Rubén) siguen pendientes;
ambas son requisitos anteriores a la incorporación compartida.

En la comprobación previa comunicada por Nada no se encontró 009 en las ramas publicadas
consultadas. Esto no reserva el número ni descarta trabajo sin publicar. T007 requiere
coordinación efectiva; T006 puede acreditarse mediante la revisión real de Rubén en la PR.

Contiene únicamente operaciones_pago, eventos_pasarela, verificaciones_donante y
correos_aportacion del modelo vigente. Depende de 004 y de su base común, sin referencias
a 006–008. No modifica 004 ni las migraciones anteriores. Si la coordinación exige otro
número, deberá resolverse antes de incorporar esta propuesta.

El migrador registra **nombres de archivo**, aplica cada SQL pendiente en transacción y
no reaplica nombres ya registrados. Por eso puede incorporar 004 después de 005, según
las pruebas de [validación de 004](../../../../specs/spec-001/refinamiento/validacion-004-01.md).
`npm run migrar`, desde backend, aplica todos los SQL pendientes de esta carpeta en
`DATABASE_URL`; no selecciona solo 004. Un eventual cambio de número/nombre de 009
debe considerar también los entornos donde ya se haya aplicado, para evitar su reaplicación.
Este bloque no renombra ni modifica ninguna migración.

Las pruebas y el soporte usan esquemas temporales de ong_test_hu01; no aplican esta
migración en public o en bases de desarrollo. Evidencia: [validacion-local-01.md](../../../../specs/spec-001/refinamiento/validacion-local-01.md).
