const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'root',
  database: 'miciudadsv',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function simulateCreatorDeletion() {
  let connection;
  
  try {
    console.log('🔧 SIMULACIÓN DE ELIMINACIÓN DE CREADOR');
    console.log('📡 Host: localhost:3000');
    console.log('🗃️ Database: miciudadsv');
    console.log('⚠️  ADVERTENCIA: Esta es una SIMULACIÓN - NO se eliminará ningún usuario real\n');

    // Crear conexión
    connection = await mysql.createConnection(dbConfig);
    console.log('🔗 Conexión establecida');

    // 1. Buscar un usuario creador para simular
    console.log('\n📋 1. Buscando usuario creador para simular...');
    const creatorQuery = `
      SELECT u.idUsuario, u.nombre, u.correo, COUNT(c.idComunidad) as comunidades_creadas
      FROM usuarios u
      JOIN comunidad c ON u.idUsuario = c.idUsuario
      GROUP BY u.idUsuario, u.nombre, u.correo
      HAVING COUNT(c.idComunidad) > 0
      ORDER BY comunidades_creadas DESC
      LIMIT 1
    `;
    
    const creators = await connection.execute(creatorQuery);
    
    if (creators[0].length === 0) {
      console.log('❌ No se encontraron usuarios creadores para simular');
      return;
    }
    
    const creator = creators[0][0];
    console.log(`👑 Usuario creador seleccionado: ${creator.nombre} (ID: ${creator.idUsuario})`);
    console.log(`🏘️ Comunidades creadas: ${creator.comunidades_creadas}`);

    // 2. Obtener todas las comunidades del creador
    console.log('\n🏘️ 2. Obteniendo comunidades del creador...');
    const communitiesQuery = `
      SELECT c.idComunidad, c.titulo, c.descripcion
      FROM comunidad c
      WHERE c.idUsuario = ?
    `;
    
    const communities = await connection.execute(communitiesQuery, [creator.idUsuario]);
    console.log(`📊 Comunidades encontradas: ${communities[0].length}`);
    
    communities[0].forEach(community => {
      console.log(`   - "${community.titulo}" (ID: ${community.idComunidad})`);
    });

    // 3. Para cada comunidad, obtener sus miembros
    console.log('\n👥 3. Obteniendo miembros de cada comunidad...');
    let totalMembers = 0;
    
    for (const community of communities[0]) {
      const membersQuery = `
        SELECT u.idUsuario, u.nombre, u.correo
        FROM usuario_comunidad uc
        JOIN usuarios u ON uc.idUsuario = u.idUsuario
        WHERE uc.idComunidad = ?
      `;
      
      const members = await connection.execute(membersQuery, [community.idComunidad]);
      console.log(`\n   🏘️ "${community.titulo}" (ID: ${community.idComunidad})`);
      console.log(`      👥 Miembros: ${members[0].length}`);
      
      members[0].forEach(member => {
        console.log(`         - ${member.nombre} (ID: ${member.idUsuario})`);
      });
      
      totalMembers += members[0].length;
    }
    
    console.log(`\n📊 Total de miembros a notificar: ${totalMembers}`);

    // 4. SIMULAR las notificaciones que se enviarían
    console.log('\n🔔 4. SIMULANDO notificaciones que se enviarían...');
    
    for (const community of communities[0]) {
      const membersQuery = `
        SELECT u.idUsuario, u.nombre, u.correo
        FROM usuario_comunidad uc
        JOIN usuarios u ON uc.idUsuario = u.idUsuario
        WHERE uc.idComunidad = ?
      `;
      
      const members = await connection.execute(membersQuery, [community.idComunidad]);
      
      console.log(`\n   📧 Notificaciones para comunidad "${community.titulo}":`);
      
      for (const member of members[0]) {
        const notificationData = {
          deletedUserId: creator.idUsuario,
          deletedUserName: creator.nombre,
          communityId: community.idComunidad,
          communityName: community.titulo,
          reason: 'Creador eliminado por violación de políticas',
          action: 'community_deleted'
        };
        
        console.log(`\n      📨 Para: ${member.nombre} (ID: ${member.idUsuario})`);
        console.log(`         📝 Título: "Comunidad eliminada por violación de políticas"`);
        console.log(`         💬 Mensaje: "El usuario creador "${creator.nombre}" ha sido eliminado por violar las políticas de la aplicación. La comunidad "${community.titulo}" ha sido eliminada y has sido removido de esta."`);
        console.log(`         🏷️  Tipo: community_deleted`);
        console.log(`         📊 Metadata: ${JSON.stringify(notificationData, null, 2)}`);
      }
    }

    // 5. Mostrar resumen de la simulación
    console.log('\n📋 5. RESUMEN DE LA SIMULACIÓN:');
    console.log(`   👤 Usuario creador: ${creator.nombre} (ID: ${creator.idUsuario})`);
    console.log(`   🏘️ Comunidades que se eliminarían: ${communities[0].length}`);
    console.log(`   👥 Total de miembros a notificar: ${totalMembers}`);
    console.log(`   📧 Total de notificaciones a enviar: ${totalMembers}`);
    console.log(`   🏷️  Tipo de notificación: community_deleted`);
    console.log(`   📝 Mensaje: Informa sobre eliminación por violación de políticas`);

    console.log('\n✅ Simulación completada exitosamente');
    console.log('\n⚠️  NOTA: Esta fue solo una simulación. Para probar realmente:');
    console.log('   1. Usa el endpoint DELETE /api/admin/users/:id');
    console.log('   2. O ejecuta el script de eliminación real');
    console.log('   3. Las notificaciones se crearán automáticamente');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔓 Conexión cerrada');
    }
  }
}

simulateCreatorDeletion();
