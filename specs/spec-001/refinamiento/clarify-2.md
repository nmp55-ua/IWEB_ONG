# Informe de clarify — HU-01 — Actualización de decisiones

> **Estado actual:** HU-01 revisada por el revisor asignado e incorporada a main mediante la PR #4; `009_operativa_donaciones.sql` es la numeración definitiva. Los estados de preparación y revisión descritos en los apartados fechados corresponden a esas fases anteriores.

**Fecha**: 2026-11-04
**Rama**: `spec-001`
**Responsable**: Nada
**Revisor**: Rubén (revisión pendiente)
**Estado**: Cinco decisiones de clarify definidas. Sesión detenida; clarify NO completamente cerrado.
**Informe anterior**: [clarify-1.md](clarify-1.md), conservado sin modificar en este paso.

## Motivo y procedimiento

Tras las cinco respuestas de la sesión, quedan definidas las decisiones PA1.3 y PA1.5
para HU-01. Este informe actualiza su clasificación anterior como propuestas y emplea
una redacción impersonal. No registra una sexta pregunta ni una revisión realizada por
Rubén. Los ajustes del plan y del modelo comunes siguen identificados y sin realizar.

Se continúa el procedimiento local de `.claude/skills/speckit-clarify/SKILL.md` como
adaptación de `/speckit-clarify`.
 La resolución de
`specs/spec-001` y las lecturas iniciales están documentadas en el informe anterior. Se
comprueban de nuevo rama, cambios y documentación vigente antes de editar. Los cambios
se limitan a `specs/spec-001/`; los hooks opcionales de commit siguen omitidos según el
alcance autorizado. No se ejecuta plan ni se implementa.

## Decisiones de HU-01

| Pregunta | Decisión | Justificación registrada | Trazabilidad |
|---|---|---|---|
| PA1.1 | Modificar la cuota y darse de baja desde la aplicación quedan fuera de v1; Se conservan alta y cobros periódicos. | Mantener el alcance de los criterios actuales, centrados en donaciones y altas. | FR-008 y FR-009; alta como socio. |
| PA1.2 | Donación puntual y alta de socio sin cuenta. El historial requiere sesión con una cuenta del mismo correo, sin considerar esa coincidencia prueba de titularidad. | Permitir colaborar sin registro previo y mantener el historial privado. | FR-011; donación puntual, escenario 7; alta de socio, escenario 4. |
| PA1.3 | Abrir un enlace enviado al correo utilizado al donar antes de vincular las aportaciones a una cuenta. Comprobación limitada a donaciones; no cambia el registro ni el inicio de sesión generales. | Proteger el historial frente a cuentas creadas con correos ajenos. | FR-013; donación puntual, escenarios 11 y 12; entidad Donante y dependencia de vinculación. |
| PA1.4 | Conservar el pago confirmado y su resumen ante un fallo de correo; avisar y permitir reintentar solo el envío, sin otro cobro ni aportación. | Recuperar el correo sin duplicar pagos ni confundir un aviso con el envío; coherencia expresamente solicitada con FR-007 y SC-002. | FR-007 y FR-012; SC-002; donación puntual, escenarios 6 y 8–10; socio, escenarios 5 y 6. |
| PA1.5 | Correo ya utilizado con otro NIF/NIE: detener antes del pago, pedir revisar datos y conservar intacto al Donante existente, sin mostrar sus datos ni mezclar aportaciones. | Evitar atribuciones a otra persona mientras no exista otra política acordada para correos compartidos; el correo por sí solo no identifica al Donante. | FR-014; donación puntual, escenarios 13 y 14; alta de socio, escenario 7; caso límite de identificación. |

Las respuestas originales y sus justificaciones completas permanecen en `clarify-1.md`.
La definición vigente sustituye únicamente el estado de propuesta de PA1.3 y PA1.5.
No supone que se hayan actualizado los contratos compartidos ni probado el código.

## Integración en spec.md

