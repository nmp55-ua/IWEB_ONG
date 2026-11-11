# Medición real del historial — HU-02

**Rama**: spec-002 · **Base**: 85f2299fe33344165aee8b682fbaf902e4a7a01a · **Responsable**: Nada · **Revisor**: Javi.

**Estado vigente**: T030 completada por el intento 04 de **638,20 ms**, con 60 cuotas, cinco grupos y totales correctos en navegador real a 1280×720. [Evidencia de cierre y límites](cierre-t030-01.md). Los resultados y balances anteriores se conservan a continuación como evolución histórica; no se sustituyen ni reclasifican.

## Preparación y conjunto — T029

Se reutiliza el banco aislado de T025–T028: base `ong_test_hu01`, esquema `hu01_integracion_fd4656ae02804528ac7effa875c870c8`. No se emplea la base de desarrollo ni se generan pagos o envíos reales.

La consulta de solo lectura guardada en [contraste-persistencia.json](evidencias-interfaz-01/contraste-persistencia.json) acredita cuenta activa con rol donante, Usuario 11 y Donante 11 vinculados. Hay exactamente 60 cuotas confirmadas, correspondientes a 60 meses distintos, doce por año entre 2021 y 2025. Cada cuota es de 10.00, cada grupo suma 120.00 y el control global suma 600.00.

El navegador de pruebas se identifica con la cuenta `periodico@historial.example.test` mediante el formulario común. El retorno del login es `/`, no el historial; la captura [previa](evidencias-medicion-01/t029-cuenta-identificada-previa.png) muestra «Hola, periodico» en la portada. No se abre ni se precarga su historial para preparar el cronómetro.

Se conserva el build existente de Astro, sin repetir T001–T024: SHA-256 de `frontend/dist/server/entry.mjs`: `40598C4CBE40217E5FCD8C2B1A29543557D0FF990EBF168AB36E64416B4E50AB`. La isla fuente tiene SHA-256 `79AFE5C1C27EB655736CA40008EA69CB3C7353DF47EDBC78F279B0631F094030`.

## Instrumentación y formato de traza

Se usa el observador real ya preparado en el banco: Navigation Timing como inicio, 60 filas y cinco grupos/totales correctos y dos requestAnimationFrame antes del fin. No se resta la carga de recursos, hidratación o fetch ni se cronometra solo la API.

El ámbito de lectura de la herramienta de navegador no expone navigator/performance directamente. Se conserva ese impedimento de observación y se utiliza un puente exclusivo de pruebas en localhost:44325, que reenvía al banco 44322 sin modificar el producto, el observador o sus valores. El puente copia la medición original y Performance Timeline a un nodo JSON no visible; no calcula una duración alternativa. La navegación medida incluye también ese salto local adicional.

La traza se guardará como JSON de **Performance Timeline real del navegador**, con Navigation Timing, Resource Timing, Paint Timing, resultado íntegro del observador, entorno y contenido renderizado. No se presenta como un archivo DevTools de tareas de CPU. La captura y la revisión del contenido complementan el observador; no se utiliza el DOM ficticio de las pruebas unitarias.

La caché permanece con su configuración normal. La cuenta se identifica previamente y los recursos comunes pueden estar cargados por ese login; no se fuerza caché vacía ni se precarga la isla del historial en este origen para mejorar el resultado.

## Intentos de T030

Se registra a continuación cada navegación medida, con su resultado completo y limitaciones. Las comprobaciones previas de capacidad de la herramienta y del login no son mediciones de SC-002.

| Intento                  | Condiciones y resultado                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Evidencia                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 01, navegación principal | Cuenta previamente identificada y vinculada desde portada; primera apertura del historial en el origen medido, caché normal sin precarga del historial. Pestaña visible. 60 filas, cinco grupos de 12, cinco sumas de 120,00 €; contenido y captura correctos. Duración completa **2.745,30 ms**: no cumple <2.000 ms.                                                                                                                                                                                              | [Traza completa](evidencias-medicion-01/intento-01-traza.json), [captura completa](evidencias-medicion-01/intento-01-completa.png). |
| 02, repetición           | Navegación de vuelta a portada, esperar enlace del menú autenticado y nueva apertura con caché normal ya utilizada. La herramienta informa `net::ERR_INSUFFICIENT_RESOURCES`. El contenido acaba apareciendo, pero el observador declara la medición **inválida**, «No se presentó el conjunto esperado dentro del plazo de observación», 16.162,50 ms. Se conserva sin usarla como duración válida. El intento de captura termina en timeout de Page.captureScreenshot; no hay captura acreditada de este intento. | [Error conservado](evidencias-medicion-01/intento-02-error.txt), [traza recuperada](evidencias-medicion-01/intento-02-traza.json).  |

