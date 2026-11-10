import { useEffect, useState } from 'react';
import { api, urlApi } from '../../lib/api.js';
import { formatearEuros, formatearFecha } from '../../lib/formato.js';
import Aviso from '../comunes/Aviso.jsx';
import Boton from '../comunes/Boton.jsx';
import Campo from '../comunes/Campo.jsx';
import EstadoVacio from '../comunes/EstadoVacio.jsx';
import Tabla from '../comunes/Tabla.jsx';
import { ejerciciosConsultables, mensajeEjercicio } from './certificados.js';

// HU-03: área personal del donante. Solo muestra lo que devuelve GET /api/yo/certificados, que ya
// filtra por la cuenta vinculada en el servidor (FR-007, FR-012).
const urlPdf = (ejercicio) => urlApi(`/yo/certificados/${ejercicio}/pdf`);

export default function MisCertificados() {
  const [respuesta, setRespuesta] = useState(null); // null = cargando
  const [error, setError] = useState(null);
  const [consultado, setConsultado] = useState('');

  useEffect(() => {
    api
      .get('/yo/certificados')
      .then(setRespuesta)
      .catch(setError);
  }, []);

  if (error?.estado === 401) {
    return (
      <EstadoVacio
        mensaje="Inicia sesión para ver tus certificados."
        accion={<Boton href="/entrar?volver=/mis-certificados">Entrar</Boton>}
      />
    );
  }
  if (error) return <Aviso tipo="error">{error.message}</Aviso>;
  if (!respuesta) return <p>Cargando…</p>;

  const { datos, ejercicioEnCurso, vinculado } = respuesta;

  if (!vinculado) {
    return (
      <Aviso tipo="info" titulo="Tu cuenta aún no está vinculada a tus donaciones">
        <p className="mb-3">
          Para ver tus certificados fiscales, vincula esta cuenta con los datos que usaste al donar. Te enviaremos un
          enlace de confirmación a tu correo.
        </p>
        <Boton href="/donar/vincular">Vincular mis aportaciones</Boton>
      </Aviso>
    );
  }

  const columnas = [
    { clave: 'ejercicio', titulo: 'Ejercicio' },
    { clave: 'importeTotal', titulo: 'Importe total', alinear: 'derecha', formato: formatearEuros },
    { clave: 'fechaEmision', titulo: 'Fecha de emisión', formato: formatearFecha },
    { clave: 'codigoVerificacion', titulo: 'Código de verificación' },
    {
      clave: 'descargar',
      titulo: '',
      formato: (_, fila) => (
        <Boton variante="secundario" href={urlPdf(fila.ejercicio)} download>
          Descargar PDF
        </Boton>
      ),
    },
  ];

  const ejercicio = consultado === '' ? null : Number(consultado);
  const resultado = ejercicio === null ? null : mensajeEjercicio({ ejercicio, certificados: datos, ejercicioEnCurso });

  return (
    <div className="space-y-8">
      <section>
        <p className="mb-4 text-gray-700">
          Cada año, a partir del 1 de enero, se genera el certificado del ejercicio anterior con el total de tus
          aportaciones confirmadas. Puedes usarlo en tu declaración de la renta.
        </p>
        <Tabla
          columnas={columnas}
          filas={datos}
          claveFila="ejercicio"
          mensajeVacio="Todavía no tienes certificados fiscales. Se generan a partir del 1 de enero del año siguiente a tus aportaciones."
        />
      </section>

      <section className="bg-white rounded border border-gray-200 p-4 max-w-md">
        <h2 className="text-lg font-semibold mb-3">Consultar un ejercicio</h2>
        <Campo
          etiqueta="Ejercicio"
          tipo="select"
          value={consultado}
          onChange={(e) => setConsultado(e.target.value)}
          opciones={[
            { valor: '', texto: 'Elige un año' },
            ...ejerciciosConsultables(ejercicioEnCurso).map((a) => ({ valor: String(a), texto: String(a) })),
          ]}
        />
        {resultado?.tipo === 'disponible' && (
          <Aviso tipo="exito">
            <p className="mb-3">
              {resultado.mensaje} Importe total: {formatearEuros(resultado.certificado.importeTotal)}.
            </p>
            <Boton href={urlPdf(ejercicio)} download>
              Descargar PDF
            </Boton>
          </Aviso>
        )}
        {resultado && resultado.tipo !== 'disponible' && <Aviso tipo="info">{resultado.mensaje}</Aviso>}
      </section>

      <p className="text-sm text-gray-600">
        Cualquier persona puede comprobar si un certificado es auténtico con su código en{' '}
        <a href="/verificar-certificado" className="underline">
          Verificar un certificado
        </a>
        .
      </p>
    </div>
  );
}
