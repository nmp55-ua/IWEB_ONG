# Recorridos reales de interfaz — HU-02

**Fecha**: 2026-11-10 · **Rama/base**: spec-002 / 85f2299fe33344165aee8b682fbaf902e4a7a01a · **Responsable**: Nada · **Revisor**: Javi.

## Alcance y procedimiento

Se aplica directamente el procedimiento local `.claude/skills/speckit-implement/SKILL.md`.
 La ejecución se limita a T025–T030. Los bloques T001–T024 ya registrados se conservan y no se repiten. El checklist de requisitos mantiene 16/16 entradas cumplimentadas. La selección de spec-002 se realiza sin persistir configuración.

El navegador de pruebas Chromium 156, visible a 1280×720, utiliza el build standalone existente de Astro, backend real y PostgreSQL en `ong_test_hu01`, esquema `hu01_integracion_fd4656ae02804528ac7effa875c870c8`. El banco instala adaptadores sintéticos y credenciales de pruebas. No se accede a datos de desarrollo ni se realizan pagos, cancelaciones, reentregas o envíos reales. Las comprobaciones de navegador y las consultas de este informe se ejecutan en este bloque; no se atribuyen a Nada ni a Javi.

Se amplía exclusivamente el soporte de pruebas:

- `historial-local.js`: concesión por IPC privado de un permiso invitado de ocho horas para una referencia sintética existente. Se verifica mediante el autorizador real que el permiso de operación es válido antes de comprobar que no autoriza el historial. No se añade una ruta HTTP ni se cambia autenticación de producto.
- `recorridos-historial.js`: proxy de pruebas, fallo 503 de una consulta y retención/liberación de respuestas reales. No sustituye los datos de PostgreSQL ni modifica estados de negocio.
- `traza-historial.js`: puente de lectura del observador y Performance Timeline reales; alcance y límites en [medición](medicion-historial-01.md).

## Resultados y trazabilidad

Las capturas están en [evidencias-interfaz-01](evidencias-interfaz-01/); [observaciones-dom.json](evidencias-interfaz-01/observaciones-dom.json) conserva la lectura del contenido accesible y el orden de las filas reales. No procede de DOM simulado.

| Tarea / origen                      | Comprobación ejecutada y resultado                                                                                                                                                                                                                                                                                                                                  | Evidencia                                                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| T025 · FR-007, E6, SC-003           | Acceso directo sin sesión: aviso para iniciar sesión, sin filas. Con permiso invitado válido para la referencia sintética, el historial sigue denegado.                                                                                                                                                                                                             | `t025-sin-sesion.png`, `t025-permiso-invitado-sin-historial.png`; IPC devuelve `autorizadoOperacion: true`.                                   |
| T025 · FR-007, E6, SC-003           | Sesiones simultáneas separadas por host: principal en 127.0.0.1 ve tres filas, 20,00/80,00 €; otra en localhost solo su fila de 7,00 €. Menú «Mis aportaciones» abre la página. Voluntario carece del enlace y el acceso directo muestra denegación, conservando Actividades, Donar y Mi calendario.                                                                | `t025-otra-sesion-7.png`, `t025-rol-sin-permiso.png`; casos principal/otra/menu del JSON.                                                     |
| T025 · FR-007                       | Desde la cuenta otra, GET con donanteId=1, correo de principal o referencia ajena: DATOS_INVALIDOS, sin filas ajenas. Complementa las denegaciones de API de T011; no se considera el menú un control suficiente.                                                                                                                                                   | `t025-selector-ajeno-rechazado.png`; tres respuestas completas en observaciones.                                                              |
| T026 · FR-001–FR-004/FR-006, E1–E3  | Principal: grupos descendentes 2026/2025, 20,00/80,00 €; fechas, modalidad y destino correctos. Se excluyen las aportaciones pendientes, rechazadas y canceladas del fixture.                                                                                                                                                                                       | `t026-principal-20-80.png`; contraste SQL y lectura de tres filas.                                                                            |
| T026 · FR-008, E5/E7/E8             | Sin vínculo: explicación y enlace, sin afirmar existencia de aportaciones. El enlace llega al formulario común sin pulsar enviar. Vinculado vacío: «Todavía no has realizado ninguna aportación» y enlace Donar alcanzable. Año 2024 sin filas: aviso específico y Todos los años recupera el historial.                                                            | `t026-sin-vinculo.png`, `t026-enlace-vincular-alcanzado.png`, `t026-vinculado-vacio.png`, `t026-anio-sin-resultados.png`.                     |
| T027 · FR-005/FR-008, E4/E8         | Año 2025 mediante Tab y Enter: solo 2025 y 80,00 €. Año 99: error junto al campo, sin aplicar el valor. Quitar filtro restituye ambos grupos.                                                                                                                                                                                                                       | `t027-filtro-teclado.png`, `t027-anio-invalido.png`; observaciones del foco y resultado.                                                      |
| T027 · contrato de interfaz         | Un 503 controlado muestra alerta y Reintentar, sin falso vacío; reintentar consulta PostgreSQL y recupera contenido. Durante carga no se presentan datos antiguos.                                                                                                                                                                                                  | `t027-error-y-reintento.png`, `t027-carga-sin-datos-antiguos.png`; red registra 503 simulado seguido de 200.                                  |
| T027 · contrato de interfaz         | Respuesta 2025 retenida; 2026 termina primero. Al liberar 2025 permanece únicamente 2026/20,00 €. En otra retención se abandona la página; liberar no vuelve a montar el historial.                                                                                                                                                                                 | `t027-respuesta-antigua-descartada.png`, `t027-desmontaje.png`; registro de red con liberación y `clienteCerrado` false/true respectivamente. |
| T028 · FR-002–FR-004, E1/E2, SC-001 | Fechas UTC a ambos lados del cambio de año Madrid se muestran 31/12/2025 y 01/01/2026 en grupos distintos. Empate: IDs de texto 9007199254740993 y 9007199254740992 en orden numérico descendente, estable tras recarga. Proyecto inactivo conserva su destino y los nulos muestran fondo general. Dos aportaciones de 999.999,99 € presentan total 1.999.999,98 €. | `t028-fechas-madrid.png`, `t028-empates-bigint.png`, `t028-total-grande.png`; valores SQL y orden DOM antes/después de recargar.              |

