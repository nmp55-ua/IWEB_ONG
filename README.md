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

## Arrancar el proyecto

Requisitos: Node.js 22, Docker Desktop.

```bash
cp .env.example .env          # y rellena SESSION_SECRET y CONTRASENA_SEMILLAS
docker compose up -d          # PostgreSQL (5432) y Mailpit (http://localhost:8025)

cd backend
npm install
npm run migrar                # crea las tablas
npm run semillas              # usuarios y proyectos de prueba
npm run dev                   # API en http://localhost:3000/api

cd ../frontend                # en otra terminal
npm install
npm run dev                   # web en http://localhost:4321
```

Usuarios de prueba (contraseña: la de `CONTRASENA_SEMILLAS`): `donante@ong.test`,
`donante2@ong.test`, `voluntario@ong.test`, `voluntario2@ong.test`, `coordinador@ong.test`,
`admin@ong.test`.

Pruebas del back-end: `cd backend && npm test`.

## Qué incluye la base común (`main`)

- **Back-end:** inicio de sesión y registro (`/api/auth/...`), `requiereRol(...)`, formato
  común de errores (`ErrorApi`), `GET /api/proyectos`, migraciones `001`–`003` (usuarios,
  sesiones, proyectos), semillas y servicios comunes (`fechas`, `importes`, `csv`, `pdf`,
  `correo`, `pasarela` de Stripe). Ver `backend/src/modulos/LEEME.md`.
- **Front-end:** `Layout.astro` con el menú por rol, componentes comunes (`Boton`, `Campo`,
  `Tabla`, `Aviso`, `Modal`, `EstadoVacio`), `lib/api.js`, `lib/formato.js` y las páginas de
  inicio, entrar y crear cuenta.
- Cada spec añade su migración reservada (`backend/src/db/migraciones/LEEME.md`), su módulo,
  sus páginas y sus enlaces del menú (`components/comunes/Menu.jsx`).

Para incorporar la base a tu rama: `git checkout spec-00N` y `git merge main`.

## Documentos

- Constitución: `.specify/memory/constitution.md`
- Convenciones del equipo: `CONVENCIONES.md`
- Plan y modelo de datos comunes: `specs/plan-comun.md`, `specs/modelo-datos.md`
- Especificaciones: `specs/spec-00N/spec.md`
- Narrativa e historias de partida: `docs/`

## Flujo de trabajo

Cada persona trabaja en la rama de cada una de sus specs y repite el ciclo
`specify → clarify → plan → tasks → analyze → implement → converge` hasta resolver la historia.
Los commits empiezan por el identificador de la historia (`HU-05: ...`) y a `main` solo se llega
con la revisión de otra persona.
