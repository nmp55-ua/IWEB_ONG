-- spec-008 (Nicole). Ver specs/modelo-datos.md#asistencias-spec-008
-- Una fila por inscripción: corregir cambia asistio, nunca se borra (principio VI).
-- El total de horas no se guarda: es SUM(horas) WHERE asistio.
CREATE TABLE asistencias (
  id              BIGSERIAL PRIMARY KEY,
  inscripcion_id  BIGINT NOT NULL UNIQUE REFERENCES inscripciones(id) ON DELETE RESTRICT,
  asistio         BOOLEAN NOT NULL,
  horas           NUMERIC(5,2) NOT NULL CHECK (horas > 0),
  registrada_por  BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  fecha_registro  TIMESTAMPTZ NOT NULL
);
