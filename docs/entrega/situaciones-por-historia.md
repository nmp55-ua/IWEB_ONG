# Tres situaciones por historia (enunciado §5.1, punto 1)

> Para cada historia se revisaron el recorrido habitual, una entrada inválida o un caso límite y una
> condición de permisos o de estado. La columna «Escena» remite al vídeo completo
> [`demo/demo-ong-completa.mp4`](demo/demo-ong-completa.mp4) (minuto entre paréntesis) y al clip de la
> historia en [`demo/index.html`](demo/index.html); la columna «Prueba», a la prueba automática que la
> respalda. Todas las categorías aplican a las ocho historias, así que no ha hecho falta sustituir ninguna.
> Recopilado el 19/11/2026 sobre `entrega-documentacion` con la aplicación en local y Stripe en modo de pruebas.

## HU-01 · Donación puntual o alta como socio (Nada)

Clip: [`demo/clips/hu-01.mp4`](demo/clips/hu-01.mp4).

| Situación | Qué se comprueba | Escena del vídeo | Prueba automática | Resultado |
|---|---|---|---|---|
| Recorrido habitual | Alta como socio de 10 €/mes: Checkout de prueba con la tarjeta 4242, confirmación por webhook, resultado y correo | escena 49 (5:26), escena 50 (5:33), escena 51 (5:39), escena 53 (5:51) | `donaciones/rutas.test.js` «resultado y correo propios…» | Correcto |
| Entrada inválida | Importe 0, destino sin elegir y NIF con letra de control incorrecta | escena 44 (4:57), escena 47 (5:13) | `donaciones/normalizacion.test.js` y `rutas.test.js` (campos desconocidos) | Correcto |
| Permisos o estado | Datos fiscales de otro donante en una cuenta vinculada: se rechaza; una donación ya en preparación se reanuda en lugar de duplicarse | escena 48 (5:19) | `donaciones/servicio.test.js` «timeout y reinicio conservan solicitud/cuerpo/clave…» | Correcto |

## HU-02 · Historial de aportaciones (Nada)

Clip: [`demo/clips/hu-02.mp4`](demo/clips/hu-02.mp4).

| Situación | Qué se comprueba | Escena del vídeo | Prueba automática | Resultado |
|---|---|---|---|---|
| Recorrido habitual | Historial agrupado por año con su total; la cuota recién pagada aparece la primera | escena 54 (6:01), escena 55 (6:07) | `donaciones/historial.test.js` | Correcto |
| Caso límite | Filtro por un año sin aportaciones (2019): mensaje en lugar de tabla vacía | escena 56 (6:13), escena 57 (6:18) | `donaciones/historial.test.js` | Correcto |
| Permisos | Una cuenta sin vínculo verificado no ve nada aunque coincida el correo | escena 58 (6:23) | `donaciones/historial.test.js` «sin vinculo no concede historial por correo coincidente…»; recorrido R3 | Correcto |

## HU-03 · Certificado fiscal anual (Rubén)

Clip: [`demo/clips/hu-03.mp4`](demo/clips/hu-03.mp4).

| Situación | Qué se comprueba | Escena del vídeo | Prueba automática | Resultado |
|---|---|---|---|---|
| Recorrido habitual | Certificado de 2025 con importe, fecha de emisión, código y PDF | escena 59 (6:34) | `certificados-informes/certificados.test.js` | Correcto |
| Caso límite | Ejercicio en curso (2026) y ejercicio sin aportaciones (2020) | escena 60 (6:40), escena 61 (6:47) | `certificados.test.js` «escenario 5 y FR-006…» y «escenario 4: ejercicio sin aportaciones → 404…» | Correcto |
| Permisos o estado | Verificación pública sin sesión: código válido y código inventado; otra cuenta no descarga el certificado ajeno | escena 62 (6:53), escena 63 (6:59) | `certificados.test.js` «escenario 7: otra cuenta no puede descargar…» y «escenario 10…» | Correcto |

## HU-04 · Informes para la junta (Rubén)

Clip: [`demo/clips/hu-04.mp4`](demo/clips/hu-04.mp4).

| Situación | Qué se comprueba | Escena del vídeo | Prueba automática | Resultado |
|---|---|---|---|---|
| Recorrido habitual | Informe anual por proyecto con totales, por trimestre y exportado a CSV y PDF | escena 66 (7:20), escena 67 (7:28), escena 68 (7:33), escena 69 (7:40) | `certificados-informes/informes.test.js` (SC-003: CSV y PDF iguales a la pantalla) | Correcto |
| Entrada inválida o caso límite | Fin anterior al inicio; periodo sin datos (2019) | escena 71 (7:53), escena 70 (7:46) | `informes.test.js` «errores: fin anterior al inicio…» y «escenario 7: un periodo sin datos…» | Correcto |
| Permisos | Un coordinador no puede ver los informes | escena 64 (7:08) | `informes.test.js` «escenario 9: 401 sin sesión y 403 sin rol de administrador» | Correcto |

