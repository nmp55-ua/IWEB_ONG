# Contrato de interfaz de HU-02

**Estado**: implementado y validado en spec-002; cierre técnico en converge-2 · **Responsable**: Nada · **Revisor**: Javi

## Entrada y estructura

Página `/mis-aportaciones`, accesible desde «Mis aportaciones» en el menú de donante. Se activa la entrada ya reservada sin alterar enlaces o permisos de otras historias. El acceso directo aplica las mismas comprobaciones de servidor que el acceso desde menú.

Se utiliza `Layout.astro` y una isla `HistorialAportaciones` con `client:load`. Las llamadas pasan por el cliente común `api.get('/yo/aportaciones')`. Se reutilizan Tabla, Campo, Boton, Aviso y EstadoVacio según sus interfaces vigentes.

El título es «Mis aportaciones». Con resultados se muestran grupos anuales descendentes, cada uno con su total en euros y una tabla de fecha, importe, modalidad y destino. Las filas siguen el orden recibido; su clave es el ID textual. «Cuota de socio» presenta `cuota_socio`. No se añaden datos personales, enlaces de pago, edición o descarga de certificados a este alcance.

Los grupos usan encabezados accesibles. La tabla y sus avisos pueden recorrerse con teclado; las filas de la historia completa permanecen en el documento y pueden verse mediante desplazamiento, sin páginas ocultas ni carga diferida para el caso de 60 cuotas.

## Estados

| Estado                                            | Presentación y acciones                                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Consulta inicial o filtro en curso                | Indicador de carga y región `aria-busy`; no mostrar todavía mensaje de historial vacío ni un total cero inventado               |
| Sin sesión                                        | Aviso y acceso a `/entrar?volver=/mis-aportaciones`, usando el flujo existente                                                  |
| Rol incorrecto                                    | Aviso de falta de permiso, sin filas ni intento de cambiar roles                                                                |
| Sin vínculo                                       | Explicación de vinculación y enlace `/donar/vincular`; no afirmar que hay o no hay donaciones ni enviar enlaces automáticamente |
| Vinculado sin confirmadas                         | «Todavía no has realizado ninguna aportación» y enlace `/donar`                                                                 |
| Año sin resultados, con confirmadas en otros años | «No hay aportaciones confirmadas en [año]» y «Todos los años» para quitar el filtro                                             |
| Con resultados                                    | Todas las filas seleccionadas, grupos y totales exactos                                                                         |
| Error de red o servidor                           | Aviso de error y reintento de la misma consulta; no presentar un resultado anterior como respuesta al nuevo filtro              |

La página no contiene un formulario de verificación ni solicita otro enlace. El enlace de HU-01 conserva su recorrido y autorización actuales.

## Filtro

Campo «Año» numérico de cuatro cifras, mínimo 1000, máximo 9999 y paso 1, botón «Filtrar» y acción «Todos los años». Vacío con «Todos los años» significa quitar el filtro; enviar un valor vacío como filtro anual se valida junto al campo. Se permite consultar un año válido sin aportaciones para distinguirlo del historial global vacío.

El estado aplicado procede de `filtroAnio` de la respuesta; el texto en edición no cambia el significado de los resultados ya recibidos. Al iniciar otra consulta se muestra carga hasta recibir la respuesta correspondiente. Las respuestas de solicitudes anteriores no pueden sobrescribir las de una selección posterior. Desmontar la isla impide actualizar su estado.

El filtro se mantiene en el estado de la página; no requiere cambiar el cliente común, persistir datos privados ni introducir un nuevo sistema de navegación. No se presupone que `api.get` acepte cancelación de fetch.

## Presentación exacta

- Fecha mediante el helper común con Europe/Madrid: dd/mm/aaaa.
- Importe de cada fila mediante formato común dentro del rango individual vigente.
- Total anual mediante función pura local sobre texto decimal: `"1999999.98"` se muestra como «1.999.999,98 €», sin redondear ni truncar.
- Nombre del proyecto asociado, aunque esté inactivo; ausencia de proyecto, «fondo general».
- No se reemplaza un importe mal formado por cero. Un fallo de contrato se trata como error de presentación y se comprueba en regresión.

## Observación de aceptación

Se comprueban en navegador los tres estados vacíos, filtro, errores, campos, orden, menú y ausencia de efectos al abrir sin vínculo. Las pruebas de API acreditan propiedad y exactitud; no sustituyen estos recorridos visibles.

Para SC-002 se aplica el [procedimiento del quickstart](../quickstart.md): inicio en la navegación al historial, cuenta previamente identificada y vinculada; fin con 60 filas, cinco grupos y totales correctos presentados. La isla expone marcadores estables de la región y filas para observación de prueba, sin añadir telemetría, temporizadores de aceptación ni datos personales al producto.
