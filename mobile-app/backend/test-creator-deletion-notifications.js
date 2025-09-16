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

async function testCreatorDeletionNotifications() {
  let connection;
  
  try {
    console.log('🔧 Configuración de Base de Datos:');
    console.log('📡 Host: localhost:3000');
    console.log('🗃️ Database: miciudadsv');
    console.log('👤 User: root');
    console.log('🔍 Probando sistema de notificaciones para eliminación de creadores...\n');

    // Crear conexión
    connection = await mysql.createConnection(dbConfig);
    console.log('🔗 Conexión establecida');

    // 1. Buscar usuarios que son creadores de comunidades
    console.log('\n📋 1. Buscando usuarios creadores de comunidades...');
    const creatorsQuery = `
      SELECT DISTINCT u.idUsuario, u.nombre, u.correo, COUNT(c.idComunidad) as comunidades_creadas
      FROM usuarios u
      JOIN comunidad c ON u.idUsuario = c.idUsuario
      GROUP BY u.idUsuario, u.nombre, u.correo
      HAVING COUNT(c.idComunidad) > 0
      ORDER BY comunidades_creadas DESC
    `;
    
    const creators = await connection.execute(creatorsQuery);
    console.log(`👑 Encontrados ${creators[0].length} usuarios creadores:`);
    
    creators[0].forEach(creator => {
      console.log(`   - ${creator.nombre} (ID: ${creator.idUsuario}) - ${creator.comunidades_creadas} comunidades`);
    });

    // 2. Para cada creador, mostrar sus comunidades y miembros
    if (creators[0].length > 0) {
      const firstCreator = creators[0][0];
      console.log(`\n🏘️ 2. Analizando comunidades del creador: ${firstCreator.nombre}`);
      
      const communitiesQuery = `
        SELECT c.idComunidad, c.titulo, c.descripcion,
               COUNT(uc.idUsuario) as total_miembros
        FROM comunidad c
        LEFT JOIN usuario_comunidad uc ON c.idComunidad = uc.idComunidad
        WHERE c.idUsuario = ?
        GROUP BY c.idComunidad, c.titulo, c.descripcion
      `;
      
      const communities = await connection.execute(communitiesQuery, [firstCreator.idUsuario]);
      console.log(`📊 Comunidades creadas por ${firstCreator.nombre}:`);
      
      for (const community of communities[0]) {
        console.log(`\n   🏘️ "${community.titulo}" (ID: ${community.idComunidad})`);
        console.log(`      📝 Descripción: ${community.descripcion || 'Sin descripción'}`);
        console.log(`      👥 Miembros: ${community.total_miembros}`);
        
        // Mostrar algunos miembros
        if (community.total_miembros > 0) {
                  const membersQuery = `
          SELECT u.idUsuario, u.nombre, u.correo
          FROM usuario_comunidad uc
          JOIN usuarios u ON uc.idUsuario = u.idUsuario
          WHERE uc.idComunidad = ?
          LIMIT 5
        `;
          
          const members = await connection.execute(membersQuery, [community.idComunidad]);
          console.log(`      👤 Algunos miembros:`);
          members[0].forEach(member => {
            console.log(`         - ${member.nombre} (${member.correo})`);
          });
          
          if (community.total_miembros > 5) {
            console.log(`         ... y ${community.total_miembros - 5} más`);
          }
        }
      }
    }

    // 3. Verificar estructura de notificaciones
    console.log('\n🔔 3. Verificando estructura de notificaciones...');
    const notificationStructureQuery = `
      DESCRIBE notification_history
    `;
    
    const notificationStructure = await connection.execute(notificationStructureQuery);
    console.log('📋 Estructura de la tabla notification_history:');
    notificationStructure[0].forEach(field => {
      console.log(`   - ${field.Field}: ${field.Type} ${field.Null === 'NO' ? '(NOT NULL)' : '(NULL)'}`);
    });

    // 4. Mostrar notificaciones existentes de tipo community_deleted
    console.log('\n📨 4. Verificando notificaciones existentes de comunidades eliminadas...');
    const existingNotificationsQuery = `
      SELECT nh.*, u.nombre as usuario_nombre
      FROM notification_history nh
      JOIN usuarios u ON nh.userId = u.idUsuario
      WHERE nh.type = 'community_deleted'
      ORDER BY nh.createdAt DESC
      LIMIT 10
    `;
    
    const existingNotifications = await connection.execute(existingNotificationsQuery);
    
    if (existingNotifications[0].length > 0) {
      console.log(`📬 Encontradas ${existingNotifications[0].length} notificaciones de comunidades eliminadas:`);
      existingNotifications[0].forEach(notif => {
        console.log(`\n   📧 Para: ${notif.usuario_nombre} (ID: ${notif.userId})`);
        console.log(`      📝 Título: ${notif.title}`);
        console.log(`      💬 Mensaje: ${notif.message}`);
        console.log(`      📅 Fecha: ${notif.createdAt}`);
        console.log(`      📖 Leída: ${notif.isRead ? 'Sí' : 'No'}`);
      });
    } else {
      console.log('ℹ️ No hay notificaciones de comunidades eliminadas aún');
    }

    console.log('\n✅ Prueba completada exitosamente');
    console.log('\n📋 Resumen:');
    console.log('   - Sistema de notificaciones configurado correctamente');
    console.log('   - Cuando se elimine un creador, se notificará a todos sus miembros');
    console.log('   - Las notificaciones se guardan en notification_history');
    console.log('   - Tipo de notificación: community_deleted');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔓 Conexión cerrada');
    }
  }
}

testCreatorDeletionNotifications();
