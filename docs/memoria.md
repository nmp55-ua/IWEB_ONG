# Memoria del proyecto: Donaciones y Voluntariado para una ONG

**Sistema de Información 13 · Aplicación web para gestionar las donaciones y el voluntariado de una ONG**

Grupo G10: Nada, Rubén, Javi y Nicole · Ingeniería Web, Proyecto SDD Parte I · Fecha de la memoria:
20 de noviembre de 2026 · Estado del código: rama `main`

---

## Índice

1. [Portada y resumen](#1-portada-y-resumen)
2. [URL del repositorio en GITHUB](#2-url-del-repositorio-en-github)
3. [Introducción](#3-introducción)
4. [Análisis](#4-análisis)
5. [Diseño](#5-diseño)
6. [Implementación](#6-implementación)
7. [Pruebas y validación](#7-pruebas-y-validación)
8. [Despliegue y uso](#8-despliegue-y-uso)
9. [Planificación y seguimiento](#9-planificación-y-seguimiento)
10. [Conclusiones](#10-conclusiones)
11. [Demo](#11-demo)
12. [Anexos](#12-anexos)

---

## 1. Portada y resumen

**Donaciones y Voluntariado** es una aplicación web para una ONG que se sostiene con dos tipos de
generosidad: el dinero de sus donantes y el tiempo de sus voluntarios. Cubre los dos ciclos completos:
la donación (pago seguro, historial, certificado fiscal e informes) y el voluntariado (actividades,
inscripción con lista de espera, calendario, asistencia y horas acumuladas).

**Para quién.** Tiene cuatro roles con permisos distintos:

- **Donante**: hace una donación puntual o se hace socio con una cuota mensual, trimestral o anual,
  consulta su historial de aportaciones y descarga su certificado fiscal anual.
- **Voluntario**: consulta las actividades, se inscribe (o entra en la lista de espera si están
  completas), ve sus compromisos en un calendario personal y consulta sus horas acumuladas.
- **Coordinador de proyectos**: crea, publica, edita y cancela actividades y pasa lista de asistencia.
- **Administrador**: obtiene informes de recaudación y voluntariado por proyecto y periodo,
  exportables a CSV y PDF.

**Resultado.** Las ocho historias de usuario (HU-01 a HU-08), cada una con su especificación en
`specs/spec-001` a `specs/spec-008`, están implementadas sobre una base común en Astro + React,
Express y PostgreSQL. Las **276 tareas** de las ocho specs están cerradas y los **106 requisitos y
criterios de éxito** tienen una prueba automática o manual enlazada en la matriz de trazabilidad. En la
regresión final del 19/11/2026 pasan **701 pruebas automáticas** (232 del back-end común, 429 del
módulo de donaciones y 40 del front-end; 3 omitidas a propósito) y los cuatro recorridos completos
entre historias (R1–R4), uno de ellos con un pago real en Stripe de prueba.

El proyecto se ha desarrollado con **GitHub Spec Kit** (desarrollo guiado por especificaciones): cada
historia nace de una `spec.md` y pasa por `clarify`, `plan`, `tasks`, `analyze`, `implement` y
`converge`. Esta memoria se apoya en esos documentos, que se conservan en `specs/`.

---

## 2. URL del repositorio en GITHUB

El código fuente, con el historial de commits y pull requests, está publicado en GitHub:
<https://github.com/nmp55-ua/IWEB_ONG>

---

## 3. Introducción

### 3.1 Contexto

La ONG financia sus proyectos (por ejemplo, «Agua potable» o «Comedor social») con donaciones
puntuales y cuotas de socios, y los lleva adelante con voluntarios que participan en actividades
concretas. Hasta ahora estas dos partes se gestionan por separado y a mano: hojas de cálculo para las
aportaciones, correos para apuntarse a las actividades y listas en papel para la asistencia.

### 3.2 Problema que resuelve

- Los donantes no tienen una forma segura de donar en línea ni de consultar lo que han aportado, y el
  certificado para la declaración de la renta se prepara a mano cada enero.
- Los voluntarios no saben qué plazas quedan libres; cuando una actividad se llena, nadie lleva una
  lista de espera ordenada, y las plazas que se liberan se pierden.
- El coordinador no tiene un registro fiable de quién asistió ni de cuántas horas lleva cada persona.
- La junta directiva pide cifras de recaudación y voluntariado por proyecto que hoy hay que reconstruir
  desde varias fuentes.

### 3.3 Objetivos

1. Cobrar donaciones y cuotas a través de una pasarela externa, sin que la ONG guarde nunca datos de
   tarjeta.
2. Dar a cada donante su historial y su certificado fiscal, con totales que cuadren al céntimo.
3. Gestionar actividades con aforo y una lista de espera que avance sola cuando se libera una plaza.
4. Acumular automáticamente las horas de voluntariado a partir de la asistencia registrada.
5. Ofrecer a la junta informes agregados, sin datos personales, exportables a CSV y PDF.

### 3.4 Constitución del proyecto

Antes de abrir las ramas, el grupo fijó una constitución
([`.specify/memory/constitution.md`](../.specify/memory/constitution.md)) con doce principios en tres
bloques, que todas las specs y revisiones debían respetar:

| Bloque | Principios |
|---|---|
| Criterios de calidad | I. Simplicidad ante todo · II. Cero alcance fantasma · III. Verificable (cada criterio se comprueba usando la aplicación) · IV. Español de España (euros con 2 decimales, fechas dd/mm/aaaa en hora peninsular) · V. Seguridad y datos personales (pasarela externa, cada uno ve lo suyo, comprobado en el servidor) · VI. Nada se borra a ciegas |
| Organización del código | VII. Pila tecnológica · VIII. Una sola aplicación (un plan y un modelo de datos para las 8 specs) · IX. Convenciones obligatorias (`CONVENCIONES.md`) |
| Colaboración | X. Responsable, revisor y ramas · XI. Revisión antes de `main` · XII. Cambios comunes con acuerdo |

---

## 4. Análisis

### 4.1 Actores y roles

| Rol | Qué puede hacer | Cómo se obtiene |
|---|---|---|
| Visitante (sin sesión) | Ver las actividades publicadas, donar sin cuenta y verificar un certificado por su código | — |
| Donante | Donar, hacerse socio, ver su historial y sus certificados | Al registrarse; su cuenta se vincula a su ficha de donante con un enlace verificado (`/donar/vincular`) |
| Voluntario | Inscribirse, cancelar, ver su calendario y sus horas | Al registrarse; su perfil de voluntario se completa en la primera inscripción |
| Coordinador | Gestionar actividades y la asistencia | Asignado por la ONG |
| Administrador | Ver y exportar los informes | Asignado por la ONG |

Una misma cuenta puede tener varios roles (por ejemplo, donante y voluntario).

### 4.2 Historias de usuario

| HU | Historia | Responsable | Spec |
|---|---|---|---|
| HU-01 | Como donante, quiero hacer una donación puntual o hacerme socio pagando en una pasarela segura, para colaborar con la ONG y recibir confirmación inmediata | Nada | [spec-001](../specs/spec-001/spec.md) |
| HU-02 | Como donante, quiero consultar el historial de mis aportaciones agrupado por año y por proyecto, para tener constancia de mi implicación | Nada | [spec-002](../specs/spec-002/spec.md) |
| HU-03 | Como donante, quiero descargar al comienzo de cada año un certificado fiscal con el total del año anterior, para mi declaración de impuestos | Rubén | [spec-003](../specs/spec-003/spec.md) |
| HU-04 | Como administrador, quiero informes del dinero recaudado y del voluntariado por proyecto y periodo, para rendir cuentas ante la junta | Rubén | [spec-004](../specs/spec-004/spec.md) |
| HU-05 | Como persona interesada, quiero ver las actividades futuras con sus plazas libres y requisitos e inscribirme, para participar | Javi | [spec-005](../specs/spec-005/spec.md) |
| HU-06 | Como voluntario, quiero ver mis próximas actividades en un calendario personal, para organizar mi disponibilidad | Javi | [spec-006](../specs/spec-006/spec.md) |
| HU-07 | Como coordinador, quiero crear y mantener las actividades definiendo sus plazas, para organizar el voluntariado de cada proyecto | Nicole | [spec-007](../specs/spec-007/spec.md) |
| HU-08 | Como coordinador, quiero registrar quién asistió a cada actividad, para que las horas de cada persona se acumulen solas | Nicole | [spec-008](../specs/spec-008/spec.md) |

El texto completo de cada historia, con sus escenarios Given/When/Then, está en su `spec.md` y,
reunido, en [`entrega/historias-usuario-final.md`](entrega/historias-usuario-final.md).

### 4.3 Requisitos funcionales

Entre las ocho specs hay **85 requisitos funcionales** (uno de ellos, FR-010 de HU-03, eliminado en
`clarify`) y **21 criterios de éxito**. Los más relevantes por historia:

| HU | Requisitos clave |
|---|---|
| HU-01 (19 FR) | Importe entre 1,00 y 999.999,99 €; NIF/NIE válido; la aportación solo queda «confirmada» cuando la pasarela confirma el cobro (webhook firmado); resumen y correo con referencia única; reintento del correo sin repetir el cobro |
| HU-02 (8 FR) | Solo aportaciones confirmadas, agrupadas por año con su total y su destino; filtro por año; solo con la cuenta vinculada a su donante |
| HU-03 (12 FR) | Emisión automática a partir del 1 de enero; código de verificación público; regeneración si se confirma tarde un cobro del ejercicio; certificados de años anteriores descargables |
| HU-04 (9 FR) | Periodo, proyecto y agrupación (mes, trimestre, año); dinero y voluntariado en la misma tabla; subtotales y total; exportación CSV y PDF idéntica a la pantalla |
| HU-05 (11 FR) | Solo actividades futuras y publicadas; plazas libres calculadas; inscripción con declaración de requisitos; lista de espera si está completa; cancelar hasta el inicio |
| HU-06 (6 FR) | Vista mensual y de lista con las inscripciones confirmadas y en espera; cancelar desde el calendario; recarga al volver a la pestaña |
| HU-07 (11 FR) | Crear en borrador, publicar, editar y cancelar; aviso por correo si cambian fecha, hora o lugar; promoción automática de la lista de espera en orden de llegada |
| HU-08 (9 FR) | Marcar «asistió» o «no asistió» solo a inscritos confirmados de actividades celebradas; horas = fin − inicio; corregir resta; página `/mis-horas` |

### 4.4 Requisitos no funcionales

- **Seguridad**: el pago se hace en Stripe Checkout y la aplicación nunca ve la tarjeta (HU-01 SC-003);
  cada usuario ve solo lo suyo y los permisos se comprueban siempre en el servidor (401, 403 y 404 en
  toda ruta protegida); contraseñas con bcrypt; ningún secreto en el código.
- **Exactitud**: importes en `NUMERIC`, nunca coma flotante; totales que cuadran al céntimo entre
  historial, certificado e informe (HU-02 SC-001, HU-03 SC-001, HU-04 SC-001).
- **Rendimiento** (volumen de una ONG pequeña): historial de cinco años en menos de 2 s (HU-02);
  informe anual exportado en menos de 1 minuto (HU-04).
- **Usabilidad medida con una persona**: donar en menos de 3 min (HU-01), inscribirse en menos de
  2 min (HU-05), encontrar la siguiente actividad en menos de 10 s (HU-06), crear y publicar una
  actividad en menos de 3 min (HU-07) y pasar lista a 20 personas en menos de 2 min (HU-08).
- **Accesibilidad**: navegación con teclado y contrastes de al menos 4,5:1 (revisado en el `converge`
  de HU-06).
- **Idioma y formato**: toda la interfaz y los mensajes de error en español de España; fechas en hora
  peninsular (`Europe/Madrid`).

### 4.5 Reglas que cruzan historias

1. **Una sola fuente de las aportaciones** (HU-01): historial, certificado e informe cuentan solo las
   confirmadas, por su fecha de cobro en hora de Madrid.
2. **El vínculo cuenta–donante** se crea solo con el enlace verificado de `/donar/vincular`; coincidir
   en el correo no da acceso (HU-01, HU-02, HU-03).
3. **La lista de espera** es de HU-07, pero la inscripción es de HU-05: al cancelar, HU-05 llama a
   `promoverListaEspera` en la misma transacción y HU-07 envía el único correo de plaza confirmada.
4. **El aforo** nunca se supera: se bloquea la fila de la actividad al inscribir o liberar (HU-05,
   HU-07).
5. **Nada se borra**: aportaciones, inscripciones y asistencias cambian de estado.
6. **Un voluntario cuenta una vez** en los totales del informe aunque participe en varios proyectos
   (HU-04, decidido en `clarify`).

---

## 5. Diseño

### 5.1 Arquitectura

```text
Navegador ──► frontend (Astro, páginas SSR + islas React) ──fetch /api──► backend (Express)
                                                                            │
                                         Stripe (pruebas) ◄── webhooks ─────┤
                                         SMTP (Mailpit en desarrollo) ◄─────┤
                                                                            ▼
                                                                       PostgreSQL
```

En desarrollo, Astro (puerto 4321) reenvía `/api` al back-end (puerto 3000), de modo que la cookie de
sesión es del mismo origen y no hace falta CORS.

El back-end se organiza en **módulos**, uno por área y dueño: `auth` y `proyectos` (comunes),
`donaciones` (Nada), `certificados-informes` (Rubén), `voluntariado` (Javi) y `actividades` (Nicole).
Todos siguen las mismas capas: `rutas.js` (rutas y `requiereRol`) → `controlador.js` (valida la
entrada con zod) → `servicio.js` (reglas de negocio) → `repositorio.js` (SQL parametrizado). **Un
módulo puede usar el servicio de otro, nunca su repositorio**; por ejemplo, `actividades` gestiona la
lista de espera a través de las funciones que expone el servicio de `voluntariado`. La excepción
documentada es `certificados-informes`, que solo lee las tablas de los demás con su propio SQL.

Los servicios comunes (`servicios-comunes/`) se escribieron una sola vez: fechas en hora de Madrid,
importes en céntimos, CSV para Excel en español, PDF (pdfkit), correo (nodemailer) y la única envoltura
de la pasarela (`pasarela.js`).

### 5.2 Modelo de datos

El modelo es único para las ocho specs ([`specs/modelo-datos.md`](../specs/modelo-datos.md)). Cada
tabla tiene un solo dueño y un número de migración reservado para que las ramas no chocaran:

```text
usuarios 1──0..1 donantes 1──* aportaciones *──0..1 proyectos
                    │                │
                    └──* suscripciones_socio 1──* aportaciones (cuotas)
                    └──* certificados_fiscales

usuarios 1──0..1 voluntarios 1──* inscripciones *──1 actividades *──1 proyectos
                                        │
                                        └──0..1 asistencias
```

| Tabla | Dueño | Migración | La usan |
|---|---|---|---|
| `usuarios`, `sesiones`, `proyectos` | Común | 001–003 | Todas |
| `donantes`, `suscripciones_socio`, `aportaciones` | spec-001 (Nada) | 004 | 002, 003, 004 |
| `actividades` | spec-007 (Nicole) | 005 | 004, 005, 006, 008 |
| `voluntarios`, `inscripciones` | spec-005 (Javi) | 006 | 006, 007, 008 |
| `asistencias` | spec-008 (Nicole) | 007 | 004 |
| `certificados_fiscales` | spec-003 (Rubén) | 008 | — |
| `operaciones_pago`, `eventos_pasarela`, `verificaciones_donante`, `correos_aportacion` | spec-001 (Nada) | 009 | 001 |

Reglas generales: claves `BIGSERIAL`, `creado_en` y `actualizado_en` en todas las tablas, importes en
`NUMERIC(10,2)` (el total anual del certificado, `NUMERIC(15,2)`), horas en `NUMERIC(5,2)`, estados en
`TEXT` con `CHECK` y claves foráneas `ON DELETE RESTRICT`. No se guarda ningún dato de tarjeta y los
tokens de vínculo solo se conservan como hash.

### 5.3 Contrato de la API

Formato común para todas las rutas ([`specs/plan-comun.md` §4](../specs/plan-comun.md)):

- Prefijo `/api`, rutas en español, JSON en `camelCase`; listados como `{ "datos": [...], "total": n }`.
- Importes como texto con 2 decimales (`"20.00"`) y fechas ISO 8601 con desfase de Madrid.
- Errores siempre como `{ "error": { "codigo", "mensaje", "campos" } }`, con 400 (validación),
  401 (sin sesión), 403 (sin rol), 404 (no existe o no es tuyo), 409 (conflicto de estado) y 500.
- Las rutas personales no llevan el identificador de nadie (`/api/yo/...`): el servidor usa siempre la
  sesión.

| Módulo | Rutas principales | Rol |
|---|---|---|
| auth | `POST /api/auth/registro` · `POST`/`DELETE /api/auth/sesion` · `GET /api/auth/yo` | público / con sesión |
| donaciones (001, 002) | `POST /api/aportaciones` · `GET /api/aportaciones/referencia/:ref` · `POST /api/pasarela/webhook` · `GET /api/yo/aportaciones` | sin cuenta / pasarela / donante |
| certificados-informes (003, 004) | `GET /api/yo/certificados` · `…/:ejercicio/pdf` · `GET /api/certificados/verificacion` · `GET /api/informes` (+ `/csv`, `/pdf`) | donante / público / administrador |
| voluntariado (005, 006) | `GET /api/actividades/disponibles` · `POST /api/actividades/:id/inscripciones` · `PATCH /api/yo/inscripciones/:id` · `GET /api/yo/calendario` | público / voluntario |
| actividades (007, 008) | `GET`/`POST /api/actividades` · `PATCH /api/actividades/:id` · `GET`/`PUT /api/actividades/:id/asistencias` · `GET /api/yo/horas` | coordinador / voluntario |

Cada spec detalla los cuerpos de petición y respuesta en su carpeta `contracts/`.

### 5.4 Decisiones técnicas y por qué se tomaron

| Decisión | Por qué | Alternativa descartada |
|---|---|---|
| Sesión de servidor guardada en PostgreSQL | La más simple con un solo dominio y se puede invalidar | JWT (revocación y renovación más complejas) |
| SQL con `pg`, sin ORM | Menos piezas y control de los `NUMERIC` | Prisma o Sequelize |
| Stripe Checkout alojado | La tarjeta no pasa por la aplicación; tiene modo de pruebas y suscripciones | Formulario propio con Elements; Redsys |
| Confirmar el pago solo por webhook firmado | La página de retorno del navegador no prueba el cobro | Confiar en la URL de éxito |
| Plazas libres y horas calculadas, no guardadas | Nunca se descuadran ni se duplican al corregir | Contadores guardados |
| `SELECT … FOR UPDATE` sobre la actividad | Garantiza el aforo con peticiones simultáneas | Aislamiento serializable con reintentos |
| pdfkit y CSV hecho a mano | Ligeros, sin navegador sin interfaz | Puppeteer; librerías de CSV |
| Tarea horaria con `node-cron` dentro del back-end | Un único proceso emite y regenera los certificados | Cron del sistema operativo |
| Una única función para pantalla, CSV y PDF del informe | Las tres salidas no pueden descuadrarse | Tres consultas distintas |

---

## 6. Implementación

### 6.1 Pila tecnológica

| Capa | Tecnología |
|---|---|
| Front-end | Astro 5 con islas de React 19 y Tailwind CSS 3 |
| Back-end | Node.js 22 y Express 4; validación con zod; `express-session` + `connect-pg-simple`; bcrypt |
| Base de datos | PostgreSQL 16, con migraciones SQL numeradas (`npm run migrar`) |
| Servicios | Stripe (modo de pruebas), nodemailer con Mailpit en desarrollo, pdfkit, node-cron |
| Pruebas | Vitest + Supertest en el back-end; `node --test` en el front-end |
| Desarrollo | Docker Compose (PostgreSQL y Mailpit), GitHub Spec Kit 1.0.4 con Claude Code |

### 6.2 Estructura del repositorio

```text
/
├── .env.example                 ← variables sin valores reales
├── docker-compose.yml           ← PostgreSQL 16 + Mailpit
├── CONVENCIONES.md              ← carpetas, nombres, API, base de datos e interfaz
├── .specify/memory/constitution.md
├── specs/
│   ├── plan-comun.md  modelo-datos.md
│   └── spec-001 … spec-008/     ← spec, plan, research, data-model, contracts, quickstart,
│                                   tasks, checklists y refinamiento/ (clarify, analyze, converge)
├── docs/
│   ├── agrupamiento.md  memoria.md
│   └── entrega/                 ← historias finales, dossier, matriz, regresión y demo
├── backend/src/
│   ├── app.js  config.js  servidor.js
│   ├── db/ (pool.js, migraciones/001…009, semillas/)
│   ├── middleware/ (autenticacion, roles, errores)
│   ├── servicios-comunes/ (correo, pdf, csv, pasarela, fechas, importes)
│   └── modulos/ (auth, proyectos, donaciones, certificados-informes, voluntariado, actividades)
└── frontend/src/
    ├── layouts/Layout.astro     ← cabecera y menú según el rol
    ├── lib/ (api.js, formato.js)
    ├── components/ (comunes/ y una carpeta por módulo)
    └── pages/                   ← una página por ruta
```

### 6.3 Partes más relevantes del código

- **Pago sin duplicados (HU-01, `donaciones/servicio.js` y `pasarela.js`)**: la creación de la sesión
  de Checkout se protege con un bloqueo de PostgreSQL por operación; la solicitud exacta que se envía a
  Stripe se guarda una vez y cualquier reintento reutiliza la misma referencia, cuerpo y clave de
  idempotencia. El webhook comprueba la firma sobre el cuerpo crudo y es idempotente.
- **Inscripción con aforo y lista de espera (HU-05, `voluntariado/servicio.js`)**: se bloquea la
  actividad con `bloquearActividad`, se cuentan las confirmadas y se inscribe o se manda a la lista de
  espera. Al cancelar se sigue un orden fijo (leer sin bloqueo, bloquear la actividad y volver a leer)
  para no interbloquearse con HU-07.
- **Calendario (HU-06, `CalendarioVoluntario.jsx`)**: vista mensual y de lista; conserva el foco al
  cambiar de mes y recarga al volver a la pestaña.
- **Gestión de actividades (HU-07, `actividades/servicio.js`)**: estados borrador → publicada →
  cancelada o celebrada; avisa por correo si cambian fecha, hora o lugar.
- **Asistencia y horas (HU-08)**: las horas son fin − inicio y se calculan al consultar, así que
  repetir el guardado no duplica y corregir resta.
- **Certificado e informe (HU-03 y HU-04, `certificados-informes/`)**: la tarea horaria emite y
  regenera certificados con código de verificación; el informe se calcula con `GROUPING SETS` (filas,
  subtotales y total en una consulta) y una sola función alimenta pantalla, CSV y PDF.
- **Errores comunes (`middleware/errores.js`)**: convierte `ErrorApi` y los errores de zod al formato
  común, con los mensajes de validación en español.

### 6.4 Decisiones tomadas sobre la marcha

- **Contrato de la lista de espera** entre HU-05 y HU-07, que no existía en las specs iniciales:
  `promoverListaEspera` y un único correo, `avisarPlazaConfirmada` (`analyze-1` de spec-007).
- **Migración 006 adelantada**: la 007 de asistencias necesitaba la tabla `inscripciones`; se descartó
  una clave foránea condicional y Javi adelantó su migración (plan de spec-008).
- **Columnas de auditoría** que faltaban en `asistencias` por un error del propio modelo común; se
  corrigieron el documento, la spec y la migración (`converge` de spec-008).
- **Total del certificado** ampliado a `NUMERIC(15,2)` tras la revisión de Nada del PR #5.
- **«En ese momento» en HU-03**: se mantuvo la tarea horaria y se precisó en el research y el
  quickstart, en lugar de acoplar el módulo de donaciones (`analyze-1` de spec-003).
- **PDF común**: se corrigió el solapamiento de filas en `pdf.js`, acordándolo con el grupo y
  comprobando que el certificado de HU-03 no cambiaba.
- **Color común «aviso»** oscurecido a `#9A5B00` (5,4:1) tras el `converge` de HU-06.
- **Mensajes de zod en español** para todas las rutas, en un solo sitio.

---

## 7. Pruebas y validación

### 7.1 Estrategia

- **Reglas críticas automatizadas** con Vitest + Supertest contra una base de pruebas creada con las
  migraciones y las semillas: permisos (401, 403 y 404), importes y NIF/NIE, idempotencia del webhook,
  aforo con peticiones simultáneas, paso de la lista de espera en orden y cálculo de horas.
- **Fechas simuladas**: los servicios obtienen «ahora» de `fechas.js`, que en pruebas admite
  `AHORA_SIMULADO` (para probar el 1 de enero o actividades ya empezadas).
- **Criterios de aceptación a mano**: cada spec tiene un `quickstart.md` con los pasos en la aplicación
  para cada escenario, partiendo de las semillas comunes.
- **Regresión antes de cada integración**: se traía `main` a la rama y se ejecutaba la suite completa.
  Las pruebas de donaciones usan su propia base aislada (`ong_test_hu01`); el resto, `ong_test`.

### 7.2 Resultados de las pruebas automáticas

Regresión final del 19/11/2026 ([`entrega/regresion/`](entrega/regresion/)):

| Conjunto | Ficheros | Pruebas |
|---|---|---|
| Back-end común (`ong_test`) | 12 | 232 pasan, 3 omitidas |
| Donaciones (`ong_test_hu01`) | 15 | 429 pasan |
| Front-end | 4 | 40 pasan |
| **Total** | **31** | **701 pasan, 0 fallan** |

### 7.3 Pruebas de concurrencia y de reglas críticas

- Dos inscripciones a la vez por la última plaza: solo una entra; la otra recibe `PLAZAS_AGOTADAS`.
- Bajar las plazas mientras alguien se inscribe: nunca hay más confirmados que plazas.
- Cancelar mientras se promueve la lista de espera: entra la primera persona y no queda una plaza libre
  con gente esperando.
- Pago interrumpido: tiempo de espera, reinicio y reanudación desde otro proceso reutilizan la misma
  sesión de Checkout.
- La misma notificación de Stripe dos veces no crea dos aportaciones.
- 101 aportaciones de 999.999,99 € más una de 1 € en un año: el certificado no se desborda.
- Horas de una actividad de 10:00 a 13:30 = 3,5 h; repetir el guardado no duplica y corregir resta.

### 7.4 Recorridos completos entre historias

| # | Recorrido | Historias | Resultado |
|---|---|---|---|
| R1 | De la actividad a las horas y al informe | HU-07 → HU-05 → HU-06 → HU-08 → HU-04 | Correcto |
| R2 | Lista de espera y plaza liberada, con su correo | HU-07 → HU-05 | Correcto |
| R3 | Permisos: intentar ver datos de otro donante | HU-02 → HU-03 | Correcto (404 o 400, nunca datos ajenos) |
| R4 | Donación con Stripe de prueba hasta el certificado | HU-01 → HU-02 → HU-03 | Correcto |

Precondiciones, pasos y resultados observados en
[`entrega/matriz-trazabilidad.md`](entrega/matriz-trazabilidad.md#recorridos-completos-entre-historias-enunciado-54).
Además, para cada historia se revisaron tres situaciones (recorrido habitual, entrada inválida y
permisos o estado), con su escena del vídeo y su prueba:
[`entrega/situaciones-por-historia.md`](entrega/situaciones-por-historia.md).

### 7.5 Validación manual

Los criterios de tiempo se cronometraron con una persona en la aplicación:

| Criterio | Objetivo | Medido |
|---|---|---|
| HU-04 SC-002 · informe anual exportado | < 1 min | 0,14 s el informe y 0,10 s el PDF |
| HU-05 SC-001 · encontrar e inscribirse | < 2 min | 10 s |
| HU-06 SC-002 · encontrar la siguiente actividad | < 10 s | menos de 5 s |
| HU-08 SC-002 · pasar lista a 20 personas | < 2 min | 40 s |

El resto de escenarios se comprobó siguiendo el `quickstart.md` de cada spec; los resultados están en
la carpeta `refinamiento/` de cada una.

### 7.6 Trazabilidad

La matriz ([`entrega/matriz-trazabilidad.md`](entrega/matriz-trazabilidad.md)) enlaza cada uno de los
106 requisitos y criterios con su decisión del plan, sus tareas y su prueba, y recoge la revisión del
responsable y de su revisor.

---

## 8. Despliegue y uso

### 8.1 Requisitos previos

Node.js 22 y Docker Desktop (para PostgreSQL 16 y Mailpit). Para probar pagos reales en modo de
pruebas, una cuenta de Stripe y Stripe CLI.

### 8.2 Instalación y arranque

Desde la raíz del repositorio (PowerShell):

```powershell
if (-not (Test-Path -LiteralPath '.env')) { Copy-Item .env.example .env }
# Completar SESSION_SECRET y CONTRASENA_SEMILLAS en .env (nunca en el repositorio)

docker compose up -d          # PostgreSQL y Mailpit (http://localhost:8025)

Set-Location backend
npm ci
npm run migrar
npm run semillas
npm run dev                   # API en http://localhost:3000/api
```

En otra terminal:

```powershell
Set-Location frontend
npm ci
npm run dev                   # Web en http://localhost:4321
```

La aplicación arranca sin claves de Stripe: el pago muestra «El pago no está disponible» y no cobra.
Para probar pagos se añaden `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` al `.env` y se lanza
`stripe listen` hacia `/api/pasarela/webhook` (procedimiento en el
[quickstart de HU-01](../specs/spec-001/quickstart.md)). Tarjeta de prueba: `4242 4242 4242 4242`.

### 8.3 Comandos útiles

| Comando (en `backend/`) | Qué hace |
|---|---|
| `npm run migrar` | Aplica las migraciones pendientes sobre `DATABASE_URL` |
| `npm run semillas` | Carga los datos de prueba comunes |
| `npm test` | Ejecuta las pruebas automáticas |
| `npm run certificados` | Lanza a mano la emisión y regeneración de certificados |

En `frontend/`: `npm run dev`, `npm run build` y `npm test`.

### 8.4 Variables de entorno

`.env.example` lista todas las variables sin valores reales: conexión a la base (`DATABASE_URL`,
`DB_PORT`), sesión (`SESSION_SECRET`), contraseña de las semillas, `FRONTEND_URL`, datos de la ONG para
el certificado (`ONG_NOMBRE`, `ONG_CIF`, `ONG_DIRECCION`), correo (`SMTP_*`), Stripe (`STRIPE_*`) y el
reloj simulado (`AHORA_SIMULADO`, solo en pruebas).

### 8.5 Usuarios de ejemplo

Con la contraseña de `CONTRASENA_SEMILLAS`: `donante@ong.test`, `donante2@ong.test`,
`voluntario@ong.test`, `voluntario2@ong.test`, `coordinador@ong.test` y `admin@ong.test`. Las
semillas incluyen los proyectos «Agua potable», «Comedor social» y «Campaña 2024» (inactivo),
aportaciones de 2025 y 2026, actividades en todos los estados y asistencias con horas.

### 8.6 Manual de usuario breve

- **Donar** (`/donar`): elegir puntual o socio (mensual, trimestral o anual), importe y proyecto,
  rellenar los datos fiscales y pagar en Stripe. La página de resultado muestra el resumen con su
  referencia y llega un correo. Para ver el historial con una cuenta, vincularla en `/donar/vincular`.
- **Mis aportaciones** (`/mis-aportaciones`): historial por año con totales y filtro anual.
- **Mis certificados** (`/mis-certificados`): descargar el PDF de cada ejercicio. Cualquiera puede
  comprobar un certificado en `/verificar-certificado` con su código.
- **Actividades** (`/actividades`): ver las publicadas con sus plazas libres e inscribirse; si está
  completa, apuntarse a la lista de espera.
- **Mi calendario** (`/mi-calendario`): próximas actividades en vista mensual o de lista; cancelar
  desde la tarjeta.
- **Mis horas** (`/mis-horas`): total de horas y desglose por actividad.
- **Coordinación** (`/coordinacion/actividades`): crear, publicar, editar y cancelar actividades, ver
  inscritos y lista de espera y pasar lista (`/coordinacion/actividades/:id/asistencia`).
- **Informes** (`/informes`, administrador): elegir periodo, proyecto y agrupación; exportar a CSV o PDF.

---

## 9. Planificación y seguimiento

### 9.1 Método de trabajo

1. **Preparación común** (antes de abrir las ramas): constitución, `specify` conjunto de las ocho
   historias, plan técnico y modelo de datos compartidos y base de código común en `main`.
2. **Una rama por spec** (`spec-001` a `spec-008`), con su responsable y su revisor
   ([`agrupamiento.md`](agrupamiento.md)).
3. **Ciclo completo en cada historia**: `clarify` → `plan` → `tasks` → `analyze` → `implement` →
   `converge`, repitiendo `analyze` y `converge` hasta no dejar hallazgos graves ni brechas.
4. **Pull request con revisión cruzada**: a `main` solo se llega con la aprobación del revisor.
5. **Cambios comunes con acuerdo**: cualquier cambio en el plan, el modelo o los componentes comunes se
   proponía al grupo y se aplicaba en todas las specs afectadas.

### 9.2 Tareas por especificación

| Spec | Decisiones de clarify | Informes de analyze | Informes de converge | Tareas añadidas por converge | Tareas cerradas |
|---|---|---|---|---|---|
| spec-001 | 8 | 2 | 3 | 3 | 84/84 |
| spec-002 | 2 | 2 | 2 | 2 | 37/37 |
| spec-003 | 8 | 2 | 2 | 1 | 26/26 |
| spec-004 | 5 | 2 | 2 | 0 | 21/21 |
| spec-005 | 4 | 2 | 2 | 6 | 28/28 |
| spec-006 | 4 | 2 | 2 | 10 | 26/26 |
| spec-007 | 5 | 3 | 2 | 3 | 29/29 |
| spec-008 | 5 | 4 | 3 | 3 | 25/25 |
| **Total** | **41** | **19** | **18** | **28** | **276/276** |

El detalle por spec está en el [dossier de refinamiento](entrega/dossier-refinamiento.md).

### 9.3 Iteraciones

Algunas iteraciones de loop engineering, una o dos por persona:

- **La lista de espera no tenía dueño (HU-05 y HU-07, Javi y Nicole).** El primer `analyze` de
  spec-007 detectó que ninguna spec promovía a la primera persona en espera cuando un voluntario
  cancelaba. Se acordó un contrato entre módulos (`promoverListaEspera` y un único correo,
  `avisarPlazaConfirmada`), se reflejó en las dos specs antes de implementar y se comprobó con una
  cancelación real.
- **Cancelar mientras se promueve la lista (HU-05, Javi).** El primer `analyze` de spec-005 marcó como
  grave (S1) que la cancelación podía decidir con una lectura desactualizada y dejar una plaza libre con
  gente esperando. Bloquear antes la inscripción invertía el orden de bloqueo de spec-007 y podía
  interbloquear. Se fijó un orden único (leer, `bloquearActividad`, volver a leer) en el plan y en T017,
  y lo comprueban las pruebas de concurrencia.
- **El calendario no servía para todo el mundo (HU-06, Javi).** Con las 13 pruebas en verde, el primer
  `converge` encontró siete diferencias de interfaz: la más importante, que al pasar de mes se perdía
  el foco del teclado. Se añadieron diez tareas y el segundo `converge` comprobó cada una con su antes y
  después.
- **Un pago interrumpido no podía acabar en dos cobros (HU-01, Nada).** El primer `analyze` señaló
  (UND-001) que no había forma segura de reanudar una sesión de Checkout cortada. Se fijó el protocolo
  de bloqueo, solicitud guardada y misma clave de idempotencia con un plazo de 23 horas.
- **El banco de medición del historial (HU-02, Nada).** El primer `converge` vio que el banco podía no
  cerrar sus recursos y que el plan atribuía la transacción a otra capa; se corrigió en T036–T037 con
  regresiones y el segundo `converge` salió limpio.
- **Un total que podía desbordarse (HU-03, Rubén).** La revisión de Nada del PR #5 encontró que el total
  anual cabía en `NUMERIC(10,2)`, como una sola aportación. Se amplió a `NUMERIC(15,2)` con una prueba
  que falla con el tipo anterior.
- **Un informe que dependía de una tabla ajena (HU-04, Rubén).** La tabla `asistencias` aún no estaba en
  `main`; se construyó todo lo demás y se dejó una fase propia bloqueada hasta que HU-08 se integró.
- **Asistencias sin columnas de auditoría (HU-08, Nicole).** El `converge` de spec-008 vio que faltaban
  `creado_en` y `actualizado_en`; el error venía del modelo común y se corrigió en los dos sitios.

El relato completo de cada iteración y el registro mínimo de hallazgos están en
[`entrega/memoria-final.md`](entrega/memoria-final.md) y en la carpeta `refinamiento/` de cada spec.

### 9.4 Historial de commits

Casi 200 commits entre el 14/10 y el 20/11/2026, firmados por cada integrante con su cuenta de GitHub
y con el identificador de la historia al principio del mensaje (`HU-05: ...`), como pide la
constitución. El historial de cada rama `spec-00N` permite seguir las versiones sucesivas de su spec,
y la diferencia entre la spec anterior y la revisada en cada `clarify` es su propio commit.

### 9.5 Issues y pull requests

| PR | Rama | Responsable | Revisor | Integrado |
|---|---|---|---|---|
| #1 | spec-007 | Nicole | Javi | 04/11/2026 |
| #2 | spec-005 | Javi | Nicole | 06/11/2026 |
| #3 | spec-006 | Javi | Nada | 06/11/2026 |
| #4 | spec-001 | Nada | Rubén | 07/11/2026 |
| #5 | spec-003 | Rubén | Nada | 08/11/2026 |
| #6 | spec-002 | Nada | Javi | 11/11/2026 |
| #7 | spec-008 | Nicole | Rubén | 11/11/2026 |
| #8 | spec-004 | Rubén | Nicole | 12/11/2026 |

Los ocho pull requests tienen la aprobación de su revisor. La coordinación entre historias se hizo
con tareas de coordinación dentro de cada `tasks.md` (por ejemplo, T021 de spec-005 y T023 de
spec-007) en lugar de issues.

---

## 10. Conclusiones

### 10.1 Qué se consiguió

- Una sola aplicación con las ocho historias funcionando, aunque la construyeron cuatro personas en
  paralelo.
- Todos los requisitos con una prueba enlazada y todas las tareas cerradas.
- Los totales cuadran al céntimo entre historial, certificado e informe, y el aforo nunca se supera.
- Cada decisión importante está escrita en una spec, un plan o un informe, no solo en el código.

### 10.2 Problemas encontrados

- **Las fronteras entre historias** fueron lo más costoso: quién es dueño de cada tabla, qué devuelve
  cada función que usa otro módulo y en qué orden se integra cada rama.
- **Ficheros comunes en conflicto** (menú, `app.js`, semillas, registro de migraciones): se resolvieron
  sumando las dos partes.
- **Pruebas escritas antes de que existiera el trabajo de otro**: una prueba de HU-01 tenía la lista de
  migraciones escrita a mano y falló al llegar la 007.
- **Datos de prueba compartidos**: las semillas de unas historias rompían los escenarios de otras (por
  ejemplo, las inscripciones de «Recogida de ropa», que usan HU-05 y HU-08).

### 10.3 Lecciones aprendidas

- `analyze` y `converge` encontraron problemas reales que las pruebas no veían: requisitos sin dueño,
  contradicciones entre documentos y reglas del modelo común que el código no cumplía.
- Una tarea marcada como hecha no prueba que se cumple el requisito; hay que contrastarlo con la
  aplicación.
- La revisión de otra persona encuentra lo que el responsable no se plantea (el desbordamiento del
  certificado es el mejor ejemplo).
- Los acuerdos entre personas tienen que acabar en el plan común, no quedarse en un mensaje del grupo.

Las valoraciones personales de cada integrante están en
[`entrega/memoria-final.md`](entrega/memoria-final.md#valoraciones-personales).

### 10.4 Trabajo futuro

- Recuperar el acceso a una donación hecha sin cuenta si se pierde la sesión (limitación aceptada de v1
  en HU-01).
- Comprobar algunos requisitos de las actividades (la edad, por ejemplo) en lugar de aceptar la
  declaración del voluntario.
- Avisar del solapamiento entre dos actividades en las que se inscribe la misma persona.
- Desplegar la aplicación en un servidor con la pasarela en modo real.

---

## 11. Demo

La demostración está en [`entrega/demo/index.html`](entrega/demo/index.html), una página desde la que
se accede a los vídeos:

- **Demostración completa** (`demo-ong-completa.mp4`, unos 8 minutos): 70 escenarios de las ocho
  historias, con casos normales, errores de validación, reglas de negocio, permisos y correos.
- **Un clip por historia** (`clips/hu-01.mp4` a `clips/hu-08.mp4`).
- **Resumen** (`demo-ong.mp4`, unos 2 minutos).

---

## 12. Anexos

### 12.1 Repositorio

<https://github.com/nmp55-ua/IWEB_ONG>

### 12.2 Especificaciones completas

| Spec | Documentos |
|---|---|
| Común | [constitución](../.specify/memory/constitution.md) · [plan común](../specs/plan-comun.md) · [modelo de datos](../specs/modelo-datos.md) · [convenciones](../CONVENCIONES.md) |
| spec-001 · HU-01 | [spec](../specs/spec-001/spec.md) · [plan](../specs/spec-001/plan.md) · [tasks](../specs/spec-001/tasks.md) · [refinamiento](../specs/spec-001/refinamiento/) |
| spec-002 · HU-02 | [spec](../specs/spec-002/spec.md) · [plan](../specs/spec-002/plan.md) · [tasks](../specs/spec-002/tasks.md) · [refinamiento](../specs/spec-002/refinamiento/) |
| spec-003 · HU-03 | [spec](../specs/spec-003/spec.md) · [plan](../specs/spec-003/plan.md) · [tasks](../specs/spec-003/tasks.md) · [refinamiento](../specs/spec-003/refinamiento/) |
| spec-004 · HU-04 | [spec](../specs/spec-004/spec.md) · [plan](../specs/spec-004/plan.md) · [tasks](../specs/spec-004/tasks.md) · [refinamiento](../specs/spec-004/refinamiento/) |
| spec-005 · HU-05 | [spec](../specs/spec-005/spec.md) · [plan](../specs/spec-005/plan.md) · [tasks](../specs/spec-005/tasks.md) · [refinamiento](../specs/spec-005/refinamiento/) |
| spec-006 · HU-06 | [spec](../specs/spec-006/spec.md) · [plan](../specs/spec-006/plan.md) · [tasks](../specs/spec-006/tasks.md) · [refinamiento](../specs/spec-006/refinamiento/) |
| spec-007 · HU-07 | [spec](../specs/spec-007/spec.md) · [plan](../specs/spec-007/plan.md) · [tasks](../specs/spec-007/tasks.md) · [refinamiento](../specs/spec-007/refinamiento/) |
| spec-008 · HU-08 | [spec](../specs/spec-008/spec.md) · [plan](../specs/spec-008/plan.md) · [tasks](../specs/spec-008/tasks.md) · [refinamiento](../specs/spec-008/refinamiento/) |

Documentos de entrega en [`docs/entrega/`](entrega/): historias de usuario finales, dossier de
refinamiento, matriz de trazabilidad (con recorridos y registro mínimo), tres situaciones por
historia, memoria con las iteraciones y valoraciones personales, y regresión final.

### 12.3 Glosario

| Término | Significado |
|---|---|
| Aportación | Cada pago de un donante: una donación puntual o una cuota de socio |
| Socio | Donante con una suscripción de cuota periódica (mensual, trimestral o anual) |
| Vínculo verificado | Relación entre una cuenta y su ficha de donante, creada con un enlace de un solo uso enviado a su correo |
| Certificado fiscal | Documento anual con el total donado en el ejercicio, para la declaración de la renta |
| Código de verificación | Código del certificado que cualquiera puede comprobar en una página pública |
| Inscripción | Plaza de un voluntario en una actividad: confirmada, en lista de espera o cancelada |
| Lista de espera | Cola en orden de llegada de una actividad completa; avanza sola al liberarse una plaza |
| Actividad celebrada | Actividad publicada cuyo inicio ya ha pasado; solo en ellas se pasa lista |
| Webhook | Notificación firmada que Stripe envía al back-end para confirmar un cobro |
| Spec Kit | Herramienta de GitHub para el desarrollo guiado por especificaciones |
| `clarify` / `analyze` / `converge` | Comandos de Spec Kit para resolver dudas de la spec, buscar incoherencias entre documentos y contrastar el código con la spec |
