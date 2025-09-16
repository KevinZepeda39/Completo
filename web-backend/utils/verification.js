const crypto = require('crypto');

// Generar código de verificación de 6 dígitos
function generarCodigoVerificacion() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generar token de verificación único
function generarTokenVerificacion() {
  return crypto.randomBytes(32).toString('hex');
}

// Generar fecha de expiración (15 minutos desde ahora)
function generarFechaExpiracion() {
  const ahora = new Date();
  ahora.setMinutes(ahora.getMinutes() + 15);
  return ahora;
}

// Verificar si un código ha expirado
function codigoExpirado(fechaExpiracion) {
  if (!fechaExpiracion) return true;
  
  const ahora = new Date();
  const fechaExp = new Date(fechaExpiracion);
  
  return ahora > fechaExp;
}

// Limpiar código de verificación (remover espacios y caracteres especiales)
function limpiarCodigo(codigo) {
  return codigo.replace(/[^0-9]/g, '');
}

module.exports = {
  generarCodigoVerificacion,
  generarTokenVerificacion,
  generarFechaExpiracion,
  codigoExpirado,
  limpiarCodigo
};
