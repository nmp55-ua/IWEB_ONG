# Validación de las correcciones T082–T083 — HU-01

**Fecha:** 2026-11-07 · **Rama:** spec-001 · **HEAD inicial:** 47e3ea1.

**Responsable:** Nada · **Revisor:** Rubén, revisión externa pendiente.

## Estado inicial y conservación

Al comenzar existen los cambios de tasks.md del primer converge y converge-1.md sin
seguimiento; se conservan, junto con `.env`, `.claude/launch.json` y los históricos.
El [primer diagnóstico](converge-1.md) no se modifica. Este informe registra regresiones
nuevas antes de corregir, no una repetición de T079–T081 ni un segundo converge.

Se aplica el procedimiento local de implementación dentro del bloque T082–T083, sin
invocación registrada de `/speckit-implement`, sin agentes ni hooks opcionales de Git.
La selección se comprueba con `check-prerequisites.ps1 -Json -PathsOnly` y resuelve
specs/spec-001. La checklist de requisitos se conserva como calidad documental.

## Reproducción inicial — registrada antes de corregir

Se añaden primero cuatro casos de regresión, manteniendo el código de producción intacto:

- CONV-001 en confirmaciones.test.js: A mantiene el envío SMTP simulado en espera; B lee
  enviando y, justo antes de reclamar, se permite que A termine y persista enviado.
  La reclamación y terminación utilizan PostgreSQL real del esquema aislado.
- CONV-001 por HTTP en rutas.test.js: el mismo intercalado, con una operación sintética
  confirmada, permiso y CSRF válidos. Se espera 200/enviado sin otro SMTP ni Checkout.
- CONV-002, dos variantes en cuotas.test.js: falla SMTP al enviar el aviso de una cuota;
  después se paga la misma factura o se cancela la suscripción y se reentrega el evento
  sintético original. El aviso se recupera sin alterar el resumen o el dinero, pero debe
  diferenciar el intento/previsión históricos del estado actual.

Desde backend, con NODE_ENV=test y DATABASE_URL/TEST_DATABASE_URL iguales, seleccionadas
en memoria para **ong_test_hu01**, sin imprimir la conexión ni cambiar `.env`:

```powershell
npm test -- src/modulos/donaciones/confirmaciones.test.js src/modulos/donaciones/rutas.test.js src/modulos/donaciones/cuotas.test.js --no-file-parallelism -t CONV-
```

**Resultado inicial real:** salida 1; **4 fallos esperados**, 53 casos no seleccionados
por el filtro, tres archivos fallidos. Inicio mostrado por Vitest: 06:26:40; duración
14,09 s. Los 53 casos no se presentan como aprobados ni como omisiones por configuración.

| Regresión                     | Evidencia del fallo inicial                                                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| CONV-001, servicio de correo  | La promesa rechaza con estado 409, código CORREO_EN_ENVIO y «El correo se está enviando», en vez de resolver enviado.               |
| CONV-001, ruta HTTP           | «expected 200 OK, got 409 Conflict».                                                                                                |
| CONV-002, después del pago    | El texto recibido todavía dice «Esa cuota no se ha contabilizado como pagada» y «Próximo intento de cobro», sin contexto histórico. |
| CONV-002, después de cancelar | El mismo texto de impago/previsión actual reaparece al recuperar el aviso; falta la distinción histórica exigida por la regresión.  |

El cambio de estado del primer envío y los invariantes previos a las aserciones de texto
se alcanzaron en PostgreSQL. No se utilizaron Stripe, SMTP o reenvíos reales. No se
tocaron las aportaciones 30–36, sus correos o sesiones de la base de desarrollo.

Esta sección conserva la evidencia inicial. La solución y los resultados posteriores
se añadirán a continuación, sin reemplazar estos fallos.

## Corrección mínima aplicada después de registrar los fallos

**CONV-001:** si reclamarCorreo no devuelve fila, se relee el estado. Si otro intento ya
persistió enviado, se devuelve ese estado; el resto conserva el conflicto de reserva.
No se introduce otra reclamación, otro envío, tablas, estados o cambios de permisos.
La prueba de reserva viva existente sigue exigiendo 409. La nueva prueba HTTP contrasta
200/enviado, un único SMTP simulado y Checkout sin llamadas nuevas.

**CONV-002:** se cambia solo el texto del aviso de fallo para identificar el intento y
su previsión históricos. Se elimina la afirmación actual de que la cuota no está pagada
y se etiqueta la fecha como «Previsión comunicada en aquel momento». Se indica que no
determina el estado actual ni anuncia otro cobro. No se suprime el aviso, no se añaden
estados ni se alteran resúmenes, confirmaciones, conciliación o datos financieros.

En ambos recorridos tardíos, la misma notificación lógica pasa de fallido/intento 1 a
enviado/intento 2; su resumen, ID y referencia se conservan. Cuotas, suscripción y correos
de confirmación quedan exactamente iguales antes/después de recuperar el aviso.
Una nueva reentrega del mismo evento ya no genera otro envío. Son comprobaciones con
recursos canónicos y SMTP simulados, no reenvíos o entregas reales de Stripe.

## Regresión final ejecutada

Desde backend, con la misma selección segura y esquemas exclusivos de ong_test_hu01:

