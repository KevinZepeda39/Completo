// routes/auth.js - RUTAS COMPLETAS DE AUTENTICACIÓN
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const requireEmailVerification = require('../middleware/requireEmailVerification');

// Rutas públicas (sin autenticación)
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes working correctly',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'POST /api/auth/register - Registrar nuevo usuario',
      'POST /api/auth/login - Iniciar sesión',
      'GET /api/auth/verify-email?token=... - Verificar email con enlace',
      'POST /api/auth/verify-code - Verificar con código de 6 dígitos',
      'POST /api/auth/resend-verification - Reenviar código',
      'POST /api/auth/test-email - Enviar email de prueba',
      'GET /api/auth/profile - Obtener perfil (requiere auth)',
      'GET /api/auth/verification-stats - Estadísticas (requiere auth)'
    ]
  });
});

// Registro de usuario
router.post('/register', authController.register);

// Login de usuario
router.post('/login', authController.login);

// Verificación por enlace (GET para URLs de email)
router.get('/verify-email', authController.verifyEmail);

// Verificación por código de 6 dígitos
router.post('/verify-code', authController.verifyCode);

// Reenviar código de verificación
router.post('/resend-verification', authController.resendVerificationCode);

// Test de email (desarrollo)
router.post('/test-email', authController.testEmail);

// Rutas protegidas (requieren autenticación)
router.get('/profile', auth, authController.getProfile);

// Rutas que requieren email verificado
router.get('/verification-stats', auth, requireEmailVerification, authController.getVerificationStats);

// Ruta para verificar estado de autenticación y verificación
router.get('/me', auth, async (req, res) => {
  try {
    const { executeQuery } = require('../config/db');
    
    const users = await executeQuery(
      'SELECT idUsuario, nombre, correo, emailVerificado, fechaCreacion, fechaVerificacion FROM usuarios WHERE idUsuario = ?',
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
        emailVerificado: user.emailVerificado,
        fechaCreacion: user.fechaCreacion,
        fechaVerificacion: user.fechaVerificacion
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