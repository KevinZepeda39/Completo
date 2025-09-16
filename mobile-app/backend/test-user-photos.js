// test-user-photos.js - Verificar fotos de perfil de usuarios
const { execute } = require('./config/database');

async function testUserPhotos() {
  try {
    console.log('🔍 Verificando fotos de perfil de usuarios...\n');
    
    // Obtener todos los usuarios
    const users = await execute('SELECT idUsuario, nombre, fotoPerfil FROM usuarios');
    
    console.log('📋 Usuarios encontrados:');
    users.forEach(user => {
      console.log(`👤 ID: ${user.idUsuario}, Nombre: ${user.nombre}, Foto: ${user.fotoPerfil || 'Sin foto'}`);
    });
    
    // Verificar usuarios específicos del chat
    console.log('\n🔍 Verificando usuarios del chat de Barcelona...');
    
    const chatUsers = await execute(`
      SELECT DISTINCT c.idUsuario, u.nombre, u.fotoPerfil 
      FROM comentarios c 
      LEFT JOIN usuarios u ON c.idUsuario = u.idUsuario 
      WHERE c.idComunidad = 1
    `);
    
    console.log('📬 Usuarios que han enviado mensajes en Barcelona:');
    chatUsers.forEach(user => {
      console.log(`👤 ID: ${user.idUsuario}, Nombre: ${user.nombre}, Foto: ${user.fotoPerfil || 'Sin foto'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testUserPhotos();
