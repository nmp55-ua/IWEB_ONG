# Implementation Plan: HU-03 — Certificado fiscal anual de donaciones

**Branch**: `spec-003` | **Date**: 2026-11-08 | **Spec**: [spec.md](spec.md)

**Responsable**: *Rubén* · **Revisora**: *Nada*

**Base común**: [plan-comun.md](../plan-comun.md) · [modelo-datos.md](../modelo-datos.md).
Este plan no repite lo que allí se fija (pila, estructura, sesión, formato de la API y de
errores, pruebas). Solo añade lo propio de HU-03. Los datos de HU-01 se consumen según el
[resumen técnico de HU-01 para HU-03](../spec-001/refinamiento/resumen-tecnico-hu03-01.md).

## Summary

El sistema emite un **CertificadoFiscal** por Donante y ejercicio cerrado con total mayor que
cero, sumando en SQL (`NUMERIC`) las aportaciones `confirmada` cuya `fecha_cobro` cae en
`rangoAnio(ejercicio)` de `servicios-comunes/fechas.js` (Europe/Madrid). Una única función del
servicio, `reconciliarEjercicio(ejercicio)`, emite los que faltan y regenera los que han cambiado
de total (confirmación tardía, FR-008) con nueva fecha de emisión y código nuevo; después avisa
por correo (FR-009). La lanza una tarea `node-cron` cada hora en el minuto 5 (la primera del
año, el 1 de enero a las 00:05) y a mano `npm run certificados -- --ejercicio 2025`
([research.md](research.md) R2–R3).

El donante con cuenta vinculada (`donantes.usuario_id`) ve y descarga sus certificados en
`/mis-certificados`; el PDF se genera al descargar con `generarPdf` común. Cualquiera comprueba
un código en la página pública `/verificar-certificado`. Se añade una sola tabla,
`certificados_fiscales`, en la migración reservada `008_certificados.sql`.

## Technical Context

