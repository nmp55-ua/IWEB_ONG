# Paquete de revisión técnica — HU-02

**Responsable**: Nada · **Revisor**: Javi · **Fecha**: 2026-11-10 · **Rama**: spec-002.

**Estado**: preparación de revisión T035. Converge y revisión externa pendientes; no acredita aprobación, publicación de PR o incorporación a main.

## Base y commits comprobados

HEAD al iniciar T031–T035: **0cc28b1e44a1d932cf1da61cdc869883652693c4**. Al inicio el árbol seguido estaba limpio; .claude/launch.json, output/ y tmp/ permanecían sin seguimiento y se conservan. Los siguientes commits existen en el historial local consultado; no se deduce su publicación remota:

| Commit  | Contenido                                                        |
| ------- | ---------------------------------------------------------------- |
| 453bfe8 | Clarify: vínculo, vacíos y alcance de medición.                  |
| 24282d5 | Plan, tareas y primer analyze.                                   |
| 85d939f | Backend privado, consistencia y contraste fiscal.                |
| ca172ff | Evidencias T001–T014.                                            |
| 3b5dba4 | Interfaz y formato exacto de totales.                            |
| 85f2299 | Banco integrado y evidencias T015–T024.                          |
| 81d21f9 | Soporte de recorridos y medición real.                           |
| 0cc28b1 | Evidencias visibles y T030, con intentos anteriores conservados. |

La documentación y evidencias nuevas de T031–T035 se preparan sobre esa base y permanecen sin commit en esta entrega. No se incorpora main ni se consulta/afirma el estado actual de ramas remotas.

## Implementación a revisar

- Página Astro `/mis-aportaciones`, isla React y funciones puras locales. La entrada reservada «Mis aportaciones» se activa solo para donante en Menu.jsx; se conservan Donar, Actividades, Mi calendario, Certificados y los enlaces/permisos existentes.
- GET privado `/api/yo/aportaciones`, filtro opcional `anio`; middleware de sesión/rol y resolución de Donante por usuario_id. Correo, IDs/referencias conocidos y permiso invitado no seleccionan propietario ni conceden historial.
- Vínculo, resúmenes y detalle en una instantánea REPEATABLE READ, READ ONLY. Solo confirmadas, por fecha_cobro en Europe/Madrid; orden fecha/ID numérico descendente, ID textual en JSON.
- Importes NUMERIC y totales en texto, con formato anual sin Number ni máximo individual. Estado de la suscripción o del correo no elimina cuotas confirmadas. Proyecto asociado, incluso inactivo, o fondo general.
- Tres estados distintos: sin vínculo, historial global vacío y año sin resultados. Carga, validación, errores, reintento del filtro y descarte de respuestas antiguas o posteriores al desmontaje.
- No se añaden tablas, migraciones, dependencias o configuración del producto. No se modifican app.js, autenticación, cookies, roles, webhook, servicios comunes o módulos de compañeros por HU-02. La ampliación del banco pertenece exclusivamente a pruebas.

Contratos: [HTTP](../contracts/api-historial.md) e [interfaz](../contracts/interfaz-historial.md). Preparación reproducible: [quickstart](../quickstart.md).

## Evidencias y comandos

Comprobaciones de esta entrega sobre 0cc28b1, sin cambios de código posteriores:

| Directorio / comando                                                                                     | Resultado                                       |
| -------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| backend: `npm test -- src/modulos/donaciones src/servicios-comunes/correo.test.js --no-file-parallelism` | 442/442, 15 archivos, código 0; Vitest 71,91 s. |
| frontend: `npm test -- src/components/donaciones/historial.test.js`                                      | 26/26, código 0; 210,10 ms del ejecutor.        |
| frontend: `npm run build`                                                                                | Código 0; Astro 11,08 s.                        |

AHORA_SIMULADO se retira solo del proceso de regresión; el contraste fiscal inyecta su reloj. Base ong_test_hu01, esquemas propios y Stripe/SMTP simulados. No se ejecutan suites ajenas con limpieza de tablas de desarrollo. Los [logs finales](evidencias-finales-01/) y el apartado T031–T035 de [validación local](validacion-local-01.md) conservan resultados y límites.

