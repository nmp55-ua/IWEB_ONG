# Convenciones del equipo — SI-13 Donaciones y Voluntariado

Este documento fija cómo trabajamos los cuatro para que las ocho historias formen **una sola aplicación coherente**. Es de obligado cumplimiento (principio 11 de la constitución). Si alguien necesita cambiar algo de aquí, se propone al grupo y se cambia para todos.

## 1. Reparto

| Persona | Historias | Carpeta de specs |
|---|---|---|
| Nada | HU-01, HU-02 | `specs/spec-001`, `specs/spec-002` |
| Rubén | HU-03, HU-04 | `specs/spec-003`, `specs/spec-004` |
| Javi | HU-05, HU-06 | `specs/spec-005`, `specs/spec-006` |
| Nicole | HU-07, HU-08 | `specs/spec-007`, `specs/spec-008` |

## 2. Estructura del repositorio

```
/
├── .specify/memory/constitution.md   ← constitución (común)
├── CONVENCIONES.md                   ← este documento
├── specs/
│   ├── plan-comun.md                 ← plan compartido por las 8 specs
│   ├── modelo-datos.md               ← modelo de datos compartido
│   └── spec-00N/
│       ├── spec.md                   ← qué (especificación)
│       ├── plan.md                   ← cómo (plan técnico)
│       ├── tasks.md                  ← tareas
│       └── refinamiento/             ← informes de clarify, analyze, converge
├── frontend/                         ← Astro + React + Tailwind
│   └── src/
│       ├── pages/                    ← una página por ruta
│       ├── components/
│       │   ├── comunes/              ← componentes compartidos (botones, tablas, formularios, avisos)
│       │   └── <modulo>/             ← componentes propios de cada bloque
│       ├── layouts/                  ← Layout.astro común (cabecera, menú por rol, pie)
│       └── lib/api.js                ← único cliente para llamar a la API
├── backend/                          ← Node.js + Express
│   └── src/
│       ├── app.js                    ← arranque y registro de rutas
│       ├── middleware/               ← autenticación, roles y errores (comunes)
│       ├── db/
│       │   ├── migraciones/          ← un fichero SQL numerado por cambio
│       │   └── semillas/             ← datos de prueba comunes
│       └── modulos/
│           ├── donaciones/           ← Nada (HU-01, HU-02)
│           ├── certificados-informes/← Rubén (HU-03, HU-04)
│           ├── voluntariado/         ← Javi (HU-05, HU-06)
│           └── actividades/          ← Nicole (HU-07, HU-08)
│               ├── rutas.js
│               ├── controlador.js
│               ├── servicio.js       ← reglas de negocio
│               └── repositorio.js    ← consultas SQL
└── README.md                         ← cómo arrancar el proyecto
```

Cada persona trabaja **dentro de su módulo**. Lo que está en `comunes/`, `middleware/`, `layouts/`, `lib/` y `db/` es compartido: se cambia con aviso al grupo.

## 3. Modelo de datos común

Hay **una única definición** de cada entidad. Quien la "posee" la crea en una migración; los demás la usan, no la duplican.

| Entidad | Dueño | La usan |
|---|---|---|
| Usuario (con rol) | Común (se hace al principio entre todos) | Todos |
| Proyecto | Común | Nada, Rubén, Nicole |
| Donante, Aportación, SuscripcionSocio | Nada | Rubén |
| CertificadoFiscal | Rubén | — |
| Voluntario, Inscripción | Javi | Nicole |
| Actividad | Nicole | Rubén, Javi |
| Asistencia | Nicole | Rubén |

Reglas para la base de datos:
- Tablas y columnas en español, en `snake_case` y en plural para tablas: `aportaciones`, `fecha_cobro`.
- Clave primaria `id`; claves foráneas `<entidad>_id`: `proyecto_id`.
- Todas las tablas tienen `creado_en` y `actualizado_en`.
- Importes en `NUMERIC(10,2)`, nunca en coma flotante.
- No se borra ningún registro: se usa una columna `estado` (principio 9).
- Las migraciones se numeran `001_…sql`, `002_…sql` y nunca se edita una ya subida.

## 4. Roles y acceso

Roles fijos: `donante`, `voluntario`, `coordinador`, `administrador`. Una misma persona puede ser donante y voluntario.

- Un único inicio de sesión para toda la aplicación.
- Toda ruta protegida usa el middleware común: `requiereRol('coordinador')`.
- "Cada uno ve lo suyo" se comprueba en el servidor (en `servicio.js`), no solo en la interfaz.

