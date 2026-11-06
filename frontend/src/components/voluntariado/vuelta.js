// Cuándo hay que volver a pedir el calendario al volver a la página (FR-005, research R5).
// Al volver, el navegador puede avisar dos veces seguidas («visibilitychange» y «focus»). Solo se
// recarga si de verdad se había salido desde la última vez, así que esos dos avisos dan una sola
// petición y ninguna vuelta se pierde, por rápida que sea.
export function crearVuelta(recargar, { fueraAlEmpezar = false } = {}) {
  let fuera = fueraAlEmpezar;
  return {
    salir() {
      fuera = true;
    },
    volver() {
      if (!fuera) return;
      fuera = false;
      recargar();
    },
  };
}