## HU-05 · Consulta e inscripción en actividades (Javi)

Clip: [`demo/clips/hu-05.mp4`](demo/clips/hu-05.mp4).

| Situación | Qué se comprueba | Escena del vídeo | Prueba automática | Resultado |
|---|---|---|---|---|
| Recorrido habitual | Listado público, filtro por proyecto e inscripción con requisitos aceptados | escena 17 (1:55), escena 18 (2:02), escena 20 (2:17), escena 22 (2:30) | `voluntariado/servicio.test.js` «con plaza queda confirmada…» | Correcto |
| Entrada inválida | Inscribirse sin confirmar que se cumplen los requisitos | escena 21 (2:24) | `servicio.test.js` «sin confirmar los requisitos → 400…» | Correcto |
| Permisos o estado | Sin sesión lleva a identificarse; actividad completa: solo lista de espera, y al cancelar otro entra el primero en espera | escena 19 (2:10), escena 23 (2:37), escena 27 (3:03), escena 28 (3:10) | `servicio.test.js` «completa: sin pedirlo → 409…» y «confirmada con lista de espera…» | Correcto |

## HU-06 · Calendario del voluntario (Javi)

Clip: [`demo/clips/hu-06.mp4`](demo/clips/hu-06.mp4).

| Situación | Qué se comprueba | Escena del vídeo | Prueba automática | Resultado |
|---|---|---|---|---|
| Recorrido habitual | Vista de lista con la siguiente actividad destacada y detalle | escena 29 (3:19), escena 32 (3:37) | `voluntariado/calendario.test.js` | Correcto |
| Caso límite | Actividad en lista de espera con su posición, en la lista y en la vista mensual | escena 30 (3:25), escena 34 (3:49) | `calendario.test.js` (escenario 1.2 y clarify Q3) | Correcto |
| Permisos o estado | La plaza promovida pasa a confirmada; sin rol de voluntario no hay calendario | escena 31 (3:32) | `calendario.test.js` «401 sin sesión y 403 sin rol de voluntario» | Correcto |

## HU-07 · Gestión de actividades y lista de espera (Nicole)

Clip: [`demo/clips/hu-07.mp4`](demo/clips/hu-07.mp4).

| Situación | Qué se comprueba | Escena del vídeo | Prueba automática | Resultado |
|---|---|---|---|---|
| Recorrido habitual | Crear en borrador, publicar y consultar inscritos y lista de espera | escena 7 (0:44), escena 8 (0:52), escena 11 (1:11) | `actividades/servicio.test.js` | Correcto |
| Entrada inválida | Formulario vacío, fin anterior al inicio y plazas por debajo de los inscritos | escena 4 (0:24), escena 6 (0:38), escena 10 (1:04) | `actividades/servicio.test.js` «no deja bajar las plazas por debajo de los confirmados» | Correcto |
| Permisos o estado | Celebrada no editable; cancelar avisa por correo; no se publica con el proyecto inactivo | escena 12 (1:18), escena 13 (1:25), escena 15 (1:38), escena 16 (1:44) | `actividades/servicio.test.js` «no publica un borrador de un proyecto inactivo» | Correcto |

## HU-08 · Asistencia y horas de voluntariado (Nicole)

Clip: [`demo/clips/hu-08.mp4`](demo/clips/hu-08.mp4).

| Situación | Qué se comprueba | Escena del vídeo | Prueba automática | Resultado |
|---|---|---|---|---|
| Recorrido habitual | Pasar lista en una celebrada y ver el total en Mis horas (3,5 h + 2 h = 5,5 h) | escena 38 (4:17), escena 40 (4:30), escena 42 (4:41) | `actividades/asistencias.test.js` «total 5,5 con desglose…» | Correcto |
| Caso límite | Actividad futura: la lista se ve pero no se puede registrar; corregir una asistencia sin plazo | escena 37 (4:11), escena 39 (4:24) | `asistencias.test.js` «repetir el PUT no duplica y corregir conserva la fila» | Correcto |
| Permisos | Un voluntario que abre la página de pasar lista recibe el aviso de falta de permisos | escena 35 (3:58) | `asistencias.test.js` «401 sin sesión»; el 403 al voluntario, en la escena | Correcto |
