# Plan técnico común — SI-13 Donaciones y Voluntariado

**Fecha**: 2026-10-28 · **Rama**: `main` · **Specs**: spec-001 a spec-008 ·
**Modelo de datos**: [modelo-datos.md](modelo-datos.md)

Este plan es la base **compartida** por las 8 specs. El `plan.md` de cada spec lo referencia y
solo añade lo propio de su historia (pantallas, rutas, reglas de su `servicio.js`, tareas). Lo
que aquí se fija no se repite ni se contradice en los planes individuales. Para cambiarlo hace
falta el acuerdo del grupo (principio XII).

**Alineación de HU-01 (2026-11-06)**: ajustes preparados por Nada en `spec-001` para
revisión, a partir de PA1.1–PA1.8 y del diseño P-01–P-04. La documentación queda alineada
en esta rama; no acredita acuerdo colectivo, revisión de Rubén ni implementación.

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

*Comprobación documental de la base común. El diseño de HU-01 queda definido en spec-001;
la revisión de Rubén y la incorporación compartida siguen pendientes. No acredita pruebas
ni conformidad del código todavía inexistente de donaciones.*

| Principio | Cómo lo cumple este plan |
|---|---|
| I. Simplicidad | SQL directo sin ORM, sesiones en lugar de tokens, sin colas ni microservicios, valores derivados en vez de contadores. |
| II. Cero alcance fantasma | Solo se planifica lo de las specs; no se construyen respuestas a preguntas pendientes. PA1.1–PA1.8 están resueltas en HU-01. |
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
  coincide solo tras acreditar el acceso a ese buzón mediante un enlace de verificación
  (PA1.2 y PA1.3). Esta comprobación se limita a la vinculación en donaciones; no cambia
  el registro ni el inicio de sesión generales. El flujo público de donaciones ofrece
  /donar/vincular desde formulario y resultado. Sin token se entra con FormEntrar existente
  y se solicita el enlace; recibir 202 solo muestra un aviso genérico, sin establecer vínculo.
  El Voluntario se crea al completar el perfil
  de voluntario la primera vez.

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
| donaciones (001) | `POST /api/aportaciones` → URL de pago · `GET /api/aportaciones/referencia/:ref` (confirmación) · `POST /api/pasarela/webhook` | creación sin cuenta / confirmación autorizada por operación / pasarela |
| donaciones (002) | `GET /api/yo/aportaciones?anio=2025` | donante |
| certificados-informes (003) | `GET /api/yo/certificados` · `GET /api/yo/certificados/:ejercicio/pdf` · `GET /api/certificados/verificacion?codigo` | donante / público |
| certificados-informes (004) | `GET /api/informes?desde&hasta&proyectoId&agrupacion` · `…/csv` · `…/pdf` | administrador |
| voluntariado (005) | `GET /api/actividades/disponibles?proyectoId&desde&hasta` · `POST /api/actividades/:id/inscripciones` · `PATCH /api/yo/inscripciones/:id` (cancelar) · `PUT /api/yo/perfil-voluntario` | público / voluntario |
| voluntariado (006) | `GET /api/yo/calendario?desde&hasta` | voluntario |
| actividades (007) | `GET/POST /api/actividades` · `PATCH /api/actividades/:id` (editar, publicar, cancelar) · `GET /api/actividades/:id/inscripciones` | coordinador |
| actividades (008) | `GET/PUT /api/actividades/:id/asistencias` · `GET /api/yo/horas` | coordinador / voluntario |

Cada plan individual detalla los cuerpos de petición y respuesta de sus rutas en su
`contracts/`, respetando este formato.

## 5. Pasarela de pago (HU-01; Stripe en modo de pruebas)

- **Alcance v1**: Stripe Checkout alojado, exclusivamente tarjeta, EUR, entre 1,00 € y
  999.999,99 €, ambos incluidos, máximo dos decimales. Es el límite elegido para esta
  aplicación, no un máximo universal de Stripe. La ONG recoge modalidad, importe, destino
  y datos fiscales; nunca tarjeta. No hay descuentos, pruebas gratuitas ni cargos divididos.