## 5. API

- Prefijo `/api`. Rutas en español, en plural y en minúsculas con guiones: `/api/aportaciones`, `/api/actividades/:id/inscripciones`.
- JSON con claves en `camelCase`: `fechaCobro`, `plazasLibres`.
- Fechas en ISO 8601 (`2026-10-28T10:00:00+01:00`); se formatean a dd/mm/aaaa solo en la interfaz.
- Importes como texto con 2 decimales (`"20.00"`) para no perder céntimos.
- Respuesta correcta: el recurso o `{ "datos": [...], "total": n }` en listados.
- Respuesta de error, **siempre** con este formato:

```json
{ "error": { "codigo": "PLAZAS_AGOTADAS", "mensaje": "No quedan plazas libres en esta actividad." } }
```

Códigos HTTP: 400 datos inválidos, 401 no identificado, 403 sin permiso, 404 no existe, 409 conflicto de estado (ya inscrito, plazas agotadas…). Los mensajes están en español y se pueden mostrar tal cual al usuario.

## 6. Interfaz

- Todas las páginas usan `Layout.astro` (cabecera, menú según rol y pie comunes).
- Se usan los componentes de `components/comunes/` (Boton, Tabla, Campo, Aviso, Modal, EstadoVacio) antes de crear otros.
- Mismos colores y tipografía: se definen una vez en la configuración de Tailwind.
- Mismos textos para las mismas acciones: "Guardar", "Cancelar", "Volver", "Descargar PDF", "Exportar CSV".
- Una lista vacía siempre muestra un mensaje (`EstadoVacio`), nunca una pantalla en blanco.
- Los errores de validación se muestran junto al campo correspondiente.

## 7. Código

- Nombres de variables y funciones en español y `camelCase`: `calcularTotalAnual`, `plazasLibres`.
- Las reglas de negocio van en `servicio.js`, no en las rutas ni en la interfaz.
- Formato automático con Prettier y la misma configuración para todos.

## 8. Especificaciones, planes y tareas

- Todos los `spec.md` siguen la misma plantilla (la de Spec Kit, como los de `specs/spec-001` a `spec-008`).
- Identificadores fijos para la trazabilidad: historias `HU-01`–`HU-08`, requisitos `FR-001…`, tareas `T001…`, preguntas `PAn.m`.
- Cada spec indica **Responsable** y **Revisor**.
- Las dependencias con historias de otra persona se escriben explícitamente en el plan.

## 9. Git

- La base común (constitución, specs, plan y modelo de datos compartidos, estructura vacía) se sube a `main` desde el ordenador de un integrante.
- Ocho ramas, una por spec: `spec-001` a `spec-008`. Cada persona trabaja solo en las ramas de sus specs.
- A `main` solo se entra con pull request revisado por otra persona.
- Commits en español, con la historia al principio: `HU-05: valida que no se supere el aforo`.
- Cada persona hace los commits de sus propias historias (el enunciado evalúa la autoría).

## 10. Orden de trabajo (según la guía del proyecto)

1. **Entre todos, en un solo ordenador (guía, apartado 2):** `/speckit.constitution`, `/speckit.specify` de las 8 specs, `/speckit.plan` común con el modelo de datos compartido, repositorio y ramas. Después, la base de código: constitución, este documento, estructura vacía del repositorio, tabla `usuarios` con roles, inicio de sesión, `Layout.astro`, componentes comunes, formato de errores y tabla `proyectos`.
2. **En paralelo:** Nada empieza por HU-01 y Nicole por HU-07, porque otras historias dependen de ellas.
3. Javi (HU-05) en cuanto exista `actividades`; Rubén (HU-03, HU-04) en cuanto existan `aportaciones` y `asistencias`. Mientras tanto, Rubén y Javi pueden trabajar con datos de prueba de `db/semillas/`.
4. **Cada persona, en la rama de cada una de sus specs (guía, apartado 3):** `specify → clarify → plan → tasks → analyze → implement → converge`, repitiendo los pasos que haga falta. El plan de cada spec respeta `plan-comun.md` y `modelo-datos.md`; si hay que cambiarlos, se acuerda con el grupo y se actualizan todas las specs afectadas.
5. **Antes de dar una spec por resuelta:** cumple sus criterios de aceptación, se ha probado, la documentación coincide con el código y respeta la base común. Se guarda en su rama y se avisa al grupo.