El archivo de error del intento 02 se escribió antes de recuperar su traza: su indicación inicial de que no se había obtenido medición se refiere a ese momento. La traza recuperada posteriormente aporta un resultado inválido, sin subsanar el error ni acreditar el umbral. No se borra esa secuencia.

La traza principal registra respuesta HTML a 733,40 ms, fin de load a 1.734,20 ms, fin de la consulta de aportaciones a 2.430,80 ms y presentación tras dos cuadros a 2.745,30 ms. Los recursos de la isla y algunos componentes se descargaron en esa navegación. Son tiempos de la misma Performance Timeline, sin restar red, hidratación, proxy o presentación. No se deduce una causa única del incumplimiento ni se sustituye por latencia de API.

## Entorno y revisión

Windows 11 Pro 10.0.26300 x64; Intel Core i5-8350U a 1,70 GHz, ocho procesadores lógicos y 8.441.491.456 bytes de memoria; Node 22.20.0 y PostgreSQL 16.15. Navegador de pruebas Chrome/156.0.0.0, viewport 1280×720, pixelRatio 1,5. La traza contiene userAgent, visibilidad y timeOrigin originales. La hora de captura principal es 2026-11-10T14:54:33.457Z; no se reconstruye la duración con horas de servidor.

Se revisaron el contenido accesible de los cinco grupos y la captura real. Las 60 filas están renderizadas en tablas desplazables; no se afirma que quepan simultáneamente en 720 píxeles. La captura de la primera pantalla muestra los encabezados, total y filas de 2025; la captura completa conserva el resto. No se realiza una auditoría visual exhaustiva de cada píxel.

## Balance y siguiente comprobación

**T029 completada; T030 pendiente.** El fixture y la medición de extremo a extremo están acreditados, pero ninguna ejecución válida satisface el umbral estricto. Se conservan ambos intentos; no se usa una media, no se descuenta la sobrecarga y no se declara SC-002 cumplida. No se ejecuta T031 por extensión.

Para continuar: preparar el mismo banco aislado con el build identificado, volver a verificar 60 cuotas/cinco grupos y el vínculo, identificar la cuenta desde portada y realizar otra navegación principal visible sin precargar el historial, conservando captura y traza. Si se emplea un navegador/entorno distinto, registrar esa diferencia; no sustituye ni borra el incumplimiento principal de este entorno. Si vuelve a incumplir, diagnosticar con la traza antes de proponer cambios del producto. La repetición no debe convertirse en una búsqueda de un valor favorable con caché sin documentar.

## Seguimiento de T030: intento 03 · 2026-11-10

Se conserva íntegro el balance anterior como estado de los intentos 01–02. Se ejecuta una única nueva navegación principal sobre un origen nuevo, con cuenta identificada y vinculada, build idéntico y sin precarga del historial. La exportación de traza se integra en el banco, eliminando el proxy adicional; Se registran presión de memoria y cambio de viewport. El observador original no cambia y no se descuenta tiempo alguno.

Resultado: **4.258,90 ms**, 60 cuotas y cinco grupos correctos, fuera del umbral. [Traza](evidencias-medicion-01/intento-03-traza.json), [captura visible](evidencias-medicion-01/intento-03-visible.png) y [diagnóstico completo](diagnostico-rendimiento-01.md). El intento de captura completa falló y se conserva esa limitación; no se repite la navegación. **T030 continúa pendiente**, sin cambiar los resultados anteriores ni avanzar a T031. La propuesta de corrección queda para revisión antes de modificar el producto.

## Intento 04 · 2026-11-10 — cierre de T030

Tras la liberación de recursos comunicada durante la prueba se comprueba memoria y se prepara una nueva sesión en 127.0.0.1:44327, con el mismo build, cuenta identificada/vinculada y sin historial precargado. Viewport efectivo 1280×720. Una única navegación completa registra **638,20 ms**, 60 cuotas, cinco grupos de doce, totales 120,00 € por año y control 600,00 €. Se conservan [traza](evidencias-medicion-01/intento-04-traza.json), [captura completa](evidencias-medicion-01/intento-04-completa.png) y [captura visible](evidencias-medicion-01/intento-04-visible.png).

**T030 completada**: se cumple el umbral estricto en esta ejecución. Recursos, escala, caché, etapas, revisión visual y límites constan en [cierre-t030-01.md](cierre-t030-01.md). Los intentos anteriores siguen acreditando sus propios resultados; no se usa una media ni se descuentan tiempos. No se implementa SSR ni se avanza a T031.
