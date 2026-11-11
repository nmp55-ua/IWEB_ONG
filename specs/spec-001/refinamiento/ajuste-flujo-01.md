# Ajuste de flujo y elección local de 009 — HU-01

> **Estado actual:** HU-01 revisada por el revisor asignado e incorporada a main mediante la PR #4; `009_operativa_donaciones.sql` es la numeración definitiva. Los estados de preparación y revisión descritos en los apartados fechados corresponden a esas fases anteriores.

**Fecha:** 2026-11-07 · **Rama:** spec-001 · **HEAD inicial:** 47e3ea1.

**Responsable:** Nada · **Revisor externo:** Rubén, aprobación pendiente.

## Ajuste documentado

Se separan dos planos: terminar implementación, pruebas, documentación y converge en la
rama de trabajo; y recibir revisión externa/incorporar a main. La revisión y aprobación
reales de Rubén son controles de la PR antes de main, no requisitos para terminar el
desarrollo o preparar/abrir la PR. Este bloque no publica una PR ni da por realizada la revisión.

| ID conservado | Significado y estado anteriores                                                          | Trabajo técnico vigente                                                                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| T006          | Registrar la revisión real de Rubén de 004 y P-01–P-03; pendiente en el primer converge. | Preparar el paquete completo para esa revisión: dominio, cambios comunes, implementación, pruebas y evidencias. No incluye obtener aprobación.                     |
| T007          | Coordinar el número/nombre de la ampliación operativa; pendiente, con 009 definitiva.   | Comprobar ramas/commits publicados y documentar la elección de 009_operativa_donaciones.sql para spec-001, su alcance y riesgos. No incluye una numeración de la migración. |

Se conservan los identificadores para evitar tareas duplicadas. La trazabilidad del
significado anterior queda en esta tabla y en los informes históricos, especialmente
[converge-1.md](converge-1.md), que permanece íntegro. Las descripciones y comprobaciones
actuales de tasks.md distinguen preparación técnica de aprobación/coordinación externa.
T079–T081 no se repiten ni pierden sus evidencias por este ajuste.

converge-1.md conserva el encargo anterior que produjo el primer diagnóstico.
Para el siguiente contraste rige este ajuste y el significado vigente de T006/T007,
manteniendo los controles de incorporación como controles externos; no se interpretan los pendientes
históricos como una aprobación exigida para terminar el desarrollo.

## Comprobación actual de las ramas publicadas

Fuente: repositorio GitHub nmp55-ua/IWEB_ONG. Consulta de árboles registrada a
**2026-11-07T05:24:01.3676404+00:00** (UTC). Se ejecutó:

```powershell
git ls-remote --heads https://github.com/nmp55-ua/IWEB_ONG.git
```

Se consultó por la API de GitHub el árbol recursivo de cada uno de los **seis commits
distintos** publicados por las **nueve ramas**. Todos los árboles respondieron completos
(`truncated=false`). Se inspeccionaron los archivos de
`backend/src/db/migraciones/` y se buscaron nombres con prefijo de migración 009.
Una segunda lectura de ls-remote devolvió los mismos nueve pares rama/commit.
No se hizo fetch, checkout, merge ni cambio de referencias locales.

