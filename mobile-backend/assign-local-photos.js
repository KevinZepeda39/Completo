// assign-local-photos.js - Asignar fotos locales a usuarios
const { execute } = require('./config/database');

async function assignLocalPhotos() {
  try {
    console.log('📸 Asignando fotos locales a usuarios...\n');
    
    // Obtener usuarios sin foto o con fotos de Unsplash
    const usersWithoutPhoto = await execute('SELECT idUsuario, nombre FROM usuarios WHERE fotoPerfil IS NULL OR fotoPerfil = "" OR fotoPerfil LIKE "%unsplash%"');
    
    if (usersWithoutPhoto.length === 0) {
      console.log('✅ Todos los usuarios ya tienen fotos locales');
      return;
    }
    
    console.log(`📋 Encontrados ${usersWithoutPhoto.length} usuarios sin foto local:`);
    usersWithoutPhoto.forEach(user => {
      console.log(`   - ${user.nombre} (ID: ${user.idUsuario})`);
    });
    
    // Fotos locales disponibles
    const localPhotos = [
      'profile1.svg',
      'profile2.svg',
      'profile3.svg',
      'profile4.svg',
      'profile5.svg',
      'profile6.svg'
    ];
    
    console.log('\n🔄 Asignando fotos locales...');
    
    for (let i = 0; i < usersWithoutPhoto.length; i++) {
      const user = usersWithoutPhoto[i];
      const photoIndex = i % localPhotos.length;
      const photoFilename = localPhotos[photoIndex];
      
      try {
        // URL local
        const localUrl = `http://localhost:3000/uploads/profiles/${photoFilename}`;
        
        await execute('UPDATE usuarios SET fotoPerfil = ? WHERE idUsuario = ?', [localUrl, user.idUsuario]);
        console.log(`✅ Foto local asignada para ${user.nombre} (ID: ${user.idUsuario}): ${photoFilename}`);
        
      } catch (error) {
        console.log(`❌ Error asignando foto para ${user.nombre}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Fotos locales asignadas exitosamente!');
    console.log('🔄 Reinicia la aplicación para ver los cambios.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

assignLocalPhotos();
