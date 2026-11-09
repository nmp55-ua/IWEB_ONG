# Feature Specification: HU-02 — Historial de aportaciones del donante

**Feature Branch**: `spec-002`

**Created**: 2026-10-28

**Status**: Draft

**Responsable**: *Nada* · **Revisor**: *Javi*

**Input**: Descripción del SI-13: "Ese mismo donante querrá, con el paso del tiempo, poder consultar el historial completo de sus aportaciones, viendo año a año qué ha donado y, cuando corresponda, a qué proyecto concreto se destinó ese dinero, como constancia tangible de su implicación con la causa."

## Clarifications

### Session 2026-11-10

- Q: ¿Qué debe mostrar el historial cuando la cuenta de donante todavía no tiene un vínculo verificado con sus aportaciones? (PA2.2) → A: Mostrar una explicación y un enlace a `/donar/vincular`, sin mostrar aportaciones ni afirmar si existen. Para cuentas vinculadas, distinguir historial vacío de año sin resultados: en el primer caso, mensaje y enlace para donar; en el segundo, aviso del año sin aportaciones y opción de quitar el filtro.
- Q: ¿Entre qué momentos debe medirse el límite de dos segundos para mostrar cinco años de cuotas mensuales? (PA2.3) → A: Desde que una cuenta ya identificada y vinculada abre el historial hasta que se muestran las 60 cuotas, los grupos anuales y sus totales. Se incluyen la obtención de datos y su presentación; se excluyen login y vinculación previos.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar mi historial de aportaciones (Priority: P1)

Como donante, quiero consultar el historial completo de mis aportaciones agrupado por año y viendo a qué proyecto se destinó cada una, para tener constancia de mi implicación con la causa.

Desde su área personal, el donante identificado y vinculado mediante la verificación de HU-01 ve todas sus aportaciones confirmadas (puntuales y cuotas de socio), de la más reciente a la más antigua, agrupadas por año natural según su fecha de cobro en Europe/Madrid y con el total de cada año. Sin vínculo, la página explica que debe vincular y ofrece el enlace correspondiente, sin consultar aportaciones por coincidencia de correo ni afirmar si existen.

**Why this priority**: Es la forma en que el donante comprueba que su dinero ha llegado y a dónde.

**Independent Test**: Con un donante de prueba que tiene aportaciones en 2025 y 2026, se entra en su área personal y se comprueban los dos bloques por año, sus totales y el destino de cada aportación.

**Acceptance Scenarios**:

1. **Given** un donante con 2 aportaciones confirmadas en 2025 (50 € y 30 €) y 1 en 2026 (20 €), **When** abre su historial, **Then** ve un bloque 2026 con total 20,00 € y un bloque 2025 con total 80,00 €, en ese orden.
2. **Given** cada aportación del historial, **When** se muestra, **Then** incluye fecha (dd/mm/aaaa), importe, modalidad (puntual / cuota de socio) y proyecto de destino o «fondo general».
3. **Given** un pago pendiente, rechazado o cancelado, **When** el donante abre su historial, **Then** ese pago no aparece.
4. **Given** el filtro de año, **When** el donante elige 2025, **Then** solo ve las aportaciones de 2025.
5. **Given** un donante con cuenta vinculada y sin aportaciones confirmadas en ningún año, **When** abre su historial, **Then** ve el mensaje «Todavía no has realizado ninguna aportación» y un enlace para donar.
6. **Given** un donante identificado, **When** intenta acceder al historial de otro donante, aunque conozca su identificador, **Then** el sistema deniega el acceso.
7. **Given** una cuenta identificada con rol donante pero sin vínculo verificado, **When** abre la página del historial, **Then** ve una explicación y un enlace a `/donar/vincular`, sin aportaciones ni afirmaciones sobre si existen; la coincidencia del correo no concede acceso ni inicia la verificación automáticamente.
8. **Given** una cuenta vinculada con aportaciones confirmadas en otros años, **When** filtra por un año sin aportaciones confirmadas, **Then** ve un aviso de que no hay aportaciones en ese año y la opción de quitar el filtro, sin presentar su historial completo como vacío.
9. **Given** una cuenta ya identificada y vinculada cuyo Donante tiene 60 cuotas mensuales confirmadas repartidas en cinco años, **When** abre el historial completo, **Then** se muestran las 60 cuotas, los grupos anuales y sus totales en menos de 2 segundos desde esa apertura; la medición incluye obtener y presentar los datos, pero no el login ni la vinculación previos.

---

### Edge Cases