- Se mantienen cinco entradas de preguntas y respuestas en la sesión 2026-11-04; no se
  duplica PA1.3 o PA1.5 por su confirmación posterior.
- PA1.3 y PA1.5 se registran como decisiones de HU-01 y se retiran de `Open Questions`.
- Se añaden FR-013 y FR-014 y criterios verificables para ambas decisiones; los requisitos
  existentes FR-001 a FR-012 conservan sus identificadores.
- Se elimina la regla de reutilización por coincidencia de correo y se distingue entre
  NIF/NIE y correo coincidentes, correo con otro NIF/NIE y el caso inverso todavía abierto.
- El caso ordinario de reutilización con NIF/NIE y correo coincidentes conserva la intención
  original de evitar duplicados; no acredita permiso para vincular una cuenta ni actualizar
  datos en conflicto.
- Las dependencias diferencian las decisiones funcionales de las actualizaciones comunes
  pendientes. No se mantiene una alternativa anterior como si siguiera sin definir.
- PA1.6, PA1.7 y PA1.8, ya identificadas en el informe anterior, se hacen visibles en
  `Open Questions`. No se formulan nuevas preguntas al usuario ni se les asigna respuesta.

## Ajustes necesarios en documentos comunes, sin realizar

Las decisiones funcionales y los cambios comunes todavía pendientes se registran por
separado. La redacción impersonal no incorpora una aprobación colectiva adicional.
El principio XII de la constitución exige acuerdo para cambiar el plan, el modelo o una
decisión compartida. En este paso solo se documenta qué necesita coordinación; no se
modifica ninguno de esos archivos.

| Documento y ubicación | Diferencia actual | Ajuste identificado |
|---|---|---|
| `specs/plan-comun.md`, §3, enlace Usuario–Donante | Describe el enlace por coincidencia de correo sin prueba de acceso al buzón. | Incorporar la verificación previa por enlace dentro de donaciones, manteniendo la autenticación existente. |
| `specs/modelo-datos.md`, `donantes.usuario_id` | Prevé el vínculo por correo, sin indicar la comprobación previa. | Reflejar la condición de vinculación acreditada y concretar cómo se conserva su prueba; no se presupone añadir un estado global de correo verificado a usuarios. |
| `specs/modelo-datos.md`, reglas de `donantes.correo` y `nif_nie` | Solo `nif_nie` es único; no existe la regla de rechazo por correo compartido con otro NIF/NIE. | Documentar la restricción funcional de PA1.5 y la política de identificación. Esta decisión no equivale a aprobar un índice SQL único para correo. |
| `specs/plan-comun.md`, §5, creación o reutilización del Donante antes de Checkout | No contempla explícitamente el rechazo de PA1.5 antes de iniciar el pago. | Alinear esa validación con FR-014, sin revelar datos del Donante existente ni fusionar aportaciones por correo. |

No se modifican documentos de HU-02, HU-03 o HU-04. Se mantiene señalada su dependencia,
especialmente la de Rubén para certificados e informes. La comprobación de encaje del
informe anterior permite situar la verificación en donaciones usando la sesión y el
servicio de correo existentes; no exige por sí sola modificar el registro o el inicio
de sesión. Los detalles de persistencia e integración se concretarán en su fase, sin
crear ahora código, contratos, migraciones, índices ni nuevas restricciones de base de datos.

## Incompatibilidades y dudas restantes

Las diferencias documentales comunes anteriores siguen pendientes de coordinación y
actualización. Son distintas de las dudas funcionales siguientes:

| Identificador | Pendiente | Consecuencia |
|---|---|---|
| PA1.6 | Mismo NIF/NIE con otro correo y autorización para modificar los datos de un Donante, especialmente si ya está vinculado. | Bloquea una regla segura y completa de identificación y actualización. PA1.5 no resuelve ese caso inverso. |
| PA1.7 | Cómo se autoriza a una persona sin cuenta a consultar el resultado del pago o reintentar su correo. | Bloqueo de privacidad y permisos. La referencia por sí sola no demuestra autorización; verificar el correo para vincular una cuenta no resuelve este acceso. |
| PA1.8 | Resultado visible, estado de la suscripción y próximo cobro tras rechazarse una cuota posterior al primer cobro. | Falta concretar ese comportamiento del ciclo periódico. No se inventan estados, bajas, reembolsos ni respuestas. |

