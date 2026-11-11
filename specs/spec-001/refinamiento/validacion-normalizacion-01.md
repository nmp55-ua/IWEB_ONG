# Validación de normalización de datos — HU-01

> **Estado actual:** HU-01 revisada por el revisor asignado e incorporada a main mediante la PR #4; `009_operativa_donaciones.sql` es la numeración definitiva. Los estados de preparación y revisión descritos en los apartados fechados corresponden a esas fases anteriores.

**Fecha**: 2026-11-06 · **Rama**: spec-001  
**Responsable**: Nada · **Revisor**: Rubén  
**Alcance**: T020–T021. Implementación y pruebas de funciones puras.  
**Resultado**: 102 pruebas aprobadas; no se completa ninguna otra tarea.
La revisión real de Rubén de T006 sigue pendiente.

## Estado inicial y procedimiento

La rama se encuentra limpia en 5291d31, precedido por 10a9457. Los archivos
normalizacion.js, normalizacion.test.js y este informe no existen al comenzar.
Se conservan la migración 004, su evidencia de validación y todos los informes históricos.
No se incorpora origin/main ni se cambia de rama.

Se sigue la [definición local de speckit-implement](../../../.claude/skills/speckit-implement/SKILL.md).

Se verifica specs/spec-001 con check-prerequisites.ps1 -Json -PathsOnly y selección de
proceso, sin persistir feature.json. La checklist requirements.md conserva sus 16 marcas,
sin pendientes. Se omiten los hooks opcionales de commit antes y después de implementar.

