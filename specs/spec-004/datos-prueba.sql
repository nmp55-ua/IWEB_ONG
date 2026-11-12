-- Datos SINTÉTICOS para el quickstart de HU-04 (spec-004). Solo para bases de desarrollo.
-- Requieren las migraciones (003 a 006) y `npm run semillas` (proyectos, donantes, la suscripción
-- de socio SEM-SOC-0001, coordinador y voluntarios comunes).
-- Todo cae en 2023, un año que las semillas no usan, para que las cifras esperadas no dependan del
-- día en que se cargan. Se pueden ejecutar varias veces: no duplican filas.
-- Las asistencias van aparte, en datos-prueba-asistencias.sql, porque necesitan la migración 007
-- de HU-08.

-- Aportaciones. Las cifras esperadas están en quickstart.md.
INSERT INTO aportaciones (donante_id, proyecto_id, modalidad, importe, estado, fecha_cobro, referencia, motivo)
SELECT d.id, p.id, 'puntual', v.importe::numeric, v.estado, v.fecha_cobro::timestamptz, v.referencia, v.motivo
FROM (VALUES
  ('HU04-QS-0001', '12345678Z', 'Agua potable',   '50.00',  'confirmada', '2023-02-15T10:00:00+01:00', NULL),
  ('HU04-QS-0002', '87654321X', 'Agua potable',   '25.50',  'confirmada', '2023-05-10T12:00:00+02:00', NULL),
  -- 31/12 a las 23:30 de Madrid: cuenta en 2023 (T4)
  ('HU04-QS-0003', '87654321X', 'Comedor social', '100.00', 'confirmada', '2023-12-31T23:30:00+01:00', NULL),
  -- No cuentan: pendiente y rechazada (escenario 5)
  ('HU04-QS-0004', '12345678Z', 'Comedor social', '40.00',  'pendiente',  NULL, NULL),
  ('HU04-QS-0005', '12345678Z', 'Comedor social', '15.00',  'rechazada',  NULL, 'El pago no se ha completado.'),
  -- Proyecto inactivo con datos: aparece (caso límite)
  ('HU04-QS-0006', '87654321X', 'Campaña 2024',   '70.00',  'confirmada', '2023-11-20T09:00:00+01:00', NULL),
  -- Fondo general (proyecto NULL)
  ('HU04-QS-0007', '12345678Z', NULL,             '30.00',  'confirmada', '2023-07-01T11:00:00+02:00', NULL),
  -- Fuera del periodo 2023: 01/01/2024 a las 00:00 y 31/12/2022 a las 23:59 de Madrid (escenario 5)
  ('HU04-QS-0008', '12345678Z', NULL,             '20.00',  'confirmada', '2024-01-01T00:00:00+01:00', NULL),
  ('HU04-QS-0009', '12345678Z', 'Agua potable',   '60.00',  'confirmada', '2022-12-31T23:59:00+01:00', NULL)
) AS v(referencia, nif, proyecto, importe, estado, fecha_cobro, motivo)
JOIN donantes d ON d.nif_nie = v.nif
LEFT JOIN proyectos p ON p.nombre = v.proyecto
ON CONFLICT (referencia) DO NOTHING;

-- Dos cuotas de socio de la suscripción de las semillas (Agua potable), en febrero y marzo.
INSERT INTO aportaciones (donante_id, proyecto_id, suscripcion_socio_id, modalidad, importe, estado, fecha_cobro, referencia)
SELECT a.donante_id, a.proyecto_id, a.suscripcion_socio_id, 'cuota_socio', 10.00, 'confirmada', v.fecha_cobro::timestamptz, v.referencia
FROM aportaciones a
CROSS JOIN (VALUES
  ('HU04-QS-0101', '2023-02-01T08:00:00+01:00'),
  ('HU04-QS-0102', '2023-03-01T08:00:00+01:00')
) AS v(referencia, fecha_cobro)
WHERE a.referencia = 'SEM-SOC-0001'
ON CONFLICT (referencia) DO NOTHING;

-- Actividades de 2023 (ya celebradas), creadas por coordinador@ong.test. Idempotente por título.
INSERT INTO actividades (proyecto_id, titulo, descripcion, inicio, fin, lugar, plazas, estado, creada_por)
SELECT p.id, v.titulo, 'Datos de prueba de HU-04.', v.inicio::timestamptz, v.fin::timestamptz, 'Alicante', 10, v.estado, u.id
FROM (VALUES
  ('HU04-QS Reparto de agua', 'Agua potable',   '2023-03-18T10:00:00+01:00', '2023-03-18T13:30:00+01:00', 'publicada'),
  ('HU04-QS Charla',          'Agua potable',   '2023-05-20T18:00:00+02:00', '2023-05-20T20:00:00+02:00', 'publicada'),
  -- Empieza el 31/12 y acaba el 01/01: cuenta entera en 2023 (caso límite)
  ('HU04-QS Cena solidaria',  'Comedor social', '2023-12-31T22:00:00+01:00', '2024-01-01T02:00:00+01:00', 'publicada'),
  -- Celebrada sin asistencias: cuenta con 0 horas (caso límite)
  ('HU04-QS Inventario',      'Comedor social', '2023-09-15T10:00:00+02:00', '2023-09-15T12:00:00+02:00', 'publicada'),
  -- Cancelada: no cuenta (caso límite)
  ('HU04-QS Mercadillo',      'Comedor social', '2023-10-10T10:00:00+02:00', '2023-10-10T14:00:00+02:00', 'cancelada')
) AS v(titulo, proyecto, inicio, fin, estado)
JOIN proyectos p ON p.nombre = v.proyecto
CROSS JOIN usuarios u
WHERE u.correo = 'coordinador@ong.test'
  AND NOT EXISTS (SELECT 1 FROM actividades a WHERE a.titulo = v.titulo);

-- Inscripciones confirmadas de los voluntarios de las semillas.
INSERT INTO inscripciones (voluntario_id, actividad_id, estado, acepta_requisitos, fecha_inscripcion, fecha_confirmacion)
SELECT vo.id, a.id, 'confirmada', true, a.inicio - interval '7 days', a.inicio - interval '7 days'
FROM (VALUES
  ('HU04-QS Reparto de agua', 'voluntario@ong.test'),
  ('HU04-QS Reparto de agua', 'voluntario2@ong.test'),
  ('HU04-QS Charla',          'voluntario@ong.test'),
  ('HU04-QS Charla',          'voluntario2@ong.test'),
  ('HU04-QS Cena solidaria',  'voluntario@ong.test')
) AS v(titulo, correo)
JOIN actividades a ON a.titulo = v.titulo
JOIN usuarios u ON u.correo = v.correo
JOIN voluntarios vo ON vo.usuario_id = u.id
WHERE NOT EXISTS (
  SELECT 1 FROM inscripciones i WHERE i.actividad_id = a.id AND i.voluntario_id = vo.id
);
