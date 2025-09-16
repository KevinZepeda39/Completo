const http = require('http');

// Función para hacer peticiones HTTP
function makeRequest(path, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: parsedData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Función principal de prueba
async function testUserRemoval() {
  console.log('🧪 === PROBANDO ELIMINACIÓN DE USUARIOS ===\n');

  try {
    // 1. Verificar que el servidor esté funcionando
    console.log('1️⃣ Verificando servidor...');
    const healthCheck = await makeRequest('/api/test');
    console.log(`   Status: ${healthCheck.status}`);
    if (healthCheck.status === 200) {
      console.log('   ✅ Servidor funcionando correctamente');
    } else {
      console.log('   ❌ Servidor no responde correctamente');
      return;
    }

    // 2. Probar eliminar un usuario (simulando admin)
    console.log('\n2️⃣ Probando eliminación de usuario...');
    const adminUserId = 143; // Usuario admin (Sancho)
    const targetUserId = 156; // Usuario a eliminar (nuevo usuario)
    
    console.log(`   👤 Admin ID: ${adminUserId}`);
    console.log(`   🎯 Usuario a eliminar: ${targetUserId}`);
    
    const deleteResponse = await makeRequest(`/api/admin/users/${targetUserId}`, 'DELETE', {
      'x-user-id': adminUserId.toString()
    });
    
    console.log(`   🗑️ Respuesta de eliminación: ${deleteResponse.status}`);
    if (deleteResponse.status === 200) {
      console.log(`      ✅ Usuario eliminado exitosamente: ${deleteResponse.data.message}`);
      console.log(`      📋 Detalles:`, JSON.stringify(deleteResponse.data.details, null, 2));
    } else {
      console.log(`      ❌ Error eliminando usuario: ${deleteResponse.data?.error || 'Error desconocido'}`);
    }

    // 3. Verificar que las notificaciones se crearon
    console.log('\n3️⃣ Verificando notificaciones creadas...');
    const notificationsResponse = await makeRequest('/api/notifications/user-removed', 'GET', {
      'x-user-id': adminUserId.toString()
    });
    
    if (notificationsResponse.status === 200 && notificationsResponse.data.success) {
      const notifications = notificationsResponse.data.notifications || [];
      console.log(`   📢 Notificaciones encontradas: ${notifications.length}`);
      
      if (notifications.length > 0) {
        notifications.forEach((notif, index) => {
          console.log(`   📋 Notificación ${index + 1}:`);
          console.log(`      - Título: ${notif.title}`);
          console.log(`      - Mensaje: ${notif.message}`);
          console.log(`      - Leída: ${notif.isRead ? 'Sí' : 'No'}`);
          console.log(`      - Fecha: ${notif.createdAt}`);
        });
      }
    } else {
      console.log(`   ❌ Error obteniendo notificaciones: ${notificationsResponse.status}`);
      if (notificationsResponse.data?.error) {
        console.log(`      Error: ${notificationsResponse.data.error}`);
      }
    }

    // 4. Verificar que el usuario ya no aparece en comunidades
    console.log('\n4️⃣ Verificando que el usuario eliminado no aparece...');
    const communitiesResponse = await makeRequest('/api/communities', 'GET', {
      'x-user-id': adminUserId.toString()
    });
    
    if (communitiesResponse.status === 200 && communitiesResponse.data.success) {
      const communities = communitiesResponse.data.communities || [];
      console.log(`   🏘️ Comunidades obtenidas: ${communities.length}`);
      
      // Buscar si hay alguna comunidad donde el usuario eliminado aparezca como miembro
      const communitiesWithRemovedUser = communities.filter(c => 
        c.memberCount && c.memberCount > 0
      );
      
      console.log(`   👥 Comunidades con miembros: ${communitiesWithRemovedUser.length}`);
      
      if (communitiesWithRemovedUser.length > 0) {
        console.log(`   📊 Estado de membresías:`);
        communitiesWithRemovedUser.slice(0, 3).forEach(community => {
          console.log(`      - ${community.titulo}: ${community.memberCount} miembros`);
        });
      }
    } else {
      console.log(`   ❌ Error obteniendo comunidades: ${communitiesResponse.status}`);
    }

    // 5. Probar marcar notificación como leída
    console.log('\n5️⃣ Probando marcar notificación como leída...');
    const unreadNotificationsResponse = await makeRequest('/api/notifications/unread', 'GET', {
      'x-user-id': adminUserId.toString()
    });
    
    if (unreadNotificationsResponse.status === 200 && unreadNotificationsResponse.data.success) {
      const unreadNotifications = unreadNotificationsResponse.data.notifications || [];
      console.log(`   📋 Notificaciones no leídas: ${unreadNotifications.length}`);
      
      if (unreadNotifications.length > 0) {
        const firstNotification = unreadNotifications[0];
        console.log(`   📝 Marcando primera notificación como leída (ID: ${firstNotification.id})...`);
        
        const markAsReadResponse = await makeRequest(`/api/notifications/${firstNotification.id}/read`, 'PUT', {
          'x-user-id': adminUserId.toString()
        });
        
        if (markAsReadResponse.status === 200) {
          console.log(`      ✅ Notificación marcada como leída`);
        } else {
          console.log(`      ❌ Error marcando como leída: ${markAsReadResponse.data?.error || 'Error desconocido'}`);
        }
      }
    } else {
      console.log(`   ❌ Error obteniendo notificaciones no leídas: ${unreadNotificationsResponse.status}`);
    }

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  }
}

// Ejecutar la prueba
testUserRemoval();
