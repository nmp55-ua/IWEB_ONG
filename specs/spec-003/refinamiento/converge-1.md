# Converge 1 de spec-003 (HU-03), 08/11/2026

`/speckit-converge` tras `/speckit-implement` (commit `ddb55aa`). Se contrastaron `spec.md`, `plan.md`,
`research.md`, el contrato y `tasks.md` con el código de `certificados-informes`, las páginas y los
cambios comunes, y con el PDF y las respuestas reales obtenidos en [validacion-01.md](validacion-01.md).

**Comprobado**: 11 FR vigentes (FR-010 eliminado), 12 escenarios, 6 casos límite, SC-002 (SC-001
depende de HU-02 y no es trabajo construible ahora), 11 decisiones de research (R1–R11) y los 12
principios de la constitución.

| ID | Gap | Gravedad | Origen | Evidencia | Trabajo |
|---|---|---|---|---|---|
| F1 | partial | LOW | research R7 / FR-011 | `textos.js` `definicionPdf`: la frase y la dirección de verificación van en el mismo bloque y pdfkit parte la URL por `?` («…verificar-certificado?» / «codigo=…»), como se ve en el texto extraído del PDF. Quien la teclee desde el papel puede equivocarse | T025 |

Sin hallazgos de constitución, `missing`, `contradicts` ni `unrequested`. El cambio de una línea en
`donaciones/migraciones.test.js` está aprobado y documentado (T001, validacion-01).

Resultado: **tasks_appended** (1 tarea, fase 7).
