# Research: HU-07 — Gestión de actividades

Las decisiones técnicas generales están en [plan-comun.md](../plan-comun.md#decisiones-técnicas-research).
Aquí solo las propias de HU-07.

## R1. Una sola ruta `PATCH` para editar, publicar y cancelar

- **Decision**: `PATCH /api/actividades/:id` con `{ accion: 'publicar' | 'cancelar' }` para los
  cambios de estado, o con los campos a editar (sin `accion`). Es lo que fija plan-comun §4.
- **Rationale**: respeta la tabla de rutas común; una acción por petición evita mezclar
  edición y cambio de estado.
- **Alternatives considered**: rutas `POST /:id/publicar` y `/:id/cancelar` (más rutas que
  las acordadas).

## R2. Cómo se impide bajar plazas por debajo de los confirmados (FR-007, SC-003)

- **Decision**: dentro de la transacción, bloquear la actividad (`FOR UPDATE`), contar las
  inscripciones confirmadas y comparar. La inscripción de spec-005 bloquea la misma fila, así que
  ambas operaciones se serializan.
- **Rationale**: es el mismo bloqueo que plan-comun usa para el aforo; no hace falta trigger.
- **Alternatives considered**: `CHECK` o trigger en BD (cruza tablas de dos dueños).

## R3. Acceso a `inscripciones` (dueño: spec-005)

- **Decision**: `actividades` nunca consulta `inscripciones` con SQL propio; usa el servicio de
  voluntariado. A los dos contratos de plan-comun §7 se suman `contarConfirmadas(actividadId,
  cliente)` (para FR-007 y `plazasLibres`) y `listarInscripcionesDeActividad(actividadId)`
  (FR-009 y avisos de FR-008/FR-011), que devuelve `{ confirmadas: [...], enEspera: [...] }` con
  nombre, correo y posición. Las funciones que escriben reciben el `cliente` de la transacción.
- **Rationale**: plan-comun §1 («un módulo puede llamar al servicio de otro, nunca a su
  repositorio»).
- **Acordado con Javi**: las dos funciones nuevas.
- **Alternatives considered**: leer `inscripciones` desde el repositorio de actividades
  (rompe la propiedad de la tabla).

## R4. Promoción de la lista de espera (FR-006, PA7.2)

- **Decision**: al subir plazas, `promoverListaEspera` confirma a tantas personas en espera como
  plazas libres haya, por `fecha_inscripcion`, sin plazo ni estado intermedio. Cuando quien
  cancela es un voluntario, lo dispara spec-005 desde su propio flujo.
- **Rationale**: decisión PA7.2; coherente con SC-002.

## R5. Correo de cambio de fecha, hora o lugar (FR-011)

- **Decision**: nuevo correo de texto con `enviarCorreo`, enviado tras el `COMMIT` a confirmados
  y en espera. Se añade a la lista de correos de plan-comun §6 con aviso al grupo (principio XII).
- **Alternatives considered**: no avisar (descartada en clarify, pregunta 3).

## R6. Rutas `/api/actividades/:id` frente a `/api/actividades/disponibles`

- **Decision**: en `rutas.js`, `:id` solo acepta dígitos (`/actividades/:id(\\d+)`), así que
  `disponibles` (spec-005) nunca choca, sea cual sea el orden de registro.

## R7. «Celebrada» y validación de fechas

- **Decision**: celebrada = `estado = 'publicada' AND inicio <= ahora()` (modelo-datos). Para un
  borrador con inicio pasado: no se puede publicar, pero sí editarlo (poniéndole fechas futuras)
  o cancelarlo. Las validaciones de fecha se hacen en `servicio.js` con `ahora()`, no con un
  `CHECK` en BD (`now()` no es inmutable y rompería las pruebas con `AHORA_SIMULADO`).
