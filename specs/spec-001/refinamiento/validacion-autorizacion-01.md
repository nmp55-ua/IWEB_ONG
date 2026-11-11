# Validación de autorización — HU-01

> **Estado actual:** HU-01 revisada por el revisor asignado e incorporada a main mediante la PR #4; `009_operativa_donaciones.sql` es la numeración definitiva. Los estados de preparación y revisión descritos en los apartados fechados corresponden a esas fases anteriores.

**Fecha**: 2026-11-06 · **Rama**: spec-001 · **HEAD inicial**: 8a34a04  
**Responsable**: Nada · **Revisor**: Rubén  
**Alcance**: T022–T023, funciones aisladas y pruebas unitarias.  
**Resultado**: 35 pruebas aprobadas. T006 sigue pendiente de Rubén.

## Preparación y orden

Se comprueba carpeta limpia, selección specs/spec-001 y checklist con 16 elementos
completos. Los tres archivos nuevos del bloque no existían. Se sigue el procedimiento
local de implementación con el alcance indicado, sin repetir fases cerradas; la selección
se resuelve mediante PathsOnly y variable de proceso, sin persistir feature.json.
Se omiten los hooks opcionales de commit.

Fuentes: [contrato HTTP](../contracts/api-donaciones.md#convenciones-y-autorización),
[research R-05](../research.md#r-05--sesión-de-operación-y-vínculo-con-cuenta),
[tareas](../tasks.md) y middleware existente de autenticación/roles, leído sin modificar.

T022 pasa de depender de T019 a T002 porque las sesiones y los datos de propiedad son
sintéticos. T023 mantiene T022; T019 y las comprobaciones de integración permanecen
pendientes. Se actualizan justificación, diagrama, comando y progreso sin alterar las
demás dependencias.

## Implementación y frontera de confianza

Archivo: [autorizacion.js](../../../backend/src/modulos/donaciones/autorizacion.js).

- prepararContextoDonaciones prepara el token CSRF aleatorio de 32 bytes y espera
  req.session.save antes de devolverlo. Conserva el token existente y usuarioId.
- registrarPermisoOperacion guarda en req.session.donaciones.permisos una entrada
  por referencia con creadoEn y venceEn. La repetición conserva ambos instantes;
  un permiso vencido o corrupto no se vuelve a conceder. Debe invocarse únicamente
  con la referencia de una operación iniciada y validada por el servicio del servidor.
- autorizarAportacion recibe req, referencia y una proyección obtenida en servidor
  { referencia, usuarioIdDonante }. usuarioIdDonante representa donantes.usuario_id,
  no nulo tras el vínculo verificado. No obtiene propiedad, roles o identidad del cuerpo.
  Consume req.usuario cargado por el middleware común, comprueba rol, propiedad y
  coherencia con session.usuarioId. Los BIGINT se comparan como texto decimal positivo,
  sin convertirlos a Number ni aceptar números potencialmente redondeados.
- validarSolicitudNavegador recibe el origen permitido de configuración del servidor;
  valida Origin y el token del cuerpo contra el de sesión mediante comparación segura.
  Solo debe invocarse para las operaciones de navegador previstas, no como middleware
  global ni para el webhook.

El reloj opcional de las funciones de permisos sirve para pruebas; en uso ordinario
se obtiene de Date.now(), nunca de un dato del cliente. No se altera la caducidad de
la cookie común. El guardado devuelve una promesa: si falla por callback o excepción,
restaura el estado local anterior y rechaza con ErrorApi 503 SESION_NO_DISPONIBLE.
No se permite continuar hacia la redirección tras ese rechazo.

No hay consulta PostgreSQL en estas funciones. La consulta de propiedad, la autenticación
real de la sesión y la invocación correcta desde rutas/servicios son responsabilidades
de la integración posterior; recibir una estructura sintética no prueba esa integración.
La comparación de propiedad no crea el vínculo ni verifica un enlace de correo.

## Comprobaciones y resultados

Archivo: [autorizacion.test.js](../../../backend/src/modulos/donaciones/autorizacion.test.js).

Se comprueban sesiones distintas, A/B, caducidad exacta a las ocho horas, repetición
sin renovación, permisos ausentes/corruptos/heredados del prototipo, recursos inexistentes,
guardado pendiente y fallido, cuenta propia/ajena, roles, vínculo nullable y BIGINT
consecutivos superiores al entero seguro de JavaScript. Correo, UUID, referencia,
identificadores y supuestos roles/vínculos del cuerpo no conceden acceso.
Origen/CSRF inválidos producen 403; recurso ajeno/inexistente, el mismo 404 genérico.

Desde PowerShell en backend, sin cargar .env:

```powershell
Set-Location -LiteralPath 'E:\asignaturas\IWeb\Practica grupal\IWEB_ONG\backend'
npm test -- src/modulos/donaciones/autorizacion.test.js
```

| Ejecución                    | Inicio mostrado por Vitest | Código | Resultado                                                                                 |
| ---------------------------- | -------------------------- | -----: | ----------------------------------------------------------------------------------------- |
| Antes de implementar         | 19:46:01                   |      1 | Una suite falla al no existir autorizacion.js; no se recogen casos. Duración 1,32 s.      |
| Tras implementar y formatear | 19:46:56                   |      0 | 1 archivo y 35 pruebas aprobados, 0 fallidos/omitidos. Duración 1,06 s; 32 ms de pruebas. |

Vitest 2.1.9. No se requieren PostgreSQL, SMTP, Stripe o secretos. No se ejecutan otras
suites, instalaciones o migraciones.

## Formato, conservación y parada

Prettier 3.6.2 disponible en caché local, con .prettierrc.json, únicamente sobre estos
cuatro archivos. Desde la raíz:

```powershell
$hu01Prettier = 'C:\Users\Nada\AppData\Local\npm-cache\_npx\83e71da30ae7cab2\node_modules\prettier\bin\prettier.cjs'
node $hu01Prettier --config .prettierrc.json --write backend/src/modulos/donaciones/autorizacion.js backend/src/modulos/donaciones/autorizacion.test.js specs/spec-001/tasks.md specs/spec-001/refinamiento/validacion-autorizacion-01.md
node $hu01Prettier --config .prettierrc.json --check backend/src/modulos/donaciones/autorizacion.js backend/src/modulos/donaciones/autorizacion.test.js specs/spec-001/tasks.md specs/spec-001/refinamiento/validacion-autorizacion-01.md
```

Se comprobó el formato, los enlaces y el alcance de los archivos indicados.

No se modifican autenticación, cookies, roles, rutas o app.js. Estas pruebas no acreditan
la protección de las rutas futuras ni el comportamiento del almacén real de sesiones.
La integración T019 y la revisión de Rubén T006 siguen pendientes.
Bloque detenido para revisión; sin git add, commit, push, merge o cambio de rama.
