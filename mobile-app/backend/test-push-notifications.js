// backend/test-push-notifications.js - Script para probar notificaciones push
const fetch = require('node-fetch');

const API_BASE_URL = 'http://192.168.1.13:3000'; // Ajusta a tu IP

async function testPushNotifications() {
  console.log('🧪 PROBANDO NOTIFICACIONES PUSH');
  console.log('================================\n');

  try {
    // 1. Probar notificación push a comunidad
    console.log('🔔 1. Probando notificación push a comunidad...');
    const communityResponse = await fetch(`${API_BASE_URL}/api/notifications/push/community`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        communityId: 1, // ID de comunidad de prueba
        senderName: 'Usuario de Prueba',
        messageText: 'Este es un mensaje de prueba para verificar las notificaciones push',
        communityName: 'Comunidad de Prueba',
        timestamp: new Date().toISOString()
      })
    });

    if (communityResponse.ok) {
      const result = await communityResponse.json();
      console.log('✅ Notificación push a comunidad:', result);
    } else {
      console.log('❌ Error notificación push a comunidad:', communityResponse.status, communityResponse.statusText);
    }

    console.log('');

    // 2. Probar notificación push a usuario específico
    console.log('🔔 2. Probando notificación push a usuario...');
    const userResponse = await fetch(`${API_BASE_URL}/api/notifications/push/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 1, // ID de usuario de prueba
        title: '🧪 Prueba de Notificación Push',
        body: 'Esta es una notificación de prueba para un usuario específico',
        data: {
          type: 'test',
          timestamp: new Date().toISOString()
        }
      })
    });

    if (userResponse.ok) {
      const result = await userResponse.json();
      console.log('✅ Notificación push a usuario:', result);
    } else {
      console.log('❌ Error notificación push a usuario:', userResponse.status, userResponse.statusText);
    }

    console.log('');

    // 3. Probar historial de notificaciones
    console.log('🔔 3. Probando historial de notificaciones...');
    const historyResponse = await fetch(`${API_BASE_URL}/api/notifications/history/1`);

    if (historyResponse.ok) {
      const result = await historyResponse.json();
      console.log('✅ Historial de notificaciones:', result);
    } else {
      console.log('❌ Error historial de notificaciones:', historyResponse.status, historyResponse.statusText);
    }

    console.log('');

    // 4. Probar logs de comunidad
    console.log('🔔 4. Probando logs de notificaciones de comunidad...');
    const logsResponse = await fetch(`${API_BASE_URL}/api/notifications/logs/community/1`);

    if (logsResponse.ok) {
      const result = await logsResponse.json();
      console.log('✅ Logs de notificaciones de comunidad:', result);
    } else {
      console.log('❌ Error logs de notificaciones de comunidad:', logsResponse.status, logsResponse.statusText);
    }

  } catch (error) {
    console.error('💥 Error general:', error.message);
  }
}

// Ejecutar pruebas
testPushNotifications();
