# Contraste fiscal de HU-02 — T013/T014

**Fecha**: 2026-11-10 · **Rama**: `spec-002` · **Base**: `24282d5`

**Responsable**: Nada · **Revisor**: Javi

## Alcance

Se contrasta el GET/servicio de historial con el servicio y repositorio reales de HU-03, importados sin modificar sus archivos. Los datos son sintéticos y pertenecen a un esquema aleatorio creado mediante el soporte existente dentro de `ong_test_hu01`. El módulo común de conexión se redirige al pool aislado solo en Vitest; Se inyectan transacción, reloj de 2026 y correo simulado. No se activa cron ni se ejecuta la CLI fiscal o la suite de certificados contra `public`.

La prueba se añade después de acreditar el backend y la consistencia de lectura en T011/T012. No cambia la regla fiscal ni atribuye aprobación de Rubén o Javi.

## Comprobación realizada

El Donante sintético de límites anuales tiene una aportación de 1,00 € a `2025-12-31T22:59:59Z`, dentro de 2025 Madrid y otra de 2,00 € a `2025-12-31T23:00:00Z`, que pertenece a 2026. Se reconcilia únicamente el ejercicio cerrado 2025 con `reconciliarEjercicio(2025)`.

Se comparan tres resultados sobre el mismo conjunto, sin escrituras entre las lecturas:

1. Certificado persistido por HU-03: **1.00**.
2. Total anual del servicio real de historial: **1.00**.
3. SUM independiente de confirmadas, con límites UTC equivalentes al año Madrid: **1.00**.

Después se crea una aportación sintética pendiente de 3,00 € y se confirma con fecha de cobro dentro de 2025, sin alterar ninguna confirmada anterior. Antes de reconciliar, el historial devuelve **4.00** y el certificado sigue en **1.00**, desfase esperado. La segunda reconciliación devuelve exactamente `emitidos: 0`, `regenerados: 1`, `correosFallidos: 0` para 2025.

Tras esa reconciliación, certificado, historial y SUM independiente coinciden en **4.00**. Se conserva el ID de la fila del certificado y cambia su código de verificación, conforme al servicio vigente. Las aportaciones confirmadas originales conservan todos sus campos. Las dos transacciones fiscales terminan en commit y los avisos usan exclusivamente un espía SMTP.

## Comando y resultado

Desde `E:\asignaturas\IWeb\Practica grupal\IWEB_ONG\backend`, con DATABASE_URL y TEST_DATABASE_URL iguales apuntando a la base exclusiva y las variables sintéticas descritas en [validacion-local-01.md](validacion-local-01.md):

```powershell
npm test -- src/modulos/donaciones/historial.test.js --no-file-parallelism
```

Resultado real: **38/38 pruebas aprobadas**, un archivo aprobado, código de salida **0**, duración Vitest **13,57 s**. Incluye el contraste fiscal y una regresión adicional HTTP de error SQL: respuesta 500 genérica con cabeceras privadas, rollback y liberación; no presenta un historial vacío ni expone el error interno.

## Límites

Esta evidencia acredita la comparación local posterior a reconciliación sobre fixtures y código real. No acredita un envío SMTP real, recepción de un certificado, cron en producción, revisión externa o integración publicada. El historial no inicia ninguna reconciliación al consultarse. La interfaz de HU-02 y su medición de dos segundos quedan pendientes de los bloques posteriores.
