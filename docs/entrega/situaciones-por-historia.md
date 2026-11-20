# Tres situaciones por historia (enunciado §5.1, punto 1)

> Para cada historia se revisaron el recorrido habitual, una entrada inválida o un caso límite y una
> condición de permisos o de estado. La columna «En el vídeo» remite a los pasos numerados (con su rótulo)
> del vídeo de cada historia (en `DemoSSD_G10.zip` y en https://demo-ong-g10.vercel.app); la columna «Prueba», a la prueba automática que la
> respalda. Todas las categorías aplican a las ocho historias, así que no ha hecho falta sustituir ninguna.
> Recopilado el 19/11/2026 y actualizado el 20/11/2026 con los vídeos nuevos, grabados con la aplicación en local y Stripe en modo de pruebas.

## HU-01 · Donación puntual o alta como socio (Nada)

Vídeo: [hu-01.mp4](https://demo-ong-g10.vercel.app/clips/hu-01.mp4).

| Situación | Qué se comprueba | En el vídeo de la historia | Prueba automática | Resultado |
|---|---|---|---|---|
| Recorrido habitual | Alta como socio de 10 €/mes: Checkout de prueba con la tarjeta 4242, confirmación por webhook, resultado y correo | pasos 7 a 12 | `donaciones/rutas.test.js` «resultado y correo propios…» | Correcto |
| Entrada inválida | Importe 0, destino sin elegir y NIF con letra de control incorrecta | pasos 2, 3 y 5 | `donaciones/normalizacion.test.js` y `rutas.test.js` (campos desconocidos) | Correcto |
| Permisos o estado | Datos fiscales de otro donante en una cuenta vinculada: se rechaza; una donación ya en preparación se reanuda en lugar de duplicarse | paso 6 (la reanudación de una donación en preparación se comprueba en la prueba automática) | `donaciones/servicio.test.js` «timeout y reinicio conservan solicitud/cuerpo/clave…» | Correcto |

## HU-02 · Historial de aportaciones (Nada)

Vídeo: [hu-02.mp4](https://demo-ong-g10.vercel.app/clips/hu-02.mp4).

| Situación | Qué se comprueba | En el vídeo de la historia | Prueba automática | Resultado |
|---|---|---|---|---|
| Recorrido habitual | Historial agrupado por año con su total; la cuota recién pagada aparece la primera | pasos 1 y 2 (la cuota recién pagada, en el vídeo de HU-01, paso 12) | `donaciones/historial.test.js` | Correcto |
| Caso límite | Filtro por un año sin aportaciones (2024): mensaje en lugar de tabla vacía | pasos 3 y 4 | `donaciones/historial.test.js` | Correcto |
| Permisos | Una cuenta sin vínculo verificado no ve nada aunque coincida el correo | paso 5 (y la vinculación con el enlace del correo, pasos 6 a 8) | `donaciones/historial.test.js` «sin vinculo no concede historial por correo coincidente…»; recorrido R3 | Correcto |

## HU-03 · Certificado fiscal anual (Rubén)

Vídeo: [hu-03.mp4](https://demo-ong-g10.vercel.app/clips/hu-03.mp4).

| Situación | Qué se comprueba | En el vídeo de la historia | Prueba automática | Resultado |
|---|---|---|---|---|
| Recorrido habitual | Certificado de 2025 con importe, fecha de emisión, código y PDF | pasos 1 y 2 | `certificados-informes/certificados.test.js` | Correcto |
| Caso límite | Ejercicio en curso (2026) y ejercicio sin aportaciones (2023) | pasos 3 y 4 | `certificados.test.js` «escenario 5 y FR-006…» y «escenario 4: ejercicio sin aportaciones → 404…» | Correcto |
| Permisos o estado | Verificación pública sin sesión: código válido y código inventado; otra cuenta no descarga el certificado ajeno | pasos 5, 6 y 7 | `certificados.test.js` «escenario 7: otra cuenta no puede descargar…» y «escenario 10…» | Correcto |

## HU-04 · Informes para la junta (Rubén)

Vídeo: [hu-04.mp4](https://demo-ong-g10.vercel.app/clips/hu-04.mp4).

| Situación | Qué se comprueba | En el vídeo de la historia | Prueba automática | Resultado |
|---|---|---|---|---|
| Recorrido habitual | Informe anual por proyecto con totales, por trimestre y exportado a CSV y PDF | pasos 2 a 6 | `certificados-informes/informes.test.js` (SC-003: CSV y PDF iguales a la pantalla) | Correcto |
| Entrada inválida o caso límite | Fin anterior al inicio; periodo sin datos (2020) | pasos 8 y 7 | `informes.test.js` «errores: fin anterior al inicio…» y «escenario 7: un periodo sin datos…» | Correcto |
| Permisos | Un coordinador no puede ver los informes | paso 1 | `informes.test.js` «escenario 9: 401 sin sesión y 403 sin rol de administrador» | Correcto |

## HU-05 · Consulta e inscripción en actividades (Javi)

Vídeo: [hu-05.mp4](https://demo-ong-g10.vercel.app/clips/hu-05.mp4).

| Situación | Qué se comprueba | En el vídeo de la historia | Prueba automática | Resultado |
|---|---|---|---|---|
| Recorrido habitual | Listado público, filtro por proyecto e inscripción con requisitos aceptados | pasos 1, 2, 4 y 6 | `voluntariado/servicio.test.js` «con plaza queda confirmada…» | Correcto |
| Entrada inválida | Inscribirse sin confirmar que se cumplen los requisitos | paso 5 | `servicio.test.js` «sin confirmar los requisitos → 400…» | Correcto |
| Permisos o estado | Sin sesión lleva a identificarse; actividad completa: solo lista de espera, y al cancelar otro entra el primero en espera | pasos 3 y 7 a 12 | `servicio.test.js` «completa: sin pedirlo → 409…» y «confirmada con lista de espera…» | Correcto |

## HU-06 · Calendario del voluntario (Javi)

Vídeo: [hu-06.mp4](https://demo-ong-g10.vercel.app/clips/hu-06.mp4).

| Situación | Qué se comprueba | En el vídeo de la historia | Prueba automática | Resultado |
|---|---|---|---|---|
| Recorrido habitual | Vista de lista con la siguiente actividad destacada y detalle | pasos 1 y 4 | `voluntariado/calendario.test.js` | Correcto |
| Caso límite | Actividad en lista de espera con su posición, en la lista y en la vista mensual | pasos 3 y 6 | `calendario.test.js` (escenario 1.2 y clarify Q3) | Correcto |
| Permisos o estado | La plaza promovida pasa a confirmada; sin rol de voluntario no hay calendario | paso 2 (y salir de la lista desde el calendario, paso 7; sin rol de voluntario, en la prueba automática) | `calendario.test.js` «401 sin sesión y 403 sin rol de voluntario» | Correcto |

## HU-07 · Gestión de actividades y lista de espera (Nicole)

Vídeo: [hu-07.mp4](https://demo-ong-g10.vercel.app/clips/hu-07.mp4).

| Situación | Qué se comprueba | En el vídeo de la historia | Prueba automática | Resultado |
|---|---|---|---|---|
| Recorrido habitual | Crear en borrador, publicar y consultar inscritos y lista de espera | pasos 6, 7 y 10 | `actividades/servicio.test.js` | Correcto |
| Entrada inválida | Formulario vacío, fin anterior al inicio y plazas por debajo de los inscritos | pasos 3, 5 y 9 | `actividades/servicio.test.js` «no deja bajar las plazas por debajo de los confirmados» | Correcto |
| Permisos o estado | Celebrada no editable; cancelar avisa por correo; no se publica con el proyecto inactivo | pasos 11, 12, 14 y 15 | `actividades/servicio.test.js` «no publica un borrador de un proyecto inactivo» | Correcto |

## HU-08 · Asistencia y horas de voluntariado (Nicole)

Vídeo: [hu-08.mp4](https://demo-ong-g10.vercel.app/clips/hu-08.mp4).

| Situación | Qué se comprueba | En el vídeo de la historia | Prueba automática | Resultado |
|---|---|---|---|---|
| Recorrido habitual | Pasar lista en una celebrada y ver el total en Mis horas (3,5 h + 2 h = 5,5 h) | pasos 4 y 6 | `actividades/asistencias.test.js` «total 5,5 con desglose…» | Correcto |
| Caso límite | Actividad futura: la lista se ve pero no se puede registrar; corregir una asistencia sin plazo | pasos 3 y 5 | `asistencias.test.js` «repetir el PUT no duplica y corregir conserva la fila» | Correcto |
| Permisos | Un voluntario que abre la página de pasar lista recibe el aviso de falta de permisos | paso 1 | `asistencias.test.js` «401 sin sesión»; el 403 al voluntario, en el vídeo | Correcto |