```powershell
npm test -- src/modulos/donaciones/confirmaciones.test.js src/modulos/donaciones/rutas.test.js src/modulos/donaciones/cuotas.test.js src/modulos/donaciones/textoCorreo.test.js --no-file-parallelism
```

**Resultado:** salida 0, **83/83 aprobadas**, cuatro archivos, sin casos omitidos.
Desglose: confirmaciones 7, rutas 12, cuotas 38 y textoCorreo 26. Inicio mostrado:
06:28:45; duración 19,76 s. El aviso «No se aceptó el correo de verificación» corresponde
al caso de SMTP simulado fallido ya existente, no a un envío real ni fallo de la suite.

Se amplía únicamente a eventos puntuales porque el webhook de confirmación también
reutiliza crearConfirmaciones; se comprueban idempotencia, reentregas, dinero confirmado,
fallo SMTP y recuperación del correo en ese flujo:

```powershell
npm test -- src/modulos/donaciones/eventos.test.js --no-file-parallelism
```

**Resultado:** salida 0, **21/21 aprobadas**, un archivo, sin omisiones. Inicio mostrado:
06:30:26; duración 5,39 s. Son dos ejecuciones distintas, no una nueva suite global.
No se repiten las suites ajenas, la medición, los pagos o la recepción real de Mailpit.

## Balance y ajuste del flujo

T082 y T083 cumplen sus comprobaciones y se marcan con esta evidencia. No se detectaron
brechas nuevas durante las regresiones. El primer informe no se corrige ni se sobrescribe;
sus hallazgos quedan como diagnóstico inicial y las soluciones se registran aquí.

El [ajuste autorizado por Nada](ajuste-flujo-01.md) cambia el alcance técnico de T006/T007
sin atribuir aprobación: paquete de revisión completo y elección de 009 contrastada con
nueve ramas publicadas. PR-R01/PR-R02 siguen pendientes antes de main, separados del
desarrollo y de la preparación/apertura de PR. La ficha conserva el paquete preparado
sin enviarlo; no se crea ni publica una PR.

**No se ejecuta el siguiente converge ni se declara cierre técnico.** Ese contraste
posterior deberá revisar estas correcciones y los controles externos con su significado
vigente, sin interpretar como actuales los pendientes anteriores del informe histórico.
No se hacen pagos, reenvíos reales, cambios de configuración o escrituras de Git.

## Archivos de esta entrega y comprobación documental

Los cambios propios de este bloque se limitan a 18 archivos: dos de producción,
cuatro de pruebas y doce documentos, incluidos los dos informes nuevos siguientes.
converge-1.md ya estaba pendiente de registrar al comenzar y se conserva sin cambios.

| Grupo                    | Archivos                                                                                                                                           |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Corrección               | backend/src/modulos/donaciones/confirmaciones.js; textoCorreo.js de ese mismo módulo.                                                              |
| Pruebas                  | confirmaciones.test.js, rutas.test.js, cuotas.test.js y textoCorreo.test.js del módulo donaciones.                                                 |
| Guías/contratos vigentes | README.md; backend/src/db/migraciones/LEEME.md; specs/spec-001/plan.md, quickstart.md, contracts/api-donaciones.md y contracts/cambios-comunes.md. |
| Seguimiento/paquete      | specs/spec-001/tasks.md; refinamiento/matriz-validacion-01.md, revision-tecnica-01.md y resumen-tecnico-hu03-01.md.                                |
| Nuevos registros         | refinamiento/validacion-converge-01.md y refinamiento/ajuste-flujo-01.md.                                                                          |

Prettier correcto en los 18 archivos y enlaces locales sin destinos ausentes. La checklist
de requisitos conserva 16/16 marcas de calidad documental; no se cambia ni se usa para
atribuir revisión externa. Tasks.md contiene 83 IDs distintos, marcados en sus alcances
vigentes; los pendientes externos son PR-R01/PR-R02 y el cierre técnico aún exige converge.

La comparación SHA-256 conserva converge-1.md, `.env`, `.claude/launch.json`, selección,
migraciones SQL e informes anteriores de clarify, analyze, validaciones y mediciones.
Ficha y matriz se actualizan como documentos de seguimiento vigentes, junto con el resto
del código/pruebas y documentos identificados. El índice de Git
permanece sin modificaciones y `git diff --check` no señala errores. Rama spec-001 y HEAD
47e3ea1 conservados, sin commits nuevos ni cambios de rama.

## Separación propuesta para el registro posterior, sin ejecutar Git de escritura

1. **HU-01: registra el primer diagnóstico de converge** — conservar el primer informe
   que ya estaba pendiente, sin volver a generarlo ni repetir commits anteriores.
2. **HU-01: corrige carreras y avisos históricos de correo** — correcciones, regresiones
   y evidencia inicial/final de T082–T083, con sus aclaraciones contractuales.
3. **HU-01: separa preparación técnica y controles de incorporación** — ajuste autorizado,
   comprobación de 009 y paquete/documentación vigente. Los fragmentos correspondientes
   de tasks.md deben revisarse para mantener esa separación.

Son propuestas para revisión del guía; no se hace git add ni commit, no se publica una
PR, no se envían mensajes y no se ejecuta el siguiente converge.
