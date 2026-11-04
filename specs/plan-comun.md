# Plan técnico común — SI-13 Donaciones y Voluntariado

**Fecha**: 2026-10-28 · **Rama**: `main` · **Specs**: spec-001 a spec-008 ·
**Modelo de datos**: [modelo-datos.md](modelo-datos.md)

Este plan es la base **compartida** por las 8 specs. El `plan.md` de cada spec lo referencia y
solo añade lo propio de su historia (pantallas, rutas, reglas de su `servicio.js`, tareas). Lo
que aquí se fija no se repite ni se contradice en los planes individuales. Para cambiarlo hace
falta el acuerdo del grupo (principio XII).

## Resumen

Una única aplicación web: front-end Astro con islas de React y Tailwind CSS; API REST en Node.js
con Express bajo `/api`; PostgreSQL como base de datos. Un solo inicio de sesión con roles,
comprobados en el servidor. La pasarela de pago es externa (Stripe en modo de pruebas), de modo
que la ONG nunca ve datos de tarjeta. PDF, CSV y correo son servicios comunes.

## Technical Context

**Language/Version**: JavaScript (ES modules) sobre Node.js 22 LTS.

**Primary Dependencies**:
- Front-end: Astro 5, `@astrojs/react` (React 19), `@astrojs/tailwind` (Tailwind CSS 3).
- Back-end: Express 4, `pg` (sin ORM), `express-session` + `connect-pg-simple`, `bcrypt`,
  `zod` (validación), `stripe`, `pdfkit`, `nodemailer`, `node-cron`.

**Storage**: PostgreSQL 16. Migraciones SQL numeradas aplicadas con un script propio
(`npm run migrar`).

**Testing**: Vitest + Supertest para la API (reglas de negocio y permisos); comprobación
manual de los criterios de aceptación en la aplicación con los datos de prueba comunes.

**Target Platform**: navegadores de escritorio y móvil actuales; servidor Linux o Windows con
Node.js.

**Project Type**: aplicación web (front-end + back-end en el mismo repositorio).

**Performance Goals**: los de las specs (historial de 5 años en < 2 s; informe anual exportado
en < 1 min). Volumen de una ONG pequeña: miles de aportaciones, cientos de actividades.

**Constraints**: importes exactos al céntimo; hora peninsular (`Europe/Madrid`); interfaz en
español de España; ningún secreto en el código (todo en `.env`, con `.env.example` sin valores
reales).

**Scale/Scope**: v1 con 8 historias, 4 roles y unas 25 pantallas.

## Constitution Check

*Antes del diseño y revisado tras él: todo cumple.*

| Principio | Cómo lo cumple este plan |
|---|---|
| I. Simplicidad | SQL directo sin ORM, sesiones en lugar de tokens, sin colas ni microservicios, valores derivados en vez de contadores. |
| II. Cero alcance fantasma | Solo se planifica lo de las specs; las PAn.m quedan abiertas y no se construye ninguna respuesta por adelantado. |
| III. Verificable | Cada criterio de aceptación tiene una forma de comprobarse en la aplicación (apartado 8). |
| IV. Español de España | Formateo común `es-ES`, € con 2 decimales, dd/mm/aaaa, `Europe/Madrid`. |
| V. Seguridad y datos | Pasarela externa (Checkout alojado), sin datos de tarjeta; `requiereRol` y comprobación de propiedad en el servidor; informes agregados; secretos en `.env`. |
| VI. Nada se borra | Estados en todas las entidades con historial; no hay rutas `DELETE` para ellas. |
| VII. Pila | Astro + React + Tailwind; Node.js + Express; PostgreSQL. |
| VIII. Una sola aplicación | Un modelo de datos, un middleware de roles, un formato de error, un layout y componentes comunes. |
| IX. Convenciones | Estructura, nombres y API siguen CONVENCIONES.md. |
| X–XII. Colaboración | Dueños de tablas, migraciones reservadas, dependencias y orden de construcción documentados (apartado 7). |

## 1. Arquitectura y estructura del repositorio

```text
Navegador ──► frontend (Astro, páginas SSR + islas React) ──fetch /api──► backend (Express)
                                                                            │
                                         Stripe (pruebas) ◄── webhooks ─────┤
                                         SMTP (Mailpit en desarrollo) ◄─────┤
                                                                            ▼
                                                                       PostgreSQL
```

En desarrollo, Astro (puerto 4321) reenvía `/api` al back-end (puerto 3000) con el proxy de
Vite, de modo que la cookie de sesión es del mismo origen y no hace falta CORS.