| Rama publicada | Commit exacto consultado                   | Fuente del árbol                                                                                                                 | Resultado                                                       |
| -------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| main           | `272afd65a3a6f0a52129667c889e272c113456be` | [Árbol publicado](https://api.github.com/repos/nmp55-ua/IWEB_ONG/git/trees/272afd65a3a6f0a52129667c889e272c113456be?recursive=1) | Sin 009 en la carpeta canónica.                                 |
| spec-001       | `03876fa76eac55d5cfdbfbf4e64bad1229ec39af` | [Árbol publicado](https://api.github.com/repos/nmp55-ua/IWEB_ONG/git/trees/03876fa76eac55d5cfdbfbf4e64bad1229ec39af?recursive=1) | Sin 009 en la carpeta canónica (carpeta ausente en ese commit). |
| spec-002       | `03876fa76eac55d5cfdbfbf4e64bad1229ec39af` | [Árbol publicado](https://api.github.com/repos/nmp55-ua/IWEB_ONG/git/trees/03876fa76eac55d5cfdbfbf4e64bad1229ec39af?recursive=1) | Sin 009 en la carpeta canónica (carpeta ausente en ese commit). |
| spec-003       | `03876fa76eac55d5cfdbfbf4e64bad1229ec39af` | [Árbol publicado](https://api.github.com/repos/nmp55-ua/IWEB_ONG/git/trees/03876fa76eac55d5cfdbfbf4e64bad1229ec39af?recursive=1) | Sin 009 en la carpeta canónica (carpeta ausente en ese commit). |
| spec-004       | `03876fa76eac55d5cfdbfbf4e64bad1229ec39af` | [Árbol publicado](https://api.github.com/repos/nmp55-ua/IWEB_ONG/git/trees/03876fa76eac55d5cfdbfbf4e64bad1229ec39af?recursive=1) | Sin 009 en la carpeta canónica (carpeta ausente en ese commit). |
| spec-005       | `4ee51bc5f60efef16a4b7f62869a1d12a95b8bcc` | [Árbol publicado](https://api.github.com/repos/nmp55-ua/IWEB_ONG/git/trees/4ee51bc5f60efef16a4b7f62869a1d12a95b8bcc?recursive=1) | Sin 009 en la carpeta canónica.                                 |
| spec-006       | `67c7bd1313810721a9079c62b4f409aac151444d` | [Árbol publicado](https://api.github.com/repos/nmp55-ua/IWEB_ONG/git/trees/67c7bd1313810721a9079c62b4f409aac151444d?recursive=1) | Sin 009 en la carpeta canónica.                                 |
| spec-007       | `c034b23cf17aae58af948e7a5455c5e33361d418` | [Árbol publicado](https://api.github.com/repos/nmp55-ua/IWEB_ONG/git/trees/c034b23cf17aae58af948e7a5455c5e33361d418?recursive=1) | Sin 009 en la carpeta canónica.                                 |
| spec-008       | `e0354458cc86344db8e60ae8e2fa132ab90e1a91` | [Árbol publicado](https://api.github.com/repos/nmp55-ua/IWEB_ONG/git/trees/e0354458cc86344db8e60ae8e2fa132ab90e1a91?recursive=1) | Sin 009 en la carpeta canónica.                                 |

**Resultado:** ninguna de las nueve cabezas publicadas consultadas contiene una
migración 009 en la carpeta canónica. No quedó una rama publicada de esa enumeración
sin verificar. No se revisan ramas borradas, forks, refs de PR no publicadas como ramas,
otros repositorios, todos los commits históricos detrás de cada cabeza ni trabajo sin
publicar. Los commits públicos de spec-001 y spec-002
no son el HEAD local 47e3ea1; esta consulta no presenta los cambios locales como publicados.

## Elección para spec-001 y tratamiento de entornos existentes

Se conserva **009_operativa_donaciones.sql** como elección local de spec-001, sin colisión
observada en los puntos publicados consultados. No modifica garantiza
que el número siga libre cuando se incorpore a main. 004 y 009 permanecen sin modificar;
009 depende de 004 y su base común, no de 006–008.

La justificación y esta comprobación deben explicarse en la PR. Antes de main se volverá
a contrastar el destino de integración y se resolverá cualquier conflicto con el equipo.
La ausencia publicada no descarta SQL sin publicar de otra persona.

El migrador registra nombres de archivo. Como hay entornos donde esta 009 ya está
aplicada, un eventual renombrado/renumeración exige revisar los registros y un procedimiento
de transición para esos entornos; no basta renombrar y ejecutar de nuevo. No se modifican
registros de migración, bases o archivos SQL para preparar esta elección.

## Controles de incorporación — pendientes, separados de las tareas técnicas

| Control | Evidencia requerida antes de main                                                                                                                                                   | Estado actual                                                                       |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| el control de revisión  | Revisión y aprobación reales de Rubén del dominio 004, P-01–P-03 y el incremento completo; observaciones resueltas y coordinación común que corresponda conforme a la constitución. | Pendiente. No se atribuye aprobación ni acuerdo colectivo.                          |
| el control de integración  | Elección de 009 explicada en la PR, comprobación actualizada frente a la integración y conflictos resueltos, considerando entornos ya migrados.                                     | Pendiente. La lectura de ramas y elección local de T007 no sustituyen este control. |

Estos controles no bloquean finalizar el desarrollo/verificación técnica, ejecutar el
siguiente converge autorizado o preparar/abrir la PR. Sí condicionan la incorporación
a main. No se presentan como realizados al marcar preparación técnica T006/T007.

## Estado de esta entrega

T082/T083 se contrastan con regresiones iniciales fallidas y resultados posteriores en
[validacion-converge-01.md](validacion-converge-01.md). El paquete se conserva en la
[ficha de revisión](revision-tecnica-01.md) y el [resumen para HU-03](resumen-tecnico-hu03-01.md),
sin envío. No se ejecuta todavía converge-2 ni se declara cierre técnico de HU-01:
ese cierre requiere el contraste posterior. Los controles externos de esta sección
seguirán pendientes aunque ese contraste técnico no encuentre más brechas.
