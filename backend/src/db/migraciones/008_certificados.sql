-- spec-003 (Rubén). Definición única: specs/modelo-datos.md y specs/spec-003/data-model.md.
-- Un certificado por Donante y ejercicio. Al regenerarse (confirmación tardía) se actualiza la
-- misma fila: total, fecha de emisión y código; el código anterior deja de ser válido.
-- El PDF no se guarda: se genera al descargar con estos datos.
CREATE TABLE certificados_fiscales (
  id                   BIGSERIAL PRIMARY KEY,
  donante_id           BIGINT NOT NULL REFERENCES donantes(id) ON DELETE RESTRICT,
  ejercicio            INTEGER NOT NULL CHECK (ejercicio BETWEEN 2000 AND 9999),
  importe_total        NUMERIC(10,2) NOT NULL CHECK (importe_total > 0),
  fecha_emision        DATE NOT NULL,
  codigo_verificacion  TEXT NOT NULL UNIQUE CHECK (
                         codigo_verificacion ~ '^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){3}$'
                       ),
  creado_en            TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (donante_id, ejercicio)
);
