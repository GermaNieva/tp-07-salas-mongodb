// Lee y valida las variables de entorno en un solo lugar.
// No crea Express ni imprime nada: devuelve la configuracion o lanza un error.

function leerConfiguracion(entorno = process.env) {
  // process.env siempre trae texto: "3000", "abc"... Si PORT no existe, 3000.
  const puerto = Number(entorno.PORT ?? 3000);

  if (!Number.isInteger(puerto) || puerto < 1 || puerto > 65535) {
    throw new Error(
      "PORT tiene que ser un número entero entre 1 y 65535 (llegó: " +
        entorno.PORT +
        ").",
    );
  }

  // Solo cambia el formato de registro de Morgan: "combined" en produccion,
  // "dev" en cualquier otro caso. No cambia nada mas de la aplicacion.
  const formatoRegistro =
    entorno.NODE_ENV === "production" ? "combined" : "dev";

  return { puerto, formatoRegistro };
}

module.exports = { leerConfiguracion };
