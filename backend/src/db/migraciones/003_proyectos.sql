-- Común. «Fondo general» no es un proyecto: es proyecto_id = NULL.
CREATE TABLE proyectos (
  id              BIGSERIAL PRIMARY KEY,
  nombre          TEXT NOT NULL UNIQUE,
  descripcion     TEXT NOT NULL DEFAULT '',
  activo          BOOLEAN NOT NULL DEFAULT true,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);
