# Dossier de refinamiento — SI-13 Donaciones y Voluntariado

> Entregable 7 del enunciado. Reúne y enlaza las evidencias de los apartados 5.1 a 5.4. Las cifras
> salen de los propios documentos del repositorio (generado el 18/11/2026 sobre la rama
> `entrega-documentacion`). Cada responsable debe confirmar las de sus historias.

## 1. Preparación común (§5.1)

- **Herramienta**: GitHub Spec Kit **1.0.4** (`specify init --integration claude --script ps`), con
  los comandos `/speckit-constitution`, `/speckit-specify`, `/speckit-clarify`, `/speckit-plan`,
  `/speckit-tasks`, `/speckit-analyze`, `/speckit-implement` y `/speckit-converge`, ejecutados en
  Claude Code. En esta versión los comandos usan guion (`/speckit-clarify`) en lugar de punto.
- **Commit de referencia común**: `main` tras la base común y el plan compartido (`5e21313`). Cada spec
  parte de su rama `spec-00N`; el commit anterior a su primer clarify es su referencia, y la
  diferencia entre spec anterior y revisada es el propio commit de clarify (`git show <commit> -- specs/spec-00N/spec.md`).
- **Funcionalidad activa**: el script de prerrequisitos de Spec Kit no reconoce ramas `spec-00N` y
  devolvía `spec-001`; por eso cada comando se lanzó indicando la carpeta (`specs/spec-00N`).

## 2. Balance de la iteración (§5.4)

