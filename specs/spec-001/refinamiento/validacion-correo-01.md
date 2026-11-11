# Validación del adaptador de correo — HU-01

> **Estado actual:** HU-01 revisada por el revisor asignado e incorporada a main mediante la PR #4; `009_operativa_donaciones.sql` es la numeración definitiva. Los estados de preparación y revisión descritos en los apartados fechados corresponden a esas fases anteriores.

**Fecha**: 2026-11-06 · **Rama**: spec-001  
**Responsable**: Nada · **Revisor**: Rubén  
**Alcance**: T017–T018. Compatibilidad y opciones de tiempos de enviarCorreo.  
**Resultado**: 16 pruebas dirigidas aprobadas con Nodemailer simulado.
La ampliación queda preparada en esta rama para revisión; Se incorpora mediante PR #4
ni incorporación compartida. T006 sigue pendiente de la revisión real de Rubén.

## Estado inicial y procedimiento

Se comprueba una carpeta limpia en spec-001, HEAD 66027f0. T001–T005 y T020–T021
están completadas; T006 permanece pendiente. No existen correo.test.js ni este informe.
Se conservan todos los informes históricos.

Se sigue la [definición local de speckit-implement](../../../.claude/skills/speckit-implement/SKILL.md).
 Se comprueba la
selección specs/spec-001 con check-prerequisites.ps1 -Json -PathsOnly y selección temporal
de proceso, sin persistir feature.json. La checklist requirements.md tiene 16 elementos
completos y 0 pendientes. Los hooks opcionales de commit se omiten antes y después del bloque.

