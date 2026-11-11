-- HU-01 (Nada). Ampliación operativa de donaciones.
-- Depende únicamente de 004 y de su base común 001–003. Ver modelo-datos.md.
CREATE TABLE operaciones_pago (
  id BIGSERIAL PRIMARY KEY,
  solicitud_id UUID NOT NULL UNIQUE,
  aportacion_id BIGINT NOT NULL UNIQUE REFERENCES aportaciones(id) ON DELETE RESTRICT,
  huella_solicitud TEXT NOT NULL,
  solicitud_checkout JSONB NOT NULL,
  sesion_checkout_id TEXT UNIQUE,
  url_checkout TEXT,
  estado TEXT NOT NULL CHECK (estado IN ('preparada', 'checkout_creado', 'incierta', 'cerrada')),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE eventos_pasarela (
  id BIGSERIAL PRIMARY KEY,
  pasarela_evento_id TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL,
  objeto_id TEXT NOT NULL,
  ocurrido_en TIMESTAMPTZ NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('procesado', 'ignorado', 'incidencia')),
  error_codigo TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE verificaciones_donante (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  donante_id BIGINT NOT NULL REFERENCES donantes(id) ON DELETE RESTRICT,
  token_hash TEXT NOT NULL UNIQUE,
  expira_en TIMESTAMPTZ NOT NULL,
  usado_en TIMESTAMPTZ,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE correos_aportacion (
  id BIGSERIAL PRIMARY KEY,
  aportacion_id BIGINT NOT NULL REFERENCES aportaciones(id) ON DELETE RESTRICT,
  tipo TEXT NOT NULL CHECK (tipo IN ('confirmacion', 'fallo_cuota')),
  resumen JSONB NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('pendiente', 'enviando', 'enviado', 'fallido')),
  intentos INTEGER NOT NULL DEFAULT 0 CHECK (intentos >= 0),
  reservado_hasta TIMESTAMPTZ,
  enviado_en TIMESTAMPTZ,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (aportacion_id, tipo)
);
