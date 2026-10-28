-- Común. Formato que espera connect-pg-simple.
CREATE TABLE sesiones (
  sid     VARCHAR NOT NULL PRIMARY KEY,
  sess    JSON NOT NULL,
  expire  TIMESTAMP(6) NOT NULL
);
CREATE INDEX sesiones_expire_idx ON sesiones (expire);
