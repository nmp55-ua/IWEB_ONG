# IWEB_ONG — Gestión de Donaciones y Voluntariado para una ONG

Práctica de Ingeniería Web (Spec-Driven Development, Parte I). Sistema de Información 13.

**Pila:** Astro + React (islas) · Node.js/Express · PostgreSQL · Tailwind CSS

## Reparto de specs

| Spec / rama | Historia                                       | Responsable | Revisor |
| ----------- | ---------------------------------------------- | ----------- | ------- |
| `spec-001`  | HU-01 Donación puntual o alta como socio       | Nada        | Rubén   |
| `spec-002`  | HU-02 Historial de aportaciones                | Nada        | Javi    |
| `spec-003`  | HU-03 Certificado fiscal anual                 | Rubén       | Nada    |
| `spec-004`  | HU-04 Informes para la junta                   | Rubén       | Nicole  |
| `spec-005`  | HU-05 Consulta e inscripción en actividades    | Javi        | Nicole  |
| `spec-006`  | HU-06 Calendario del voluntario                | Javi        | Nada    |
| `spec-007`  | HU-07 Gestión de actividades y lista de espera | Nicole      | Javi    |
| `spec-008`  | HU-08 Asistencia y horas de voluntariado       | Nicole      | Rubén   |

## Arrancar el proyecto

Requisitos: Node.js 22, Docker Desktop.

Desde la raíz del repositorio, en PowerShell:

```powershell
if (-not (Test-Path -LiteralPath '.env')) { Copy-Item .env.example .env }
```

Completar `SESSION_SECRET` y `CONTRASENA_SEMILLAS` sin publicar sus valores. Conservar
cualquier `.env` existente. `DB_PORT` y el puerto de `DATABASE_URL` deben coincidir:
el valor de plantilla es 5432; puede seleccionarse otro puerto libre, como 5440.

```powershell
# Raíz del repositorio: PostgreSQL y Mailpit (bandeja http://localhost:8025).
docker compose up -d

# Primera terminal, desde la raíz.
Set-Location backend
npm ci
npm run migrar
npm run semillas
npm run dev
```

El migrador aplica todos los SQL pendientes presentes en esta rama, incluida la
migración 009 de HU-01, sobre `DATABASE_URL`. Revisar el destino antes de
ejecutarlo. Las semillas son sintéticas: no cobran ni sus estados de correo acreditan
recepción. Para el frontend, en otra terminal desde la raíz:

```powershell
Set-Location frontend
npm ci
npm run dev
```

API en `http://localhost:3000/api`; web en `http://localhost:4321`. El proxy de desarrollo
del frontend apunta al backend en 3000. `FRONTEND_URL` debe coincidir con el origen
del navegador para retorno de Checkout y comprobación de origen/CSRF.

Usuarios de prueba (contraseña: la de `CONTRASENA_SEMILLAS`): `donante@ong.test`,
`donante2@ong.test`, `voluntario@ong.test`, `voluntario2@ong.test`, `coordinador@ong.test`,
`admin@ong.test`.

Las pruebas de HU-01 necesitan `DATABASE_URL` y `TEST_DATABASE_URL` apuntando ambas a la
base exclusiva `ong_test_hu01`, con los esquemas aislados del soporte de pruebas.
Preparación y comandos completos en [quickstart de HU-01](specs/spec-001/quickstart.md).
No ejecutar indiscriminadamente toda la suite contra esa base: las pruebas de actividades
vacían tablas y la regresión común requiere su base separada, según esa guía.

## Base común

- **Back-end:** inicio de sesión y registro (`/api/auth/...`), `requiereRol(...)`, formato
  común de errores (`ErrorApi`), `GET /api/proyectos`, migraciones `001`–`003` (usuarios,
  sesiones, proyectos), semillas y servicios comunes (`fechas`, `importes`, `csv`, `pdf`,
  `correo`, `pasarela` de Stripe). Ver `backend/src/modulos/LEEME.md`.
- **Front-end:** `Layout.astro` con el menú por rol, componentes comunes (`Boton`, `Campo`,
  `Tabla`, `Aviso`, `Modal`, `EstadoVacio`), `lib/api.js`, `lib/formato.js` y las páginas de
  inicio, entrar y crear cuenta.
- Cada spec añade su migración de dominio (`backend/src/db/migraciones/LEEME.md`), su módulo,
  sus páginas y sus enlaces del menú (`components/comunes/Menu.jsx`).

## HU-01 — Donaciones y altas de socio

- `/donar`: puntual o socio mensual, trimestral o anual, con o sin cuenta. Tarjeta mediante
  Stripe Checkout, EUR, entre 1,00 y 999.999,99 €, ambos incluidos. El máximo es de la aplicación.
- `/donar/resultado?ref=…`: estado y resumen privados; un retorno `cancelado=1` no cambia el
  estado financiero. El reintento de correo no repite el cobro.
- `/donar/vincular`: solicitud autenticada y confirmación de un enlace de un solo uso.
  Coincidir en correo no vincula automáticamente. No cambia el registro ni el inicio de sesión.
- `POST /api/pasarela/webhook`: firma sobre cuerpo crudo, antes de JSON y sin sesión.
  Cliente Stripe 17.7.0/API 2025-02-24.acacia; compatibilidad limitada de avisos acacia y
  2026-10-28.endive, sin aceptar otras versiones implícitamente.

Para Stripe de pruebas se necesitan `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET`; para
Mailpit, `SMTP_HOST`, `SMTP_PORT` y `SMTP_FROM`. El procedimiento de listener, filtro completo,
misma clave de `.env` y comprobación de secreto sin mostrar valores está en el quickstart.
No basta con arrancar el frontend para recibir notificaciones; el backend y el listener
deben estar disponibles. No introducir ni guardar tarjetas en la aplicación de la ONG.

HU-01 no incluye la consulta del historial ni la emisión de certificados; esas funciones
corresponden a HU-02 y HU-03, respectivamente.

## HU-02 — Historial de aportaciones

Desde «Mis aportaciones», las cuentas de donante con vínculo verificado pueden consultar
sus aportaciones confirmadas, agrupadas por año, con totales y filtro anual.
La página distingue la falta de vínculo, el historial vacío y un año sin resultados.

No requiere configuración, dependencias ni migraciones adicionales. Las pruebas aisladas
y sus comandos están en el [quickstart de HU-02](specs/spec-002/quickstart.md).

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