- **Donante antes del pago (PA1.5 y PA1.6)**: ambas modalidades se completan sin cuenta.
  Si correo y NIF/NIE entran en conflicto, o el mismo NIF/NIE presenta cambios reales en
  correo, nombre, apellidos o dirección, se detiene antes de Checkout con mensaje genérico,
  sin exponer datos guardados, sobrescribir, duplicar o mezclar identidades. La comparación
  normaliza NFC, espacios y mayúsculas según [research de HU-01](spec-001/research.md).
  La exclusión concurrente se aplica por NIF/NIE y correo; no añade UNIQUE al correo.
- **Preparación**: POST aportaciones crea/reutiliza Donante y crea aportación, operación
  y, para socio, suscripción pendiente en transacción. Guarda el permiso en sesión antes de
  redirigir. Clave UUID, huella normalizada e idempotencia Stripe mantienen una sola operación
  ante reenvío o respuesta incierta. Se conserva la instantánea de solicitud Checkout para
  repetir el cuerpo exacto. La creación activa se distingue por bloqueo de sesión PostgreSQL,
  con límite local no renovable de 23 horas desde creado_en; véase el protocolo de HU-01.
  Se conserva Checkout abierto para reintentar; no se
  crea otro pago automáticamente cuando el anterior no tiene un cierre acreditado.
- **Confirmación**: webhook firmado y recursos canónicos actuales, independientemente del
  navegador. Puntual se confirma por PaymentIntent; cuotas por Invoice. Checkout solo
  correlaciona, sin confirmar otra primera cuota. La factura inicial reutiliza la aportación
  pendiente del alta; cada ciclo posterior se registra una vez. Los estados y claves únicas
  tienen su única definición en [modelo-datos.md](modelo-datos.md).
- **Reconciliación**: bloqueos por pago puntual o suscripción, evento único y claves de
  pago/factura impiden duplicados. Un rechazo recuperable que termina en cobro confirma la
  misma fila. Las confirmadas no retroceden por un evento antiguo. La primera cuota activa
  el alta salvo cierre definitivo actual; una cuota tardía no reactiva una suscripción cancelada.
  El retorno a cancel_url o perder sesión no prueba cancelación ni modifica dinero.
- **Cuotas posteriores (PA1.8)**: fallo registrado e informado, sin sumar, alterar anteriores
  ni cancelar por sí solo. La cancelación efectiva posterior de pasarela sí se procesa.
  No se ordenan cobros adicionales. Próxima fecha solo desde una previsión futura de la
  pasarela; si falta o vence, «Pendiente de confirmación». El modelo conserva instante y
  proyección DATE para comprobar el vencimiento incluso dentro del día.
- **Resultado sin cuenta (PA1.7)**: permiso por referencia en req.session.donaciones,
  caducidad absoluta de ocho horas y sesión común vigente. No autoriza otras aportaciones,
  cuotas futuras o historial. Referencia o UUID solos no autorizan. Una cuenta donante
  vinculada tras enlace puede consultar sus aportaciones propias. No hay recuperación directa
  invitada al perder la sesión. Los POST propios requieren origen permitido y CSRF; el webhook,
  firma y cuerpo crudo. No se modifica el inicio de sesión ni el middleware de roles.

### 5.1 Contrato de la envoltura de Stripe

Único importador: `backend/src/servicios-comunes/pasarela.js`. Referencia del lockfile:
SDK 17.7.0; API explícita 2025-02-24.acacia. La instalación y la cuenta aún no se han verificado.
La configuración prevista del cliente usa timeout de 3000 ms y maxNetworkRetries 0. Los
fallos transitorios devuelven ErrorApi 503; no se registran respuestas completas con datos
personales. El módulo solo recibe proyecciones de los recursos, sin detalles de tarjeta.

