# Research: HU-03 — Certificado fiscal anual de donaciones

Las decisiones técnicas generales están en [plan-comun.md](../plan-comun.md#decisiones-técnicas-research)
y las de donaciones en el [research de HU-01](../spec-001/research.md). Aquí solo las propias de
HU-03. Las clarificaciones de 2026-11-08 (NIF/NIE obligatorio, confirmación tardía, vínculo
verificado) se dan por cerradas.

## R1. Lectura de los datos de HU-01 con SQL propio

- **Decision**: `certificados-informes/repositorio.js` lee `donantes` y `aportaciones` con sus
  propias consultas de solo lectura. La suma es
  `SUM(importe) WHERE estado = 'confirmada' AND fecha_cobro >= $desde AND fecha_cobro < $hasta`,
  con `{ desde, hasta } = rangoAnio(ejercicio)` de `servicios-comunes/fechas.js`, pasados como
  instantes. El total se compara con el guardado en SQL (`NUMERIC`) y se transporta como texto.
- **Rationale**: es exactamente el contrato del [resumen técnico de HU-01](../spec-001/refinamiento/resumen-tecnico-hu03-01.md)
  («solo `estado='confirmada'`, por `donante_id` y `fecha_cobro`», rango semiabierto de Madrid, sin
  truncar en UTC) y lo que plan-comun §7 acuerda: «`certificados-informes` solo **lee** tablas de
  otros módulos». No se importa el repositorio de donaciones y no hace falta ninguna función nueva en
  el servicio de Nada. La consulta usa el índice `(donante_id, estado, fecha_cobro)` de 004.
- **Alternatives considered**: llamar al servicio de donaciones (no expone una suma anual; habría
  que añadirla en su módulo); `EXTRACT(YEAR FROM fecha_cobro AT TIME ZONE 'Europe/Madrid')` (correcto,
  pero duplica la regla de `fechas.js` que el resumen pide usar).

## R2. Una sola función para emitir y regenerar: `reconciliarEjercicio`

- **Decision**: para un ejercicio cerrado, en una transacción con
  `pg_advisory_xact_lock(hashtext('hu03:certificados'), ejercicio)`, se obtienen en una consulta los
  Donantes cuyo total > 0 no tiene certificado o difiere del guardado. Para cada uno se hace
  `INSERT … ON CONFLICT (donante_id, ejercicio) DO UPDATE SET importe_total, fecha_emision,
  codigo_verificacion, actualizado_en = now()`. Tras el commit se envían los correos.
- **Rationale**: FR-001 (emisión el 1 de enero) y FR-008 (confirmación tardía: regenerar o emitir)
  son el mismo cálculo: «el certificado debe reflejar el total actual». Es idempotente: si nada ha
  cambiado no escribe ni envía correo. El bloqueo consultivo serializa la tarea horaria y una
  ejecución manual simultánea, así que nunca se escribe un total antiguo encima de uno nuevo ni se
  envían dos correos por el mismo cambio. Los correos van fuera de la transacción (plan-comun §6: un
  fallo de correo no deshace la operación).
- **Totales que bajan o llegan a cero**: HU-01 no corrige ni anula confirmadas, así que no ocurre
  (spec, clarify 2026-11-08). Si el total pasara a 0, la consulta no lo devuelve (solo totales > 0) y
  el certificado no se toca; no se inventa una anulación (principio II).
- **Alternatives considered**: tabla de «certificados pendientes» o cola (más piezas); comparar
  `actualizado_en` de las aportaciones (no hace falta: comparar totales es exacto y más simple).

## R3. Cuándo se ejecuta: tarea horaria en el mismo proceso y orden de consola

- **Decision**: `tarea.js` programa con `node-cron` `'5 * * * *'` en `Europe/Madrid` la llamada a
  `reconciliarCerrados()`. La primera ejecución del año es el 1 de enero a las 00:05 (FR-001,
  SC-002); las siguientes recogen en menos de una hora cualquier confirmación tardía (FR-008) y
  también lo que no se hizo si el servidor estaba parado. `servidor.js` la programa al arrancar;
  `crearApp` (lo que usan las pruebas) no. `npm run certificados -- --ejercicio 2025` lanza la misma
  función para un ejercicio y sin argumento para todos los cerrados.
- **Rationale**: plan-comun §6 ya fija `node-cron` dentro del back-end y la orden manual. Para la
  confirmación tardía, la alternativa sería que el servicio de donaciones avisara a HU-03 al confirmar,
  lo que obliga a cambiar el código de HU-01 (Nada) y acopla los dos módulos. Comparar totales cada
  hora es una consulta agregada barata y no necesita nada de HU-01. Se cambia la frase de plan-comun
  §6 («cada 1 de enero a las 00:05») con acuerdo del grupo.
- **Alternatives considered**: solo el 1 de enero (no cumple FR-008); llamada desde el webhook de
  donaciones (cambia HU-01); cada minuto (innecesario para un documento anual).

## R4. Código de verificación

- **Decision**: 16 caracteres del alfabeto Crockford base32 (sin I, L, O, U) generados con
  `crypto.randomInt`, en grupos `XXXX-XXXX-XXXX-XXXX` (80 bits). `UNIQUE` en la tabla; si por azar
  choca, se genera otro (un reintento). Al verificar se normaliza la entrada: mayúsculas y sin
  espacios ni guiones, y se vuelve a agrupar.
- **Rationale**: no se puede adivinar ni recorrer (la página es pública y sin límite de intentos),
  se puede dictar o teclear desde el papel y no revela el Donante ni el ejercicio. Regenerar crea
  otro, con lo que el anterior deja de coincidir y aparece como «no válido» (FR-008, FR-011).
- **Alternatives considered**: UUID (largo para teclear); `CF-2025-<id>` (predecible).

## R5. NIF/NIE enmascarado en la verificación

- **Decision**: siempre `***` + los 4 últimos dígitos + `*`: `12344567Z → ***4567*`,
  `X1234567L → ***4567*`.
- **Rationale**: es literalmente el ejemplo del escenario 10 (`***4567*`) y cumple FR-011 («solo los
  4 últimos dígitos visibles»): la letra de control y los primeros dígitos quedan ocultos y la
  longitud fija no distingue un DNI de un NIE.
- **Alternatives considered**: conservar la longitud (`*****4567*`), que no coincide con el ejemplo.

## R6. Fecha de emisión

- **Decision**: `fecha_emision` (`DATE`) es el día de Madrid de `ahora()` al emitir o regenerar; se
  lee con `to_char(…, 'YYYY-MM-DD')` y se muestra con `formatearFecha` (interfaz) o dd/mm/aaaa (PDF).
- **Rationale**: modelo-datos ya fija `DATE`; leerla como texto evita que `pg` la convierta a medianoche
  UTC. `ahora()` admite `AHORA_SIMULADO` para probar el 1 de enero.

## R7. PDF generado al descargar

- **Decision**: `GET /api/yo/certificados/:ejercicio/pdf` construye la definición con los datos
  guardados del certificado y los actuales del Donante y la pasa a `generarPdf` común (encabezado con
  nombre y CIF de la ONG). Bloques: título «Certificado de donaciones — Ejercicio 2025», texto de la
  ONG (nombre y CIF), del Donante (nombre, apellidos, NIF/NIE), tabla con ejercicio, importe total y
  fecha de emisión, el código y la dirección de verificación `${FRONTEND_URL}/verificar-certificado?codigo=…`.
  `Content-Disposition: attachment; filename="certificado-2025.pdf"`.
- **Rationale**: modelo-datos («el PDF no se guarda: se genera al descargar con estos datos, así que
  siempre sale igual»). Los datos del Donante no cambian en HU-01 v1, así que dos descargas tienen el
  mismo código y los mismos datos (caso límite).

## R8. Correo de aviso

- **Decision**: `enviarCorreo` común a `donantes.correo`, después del commit. Asunto «Tu certificado
  fiscal de 2025 está disponible» (o «… se ha actualizado» al regenerar). Texto: saludo con el nombre,
  ejercicio, importe, enlace a `${FRONTEND_URL}/mis-certificados`; al regenerar, que el código anterior
  deja de ser válido. Si el Donante no tiene `usuario_id`, se añade la invitación a crear una cuenta de
  donante (o entrar con la suya) y vincularla desde `${FRONTEND_URL}/donar/vincular`. Sin PDF adjunto
  y sin NIF/NIE. Si `enviarCorreo` devuelve `false`, el propio servicio común ya registra el error; la
  función lo cuenta en `correosFallidos` y no reintenta.
- **Rationale**: FR-009 y escenario 12. No hay reintento en la spec (principio II); el certificado
  sigue disponible en el área personal.

## R9. Acceso del donante y casos sin certificado

- **Decision**: rutas `/api/yo/certificados…` con `requiereRol('donante')`; el servicio busca el
  Donante por `usuario_id = req.usuario.id`. Sin vínculo: lista vacía con `vinculado: false`, y la
  página muestra el enlace a `/donar/vincular`. El listado incluye `ejercicioEnCurso`
  (`anioEnMadrid(ahora())`) para que la página explique, para el ejercicio elegido, si el certificado
  se generará a partir del 01/01 siguiente (escenario 5) o si no hay aportaciones (escenario 4). El PDF
  de un ejercicio sin certificado propio da 404, igual que si fuera de otro (plan-comun §3).
- **Rationale**: FR-007, FR-012 y el resumen de HU-01 («la coincidencia de correo no concede acceso»;
  el permiso invitado de ocho horas no autoriza certificados). La ruta no lleva identificadores de
  Donante ni de certificado, así que no hay forma de pedir el de otro (escenario 7).

## R10. Verificación pública

- **Decision**: `GET /api/certificados/verificacion?codigo=…`, sin sesión. Siempre 200: `{ valido:
  true, … }` o `{ valido: false }`, también para entradas vacías o mal formadas. Página
  `/verificar-certificado` con un campo y, si la URL trae `?codigo=`, lo comprueba al abrir.
- **Rationale**: FR-011 («cualquier otro código se muestra como no válido sin datos»): no se distinguen
  formato erróneo, inexistente o antiguo. 80 bits de código hacen inútil probar códigos.

## R11. Pruebas

- **Decision**: `textos.test.js` (sin base de datos: código, enmascarado, textos del correo, definición
  del PDF) y `certificados.test.js` (Vitest + Supertest contra `TEST_DATABASE_URL`, se salta si no
  está): escenarios 1–12, casos límite de fechas y estados, permisos 401/403/404 e idempotencia.
  El correo se simula con `vi.mock` y `ahora` se inyecta en el servicio para mover el «hoy» entre
  pruebas. En el frontend, `certificados.test.js` con `node --test` para los mensajes por ejercicio y
  la normalización del código.
- **Rationale**: plan-comun §8 y el patrón de `voluntariado/calendario.test.js`.
