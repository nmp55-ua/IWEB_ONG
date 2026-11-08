-- spec-005 (Javi). Ver specs/modelo-datos.md#voluntarios-spec-005 y #inscripciones-spec-005
-- Las inscripciones nunca se borran: cambian de estado (principio VI). La posición en la lista de
-- espera no se guarda: es el orden de fecha_inscripcion entre las «en_espera» de la actividad.
-- Las reglas que dependen de «ahora» o del aforo (plazas libres, inicio futuro) van en
-- modulos/voluntariado/servicio.js, bloqueando la fila de la actividad.
CREATE TABLE voluntarios (
  id              BIGSERIAL PRIMARY KEY,
  usuario_id      BIGINT NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE RESTRICT,
  nombre          TEXT NOT NULL CHECK (btrim(nombre) <> ''),
  apellidos       TEXT NOT NULL CHECK (btrim(apellidos) <> ''),
  correo          TEXT NOT NULL CHECK (btrim(correo) <> ''),
  telefono        TEXT NOT NULL CHECK (btrim(telefono) <> ''),
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE inscripciones (
  id                  BIGSERIAL PRIMARY KEY,
  voluntario_id       BIGINT NOT NULL REFERENCES voluntarios(id) ON DELETE RESTRICT,
  actividad_id        BIGINT NOT NULL REFERENCES actividades(id) ON DELETE RESTRICT,
  estado              TEXT NOT NULL CHECK (estado IN ('confirmada', 'en_espera', 'cancelada')),
  acepta_requisitos   BOOLEAN NOT NULL CHECK (acepta_requisitos),
  fecha_inscripcion   TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_confirmacion  TIMESTAMPTZ,
  fecha_cancelacion   TIMESTAMPTZ,
  creado_en           TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (estado <> 'confirmada' OR fecha_confirmacion IS NOT NULL),
  CHECK (estado <> 'cancelada' OR fecha_cancelacion IS NOT NULL)
);

-- Como mucho una inscripción activa por voluntario y actividad; tras cancelar puede volver a
-- apuntarse (FR-008).
CREATE UNIQUE INDEX inscripciones_activa_unica
  ON inscripciones (voluntario_id, actividad_id)
  WHERE estado IN ('confirmada', 'en_espera');

-- Plazas libres, lista de espera por orden de llegada e inscritos de una actividad.
CREATE INDEX inscripciones_actividad_estado
  ON inscripciones (actividad_id, estado, fecha_inscripcion);