Todo según [plan-comun.md](../plan-comun.md#technical-context): JavaScript ES modules en
Node.js 22, Express 4 + `pg` + `zod`, `pdfkit` (vía `pdf.js`), `nodemailer` (vía `correo.js`),
`node-cron`, PostgreSQL 16, Astro 5 + React 19 + Tailwind 3. Pruebas: Vitest + Supertest
(backend) y `node --test` (funciones puras del frontend). No se añade ninguna dependencia.

**Performance Goals**: SC-002 (el 1 de enero el 100 % disponible): la reconciliación de un
ejercicio es una consulta agregada sobre el índice `(donante_id, estado, fecha_cobro)` y una
escritura por certificado nuevo o cambiado; para miles de aportaciones tarda segundos.
**Constraints**: importes exactos al céntimo (suma y comparación en SQL, nunca en coma
flotante); año natural de Madrid con rango semiabierto; solo `estado='confirmada'` y
`fecha_cobro`; propiedad por `donantes.usuario_id`; sin importar el repositorio de donaciones.
**Scale/Scope**: 1 tabla, 3 rutas, 1 tarea programada, 1 orden de consola, 2 páginas.

No queda ningún NEEDS CLARIFICATION: la sesión de clarify de 2026-11-08 cerró el NIF/NIE
obligatorio, la confirmación tardía y el vínculo verificado; el resto se decide en
[research.md](research.md).

## Constitution Check

*Antes del diseño y revisado tras él: todo cumple.*

| Principio | Cómo lo cumple HU-03 |
|---|---|
| I. Simplicidad | Una función idempotente para emitir y regenerar; el PDF no se guarda; una tarea horaria en el mismo proceso en lugar de enganchar el webhook de donaciones (R3); sin colas ni reintentos de correo. |
| II. Cero alcance fantasma | Solo FR-001…FR-012 (sin FR-010, eliminado). No hay flujo para completar NIF/NIE, ni rectificativos, ni modelo 182, ni vínculo de cuentas (es de HU-01). |
| III. Verificable | Cada escenario tiene su paso en [quickstart.md](quickstart.md) con datos de [datos-prueba.sql](datos-prueba.sql), `AHORA_SIMULADO` y Mailpit. |
| IV. Español | Importes `80,00 €`, fechas dd/mm/aaaa, año de Madrid con `rangoAnio`; textos de PDF, correo e interfaz en español. |
| V. Seguridad y datos | `requiereRol('donante')` y `donantes.usuario_id = req.usuario.id` en el servicio; rutas `/yo/...` sin identificadores ajenos; la verificación pública solo muestra ejercicio, importe, fecha y NIF/NIE enmascarado; el correo no lleva el PDF ni el NIF/NIE. |
| VI. Nada se borra | No hay `DELETE`. Regenerar actualiza la misma fila, como fijó el clarify (un certificado por Donante y ejercicio). |
| VII–IX. Pila y convenciones | Módulo `certificados-informes` con sus cuatro capas; tabla en plural y `snake_case`, `NUMERIC` (el total anual en `NUMERIC(15,2)` para que la suma no desborde), `creado_en`/`actualizado_en`; API camelCase, importes como texto. |
| X–XII. Colaboración | Las tablas de HU-01 solo se **leen** con SQL propio, sin tocar su repositorio ni su servicio. Los cambios en ficheros comunes se limitan a los huecos reservados para spec-003 y se listan en «Cambios comunes» para acordarlos antes de hacerlos. |

## Project Structure

### Documentation (this feature)

```text
specs/spec-003/
├── spec.md
├── plan.md              ← este fichero
├── research.md
├── data-model.md
├── quickstart.md
├── datos-prueba.sql     ← datos sintéticos para el quickstart
├── contracts/api-certificados.md
├── refinamiento/        ← analyze, converge
└── tasks.md             ← lo crea /speckit-tasks
```

### Source Code (solo lo que añade esta spec)

```text
backend/
├── package.json                                  ← script «certificados» (hueco reservado a spec-003)
└── src/
    ├── servidor.js                               ← + programarCertificados() al arrancar (común)
    ├── app.js                                    ← + api.use(rutasCertificadosInformes) (hueco reservado)
    ├── db/migraciones/008_certificados.sql       ← tabla certificados_fiscales
    └── modulos/certificados-informes/
        ├── rutas.js                              ← 3 rutas
        ├── controlador.js                        ← zod de ejercicio y código; PDF en la respuesta
        ├── servicio.js                           ← reglas (tabla de abajo)
        ├── repositorio.js                        ← SQL propio de lectura de donantes/aportaciones y de certificados_fiscales
        ├── textos.js                             ← código, enmascarado, PDF y correo (funciones puras)
        ├── tarea.js                              ← node-cron horario
        ├── generar.js                            ← orden de consola (npm run certificados)
        ├── textos.test.js                        ← pruebas sin base de datos
        └── certificados.test.js                  ← pruebas con base de datos (TEST_DATABASE_URL)

frontend/src/
├── pages/mis-certificados.astro
├── pages/verificar-certificado.astro
├── components/certificados-informes/MisCertificados.jsx
├── components/certificados-informes/VerificarCertificado.jsx
├── components/certificados-informes/certificados.js       ← mensajes por ejercicio y normalizar código
├── components/certificados-informes/certificados.test.js  ← node --test
└── components/comunes/Menu.jsx                             ← descomentar «Certificados» (hueco reservado)
```

**Structure Decision**: aplicación web de plan-comun §1; todo dentro del módulo
`certificados-informes` y su carpeta de componentes. Fuera de él solo se tocan los huecos ya
reservados para spec-003 (`app.js`, `Menu.jsx`, script de `package.json`), una llamada en
`servidor.js` y la documentación común afectada (ver «Cambios comunes»).

## Reglas de `servicio.js`

| Operación | Reglas | Error |
|---|---|---|
| `reconciliarEjercicio(ejercicio)` | Solo ejercicios cerrados (`ejercicio < anioEnMadrid(ahora())`). En una transacción con bloqueo consultivo por ejercicio: suma por Donante de aportaciones `confirmada` con `fecha_cobro ∈ rangoAnio(ejercicio)`; para cada total > 0 sin certificado, **emite** (código nuevo, fecha de emisión = hoy en Madrid); si existe y el total difiere, **regenera** la misma fila (total, fecha y código nuevos). Si coincide, no hace nada. Tras el commit, un correo por certificado emitido o regenerado (R8); un fallo de correo se registra y no deshace nada. Devuelve `{ emitidos, regenerados, correosFallidos }`. | `EJERCICIO_NO_CERRADO` (409) |
| `reconciliarCerrados()` | Para cada año desde el de la primera `fecha_cobro` confirmada hasta el anterior al actual, `reconciliarEjercicio`. Es lo que lanza la tarea horaria. | — |
| `listarPropios(usuario)` | Donante con `usuario_id = usuario.id`; sus certificados por ejercicio descendente. Sin vínculo, lista vacía y `vinculado: false`. Incluye `ejercicioEnCurso`. | 401 · 403 |
| `pdfPropio(usuario, ejercicio)` | `ejercicio >= ejercicioEnCurso` → 409 con «se generará a partir del 01/01/(ejercicio+1)». Si no hay certificado de ese ejercicio **del Donante vinculado a la cuenta**, 404 (no se distingue «de otro» de «no existe»). Devuelve la definición del PDF (FR-003). | 401 · 403 · 400 · 404 `CERTIFICADO_NO_DISPONIBLE` · 409 `EJERCICIO_NO_CERRADO` |
| `verificar(codigo)` | Código normalizado; si coincide con el `codigo_verificacion` actual, `{ valido: true, ejercicio, importeTotal, fechaEmision, nifNieEnmascarado }`; en cualquier otro caso `{ valido: false }`. Pública. | — |

## Dependencias

- **spec-001 (Nada) — integrada en main (PR #4)**: `donantes` (NIF/NIE obligatorio,
  `usuario_id` del vínculo verificado), `aportaciones` (`estado`, `importe`, `fecha_cobro`) y la
  página `/donar/vincular`, a la que se envía a quien no tiene vínculo. HU-03 no escribe en esas
  tablas ni importa su repositorio (R1).
- **spec-002 (Nada) — aún no en main**: SC-001 (el total del certificado coincide con el total
  anual del historial) solo se puede comprobar cuando exista el historial. Ambos usan la misma
  regla (confirmadas, `fecha_cobro`, `rangoAnio`), así que deben coincidir; queda pendiente de
  verificación (quickstart, SC-001).
- **Servicios comunes**: `fechas.js` (`ahora`, `rangoAnio`, `anioEnMadrid`), `pdf.js`,
  `correo.js`, `config.js` (`ong`, `urlFrontend`). Se usan sin cambios.

## Cambios comunes

Se proponen al grupo y se muestran a Rubén antes de hacerlos (principio XII):

1. `backend/src/app.js`: importar y registrar `rutasCertificadosInformes` en la línea reservada.
2. `backend/src/servidor.js`: llamar a `programarCertificados()` tras arrancar (la tarea no se
   programa en las pruebas, que usan `crearApp`).
3. `frontend/src/components/comunes/Menu.jsx`: descomentar el enlace «Certificados» reservado.
4. `backend/package.json`: el script `certificados` reservado pasa a ejecutar `generar.js`.
5. `specs/plan-comun.md` §4 y §6 y «Preguntas abiertas»: ruta pública de verificación, tarea
   horaria en lugar de solo el 1 de enero, PA3.1/PA3.2 resueltas.
6. `specs/modelo-datos.md`, `backend/src/db/migraciones/LEEME.md` y `backend/src/modulos/LEEME.md`:
   el tratamiento de la regeneración (ya no «pendiente de PA3.1»), el estado de `008` y las rutas del
   módulo.

No se tocan `servicios-comunes/`, las semillas ni las migraciones 004 y 009.

## Complexity Tracking

Sin violaciones de la constitución que justificar.
