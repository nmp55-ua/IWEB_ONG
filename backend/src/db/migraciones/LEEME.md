# Migraciones

Numeración reservada (ver `specs/modelo-datos.md`):

| Fichero | Dueño | Estado |
|---|---|---|
| `001_usuarios.sql` | Común | hecha |
| `002_sesiones.sql` | Común | hecha |
| `003_proyectos.sql` | Común | hecha |
| `004_donaciones.sql` (donantes, suscripciones_socio, aportaciones) | Nada · spec-001 | pendiente |
| `005_actividades.sql` | Nicole · spec-007 | hecha |
| `006_voluntariado.sql` (voluntarios, inscripciones) | Javi · spec-005 | hecha |
| `007_asistencias.sql` | Nicole · spec-008 | pendiente |
| `008_certificados.sql` | Rubén · spec-003 | pendiente |

Nunca se edita una migración ya subida a `main`. Los cambios posteriores usan `009` en adelante,
pidiendo el número al grupo.
