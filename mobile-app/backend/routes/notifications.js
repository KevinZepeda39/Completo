// backend/routes/notifications.js - Rutas para notificaciones push
const express = require('express');
const router = express.Router();
const { execute } = require('../config/database');

// Enviar notificación push a todos los miembros de una comunidad
router.post('/push/community', async (req, res) => {
  try {
    const { communityId, senderName, messageText, communityName, timestamp } = req.body;
    
    console.log(`🔔 Enviando notificación push a comunidad ${communityId}`);
    
    // 1. Obtener todos los miembros de la comunidad (excluyendo al remitente)
    const membersQuery = `
      SELECT DISTINCT u.idUsuario, u.nombre, u.email
      FROM usuario_comunidad uc
      JOIN usuarios u ON uc.idUsuario = u.idUsuario
      WHERE uc.idComunidad = ? 
      AND uc.idUsuario != (SELECT idUsuario FROM comunidad WHERE idComunidad = ?)
      AND uc.estado = 'activo'
    `;
    
    const members = await execute(membersQuery, [communityId, communityId]);
    
    if (members.length === 0) {
      console.log('ℹ️ No hay otros miembros para notificar');
      return res.json({ success: true, sentCount: 0, message: 'No hay otros miembros para notificar' });
    }
    
    console.log(`📱 Encontrados ${members.length} miembros para notificar`);
    
    // 2. Obtener tokens de dispositivo de todos los miembros
    const userIds = members.map(m => m.idUsuario);
    const tokensQuery = `
      SELECT dt.userId, dt.deviceToken, dt.platform
      FROM device_tokens dt
      WHERE dt.userId IN (${userIds.map(() => '?').join(',')})
      AND dt.isActive = 1
    `;
    
    const deviceTokens = await execute(tokensQuery, userIds);
    
    if (deviceTokens.length === 0) {
      console.log('ℹ️ No hay tokens de dispositivo activos');
      return res.json({ success: true, sentCount: 0, message: 'No hay tokens de dispositivo activos' });
    }
    
    console.log(`📱 Encontrados ${deviceTokens.length} tokens de dispositivo`);
    
    // 3. Enviar notificación push a cada dispositivo
    let sentCount = 0;
    const failedTokens = [];
    
    for (const token of deviceTokens) {
      try {
        // Aquí implementarías el envío real de notificación push
        // Por ahora simulamos el envío
        const notificationData = {
          title: `💬 ${communityName}`,
          body: `${senderName}: ${messageText.substring(0, 100)}${messageText.length > 100 ? '...' : ''}`,
          data: {
            type: 'community_message',
            communityId: communityId,
            communityName: communityName,
            senderName: senderName,
            messageText: messageText,
            timestamp: timestamp
          },
          token: token.deviceToken,
          platform: token.platform
        };
        
        // Simular envío exitoso
        console.log(`📤 Enviando notificación a ${token.userId} (${token.platform})`);
        sentCount++;
        
        // Guardar en historial de notificaciones
        await execute(`
          INSERT INTO notification_history (userId, title, body, data, sentAt, status)
          VALUES (?, ?, ?, ?, NOW(), 'sent')
        `, [
          token.userId,
          notificationData.title,
          notificationData.body,
          JSON.stringify(notificationData.data)
        ]);
        
      } catch (error) {
        console.error(`❌ Error enviando notificación a ${token.userId}:`, error);
        failedTokens.push(token);
      }
    }
    
    // 4. Registrar intento de envío
    await execute(`
      INSERT INTO notification_logs (communityId, message, totalMembers, sentCount, failedCount, timestamp)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [communityId, messageText, members.length, sentCount, failedTokens.length]);
    
    console.log(`✅ Notificación push enviada: ${sentCount}/${members.length} exitosos`);
    
    res.json({
      success: true,
      sentCount: sentCount,
      totalMembers: members.length,
      failedCount: failedTokens.length,
      message: `Notificación enviada a ${sentCount} usuarios`
    });
    
  } catch (error) {
    console.error('❌ Error en /push/community:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// Enviar notificación push a un usuario específico
router.post('/push/user', async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;
    
    console.log(`🔔 Enviando notificación push a usuario ${userId}`);
    
    // Obtener tokens de dispositivo del usuario
    const tokensQuery = `
      SELECT deviceToken, platform
      FROM device_tokens
      WHERE userId = ? AND isActive = 1
    `;
    
    const deviceTokens = await execute(tokensQuery, [userId]);
    
    if (deviceTokens.length === 0) {
      return res.json({ success: false, error: 'No hay tokens de dispositivo activos para este usuario' });
    }
    
    let sentCount = 0;
    
    for (const token of deviceTokens) {
      try {
        // Simular envío de notificación push
        console.log(`📤 Enviando notificación a ${userId} (${token.platform})`);
        sentCount++;
        
        // Guardar en historial
        await execute(`
          INSERT INTO notification_history (userId, title, body, data, sentAt, status)
          VALUES (?, ?, ?, ?, NOW(), 'sent')
        `, [userId, title, body, JSON.stringify(data)]);
        
      } catch (error) {
        console.error(`❌ Error enviando notificación a ${userId}:`, error);
      }
    }
    
    res.json({
      success: true,
      sentCount: sentCount,
      message: `Notificación enviada a ${sentCount} dispositivos`
    });
    
  } catch (error) {
    console.error('❌ Error en /push/user:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// Enviar notificación push a múltiples usuarios
router.post('/push/multiple', async (req, res) => {
  try {
    const { userIds, title, body, data } = req.body;
    
    console.log(`🔔 Enviando notificación push a ${userIds.length} usuarios`);
    
    // Obtener tokens de dispositivo de todos los usuarios
    const tokensQuery = `
      SELECT userId, deviceToken, platform
      FROM device_tokens
      WHERE userId IN (${userIds.map(() => '?').join(',')})
      AND isActive = 1
    `;
    
    const deviceTokens = await execute(tokensQuery, userIds);
    
    if (deviceTokens.length === 0) {
      return res.json({ success: false, error: 'No hay tokens de dispositivo activos' });
    }
    
    let sentCount = 0;
    
    for (const token of deviceTokens) {
      try {
        // Simular envío de notificación push
        console.log(`📤 Enviando notificación a ${token.userId} (${token.platform})`);
        sentCount++;
        
        // Guardar en historial
        await execute(`
          INSERT INTO notification_history (userId, title, body, data, sentAt, status)
          VALUES (?, ?, ?, ?, NOW(), 'sent')
        `, [token.userId, title, body, JSON.stringify(data)]);
        
      } catch (error) {
        console.error(`❌ Error enviando notificación a ${token.userId}:`, error);
      }
    }
    
    res.json({
      success: true,
      sentCount: sentCount,
      message: `Notificación enviada a ${sentCount} dispositivos`
    });
    
  } catch (error) {
    console.error('❌ Error en /push/multiple:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// Obtener historial de notificaciones de un usuario
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const historyQuery = `
      SELECT id, title, body, data, sentAt, status
      FROM notification_history
      WHERE userId = ?
      ORDER BY sentAt DESC
      LIMIT ? OFFSET ?
    `;
    
    const history = await execute(historyQuery, [userId, parseInt(limit), parseInt(offset)]);
    
    res.json({
      success: true,
      notifications: history,
      count: history.length
    });
    
  } catch (error) {
    console.error('❌ Error en /history/:userId:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// Obtener logs de notificaciones de comunidad
router.get('/logs/community/:communityId', async (req, res) => {
  try {
    const { communityId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const logsQuery = `
      SELECT id, message, totalMembers, sentCount, failedCount, timestamp
      FROM notification_logs
      WHERE communityId = ?
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `;
    
    const logs = await execute(logsQuery, [communityId, parseInt(limit), parseInt(offset)]);
    
    res.json({
      success: true,
      logs: logs,
      count: logs.length
    });
    
  } catch (error) {
    console.error('❌ Error en /logs/community/:communityId:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

module.exports = router;
