# Resumen técnico de HU-01 para revisión y consumo desde HU-03

> **Estado actual:** HU-01 revisada por el revisor asignado e incorporada a main mediante la PR #4; `009_operativa_donaciones.sql` es la numeración definitiva. Los estados de preparación y revisión descritos en los apartados fechados corresponden a esas fases anteriores.

**Fecha:** 2026-11-07 · **Rama:** spec-001 · **Base revisada:** 9468636.

**Responsable HU-01:** Nada · **Revisor HU-01:** Rubén.

**Estado:** borrador preparado para revisión; no enviado. Describe archivos y commits
del historial local, sin acreditar publicación, integración en main o acuerdo colectivo.
No modifica HU-03 ni define requisitos nuevos para certificados.

## Implementación y commits relevantes

HU-01 implementa donación puntual y alta mensual, trimestral o anual mediante Checkout
alojado, sin exigir cuenta. Incluye conciliación de avisos firmados, recursos canónicos,
deduplicación por evento/pago/factura, permisos privados, vínculo verificado y correo
recuperable. No incluye historial, certificados, reembolsos o edición de datos fiscales.

| Commit local comprobado | Contenido relevante                                                                |
| ----------------------- | ---------------------------------------------------------------------------------- |
| 5291d31                 | 004, pruebas de dominio y evidencia de sus dos secuencias de incorporación.        |
| edc621c                 | Cuatro tablas técnicas en 009 definitiva y soporte de integración aislado.        |
| e124375                 | Backend puntual y vínculo verificado.                                              |
| c7e4e9b                 | Interfaz de donación puntual, resultado privado y vínculo.                         |
| 1ade2a7 / 65e6b07       | Backend de altas/cuotas y presentación de suscripción.                             |
| 5eb2e1d / 3138999       | Regresión/seguridad y compatibilidad limitada endive con consultas acacia.         |
| cbafeef / 076e439       | Evidencia real P21 y altas de tres periodicidades, reentregas y cancelación anual. |
| 0b41695 / a7dda2b       | Banco y comprobación conjunta local G1–G3.                                         |
| 9d86863                 | Segunda medición y cierre documentado de T079–T080.                                |

47e3ea1 prepara la revisión; 7c650fc registra las correcciones de correo; 140718b separa preparación técnica y controles de incorporación; ba1410d alinea el estado documental y 9468636 registra converge-3, sin nuevas brechas accionables. Todos son commits locales; no se atribuye publicación ni incorporación a main.

## Contrato de datos consumible

Definición única en [modelo-datos.md](../../modelo-datos.md), con implementación de dominio
en [004_donaciones.sql](../../../backend/src/db/migraciones/004_donaciones.sql).
La tabla siguiente es una referencia de consumo, no una redefinición de entidades.

| Tabla               | Campos relevantes y reglas                                                                                                                                                                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| donantes            | `id`; `usuario_id` opcional y único; `nombre`, `apellidos`, `nif_nie`, `correo`, `direccion`. NIF/NIE obligatorio, único y con letra válida. El correo no tiene UNIQUE SQL ni acredita identidad por sí solo.                                                     |
| aportaciones        | `id`, `donante_id`, `modalidad`, `importe`, `estado`, `fecha_cobro`, `referencia`, `proyecto_id`, `suscripcion_socio_id`, `pasarela_pago_id`, `pasarela_factura_id`. Referencia y claves de pago/factura únicas; claves externas nullable mientras no se conocen. |
| suscripciones_socio | `id`, `donante_id`, `importe`, `periodicidad`, `estado`, `fecha_alta`, `fecha_proximo_cobro`, `pasarela_proximo_cobro_en`, `pasarela_suscripcion_id`, `proyecto_id`. No representa por sí sola dinero cobrado.                                                    |

Las tablas conservan `creado_en`/`actualizado_en`; las relaciones usan `ON DELETE RESTRICT`.
Los identificadores BIGINT se tratan como texto en JavaScript. `NUMERIC(10,2)` se recibe
como texto; las conversiones de importes usan céntimos enteros seguros. No convertir
los totales a coma flotante para sumar o comparar.

- Aportación: `pendiente`, `confirmada`, `rechazada`, `cancelada`.
- Modalidad persistida: `puntual` o `cuota_socio`; periodicidades `mensual`, `trimestral`, `anual`.
- Suscripción: `pendiente`, `activa`, `cancelada`.
- Importe individual: EUR, **1,00–999.999,99**, incluidos. Es un límite de la aplicación,
  no de Stripe ni del total anual de varias aportaciones.
- `proyecto_id=NULL` significa fondo general. Una cancelación de suscripción no elimina
  ni resta cuotas confirmadas. No sumar el importe previsto de la suscripción.

Las cuatro tablas técnicas de 009 (`operaciones_pago`, `eventos_pasarela`,
`verificaciones_donante`, `correos_aportacion`) no son otra fuente del total fiscal.
Un correo fallido no quita una aportación confirmada del importe aportado.

## Propiedad, NIF/NIE e inmutabilidad

El acceso personal debe comprobar en servidor la cuenta autenticada con rol donante y
la relación `donantes.usuario_id = usuario.id`. La coincidencia de correo no concede
acceso. El vínculo lo establece donaciones tras un enlace dirigido al buzón de la cuenta,
con hash persistido, treinta minutos de vigencia, cuenta solicitante y uso único,
consumido por POST. Registro e inicio de sesión comunes no se cambian.

El permiso invitado de ocho horas solo autoriza su operación y su correo: no concede
acceso al historial ni a certificados. La propia HU-03 conserva sus controles de propiedad;
no debe tomar el permiso de una referencia como autorización fiscal.

