# Plan técnico: HU-02 — Historial de aportaciones

**Rama**: `spec-002` · **Fecha**: 2026-11-10 · **Base examinada**: `453bfe8`

**Responsable**: Nada · **Revisor**: Javi

**Especificación**: [spec.md](spec.md) · **Decisiones funcionales**: [clarify-1.md](refinamiento/clarify-1.md)

**Estado vigente**: implementación validada en spec-002; converge y revisión de Javi pendientes. Véase la [matriz de aceptación](refinamiento/matriz-validacion-01.md). La base examinada indicada corresponde al diseño inicial.

## Resumen

Se implementa una consulta privada del historial en `/mis-aportaciones`, con un único endpoint `GET /api/yo/aportaciones`. El servidor resuelve el Donante por `donantes.usuario_id` a partir de la cuenta autenticada y devuelve sus aportaciones confirmadas, agrupadas por año de cobro en Europe/Madrid. La consulta no realiza cobros, vinculaciones, correcciones ni reconciliaciones fiscales.

Se reutilizan las cuatro capas del módulo donaciones, el middleware de roles, el cliente HTTP, las fechas y los componentes comunes. La lectura de vínculo, resúmenes y detalle comparte una instantánea de PostgreSQL. Las sumas se calculan con `NUMERIC` y viajan como texto decimal, sin aplicarles el límite individual de HU-01. No se requieren tablas, columnas, migraciones ni nuevas dependencias.

## Contexto técnico

| Aspecto          | Decisión                                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Plataforma       | Aplicación web existente: Node.js 22, módulos JavaScript ESM, Express 4, PostgreSQL 16; Astro 5, React 19 y Tailwind 3           |
| Persistencia     | Lectura de Usuario, Donante, Aportación y Proyecto definidos en el modelo común                                                  |
| Seguridad        | `requiereRol('donante')` y propietario obtenido del servidor; ninguna autorización por correo, referencia o sesión invitada      |
| Pruebas          | Vitest y Supertest en backend; `node --test` para funciones puras de frontend; navegador para presentación y duración            |
| Rendimiento      | SC-002: 60 cuotas en cinco años, grupos y totales visibles en menos de 2.000 ms desde la apertura autenticada y vinculada        |
| Alcance          | Historial completo y filtro anual, sin paginación que oculte parte del caso de aceptación; 60 no constituye un máximo de negocio |
| Efectos externos | Ninguna llamada a Stripe o SMTP al consultar; reutilización mediante navegación del flujo `/donar/vincular`                      |
| Dependencias     | HU-01 proporciona pagos y vínculo; HU-03 proporciona el contraste fiscal después de su reconciliación                            |

Las versiones mayores corresponden a los manifiestos y al entorno documentado; no se plantea actualizarlas. Los lockfiles permanecen vigentes. Las comprobaciones de ejecución constan en validacion-local-01.md.

## Comprobación de la constitución

| Principios                      | Antes de investigación                     | Después del diseño                                                                 |
| ------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------- |
| I–II: simplicidad y alcance     | Solo consulta de HU-02                     | Un GET y una página; sin servicios externos, correcciones o entidades nuevas       |
| III: verificabilidad            | Nueve escenarios y tres SC identificados   | Casos de API, interfaz, paridad fiscal y medición completa descritos en quickstart |
| IV: español, euros y fechas     | Se conservan las convenciones              | Fecha Madrid, dos decimales y totales exactos sin conversión a flotante            |
| V–VI: privacidad y conservación | Sin acceso por coincidencia de correo      | Propiedad en servidor, respuesta sin datos fiscales y transacción de solo lectura  |
| VII–IX: pila y aplicación común | Se inspeccionan los componentes existentes | Se amplía donaciones; se reutilizan autenticación y contratos comunes              |
| X–XII: revisión y colaboración  | Nada/Javi, rama propia                     | Revisión pendiente; no se alteran reglas comunes ni módulos ajenos                 |

No se identifican excepciones a la constitución ni decisiones funcionales bloqueantes. Las comprobaciones ejecutadas y sus límites constan en la [matriz de aceptación](refinamiento/matriz-validacion-01.md). La aprobación de Javi y la comprobación posterior de convergencia permanecen pendientes.

## Diseño de la consulta

1. El middleware común identifica la cuenta activa y exige rol donante. El cliente no elige Usuario ni Donante.
2. El servicio valida el filtro y delega la lectura en `historialDeUsuario`. El repositorio abre la transacción mediante `enTransaccion` y establece `REPEATABLE READ, READ ONLY` antes de cualquier lectura.
3. El repositorio busca el vínculo por `usuario_id`. Sin vínculo devuelve el estado correspondiente y no consulta aportaciones por correo.
4. Con vínculo obtiene los resúmenes de todos sus años confirmados y el detalle de todos los años o del año seleccionado. El detalle se ordena por `fecha_cobro DESC, id DESC`; los grupos, por año descendente.
5. El repositorio completa la transacción y libera la conexión mediante `enTransaccion` antes de devolver la lectura. Después, el servicio compone el DTO descrito en el [contrato HTTP](contracts/api-historial.md), utilizando los totales SQL del mismo conjunto y de la misma instantánea.
6. La isla React muestra los estados definidos en el [contrato de interfaz](contracts/interfaz-historial.md). Las respuestas antiguas de filtros se descartan por secuencia de solicitud.

