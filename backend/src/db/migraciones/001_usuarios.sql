-- Común. Ver specs/modelo-datos.md#usuarios-común
CREATE TABLE usuarios (
  id               BIGSERIAL PRIMARY KEY,
  correo           TEXT NOT NULL UNIQUE CHECK (correo = lower(correo)),
  hash_contrasena  TEXT NOT NULL,
  nombre           TEXT NOT NULL,
  roles            TEXT[] NOT NULL CHECK (
                     cardinality(roles) > 0
                     AND roles <@ ARRAY['donante','voluntario','coordinador','administrador']
                   ),
  activo           BOOLEAN NOT NULL DEFAULT true,
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);
