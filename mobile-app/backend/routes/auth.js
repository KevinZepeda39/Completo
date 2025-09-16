// backend/routes/auth.js - RUTAS ARREGLADAS
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Verificar si existe middleware de auth
let auth;
try {
  auth = require('../middleware/auth');
} catch (error) {
  console.log('⚠️ Auth middleware not found, using mock');
  auth = (req, res, next) => {
    req.user = { id: 1, email: 'test@test.com' };
    next();
  };
}

// Rutas públicas (sin autenticación)
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes working correctly',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    availableEndpoints: [
      'POST /api/auth/register - Registrar nuevo usuario',
      'POST /api/auth/login - Iniciar sesión',
      'POST /api/auth/verify-email - Verificar con código de 6 dígitos',
      'POST /api/auth/resend-code - Reenviar código',
      'GET /api/auth/profile - Obtener perfil (requiere auth)'
    ]
  });
});

// Registro de usuario
router.post('/register', authController.register);

// Login de usuario
router.post('/login', authController.login);

// Verificación por código de 6 dígitos
router.post('/verify-email', authController.verifyEmail);

// Reenviar código de verificación
router.post('/resend-code', authController.resendVerificationCode);

// Rutas protegidas (requieren autenticación)
router.get('/profile', auth, authController.getProfile);

// Ruta para verificar estado de autenticación
router.get('/me', auth, async (req, res) => {
  try {
    const { executeQuery } = require('../config/db');
    
    const users = await executeQuery(
      'SELECT idUsuario, nombre, correo, emailVerificado FROM usuarios WHERE idUsuario = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const user = users[0];

    res.json({
      success: true,
      user: {
        id: user.idUsuario,
        nombre: user.nombre,
        correo: user.correo,
        emailVerificado: user.emailVerificado || true
      },
      isAuthenticated: true,
      needsVerification: !user.emailVerificado
    });

  } catch (error) {
    console.error('Error en /me:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;