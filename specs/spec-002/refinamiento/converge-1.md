# Primer diagnóstico de convergencia — HU-02

**Fecha:** 2026-11-11 · **Rama:** spec-002 · **Base:** 0cc28b1.

**Responsable:** Nada · **Revisor:** Javi.

## Resultado

Se identifican dos hallazgos de gravedad baja: limpieza del controlador de medición ante error y coherencia del estado documental. No se identifican nuevas brechas funcionales del historial en la lectura realizada. El cierre técnico queda pendiente de T036–T037 y de su comprobación posterior. La revisión externa y la integración siguen pendientes.

## Alcance y método

Se aplica el procedimiento local `.claude/skills/speckit-converge/SKILL.md` sobre especificación, plan, tareas y constitución. El diagnóstico incluye contratos, modelo de lectura, código de consulta, isla React, formato, página, menú, pruebas y controladores del banco. Las actualizaciones documentales de T031–T035 y la simplificación posterior del README y LEEME forman parte del árbol examinado, todavía sin commit.

La selección se comprueba por la ubicación real de los documentos de spec-002; no se ejecutan scripts que persistan configuración. No hay hooks de converge registrados. Se conserva el contenido previo de tareas y se añaden únicamente las nuevas tareas al final. El informe se guarda por la petición de conservar el diagnóstico antes de corregir.

Esta revisión es estática y documental: no repite las suites, el build ni los recorridos de navegador acreditados. Se contrastan sus registros existentes y la traza del intento 04; se inspecciona su captura visible. No supone una nueva inspección visual de todas las capturas ni una auditoría de seguridad exhaustiva.

## Hallazgos

| ID       | Tipo        | Gravedad | Evidencia                                                                                                                                                                                                                                                                                                                 | Trabajo restante                                                                                                                                                                                                                                         |
| -------- | ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CONV-001 | partial     | Baja     | `backend/src/modulos/donaciones/pruebas/medicion-historial.js:44–48`: dentro de finally, se espera `banco.llamadas()` antes de `banco.cerrar()`. El método de contadores puede rechazar por timeout; en ese caso no se alcanza el cierre explícito del controlador.                                                       | Garantizar cierre mediante un finally anidado u orden equivalente, incluso si falla la obtención de contadores. Añadir una regresión dirigida que conserve el error y compruebe que se intenta liberar los recursos. Origen: quickstart §5, T022 y T024. |
| CONV-002 | contradicts | Baja     | `plan.md:43` declara que el cumplimiento ejecutado de los criterios no se da por realizado, mientras que el estado inicial y la matriz recogen validación ejecutada. Los pasos 2 y 5 atribuyen apertura/cierre de transacción al servicio; el código los realiza íntegramente en el repositorio antes de componer el DTO. | Alinear el párrafo y la descripción de responsabilidades con el código y las evidencias. Mantener explícitamente pendiente la revisión de Javi y conservar históricos e intentos fallidos. Origen: constitución III y diseño de consulta del plan.       |

CONV-001 afecta al soporte de pruebas, no al endpoint ni a datos de producción. Es una ruta de error deducida del código, no un incidente observado en las mediciones guardadas. CONV-002 no exige cambiar arquitectura ni repetir pruebas funcionales.

## Cobertura examinada

| Obligaciones          | Código y evidencia contrastados                                                                                                                            | Balance                                                             |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| FR-001, FR-006; E1/E3 | Consultas restringidas por Donante y estado confirmada; pruebas de modalidades, exclusiones y más de 60 filas.                                             | Sin brecha nueva identificada.                                      |
| FR-002; E1/E4         | Año Madrid, rango semiabierto, orden SQL por fecha/ID; fechas y BIGINT contrastados en pruebas y evidencia visible.                                        | Sin brecha nueva identificada.                                      |
| FR-003; SC-001        | SUM NUMERIC textual, formato anual sin flotantes, instantánea consistente y contraste con servicio real HU-03 tras reconciliación.                         | Sin brecha nueva identificada.                                      |
| FR-004; E2            | Fecha, importe, modalidad y proyecto o fondo general; proyecto inactivo incluido.                                                                          | Sin brecha nueva identificada.                                      |
| FR-005; E4/E8         | Filtro validado, retirada, errores y descarte de respuestas antiguas.                                                                                      | Sin brecha nueva identificada.                                      |
| FR-007; E6; SC-003    | Usuario autenticado del servidor, rol y vínculo por usuario_id; cabeceras privadas, sin selectores de propietario ni acceso por correo o permiso invitado. | Sin brecha nueva identificada.                                      |
| FR-008; E5/E7/E8      | Sin vínculo, vacío global y año sin resultados diferenciados, sin POST automático.                                                                         | Sin brecha nueva identificada.                                      |
| E9; SC-002            | Intento 04: 638,20 ms, 60 filas y cinco grupos, pestaña visible 1280×720. Conserva los incumplimientos anteriores y sus condiciones.                       | Acreditado en el entorno documentado; no es una garantía universal. |

Se examinan los doce principios de la constitución, sin identificar una nueva infracción funcional. Se reutilizan entidades, middleware, componentes y servicios; no hay nuevas migraciones ni dependencias. Los cambios compartidos de producto se limitan a la entrada reservada del menú. El servicio fiscal se importa en pruebas sin modificar el módulo de HU-03.

## Documentación, evidencias y archivos

- Los enlaces locales de los documentos Markdown de HU-02 resuelven a destinos existentes.
- El análisis de textos Markdown, JSON y TXT no detecta patrones de claves Stripe, tokens GitHub o conexiones PostgreSQL con contraseña. Es una comprobación acotada de patrones, no una garantía de ausencia de cualquier dato sensible.
- Los registros finales conservan 442/442 pruebas de backend, 26/26 de frontend y build correcto. No se presentan como ejecuciones nuevas de este diagnóstico.
- La documentación operativa se concentra en README, LEEME y quickstart; decisiones, pruebas y límites permanecen en los documentos técnicos y de refinamiento. La mención de responsables y revisores corresponde al reparto del equipo.
- Las frases de estado de informes anteriores describen sus respectivas fases. No constituyen por sí mismas un pendiente vigente ni deben borrarse para aparentar un resultado uniforme.
- El material temporal de Oleaje y sus dependencias, ajeno a la ONG y nunca versionado, fue retirado en la limpieza previa. No se modifica la evidencia de HU-02. Quedan siete archivos sin seguimiento antes de este informe: configuración local, dos documentos y cuatro registros finales; los directorios vacíos output/tmp no se versionan.

## Siguiente paso

Resolver T036–T037 en un bloque acotado, conservar este primer diagnóstico y registrar la regresión de la limpieza. Después realizar una nueva comprobación de convergencia. No se requieren pagos ni nuevas mediciones para una corrección exclusiva del cierre de recursos que no altera el observador o el producto.

No se han hecho commits, push, merge, cambios de rama ni comunicaciones externas. No se declara revisión de Javi ni incorporación a main.
