# IWEB_ONG — Gestión de Donaciones y Voluntariado para una ONG

Práctica de Ingeniería Web (Spec-Driven Development, Parte I). Sistema de Información 13.

**Pila:** Astro + React (islas) · Node.js/Express · PostgreSQL · Tailwind CSS

## Reparto de specs

| Spec / rama | Historia | Responsable | Revisor |
|---|---|---|---|
| `spec-001` | HU-01 Donación puntual o alta como socio | Nada | Rubén |
| `spec-002` | HU-02 Historial de aportaciones | Nada | Javi |
| `spec-003` | HU-03 Certificado fiscal anual | Rubén | Nada |
| `spec-004` | HU-04 Informes para la junta | Rubén | Nicole |
| `spec-005` | HU-05 Consulta e inscripción en actividades | Javi | Nicole |
| `spec-006` | HU-06 Calendario del voluntario | Javi | Nada |
| `spec-007` | HU-07 Gestión de actividades y lista de espera | Nicole | Javi |
| `spec-008` | HU-08 Asistencia y horas de voluntariado | Nicole | Rubén |

## Documentos

- Constitución: `.specify/memory/constitution.md`
- Convenciones del equipo: `CONVENCIONES.md`
- Especificaciones: `specs/spec-00N/spec.md`
- Narrativa e historias de partida: `docs/`

## Flujo de trabajo

Cada persona trabaja en la rama de cada una de sus specs y repite el ciclo
`specify → clarify → plan → tasks → analyze → implement → converge` hasta resolver la historia.
Los commits empiezan por el identificador de la historia (`HU-05: ...`) y a `main` solo se llega
con la revisión de otra persona.
