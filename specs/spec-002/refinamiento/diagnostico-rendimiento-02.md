# T030 — comprobación previa y decisión de parada

**Fecha**: 2026-11-10 · **Rama**: spec-002 · **HEAD**: 85f2299fe33344165aee8b682fbaf902e4a7a01a · **Responsable**: Nada · **Revisor**: Javi.

## Estado comprobado

Se conserva el estado local del bloque anterior, incluido tasks.md modificado y los auxiliares/informes sin seguimiento. El índice está vacío. .env, .claude/launch.json, output/, tmp/, informes y evidencias anteriores no se editan. No se inicia T031.

SC-002 sigue pendiente: los intentos válidos de 2.745,30 y 4.258,90 ms no cumplen <2.000 ms. El intento 02 permanece inválido por recursos. Esta comprobación previa **no constituye un intento 04** y no modifica esas clasificaciones.

## Recursos y navegador

La primera lectura de Node/os devuelve 265.158.656 bytes libres de 8.441.491.456 bytes totales. Una segunda lectura, conservada con fecha en [comprobacion-entorno-02.json](evidencias-medicion-01/comprobacion-entorno-02.json), devuelve 515.174.400 bytes libres: aproximadamente 491 MiB, un 6,1 % del total. La memoria disponible varía; no se presenta una cifra puntual como reserva garantizada para el navegador.

La consulta de procesos de solo lectura fuera del entorno restringido observa unos 1.598 MB de memoria comprimida, ChatGPT con 1.042 MB, Firefox con 651 MB y Code con 547 MB de working set. No se suman esos valores como memoria física exclusiva ni se atribuye la presión a una aplicación concreta. No se cierran procesos o páginas del usuario. La consulta de puertos no devuelve listeners en 44322–44326; no se arranca otro banco para esta comprobación.

El inventario del navegador mantiene las tres referencias antiguas de los bancos 44324, 44322 y 44325 ya descritas en el diagnóstico anterior; no se presume que representen vistas operativas ni que aporten memoria recuperable. No se repiten los intentos de asociación que habían terminado por timeout.

Se consulta la capacidad documentada de viewport: permite fijar explícitamente 1280×720 y restablecerlo al terminar. Ese será el tamaño comparable al intento 01; el intento 03 conserva su tamaño original 442×524. No se inicia una navegación con el tamaño incorrecto ni se afirma haber validado un viewport efectivo nuevo. Tampoco se mide en una pestaña oculta.

No hay un mínimo de RAM aprobado en los requisitos y no se introduce uno. La combinación de presión actual, errores previos de recursos/captura y ausencia de un perfil que separe render de observación impide **acreditar ahora condiciones suficientemente controladas**. Esto no prueba que cualquier navegación sea imposible ni convierte las mediciones válidas anteriores en inválidas. Se aplica la parada prevista para un entorno de medición no acreditado.

## Carga, hidratación, presentación y observador

Las trazas y sus etapas se mantienen en [diagnostico-rendimiento-01.md](diagnostico-rendimiento-01.md). El intento 01 termina de recibir datos a 2.430,80 ms y cierra a 2.745,30 ms; el intento 03, sin puente adicional, termina los datos a 2.430,10 ms y cierra a 4.258,90 ms. La variación posterior a los datos no se explica con el tiempo HTTP ni permite imputarla a SQL. Resource Timing incluye sesión, autorización, red y servidor; no contiene tiempos de ejecución SQL.

La inspección del observador en `backend/src/modulos/donaciones/pruebas/historial-local.js` confirma:

- Observa childList y atributos de todo documentElement con subtree. Cada lote de mutaciones puede invocar la comprobación antes de que haya contenido listo.
- Una comprobación completa lee geometría y estilo de la región, cinco totales y 60 filas mediante getClientRects/getComputedStyle; además inspecciona celdas, fechas, importes, destinos y unicidad. Es trabajo real que puede forzar cálculo de layout.
- Tras la primera comprobación correcta espera dos requestAnimationFrame y vuelve a comprobar el contenido. El indicador finalizando evita iniciar nuevas comprobaciones completas durante esa espera.
- El exportador consulta cada 50 ms el resultado. La serialización de Performance Timeline y la lectura de innerText se realizan después del instante final almacenado, por lo que no deben descontarse de ese instante. El sondeo previo sí pertenece al entorno instrumentado.

No se ha medido el tiempo individual de esas operaciones ni se dispone de perfil de CPU. Los 1.828,80 ms posteriores a los datos en el intento 03 **no se presentan como coste del observador**: también pueden incluir React, layout, espera de cuadros y planificación bajo presión de recursos. Cambiar el observador ahora y comparar directamente los resultados anteriores introduciría otra variable. No se simplifican sus comprobaciones ni se altera el inicio/fin para favorecer el resultado.

La página actual usa HistorialAportaciones con client:load y la primera consulta se inicia en useEffect. Esa cadena hace plausible adelantar datos mediante SSR, pero el diagnóstico disponible no demuestra que sea una corrección suficiente del incumplimiento. No se implementa SSR ni se cambian contratos, caché o mecanismos de sesión sobre una atribución no verificada.

## Continuación concreta

1. Disponer de un equipo/navegador con margen de recursos estable. La reducción de aplicaciones o pestañas ajenas debe realizarla su propietario; no se finalizan procesos automáticamente ni se borran datos para liberar memoria.
2. Preparar una sola sesión del banco aislado, con build identificado, viewport efectivo 1280×720 y cuenta vinculada. Confirmar memoria y ausencia de errores de recursos antes de la navegación principal, sin precargar el historial.
3. Registrar un perfil real de tareas/CPU y las etapas del observador para distinguir su coste de la hidratación y del render. Mantener íntegra la duración de navegación, sin restas; documentar cualquier instrumentación nueva y su sobrecarga. No convertir esa preparación en sucesivas navegaciones hasta obtener un valor favorable.
4. Si el perfil confirma el encadenamiento cliente como cuello de botella, aplicar la optimización SSR mínima ya autorizada: consulta al backend privado con la sesión de la petición, sin caché compartida ni datos privados de build, sin consulta inicial duplicada; conservar filtros, reintentos y estados. Acreditar aislamiento entre cuentas y anónimo, regresiones proporcionadas y reconstruir antes de medir. No dar esas garantías por comprobadas antes de implementarlas y probarlas.
5. Medir una navegación completa y conservar captura, traza, entorno y cualquier fallo. Solo marcar T030 si se presentan las 60 cuotas, cinco grupos y totales correctos en menos de 2.000 ms.

## Resultado y archivos de este bloque

**T030 y SC-002 permanecen pendientes.** No hay medición nueva, modificación de producto o instrumentación, rebuild ni pruebas funcionales repetidas. No se presenta ninguna ejecución anterior como resultado nuevo. Se realizan únicamente inspección estática y comprobaciones previas de entorno.

Archivos nuevos: este informe y `specs/spec-002/refinamiento/evidencias-medicion-01/comprobacion-entorno-02.json`. tasks.md y los demás cambios existentes permanecen intactos en esta continuación. No se ejecuta Git de escritura ni T031.
