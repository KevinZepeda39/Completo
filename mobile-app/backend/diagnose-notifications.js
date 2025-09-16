// backend/diagnose-notifications.js - Script de diagnóstico para notificaciones push
const fetch = require('node-fetch');

const API_BASE_URL = 'http://192.168.1.13:3000'; // Ajusta a tu IP

async function diagnoseNotifications() {
  console.log('🔍 DIAGNÓSTICO DE NOTIFICACIONES PUSH');
  console.log('=====================================\n');

  try {
    // 1. Verificar que el servidor esté funcionando
    console.log('🔍 1. Verificando que el servidor esté funcionando...');
    try {
      const healthResponse = await fetch(`${API_BASE_URL}/api/test`);
      if (healthResponse.ok) {
        console.log('✅ Servidor funcionando correctamente');
      } else {
        console.log('⚠️ Servidor respondiendo pero con error:', healthResponse.status);
      }
    } catch (error) {
      console.log('❌ No se puede conectar al servidor:', error.message);
      console.log('💡 Asegúrate de que el servidor esté corriendo en:', API_BASE_URL);
      return;
    }

    console.log('');

    // 2. Verificar que las rutas de notificaciones estén disponibles
    console.log('🔍 2. Verificando rutas de notificaciones...');
    try {
      const routesResponse = await fetch(`${API_BASE_URL}/api/notifications/test`);
      if (routesResponse.ok) {
        console.log('✅ Rutas de notificaciones funcionando');
      } else if (routesResponse.status === 404) {
        console.log('❌ Rutas de notificaciones no encontradas');
        console.log('💡 Verifica que hayas integrado notification-routes.js en server.js');
      } else {
        console.log('⚠️ Rutas de notificaciones con error:', routesResponse.status);
      }
    } catch (error) {
      console.log('❌ Error verificando rutas:', error.message);
    }

    console.log('');

    // 3. Probar notificación push a comunidad con manejo de errores detallado
    console.log('🔍 3. Probando notificación push a comunidad...');
    try {
      const communityResponse = await fetch(`${API_BASE_URL}/api/notifications/push/community`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          communityId: 1,
          senderName: 'Usuario de Prueba',
          messageText: 'Mensaje de diagnóstico',
          communityName: 'Comunidad de Prueba',
          timestamp: new Date().toISOString()
        })
      });

      console.log(`📊 Respuesta del servidor: ${communityResponse.status} ${communityResponse.statusText}`);
      
      if (communityResponse.ok) {
        const result = await communityResponse.json();
        console.log('✅ Notificación push exitosa:', result);
      } else {
        console.log('❌ Error en notificación push');
        
        // Intentar obtener detalles del error
        try {
          const errorDetails = await communityResponse.text();
          console.log('📋 Detalles del error:', errorDetails);
          
          // Si es JSON, parsearlo para mejor legibilidad
          try {
            const errorJson = JSON.parse(errorDetails);
            console.log('🔍 Error estructurado:', JSON.stringify(errorJson, null, 2));
          } catch (parseError) {
            console.log('📝 Error en texto plano:', errorDetails);
          }
        } catch (readError) {
          console.log('⚠️ No se pudieron leer detalles del error:', readError.message);
        }
      }
    } catch (error) {
      console.log('❌ Error de red:', error.message);
      console.log('💡 Verifica:');
      console.log('   - Que el servidor esté corriendo');
      console.log('   - Que la IP sea correcta');
      console.log('   - Que no haya firewall bloqueando');
    }

    console.log('');

    // 4. Verificar logs del servidor
    console.log('🔍 4. Verificando logs del servidor...');
    console.log('💡 Revisa la consola donde está corriendo node server.js');
    console.log('💡 Busca mensajes que empiecen con: 🔔, ❌, ⚠️');

    console.log('');

    // 5. Verificar base de datos
    console.log('🔍 5. Verificando base de datos...');
    console.log('💡 Ejecuta: node register-device-token.js');
    console.log('💡 Esto verificará que las tablas existan y funcionen');

  } catch (error) {
    console.error('💥 Error general en diagnóstico:', error.message);
  }
}

// Ejecutar diagnóstico
diagnoseNotifications();
