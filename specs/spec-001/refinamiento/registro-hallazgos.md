# Registro de hallazgos — HU-01

**Rama**: spec-001 · **Fecha**: 2026-11-06  
**Responsable**: Nada · **Revisor**: Rubén

Este registro conserva los identificadores y la gravedad del diagnóstico inicial.
«Corregido documentalmente» significa que el diseño y el desglose se han precisado;
no significa código implementado, pruebas superadas, incorporación común o revisión
de Rubén realizada. Los resultados del segundo contraste se conservan por separado
en analyze-2.md. No se modifica ningún informe histórico.

## Evidencia inicial preservada

- [analyze-1.md](analyze-1.md): primer diagnóstico, sin correcciones aplicadas.
- SHA-256 del archivo original: `ac2b0c787587d70de37d183ecedbd25e5f07efb4f65167cd983caca9335a5110`.
- Los informes clarify-1.md, clarify-2.md y clarify-3.md permanecen intactos.
- La definición canónica de datos continúa en el [modelo común](../../modelo-datos.md);
  las ampliaciones descritas no se han convertido en SQL.

## COV-001 — Solicitud del enlace desde la interfaz

| Campo | Registro |
|---|---|
| ID | COV-001 |
| Historia y criterios | HU-01, US1; FR-013 y parte de FR-011; P11/P12. |
| Gravedad inicial | MEDIA. |
| Evidencia inicial | analyze-1: COV-001. T043 definía la solicitud de API y T049 comenzaba por recibir el token; no se explicitaba la acción web para pedirlo. |
| Decisión | Entrada visible «Vincular mis aportaciones a una cuenta» desde formulario y resultado hacia /donar/vincular. Sin token: FormEntrar existente si procede y solicitud explícita con CSRF a la cuenta donante. 202 y aviso genérico iguales con/sin Donante elegible, incluido fallo SMTP individual; no acreditan envío/vínculo. Con token: confirmación POST, sin reemisión por GET. Solicitar otro enlace requiere una acción expresa. |
| Documentos afectados | spec.md, plan.md, research.md, contracts/api-donaciones.md, contracts/cambios-comunes.md, quickstart.md, tasks.md y plan-comun.md. |
| Tareas y comprobación prevista | T031/T043/T045/T047/T049/T052; entradas desde las dos páginas, solicitud → correo → confirmación, falta de cuenta/rol, aviso no enumerativo, token de otra cuenta/vencido/usado y GET sin envío/consumo. Matrices FR-013/P11/P12 actualizadas. |
| Responsable | Nada. |
| Revisor | Rubén; revisión pendiente. |
| Estado | Corregido documentalmente en esta rama. Sin implementación ni pruebas; no se atribuye acuerdo colectivo. |

La ubicación y el circuito están descritos en el [contrato API](../contracts/api-donaciones.md).
No dependen de HU-02 y no añaden edición de perfil o verificación global del registro/login.

## UND-001 — Creación activa frente a creación interrumpida

| Campo | Registro |
|---|---|
| ID | UND-001 |
| Historia y criterios | HU-01, US1 y US2; creación de Checkout, FR-006/FR-010/FR-016 y casos técnicos de concurrencia, timeout y reinicio. |
| Gravedad inicial | MEDIA. |
| Evidencia inicial | analyze-1: UND-001. Incierta se persistía antes del HTTP y podía sobrevivir a una caída; no se identificaba cómo acreditar actividad o reanudar sin otro cuerpo/clave. |
| Decisión | Preparación con bloqueo transaccional corto y creación con pg_try_advisory_lock por UUID sobre una conexión retenida. Guardar sesión antes de adquirirla; HTTP fuera de transacción. Finalmente desbloquear o destruir el cliente; tras caída, reanudar solo cuando se readquiera, con autorización y plazo. Usar siempre la misma instantánea, UUID, referencia y clave. |
| Plazo | 23 horas fijas desde creado_en, con reloj real de PostgreSQL y sin renovar por actualizado_en/reintento/reinicio. Margen conservador frente a las 24 horas mínimas de retención documentadas. Sin Session conocida al vencer: revisión requerida y ningún POST nuevo de recuperación. Session conocida solo se consulta/reutiliza. No se inventa estado financiero. |
| Datos y justificación | Un único campo adicional: operaciones_pago.solicitud_checkout JSONB no nulo e inmutable. La huella no reconstruye URL/descripción tras un reinicio; se conserva el cuerpo efectivo sin NIF/dirección, tarjeta o secretos. Se reutiliza creado_en; no se añade tabla de bloqueo, propietario o lease de creación. La columna pertenece a la ampliación operativa posterior a 004. |
| Contrato compatible | Preparador puro común y argumento opcional solicitudCheckout en crearSesionPago; consumidores anteriores mantienen la construcción compatible. El cliente solo conserva UUID y puede usar DTO corto autorizado; nunca puede aportar el cuerpo Checkout almacenado. |
| Documentos afectados | Modelo y plan comunes; plan.md, research.md, data-model.md, contracts/api-donaciones.md, contracts/pasarela-stripe.md, contracts/cambios-comunes.md, quickstart.md y tasks.md. |
| Tareas y comprobación prevista | T008/T009/T014/T015/T019/T029/T034–T036/T045/T047/T059/T074. Se comprueban exclusión, liberación, pérdida de conexión, reinicio y respuesta tardía; igualdad de cuerpo/clave, DTO corto, umbral temporal, permisos de ocho horas y ausencia de segunda creación. |
| Responsable | Nada. |
| Revisor | Rubén; revisión del ajuste de P-01/P-02 pendiente antes de incorporación. |
| Estado | Corregido documentalmente en esta rama. Sin SQL, código o pruebas; no se considera funcionamiento probado. |

El [protocolo de creación](../contracts/pasarela-stripe.md#exclusión-y-reanudación-de-la-creación)
define adquisición, liberación y condiciones de reanudación. El contrato de correo y sus
reservas renovables son independientes: no se extiende ese lease a la creación de Checkout.

## Conservación y trabajo pendiente

Permanecen la revisión de Rubén, la coordinación del número de la ampliación operativa y
P-05 antes de Stripe real. No son resultados ya obtenidos ni tareas que se marquen ejecutadas
por corregir documentación. La entrega 004 sigue siendo temprana y no incorpora el campo
técnico de la instantánea. Cualquier hallazgo nuevo del segundo analyze se deja para revisión;
no se aplica una corrección automática al producir ese informe.
