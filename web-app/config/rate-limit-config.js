// Configuración de Rate Limiting para MiCiudadSV
// Este archivo controla los límites de intentos de login y registro

const rateLimit = require('express-rate-limit');

// Configuración para desarrollo/pruebas (SIN LÍMITES)
const configuracionDesarrollo = {
  // Rate limiting para login - DESHABILITADO
  loginLimiter: (req, res, next) => next(),
  
  // Rate limiting para registro - DESHABILITADO  
  registroLimiter: (req, res, next) => next(),
  
  // Rate limiting para recuperación de contraseña - DESHABILITADO
  recuperacionLimiter: (req, res, next) => next()
};

// Configuración para producción (CON LÍMITES)
const configuracionProduccion = {
  // Rate limiting para login
  loginLimiter: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // límite de 5 intentos por IP
    message: 'Demasiados intentos de inicio de sesión, intenta de nuevo más tarde.',
    standardHeaders: true,
    legacyHeaders: false,
  }),
  
  // Rate limiting para registro
  registroLimiter: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // límite de 3 registros por hora por IP
    message: 'Demasiados registros, intenta de nuevo más tarde.',
  }),
  
  // Rate limiting para recuperación de contraseña
  recuperacionLimiter: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // límite de 3 solicitudes por hora por IP
    message: 'Demasiadas solicitudes de recuperación, intenta de nuevo más tarde.',
  })
};

// Seleccionar configuración basada en el entorno
const configuracion = process.env.NODE_ENV === 'production' 
  ? configuracionProduccion 
  : configuracionDesarrollo;

module.exports = configuracion;
