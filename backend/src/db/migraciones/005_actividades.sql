-- spec-007 (Nicole). Ver specs/modelo-datos.md#actividades-spec-007
-- «Celebrada» no es un estado: es una publicada con inicio <= ahora. Las reglas que dependen
-- de «ahora» o de otras tablas (inicio futuro, proyecto activo, plazas >= confirmadas) van en
-- modulos/actividades/servicio.js.
CREATE TABLE actividades (
  id              BIGSERIAL PRIMARY KEY,
  proyecto_id     BIGINT NOT NULL REFERENCES proyectos(id),
  titulo          TEXT NOT NULL CHECK (btrim(titulo) <> ''),
  descripcion     TEXT NOT NULL CHECK (btrim(descripcion) <> ''),
  inicio          TIMESTAMPTZ NOT NULL,
  fin             TIMESTAMPTZ NOT NULL,
  lugar           TEXT NOT NULL CHECK (btrim(lugar) <> ''),
  plazas          INTEGER NOT NULL CHECK (plazas > 0),
  requisitos      TEXT NOT NULL DEFAULT '',
  estado          TEXT NOT NULL DEFAULT 'borrador'
                    CHECK (estado IN ('borrador', 'publicada', 'cancelada')),
  creada_por      BIGINT NOT NULL REFERENCES usuarios(id),
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (fin > inicio)
);

CREATE INDEX actividades_estado_inicio ON actividades (estado, inicio);
