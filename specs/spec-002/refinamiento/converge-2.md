# Segundo diagnóstico de convergencia — HU-02

**Fecha**: 2026-11-11 · **Rama**: spec-002 · **HEAD**: 0cc28b1e44a1d932cf1da61cdc869883652693c4.

**Responsable**: Nada · **Revisor**: Javi.

## Resultado técnico

**Convergencia técnica alcanzada.** La implementación satisface el alcance contrastado de especificación, plan y tareas. CONV-001 y CONV-002 están resueltos; no se identifican brechas nuevas accionables. El desarrollo y la verificación técnica de HU-02 pueden darse por finalizados para el árbol local examinado, con los límites de evidencia indicados en este informe.

No se añaden tareas y tasks.md se conserva byte por byte. La única escritura de esta fase es este diagnóstico; no se realizan correcciones ni limpieza de históricos.

## Alcance y método

Se aplica la definición local de [.claude/skills/speckit-converge/SKILL.md](../../../.claude/skills/speckit-converge/SKILL.md). La selección temporal resuelve specs/spec-002 mediante check-prerequisites.ps1 -Json -PathsOnly, sin persistir configuración; Se verifica directamente la existencia de spec, plan y tasks. Esta adaptación evita la escritura de selección del modo general. No hay hooks de converge registrados. El informe se guarda conforme al alcance solicitado, conservando el [diagnóstico inicial](converge-1.md).

Se revisan los artefactos de intención, constitución y código en su ámbito: rutas/controlador/servicio/repositorio de donaciones, página e isla de historial, funciones de formato/consultas, entrada de menú, soporte de pruebas y regresión del controlador. Se contrastan contratos, modelo de lectura, quickstart, matriz e informes. README y LEEME se examinan en su versión local simplificada y se conservan.

Las comprobaciones nuevas son inspección estática, trazabilidad, revisión de registros, validación de enlaces, inventario de archivos y lectura de la traza guardada. No se ejecutan suites, build, bases de datos o navegador; no aparece una razón técnica que justifique repetir las ejecuciones acreditadas. No se utilizan marcas de tarea o referencias de matriz como sustituto de sus pruebas.

## Cierre de hallazgos anteriores

| ID       | Origen y gravedad inicial                                                  | Contraste de corrección                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Estado                                                          |
| -------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| CONV-001 | partial, baja · quickstart §5, T022/T024; corrección T036                  | [Controlador](../../../backend/src/modulos/donaciones/pruebas/medicion-historial.js), líneas 44–52: el finally interno espera banco.cerrar aunque falle banco.llamadas. [Regresión](../../../backend/src/modulos/donaciones/medicion-historial.test.js), casos de líneas 46, 59 y 79: error conservado, cierre asíncrono antes de consultar su estado y liberación ante fallo de preparación. Los registros conservan la reproducción con cero llamadas al cierre, seguida de 3/3 dirigidas y 12/12 con banco. | **Resuelto** en el alcance comprobado.                          |
| CONV-002 | contradicts, baja · constitución III y diseño de consulta; corrección T037 | [Plan](../plan.md), líneas 43, 48 y 51: validación acreditada remitida a matriz; transacción en repositorio y composición posterior del DTO. [Repositorio](../../../backend/src/modulos/donaciones/repositorio.js), líneas 39–88: BEGIN, COMMIT/ROLLBACK y release mediante enTransaccion; aislamiento antes de leer. [Servicio](../../../backend/src/modulos/donaciones/servicio.js), historial desde línea 155: valida, espera lectura y compone DTO.                                                        | **Resuelto** documentalmente y coherente con la implementación. |

[validacion-converge-01.md](validacion-converge-01.md) conserva el método y los resultados. Se contrastan las salidas [inicial](evidencias-converge-01/regresion-inicial.txt), [corregida](evidencias-converge-01/regresion-corregida.txt) y [conjunta](evidencias-converge-01/regresion-banco.txt). El caso de fallo de contadores simula el rechazo de la dependencia, ejecutando el controlador real; los nueve casos del banco comprueban infraestructura real aislada. No se presenta esa combinación como un nuevo recorrido de navegador o una medición.

