const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'miciudadsv'
};

async function suspendCommunity(communityId) {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión establecida');
    
    // 1. Verificar el estado actual de la comunidad
    console.log(`\n📊 Verificando estado actual de la comunidad ${communityId}...`);
    const [currentStatus] = await connection.execute(
      'SELECT idComunidad, titulo, estado FROM comunidad WHERE idComunidad = ?',
      [communityId]
    );
    
    if (currentStatus.length === 0) {
      console.log(`❌ No se encontró la comunidad con ID ${communityId}`);
      return;
    }
    
    const community = currentStatus[0];
    console.log(`✅ Comunidad encontrada: ${community.titulo}`);
    console.log(`📊 Estado actual: ${community.estado || 'activa'}`);
    
    if (community.estado === 'suspendida') {
      console.log('⚠️ La comunidad ya está suspendida');
      return;
    }
    
    // 2. Suspender la comunidad
    console.log(`\n🔒 Suspendiendo comunidad ${communityId}...`);
    await connection.execute(
      'UPDATE comunidad SET estado = ? WHERE idComunidad = ?',
      ['suspendida', communityId]
    );
    
    console.log('✅ Comunidad suspendida exitosamente');
    
    // 3. Verificar el cambio
    console.log('\n📊 Verificando cambio...');
    const [newStatus] = await connection.execute(
      'SELECT idComunidad, titulo, estado FROM comunidad WHERE idComunidad = ?',
      [communityId]
    );
    
    if (newStatus.length > 0) {
      console.log(`🎯 Estado actualizado: ${newStatus[0].estado}`);
    }
    
    console.log('\n🚀 Ahora puedes probar la funcionalidad:');
    console.log('1. Ejecuta: node test-suspended-community.js');
    console.log('2. O prueba desde la aplicación móvil');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

async function reactivateCommunity(communityId) {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión establecida');
    
    // Reactivar la comunidad
    console.log(`\n🔄 Reactivando comunidad ${communityId}...`);
    await connection.execute(
      'UPDATE comunidad SET estado = ? WHERE idComunidad = ?',
      ['activa', communityId]
    );
    
    console.log('✅ Comunidad reactivada exitosamente');
    
    // Verificar el cambio
    const [newStatus] = await connection.execute(
      'SELECT idComunidad, titulo, estado FROM comunidad WHERE idComunidad = ?',
      [communityId]
    );
    
    if (newStatus.length > 0) {
      console.log(`🎯 Estado actualizado: ${newStatus[0].estado}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

async function listCommunities() {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión establecida');
    
    console.log('\n📋 Listando todas las comunidades:');
    const [communities] = await connection.execute(
      'SELECT idComunidad, titulo, estado, fechaCreacion FROM comunidad ORDER BY fechaCreacion DESC'
    );
    
    if (communities.length === 0) {
      console.log('❌ No hay comunidades en la base de datos');
      return;
    }
    
    communities.forEach(community => {
      const status = community.estado || 'activa';
      const statusIcon = status === 'suspendida' ? '🚫' : '✅';
      console.log(`${statusIcon} ID: ${community.idComunidad} | ${community.titulo} | Estado: ${status}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const communityId = parseInt(args[1]) || 71; // Default: comunidad 71
  
  console.log('🔒 === GESTOR DE ESTADOS DE COMUNIDADES ===\n');
  
  switch (command) {
    case 'suspend':
      await suspendCommunity(communityId);
      break;
      
    case 'reactivate':
      await reactivateCommunity(communityId);
      break;
      
    case 'list':
      await listCommunities();
      break;
      
    default:
      console.log('📖 Uso:');
      console.log('  node suspend-community.js suspend [communityId]  - Suspender comunidad');
      console.log('  node suspend-community.js reactivate [communityId] - Reactivar comunidad');
      console.log('  node suspend-community.js list                    - Listar todas las comunidades');
      console.log('\n💡 Ejemplos:');
      console.log('  node suspend-community.js suspend 71');
      console.log('  node suspend-community.js reactivate 71');
      console.log('  node suspend-community.js list');
      break;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { suspendCommunity, reactivateCommunity, listCommunities };
