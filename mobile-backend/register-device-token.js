// backend/register-device-token.js - Script para registrar tokens de dispositivo de prueba
const { execute } = require('./config/database');

async function registerDeviceToken() {
  console.log('📱 REGISTRANDO TOKEN DE DISPOSITIVO DE PRUEBA');
  console.log('==============================================\n');

  try {
    // Conectar a la base de datos
    const connectDB = require('./config/database');
    const isConnected = await connectDB();
    
    if (!isConnected) {
      console.log('❌ No se pudo conectar a la base de datos');
      return;
    }

    console.log('✅ Conectado a la base de datos');

    // Verificar que las tablas existen
    try {
      await execute('DESCRIBE device_tokens');
      console.log('✅ Tabla device_tokens existe');
    } catch (error) {
      console.log('❌ Tabla device_tokens no existe. Ejecuta primero create-notification-tables.sql');
      return;
    }

    // Verificar que hay usuarios en la base de datos
    const users = await execute('SELECT idUsuario, nombre FROM usuarios LIMIT 5');
    console.log(`📱 Usuarios encontrados: ${users.length}`);

    if (users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
      return;
    }

    // Registrar token de dispositivo para el primer usuario
    const userId = users[0].idUsuario;
    const userName = users[0].nombre;
    
    const deviceToken = `test_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`📱 Registrando token para usuario: ${userName} (ID: ${userId})`);
    console.log(`🔑 Token: ${deviceToken}`);

    // Insertar token de dispositivo
    await execute(`
      INSERT INTO device_tokens (userId, deviceToken, platform, deviceInfo, isActive)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        deviceToken = VALUES(deviceToken),
        lastUsed = NOW(),
        isActive = 1
    `, [
      userId,
      deviceToken,
      'android',
      JSON.stringify({
        model: 'Samsung Galaxy S21',
        os: 'Android 12',
        appVersion: '1.0.0',
        isTest: true
      }),
      1
    ]);

    console.log('✅ Token de dispositivo registrado exitosamente');

    // Verificar que se registró correctamente
    const registeredToken = await execute(`
      SELECT * FROM device_tokens WHERE userId = ? AND isActive = 1
    `, [userId]);

    console.log(`📱 Token registrado:`, registeredToken[0]);

    // También registrar preferencias de notificación por defecto
    try {
      await execute(`
        INSERT INTO notification_preferences (userId, communityId, enabled, sound, vibration, showPreview, messageTypes, frequency)
        VALUES (?, NULL, 1, 1, 1, 1, ?, 'immediate')
        ON DUPLICATE KEY UPDATE 
          enabled = VALUES(enabled),
          sound = VALUES(sound),
          vibration = VALUES(vibration),
          showPreview = VALUES(showPreview),
          messageTypes = VALUES(messageTypes),
          frequency = VALUES(frequency)
      `, [
        userId,
        JSON.stringify(['text', 'media', 'admin', 'system'])
      ]);

      console.log('✅ Preferencias de notificación registradas');
    } catch (error) {
      console.log('⚠️ No se pudieron registrar preferencias de notificación:', error.message);
    }

    console.log('\n🎯 AHORA PUEDES PROBAR LAS NOTIFICACIONES PUSH:');
    console.log('1. Ejecuta: node test-push-notifications.js');
    console.log('2. O envía un mensaje desde la app a una comunidad');
    console.log('3. Verifica que se envíen notificaciones a otros usuarios');

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

// Ejecutar registro
registerDeviceToken();
