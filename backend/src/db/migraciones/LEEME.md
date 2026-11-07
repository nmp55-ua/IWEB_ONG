# Migraciones

Numeración de dominio (ver `specs/modelo-datos.md`). El estado siguiente describe este
checkout; no acredita publicación o integración en otras ramas:

| Fichero                                                            | Dueño             | Estado                                                             |
| ------------------------------------------------------------------ | ----------------- | ------------------------------------------------------------------ |
| `001_usuarios.sql`                                                 | Común             | hecha                                                              |
| `002_sesiones.sql`                                                 | Común             | hecha                                                              |
| `003_proyectos.sql`                                                | Común             | hecha                                                              |
| `004_donaciones.sql` (donantes, suscripciones_socio, aportaciones) | Nada · spec-001   | creada y validada; paquete T006 preparado, aprobación PR pendiente |
| `005_actividades.sql`                                              | Nicole · spec-007 | hecha                                                              |
| `006_voluntariado.sql` (voluntarios, inscripciones)                | Javi · spec-005   | incorporada desde main; validación integrada en su informe         |
| `007_asistencias.sql`                                              | Nicole · spec-008 | pendiente                                                          |
| `008_certificados.sql`                                             | Rubén · spec-003  | pendiente                                                          |

Nunca se edita una migración ya subida a `main`. Los cambios posteriores usan `009` en adelante,
pidiendo el número al grupo.

## Elección local de HU-01 — actualización 2026-11-07

`009_operativa_donaciones.sql` se conserva como elección local de spec-001 tras comprobar
las ramas publicadas. **No está reservada colectivamente** ni incorporada a main.
T007 registra esa comprobación/elección; T006 prepara el paquete completo para Rubén.

La [comprobación actual](../../../../specs/spec-001/refinamiento/ajuste-flujo-01.md), a
2026-11-07, enumera nueve ramas y seis commits distintos; sus árboles completos no
contienen 009 en la carpeta canónica. La segunda lectura conserva las mismas referencias.
Esto no descarta trabajo sin publicar ni crea una reserva. PR-R01 exige revisión/aprobación
reales de Rubén y PR-R02 resolver la numeración/conflictos antes de main, con la elección
explicada en la PR. No son requisitos para terminar el desarrollo o preparar/abrir la PR.

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

La integración local de main del 2026-11-07 toma como destino
`272afd65a3a6f0a52129667c889e272c113456be`, confirmado tras fetch. Su árbol publicado
contiene 006 y no contiene ninguna migración 009. Se conserva el nombre local de HU-01,
sin reserva colectiva ni aprobación atribuida; PR-R01/PR-R02 siguen pendientes antes de
main. Decisiones, pruebas y alcance en
[integracion-main-01.md](../../../../specs/spec-001/refinamiento/integracion-main-01.md).

Las pruebas y el soporte usan esquemas temporales de ong_test_hu01; no aplican esta
migración en public o en bases de desarrollo. Evidencia: [validacion-local-01.md](../../../../specs/spec-001/refinamiento/validacion-local-01.md).
