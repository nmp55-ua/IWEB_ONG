# T030 — navegación completa acreditada

**Fecha**: 2026-11-10 · **Rama/HEAD**: spec-002 / 85f2299fe33344165aee8b682fbaf902e4a7a01a · **Responsable**: Nada · **Revisor**: Javi.

## Preparación y condiciones

Se verifica rama, HEAD e índice vacío. Se conservan los cambios locales, configuración, secretos, output/, tmp/ e históricos. Nada comunica haber cerrado aplicaciones y pestañas innecesarias; la comprobación propia de Node/os registra a las 15:25:55.152Z **1.107.963.904 bytes libres** de 8.441.491.456. Tras preparar el banco quedan **928.845.824 bytes libres**. Es una mejora respecto a las comprobaciones anteriores, sin establecer un mínimo universal de memoria ni garantizar estabilidad de cualquier ejecución futura.

El banco sin puente adicional se prepara en un origen nuevo, `http://127.0.0.1:44327`, para evitar reutilizar recursos del historial de los puertos anteriores. La única ampliación de soporte de esta continuación es seleccionar el puerto mediante HU02_PUERTO_MEDICION, validado como entero entre 1024 y 65535, con 44326 por defecto. Es una variable del proceso de prueba; .env no se modifica. Desde backend, tras seleccionar exclusivamente ong_test_hu01 y las variables sintéticas del quickstart:

```powershell
$env:HU02_PUERTO_MEDICION = '44327'
node src/modulos/donaciones/pruebas/medicion-historial.js
```

Se conserva el build real de Astro sin cambios de producto: SHA-256 de `frontend/dist/server/entry.mjs` **40598C4CBE40217E5FCD8C2B1A29543557D0FF990EBF168AB36E64416B4E50AB**. No se implementa SSR, no se altera el observador y no se reconstruye el mismo build sin cambios que lo requieran.

Base exclusiva `ong_test_hu01`; esquema propio `hu01_integracion_69891ff9e03045a1a32cc629473f7e56`. La consulta previa del controlador acredita cuenta periodico activa, rol donante y vínculo mediante usuario_id; cinco grupos 2025–2021, doce cuotas confirmadas por grupo y 120.00 por año. El fixture vigente contiene una cuota de 10.00 por mes: 60 cuotas y control total 600.00. No se consulta el historial mediante HTTP antes de medir.

Se fija explícitamente el viewport **1280×720**. Se abre una sola pestaña nueva y se realiza login común con la cuenta sintética `periodico@historial.example.test`, esperando la hidratación del formulario y la identificación del menú. La [captura previa](evidencias-medicion-01/intento-04-previa.png) muestra «Hola, periodico» en portada. No se abre ni se precarga el historial de esa sesión. No se cierran pestañas ajenas ni procesos compartidos.

## Intento 04 — resultado

Una única navegación normal desde portada a `/mis-aportaciones?medir=1` produce **638,20 ms**, desde Navigation Timing 0 hasta el cierre del observador original, después de las comprobaciones de contenido y dos requestAnimationFrame. No se restan red, hidratación, consulta, layout ni instrumentación. Se excluyen únicamente el login y vínculo previos, conforme a PA2.3.

- Estado del observador: `registrada`; pestaña visible y viewport efectivo 1280×720.
- 60 IDs únicos renderizados, cinco grupos descendentes 2025, 2024, 2023, 2022 y 2021.
- Doce cuotas de 10,00 € por grupo, fechas mensuales correctas, modalidad «Cuota de socio» y destino «fondo general».
- Cinco totales de **120,00 €**, consistentes con el control de **600,00 €**.
- Lectura DOM posterior y revisión visual de la captura completa confirman grupos, filas y totales. No se exige que las 60 filas quepan simultáneamente en el viewport.

