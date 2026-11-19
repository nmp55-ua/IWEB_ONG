# Propuesta de reparto de la entrega final

> **Borrador para acordar en grupo.** Basado en los entregables del enunciado (§6) y en el ejemplo
> `SI-01-ejemplo-4-memoria-final.pdf`. Cambiad lo que haga falta.

## Estado de partida (17/11/2026)

- Las 8 historias están en `main` (PR #1 a #8) y cada spec tiene sus informes de clarify, analyze y
  converge en `specs/spec-00N/refinamiento/`.
- Pendientes de trazabilidad:
  - **Rubén**: dejar revisión registrada en el **PR #4** (spec-001, Nada) y en el **PR #7** (spec-008, Nicole).
  - **Nada**: pulsar «Approve» en el **PR #3** (spec-006, Javi) o dejar un comentario de visto bueno.
  - **Javi**: cerrar **T021** de spec-005 (visto bueno de Nicole a `bloquearActividad`, ya dado) y
    **T013** de spec-006 (aviso de las actividades de prueba de «Agua potable»).
- ✅ Hecho (19/11/2026): los mensajes por defecto de zod se traducen una sola vez en
  `backend/src/middleware/errores.js` (`z.setErrorMap`), con su prueba en `errores.test.js`; los
  mensajes propios de cada esquema siguen teniendo prioridad y ninguna API devuelve textos en inglés.

## 1. Memoria final (entregable 5)

| Apartado | Contenido | Responsable propuesto |
|---|---|---|
| 1. Sistema construido | Qué hace la aplicación, actores y las 8 historias en una página | Nada |
| 2. Arquitectura | Pila, estructura de carpetas, modelo de datos común, API y errores, seguridad (sesiones, roles, pasarela) | Rubén |
| 3. Metodología SDD | Constitución, specify conjunto, plan común, ramas por spec, PR con revisión cruzada | Javi |
| 4. Iteraciones de loop engineering | 2–3 ejemplos por persona de vuestras specs (qué detectó analyze/converge y qué cambió) | Cada uno lo suyo |
| 5. Integración entre historias | Contratos entre módulos (inscripciones ↔ actividades), conflictos de merge y cómo se resolvieron | Nicole |
| 6. Reparto y responsabilidades | Tabla del README + commits y PR de cada uno | Javi |
| 7. Balance y lecciones | Qué funcionó, qué no, qué haríais distinto | Todos (un párrafo cada uno) |

**Ejemplos de Nicole para el apartado 4** (spec-007 y spec-008):
- Promoción de la lista de espera acordada con spec-005 tras `analyze-1` (H1, H2): de «comprobar con Javi» a un contrato con valor de retorno y un único correo `avisarPlazaConfirmada`.
- Migración 007 con clave foránea condicional descartada en el plan: se pidió adelantar la 006 de Javi.
- `converge-1` de spec-008 detectó que `asistencias` no tenía `creado_en`/`actualizado_en`: el error venía de `modelo-datos.md` y se corrigió en ambos sitios.

## 2. Dossier de refinamiento (entregable 7)

| Parte | Fuente | Responsable |
|---|---|---|
| Decisiones de clarify | `refinamiento/clarify-*.md` o sección Clarifications de cada `spec.md` | Cada uno lo suyo |
| Informes de analyze (inicial y final) y registro de hallazgos | `refinamiento/analyze-*.md` | Cada uno lo suyo |
| Matriz de trazabilidad de las 8 historias | [`matriz-trazabilidad.md`](matriz-trazabilidad.md): completar las celdas «⚠ completar» de tus filas y revisar las de tu compañero | Cada responsable + su revisor |
| Informes y tareas de converge | `refinamiento/converge-*.md` | Cada uno lo suyo |
| Pruebas del antes y el después | Pruebas manuales y commits de corrección | Cada uno lo suyo |
| Recorridos completos entre historias (R1–R4) | Sección «Recorridos» de la matriz | R1 y R2: Nicole y Javi · R3: Nada y Rubén · R4: Nada |
| Balance de la iteración (§5.4) | Ambigüedades resueltas, hallazgos abiertos/cerrados, criterios verificados sobre el total | Rubén (recopila) |
| Registro mínimo (§5.4) | Tabla al final de la matriz; cada uno añade sus filas | Cada uno lo suyo |

## 3. Demostración (entregable 6)

Orden propuesto, siguiendo el recorrido de los datos:

1. **Nada** — HU-01 donar (con sus claves de prueba de Stripe y el listener) y HU-02 historial.
2. **Rubén** — HU-03 certificado del ejercicio y HU-04 informe para la junta (CSV y PDF).
3. **Nicole** — HU-07 crear, publicar y cancelar actividades, lista de espera; HU-08 pasar lista y `/mis-horas`.
4. **Javi** — HU-05 inscribirse y lista de espera; HU-06 calendario.

Preparación común: `docker compose up -d`, `npm run migrar`, `npm run semillas` en el ordenador de
la demo; comprobar Mailpit (http://localhost:8025) para enseñar los correos.

## 4. Calendario propuesto

| Cuándo | Qué |
|---|---|
| Esta semana | Pendientes de trazabilidad (PR #3, #4, #7, T021, T013) y matriz completada por cada uno |
| Siguiente | Borradores de los apartados de la memoria y recorridos R1–R4 ejecutados |
| Antes de la entrega | Revisión cruzada de la memoria, ensayo de la demo y PDF final |
