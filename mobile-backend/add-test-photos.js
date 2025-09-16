// add-test-photos.js - Agregar fotos de perfil de prueba
const { execute } = require('./config/database');

async function addTestPhotos() {
  try {
    console.log('📸 Agregando fotos de perfil de prueba...\n');
    
    // Fotos de perfil de prueba (URLs de ejemplo)
    const testPhotos = [
      { id: 1, name: 'Iván Peña', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
      { id: 2, name: 'verda', photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face' },
      { id: 3, name: 'Isjs', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' },
      { id: 4, name: 'Messi', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face' }
    ];
    
    for (const user of testPhotos) {
      try {
        await execute('UPDATE usuarios SET fotoPerfil = ? WHERE idUsuario = ?', [user.photo, user.id]);
        console.log(`✅ Foto agregada para ${user.name} (ID: ${user.id})`);
      } catch (error) {
        console.log(`⚠️ No se pudo actualizar ${user.name}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Fotos de perfil de prueba agregadas!');
    console.log('🔄 Reinicia la aplicación para ver los cambios.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addTestPhotos();