## Cobertura de aceptación

| Obligaciones         | Implementación y evidencia contrastadas                                                                                                                                                                                                                                                                                                                 | Balance                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| FR-001/FR-006; E1/E3 | Repositorio filtra por Donante vinculado y estado confirmada. Pruebas de modalidades, exclusiones, cuotas de suscripción cancelada y conjuntos de 60/61 filas; contenido básico visible.                                                                                                                                                                | Conforme; sin corte funcional a 60.                                    |
| FR-002; E1/E4        | EXTRACT con Europe/Madrid, rango anual semiabierto, orden fecha_cobro/id descendente y BIGINT textual. Casos UTC/Madrid y empates contrastados con SQL, DTO y filas renderizadas.                                                                                                                                                                       | Conforme.                                                              |
| FR-003; SC-001       | SUM NUMERIC textual y formato anual por dígitos, sin máximo individual. Suma de 1.999.999,98 € y control independiente; certificado, historial y SUM coinciden en 1.00 y 4.00 después de reconciliar.                                                                                                                                                   | Conforme; Se conserva el desfase fiscal esperado antes de reconciliar. |
| FR-004; E2           | Proyección mínima, fecha Madrid, importe, modalidad y nombre del proyecto o fondo general, incluido proyecto inactivo. Código, DTO y capturas coherentes.                                                                                                                                                                                               | Conforme.                                                              |
| FR-005; E4/E8        | Año único validado; aplicar/quitar filtro; error/reintento; secuencia e invalidación al desmontar. Pruebas puras y recorridos con respuestas reales retrasadas por el proxy de pruebas.                                                                                                                                                                 | Conforme.                                                              |
| FR-007; E6; SC-003   | Sesión activa/rol comunes y req.usuario.id del servidor; vínculo por usuario_id; claves de query ajenas rechazadas y cabeceras private/no-store antes de autorización. Sesiones separadas, permiso invitado, cuenta desactivada y correo coincidente contrastados.                                                                                      | Conforme en los casos ejecutados.                                      |
| FR-008; E5/E7/E8     | Sin vínculo, vacío global y año vacío distintos. Explicación/enlaces sin consulta por correo, POST de verificación automático ni efectos de negocio. Código, red, balances y pantalla respaldan el resultado.                                                                                                                                           | Conforme.                                                              |
| E9; SC-002           | [Traza del intento 04](evidencias-medicion-01/intento-04-traza.json): estado registrada, inicio 0, **638,20 ms**, pestaña visible 1280×720, 60 IDs únicos y cinco grupos de doce con total 120.00 cada uno. [Captura completa](evidencias-medicion-01/intento-04-completa.png) y [cierre T030](cierre-t030-01.md) respaldan presentación y condiciones. | Conforme en el entorno registrado, sin extrapolación universal.        |

La [matriz de aceptación](matriz-validacion-01.md) relaciona estas obligaciones con pruebas y evidencias concretas. Se examinan también siete decisiones técnicas: reutilización de entidades/middleware; propiedad por usuario_id; instantánea y liberación; fechas/orden/filtro; exactitud monetaria; isla y control de respuestas; banco/observador aislados. No se detectan desviaciones que requieran implementación adicional.

La [regresión final conservada](evidencias-finales-01/regresion-backend.txt) acredita 442/442 pruebas en su alcance y la [de frontend](evidencias-finales-01/pruebas-frontend.txt), 26/26. El [build](evidencias-finales-01/build-frontend.txt) termina correctamente. La corrección posterior del soporte tiene su propia regresión 12/12. Esos resultados corresponden a ejecuciones anteriores identificadas; no se suman como una única suite nueva ni se presentan como pruebas ejecutadas durante converge-2.

## Coherencia documental, archivos y constitución