Evidencias propias de esta ejecución: [traza real](evidencias-medicion-01/intento-04-traza.json), [captura completa](evidencias-medicion-01/intento-04-completa.png), [captura visible](evidencias-medicion-01/intento-04-visible.png). Se conserva también `intento-04-final.png`, tomada después de una pulsación de teclado: muestra 2025 y el inicio de 2024; su nombre no acredita haber alcanzado el último año. La comprobación de los cinco años se respalda con la captura completa y la traza, no con esa captura parcial.

## Etapas, entorno y límites

| Etapa                       | Tiempo desde inicio |
| --------------------------- | ------------------- |
| Petición del documento      | 17,70 ms            |
| Documento recibido          | 60,40 ms            |
| DOM interactivo             | 207,30 ms           |
| Load                        | 232,60 ms           |
| Inicio consulta privada     | 296,00 ms           |
| Fin consulta privada        | 440,40 ms           |
| Fin presentación/observador | **638,20 ms**       |

La consulta HTTP ocupa 144,40 ms; el intervalo posterior a sus datos es 197,80 ms. No se interpreta ninguno como duración SQL o coste aislado del observador. La traza de Performance Timeline conserva Navigation/Resource/Paint Timing y el contenido real. No se presenta como un perfil de CPU.

Windows 11 Pro, Intel Core i5-8350U, ocho procesadores lógicos, Node 22.20.0 y el mismo build. Chrome/156.0.0.0, viewport 1280×720, pixelRatio observado **1.0000000298023224**, frente a 1,5 en los intentos anteriores. La traza se captura a **2026-11-10T15:27:32.076Z**. Se documentan tanto el cambio de recursos como el factor de escala; no se atribuye causalmente toda la mejora a la memoria.

Caché normal: el login carga recursos comunes y la traza registra algunos desde caché. La isla del historial, formato, tabla y estado vacío se descargan en esta navegación; no se precargan para reducir el resultado. El observador y la exportación se mantienen como en el intento 03, integrados en el banco y sin el servidor adicional de 44325. No hay calentamiento previo del historial de esta sesión, mediciones sucesivas, media ni selección de un valor favorable entre reintentos de esta continuación.

Los intentos 01 (2.745,30 ms), 02 (inválido por recursos) y 03 (4.258,90 ms) conservan íntegros archivos y clasificación. Los diagnósticos 01–02 describen esos estados anteriores. Esta medición acredita el requisito en el entorno indicado; no garantiza <2 s universalmente ni invalida los incumplimientos anteriores. La mejora observada no justifica modificar el producto ni aplicar la propuesta SSR pendiente.

## Cierre y alcance

Se cierra únicamente la nueva pestaña y se restablece el ajuste temporal del viewport. El comando `cerrar` del controlador devuelve **Stripe 0 / SMTP 0** y **recursosCerrados: true**. No hay pagos, envíos o consultas externas de Stripe. No se modifican autenticación, contratos, datos de desarrollo, migraciones o módulos ajenos.

**T030 completada; SC-002 acreditada por el intento 04**, con los límites anteriores. T031 y posteriores quedan pendientes. No se declara cierre de HU-02, revisión de Javi o aprobación externa; no se ejecuta Git de escritura.

Comprobaciones finales de esta continuación: sintaxis del controlador, formato con Prettier y git diff --check correctos; enlaces locales sin destinos ausentes. La consulta de solo lectura posterior al cierre confirma cero esquemas con el nombre propio de esta ejecución. .env, .claude/launch.json y las trazas comprobadas de los intentos 01–02 conservan sus huellas; el intento 03 y los informes de diagnóstico no se editan. El índice sigue vacío. No se repiten suites funcionales: la ejecución nueva acredita el controlador parametrizado y la navegación real; no se presenta la regresión 9/9 anterior como una ejecución de este bloque.

Archivos de esta continuación: `backend/src/modulos/donaciones/pruebas/medicion-historial.js`, `specs/spec-002/tasks.md`, este informe, `specs/spec-002/refinamiento/medicion-historial-01.md` y cinco evidencias `intento-04-*` (previa, completa, visible, final y traza) en `specs/spec-002/refinamiento/evidencias-medicion-01/`. Los demás cambios locales proceden de las entregas anteriores y se conservan.
