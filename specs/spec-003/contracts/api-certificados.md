# Contrato: API de certificados fiscales (HU-03)

Formato común de [plan-comun.md §4](../../plan-comun.md#4-formato-común-de-la-api): JSON
camelCase, importes como texto con 2 decimales, fechas sin hora como `aaaa-mm-dd`, errores
`{ error: { codigo, mensaje, campos? } }`.

## GET /api/yo/certificados

Rol `donante`. Sin sesión 401 `NO_IDENTIFICADO`; sin el rol 403 `SIN_PERMISO`.

```json
{
  "datos": [
    { "ejercicio": 2025, "importeTotal": "80.00", "fechaEmision": "2026-01-01", "codigoVerificacion": "7K2M-9QXR-4D8T-1HZP" }
  ],
  "total": 1,
  "ejercicioEnCurso": 2026,
  "vinculado": true
}
```

- Solo los certificados del Donante con `usuario_id` = cuenta de la sesión, por ejercicio descendente.
- Sin Donante vinculado: `datos: []`, `total: 0`, `vinculado: false`.

## GET /api/yo/certificados/:ejercicio/pdf

Rol `donante`. `:ejercicio` de 4 dígitos.

- 200 `application/pdf`, `Content-Disposition: attachment; filename="certificado-2025.pdf"`.
- 400 `DATOS_INVALIDOS` si `:ejercicio` no es un año de 4 dígitos.
- 409 `EJERCICIO_NO_CERRADO`: «El certificado de 2026 se generará a partir del 01/01/2027.» si
  `ejercicio >= ejercicioEnCurso`.
- 404 `CERTIFICADO_NO_DISPONIBLE`: «No hay certificado de 2025: no tienes aportaciones confirmadas en
  ese ejercicio.» si la cuenta no tiene Donante vinculado o este no tiene certificado de ese ejercicio.
  No se distingue de un certificado ajeno.

Contenido (FR-003): nombre y CIF de la ONG, nombre, apellidos y NIF/NIE del Donante, ejercicio,
importe total (`80,00 €`), fecha de emisión (dd/mm/aaaa), código de verificación y dirección de la
página de verificación con el código.

## GET /api/certificados/verificacion?codigo=…

Pública, sin sesión. Siempre 200.

```json
{ "valido": true, "ejercicio": 2025, "importeTotal": "80.00", "fechaEmision": "2026-01-01", "nifNieEnmascarado": "***5678*" }
```

```json
{ "valido": false }
```

El código se normaliza (mayúsculas, sin espacios ni guiones) antes de buscarlo. Un código antiguo,
inexistente, vacío o mal formado da `{ "valido": false }`. Nunca devuelve nombre, correo ni dirección.

## Orden de consola

```text
npm run certificados                       # todos los ejercicios cerrados
npm run certificados -- --ejercicio 2025   # solo 2025
```

Imprime por ejercicio `Ejercicio 2025: 3 emitidos, 1 regenerados, 0 correos fallidos.` y termina con
código 0. Un ejercicio no cerrado o mal escrito imprime el error y termina con código 1.

## Correo de aviso

Destinatario `donantes.correo`. Texto en español, sin adjuntos ni NIF/NIE.

- Asunto: «Tu certificado fiscal de 2025 está disponible» (emisión) o «Tu certificado fiscal de 2025 se
  ha actualizado» (regeneración).
- Cuerpo: nombre, ejercicio, importe total, enlace a `/mis-certificados`. Al regenerar: «El código de
  verificación anterior ya no es válido». Sin cuenta vinculada: invitación a crear una cuenta de donante
  (o entrar con la suya) y vincularla en `/donar/vincular`.
