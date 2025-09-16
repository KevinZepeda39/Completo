// fix-user-161-photo.js - Arreglar foto del usuario 161
const { execute } = require('./config/database');

async function fixUser161Photo() {
  try {
    console.log('🔧 Arreglando foto del usuario 161...\n');
    
    // Verificar usuario ID 161
    const user = await execute('SELECT idUsuario, nombre, correo, fotoPerfil FROM usuarios WHERE idUsuario = 161');
    
    if (user && user.length > 0) {
      const userData = user[0];
      console.log('👤 Usuario encontrado:');
      console.log(`   ID: ${userData.idUsuario}`);
      console.log(`   Nombre: ${userData.nombre}`);
      console.log(`   Correo: ${userData.correo}`);
      console.log(`   Foto actual: ${userData.fotoPerfil || 'Sin foto'}`);
      
      // Asignar una foto de perfil
      const photoUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face';
      
      console.log('\n🔄 Asignando foto de perfil...');
      await execute('UPDATE usuarios SET fotoPerfil = ? WHERE idUsuario = 161', [photoUrl]);
      
      console.log('✅ Foto de perfil asignada exitosamente');
      console.log(`📸 Nueva foto: ${photoUrl}`);
      
      // Verificar que se guardó
      const updatedUser = await execute('SELECT fotoPerfil FROM usuarios WHERE idUsuario = 161');
      if (updatedUser && updatedUser.length > 0) {
        console.log(`✅ Verificación: Foto guardada: ${updatedUser[0].fotoPerfil}`);
      }
      
    } else {
      console.log('❌ Usuario ID 161 no encontrado');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixUser161Photo();
