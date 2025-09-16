// add-photos-to-users.js - Agregar fotos de perfil a usuarios existentes
const { execute } = require('./config/database');

async function addPhotosToUsers() {
  try {
    console.log('📸 Agregando fotos de perfil a usuarios...\n');
    
    // Obtener usuarios sin foto
    const usersWithoutPhoto = await execute('SELECT idUsuario, nombre FROM usuarios WHERE fotoPerfil IS NULL OR fotoPerfil = ""');
    
    if (usersWithoutPhoto.length === 0) {
      console.log('✅ Todos los usuarios ya tienen foto de perfil');
      return;
    }
    
    console.log(`📋 Encontrados ${usersWithoutPhoto.length} usuarios sin foto:`);
    usersWithoutPhoto.forEach(user => {
      console.log(`   - ${user.nombre} (ID: ${user.idUsuario})`);
    });
    
    // Fotos de perfil de prueba
    const testPhotos = [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
    ];
    
    console.log('\n🔄 Agregando fotos...');
    
    for (let i = 0; i < usersWithoutPhoto.length; i++) {
      const user = usersWithoutPhoto[i];
      const photoIndex = i % testPhotos.length;
      const photoUrl = testPhotos[photoIndex];
      
      try {
        await execute('UPDATE usuarios SET fotoPerfil = ? WHERE idUsuario = ?', [photoUrl, user.idUsuario]);
        console.log(`✅ Foto agregada para ${user.nombre} (ID: ${user.idUsuario})`);
      } catch (error) {
        console.log(`❌ Error agregando foto para ${user.nombre}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Fotos de perfil agregadas exitosamente!');
    console.log('🔄 Reinicia la aplicación para ver los cambios.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addPhotosToUsers();