| Función | Contrato de diseño |
|---|---|
| prepararSesionPago({ centimos, descripcion, correo, referencia, periodicidad, metadatos }) | Función pura de la envoltura: produce los parámetros Checkout completos, con URL actuales y metadatos protegidos, sin red. Se guarda una sola vez como solicitud_checkout. |
| crearSesionPago({ centimos, descripcion, correo, referencia, periodicidad, metadatos, claveIdempotencia, solicitudCheckout }) | Firma anterior conservada; claveIdempotencia y solicitudCheckout son obligatorias para HU-01. Con instantánea usa exactamente ese cuerpo, sin recalcular URL/descripción; sin ella, conserva el comportamiento compatible de construirlo mediante prepararSesionPago. Devuelve { id, url }. Tarjeta/EUR y una línea de cantidad 1; mensual month/1, trimestral month/3, anual year/1. |
| Metadatos de creación | Referencia y módulo donaciones en Session y en payment_intent_data.metadata o subscription_data.metadata, según modalidad; no permitir sobrescribir referencia con metadatos arbitrarios. Sin NIF o dirección en metadatos. |
| verificarEvento(cuerpoCrudo, firma) | Firma y salida de evento verificadas como en la interfaz existente; ErrorApi 400 si no es válida. |
| obtenerSesionPago(id) | Session: id, status, payment_status, mode, client_reference_id, metadata, payment_intent, subscription, invoice, url, expires_at y livemode. |
| obtenerSesionDeSuscripcion(id) | Listar Session por subscription, límite 2 y sin paginación automática; exigir única coincidencia de referencia en el servicio. |
| obtenerPago(id) | PaymentIntent: id, amount, amount_received, currency, status, invoice, metadata y livemode. |
| obtenerFactura(id) | Invoice: id, subscription, payment_intent expandido a la proyección anterior, billing_reason, paid, status, paid_out_of_band, amount_paid, currency, status_transitions.paid_at, next_payment_attempt y livemode. |
| obtenerSuscripcion(id) | Subscription: id, metadata, status, latest_invoice, collection_method, current_period_end, cancel_at_period_end, cancel_at, canceled_at y livemode. |

