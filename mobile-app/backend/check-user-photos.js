// check-user-photos.js - Verificar y arreglar fotos de perfil
const { execute } = require('./config/database');

async function checkUserPhotos() {
  try {
    console.log('🔍 Verificando fotos de perfil de usuarios...\n');
    
    // Obtener todos los usuarios
    const users = await execute('SELECT idUsuario, nombre, fotoPerfil FROM usuarios ORDER BY idUsuario');
    
    console.log('📋 Usuarios encontrados:');
    users.forEach(user => {
      console.log(`👤 ID: ${user.idUsuario}, Nombre: ${user.nombre}, Foto: ${user.fotoPerfil || 'Sin foto'}`);
    });
    
    // Verificar si hay usuarios sin foto
    const usersWithoutPhoto = users.filter(user => !user.fotoPerfil);
    
    if (usersWithoutPhoto.length > 0) {
      console.log(`\n⚠️ ${usersWithoutPhoto.length} usuarios sin foto de perfil:`);
      usersWithoutPhoto.forEach(user => {
        console.log(`   - ${user.nombre} (ID: ${user.idUsuario})`);
      });
      
      console.log('\n💡 Para agregar fotos de perfil, usa el script add-test-photos.js');
    } else {
      console.log('\n✅ Todos los usuarios tienen foto de perfil');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUserPhotos();