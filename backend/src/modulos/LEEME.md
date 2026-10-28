# Módulos

| Carpeta | Responsable | Specs |
|---|---|---|
| `auth/` | Común | inicio de sesión, registro, `GET /api/auth/yo` |
| `proyectos/` | Común | `GET /api/proyectos` |
| `donaciones/` | Nada | spec-001, spec-002 |
| `certificados-informes/` | Rubén | spec-003, spec-004 |
| `voluntariado/` | Javi | spec-005, spec-006 |
| `actividades/` | Nicole | spec-007, spec-008 |

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
