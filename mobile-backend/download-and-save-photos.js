// download-and-save-photos.js - Descargar y guardar imágenes físicamente
const { execute } = require('./config/database');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Crear directorio si no existe
const profilesDir = path.join(__dirname, '..', '..', 'C:', 'ImagenesCompartidas', 'uploads', 'profiles');
if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
  console.log('📁 Directorio creado:', profilesDir);
}

async function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Error descargando imagen: ${response.statusCode}`));
        return;
      }
      
      const filePath = path.join(profilesDir, filename);
      const fileStream = fs.createWriteStream(filePath);
      
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(filePath);
      });
      
      fileStream.on('error', (err) => {
        fs.unlink(filePath, () => {}); // Eliminar archivo parcial
        reject(err);
      });
    }).on('error', reject);
  });
}

async function savePhotosLocally() {
  try {
    console.log('📸 Descargando y guardando fotos de perfil localmente...\n');
    
    // Obtener usuarios con fotos de Unsplash
    const users = await execute('SELECT idUsuario, nombre, fotoPerfil FROM usuarios WHERE fotoPerfil LIKE "%unsplash%"');
    
    if (users.length === 0) {
      console.log('✅ No hay usuarios con fotos de Unsplash para procesar');
      return;
    }
    
    console.log(`📋 Encontrados ${users.length} usuarios con fotos de Unsplash:`);
    users.forEach(user => {
      console.log(`   - ${user.nombre} (ID: ${user.idUsuario})`);
    });
    
    console.log('\n🔄 Descargando y guardando fotos...');
    
    for (const user of users) {
      try {
        // Generar nombre de archivo único
        const fileExtension = '.jpg';
        const filename = `user_${user.idUsuario}_${Date.now()}${fileExtension}`;
        
        // Descargar imagen
        const localPath = await downloadImage(user.fotoPerfil, filename);
        console.log(`✅ Foto descargada para ${user.nombre}: ${filename}`);
        
        // Actualizar base de datos con ruta local
        const localUrl = `http://localhost:3000/uploads/profiles/${filename}`;
        await execute('UPDATE usuarios SET fotoPerfil = ? WHERE idUsuario = ?', [localUrl, user.idUsuario]);
        console.log(`💾 Base de datos actualizada para ${user.nombre}`);
        
      } catch (error) {
        console.log(`❌ Error procesando ${user.nombre}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Fotos descargadas y guardadas exitosamente!');
    console.log('🔄 Reinicia la aplicación para ver los cambios.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

savePhotosLocally();
