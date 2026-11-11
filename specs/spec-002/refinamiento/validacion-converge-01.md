# Validación de las correcciones T036–T037 — HU-02

**Fecha**: 2026-11-11 · **Rama**: spec-002 · **HEAD**: 0cc28b1e44a1d932cf1da61cdc869883652693c4 · **Responsable**: Nada · **Revisor**: Javi.

## Alcance y estado inicial

Se corrigen exclusivamente CONV-001/T036 y CONV-002/T037 del [primer converge](converge-1.md). Ese informe no se sobrescribe. Se conservan todos los cambios locales de T031–T035, incluida la simplificación posterior de README y LEEME y las evidencias e informes anteriores. El índice estaba vacío; no se ejecutan operaciones Git de escritura.

Las correcciones afectan al controlador de pruebas y al plan, no al producto, al observador ni a los criterios de aceptación. No se repiten build, suites funcionales completas, pagos, envíos, reentregas o mediciones. El resultado técnico general queda sujeto al siguiente converge; la aprobación de Javi sigue pendiente.

## CONV-001 / T036 — cierre del controlador

### Reproducción antes de corregir

Se añade primero `backend/src/modulos/donaciones/medicion-historial.test.js`. La prueba importa el controlador real, sustituye únicamente sus dependencias de banco y entrada estándar y provoca el rechazo de `banco.llamadas()` con un error de timeout sintético. No arranca servicios ni espera un timeout real para reproducir el rechazo.

Desde backend:

```powershell
npm test -- src/modulos/donaciones/medicion-historial.test.js --no-file-parallelism
```

Resultado inicial: **2 aprobadas y 1 fallida de 3**, código **1**, Vitest **1,36 s**. El caso de fallo de contadores conserva el error, pero la aserción de cierre falla: `banco.cerrar` recibió cero llamadas. La entrada sí se había cerrado. [Salida íntegra](evidencias-converge-01/regresion-inicial.txt). Se conserva la evidencia de este fallo antes de aplicar la corrección.

### Corrección mínima y comprobaciones

En el finally del controlador, la obtención/publicación de contadores se envuelve en un try/finally interno. Su finally espera `banco.cerrar()` y después consulta/publica el estado de recursos. Un fallo de contadores ya no impide alcanzar ese cierre. Tras el cierre satisfactorio se propaga el mismo objeto Error de contadores, sin convertir el resultado en éxito ni publicar contadores inventados.

La regresión comprueba tres rutas:

1. Rechazo de contadores: cierre de entrada y banco una vez, conservación del mismo Error, estado consultado tras cerrar y ausencia de un mensaje de contadores satisfactorios.
2. Recorrido satisfactorio: el estado de recursos solo se consulta después de terminar el cierre asíncrono.
3. Fallo previo al preparar el conjunto: se libera el banco y se conserva el error de preparación cuando la lectura de contadores finaliza correctamente.

Repetición del mismo comando: **3/3 aprobadas**, código **0**, Vitest **0,93 s**. [Salida](evidencias-converge-01/regresion-corregida.txt). La simulación acredita el control de flujo del controlador, no una terminación forzada de procesos externos ni una nueva medición de rendimiento.

### Regresión proporcional del banco real

Desde backend, con DATABASE_URL/TEST_DATABASE_URL iguales y seleccionadas exclusivamente para ong_test_hu01 según quickstart, secretos sintéticos y sin sobrescribir .env:

```powershell
Remove-Item Env:AHORA_SIMULADO -ErrorAction SilentlyContinue
npm test -- src/modulos/donaciones/medicion-historial.test.js src/modulos/donaciones/historial-banco.test.js --no-file-parallelism
```

Resultado: **12/12 aprobadas**, dos archivos, código **0**, Vitest **14,68 s**. [Salida](evidencias-converge-01/regresion-banco.txt). Incluye las tres regresiones del controlador y los nueve casos existentes del banco: arranque real, login, consulta, contadores, puertos propios, limpieza del esquema y fallo al arrancar Astro. El banco utiliza PostgreSQL aislado y Stripe/SMTP simulados; la prueba de fallo de contadores sigue siendo un caso unitario sobre el controlador real. Los casos del observador con DOM ficticio no se presentan como una nueva aceptación en navegador.

**T036 acreditada**: se reproduce el defecto, se garantiza el cierre en esa ruta de error y se conserva la propagación comprobada. No se modifica la función de observación ni los archivos de trazas/capturas.

## CONV-002 / T037 — coherencia del plan

Se modifican solo tres pasajes de plan.md:

- El balance de constitución remite a la matriz para la validación ejecutada y mantiene pendientes la aprobación de Javi y la comprobación posterior de convergencia.
- El paso 2 distingue la validación del filtro en servicio de la apertura de transacción en repositorio, mediante enTransaccion, antes de las lecturas.
- El paso 5 sitúa el cierre/liberación en repositorio, antes de devolver la lectura y de que el servicio componga el DTO.

La inspección de `repositorio.js` confirma BEGIN, COMMIT/ROLLBACK y liberación en el helper enTransaccion, además de SET TRANSACTION previo a vínculo/resúmenes/detalle en historialDeUsuario. En `servicio.js`, historial espera esa lectura y luego construye los grupos/DTO. No se cambian esos archivos para acomodar la documentación.

**T037 acreditada** documentalmente y por contraste con el código. La aprobación externa no se da por realizada; no se modifica el diagnóstico histórico para presentarlo como cerrado retroactivamente.

## Inventario y límites de la entrega

- Modificados: `backend/src/modulos/donaciones/pruebas/medicion-historial.js`, `specs/spec-002/plan.md` y `specs/spec-002/tasks.md`.
- Nuevos: `backend/src/modulos/donaciones/medicion-historial.test.js`, este informe y tres salidas en `specs/spec-002/refinamiento/evidencias-converge-01/`: regresion-inicial.txt, regresion-corregida.txt y regresion-banco.txt.

Los demás cambios locales pertenecen a entregas anteriores y se conservan. T036–T037 se marcan únicamente por las pruebas y comprobaciones anteriores. No se ejecuta otro converge ni se declara HU-02 terminada; no se publica o comunica el paquete de revisión.

## Verificación de preservación y documentación

Se comprobó que solo cambiaron los archivos indicados. README y LEEME conservan exactamente su simplificación local; converge-1.md, .env, configuración de selección, producto, observador y evidencias anteriores mantienen sus huellas. Los archivos nuevos se enumeran arriba y no reemplazan informes existentes.

Se comprobó el formato, los enlaces y el alcance de los archivos indicados.