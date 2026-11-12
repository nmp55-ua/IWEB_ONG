-- Asistencias SINTÉTICAS para el quickstart de HU-04. Requieren la migración 007_asistencias
-- (HU-08) y haber cargado antes datos-prueba.sql. Idempotente (una asistencia por inscripción).
-- Horas = duración de la actividad, como las registra HU-08.
INSERT INTO asistencias (inscripcion_id, asistio, horas, registrada_por, fecha_registro)
SELECT i.id, v.asistio, round(extract(epoch FROM a.fin - a.inicio) / 3600, 2), c.id, a.fin + interval '1 hour'
FROM (VALUES
  ('HU04-QS Reparto de agua', 'voluntario@ong.test',  true),   -- 3,5 h
  ('HU04-QS Reparto de agua', 'voluntario2@ong.test', true),   -- 3,5 h
  ('HU04-QS Charla',          'voluntario@ong.test',  true),   -- 2 h
  -- Corregida a «no asistió»: sus horas no cuentan (caso límite)
  ('HU04-QS Charla',          'voluntario2@ong.test', false),
  ('HU04-QS Cena solidaria',  'voluntario@ong.test',  true)    -- 4 h
) AS v(titulo, correo, asistio)
JOIN actividades a ON a.titulo = v.titulo
JOIN usuarios u ON u.correo = v.correo
JOIN voluntarios vo ON vo.usuario_id = u.id
JOIN inscripciones i ON i.actividad_id = a.id AND i.voluntario_id = vo.id
CROSS JOIN usuarios c
WHERE c.correo = 'coordinador@ong.test'
ON CONFLICT (inscripcion_id) DO NOTHING;
