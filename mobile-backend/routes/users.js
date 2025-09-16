// backend/routes/users.js - User routes ACTUALIZADAS

const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { executeQuery } = require('../config/db');

// Get all users (admin only)
router.get('/', authenticateUser, async (req, res) => {
  try {
    // In a real app, you would check if the user is an admin here
    
    const users = await executeQuery(
      'SELECT idUsuario, nombre, correo FROM usuarios'
    );
    
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error en el servidor' 
    });
  }
});

// ✅ ELIMINAR CUENTA DE USUARIO (soft delete) - opcional para el futuro
router.delete('/:userId', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const { confirmation } = req.body;

    console.log('🗑️ Deleting user account for ID:', userId);

    if (confirmation !== 'DELETE_MY_ACCOUNT') {
      return res.status(400).json({
        success: false,
        error: 'Confirmación requerida para eliminar cuenta'
      });
    }

    // Soft delete - marcar como eliminado en lugar de eliminar físicamente
    // Nota: Necesitarías agregar campo 'eliminado' a tu tabla usuarios
    const result = await executeQuery(
      `UPDATE usuarios 
       SET 
         correo = CONCAT(correo, '_deleted_', NOW())
       WHERE idUsuario = ?`,
      [userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    console.log('✅ User account deleted successfully');
    res.json({
      success: true,
      message: 'Cuenta eliminada correctamente'
    });

  } catch (error) {
    console.error('❌ Error in delete user account:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;

// OBTENER INFORMACIÓN COMPLETA DE UN USUARIO ESPECÍFICO
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('📖 Getting user info for ID:', userId);

    const users = await executeQuery(
      `SELECT 
        idUsuario,
        nombre,
        correo,
        emailVerificado,
        fechaCreacion
      FROM usuarios 
      WHERE idUsuario = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    const user = users[0];

    // No enviar información sensible
    const userInfo = {
      idUsuario: user.idUsuario,
      nombre: user.nombre,
      correo: user.correo,
      emailVerificado: user.emailVerificado === 1,
      fechaCreacion: user.fechaCreacion
    };

    console.log('✅ User info retrieved successfully');
    res.json({
      success: true,
      user: userInfo
    });

  } catch (error) {
    console.error('❌ Error in get user info:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ✅ ACTUALIZAR INFORMACIÓN DEL USUARIO (solo nombre y correo)
router.put('/update/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { nombre, correo } = req.body;

    console.log('🔄 Updating user info for ID:', userId);
    console.log('📝 Update data:', { nombre, correo });

    // Validaciones básicas
    if (!nombre || !correo) {
      return res.status(400).json({
        success: false,
        error: 'Nombre y correo son requeridos'
      });
    }

    if (nombre.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'El nombre debe tener al menos 2 caracteres'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Formato de correo inválido'
      });
    }

    // Verificar si el usuario existe
    const existingUsers = await executeQuery(
      'SELECT idUsuario, correo, emailVerificado FROM usuarios WHERE idUsuario = ?',
      [userId]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    const existingUser = existingUsers[0];

    // Verificar si el nuevo email ya está en uso por otro usuario
    const emailUsers = await executeQuery(
      'SELECT idUsuario FROM usuarios WHERE correo = ? AND idUsuario != ?',
      [correo.trim().toLowerCase(), userId]
    );

    if (emailUsers.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Este correo ya está registrado por otro usuario'
      });
    }

    // Determinar si necesita re-verificar email
    const emailChanged = existingUser.correo !== correo.trim().toLowerCase();
    const newEmailVerificado = emailChanged ? 0 : existingUser.emailVerificado;

    // Actualizar información del usuario
    const result = await executeQuery(
      `UPDATE usuarios 
       SET 
         nombre = ?,
         correo = ?,
         emailVerificado = ?
       WHERE idUsuario = ?`,
      [
        nombre.trim(),
        correo.trim().toLowerCase(),
        newEmailVerificado,
        userId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado o sin cambios'
      });
    }

    console.log('✅ User info updated successfully');
    
    // Respuesta exitosa
    res.json({
      success: true,
      message: 'Información actualizada correctamente',
      emailChanged: emailChanged,
      emailVerificationRequired: emailChanged,
      user: {
        idUsuario: userId,
        nombre: nombre.trim(),
        correo: correo.trim().toLowerCase(),
        emailVerificado: newEmailVerificado === 1
      }
    });

    // Si cambió el email, log para verificación
    if (emailChanged) {
      console.log('📧 Email changed, verification required for:', correo.trim().toLowerCase());
    }

  } catch (error) {
    console.error('❌ Error in update user info:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ✅ VALIDAR DISPONIBILIDAD DE EMAIL (para edición en tiempo real)
router.post('/check-email', async (req, res) => {
  try {
    const { correo, userId } = req.body;

    if (!correo) {
      return res.status(400).json({
        success: false,
        error: 'Email es requerido'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo.trim())) {
      return res.status(400).json({
        success: false,
        available: false,
        error: 'Formato de correo inválido'
      });
    }

    const existingUsers = await executeQuery(
      'SELECT idUsuario FROM usuarios WHERE correo = ? AND idUsuario != ?',
      [correo.trim().toLowerCase(), userId || 0]
    );

    res.json({
      success: true,
      available: existingUsers.length === 0,
      message: existingUsers.length > 0 ? 'Este email ya está en uso' : 'Email disponible'
    });

  } catch (error) {
    console.error('❌ Error in check email availability:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ✅ OBTENER ESTADÍSTICAS DEL USUARIO
router.get('/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('📊 Getting user stats for ID:', userId);

    // Obtener estadísticas del usuario (ajustar según tu tabla de reportes)
    const totalReports = await executeQuery(
      'SELECT COUNT(*) as count FROM reportes WHERE idUsuario = ?',
      [userId]
    );

    const verifiedReports = await executeQuery(
      'SELECT COUNT(*) as count FROM reportes WHERE idUsuario = ? AND estado = "verificado"',
      [userId]
    );

    const pendingReports = await executeQuery(
      'SELECT COUNT(*) as count FROM reportes WHERE idUsuario = ? AND estado = "pendiente"',
      [userId]
    );

    const stats = {
      totalReports: totalReports[0]?.count || 0,
      verifiedReports: verifiedReports[0]?.count || 0,
      pendingReports: pendingReports[0]?.count || 0,
    };

    console.log('✅ User stats retrieved successfully:', stats);
    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('❌ Error in get user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ✅

module.exports = router;