```text
/
├── .env.example                     ← variables sin valores reales
├── docker-compose.yml               ← PostgreSQL 16 + Mailpit para desarrollo
├── specs/  (plan-comun.md, modelo-datos.md, spec-00N/)
├── frontend/
│   ├── astro.config.mjs             ← integraciones React y Tailwind, proxy /api
│   ├── tailwind.config.mjs          ← colores y tipografía (una sola vez)
│   └── src/
│       ├── layouts/Layout.astro     ← cabecera, menú según rol, pie
│       ├── lib/api.js               ← único cliente de la API (maneja { error })
│       ├── lib/formato.js           ← formatearEuros, formatearFecha, formatearHoras
│       ├── components/comunes/      ← Boton, Tabla, Campo, Aviso, Modal, EstadoVacio
│       ├── components/<modulo>/     ← donaciones, certificados-informes, voluntariado, actividades
│       └── pages/                   ← una página por ruta (ver tabla por módulo)
└── backend/
    ├── package.json                 ← scripts: dev, migrar, semillas, test, certificados
    └── src/
        ├── app.js                   ← middlewares, registro de rutas, errores
        ├── config.js                ← lee .env y valida que no falte nada
        ├── db/
        │   ├── pool.js              ← pool de pg + ayuda transaccion(fn)
        │   ├── migraciones/001…008  ← reservadas (ver modelo-datos.md)
        │   └── semillas/            ← datos de prueba comunes
        ├── middleware/
        │   ├── autenticacion.js     ← carga req.usuario desde la sesión
        │   ├── roles.js             ← requiereRol(...roles)
        │   └── errores.js           ← ErrorApi + manejador con el formato común
        ├── servicios-comunes/
        │   ├── correo.js            ← enviarCorreo({ para, asunto, texto })
        │   ├── pdf.js               ← generarPdf(definición) → stream
        │   ├── csv.js               ← generarCsv(columnas, filas) → texto
        │   ├── pasarela.js          ← única envoltura de Stripe
        │   └── fechas.js            ← límites de año, mes y trimestre en Europe/Madrid
        └── modulos/
            ├── auth/                ← común: registro, inicio y cierre de sesión
            ├── proyectos/           ← común: listado de proyectos activos
            ├── donaciones/          ← Nada (spec-001, spec-002)
            ├── certificados-informes/ ← Rubén (spec-003, spec-004)
            ├── voluntariado/        ← Javi (spec-005, spec-006)
            └── actividades/         ← Nicole (spec-007, spec-008)
                ├── rutas.js  controlador.js  servicio.js  repositorio.js
                └── servicio.test.js
```

Capas de cada módulo: `rutas.js` (rutas y `requiereRol`) → `controlador.js` (valida la entrada
con zod y da forma a la respuesta) → `servicio.js` (reglas de negocio y «cada uno ve lo suyo»)
→ `repositorio.js` (SQL parametrizado). Un módulo puede llamar al `servicio.js` de otro (por
ejemplo, `actividades` usa el servicio de `voluntariado` para promover la lista de espera), pero
nunca a su repositorio.

## 2. Modelo de datos

Está en [modelo-datos.md](modelo-datos.md): entidades, campos, estados, transiciones,
relaciones, dueño de cada tabla y migraciones reservadas.

## 3. Autenticación y control de acceso

- **Inicio de sesión**: correo y contraseña (bcrypt, coste 12). Una sesión de servidor
  (`express-session` guardada en la tabla `sesiones`) con cookie `httpOnly`, `sameSite=lax` y
  `secure` en producción; caduca a las 8 h de inactividad. El secreto de sesión está en `.env`.
- **Rutas**: `POST /api/auth/registro` (rol `donante` y/o `voluntario`), `POST /api/auth/sesion`,
  `DELETE /api/auth/sesion` y `GET /api/auth/yo` (usuario y roles, para el menú).
- **Roles**: `requiereRol('coordinador')` en la ruta devuelve 401 si no hay sesión y 403 si falta
  el rol. Varios roles: `requiereRol('coordinador', 'administrador')`.
- **Cada uno ve lo suyo**: las rutas personales no llevan el identificador de otra persona
  (`/api/yo/aportaciones`, `/api/yo/certificados`, `/api/yo/calendario`, `/api/yo/horas`). El
  servicio busca siempre a partir de `req.usuario.id`. Si un recurso con `:id` no pertenece al
  usuario, se responde **404** (no se revela que existe). Así se cumplen los criterios «no puede
  acceder al de otro aunque conozca su identificador».
- **Front-end**: el menú y las páginas se adaptan a `GET /api/auth/yo`, pero eso es solo
  comodidad; la autoridad es el servidor.