Fuentes: [tareas](../tasks.md),
[P-03](../contracts/cambios-comunes.md#p-03--correo-compatible-y-recuperación),
[plan común, apartado 6](../../plan-comun.md#6-servicios-comunes-pdf-csv-y-correo),
[research R-07](../research.md#r-07--correo-recuperable-sin-cambiar-el-pago)
e implementación inicial de correo.js. Los nombres de tiempos se contrastan también con
smtp-connection de Nodemailer 6.10.1 instalado; no se instalan o actualizan paquetes.

## Ajuste del orden

T017 pasa de depender de T013 a depender de T002: el adaptador puede probarse con
Nodemailer y configuración simulados, sin tablas operativas, secretos o SMTP real.
T018 continúa dependiendo de T017. Las dependencias de T024/T026 y las demás tareas
se conservan, incluidos los ajustes anteriores de T020–T021.

tasks.md actualiza la justificación, el diagrama, las ventanas de paralelo y el comando
dirigido. La preparación de P-03 en esta rama no sustituye el control de revisión e
incorporación compartida de T006.

## Cambio implementado

Archivo: [correo.js](../../../backend/src/servicios-comunes/correo.js).

La firma es enviarCorreo({ para, asunto, texto }, opciones = {}), con retorno booleano.
El transporte original se crea una vez al cargar el módulo y se conserva para las llamadas
sin tiempos, incluidas las opciones omitidas o vacías. Host, puerto, secure=false y la
construcción de from/to/subject/text mantienen los valores y el comportamiento anteriores.

| Opción propia de HU-01 | Opción de Nodemailer | Valor previsto de HU-01 |
| ---------------------- | -------------------- | ----------------------: |
| tiempoConexionMs       | connectionTimeout    |                 3000 ms |
| tiempoSaludoMs         | greetingTimeout      |                 3000 ms |
| tiempoInactividadMs    | socketTimeout        |                 5000 ms |

Cuando se indica algún tiempo, se crea un transporte separado para esa llamada a partir
de una copia de la configuración base. Solo se trasladan las tres opciones previstas
con valor definido: no se propagan host, from u otras propiedades del segundo argumento.
No se mutan las opciones recibidas, el mensaje o el transporte compartido.

La creación del transporte opcional y sendMail quedan dentro del manejo de errores.
La resolución de sendMail devuelve true; un fallo se registra y devuelve false, sin
reintento automático ni sustitución por el transporte heredado. Se conserva el mensaje
de registro de error de las llamadas anteriores.

True representa el resultado de la llamada SMTP, no recepción en el buzón destinatario.
No se añade una señal de entrega ni se considera SC-002 cumplido. Los tiempos de conexión,
saludo e inactividad tampoco constituyen una garantía de duración total del envío.

## Pruebas escritas antes del cambio del servicio

Archivo: [correo.test.js](../../../backend/src/servicios-comunes/correo.test.js).

Nodemailer se sustituye por un mock completo de createTransport y sendMail; config.js
se sustituye por configuración sintética. Las opciones y objetos de transporte se
congelan para detectar modificaciones. No se carga .env ni se usan credenciales,
Mailpit, PostgreSQL, Stripe o conexiones SMTP.

| Grupo                   | Comprobación                                                                                                                                                                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Compatibilidad, 6 casos | Configuración original, una sola creación, mensaje y retorno true, reutilización entre llamadas, opciones omitidas/vacías y fallo false con el registro anterior y un único intento.                                                                                            |
| Opciones, 10 casos      | Traducción individual de los tres tiempos, combinación 3000/3000/5000, omisión de undefined, no propagación de opciones ajenas, alternancia con llamadas heredadas, aislamiento entre configuraciones concurrentes, fallo de envío y fallo de creación del transporte opcional. |

Los casos inspeccionan tanto argumentos como el transporte seleccionado y su número
de llamadas. Se comprueban objetos congelados y mezcla de llamadas con y sin opciones;
no se demuestra compatibilidad mediante una simple referencia en la matriz.

## Comando y resultados reales

Desde PowerShell en backend, sin cargar configuración local:

```powershell
Set-Location -LiteralPath 'E:\asignaturas\IWeb\Practica grupal\IWEB_ONG\backend'
npm test -- src/servicios-comunes/correo.test.js
```

Todas las ejecuciones utilizan ese comando con Vitest 2.1.9. Las horas son las mostradas
por la herramienta.

| Ejecución                                   | Inicio informado | Código | Resultado                                                                                                                                                                          |
| ------------------------------------------- | ---------------- | -----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primera prueba, servicio sin modificar      | 19:11:19         |      1 | 15 fallidos y 1 aprobado de 16; además de las opciones ausentes, se detecta una aserción no disponible en esta versión de Vitest. Duración 1,41 s.                                 |
| Segundo intento, servicio aún sin modificar | 19:11:59         |      1 | Mismo resultado: 15 fallidos y 1 aprobado. La sustitución de aserciones se había detenido por una comprobación de recuento; el archivo de pruebas seguía intacto. Duración 1,09 s. |
| Pruebas corregidas, antes de implementar    | 19:12:22         |      1 | 6 casos de compatibilidad aprobados y 10 casos de opciones fallidos. El servicio todavía no contempla el segundo argumento. Duración 1,11 s.                                       |
| Servicio ampliado y formateado              | 19:12:48         |      0 | 1 archivo y 16 pruebas aprobados; 0 fallidos y 0 omitidos. Duración 1,05 s; 116 ms de pruebas.                                                                                     |

Las aserciones toHaveBeenCalledExactlyOnceWith se sustituyen por comprobaciones equivalentes
de número de llamadas y argumentos, disponibles en Vitest 2.1.9. No se eliminan casos ni
se relajan sus condiciones. La tercera ejecución establece el diagnóstico previo válido:
el comportamiento heredado pasa y las nuevas opciones todavía fallan.

Extracto final:

```text
Test Files  1 passed (1)
     Tests  16 passed (16)
  Duration  1.05s
```

## Formato

Se utiliza Prettier 3.6.2 ya disponible en caché local, con .prettierrc.json del repositorio;
no se añade una dependencia ni se modifica un lockfile. La comprobación inicial de los
dos JavaScript y tasks.md detecta formato pendiente únicamente en tasks.md, con código 1.
Se formatean los cuatro archivos autorizados y se realiza la comprobación final.

Comandos desde la raíz:

```powershell
Set-Location -LiteralPath 'E:\asignaturas\IWeb\Practica grupal\IWEB_ONG'
$hu01Prettier = 'C:\Users\Nada\AppData\Local\npm-cache\_npx\83e71da30ae7cab2\node_modules\prettier\bin\prettier.cjs'
node $hu01Prettier --version
node $hu01Prettier --config .prettierrc.json --write backend/src/servicios-comunes/correo.js backend/src/servicios-comunes/correo.test.js specs/spec-001/tasks.md specs/spec-001/refinamiento/validacion-correo-01.md
node $hu01Prettier --config .prettierrc.json --check backend/src/servicios-comunes/correo.js backend/src/servicios-comunes/correo.test.js specs/spec-001/tasks.md specs/spec-001/refinamiento/validacion-correo-01.md
```

Se comprobó el formato, los enlaces y el alcance de los archivos indicados.

## Alcance conservado y parada

Las únicas escrituras del bloque son correo.test.js, correo.js, tasks.md y este informe.
Se conservan migraciones, secretos, manifiestos, lockfiles, código de otros módulos e
informes anteriores. Solo se cambia la dependencia de T017 a T002 y se marcan como
recién completadas T017 y T018; T006 y el resto mantienen su estado anterior.

La validación es del adaptador con simulación: no demuestra entrega real, funcionamiento
de Mailpit o cumplimiento de los criterios completos de donaciones. Persistencia,
reservas, reintentos de negocio, rutas y certificados quedan fuera de este bloque.
La ampliación común no se presenta como aprobada por el grupo o incorporada a main.
Se detiene para revisión, sin git add, commit, push, merge o cambio de rama.
