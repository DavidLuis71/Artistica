export function mostrarNombreConReglas(nombre: string) {
  if (!nombre) return "";

  const partes = nombre.trim().split(" ");
  const nombreSolo = partes[0];
  const apellido = partes[1] || null;

  if (!apellido) return nombreSolo;

  if (apellido.length <= 3) {
    return `${nombreSolo} ${apellido}`;
  }

  return `${nombreSolo} ${apellido.charAt(0).toUpperCase()}${apellido.charAt(
    1
  )}${apellido.charAt(2)}.`;
}
