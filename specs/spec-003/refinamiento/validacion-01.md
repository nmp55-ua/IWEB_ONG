# Validación 1 de spec-003 (HU-03), 08/11/2026

Ejecución local de T023 y T024 al terminar `/speckit-implement`. Entorno desechable: contenedor
`postgres:16` con `--rm` en el puerto 5499, con tres bases: `ong_test` (migrada, pruebas generales),
`ong_test_hu01` (vacía, pruebas de HU-01, que crean sus propios esquemas) y `ong_qs` (migraciones,
semillas y [datos-prueba.sql](../datos-prueba.sql), para el quickstart). No se ha leído ni usado `.env`:
las variables se pasaron en cada orden. Node 24.21, npm 11.19.

## T023 — Pruebas automáticas

| Conjunto | Orden | Resultado |
|---|---|---|
| Backend salvo donaciones | `DATABASE_URL=TEST_DATABASE_URL=…/ong_test npx vitest run --exclude 'src/modulos/donaciones/**'` | 9 ficheros, **166 pasan**, 3 omitidas (las 3 de `actividades/servicio.test.js`, ya omitidas antes de HU-03) |
| Backend donaciones (HU-01) | `DATABASE_URL=TEST_DATABASE_URL=…/ong_test_hu01 npx vitest run src/modulos/donaciones` | 12 ficheros, **379 pasan** |
| Frontend | `npm test` | **10 pasan** (5 de HU-03) |
| Frontend | `npm run build` | Compila |

Línea base antes de HU-03: 117 pasan + 3 omitidas, y 379 en donaciones. HU-03 añade 49 pruebas
(`certificados.test.js` 32, `textos.test.js` 14, `tarea.test.js` 3) y 5 en el frontend.

Incidencias resueltas durante la implementación:

1. **008 y la prueba de migraciones de HU-01**: `donaciones/migraciones.test.js` espera la lista exacta de
   migraciones aplicadas; con 008 fallaban 2 pruebas. Con aprobación de Rubén se añadió
   `008_certificados.sql` a esa lista (un cambio de una línea en un fichero de Nada, que se le comunica en
   la PR).
2. **`registro.test.js` de HU-01**: simula `db/pool.js` sin `transaccion` e importa `app.js`; la instancia
   por defecto del servicio de HU-03 leía `transaccion` al importarse y la suite no cargaba. Se corrigió en
   el servicio de HU-03 (dependencias por defecto resueltas al usarlas), sin tocar la prueba de HU-01.

## T024 — Quickstart contra el servidor real

Servidor `node src/servidor.js` sobre `ong_qs` (`AHORA_SIMULADO=2026-01-01T00:10:00+01:00`), sin SMTP
(Mailpit no estaba arrancado, así que los correos cuentan como fallidos y se registran: también valida
ese caso límite). Llamadas a la API con `curl` y las cuentas de las semillas.

| Paso | Resultado |
|---|---|
| Carga de `datos-prueba.sql` | Se aplica sobre las semillas; la segunda vez inserta 0 filas |
| Orden de consola 2024 / 2025 | `1 emitidos` / `3 emitidos` (Ana, Lucía y Pablo, cuyas semillas tienen una cuota de hace 400 días); 2026 y `25` → mensaje y salida 1 |
| 1.1, 1.2, 1.6 | `voluntario2`: 2025 = `80.00`, 2024 = `25.00`, `ejercicioEnCurso` 2026, `vinculado: true` |
| 1.3 | PDF 200 `application/pdf`. El texto extraído contiene ONG y CIF, Ana Certificado Prueba, `11111111H`, 2025, 80,00 €, 01/01/2026, el código y la dirección de verificación |
| 1.4 | 2023 → 404 con el texto único |
| 1.5 | 2026 → 409 «…a partir del 01/01/2027.» |
| 1.7 | `donante2` pide 2024 → 404 |
| 1.8 | Confirmación tardía de `HU03-QS-0007` y orden con `AHORA_SIMULADO=2026-01-02…`: `1 regenerados`; un único 2025 por `100.00`, fecha `2026-01-02`, código distinto |
| 1.10 | Código nuevo → válido, `100.00`, `2026-01-02`, `***1111*`, sin nombre ni correo |
| 1.11 | Código antiguo e inexistente → `{ "valido": false }` |
| 1.12 (parte API) | `donante@ong.test` sin vínculo → `vinculado: false`, lista vacía |
| Sin sesión | 401 `NO_IDENTIFICADO` |

**No recorrido a mano en el navegador**: el aspecto de las páginas `/mis-certificados` y
`/verificar-certificado`, los correos en Mailpit (1.9) y el vínculo completo por `/donar/vincular`
(segunda mitad de 1.12). Su lógica está cubierta por las pruebas automáticas (textos de correo,
invitación a vincular y acceso tras asignar `usuario_id`), pero el principio III pide comprobarlo en la
aplicación: queda para la revisión de Nada con el quickstart.

## Pendiente

- **SC-001**: depende de HU-02 (historial), que no está en `main`. Cuando se integre, comparar el total
  de 2025 de Ana en el historial con el certificado (100,00 € tras el paso 1.8).