Fuentes vigentes: [research R-03](../research.md#r-03--normalización-importe-e-identidad),
[contrato HTTP](../contracts/api-donaciones.md#preparación-de-checkout),
[plan](../plan.md), [uso del modelo](../data-model.md) y [tareas](../tasks.md).
No se repiten clarify, plan, tasks o analyze.

## Dependencia ajustada

T020 pasa de depender de T013 a depender de T002. Las pruebas solo necesitan las
dependencias de JavaScript ya instaladas: no consultan PostgreSQL, tablas operativas,
sesiones, correo o Stripe. T021 mantiene su dependencia de T020 y T027 continúa
requiriendo T021 para la integración posterior.

Se actualizan la explicación del orden, el diagrama, la ventana de paralelo y el comando
dirigido en tasks.md. Se conservan los 81 identificadores y todas las demás dependencias.
Este adelanto no equivale a aprobar T006 o a iniciar una ampliación común.

## Contrato interno implementado

Archivo: [normalizacion.js](../../../backend/src/modulos/donaciones/normalizacion.js).

| Función | Entrada y resultado |
|---|---|
| normalizarImporte(texto) | Recibe texto, como el importe del contrato HTTP. Devuelve { centimos, importe }, con entero seguro e importe decimal normalizado a dos cifras. |
| normalizarNifNie(texto) | Devuelve NIF/NIE canónico en mayúsculas después de validar formato y letra. |
| normalizarDonante(datos) | Devuelve un objeto nuevo con nombre, apellidos, nifNie, correo y direccion, sin modificar la entrada. |
| sonDatosDonanteEquivalentes(primero, segundo) | Normaliza y valida los dos conjuntos de campos; devuelve si los cinco coinciden con las equivalencias de R-03. Una entrada inválida produce error, no una coincidencia. |

Los errores reutilizan ErrorApi: estado 400, código DATOS_INVALIDOS y mensaje por campo
en campos. No incluyen datos de un Donante guardado. Las funciones no reciben ni utilizan
una conexión, sesión o servicio de persistencia. Comparar datos no acredita identidad,
titularidad del correo, autorización o vínculo con Usuario.

### Reglas aplicadas

- **Importes**: aCentimos valida la representación y convierte coma/punto a céntimos;
  se exige Number.isSafeInteger e intervalo incluido de 100–99.999.999 céntimos.
  centimosATexto genera la salida decimal. Se rechazan tres decimales, exponentes,
  signos, miles, valores fuera de rango y tipos distintos de texto, sin redondearlos
  o convertirlos implícitamente. Los servicios comunes permanecen intactos.
- **NIF/NIE**: NFC, retirada de espacios y guiones de presentación y mayúsculas.
  Se admiten ocho dígitos y letra o prefijo X/Y/Z, siete dígitos y letra. Se valida
  módulo 23; X/Y/Z se sustituyen por 0/1/2. No se aplica NFKC ni se aceptan otros
  identificadores como equivalentes.
- **Nombre, apellidos y dirección**: NFC, recorte exterior y colapso de espacios.
  El valor normalizado conserva las mayúsculas introducidas; la comparación no las
  distingue. Se conservan tildes, puntuación y contenido, sin abreviar o traducir.
- **Correo**: NFC, recorte exterior y minúsculas, sin colapsar espacios interiores.
  El formato se valida con z.string().email(), ya utilizado en autenticación.
  No se eliminan puntos, etiquetas + o particularidades del proveedor.
- **Ausencia de efectos laterales**: se devuelven valores nuevos y se prueban entradas
  congeladas. No se crean, actualizan o vinculan donantes y no se implementa un flujo HTTP.

## Pruebas escritas antes de implementar

Archivo: [normalizacion.test.js](../../../backend/src/modulos/donaciones/normalizacion.test.js).

| Requisito o escenario | Comprobaciones incluidas |
|---|---|
| FR-002 / P03 / SC-004, parte de conversión | Extremos incluidos, coma/punto, salida decimal e idempotencia; rechazo de cero, negativos, más de dos decimales, miles, exponente, desbordamiento, no finitos y tipos no admitidos. |
| FR-004 / P04 | NIF y NIE X/Y/Z válidos, letra incorrecta, longitud/prefijo incorrectos y presentación normalizable. Formato del correo y campos obligatorios no vacíos y de tipo texto. |
| FR-015 / P17, equivalencias puras | Composición NFC/NFD, espacios Unicode y mayúsculas; conservación de tildes, puntuación, dirección, puntos y etiquetas del correo. |
| Cambios reales | Otro NIF válido con el mismo correo y cambios en cada campo no se consideran equivalentes; no se elimina contenido para forzar coincidencias. |
| Ausencia de modificación | Objetos congelados, objeto de salida nuevo e idempotencia. Dos entradas inválidas idénticas no se dan por equivalentes. |

Estas comprobaciones cubren la parte pura de los requisitos. El rechazo funcional de
conflictos frente a donantes existentes y la reutilización sin sobrescritura se implementarán
en sus tareas posteriores; no se afirman comprobados por estas pruebas.
Los ayudantes de importes se utilizan realmente, sin sustituirlos por mocks.

## Comando y resultados reales

Todas las ejecuciones dirigidas utilizan el mismo comando, desde PowerShell en:

```text
E:\asignaturas\IWeb\Practica grupal\IWEB_ONG\backend
```

```powershell
npm test -- src/modulos/donaciones/normalizacion.test.js
```

No se carga .env, se configura una base ni se inicia un servicio para ejecutar la suite.
Vitest 2.1.9 ejecuta únicamente el archivo indicado. Las horas siguientes son las
mostradas por Vitest; los fallos de recolección no cuentan como pruebas funcionales aprobadas.

| Ejecución | Inicio informado | Código | Resultado real |
|---|---|---:|---|
| Antes de implementar | 18:29:48 | 1 | Una suite falla porque no existe normalizacion.js; no se recogen casos. Duración 1,69 s. |
| Primer intento con el módulo | 18:31:23 | 1 | La recolección falla porque el rótulo %j intenta serializar un BigInt. No se ejecutan casos. Duración 1,19 s. |
| Después de corregir la tabla de casos | 18:32:01 | 0 | Un archivo y 102 pruebas aprobados; 0 fallidos y 0 omitidos. Duración 1,43 s, 66 ms de pruebas. |
| Comprobación final tras ajustar formato de los archivos nuevos | 18:34:44 | 0 | Un archivo y 102 pruebas aprobados; 0 fallidos y 0 omitidos. Duración 2,73 s, 64 ms de pruebas. |

El caso BigInt se conserva como entrada inválida; Se cambia únicamente el formato del
rótulo. Los valores array se pasan como un único argumento de la tabla para que se
compruebe realmente su rechazo. No se eliminan casos para obtener el resultado final.

Extracto final:

```text
Test Files  1 passed (1)
     Tests  102 passed (102)
  Duration  2.73s
```

No se ejecutan la suite general, migraciones, pruebas de 004, compilación de frontend,
instalaciones o comprobaciones de Stripe real.

## Comprobación adicional durante la revisión

Se repite la prueba dirigida sobre los archivos entregados: inicio 18:55:00, código 0,
102 pruebas aprobadas, ninguna fallida u omitida; duración 1,76 s.

La comprobación con Prettier 3.6.2 y la configuración común detecta ajustes de formato
en normalizacion.js y normalizacion.test.js. Se aplica únicamente a esos dos archivos:

```powershell
npx --yes prettier@3.6.2 --check src/modulos/donaciones/normalizacion.js src/modulos/donaciones/normalizacion.test.js
npx --yes prettier@3.6.2 --write src/modulos/donaciones/normalizacion.js src/modulos/donaciones/normalizacion.test.js
```

Se comprobó el formato, los enlaces y el alcance de los archivos indicados.

Después del ajuste se repite el mismo comando de pruebas: inicio 18:58:10, código 0,
102 pruebas aprobadas, ninguna fallida u omitida; duración 1,19 s y 47 ms de pruebas.
No cambia el alcance funcional ni se completa otra tarea. Se conservan las ejecuciones
anteriores y T006 permanece pendiente.

## Conservación y límites

Los cambios del bloque se limitan a normalizacion.js, normalizacion.test.js, tasks.md y
este informe. Se contrastan sus rutas y las huellas de los archivos previos para conservar
migraciones, servicios comunes, secretos, lockfiles, código ajeno e informes históricos.
La comprobación de dependencias confirma que solo cambia la arista de T020 a T002 y
que las únicas tareas recién marcadas son T020 y T021. T001–T005 conservan su estado anterior.

La normalización no valida un cobro, no demuestra la identidad de una persona y no
consulta o autoriza aportaciones. T006 y el resto de tareas no ejecutadas permanecen
pendientes. No se realizan git add, commit, push, merge o cambio de rama.
Se detiene el bloque para revisión antes de continuar.