| Spec | Decisiones de clarify | Informes de analyze | Hallazgos por pasada | Informes de converge | Tareas añadidas por converge | Tareas cerradas | Requisitos con prueba | Revisión de la matriz | PR |
|---|---|---|---|---|---|---|---|---|---|
| spec-001 | 8 | 2 | ver informes | 3 | 3 | 84/84 | 23/23 | ✅ Nada y Rubén (PR #4) | #4 ✅ aprobado |
| spec-002 | 2 | 2 | ver informes | 2 | 2 | 37/37 | 11/11 | ✅ Nada y Javi | #6 ✅ aprobado |
| spec-003 | 8 | 2 | ver informes | 2 | 1 | 26/26 | 14/14 | ✅ Rubén y Nada | #5 ✅ aprobado |
| spec-004 | 5 | 2 | ver informes | 2 | 0 | 21/21 | 12/12 | ✅ Rubén y Nicole | #8 ✅ aprobado |
| spec-005 | 4 | 2 | ver informes | 2 | 6 | 28/28 | 13/13 | ✅ Javi y Nicole | #2 ✅ aprobado |
| spec-006 | 4 | 2 | ver informes | 2 | 10 | 26/26 | 8/8 | ✅ Javi y Nada | #3 ✅ aprobado |
| spec-007 | 5 | 3 | 10 → 3 → 0 | 2 | 3 | 29/29 | 14/14 | ✅ Nicole y Javi | #1 ✅ aprobado |
| spec-008 | 5 | 4 | 15 → 7 → 2 → 0 | 3 | 3 | 25/25 | 11/11 | ✅ Nicole y Rubén | #7 ✅ aprobado |
| **Total** | **41** | **19** | — | **18** | **28** | **276/276** | **106/106** | 8/8 completas | 8/8 aprobados |

**Lectura del balance:**

- **Ambigüedades resueltas**: 41 decisiones de clarify, todas incorporadas a su `spec.md`; no queda ninguna pregunta abierta en las especificaciones.
- **Hallazgos documentales**: 19 informes de analyze (incluidos los registros de decisiones de algunas specs). En todas las specs, la última pasada no deja hallazgos críticos ni altos abiertos.
- **Brechas de implementación**: 18 informes de converge, que añadieron 28 tareas de corrección; todas están cerradas y la última pasada de cada spec no deja brechas accionables del código.
- **Criterios verificados**: 106 de 106 requisitos y criterios de éxito tienen una prueba automática o manual enlazada en la matriz. FR-010 de spec-003 se cuenta como «no aplica» porque se eliminó en clarify.
- **Tareas**: 276 de 276 cerradas.
- **Recorridos completos entre historias**: 4 de 4 satisfactorios (R1–R4), uno de ellos con pago real en Stripe de prueba.
- **Regresión**: tras cada integración en `main` se ejecutó la suite completa; las pruebas de donaciones sobre su base aislada (`ong_test_hu01`) y el resto sobre `ong_test`. Regresión final sobre `entrega-documentacion` (19/11/2026): backend 232 + 429 pruebas en verde (3 saltadas, las `it.skip` de HU-07 que dependían de spec-005) y frontend 40 de 40; salidas completas en [regresion/backend.txt](regresion/backend.txt) y [regresion/frontend.txt](regresion/frontend.txt).

Estos indicadores describen la mejora conseguida; no se buscó encontrar más defectos (§5.4).

## 3. Recorridos completos y registro mínimo (§5.4)

- **Recorridos R1–R4**, con precondiciones, datos, pasos, resultado esperado y observado y versión:
  [matriz-trazabilidad.md, «Recorridos completos entre historias»](matriz-trazabilidad.md#recorridos-completos-entre-historias-enunciado-54).
- **Registro mínimo** (historia y criterio, hallazgo, comando, documentos, tarea y commit, prueba,
  responsable, revisor y estado): [matriz-trazabilidad.md, «Registro mínimo»](matriz-trazabilidad.md#registro-mínimo-enunciado-54).
- **Matriz de trazabilidad de las 8 historias**: [matriz-trazabilidad.md](matriz-trazabilidad.md), con la decisión del plan, las tareas y la prueba de cada requisito.
- **Tres situaciones por historia** (§5.1, punto 1): recorrido habitual, entrada inválida o caso límite y permisos o estado de las 8 historias, con su escena del vídeo y su prueba: [situaciones-por-historia.md](situaciones-por-historia.md).
- **Vídeo de la demostración**: [demo/index.html](demo/index.html).

## 4. Revisión entre compañeros (§5.2)

| Spec | Responsable | Revisor | Revisión en la matriz | PR |
|---|---|---|---|---|
| spec-001 | Nada | Rubén | ✅ Nada y Rubén (PR #4) | #4 ✅ aprobado |
| spec-002 | Nada | Javi | ✅ Nada y Javi | #6 ✅ aprobado |
| spec-003 | Rubén | Nada | ✅ Rubén y Nada | #5 ✅ aprobado |
| spec-004 | Rubén | Nicole | ✅ Rubén y Nicole | #8 ✅ aprobado |
| spec-005 | Javi | Nicole | ✅ Javi y Nicole | #2 ✅ aprobado |
| spec-006 | Javi | Nada | ✅ Javi y Nada | #3 ✅ aprobado |
| spec-007 | Nicole | Javi | ✅ Nicole y Javi | #1 ✅ aprobado |
| spec-008 | Nicole | Rubén | ✅ Nicole y Rubén | #7 ✅ aprobado |

Revisiones documentadas con detalle: spec-005 por Nicole (FR-003, FR-004, FR-006 con peticiones
simultáneas, FR-008), spec-006 por Nada ([revision-pr-3.md](../../specs/spec-006/refinamiento/revision-pr-3.md))
spec-007 por Javi (filas de la matriz) y spec-004 por Nicole (pruebas, comprobación en la aplicación y SC-002 cronometrado en la página).

## 5. Evidencias por historia (§5.1–§5.3)

### spec-001 · HU-01 Donación puntual o alta como socio

**Responsable**: Nada · **Revisor**: Rubén · **PR**: #4

- **Decisiones de clarify**: 8, en la sección *Clarifications* de [`spec.md`](../../specs/spec-001/spec.md) y [`clarify-1.md`](../../specs/spec-001/refinamiento/clarify-1.md), [`clarify-2.md`](../../specs/spec-001/refinamiento/clarify-2.md), [`clarify-3.md`](../../specs/spec-001/refinamiento/clarify-3.md), [`registro-hallazgos.md`](../../specs/spec-001/refinamiento/registro-hallazgos.md).
- **Documentos**: [`spec.md`](../../specs/spec-001/spec.md) · [`plan.md`](../../specs/spec-001/plan.md) · [`tasks.md`](../../specs/spec-001/tasks.md) · [`quickstart.md`](../../specs/spec-001/quickstart.md)
- **Evidencias de refinamiento** (28): [`ajuste-flujo-01.md`](../../specs/spec-001/refinamiento/ajuste-flujo-01.md), [`analyze-1.md`](../../specs/spec-001/refinamiento/analyze-1.md), [`analyze-2.md`](../../specs/spec-001/refinamiento/analyze-2.md), [`clarify-1.md`](../../specs/spec-001/refinamiento/clarify-1.md), [`clarify-2.md`](../../specs/spec-001/refinamiento/clarify-2.md), [`clarify-3.md`](../../specs/spec-001/refinamiento/clarify-3.md), [`converge-1.md`](../../specs/spec-001/refinamiento/converge-1.md), [`converge-2.md`](../../specs/spec-001/refinamiento/converge-2.md), [`converge-3.md`](../../specs/spec-001/refinamiento/converge-3.md), [`evidencias-g123`](../../specs/spec-001/refinamiento/evidencias-g123), [`integracion-main-01.md`](../../specs/spec-001/refinamiento/integracion-main-01.md), [`matriz-validacion-01.md`](../../specs/spec-001/refinamiento/matriz-validacion-01.md), [`medicion-puntual-01.md`](../../specs/spec-001/refinamiento/medicion-puntual-01.md), [`medicion-puntual-02.md`](../../specs/spec-001/refinamiento/medicion-puntual-02.md), [`preparacion-stripe-01.md`](../../specs/spec-001/refinamiento/preparacion-stripe-01.md), [`registro-hallazgos.md`](../../specs/spec-001/refinamiento/registro-hallazgos.md), [`resumen-tecnico-hu03-01.md`](../../specs/spec-001/refinamiento/resumen-tecnico-hu03-01.md), [`revision-tecnica-01.md`](../../specs/spec-001/refinamiento/revision-tecnica-01.md), [`validacion-004-01.md`](../../specs/spec-001/refinamiento/validacion-004-01.md), [`validacion-autorizacion-01.md`](../../specs/spec-001/refinamiento/validacion-autorizacion-01.md), [`validacion-converge-01.md`](../../specs/spec-001/refinamiento/validacion-converge-01.md), [`validacion-correo-01.md`](../../specs/spec-001/refinamiento/validacion-correo-01.md), [`validacion-documental-01.md`](../../specs/spec-001/refinamiento/validacion-documental-01.md), [`validacion-local-01.md`](../../specs/spec-001/refinamiento/validacion-local-01.md), [`validacion-local-g1-g3-01.md`](../../specs/spec-001/refinamiento/validacion-local-g1-g3-01.md), [`validacion-normalizacion-01.md`](../../specs/spec-001/refinamiento/validacion-normalizacion-01.md), [`validacion-pasarela-01.md`](../../specs/spec-001/refinamiento/validacion-pasarela-01.md), [`validacion-stripe-01.md`](../../specs/spec-001/refinamiento/validacion-stripe-01.md)

### spec-002 · HU-02 Historial de aportaciones

**Responsable**: Nada · **Revisor**: Javi · **PR**: #6

- **Decisiones de clarify**: 2, en la sección *Clarifications* de [`spec.md`](../../specs/spec-002/spec.md) y [`clarify-1.md`](../../specs/spec-002/refinamiento/clarify-1.md).
- **Documentos**: [`spec.md`](../../specs/spec-002/spec.md) · [`plan.md`](../../specs/spec-002/plan.md) · [`tasks.md`](../../specs/spec-002/tasks.md) · [`quickstart.md`](../../specs/spec-002/quickstart.md)
- **Evidencias de refinamiento** (19): [`analyze-1.md`](../../specs/spec-002/refinamiento/analyze-1.md), [`analyze-2.md`](../../specs/spec-002/refinamiento/analyze-2.md), [`cierre-t030-01.md`](../../specs/spec-002/refinamiento/cierre-t030-01.md), [`clarify-1.md`](../../specs/spec-002/refinamiento/clarify-1.md), [`converge-1.md`](../../specs/spec-002/refinamiento/converge-1.md), [`converge-2.md`](../../specs/spec-002/refinamiento/converge-2.md), [`diagnostico-rendimiento-01.md`](../../specs/spec-002/refinamiento/diagnostico-rendimiento-01.md), [`diagnostico-rendimiento-02.md`](../../specs/spec-002/refinamiento/diagnostico-rendimiento-02.md), [`evidencias-converge-01`](../../specs/spec-002/refinamiento/evidencias-converge-01), [`evidencias-finales-01`](../../specs/spec-002/refinamiento/evidencias-finales-01), [`evidencias-interfaz-01`](../../specs/spec-002/refinamiento/evidencias-interfaz-01), [`evidencias-medicion-01`](../../specs/spec-002/refinamiento/evidencias-medicion-01), [`matriz-validacion-01.md`](../../specs/spec-002/refinamiento/matriz-validacion-01.md), [`medicion-historial-01.md`](../../specs/spec-002/refinamiento/medicion-historial-01.md), [`revision-tecnica-01.md`](../../specs/spec-002/refinamiento/revision-tecnica-01.md), [`validacion-converge-01.md`](../../specs/spec-002/refinamiento/validacion-converge-01.md), [`validacion-fiscal-01.md`](../../specs/spec-002/refinamiento/validacion-fiscal-01.md), [`validacion-interfaz-01.md`](../../specs/spec-002/refinamiento/validacion-interfaz-01.md), [`validacion-local-01.md`](../../specs/spec-002/refinamiento/validacion-local-01.md)

### spec-003 · HU-03 Certificado fiscal anual

**Responsable**: Rubén · **Revisor**: Nada · **PR**: #5

- **Decisiones de clarify**: 8, en la sección *Clarifications* de [`spec.md`](../../specs/spec-003/spec.md) y, con su justificación, en [`registro-decisiones-y-hallazgos.md`](../../specs/spec-003/refinamiento/registro-decisiones-y-hallazgos.md).
- **Documentos**: [`spec.md`](../../specs/spec-003/spec.md) · [`plan.md`](../../specs/spec-003/plan.md) · [`tasks.md`](../../specs/spec-003/tasks.md) · [`quickstart.md`](../../specs/spec-003/quickstart.md)
- **Evidencias de refinamiento** (6): [`analyze-1.md`](../../specs/spec-003/refinamiento/analyze-1.md), [`registro-decisiones-y-hallazgos.md`](../../specs/spec-003/refinamiento/registro-decisiones-y-hallazgos.md), [`analyze-2.md`](../../specs/spec-003/refinamiento/analyze-2.md), [`converge-1.md`](../../specs/spec-003/refinamiento/converge-1.md), [`converge-2.md`](../../specs/spec-003/refinamiento/converge-2.md), [`validacion-01.md`](../../specs/spec-003/refinamiento/validacion-01.md)

### spec-004 · HU-04 Informes para la junta

**Responsable**: Rubén · **Revisor**: Nicole · **PR**: #8

- **Decisiones de clarify**: 5, en la sección *Clarifications* de [`spec.md`](../../specs/spec-004/spec.md) y, con su justificación, en [`registro-decisiones-y-hallazgos.md`](../../specs/spec-004/refinamiento/registro-decisiones-y-hallazgos.md).
- **Documentos**: [`spec.md`](../../specs/spec-004/spec.md) · [`plan.md`](../../specs/spec-004/plan.md) · [`tasks.md`](../../specs/spec-004/tasks.md) · [`quickstart.md`](../../specs/spec-004/quickstart.md)
- **Evidencias de refinamiento** (7): [`analyze-1.md`](../../specs/spec-004/refinamiento/analyze-1.md), [`registro-decisiones-y-hallazgos.md`](../../specs/spec-004/refinamiento/registro-decisiones-y-hallazgos.md), [`analyze-2.md`](../../specs/spec-004/refinamiento/analyze-2.md), [`converge-1.md`](../../specs/spec-004/refinamiento/converge-1.md), [`converge-2.md`](../../specs/spec-004/refinamiento/converge-2.md), [`validacion-01.md`](../../specs/spec-004/refinamiento/validacion-01.md), [`validacion-02.md`](../../specs/spec-004/refinamiento/validacion-02.md)

### spec-005 · HU-05 Consulta e inscripción en actividades

**Responsable**: Javi · **Revisor**: Nicole · **PR**: #2

- **Decisiones de clarify**: 4, en la sección *Clarifications* de [`spec.md`](../../specs/spec-005/spec.md) y [`clarify-1.md`](../../specs/spec-005/refinamiento/clarify-1.md).
- **Documentos**: [`spec.md`](../../specs/spec-005/spec.md) · [`plan.md`](../../specs/spec-005/plan.md) · [`tasks.md`](../../specs/spec-005/tasks.md) · [`quickstart.md`](../../specs/spec-005/quickstart.md)
- **Evidencias de refinamiento** (6): [`analyze-1.md`](../../specs/spec-005/refinamiento/analyze-1.md), [`analyze-2.md`](../../specs/spec-005/refinamiento/analyze-2.md), [`clarify-1.md`](../../specs/spec-005/refinamiento/clarify-1.md), [`converge-1.md`](../../specs/spec-005/refinamiento/converge-1.md), [`converge-2.md`](../../specs/spec-005/refinamiento/converge-2.md), [`prueba-manual.md`](../../specs/spec-005/refinamiento/prueba-manual.md)

### spec-006 · HU-06 Calendario del voluntario

**Responsable**: Javi · **Revisor**: Nada · **PR**: #3

- **Decisiones de clarify**: 4, en la sección *Clarifications* de [`spec.md`](../../specs/spec-006/spec.md) y [`clarify-1.md`](../../specs/spec-006/refinamiento/clarify-1.md).
- **Documentos**: [`spec.md`](../../specs/spec-006/spec.md) · [`plan.md`](../../specs/spec-006/plan.md) · [`tasks.md`](../../specs/spec-006/tasks.md) · [`quickstart.md`](../../specs/spec-006/quickstart.md)
- **Evidencias de refinamiento** (7): [`analyze-1.md`](../../specs/spec-006/refinamiento/analyze-1.md), [`analyze-2.md`](../../specs/spec-006/refinamiento/analyze-2.md), [`clarify-1.md`](../../specs/spec-006/refinamiento/clarify-1.md), [`converge-1.md`](../../specs/spec-006/refinamiento/converge-1.md), [`converge-2.md`](../../specs/spec-006/refinamiento/converge-2.md), [`prueba-manual.md`](../../specs/spec-006/refinamiento/prueba-manual.md), [`revision-pr-3.md`](../../specs/spec-006/refinamiento/revision-pr-3.md)

### spec-007 · HU-07 Gestión de actividades y lista de espera

**Responsable**: Nicole · **Revisor**: Javi · **PR**: #1

- **Decisiones de clarify**: 5, en la sección *Clarifications* de [`spec.md`](../../specs/spec-007/spec.md) y [`registro-decisiones-y-hallazgos.md`](../../specs/spec-007/refinamiento/registro-decisiones-y-hallazgos.md).
- **Documentos**: [`spec.md`](../../specs/spec-007/spec.md) · [`plan.md`](../../specs/spec-007/plan.md) · [`tasks.md`](../../specs/spec-007/tasks.md) · [`quickstart.md`](../../specs/spec-007/quickstart.md)
- **Evidencias de refinamiento** (7): [`analyze-1.md`](../../specs/spec-007/refinamiento/analyze-1.md), [`analyze-2.md`](../../specs/spec-007/refinamiento/analyze-2.md), [`analyze-3.md`](../../specs/spec-007/refinamiento/analyze-3.md), [`converge-1.md`](../../specs/spec-007/refinamiento/converge-1.md), [`converge-2.md`](../../specs/spec-007/refinamiento/converge-2.md), [`prueba-manual-T026.md`](../../specs/spec-007/refinamiento/prueba-manual-T026.md), [`registro-decisiones-y-hallazgos.md`](../../specs/spec-007/refinamiento/registro-decisiones-y-hallazgos.md)

### spec-008 · HU-08 Asistencia y horas de voluntariado

**Responsable**: Nicole · **Revisor**: Rubén · **PR**: #7

- **Decisiones de clarify**: 5, en la sección *Clarifications* de [`spec.md`](../../specs/spec-008/spec.md) y [`registro-decisiones-y-hallazgos.md`](../../specs/spec-008/refinamiento/registro-decisiones-y-hallazgos.md).
- **Documentos**: [`spec.md`](../../specs/spec-008/spec.md) · [`plan.md`](../../specs/spec-008/plan.md) · [`tasks.md`](../../specs/spec-008/tasks.md) · [`quickstart.md`](../../specs/spec-008/quickstart.md)
- **Evidencias de refinamiento** (8): [`analyze-1.md`](../../specs/spec-008/refinamiento/analyze-1.md), [`analyze-2.md`](../../specs/spec-008/refinamiento/analyze-2.md), [`analyze-3.md`](../../specs/spec-008/refinamiento/analyze-3.md), [`analyze-4.md`](../../specs/spec-008/refinamiento/analyze-4.md), [`converge-1.md`](../../specs/spec-008/refinamiento/converge-1.md), [`converge-2.md`](../../specs/spec-008/refinamiento/converge-2.md), [`converge-3.md`](../../specs/spec-008/refinamiento/converge-3.md), [`registro-decisiones-y-hallazgos.md`](../../specs/spec-008/refinamiento/registro-decisiones-y-hallazgos.md)