- **Enlace Usuario ↔ Donante / Voluntario**: el Donante se enlaza con el Usuario cuyo correo
  coincide (PA1.2); el Voluntario se crea al completar el perfil de voluntario la primera vez.

## 4. Formato común de la API

Se aplica lo de CONVENCIONES.md §5:

- Prefijo `/api`; rutas en español, plural, minúsculas con guiones.
- JSON con claves `camelCase`. Listados: `{ "datos": [...], "total": n }`.
- **Fechas**: ISO 8601 con desfase de Madrid (`2026-10-28T10:00:00+01:00`); las fechas sin hora,
  `2026-10-28`. La interfaz las muestra con `formatearFecha` (dd/mm/aaaa, `Europe/Madrid`).
- **Importes**: texto con 2 decimales y punto (`"20.00"`). En la entrada se acepta coma o punto,
  se valida con la expresión `^\d+([.,]\d{1,2})?$` y se convierte a céntimos enteros. Las sumas se
  hacen en SQL sobre `NUMERIC`. La interfaz muestra `20,00 €` con `formatearEuros`.
- **Horas**: número con un decimal en la interfaz (`3,5 h`).
- **Errores**, siempre: `{ "error": { "codigo": "PLAZAS_AGOTADAS", "mensaje": "…", "campos": { "importe": "…" } } }`.
  `campos` solo aparece en errores de validación, para mostrar cada mensaje junto a su campo.
  Códigos HTTP: 400 validación · 401 sin sesión · 403 sin rol · 404 no existe o no es tuyo ·
  409 conflicto de estado · 500 inesperado (mensaje genérico, detalle solo en el registro).
- Los servicios lanzan `new ErrorApi(409, 'YA_INSCRITO', 'Ya estás inscrito en esta actividad.')`
  y `middleware/errores.js` lo convierte al formato común.

### Rutas por módulo

| Módulo | Rutas principales | Rol |
|---|---|---|
| proyectos | `GET /api/proyectos` | público |
| donaciones (001) | `POST /api/aportaciones` → URL de pago · `GET /api/aportaciones/referencia/:ref` (confirmación) · `POST /api/pasarela/webhook` | público / pasarela |
| donaciones (002) | `GET /api/yo/aportaciones?anio=2025` | donante |
| certificados-informes (003) | `GET /api/yo/certificados` · `GET /api/yo/certificados/:ejercicio/pdf` | donante |
| certificados-informes (004) | `GET /api/informes?desde&hasta&proyectoId&agrupacion` · `…/csv` · `…/pdf` | administrador |
| voluntariado (005) | `GET /api/actividades/disponibles?proyectoId&desde&hasta` · `POST /api/actividades/:id/inscripciones` · `PATCH /api/yo/inscripciones/:id` (cancelar) · `PUT /api/yo/perfil-voluntario` | público / voluntario |
| voluntariado (006) | `GET /api/yo/calendario?desde&hasta` | voluntario |
| actividades (007) | `GET/POST /api/actividades` · `PATCH /api/actividades/:id` (editar, publicar, cancelar) · `GET /api/actividades/:id/inscripciones` | coordinador |
| actividades (008) | `GET/PUT /api/actividades/:id/asistencias` · `GET /api/yo/horas` | coordinador / voluntario |

Cada plan individual detalla los cuerpos de petición y respuesta de sus rutas en su
`contracts/`, respetando este formato.

## 5. Pasarela de pago (Stripe en modo de pruebas)

- Se usa **Stripe Checkout** (página de pago alojada por Stripe). El formulario de la ONG solo
  recoge modalidad, importe, proyecto y datos fiscales; **nunca** hay campos de tarjeta en la
  aplicación ni pasan datos de tarjeta por el servidor.
- **Flujo**: `POST /api/aportaciones` valida, crea o reutiliza el Donante, crea la Aportación en
  `pendiente` (y la SuscripcionSocio en `pendiente` si es socio) y crea una sesión de Checkout:
  `mode=payment` (puntual) o `mode=subscription` con `price_data.recurring` (mensual = `month`,
  trimestral = `month` con `interval_count: 3`, anual = `year`). Responde con la URL de Stripe.
  Al volver, el donante llega a `/donar/resultado?ref=…`.
- **La confirmación solo llega por webhook** (`POST /api/pasarela/webhook`, firma verificada con
  el secreto del webhook): `checkout.session.completed` confirma la primera aportación y activa la
  suscripción; `invoice.paid` crea una nueva Aportación `cuota_socio` confirmada por cada cobro
  periódico y actualiza `fecha_proximo_cobro`; `checkout.session.expired` y
  `payment_intent.payment_failed` pasan a `cancelada` o `rechazada` con su motivo.
