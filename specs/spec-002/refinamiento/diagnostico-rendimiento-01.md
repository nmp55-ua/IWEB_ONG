# Diagnóstico y comprobación controlada de T030

**Fecha**: 2026-11-10 · **Rama/HEAD**: spec-002 / 85f2299fe33344165aee8b682fbaf902e4a7a01a · **Responsable**: Nada · **Revisor**: Javi.

## Estado y preservación

Se conservan los cambios locales anteriores, .env, output/, tmp/ y los informes. No se realizan operaciones Git de escritura. T001–T029 no se repiten como bloques y T031 no se ejecuta. Los intentos 01 y 02 mantienen sus archivos originales y clasificación: 2.745,30 ms válidos, fuera de umbral y repetición inválida por recursos respectivamente.

## Traza anterior y límites del diagnóstico

La [traza 01](evidencias-medicion-01/intento-01-traza.json) es Performance Timeline, no un perfil de CPU. Inicio de navegación: 0; petición del documento: 201,30 ms; respuesta completa: 733,40 ms; DOM interactivo: 1.599,80 ms; load: 1.734,20 ms. La isla del historial se solicita a 1.602,70 ms y termina a 1.852,90 ms. La consulta comienza a 1.978,40 ms, termina a 2.430,80 ms y el observador cierra a 2.745,30 ms, tras comprobar contenido y dos cuadros. El intervalo posterior a los datos es 314,50 ms. Esta medición incluye todo el recorrido, sin restas.

El puente anterior añade un servidor Node, otro salto HTTP y un segundo almacenamiento del HTML antes de entregar la respuesta. Su coste no está separado en la traza: no se inventa un tiempo ni se descuenta. Tampoco se interpreta el tiempo HTTP de la consulta como tiempo SQL, pues incluye red local, sesión, autorización y servidor.

La consulta de procesos del entorno restringido solo mostró su propia terminal y no sirve para describir el equipo completo. La consulta posterior de solo lectura fuera de ese ámbito observó unos 1.520 MB de memoria comprimida, Firefox con unos 1.152 MB y ChatGPT con unos 1.120 MB de working set. El nuevo banco registra **205.488.128 bytes libres de 8.441.491.456 bytes** al arrancar. Hay presión de recursos compatible con el error previo; no prueba su causa exacta ni autoriza a cerrar aplicaciones ajenas. No se confunde la suma de working sets con memoria física exclusiva.

## Preparación de una única nueva navegación

Se amplía solo la instrumentación del banco: opciones `puertoProxy` y `trazaNavegador`, con los valores anteriores por defecto. `traza-navegador.js` conserva la función de exportación del puente anterior; Se ejecuta en el HTML del banco, después del observador original, sin cambiar su cálculo. `medicion-historial.js` prepara el banco en **127.0.0.1:44326**, sin arrancar los proxies 44324/44325. El build de producto no se reconstruye ni modifica: SHA-256 de entry.mjs `40598C4CBE40217E5FCD8C2B1A29543557D0FF990EBF168AB36E64416B4E50AB`.

Base exclusiva ong_test_hu01; esquema propio `hu01_integracion_ccc2d9c68f344643b733e10abfb1d9fc`. Consulta previa de solo lectura: cuenta periodico activa, rol donante, vínculo por usuario_id; años 2025–2021, doce cuotas por grupo y 120.00 por año, 60 cuotas y 600.00 en total. No se consulta ni se precarga su historial mediante HTTP.

El inventario del navegador conservaba tres referencias a pestañas de los bancos anteriores (44324, 44322 y 44325). El intento de obtenerlas para cerrarlas terminó por timeout de asociación de la vista. No se afirma que estuvieran operativas, consumieran una cantidad determinada de memoria o quedaran cerradas. Siguiendo la recuperación documentada se crea una sola pestaña nueva operativa, sin reiniciar el navegador ni cerrar páginas del usuario.

Se inicia sesión mediante el formulario real, se espera la hidratación y se confirma «Hola, periodico» en portada. [Captura previa](evidencias-medicion-01/intento-03-previa.png). El origen nuevo evita reutilizar la caché del historial de otros puertos; Se mantiene caché normal y el login puede cargar recursos comunes. No se abre el historial antes de medir. El viewport efectivo de esta nueva pestaña es **442×524**, frente a 1280×720 antes: se registra como cambio de entorno, sin afirmar equivalencia geométrica entre intentos.

## Resultado del intento 03

Una sola navegación completa a `/mis-aportaciones?medir=1`, desde portada y con sesión identificada, registra **4.258,90 ms**. El observador declara `registrada`, pestaña visible, 60 IDs distintos, cinco grupos descendentes, doce filas por grupo, importes 10,00 €, totales 120,00 €, fechas y modalidad/destino correctos. No cumple el límite estricto.

