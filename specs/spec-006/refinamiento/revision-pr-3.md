# Revisión del PR #3 (spec-006), 06/11/2026

Revisora: Nada. Los informes anteriores (`prueba-manual.md`, `converge-1.md`, `converge-2.md`) se dejan como
estaban; aquí va lo que salió de la revisión y lo que se ha hecho con ello.

## 1. Actualización al volver al calendario (T025)

**Hallazgo**: `alVolver()` de `CalendarioVoluntario.jsx` no pedía el calendario si la última petición había
salido hacía menos de 2 s. Si una plaza se liberaba en ese tiempo y se volvía enseguida, la inscripción seguía
«en lista de espera» y no se actualizaba sola. **Es correcto**: el margen servía para no pedir dos veces cuando
`visibilitychange` y `focus` llegan seguidos, pero se comía también las vueltas de verdad.

**Corrección**: `frontend/src/components/voluntariado/vuelta.js` (`crearVuelta`) apunta que se ha salido
(`visibilitychange` con la página oculta, o `blur` de la ventana) y recarga una sola vez en la primera vuelta
(`visibilitychange` visible o `focus`). Los dos avisos de una misma vuelta dan una petición, y ninguna vuelta se
pierde por rápida que sea. Si la página se abre en segundo plano, recarga la primera vez que se ve.

**Prueba de regresión**: `frontend/src/components/voluntariado/vuelta.test.js`, con el ejecutor de pruebas de
Node (`npm test` en `frontend/`; no añade dependencias). 5 pruebas: la vuelta rápida tras una carga recarga,
los dos avisos seguidos dan una sola recarga, un `focus` sin haber salido no recarga, varias salidas seguidas
recargan una vez cada una y la apertura en segundo plano. Resultado: 5 de 5. El back-end sigue igual (101
pasan y 3 se saltan) y el front-end compila.

**Comprobación en el navegador** (página `/mi-calendario` real contra la API, como `voluntario@`, que está en
lista de espera en «Visita a la depuradora»). Desde otra sesión, `voluntario6` cancela su plaza y `voluntario@`
pasa a confirmada. En la página se lanzan los avisos de salir y volver justo después de detectar el cambio. Se
comprueba que la última carga es anterior al cambio:

| Versión | Vuelta desde la última carga | Peticiones al volver | Pantalla 1,5 s después | 4,5 s después |
|---|---|---|---|---|
| Antes (margen de 2 s) | 294 ms | 0 | En lista de espera · posición 1 | En lista de espera · posición 1 |
| Después (`vuelta.js`) | 1091 ms, con `blur` + `visibilitychange` + `focus` | 1 | Confirmada | Confirmada |

Dos pasadas no valieron y se repitieron: en una, la carga periódica salió 25 ms antes de detectar el cambio y
ya lo traía; en la otra, la plaza ya estaba liberada antes de empezar.

## 2. Pruebas pendientes de T014 (T026)

**Hallazgo**: T014 estaba marcada, pero faltaban dos cosas que tiene que hacer una persona. **Es correcto**.

- **SC-002** (identificar la siguiente actividad en menos de 10 s): el tiempo de respuesta de la API no lo
  demuestra. **Pendiente** de cronometrarlo con una persona.
- **Cambio real de pestaña o ventana**: se ha intentado en el navegador integrado y en Chrome automatizado
  (chrome-devtools). En los dos, la pestaña de detrás sigue con `visibilityState = 'visible'` y no recibe
  `visibilitychange`, así que lanzar los avisos a mano es lo único que se puede hacer ahí. **Pendiente** en un
  navegador normal.

T014 se queda marcada por lo que sí se hizo, pero su nota ya dice que esas dos partes no están, y pasan a
T026, sin marcar.

Hecho a mano por Javi el 06/11/2026, en su navegador, con la versión corregida (T025) y los datos de
`npm run semillas`:

| Comprobación | Resultado |
|---|---|
| SC-002, cronometrado: desde que se abre *Mi calendario* hasta decir cuál es la siguiente actividad | Menos de 5 s (objetivo, < 10 s): **cumple** |
| Quickstart 2.3, cambiando de pestaña: `voluntario6` cancela en una ventana privada y se vuelve a la pestaña | «Visita a la depuradora» pasa a **Confirmada** sin recargar |
| Quickstart 2.3, cambiando de ventana | **Confirmada** sin recargar |
| «Actividad cancelada por el coordinador» y «Cambio de fecha o lugar» | No se repitieron a mano: usan la misma recarga al volver que 2.3, y en la prueba manual del 06/11 ya pasaron lanzando los avisos |

## 3. Prueba inestable encontrada al repetir la batería

Al volver a pasar las pruebas del back-end para esta revisión, una de cada seis ejecuciones fallaba en la prueba de
spec-005 «bajar plazas e inscribirse a la vez nunca deja más confirmadas que plazas (SC-003)». **El código está
bien; la prueba no**: solo aceptaba que ganara la bajada de plazas (200, y 409 para la inscripción). Cuando ganaba
la inscripción, la respuesta era la correcta (201, y 409 `PLAZAS_MENOR_QUE_INSCRITOS` para la bajada), pero la
prueba la daba por mala. Ahora acepta los dos órdenes, comprueba el motivo de cada rechazo y sigue comprobando
que nunca hay más confirmadas que plazas. Después del cambio: 8 ejecuciones seguidas de la batería completa,
101 pasan y 3 se saltan en todas.
