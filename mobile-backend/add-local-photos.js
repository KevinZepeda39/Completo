// add-local-photos.js - Agregar fotos de perfil locales a usuarios
const { execute } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function addLocalPhotos() {
  try {
    console.log('📸 Agregando fotos de perfil locales a usuarios...\n');
    
    // Obtener usuarios sin foto
    const usersWithoutPhoto = await execute('SELECT idUsuario, nombre FROM usuarios WHERE fotoPerfil IS NULL OR fotoPerfil = "" OR fotoPerfil LIKE "%unsplash%"');
    
    if (usersWithoutPhoto.length === 0) {
      console.log('✅ Todos los usuarios ya tienen fotos de perfil locales');
      return;
    }
    
    console.log(`📋 Encontrados ${usersWithoutPhoto.length} usuarios sin foto local:`);
    usersWithoutPhoto.forEach(user => {
      console.log(`   - ${user.nombre} (ID: ${user.idUsuario})`);
    });
    
    // Fotos de perfil locales (archivos que ya existen)
    const localPhotos = [
      'profile1.jpg',
      'profile2.jpg', 
      'profile3.jpg',
      'profile4.jpg',
      'profile5.jpg',
      'profile6.jpg'
    ];
    
    // Crear directorio si no existe
    const profilesDir = path.join(__dirname, '..', '..', 'C:', 'ImagenesCompartidas', 'uploads', 'profiles');
    if (!fs.existsSync(profilesDir)) {
      fs.mkdirSync(profilesDir, { recursive: true });
      console.log('📁 Directorio creado:', profilesDir);
    }
    
    console.log('\n🔄 Agregando fotos locales...');
    
    for (let i = 0; i < usersWithoutPhoto.length; i++) {
      const user = usersWithoutPhoto[i];
      const photoIndex = i % localPhotos.length;
      const photoFilename = localPhotos[photoIndex];
      
      try {
        // Verificar si el archivo existe
        const photoPath = path.join(profilesDir, photoFilename);
        if (!fs.existsSync(photoPath)) {
          console.log(`⚠️ Archivo no encontrado: ${photoFilename}, saltando...`);
          continue;
        }
        
        // URL local
        const localUrl = `http://localhost:3000/uploads/profiles/${photoFilename}`;
        
        await execute('UPDATE usuarios SET fotoPerfil = ? WHERE idUsuario = ?', [localUrl, user.idUsuario]);
        console.log(`✅ Foto local agregada para ${user.nombre} (ID: ${user.idUsuario}): ${photoFilename}`);
        
      } catch (error) {
        console.log(`❌ Error agregando foto para ${user.nombre}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Fotos de perfil locales agregadas exitosamente!');
    console.log('🔄 Reinicia la aplicación para ver los cambios.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addLocalPhotos();