La instantánea es interna de servidor, nunca un campo aceptado del navegador o devuelto por
la API. El servicio adquiere la exclusión con una conexión propia solo después del commit
de preparación y del guardado de sesión. Mientras la conserva, las consultas usan ese
cliente y no solicitan otro al pool; HTTP se realiza fuera de una transacción SQL.
Tras error se libera en finally; si la liberación no puede acreditarse, se destruye el
cliente. Al terminar la conexión, PostgreSQL libera el bloqueo; si aún sigue viva, otra
petición no lo fuerza y devuelve operación en curso. La reanudación conserva UUID, huella,
cuerpo, referencia y creado_en; al vencer la ventana desconocida solo cabe revisión.
El detalle está en el [protocolo de HU-01](spec-001/contracts/pasarela-stripe.md#exclusión-y-reanudación-de-la-creación).

Se conservan identificadores como texto, timestamps externos como segundos enteros y null
cuando proceda. La pertenencia, importe y moneda se comprueban antes de confirmar. Los
[eventos y reglas de reconciliación](spec-001/contracts/pasarela-stripe.md) son propios de HU-01;
no se añaden funciones para cobrar, modificar o cancelar desde la aplicación. P-05 es la
preparación del entorno antes de las pruebas reales, no una decisión abierta de diseño.

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
  - certificado disponible o actualizado (003);
  - plaza confirmada desde la lista de espera, actividad cancelada y cambio de fecha, hora o
    lugar de una actividad publicada (007).
  Si falla el envío, se registra el error y la operación **no** se deshace.
  Para la confirmación de aportaciones (HU-01, PA1.4), se conserva el pago confirmado y se
  muestran el resumen y el aviso de correo pendiente a quien tenga autorización para esa
  operación. Se permite reintentar únicamente el mismo correo, sin repetir cobros ni crear
  aportaciones o suscripciones; sin cuenta se aplica el límite de sesión de PA1.7. Un intento
  fallido o un aviso no cuentan como envío satisfactorio. El estado y resumen inmutable se
  conservan en correos_aportacion, definido en el modelo común, con unicidad por aportación
  y tipo. El aviso de fallo de cuota posterior es otro tipo de mensaje; no sobrescribe una
  confirmación ni concede acceso a cuotas por referencia.
  La interfaz compatible prevista es enviarCorreo({ para, asunto, texto }, opciones = {})
  con retorno booleano. HU-01 usa tiempoConexionMs 3000, tiempoSaludoMs 3000 y
  tiempoInactividadMs 5000, traducidos a connectionTimeout, greetingTimeout y socketTimeout.
  Sin esas opciones se mantiene el transporte y comportamiento actual de los otros módulos;
  no se muta su transporte compartido. Una reserva de envío propia de HU-01 dura treinta
  segundos, se renueva cada diez mientras vive la llamada y se guarda por comparación del
  número de intento reclamado. Si ya no conserva la reserva, relee el estado y no publica
  un éxito de ese intento antiguo. SMTP se ejecuta fuera de la transacción financiera. Se
  conserva el riesgo de duplicar un mensaje si el proceso cae tras aceptación SMTP y antes
  de persistir éxito; nunca se repite por ello el cobro. SMTP true no prueba recepción final.
  No hay trabajador o reintento automático programado; sin permiso para reintentar, un correo
  fallido puede seguir pendiente y SC-002 no se considera cumplido. Las reglas de los demás
  módulos de correo no cambian.
- **Certificados (003)**: una tarea `node-cron` cada hora en el minuto 5 (`Europe/Madrid`; la
  primera del año, el 1 de enero a las 00:05) emite los certificados de los ejercicios cerrados que
  falten y regenera los que hayan cambiado de total por una confirmación tardía (PA3.1). El mismo
  código se lanza a mano con `npm run certificados -- --ejercicio 2025`, que es lo que se usa para
  probarlo. Es idempotente gracias al único `(donante_id, ejercicio)`. Al emitir o regenerar se
  envía un correo de aviso sin el PDF adjunto (PA3.2); si falla, se registra y el certificado se
  mantiene. Detalle en [spec-003/research.md](spec-003/research.md).

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

### Incorporación de donaciones en dos entregas

La primera entrega es `004_donaciones.sql`, reservada a Nada: las tres tablas de dominio,
claves de pago/factura, previsión de suscripción e índice financiero del modelo común.
Se revisa con Rubén antes de su incorporación para desbloquear HU-02, HU-03 y HU-04 con un
contrato estable. No incluye interfaz ni tablas técnicas de operación.

La segunda entrega incorpora las cuatro tablas técnicas de HU-01 en una migración nueva.
Se asignará el siguiente número libre a partir de 009 al coordinar su incorporación; **009
no está reservado**. La dependencia es 004, no una migración futura de otro módulo. No se
reescribe 004 publicada ni se depende de que 006–008 estén implementadas. El migrador
aplica ficheros pendientes por nombre registrado: admite incorporar 004 a una base que ya
contiene 005. Se comprobarán ambas secuencias en una base exclusiva de pruebas. Esta rama
solo documenta la estrategia; todavía no hay SQL nuevo.

## 8. Pruebas y datos de prueba comunes

Para HU-01, [quickstart.md](spec-001/quickstart.md) concreta PowerShell y una base
ong_test_hu01 exclusiva. DATABASE_URL y TEST_DATABASE_URL se seleccionan explícitamente
antes de migrar y probar, preservando .env; no se omite la integración por configuración
ausente. P-05 se prepara solo antes de las pruebas reales de Stripe.


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
  - importes de HU-01: validación (0, negativo, 3 decimales, < 1 € o > 999.999,99 €), NIF/NIE y sumas al céntimo;
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

PA1.1–PA1.8 están resueltas funcionalmente en `specs/spec-001/spec.md` y reflejadas en los
ajustes de HU-01 preparados para revisión. Sus mecanismos técnicos están definidos en el
plan de esa historia y alineados en esta rama con el modelo común. Las preguntas de las demás specs se conservan a continuación.

PA3.1 y PA3.2 están resueltas en `specs/spec-003/spec.md` (clarify de 2026-11-04 y 2026-11-08).

El plan no las resuelve (principio II); se deciden en `/speckit-clarify` de cada spec y, si
cambian el modelo, se hace con una migración nueva acordada:
PA2.1 (correcciones de aportaciones), PA4.1 (el plan ya asume solo cifras agregadas, por el principio V), PA5.1 (edad),
PA5.2 (solapes), PA6.1 (.ics), PA7.1 (coordinador por proyecto), PA7.2 (plazo de aceptación),
PA8.1 (plazo de registro) y PA8.2 (asistencias parciales).
