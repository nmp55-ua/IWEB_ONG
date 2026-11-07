-- spec-001 (Nada). Definición única: specs/modelo-datos.md.
-- Entrega temprana de dominio; el soporte operativo se incorpora en otra migración.
CREATE TABLE donantes (
  id              BIGSERIAL PRIMARY KEY,
  usuario_id      BIGINT UNIQUE REFERENCES usuarios(id) ON DELETE RESTRICT,
  nombre          TEXT NOT NULL CHECK (btrim(nombre) <> ''),
  apellidos       TEXT NOT NULL CHECK (btrim(apellidos) <> ''),
  nif_nie         TEXT NOT NULL UNIQUE CHECK (
                    CASE WHEN nif_nie ~ '^([0-9]{8}|[XYZ][0-9]{7})[A-Z]$'
                    THEN right(nif_nie, 1) = substr(
                      'TRWAGMYFPDXBNJZSQVHLCKE',
                      (translate(left(nif_nie, 8), 'XYZ', '012')::INTEGER % 23) + 1,
                      1
                    )
                    ELSE false END
                  ),
  correo          TEXT NOT NULL CHECK (correo = lower(correo) AND btrim(correo) <> ''),
  direccion       TEXT NOT NULL CHECK (btrim(direccion) <> ''),
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE suscripciones_socio (
  id                         BIGSERIAL PRIMARY KEY,
  donante_id                 BIGINT NOT NULL REFERENCES donantes(id) ON DELETE RESTRICT,
  proyecto_id                BIGINT REFERENCES proyectos(id) ON DELETE RESTRICT,
  importe                    NUMERIC(10,2) NOT NULL CHECK (importe BETWEEN 1.00 AND 999999.99),
  periodicidad               TEXT NOT NULL CHECK (periodicidad IN ('mensual', 'trimestral', 'anual')),
  estado                     TEXT NOT NULL DEFAULT 'pendiente'
                               CHECK (estado IN ('pendiente', 'activa', 'cancelada')),
  fecha_alta                 TIMESTAMPTZ,
  fecha_proximo_cobro         DATE,
  pasarela_proximo_cobro_en   TIMESTAMPTZ,
  pasarela_suscripcion_id     TEXT UNIQUE,
  creado_en                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en             TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (estado <> 'activa' OR fecha_alta IS NOT NULL)
);

CREATE TABLE aportaciones (
  id                     BIGSERIAL PRIMARY KEY,
  donante_id             BIGINT NOT NULL REFERENCES donantes(id) ON DELETE RESTRICT,
  proyecto_id            BIGINT REFERENCES proyectos(id) ON DELETE RESTRICT,
  suscripcion_socio_id   BIGINT REFERENCES suscripciones_socio(id) ON DELETE RESTRICT,
  modalidad              TEXT NOT NULL CHECK (modalidad IN ('puntual', 'cuota_socio')),
  importe                NUMERIC(10,2) NOT NULL CHECK (importe BETWEEN 1.00 AND 999999.99),
  estado                 TEXT NOT NULL DEFAULT 'pendiente'
                           CHECK (estado IN ('pendiente', 'confirmada', 'rechazada', 'cancelada')),
  fecha_cobro            TIMESTAMPTZ,
  referencia             TEXT NOT NULL UNIQUE CHECK (btrim(referencia) <> ''),
  pasarela_pago_id       TEXT UNIQUE,
  pasarela_factura_id    TEXT UNIQUE,
  motivo                 TEXT,
  creado_en              TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (estado <> 'confirmada' OR fecha_cobro IS NOT NULL),
  CHECK (
    (modalidad = 'cuota_socio' AND suscripcion_socio_id IS NOT NULL)
    OR (modalidad = 'puntual' AND suscripcion_socio_id IS NULL)
  ),
  CHECK (modalidad <> 'puntual' OR pasarela_factura_id IS NULL)
);

CREATE INDEX aportaciones_donante_estado_fecha_cobro_idx
  ON aportaciones (donante_id, estado, fecha_cobro);
