<!--
Sync Impact Report
- Versión: (plantilla) → 1.0.0
- Principios: se definen los 12 principios en tres bloques (Criterios de calidad,
  Organización del código, Acuerdos de colaboración).
- Secciones añadidas: Contexto, Criterios de calidad, Organización del código,
  Acuerdos de colaboración, Gobernanza.
- Secciones eliminadas: ninguna (se sustituyen los marcadores de la plantilla).
- Pendientes: ninguno.
-->

# Constitution del Sistema de Gestión de Donaciones y Voluntariado

Aplicación web de una ONG para que los donantes aporten dinero, los voluntarios se apunten a
actividades, los coordinadores gestionen esas actividades y la administración rinda cuentas
ante la junta directiva. La desarrolla un grupo de 4 personas: 8 historias de usuario
(HU-01 a HU-08), una spec por historia (spec-001 a spec-008) y 2 specs por persona.

## Criterios de calidad

### I. Simplicidad ante todo
Ante dos soluciones, se elige la más simple. Es una versión 1: no se añade complejidad
anticipada.

### II. Cero alcance fantasma
No se implementa nada que no esté escrito en las specs. Una idea nueva se propone al grupo;
no se construye.

### III. Verificable
Cada criterio de aceptación DEBE poder comprobarse usando la aplicación, sin leer código.
Una historia está terminada solo cuando cumple todos sus criterios y su documentación
coincide con lo implementado.

### IV. Español de España
- Toda la interfaz está en español.
- Los importes se muestran en euros con 2 decimales y cuadran al céntimo.
- Las fechas se muestran como dd/mm/aaaa, en hora peninsular española.

### V. Seguridad y datos personales
- El pago se hace en una pasarela externa; nunca se guardan datos de tarjeta.
- Se piden solo los datos imprescindibles.
- Los informes muestran cifras agregadas, no datos personales.
- No hay secretos en el código.
- Cada usuario ve solo sus datos y cada rol (donante, voluntario, coordinador,
  administrador) solo lo que le corresponde. Esto se comprueba siempre en el servidor.

### VI. Nada se borra a ciegas
Las aportaciones, inscripciones y asistencias cambian de estado en lugar de eliminarse, para
conservar el historial.

## Organización del código

### VII. Pila tecnológica
- Front-end: Astro con islas de React y Tailwind CSS.
- Back-end: Node.js con Express.
- Base de datos: PostgreSQL.

### VIII. Una sola aplicación
- Las 8 specs comparten un único plan técnico y un único modelo de datos.
- Cada entidad (Proyecto, Donante, Aportación, Voluntario, Actividad, Inscripción,
  Asistencia, Usuario) se define una sola vez.
- Se comparten la estructura de carpetas, el inicio de sesión y los roles, el formato de
  respuestas y errores de la API, los componentes y el aspecto visual.
- Antes de crear algo, se reutiliza lo que ya existe.

### IX. Convenciones obligatorias
Las convenciones concretas (carpetas, nombres, API, base de datos, interfaz) están en
`CONVENCIONES.md` y son de obligado cumplimiento.

## Acuerdos de colaboración

### X. Responsable, revisor y ramas
Cada spec tiene un responsable y un revisor que es otra persona. Cada persona trabaja en la
rama de su spec (spec-001 a spec-008) y hace sus propios commits, que empiezan por el
identificador de la historia (por ejemplo, «HU-05: ...»).

### XI. Revisión antes de main
A `main` solo se llega con la revisión de otro integrante.

### XII. Cambios comunes con acuerdo
Cambiar una decisión común, el plan compartido o el modelo de datos exige acuerdo del grupo
y actualizar de forma coherente todas las specs afectadas. Las dependencias entre historias
de distintas personas se documentan en el plan.

## Gobernanza

- Esta constitution prevalece sobre cualquier otra práctica del proyecto.
- Modificarla exige acuerdo de los 4 integrantes y actualizar las specs y el plan
  afectados.
- Versionado: MAYOR si se elimina o redefine un principio; MENOR si se añade o amplía uno;
  PARCHE para aclaraciones o erratas.
- Toda revisión de código y de specs comprueba que se cumplen estos principios.

**Version**: 1.0.0 | **Ratified**: 2026-10-28 | **Last Amended**: 2026-10-28