- **Idempotencia**: `pasarela_pago_id` es único; una notificación repetida no crea nada nuevo.
- La página de resultado consulta el estado; mientras sea `pendiente` muestra «Estamos
  confirmando tu pago» y vuelve a consultar.
- En desarrollo: claves `sk_test_…` en `.env`, webhooks reenviados con `stripe listen` y tarjetas
  de prueba publicadas por Stripe (4242… correcta, 4000 0000 0000 0002 rechazada).
- Todo el acceso a Stripe pasa por `servicios-comunes/pasarela.js`; no se llama a Stripe desde
  ningún otro sitio.

## 6. Servicios comunes: PDF, CSV y correo

- **PDF** (`pdf.js`, con pdfkit): recibe una definición simple (título, bloques de texto, tablas)
  y devuelve un stream. Lo usan el certificado fiscal (003) y el informe (004). Mismo
  encabezado con el nombre y el CIF de la ONG (de `.env`), fechas en dd/mm/aaaa e importes con
  `formatearEuros`.
- **CSV** (`csv.js`): separador `;`, decimales con coma, codificación UTF-8 con BOM (para que
  Excel en español lo abra bien) y comillas cuando hace falta. El informe en pantalla, el CSV y
  el PDF salen de **la misma función** del servicio de informes, así que siempre coinciden.
- **Correo** (`correo.js`, con nodemailer por SMTP; Mailpit en desarrollo, en
  `http://localhost:8025`). Correos de texto en español:
  - confirmación de aportación (001);
  - plaza confirmada desde la lista de espera, actividad cancelada y cambio de fecha, hora o
    lugar de una actividad publicada (007).
  Si falla el envío, se registra el error y la operación **no** se deshace.
- **Certificados (003)**: una tarea `node-cron` cada 1 de enero a las 00:05 (`Europe/Madrid`)
  genera los certificados del ejercicio anterior. El mismo código se lanza a mano con
  `npm run certificados -- --ejercicio 2025`, que es lo que se usa para probarlo. La generación es
  idempotente gracias al único `(donante_id, ejercicio)`.

## 7. Dependencias entre specs y orden de construcción

### Fase 0 — Base común en `main` (entre todos, antes de abrir las ramas)

1. Esqueleto de `frontend/` y `backend/`, `docker-compose.yml`, `.env.example`, Prettier.
2. Migraciones `001_usuarios`, `002_sesiones`, `003_proyectos`, y semillas de usuarios y
   proyectos.
3. `middleware/` (autenticación, `requiereRol`, errores), módulo `auth` y `GET /api/proyectos`.
4. `Layout.astro` con el menú por rol, componentes comunes, `lib/api.js` y `lib/formato.js`.
5. `servicios-comunes/` (correo, pdf, csv, pasarela, fechas) con su interfaz mínima.
6. Páginas de registro e inicio de sesión.

### Fase 1 — En paralelo, en la rama de cada spec

| Spec | Responsable | Depende de | Para empezar antes de tiempo |
|---|---|---|---|
| spec-001 Donación | Nada | Base común | — (prioritaria) |
| spec-007 Actividades | Nicole | Base común | — (prioritaria) |
| spec-002 Historial | Nada | spec-001 (tablas de donaciones) | Misma persona: después de 001 |
| spec-005 Inscripción | Javi | spec-007 (`actividades`) | Semilla con actividades de prueba |
| spec-006 Calendario | Javi | spec-005, spec-007 | Semilla con inscripciones de prueba |
| spec-008 Asistencia | Nicole | spec-005 (`inscripciones`), spec-007 | Semilla con inscripciones de prueba |
| spec-003 Certificado | Rubén | spec-001 (`donantes`, `aportaciones`) | Semilla con aportaciones confirmadas |
| spec-004 Informes | Rubén | spec-001, spec-007, spec-008 | Semilla con aportaciones y asistencias |

**Acuerdos para que las dependencias no bloqueen:**
- Las migraciones `004` (Nada), `005` (Nicole) y `006` (Javi) se suben a `main` **lo antes
  posible**, en un pull request pequeño y revisado, aunque el resto de la spec siga en su rama.
  Después, quien depende de ellas hace `merge` de `main` en su rama.
- Mientras tanto, quien depende trabaja con las semillas comunes, que siguen el modelo de datos.
- Contratos entre módulos: `voluntariado` expone en su servicio `promoverListaEspera(actividadId)`
  y `cancelarInscripcionesDeActividad(actividadId)`, que usa `actividades` (Javi ↔ Nicole);
  `certificados-informes` solo **lee** tablas de otros módulos.