HU-01 v1 exige NIF/NIE y no permite cambiar correo, nombre, apellidos o dirección al
reutilizar un Donante, incluso con cuenta vinculada. Los cambios reales detienen el
flujo antes de Stripe; solo se admiten las equivalencias de formato documentadas, sin
sobrescribir datos. La asignación verificada de `usuario_id` es distinta de editar datos
fiscales. No existe aquí un flujo de «completar NIF» o corregir el perfil.

Una aportación confirmada conserva importe, referencia, pago y fecha de cobro; las
reentregas no crean otra. Es una regla del servicio de donaciones, no un mecanismo
general de rectificación ni un trigger que autorice cambios desde otros módulos.

## Suma por ejercicio y fechas

HU-03 consume **solo `estado='confirmada'`**, por `donante_id` y **`fecha_cobro`**.
No usar `creado_en`, `actualizado_en`, fecha de correo o próxima cuota para atribuir el año.
En puntual, la fecha procede del evento firmado de éxito validado contra el pago canónico;
en cuotas, de `Invoice.status_transitions.paid_at`, según el contrato de donaciones.

`fecha_cobro` es TIMESTAMPTZ y obligatoria al confirmar. Usar el rango semiabierto
**[inicio del 1 de enero, inicio del 1 de enero siguiente)** en **Europe/Madrid**, a través
de `rangoAnio(anio)` de [fechas.js](../../../backend/src/servicios-comunes/fechas.js).
El filtro es `fecha_cobro >= desde AND fecha_cobro < hasta`, con parámetros de instante.
Esto incluye el 31/12 a las 23:59 de Madrid y excluye el 01/01 siguiente sin truncar en UTC.
La suma SQL NUMERIC debe conservar exactitud y no heredar el máximo de una cuota individual.

La lectura debe respetar las capas comunes: entidades compartidas sin duplicarlas y
sin importar directamente el repositorio de donaciones desde otro módulo. La elección
de consulta/servicio de HU-03 corresponde a su implementación y revisión, no se añade aquí.

## Evidencias y límites

La [matriz vigente](matriz-validacion-01.md) enlaza los 34 escenarios y SC-001–SC-004.
Incluye regresión del módulo 367/367 y G1–G3 17/17, realizadas en momentos distintos;
no se presentan como una nueva ejecución acumulada.

Stripe de pruebas acredita puntuales, primera confirmación tras cerrar las páginas,
reentregas sin duplicados, tres altas/primeras facturas y cancelación anual sin reembolso.
La [medición 2](medicion-puntual-02.md) recoge 61 s medidos con cronómetro y 7/7 confirmaciones
recibidas por referencia en el conjunto delimitado 30–36, según el registro de ejecución. La medición 1
fallida de 480,836 s se conserva íntegra. No es una garantía universal ni auditoría global.

Renovaciones, primer fallo, fallos posteriores, alta sin cuenta y primer cobro de socio
sin retorno y cancelación después de un fallo no cuentan con recorrido real completo
de Stripe; Se conservan sus pruebas locales/simuladas. Las semillas no prueban cobros
o recepción. Los avisos SMTP y registros de errores comunes observados en T074 quedan
para revisión; no se ocultan como una auditoría nueva.

004 está creada y validada. El [flujo documentado](ajuste-flujo-01.md) distingue
**T006: paquete completo preparado** y **T007: comprobación actual y elección local de 009**
de los controles de incorporación. Nueve cabezas publicadas y sus seis commits distintos
Se comprobaron en lectura, sin 009 en la carpeta canónica y sin ramas de esa enumeración
pendientes de verificar. No modifica descarta trabajo sin publicar.

**el control de revisión sigue pendiente de revisión y aprobación reales de Rubén** del paquete completo.
**el control de integración sigue pendiente de resolver numeración/conflictos antes de main**, considerando
el registro por nombres y los entornos donde 009 ya está aplicada. Se explicará la
elección en la PR. Esos controles no bloquean terminar el desarrollo o preparar/abrir
la PR; no se renombra ni reaplica SQL aquí. Las correcciones de correo y sus regresiones
constan en [validacion-converge-01.md](validacion-converge-01.md), sin nuevos pagos reales.

## Preguntas de integración para Rubén — pendientes, sin acuerdo atribuido

La [spec local de HU-03](../../spec-003/spec.md) consultada contiene FR-001–FR-007 y
PA3.1/PA3.2. Las preguntas siguientes no se presentan como nuevos requisitos aprobados.

1. **Donantes sin NIF/NIE:** el caso límite de HU-03 indica que se complete el dato,
   pero HU-01/004 no permiten un Donante sin NIF/NIE. ¿Se refiere a datos heredados u
   otra fuente, o se mantiene como comprobación defensiva? Si debe poder completarse,
   ¿qué módulo y flujo lo harán? No existe esa edición en HU-01 v1.
2. **Correcciones:** HU-01 conserva las aportaciones confirmadas y no edita datos fiscales.
   ¿Qué correcciones exige realmente HU-03, sobre qué datos y con qué autorización?
   Antes de definirlas, no debe suponerse que se pueden sobrescribir donantes o cobros.
3. **Regeneración/rectificación:** PA3.1 permanece abierta. Ante una corrección autorizada
   o una confirmación tardía de un ejercicio ya certificado, ¿se conserva el certificado,
   se regenera o se emite uno rectificativo? ¿Cómo se preservan el código/datos de las
   descargas anteriores? Se necesita la decisión de HU-03; no se presupone ninguna opción.

T081 y T006 preparan la revisión; no acreditan aprobación. T007 acredita una elección
local contrastada, numeración definitiva. Este material sigue sin enviarse; el cierre
técnico requiere el converge posterior y no elimina los controles externos antes de main.