La caducidad y protección de la prueba del enlace, su asociación a la cuenta y al Donante
correctos y la conservación de envíos pendientes siguen como detalles de diseño por
concretar conforme a las decisiones funcionales. No se ha iniciado plan para resolverlos.

## Cobertura y checklist

Se reevaluaron las 16 casillas contra la especificación actual. Resultado de este paso:
**12/16 → 13/16**. Solo cambia a marcada `Scope is clearly bounded`: las cinco decisiones
delimitan ahora el alcance de HU-01; la alineación común pendiente
Se registra separadamente. No cambia ninguna otra marca ni el texto del checklist.

Siguen pendientes:

- `Requirements are testable and unambiguous`: PA1.6 y PA1.8 dejan reglas sin concretar.
- `All acceptance scenarios are defined`: faltan los resultados de PA1.6–PA1.8.
- `All functional requirements have clear acceptance criteria`: falta cerrar la autorización
  para consultar y reintentar sin cuenta y los casos de identificación y estado anteriores.

No hay regresiones adicionales. Las marcas valoran calidad documental, no acreditan
funcionamiento. SC-002 mantiene el 100 % de correos enviados con evidencia de recepción
en pruebas; avisos, intentos y fallos no cuentan como éxito.

| Categoría de clarify | Estado actual |
|---|---|
| Alcance y comportamiento | Cinco decisiones de HU-01 integradas; comportamiento de PA1.8 pendiente. |
| Dominio y datos | Vinculación e identificación precisadas; PA1.6 y alineación común pendientes. |
| Interacción | Fallo y reintento de correo definidos; autorización de PA1.7 pendiente. |
| Calidad no funcional | Privacidad pendiente de PA1.6 y PA1.7; sin comprobaciones funcionales o de rendimiento. |
| Integraciones | Contratos consultados y política de fallo de correo definida; PA1.8 pendiente. |
| Casos límite | PA1.5 definida; PA1.6–PA1.8 pendientes. |
| Restricciones | Ámbito de HU-01 y documentos comunes sin modificar conservados. |
| Terminología | Decisiones funcionales, ajustes comunes pendientes y evidencia de envío diferenciados. |
| Finalización | Checklist 13/16; no procede declarar clarify completamente cerrado. |
| Preguntas pendientes | PA1.6, PA1.7 y PA1.8 sin respuestas presupuestas. |

## Archivos y comprobaciones

- La actualización funcional modificó `spec.md` y una marca de `checklists/requirements.md`
  y creó `refinamiento/clarify-2.md`.
- El ajuste posterior de redacción modifica únicamente `spec.md` y este informe vigente;
  conserva los requisitos, escenarios, decisiones, justificaciones y dudas pendientes.
  El checklist permanece en 13/16. Se conserva `clarify-1.md` sin editar ni sobrescribir.
- Rama revisada: `spec-001`. Responsable Nada, revisor Rubén; no se cambia de rama.
- Se comprueban cinco aclaraciones, catorce identificadores de requisitos consecutivos
  FR-001 a FR-014 y trece casillas marcadas de dieciséis.
- Se comprueba el formato con `git diff --check` y el alcance de cambios bajo `specs/spec-001/`.
- No se realizan pruebas funcionales, instalaciones, arranques, commits, push ni cambios comunes.

**Resultado**: sesión detenida para revisión antes de plan. El siguiente paso
recomendado es revisar las diferencias comunes y las dudas PA1.6–PA1.8; no se avanza de
fase automáticamente ni se solicita una nueva respuesta en este paso.