## 8. Pruebas y datos de prueba comunes

### Datos de prueba (`backend/src/db/semillas/`, `npm run semillas`)

- **Usuarios** (contraseña común de desarrollo en `.env.example`, nunca una real):
  `donante@ong.test`, `donante2@ong.test`, `voluntario@ong.test`, `voluntario2@ong.test`,
  `coordinador@ong.test`, `admin@ong.test`.
- **Proyectos**: «Agua potable», «Comedor social» y uno inactivo, «Campaña 2024».
- **Aportaciones** de `donante@ong.test`: 50 € el 15/03/2025 y 30 € el 10/11/2025 (Agua potable),
  20 € el 01/01/2026 (fondo general), una rechazada y una pendiente; socio con 10 €/mes. Sirven
  para HU-02 (bloques 2025 = 80,00 € y 2026), HU-03 (certificado 2025 = 80,00 €) y HU-04.
- **Actividades**: una de 10 plazas con 9 inscritos, una completa de 2 plazas con 1 en espera,
  una en borrador, una cancelada y una ya celebrada de 10:00 a 13:30 con 2 inscritos confirmados.
- **Asistencias**: en otra actividad celebrada, de 2 h, para que `voluntario@ong.test` tenga
  horas.

### Cómo se prueba

- **Criterios de aceptación** (principio III): cada `plan.md` individual incluye un
  `quickstart.md` con los pasos en la aplicación para cada escenario Given/When/Then, partiendo
  de las semillas. Una historia está terminada cuando todos pasan a mano en la aplicación.
- **Reglas críticas automatizadas** (Vitest + Supertest contra una base de pruebas que se crea
  con las migraciones y las semillas):
  - permisos: 401, 403 y 404 en toda ruta protegida o personal;
  - importes: validación (0, negativo, 3 decimales, < 1 €), NIF/NIE y sumas al céntimo;
  - idempotencia del webhook (la misma notificación dos veces);
  - aforo con peticiones simultáneas y paso FIFO desde la lista de espera;
  - horas: 10:00–13:30 = 3,5; repetir el guardado no duplica; corregir resta.
- **Fechas simuladas**: los servicios reciben «ahora» a través de `fechas.js`, que en pruebas
  admite `AHORA_SIMULADO`, para probar el 1 de enero o actividades ya iniciadas.
- **Pagos**: modo de pruebas de Stripe con sus tarjetas de prueba y `stripe listen`.
- **Correos**: se revisan en Mailpit.

## Decisiones técnicas (research)

| Decisión | Motivo | Alternativas descartadas |
|---|---|---|
| Sesión de servidor en PostgreSQL | La más simple con un solo dominio; se puede invalidar | JWT (revocación y renovación más complejas) |
| SQL con `pg`, sin ORM | Menos piezas; el equipo controla las consultas y los `NUMERIC` | Prisma o Sequelize (otra capa que aprender) |
| Stripe Checkout alojado | Saca la tarjeta de nuestro sistema; tiene modo de pruebas y suscripciones | Formulario propio con Elements (más superficie); Redsys (pruebas más difíciles) |
| Confirmar solo por webhook | El retorno del navegador no prueba el cobro | Confiar en la URL de éxito |
| pdfkit | Sin navegador sin interfaz; ligero | Puppeteer (pesado) |
| CSV hecho a mano | Formato trivial; sin dependencia | Librerías de CSV |
| Horas y plazas libres derivadas | Nunca se descuadran ni se duplican | Contadores guardados |
| Bloqueo de la fila de la actividad (`SELECT … FOR UPDATE`) al inscribir o liberar | Garantiza el aforo con peticiones simultáneas | Nivel de aislamiento serializable con reintentos |
| node-cron dentro del back-end | Un único proceso | Tarea cron del sistema operativo |

## Preguntas abiertas que afectan al plan

El plan no las resuelve (principio II); se deciden en `/speckit-clarify` de cada spec y, si
cambian el modelo, se hace con una migración nueva acordada:
PA1.1 (baja de socio: estado `cancelada` ya previsto), PA1.2 (donar sin cuenta: `usuario_id`
opcional ya previsto), PA2.1 y PA3.1 (correcciones de aportaciones), PA3.2 (correo de
certificado), PA4.1 (el plan ya asume solo cifras agregadas, por el principio V), PA5.1 (edad),
PA5.2 (solapes), PA6.1 (.ics), PA7.1 (coordinador por proyecto), PA7.2 (plazo de aceptación),
PA8.1 (plazo de registro) y PA8.2 (asistencias parciales).