La comprobación de teclado acredita Tab/Enter, etiquetas y estados de alerta accesibles en estos recorridos; no constituye una auditoría completa con lector de pantalla. Los IDs BIGINT se contrastan en los marcadores de las filas renderizadas y en PostgreSQL, no mediante conversión a Number ni como un campo fiscal visible.

## Red, persistencia y ausencia de efectos

[red-local-01.json](evidencias-interfaz-01/red-local-01.json) registra método, ruta, estado y liberación de respuestas, sin cuerpos, cookies o cabeceras. El recorrido sin vínculo se repitió por este proxy para verificar ausencia de solicitud automática: solo consultas de historial, sesión y contexto; los únicos POST registrados son login. No se solicita un enlace de verificación.

Los balances [inicial](evidencias-interfaz-01/balance-inicial.json) y [final](evidencias-interfaz-01/balance-final.json) coinciden en cantidades y huellas SHA-256 de las ocho tablas de dominio controladas: 11 donantes, 135 aportaciones, 2 suscripciones, 0 operaciones, 0 eventos, 0 verificaciones, 1 correo del fixture y 0 certificados. El contador de adaptadores del banco termina en Stripe 0 / SMTP 0. Las sesiones de pruebas pueden cambiar por login y permiso sintético; no son una tabla de negocio y no se presentan como inmutables.

[contraste-persistencia.json](evidencias-interfaz-01/contraste-persistencia.json) relaciona lo presentado con el fixture: fechas, IDs, proyecto inactivo, importes y conjunto periódico. Estos controles complementan las pruebas exactas anteriores T011/T016; no se repiten sus suites ni se ejecuta T031.

## Comandos y límites

Desde backend, con DATABASE_URL/TEST_DATABASE_URL seleccionadas exclusivamente para ong_test_hu01 según el quickstart, secretos sintéticos en los hijos y sin sobrescribir .env:

```powershell
node src/modulos/donaciones/pruebas/recorridos-historial.js
node src/modulos/donaciones/pruebas/traza-historial.js
```

El primer arranque sin terminal interactiva cerró limpiamente al recibir fin de entrada; Se reinició una vez con terminal interactiva antes de los recorridos. Se conservan también las incidencias de preparación: selector de título inexacto corregido tras leer la página, login enviado antes de hidratación con validación «Indica tu correo» y repetido correctamente y ámbito DOM de la herramienta sin acceso a navigator/performance, resuelto mediante el puente de lectura. No se alteró el producto para ocultarlas. La consulta CIM de equipo no estuvo disponible y el entorno se obtuvo mediante Node/os. Las salidas extensas de la terminal no se usan como JSON: los balances se guardan desde consultas de solo lectura.

T025–T028 quedan acreditadas. T029 se documenta en el informe de medición. T030 no se completa: primer intento válido de 2.745,30 ms e intento posterior inválido por problemas de recursos. SC-002 permanece pendiente. No se atribuye aprobación a Javi ni cierre de HU-02.

## Cierre de recursos y comprobaciones del bloque

Se cerraron únicamente las tres pestañas creadas para el banco. El controlador respondió `recursosCerrados: true`; una consulta posterior de solo lectura a pg_namespace, verificando ong_test_hu01, confirmó cero esquemas con el nombre propio de esta ejecución. No se vació public ni se detuvieron servicios compartidos.

El primer cierre del puente detuvo su servidor, pero dejó la entrada estándar abierta. Se interrumpió únicamente ese proceso propio y se añadió `entrada.close()` a la instrumentación. La comprobación posterior `'cerrar' | node src/modulos/donaciones/pruebas/traza-historial.js`, desde backend, imprimió preparado/cerrado y terminó con código 0, sin abrir navegador ni consultar servicios externos. No se altera ninguna evidencia de duración anterior.

`node --check` en los tres archivos JavaScript del soporte y `git diff --check` terminaron con código 0. La primera invocación offline de Prettier mediante npm falló con ENOTCACHED; no se descargó ni instaló nada. Se utilizó después el ejecutable Prettier ya existente en la caché local del usuario, aplicando `.prettierrc.json` únicamente a esos tres archivos, tasks y los dos informes nuevos; el formateo terminó con código 0.

Se comprobó que solo cambiaron los archivos indicados.js` y `tasks.md`. .env, selección local e informes históricos conservan su contenido. output/ y tmp/ ya estaban sin seguimiento al inicio y se mantienen fuera del bloque. El índice permanece vacío; no se ejecuta Git de escritura.