- Plan, contratos, código y explicación operativa coinciden en rutas, propietario, instantánea, estados, dinero y ausencia de efectos. La simplificación de README/LEEME mantiene el funcionamiento y los enlaces necesarios; no requiere ampliar esos documentos.
- Las frases de estado de apartados fechados de implementación y diagnóstico describen su propia fase. Se conservan como evolución y no se convierten en brechas actuales por discrepar del resultado posterior de este informe.
- Se comprueban **175 enlaces locales de 24 documentos Markdown**, incluyendo históricos y los dos documentos operativos, sin destinos ausentes antes de crear este informe. Las nuevas referencias de este diagnóstico se comprueban al guardarlo. La existencia de enlaces se complementa con lectura de código, registros y traza; no demuestra por sí sola ejecución.
- El inventario seguido y sin seguimiento contiene los archivos de aplicación, documentación, soporte y evidencias esperados. No se detectan nombres de paquetes/material de Oleaje o dependencias Python ajenas versionadas. output/tmp no contienen archivos en la inspección, únicamente el directorio vacío output/pdf. Se conservan esos directorios y la configuración local, sin limpieza.
- Una comprobación acotada de **42 textos Markdown/JSON/TXT de HU-02** no encuentra patrones de claves Stripe, tokens GitHub o conexiones PostgreSQL con contraseña. No se leen secretos para incluirlos en el informe ni se presenta este escaneo como una auditoría exhaustiva.
- Los doce principios constitucionales se contrastan en su ámbito técnico: alcance y simplicidad; criterios verificables; español, fecha y euros; propiedad y conservación; pila y reutilización; convenciones y procedencia de cambios. Este diagnóstico no introduce entidades, migraciones, decisiones comunes u operaciones de integración.

La comprobación final de **423 huellas** no detecta modificaciones en los archivos existentes al inicio. Solo se añade converge-2.md; tasks.md, README, LEEME, configuración e históricos quedan intactos respecto al estado local recibido. Los 18 enlaces del informe tienen destino existente y su formato Markdown pasa la configuración común. El índice permanece vacío.

## Límites preservados

Los pagos y SMTP del banco son simulados. La consulta no necesita una nueva prueba real de Stripe ni recepción de correo para su aceptación. El contraste de HU-03 se hace después de reconciliar el mismo ejercicio; no acredita cron desplegado.

La traza guardada es Performance Timeline, no un perfil de CPU. Se conservan 2.745,30 ms y 4.258,90 ms fuera de umbral, el intento inválido por recursos y sus errores de captura. Los cambios de memoria, caché y factor de escala del intento favorable siguen documentados. No se resta tiempo ni se atribuye causalmente toda la diferencia a un componente. La propuesta SSR no se implementó ni constituye trabajo pendiente del alcance requerido.

El resultado de cierre técnico se apoya en el árbol local examinado y en las comprobaciones conservadas; no es una prueba de todos los equipos, volúmenes, fallos múltiples o ataques posibles.

## Métricas y decisión

| Concepto                      | Resultado                                             |
| ----------------------------- | ----------------------------------------------------- |
| Requisitos funcionales        | 8 contrastados                                        |
| Criterios de éxito            | 3 contrastados                                        |
| Escenarios de aceptación      | 9 contrastados                                        |
| Decisiones técnicas           | 7 contrastadas                                        |
| Tareas existentes             | 37 contrastadas; 37 marcadas, 0 pendientes            |
| Principios constitucionales   | 12 examinados en su ámbito                            |
| Hallazgos anteriores          | 2 resueltos                                           |
| Hallazgos nuevos por tipo     | missing 0 / partial 0 / contradicts 0 / unrequested 0 |
| Hallazgos nuevos por gravedad | crítica 0 / alta 0 / media 0 / baja 0                 |
| Tareas añadidas               | 0                                                     |

**Resultado: converged.** No se requiere otro bloque de implementación para el alcance técnico especificado. Se conserva tasks.md sin cambios y se entrega únicamente este diagnóstico para su comprobación.