- Aportación del 31/12 a las 23:59 (hora peninsular): se agrupa en ese año según su fecha de cobro.
- Aportaciones «pendientes» de confirmación: no se muestran hasta que se confirman.
- Cuenta con rol donante sin vínculo verificado: se explica cómo vincular desde `/donar/vincular`, sin deducir por ello que nunca ha donado ni revelar aportaciones por coincidencia de correo.
- Historial vinculado sin confirmadas y año filtrado sin resultados son estados distintos; solo el primer caso usa el mensaje de historial vacío con enlace para donar.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST mostrar al donante identificado y con vínculo verificado todas sus aportaciones confirmadas, puntuales y cuotas de socio.
- **FR-002**: Las aportaciones MUST agruparse por año natural según la fecha de cobro en Europe/Madrid y ordenarse de la más reciente a la más antigua.
- **FR-003**: Cada grupo anual MUST mostrar el total aportado ese año, en euros con 2 decimales.
- **FR-004**: Cada aportación MUST mostrar fecha, importe, modalidad y proyecto de destino o «fondo general».
- **FR-005**: El sistema MUST permitir filtrar por un año concreto.
- **FR-006**: El sistema MUST NOT mostrar aportaciones pendientes, rechazadas o canceladas.
- **FR-007**: Un donante MUST poder ver solo las aportaciones del Donante vinculado mediante la verificación de HU-01 a su cuenta autenticada; la comprobación se hace en el servidor. Coincidir en correo o conservar el permiso invitado de una operación MUST NOT conceder acceso al historial.
- **FR-008**: Sin vínculo verificado, la página del historial MUST mostrar una explicación y un enlace a `/donar/vincular`, sin mostrar aportaciones ni afirmar si existen. Con vínculo pero sin aportaciones confirmadas en ningún año, MUST mostrar «Todavía no has realizado ninguna aportación» y un enlace para donar. Si hay aportaciones confirmadas en otros años pero no en el año filtrado, MUST mostrar un aviso referido a ese año y permitir quitar el filtro, sin presentar el historial completo como vacío. Entrar en la página sin vínculo MUST NOT solicitar un enlace ni vincular automáticamente.

### Key Entities

- **Donante**, **Aportación** *(dueño: spec-001)*: se usan sin redefinirlas.
- **Proyecto** *(común)*.
- **Usuario** con rol donante *(común)*: accede al Donante vinculado a su cuenta tras la verificación de HU-01; la coincidencia de correo por sí sola no establece esa relación ni autoriza la consulta.

## Dependencies

- **spec-001 (Nada)**: genera las aportaciones y proporciona el vínculo verificado de la cuenta con el Donante. Se reutiliza `/donar/vincular`; no se cambia registro, login ni la verificación. Las aportaciones confirmadas conservan su destino y datos; HU-02 solo consulta, sin reasignar proyectos, editar datos fiscales o corregir cobros.
- **spec-003 (Rubén)**: el total anual usa las mismas aportaciones confirmadas y fecha de cobro en Europe/Madrid, con sumas exactas. HU-03 reconcilia certificados de ejercicios cerrados tras confirmaciones tardías; HU-02 no añade una regeneración síncrona al consultar. El contraste con el certificado debe considerar que esa reconciliación se haya realizado para las mismas aportaciones confirmadas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: La suma de los totales anuales coincide al céntimo con la suma de las aportaciones confirmadas del donante.
- **SC-002**: Para un Donante con 60 cuotas mensuales confirmadas repartidas en cinco años, el tiempo desde que su cuenta ya identificada y vinculada abre el historial completo hasta que se muestran las 60 cuotas, los grupos anuales y sus totales MUST ser inferior a 2 segundos. La medición incluye obtener y presentar los datos; excluye el login y la vinculación previos. Las 60 cuotas definen el caso de comprobación, no un límite del historial.
- **SC-003**: Ningún intento de ver el historial de otra persona tiene éxito.

## Assumptions

- El donante accede con una cuenta y un vínculo verificado conforme a PA1.2/PA1.3 de HU-01. El correo coincidente no sustituye la acreditación del acceso al buzón ni el vínculo persistido.

## Open Questions (para `/speckit-clarify`)

No quedan preguntas funcionales bloqueantes identificadas en esta ronda. La revisión de Javi y las fases posteriores no se dan por realizadas.

- **PA2.1 — alineación con el alcance vigente**: La pregunta original presuponía reasignar una aportación confirmada. HU-01 mantiene inmutables esas aportaciones; HU-02 muestra el destino asociado y no incorpora reasignación ni correcciones. No se reabre esa decisión común ni se añade otra definición de las entidades.
- **PA2.2 — resuelta**: Se distinguen cuenta sin vínculo, historial vinculado vacío y año sin resultados conforme a FR-008.
- **PA2.3 — resuelta**: El umbral de SC-002 se mide desde la apertura del historial por una cuenta ya identificada y vinculada hasta mostrar las 60 cuotas, grupos y totales; excluye login y vinculación previos.
