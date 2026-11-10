-- Datos SINTÉTICOS para el quickstart de HU-03 (spec-003). Solo para bases de desarrollo.
-- Requieren las migraciones (004 y 008) y `npm run semillas` (usuarios y Donantes comunes).
-- Se pueden ejecutar varias veces: no duplican filas ni sobrescriben las existentes.
-- No son cobros reales: no tienen identificadores de pasarela.

-- Ana: Donante vinculada a voluntario2@ong.test (rol donante y voluntario en las semillas).
INSERT INTO donantes (usuario_id, nombre, apellidos, nif_nie, correo, direccion)
SELECT u.id, 'Ana', 'Certificado Prueba', '11111111H', 'voluntario2@ong.test', 'Calle del Puerto 3, Alicante'
FROM usuarios u
WHERE u.correo = 'voluntario2@ong.test'
ON CONFLICT (nif_nie) DO NOTHING;

INSERT INTO aportaciones (donante_id, modalidad, importe, estado, fecha_cobro, referencia, motivo)
SELECT d.id, 'puntual', v.importe::numeric, v.estado, v.fecha_cobro::timestamptz, v.referencia, v.motivo
FROM donantes d
CROSS JOIN (VALUES
  -- 2024: para tener dos certificados (escenario 6)
  ('HU03-QS-0001', '25.00', 'confirmada', '2024-05-20T12:00:00+02:00', NULL),
  -- 2025: 50 € + 30 € = 80,00 € (escenario 1)
  ('HU03-QS-0002', '50.00', 'confirmada', '2025-03-15T10:00:00+01:00', NULL),
  ('HU03-QS-0003', '30.00', 'confirmada', '2025-11-10T18:30:00+01:00', NULL),
  -- No suman: rechazada y cancelada (caso límite)
  ('HU03-QS-0004', '15.00', 'rechazada',  NULL, 'El pago no se ha completado.'),
  ('HU03-QS-0005', '12.00', 'cancelada',  NULL, 'Pago cancelado.'),
  -- 01/01/2026 a las 00:00 de Madrid: es de 2026, no de 2025 (escenario 2)
  ('HU03-QS-0006', '20.00', 'confirmada', '2026-01-01T00:00:00+01:00', NULL),
  -- 31/12/2025 a las 23:59 de Madrid, pendiente: se confirma tarde en el paso 1.8 (escenario 8)
  ('HU03-QS-0007', '20.00', 'pendiente',  NULL, NULL)
) AS v(referencia, importe, estado, fecha_cobro, motivo)
WHERE d.nif_nie = '11111111H'
ON CONFLICT (referencia) DO NOTHING;

-- Lucía (semillas de HU-01, correo donante@ong.test, SIN vínculo): una aportación de 2025
-- para el escenario 12 (certificado sin cuenta vinculada y vínculo posterior).
INSERT INTO aportaciones (donante_id, modalidad, importe, estado, fecha_cobro, referencia)
SELECT d.id, 'puntual', 45.00, 'confirmada', '2025-06-01T09:00:00+02:00', 'HU03-QS-0101'
FROM donantes d
WHERE d.nif_nie = '12345678Z'
ON CONFLICT (referencia) DO NOTHING;
