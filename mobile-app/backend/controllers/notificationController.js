// controllers/notificationController.js - Controlador de notificaciones push
const { execute, transaction } = require('../utils/database');

class NotificationController {
  // Registrar dispositivo para notificaciones
  async registerDevice(req, res) {
    try {
      const { userId, expoPushToken, deviceInfo } = req.body;
      
      if (!userId || !expoPushToken) {
        return res.status(400).json({
          success: false,
          error: 'userId y expoPushToken son requeridos'
        });
      }

      console.log('🔔 Registrando dispositivo:', { userId, expoPushToken, deviceInfo });

      // Insertar o actualizar token del dispositivo
      const query = `
        INSERT INTO device_tokens (userId, expoPushToken, deviceInfo, isActive, lastUsed)
        VALUES (?, ?, ?, TRUE, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE
        deviceInfo = VALUES(deviceInfo),
        isActive = TRUE,
        lastUsed = CURRENT_TIMESTAMP
      `;

      await execute(query, [userId, expoPushToken, JSON.stringify(deviceInfo)]);

      console.log('✅ Dispositivo registrado exitosamente');

      res.json({
        success: true,
        message: 'Dispositivo registrado exitosamente'
      });

    } catch (error) {
      console.error('❌ Error registrando dispositivo:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      });
    }
  }

  // Enviar notificación a un usuario específico
  async sendNotificationToUser(userId, title, body, data = {}) {
    try {
      console.log(`🔔 Enviando notificación a usuario ${userId}:`, { title, body, data });

      // Obtener tokens del usuario
      const tokensQuery = `
        SELECT expoPushToken 
        FROM device_tokens 
        WHERE userId = ? AND isActive = TRUE
      `;
      
      const tokens = await execute(tokensQuery, [userId]);
      
      if (!tokens || tokens.length === 0) {
        console.log(`⚠️ Usuario ${userId} no tiene dispositivos registrados`);
        return false;
      }

      // Enviar notificación a todos los dispositivos del usuario
      const pushTokens = tokens.map(token => token.expoPushToken);
      const success = await this.sendExpoPushNotification(pushTokens, title, body, data);

      // Registrar en historial
      if (success) {
        await this.recordNotificationHistory(userId, title, body, data);
      }

      return success;

    } catch (error) {
      console.error('❌ Error enviando notificación:', error);
      return false;
    }
  }

  // Enviar notificación a múltiples usuarios
  async sendNotificationToUsers(userIds, title, body, data = {}) {
    try {
      console.log(`🔔 Enviando notificación a ${userIds.length} usuarios:`, { title, body, data });

      let successCount = 0;
      
      for (const userId of userIds) {
        const success = await this.sendNotificationToUser(userId, title, body, data);
        if (success) successCount++;
      }

      console.log(`✅ Notificaciones enviadas: ${successCount}/${userIds.length}`);
      return successCount;

    } catch (error) {
      console.error('❌ Error enviando notificaciones múltiples:', error);
      return 0;
    }
  }

  // Enviar notificación push usando Expo
  async sendExpoPushNotification(pushTokens, title, body, data = {}) {
    try {
      if (!pushTokens || pushTokens.length === 0) {
        console.log('⚠️ No hay tokens para enviar notificación');
        return false;
      }

      // Preparar mensajes para Expo
      const messages = pushTokens.map(pushToken => ({
        to: pushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data,
        badge: 1,
      }));

      console.log(`📤 Enviando ${messages.length} notificaciones a Expo...`);

      // Enviar a Expo Push Service
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error respuesta de Expo:', response.status, errorText);
        return false;
      }

      const result = await response.json();
      console.log('✅ Respuesta de Expo:', result);

      // Verificar si hay errores en la respuesta
      if (result.data && Array.isArray(result.data)) {
        const errors = result.data.filter(item => item.status === 'error');
        if (errors.length > 0) {
          console.log('⚠️ Algunas notificaciones fallaron:', errors);
          
          // Marcar tokens inválidos como inactivos
          await this.handleInvalidTokens(errors, pushTokens);
        }
      }

      return true;

    } catch (error) {
      console.error('❌ Error enviando notificación a Expo:', error);
      return false;
    }
  }

  // Manejar tokens inválidos
  async handleInvalidTokens(errors, pushTokens) {
    try {
      const invalidTokens = [];
      
      errors.forEach((error, index) => {
        if (error.status === 'error' && error.message?.includes('InvalidCredentials')) {
          invalidTokens.push(pushTokens[index]);
        }
      });

      if (invalidTokens.length > 0) {
        console.log(`🗑️ Marcando ${invalidTokens.length} tokens como inactivos`);
        
        const updateQuery = `
          UPDATE device_tokens 
          SET isActive = FALSE 
          WHERE expoPushToken IN (${invalidTokens.map(() => '?').join(',')})
        `;
        
        await execute(updateQuery, invalidTokens);
      }
    } catch (error) {
      console.error('❌ Error manejando tokens inválidos:', error);
    }
  }

  // Registrar notificación en historial
  async recordNotificationHistory(userId, title, body, data) {
    try {
      const query = `
        INSERT INTO notification_history (userId, title, body, data, type)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      const type = data.type || 'other';
      await execute(query, [userId, title, body, JSON.stringify(data), type]);
      
    } catch (error) {
      console.error('❌ Error registrando historial:', error);
    }
  }

  // Obtener historial de notificaciones de un usuario
  async getNotificationHistory(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const query = `
        SELECT id, title, body, data, type, status, sentAt
        FROM notification_history
        WHERE userId = ?
        ORDER BY sentAt DESC
        LIMIT ? OFFSET ?
      `;

      const notifications = await execute(query, [userId, parseInt(limit), parseInt(offset)]);

      res.json({
        success: true,
        notifications: notifications,
        total: notifications.length
      });

    } catch (error) {
      console.error('❌ Error obteniendo historial:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  // Desactivar dispositivo
  async deactivateDevice(req, res) {
    try {
      const { userId, expoPushToken } = req.body;

      if (!userId || !expoPushToken) {
        return res.status(400).json({
          success: false,
          error: 'userId y expoPushToken son requeridos'
        });
      }

      const query = `
        UPDATE device_tokens 
        SET isActive = FALSE 
        WHERE userId = ? AND expoPushToken = ?
      `;

      await execute(query, [userId, expoPushToken]);

      res.json({
        success: true,
        message: 'Dispositivo desactivado exitosamente'
      });

    } catch (error) {
      console.error('❌ Error desactivando dispositivo:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  // Obtener dispositivos activos de un usuario
  async getUserDevices(req, res) {
    try {
      const { userId } = req.params;

      const query = `
        SELECT id, expoPushToken, deviceInfo, isActive, lastUsed, createdAt
        FROM device_tokens
        WHERE userId = ? AND isActive = TRUE
        ORDER BY lastUsed DESC
      `;

      const devices = await execute(query, [userId]);

      res.json({
        success: true,
        devices: devices
      });

    } catch (error) {
      console.error('❌ Error obteniendo dispositivos:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
}

module.exports = new NotificationController();