La transacción permite que un cobro confirmado durante la consulta aparezca íntegramente en la siguiente petición, sin mezclar detalle antiguo con total nuevo. No se mantienen conexiones mientras se espera al usuario ni se usan bloqueos de negocio de HU-01.

## Estructura de la solución

Documentos de diseño:

```text
specs/spec-002/
  plan.md
  research.md
  data-model.md
  contracts/api-historial.md
  contracts/interfaz-historial.md
  quickstart.md
```

Archivos de implementación:

```text
backend/src/modulos/donaciones/
  rutas.js                       # GET protegido, dentro del router ya registrado
  controlador.js                 # adaptación HTTP y cabeceras privadas
  servicio.js                    # filtro, propiedad y composición del resultado
  repositorio.js                 # consultas de solo lectura
  historial.test.js              # API, persistencia aislada y contraste con HU-03
  pruebas/historial-local.js      # banco aislado de interfaz y rendimiento
frontend/src/pages/mis-aportaciones.astro
frontend/src/components/donaciones/
  HistorialAportaciones.jsx
  historial.js                   # formato exacto de sumas anuales
  historial.test.js
frontend/src/components/comunes/Menu.jsx
```

El ajuste compartido es la activación de la entrada de donante «Mis aportaciones», ya reservada en `Menu.jsx`, manteniendo los enlaces y permisos existentes. Se incluye en el paquete de revisión; no redefine un contrato común. `app.js`, autenticación, cookies, servicios de importes y fechas, migraciones y módulos de otros responsables permanecen fuera de los cambios de HU-02.

## Validación y trazabilidad

| Requisitos                       | Comprobación prevista                                                                                             |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| FR-001, FR-006; escenarios 1 y 3 | Mezcla puntual/cuotas y estados: solo confirmadas; ningún truncamiento a 60                                       |
| FR-002; escenarios 1 y 4         | Límites de año Madrid, orden de grupos y desempate numérico de ID con fecha idéntica                              |
| FR-003; SC-001                   | Total SQL exacto, suma superior al máximo individual, igualdad con detalle y certificado reconciliado             |
| FR-004; escenario 2              | Fecha, dos decimales, modalidad, proyecto incluso inactivo o fondo general                                        |
| FR-005; escenarios 4 y 8         | Año válido, inexistente, filtro inválido y eliminación del filtro                                                 |
| FR-007; escenario 6; SC-003      | Sin sesión, rol incorrecto, usuario ajeno, correo coincidente, ID grande y permiso invitado insuficiente          |
| FR-008; escenarios 5, 7 y 8      | Tres estados diferenciados y enlace de vinculación sin POST automático                                            |
| Escenario 9; SC-002              | Navegador: 60 cuotas, cinco grupos y cinco totales correctos visibles en menos de 2.000 ms, incluida la obtención |

El [quickstart](quickstart.md) concreta fixtures, aislamiento, comandos existentes, observaciones de navegador y conservación de resultados. No se sustituye evidencia de interfaz por respuestas de API ni se presenta una simulación como pago real.

## Dependencias y límites

- El historial refleja confirmaciones persistidas por HU-01. No interpreta eventos ni consulta el estado remoto de Stripe.
- La igualdad con HU-03 se comprueba sobre un ejercicio cerrado, después de `reconciliarEjercicio` y sin nuevas escrituras entre ambas lecturas. El desfase anterior a la reconciliación no se corrige regenerando desde HU-02.
- El índice existente por Donante, estado y fecha de cobro es el punto de partida. Solo una medición que demuestre una necesidad justificaría proponer otro índice; no se reserva una migración.
- El contrato devuelve el nombre del Proyecto asociado y no crea una instantánea histórica de nombres. No permite reasignar destinos ni corrige aportaciones confirmadas.
- No existe un máximo funcional de años o filas. El caso de 60 cuotas verifica SC-002 y no garantiza rendimiento para cualquier volumen o equipo.

## Procedencia metodológica

El diseño se elaboró el 2026-11-10 sobre 453bfe8 y quedó registrado en 24282d5, siguiendo el [procedimiento local de plan](../../.claude/skills/speckit-plan/SKILL.md). Se generaron seis documentos, con selección temporal de spec-002 sin persistir configuración. La revisión inicial comprobó formato y 15 enlaces locales; no incluía pruebas funcionales.

El [primer analyze](refinamiento/analyze-1.md), los informes de implementación y las mediciones conservan la evolución posterior. La actualización documental mantiene alcance y criterios. El [paquete de revisión](refinamiento/revision-tecnica-01.md) identifica commits, comprobaciones y límites vigentes; no acredita aprobación externa.
