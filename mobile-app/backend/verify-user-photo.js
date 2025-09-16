// verify-user-photo.js - Verificar que la foto de perfil se esté guardando correctamente
const { execute } = require('./config/database');

async function verifyUserPhoto() {
  try {
    console.log('🔍 Verificando fotos de perfil de usuarios...\n');
    
    // Obtener todos los usuarios con sus fotos
    const users = await execute('SELECT idUsuario, nombre, fotoPerfil FROM usuarios ORDER BY idUsuario');
    
    console.log('📋 Usuarios y sus fotos de perfil:');
    console.log('=====================================');
    
    users.forEach(user => {
      console.log(`👤 ID: ${user.idUsuario}`);
      console.log(`   Nombre: ${user.nombre}`);
      console.log(`   Foto: ${user.fotoPerfil || 'Sin foto'}`);
      console.log('   ---');
    });
    
    // Contar usuarios con y sin foto
    const usersWithPhoto = users.filter(user => user.fotoPerfil && user.fotoPerfil.trim() !== '');
    const usersWithoutPhoto = users.filter(user => !user.fotoPerfil || user.fotoPerfil.trim() === '');
    
    console.log('\n📊 Estadísticas:');
    console.log(`✅ Usuarios con foto: ${usersWithPhoto.length}`);
    console.log(`❌ Usuarios sin foto: ${usersWithoutPhoto.length}`);
    console.log(`📈 Total usuarios: ${users.length}`);
    
    if (usersWithoutPhoto.length > 0) {
      console.log('\n⚠️ Usuarios sin foto:');
      usersWithoutPhoto.forEach(user => {
        console.log(`   - ${user.nombre} (ID: ${user.idUsuario})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyUserPhoto();