Se reutiliza evidencia de navegador registrada en 0cc28b1, con el mismo código funcional: [interfaz](validacion-interfaz-01.md) y [cierre T030](cierre-t030-01.md), respaldados por capturas, red, controles SQL y traza. Rendimiento: **638,20 ms**, 60 cuotas y cinco grupos correctos, en las condiciones documentadas; no se vuelve a medir ni se reconstruye una duración desde timestamps. Se conservan los resultados anteriores 2.745,30 ms, 4.258,90 ms y el intento inválido por recursos.

El [contraste fiscal](validacion-fiscal-01.md) usa servicio/repositorio reales de HU-03 con transacción y correo de pruebas: certificado, historial y SUM coinciden en 1.00; tras confirmación tardía y reconciliación, en 4.00. Antes de reconciliar se conserva el desfase esperado. El mismo caso aprueba de nuevo en las 38 pruebas de historial incluidas en la regresión final. No se ejecuta cron, su CLI ni pruebas destructivas de certificados; no se modifican archivos de Rubén.

El balance completo está en [matriz-validacion-01.md](matriz-validacion-01.md): 8 FR, 9 escenarios y 3 SC, con evidencia distinta para API, navegador y duración. El build no sustituye esas pruebas.

## Revisión documental y conservación de evidencias

Se actualizan README, LEEME de módulos y quickstart con rutas, consulta privada, comandos existentes y aislamiento. Plan, investigación y encabezados de contratos reflejan implementación en rama, sin cambiar payloads ni decisiones funcionales. Se retiran referencias operativas a herramientas no registradas o generación futura que no describían el estado actual; se mantiene la procedencia de fases, responsables y evidencias metodológicas.

Los informes históricos no se reescriben. validacion-local-01.md se amplía mediante un apartado nuevo, conservando íntegro el texto anterior. Los estados «pendiente» de entregas previas son relatos fechados; la matriz y tareas expresan el balance vigente.

Ajustes editoriales propuestos **sin aplicar** a históricos:

- En validacion-interfaz-01.md, la explicación inicial de cómo se invocó el procedimiento podría resumirse en una referencia metodológica, sin cambiar pasos ejecutados ni atribuciones.
- En medicion-historial-01.md y diagnostico-rendimiento-01/02.md, las limitaciones de la herramienta de navegador podrían agruparse en una nota metodológica. Deben conservarse errores, restricciones, cambios de escala/memoria, intentos y ausencia de perfil CPU.
- No se propone sustituir los antiguos resultados fuera de umbral por el favorable, eliminar fases rojas, descontar esperas o convertir incertidumbres de causa en conclusiones sobre SQL, memoria o render.

Estas propuestas no son correcciones técnicas pendientes ni autorización para modificar evidencias anteriores. El apartado nuevo de validación local registra la adaptación del procedimiento de este bloque de forma separada del contenido de producto.

## Controles pendientes para Javi y la integración

1. **Converge**: diagnóstico de coherencia actual de requisitos, diseño, tareas e implementación; no ejecutado en este bloque.
2. **Revisión real de Javi**: comprobar propiedad por usuario_id, estados sin datos, formato y fechas, filtro/descarte de respuestas y activación mínima del menú. Preparar este documento no acredita revisión ni aprobación.
3. **Dependencia fiscal**: revisar el contraste posterior a reconciliación y la limitación de almacenamiento de HU-03, sin introducir un nuevo límite al historial ni regeneración desde el GET.
4. **Antes de main**: contrastar el destino actualizado y resolver conflictos de integración mediante el flujo del equipo. La revisión de esta rama no certifica otras ramas ni una integración futura.

No quedan huecos de aceptación identificados en la matriz, dentro de las comprobaciones descritas. Ese balance no sustituye converge ni permite declarar HU-02 terminada o aprobada.

## Inventario de esta entrega

Documentación modificada: README.md; backend/src/modulos/LEEME.md; specs/spec-002/plan.md, research.md, quickstart.md, tasks.md; contracts/api-historial.md y contracts/interfaz-historial.md; refinamiento/validacion-local-01.md (solo apartado nuevo).

Documentación nueva: specs/spec-002/refinamiento/matriz-validacion-01.md y este paquete revision-tecnica-01.md. Salidas nuevas en refinamiento/evidencias-finales-01/: regresion-backend.txt, pruebas-frontend.txt, build-frontend.txt y formato.txt. No hay archivos de código, migraciones, configuración o dependencias modificados en este bloque.
