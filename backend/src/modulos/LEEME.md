# Módulos

| Carpeta                  | Responsable | Specs                                          |
| ------------------------ | ----------- | ---------------------------------------------- |
| `auth/`                  | Común       | inicio de sesión, registro, `GET /api/auth/yo` |
| `proyectos/`             | Común       | `GET /api/proyectos`                           |
| `donaciones/`            | Nada        | spec-001, spec-002                             |
| `certificados-informes/` | Rubén       | spec-003, spec-004                             |
| `voluntariado/`          | Javi        | spec-005, spec-006                             |
| `actividades/`           | Nicole      | spec-007, spec-008                             |

Cada módulo tiene estas capas (plan-comun.md §1):

- `rutas.js`: rutas y `requiereRol(...)`. Exporta un `Router` que se registra en `src/app.js`.
- `controlador.js`: valida la entrada con zod y da forma a la respuesta.
- `servicio.js`: reglas de negocio y «cada uno ve lo suyo». Lanza `ErrorApi` para los errores.
- `repositorio.js`: SQL parametrizado (`consulta` y `transaccion` de `db/pool.js`).
- `servicio.test.js`: pruebas de las reglas críticas.

Un módulo puede llamar al `servicio.js` de otro, nunca a su repositorio.

Lo común está en `middleware/` (`requiereRol`, `ErrorApi`) y en `servicios-comunes/`
(`fechas`, `importes`, `csv`, `pdf`, `correo`, `pasarela`). No se duplica: si falta algo, se
propone al grupo y se añade ahí.

Express 4 no captura por sí solo los errores de funciones `async`: envolved los controladores
con `asincrono(...)` de `middleware/asincrono.js`.

## Donaciones — HU-01 en spec-001

Implementa donación puntual y alta/cuotas de socio. No incluye historial HU-02 ni
certificados HU-03. Contrato de rutas y permisos:
[api-donaciones.md](../../../specs/spec-001/contracts/api-donaciones.md).

| Método y ruta                                          | Uso                                                                        |
| ------------------------------------------------------ | -------------------------------------------------------------------------- |
| GET `/api/donaciones/contexto`                         | Contexto de sesión y CSRF, sin exigir cuenta.                              |
| POST `/api/aportaciones`                               | Preparar o recuperar la misma operación de Checkout.                       |
| GET `/api/aportaciones/referencia/:referencia`         | Resultado privado por permiso de operación o cuenta vinculada propietaria. |
| POST `/api/aportaciones/referencia/:referencia/correo` | Reintentar exclusivamente el correo, con permiso, origen y CSRF.           |
| POST `/api/donantes/vinculaciones`                     | Solicitud autenticada del enlace de verificación.                          |
| POST `/api/donantes/vinculaciones/confirmar`           | Confirmación explícita, misma cuenta y enlace de un solo uso.              |
| POST `/api/pasarela/webhook`                           | Firma y cuerpo crudo, antes de JSON y del middleware de sesión en app.js.  |

La autorización de navegador dura ocho horas absolutas por operación; la referencia
sola no concede acceso. El webhook no necesita sesión, origen ni CSRF del navegador.
El vínculo verificado se conserva en `donantes.usuario_id`; no se deduce del correo.

Dominio en 004; soporte técnico en 009 provisional. El servicio evita duplicados por
pago/factura, conserva aportaciones confirmadas y procesa la cancelación comunicada por
Stripe sin borrar cuotas anteriores. No hay edición fiscal, reembolso, cambio de cuota
o baja desde la aplicación. SMTP fallido no revierte un cobro; su reintento está separado.

Los servicios comunes conservan sus interfaces anteriores: la pasarela añade preparación
pura, instantánea e idempotencia y consultas canónicas; correo admite opciones de tiempos
solo para quien las indique. Fuente y límites en los [contratos](../../../specs/spec-001/contracts/cambios-comunes.md).
El [quickstart](../../../specs/spec-001/quickstart.md) define pruebas aisladas y preparación
de Stripe; la [matriz](../../../specs/spec-001/refinamiento/matriz-validacion-01.md) recoge resultados.
Este estado en rama no equivale a aprobación o incorporación compartida.

## Certificados — HU-03 en spec-003

Certificado fiscal anual: emisión, regeneración por confirmación tardía, descarga en PDF y
verificación pública. Contrato: [api-certificados.md](../../../specs/spec-003/contracts/api-certificados.md).

| Método y ruta                                | Uso                                                              |
| -------------------------------------------- | ---------------------------------------------------------------- |
| GET `/api/yo/certificados`                   | Certificados del Donante vinculado a la cuenta (rol donante).    |
| GET `/api/yo/certificados/:ejercicio/pdf`    | PDF propio de un ejercicio cerrado; 404 si no es propio o falta. |
| GET `/api/certificados/verificacion?codigo=` | Pública: válido con datos mínimos o `{ valido: false }`.         |

Lee `donantes` y `aportaciones` con SQL propio (solo confirmadas, por `fecha_cobro` y
`rangoAnio`), sin usar el repositorio de donaciones. `tarea.js` (programada en `servidor.js`)
reconcilia cada hora los ejercicios cerrados; `npm run certificados -- --ejercicio 2025` hace lo
mismo a mano. Tabla `certificados_fiscales` en `008_certificados.sql`.

## Informes — HU-04 en spec-004

Informe de recaudación y voluntariado para la junta, en pantalla, CSV y PDF. Contrato:
[api-informes.md](../../../specs/spec-004/contracts/api-informes.md).

| Método y ruta                                                 | Uso                                                              |
| ------------------------------------------------------------- | ---------------------------------------------------------------- |
| GET `/api/informes?desde&hasta&proyectoId&agrupacion`         | Informe por proyecto (y periodo), subtotales y total (administrador). |
| GET `/api/informes/csv?…`                                     | El mismo informe en CSV (`;`, coma decimal, UTF-8 con BOM).      |
| GET `/api/informes/pdf?…`                                     | El mismo informe en PDF.                                         |
| GET `/api/informes/proyectos`                                 | Todos los proyectos, también los inactivos, para el filtro.      |

Lee aportaciones, actividades, inscripciones y asistencias con SQL propio y solo cifras
agregadas; las tres salidas salen de `servicio.generarInforme`. Sin tablas propias.
