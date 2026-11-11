// Solo instrumentación del banco aislado; no modifica el observador ni el producto.
export function exportarTrazaReal() {
  const temporizador = setInterval(() => {
    const medicion = window.__hu02Medicion;
    if (!medicion || medicion.estado === 'esperando') return;
    clearInterval(temporizador);
    const nodo = document.createElement('script');
    nodo.type = 'application/json';
    nodo.id = 'hu02-traza-real';
    nodo.textContent = JSON.stringify({
      formato: 'Performance Timeline y observador HU-02',
      capturadaEn: new Date().toISOString(),
      medicion,
      entorno: {
        userAgent: navigator.userAgent,
        plataforma: navigator.platform,
        concurrencia: navigator.hardwareConcurrency,
        memoriaGB: navigator.deviceMemory,
        ancho: innerWidth,
        alto: innerHeight,
        pixelRatio: devicePixelRatio,
        visibilidad: document.visibilityState,
        timeOrigin: performance.timeOrigin,
      },
      navegacion: performance.getEntriesByType('navigation').map((e) => e.toJSON()),
      recursos: performance.getEntriesByType('resource').map((e) => e.toJSON()),
      pintado: performance.getEntriesByType('paint').map((e) => e.toJSON()),
      contenido: [...document.querySelectorAll('[data-hu02-anio]')].map((grupo) => ({
        anio: grupo.dataset.hu02Anio,
        total: grupo.dataset.hu02Total,
        texto: grupo.innerText,
        filas: [...grupo.querySelectorAll('[data-hu02-aportacion]')].map((fila) => ({
          id: fila.dataset.hu02Aportacion,
          texto: fila.closest('tr').innerText,
        })),
      })),
    });
    document.documentElement.append(nodo);
  }, 50);
}