[Traza íntegra](evidencias-medicion-01/intento-03-traza.json) y [captura visible](evidencias-medicion-01/intento-03-visible.png). La captura completa falló con `Unable to capture screenshot`; Se conserva [el error](evidencias-medicion-01/intento-03-captura-error.txt). Una captura posterior de viewport sí se guardó e inspeccionó: muestra usuario, filtro, total y primeras filas. No se presenta como captura completa de las 60 filas. La traza conserva las 60 filas renderizadas y los cinco grupos. Paint Timing está vacío en esta traza; no se inventan FCP ni un perfil de tareas de CPU.

| Etapa                       | Intento 01, con puente | Intento 03, sin puente |
| --------------------------- | ---------------------- | ---------------------- |
| Respuesta completa HTML     | 733,40 ms              | 1.064,60 ms            |
| DOM interactivo             | 1.599,80 ms            | 1.875,60 ms            |
| Load                        | 1.734,20 ms            | 1.933,20 ms            |
| Inicio consulta             | 1.978,40 ms            | 2.031,10 ms            |
| Fin consulta                | 2.430,80 ms            | 2.430,10 ms            |
| Duración HTTP consulta      | 452,40 ms              | 399,00 ms              |
| Fin presentación/observador | 2.745,30 ms            | 4.258,90 ms            |
| Intervalo datos → fin       | 314,50 ms              | 1.828,80 ms            |

El cuello de botella observado está en la ruta documento/hidratación y en el intervalo de presentación posterior a los datos, especialmente variable en el entorno con presión de memoria. La consulta ya comienza después del umbral en el intento 03. Quitar el puente no basta para cumplirlo; los cambios de viewport y recursos impiden atribuir causalmente la diferencia a un único componente. Sin perfil de CPU no se separan render React, layout, coste de comprobación del observador, planificación de cuadros y esperas del sistema. No hay evidencia suficiente para imputarlo a una consulta SQL lenta.

## Propuesta concreta, sin modificar el producto

Antes de optimizar, disponer de un navegador con recursos suficientes y viewport comparable y obtener un perfil de CPU que separe hidratación, render y observador. No se intentan navegaciones adicionales en este bloque para buscar un resultado favorable.

Si se confirma que la ruta cliente domina también en ese entorno, se propone **renderizar el primer historial en Astro mediante la misma consulta privada del backend**, remitiendo únicamente la sesión correspondiente y sin caché compartida y entregar esos datos iniciales a la isla; mantener React para filtro, errores y reintentos. Los puntos actuales son `frontend/src/pages/mis-aportaciones.astro` (isla client:load sin datos iniciales) y `HistorialAportaciones.jsx` (primera consulta en useEffect). Evitaría encadenar descarga/hidratación → primera consulta → render inicial. Exige revisar autorización de SSR, ausencia de fugas de caché y las regresiones de los estados existentes antes de aplicarse. No requiere cambiar contratos de datos ni permite afirmar por anticipado <2 s. **Propuesta pendiente de revisión, no implementada.**

## Comandos y cierre

Desde backend, con las variables de pruebas seleccionadas según quickstart y sin sobrescribir .env: `node src/modulos/donaciones/pruebas/medicion-historial.js`. El comando `cerrar` termina ese banco; Se obtiene Stripe 0 / SMTP 0 y `recursosCerrados: true`. Se cierra la nueva pestaña creada para esta ejecución. No se detienen servicios compartidos ni se alteran datos reales de pruebas de Stripe.

**T030 pendiente; SC-002 no acreditada.** No se marca ninguna tarea adicional, no se modifica el producto y no se ejecuta T031. Se conserva la medición fallida como diagnóstico, sin rebajar criterios.

Regresión proporcional de la instrumentación modificada, una vez cerrado el banco de medición: desde backend, `npm test -- src/modulos/donaciones/historial-banco.test.js --no-file-parallelism`, con variables de pruebas y PostgreSQL aislado. **9/9 aprobadas**, un archivo, duración de Vitest 15,00 s. Comprueba infraestructura y observador con su alcance unitario; no sustituye la navegación ni acredita SC-002. Se justifica por las nuevas opciones de puerto/exportación y no constituye el bloque T031.

## Inventario de esta ejecución

- Modificado: `backend/src/modulos/donaciones/pruebas/historial-local.js`.
- Nuevos: `backend/src/modulos/donaciones/pruebas/medicion-historial.js` y `backend/src/modulos/donaciones/pruebas/traza-navegador.js`.
- Añadido este informe y un apartado de seguimiento en `specs/spec-002/refinamiento/medicion-historial-01.md`.
- Nuevos en `specs/spec-002/refinamiento/evidencias-medicion-01/`: `intento-03-previa.png`, `intento-03-traza.json`, `intento-03-visible.png` e `intento-03-captura-error.txt`.

Se comprobó el formato, los enlaces y el alcance de los archivos indicados.