// middleware/requireEmailVerification.js
const { executeQuery } = require('../config/db');

const requireEmailVerification = async (req, res, next) => {
  try {
    console.log('🔒 === VERIFICANDO EMAIL VERIFICATION ===');
    console.log('👤 User ID:', req.user?.id);

    if (!req.user || !req.user.id) {
      console.log('❌ No user in request');
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const userId = req.user.id;
    
    // Verificar si el email del usuario está verificado
    console.log('🔍 Verificando estado de verificación...');
    const users = await executeQuery(
      'SELECT emailVerificado, correo, nombre FROM usuarios WHERE idUsuario = ?',
      [userId]
    );

    if (users.length === 0) {
      console.log('❌ Usuario no encontrado en BD');
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const user = users[0];
    console.log('👤 Usuario encontrado:', user.nombre);
    console.log('✅ Email verificado:', user.emailVerificado);

    if (!user.emailVerificado) {
      console.log('⚠️ Email no verificado, bloqueando acceso');
      return res.status(403).json({
        success: false,
        message: 'Tu email no está verificado. Verifica tu cuenta para continuar.',
        requiresVerification: true,
        email: user.correo,
        userName: user.nombre
      });
    }

    console.log('✅ Email verificado, permitiendo acceso');
    next();

  } catch (error) {
    console.error('❌ Error en middleware de verificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = requireEmailVerification;