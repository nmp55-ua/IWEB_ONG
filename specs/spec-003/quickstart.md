# Quickstart: validar HU-03

## Preparación

Arranque según el [README](../../README.md): `npm run migrar` y `npm run semillas` en `backend/`, y
`npm run dev` en `backend/` y en `frontend/`. Correos en Mailpit (`http://localhost:8025`).

Después, cargar los datos sintéticos de HU-03 ([datos-prueba.sql](datos-prueba.sql)):

```bash
docker compose exec -T db psql -U ong -d ong < specs/spec-003/datos-prueba.sql
```

| Donante | Cuenta | Aportaciones relevantes |
|---|---|---|
| Ana Certificado Prueba (`11111111H`) | `voluntario2@ong.test` (vinculada) | 25 € (2024); 50 € (15/03/2025) y 30 € (10/11/2025) confirmadas; 15 € rechazada y 12 € cancelada; 20 € el 01/01/2026 a las 00:00; 20 € pendiente (`HU03-QS-0007`) |
| Lucía Donante Prueba (`12345678Z`) | ninguna vinculada (su correo es el de `donante@ong.test`) | 45 € (01/06/2025) |
| Pablo Donante Prueba (`87654321X`) | `donante2@ong.test` (vinculada) | las de las semillas de HU-01, con fechas relativas |

Las fechas se mueven con `AHORA_SIMULADO` en `.env` (reiniciar el back-end tras cambiarla). La
generación se lanza a mano con `npm run certificados -- --ejercicio 2025` en `backend/` (es la misma
función que ejecuta la tarea horaria). Contraseña de las cuentas: `CONTRASENA_SEMILLAS`.

Pruebas automáticas, en `backend/` y siempre contra una base de pruebas:
`DATABASE_URL=<url de ong_test> TEST_DATABASE_URL=<url de ong_test> npm test`
(`certificados-informes/certificados.test.js` y `textos.test.js`); en `frontend/`, `npm test`.

## Historia 1 — Descargar mi certificado fiscal

Hacer los pasos en este orden.

| # | Pasos | Resultado esperado |
|---|---|---|
| 1.1 | `AHORA_SIMULADO=2026-01-01T00:10:00+01:00`; `npm run certificados -- --ejercicio 2024` y `-- --ejercicio 2025`. Como `voluntario2@ong.test`, *Certificados* en el menú (`/mis-certificados`) | Ejercicio 2025 por **80,00 €**, fecha de emisión 01/01/2026 y su código. La consola indica los emitidos |
| 1.2 | Mirar el total de 2025 | No incluye los 20 € del 01/01/2026 a las 00:00 (sería 100,00 €) |
| 1.3 | *Descargar PDF* de 2025 y abrirlo | Nombre y CIF de la ONG; Ana Certificado Prueba, `11111111H`; ejercicio 2025; 80,00 €; 01/01/2026; código y dirección de verificación |
| 1.4 | En «Consultar un ejercicio», elegir 2023 | «No tienes aportaciones confirmadas en 2023, así que no hay certificado de ese ejercicio.» |
| 1.5 | `AHORA_SIMULADO=2026-10-15T12:00:00+02:00`, reiniciar; elegir 2026 | «El certificado de 2026 se generará a partir del 01/01/2027.» y no hay botón de descarga. `GET /api/yo/certificados/2026/pdf` da 409 |
| 1.6 | En la tabla | Se pueden descargar 2024 (25,00 €) y 2025 (80,00 €) |
| 1.7 | Como `donante2@ong.test`: `GET /api/yo/certificados/2024/pdf` (Ana tiene uno de 2024, Pablo no) | 404 «No hay certificado de 2024…». No hay ninguna ruta con el identificador de otro Donante |
| 1.8 | Apuntar el código de 2025. `AHORA_SIMULADO=2026-01-02T10:00:00+01:00`. Simular la confirmación tardía de HU-01: `UPDATE aportaciones SET estado='confirmada', fecha_cobro='2025-12-31T23:59:00+01:00' WHERE referencia='HU03-QS-0007';` y `npm run certificados -- --ejercicio 2025` | La consola indica 1 regenerado. En `/mis-certificados`, un único 2025 por **100,00 €**, fecha 02/01/2026 y código distinto (el 31/12 a las 23:59 cuenta en 2025) |
| 1.9 | Mailpit | Correos «Tu certificado fiscal de 2024/2025 está disponible» para `voluntario2@ong.test` (paso 1.1) y «… se ha actualizado» (paso 1.8), con enlace a `/mis-certificados` y sin adjunto ni NIF/NIE |
| 1.10 | Sin sesión, abrir `/verificar-certificado` e introducir el código nuevo de 2025 | «Certificado válido», ejercicio 2025, 100,00 €, 02/01/2026 y NIF/NIE `***1111*`. No sale el nombre, correo ni dirección |
| 1.11 | Introducir el código antiguo apuntado en 1.8, y después `AAAA-BBBB-CCCC-DDDD` | «Código no válido», sin datos |
| 1.12 | En el paso 1.1 también se emitió el de Lucía. En Mailpit, el correo a `donante@ong.test` | Invita a crear una cuenta de donante o entrar y vincularla en `/donar/vincular`. Como `donante@ong.test`, `/mis-certificados` muestra que la cuenta no está vinculada y el enlace. Completar el vínculo en `/donar/vincular` (correo en Mailpit) y volver: aparece 2025 por 45,00 € |

## Casos límite

| Caso | Pasos | Resultado esperado |
|---|---|---|
| Pendientes, rechazadas o canceladas | Paso 1.1 | 15 € y 12 € (y los 20 € pendientes antes de 1.8) no suman |
| Varias descargas | Descargar dos veces el PDF de 2025 | Mismo código y mismos datos |
| Confirmación tardía sin certificado previo | Con `AHORA_SIMULADO` en 2026, insertar una aportación confirmada de 2025 para un Donante sin certificado de 2025 y lanzar la orden | Se emite y se envía el correo de «disponible» |
| Rechazada o cancelada | Una aportación de 2025 pasa a rechazada o cancelada sin haber estado confirmada; lanzar la orden | La consola da 0 emitidos y 0 regenerados; no hay correo |
| Falla el correo | Parar Mailpit (`docker compose stop mailpit`), forzar una emisión y lanzar la orden; después `docker compose start mailpit` | El certificado está en `/mis-certificados`; la consola y el registro indican el correo fallido |
| 31/12 a las 23:59 | Paso 1.8 | Cuenta en 2025 |
| Sin sesión o sin rol | Abrir `/mis-certificados` sin entrar, y como `coordinador@ong.test` | «Inicia sesión…» con *Entrar*; con el coordinador, «No tienes permiso…» (403) |

## Criterios de éxito

- **SC-001**: pendiente de HU-02 (historial), que aún no está en `main`. Cuando exista, comparar para
  Ana el total de 2025 del historial con el certificado (100,00 € tras el paso 1.8). Ambos usan la
  misma regla (confirmadas por `fecha_cobro` en `rangoAnio`).
- **SC-002**: tras el paso 1.1, `SELECT count(*)` de Donantes con aportaciones confirmadas en 2025 es
  igual al de certificados de 2025. La prueba automática lo comprueba también. En producción la tarea
  horaria lo hace el 1 de enero a las 00:05.
