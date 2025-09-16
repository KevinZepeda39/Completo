// check-specific-user.js - Verificar usuario específico
const { execute } = require('./config/database');

async function checkSpecificUser() {
  try {
    console.log('🔍 Verificando usuario específico ID 161...\n');
    
    // Verificar usuario ID 161
    const user = await execute('SELECT idUsuario, nombre, correo, fotoPerfil FROM usuarios WHERE idUsuario = 161');
    
    if (user && user.length > 0) {
      const userData = user[0];
      console.log('👤 Usuario encontrado:');
      console.log(`   ID: ${userData.idUsuario}`);
      console.log(`   Nombre: ${userData.nombre}`);
      console.log(`   Correo: ${userData.correo}`);
      console.log(`   Foto: ${userData.fotoPerfil || 'Sin foto'}`);
      
      if (userData.fotoPerfil) {
        console.log('✅ El usuario SÍ tiene foto de perfil');
      } else {
        console.log('❌ El usuario NO tiene foto de perfil');
      }
    } else {
      console.log('❌ Usuario ID 161 no encontrado');
    }
    
    console.log('\n🔍 Verificando todos los usuarios sin foto...');
    
    // Verificar usuarios sin foto
    const usersWithoutPhoto = await execute('SELECT idUsuario, nombre, correo FROM usuarios WHERE fotoPerfil IS NULL OR fotoPerfil = ""');
    
    console.log(`📊 Usuarios sin foto: ${usersWithoutPhoto.length}`);
    usersWithoutPhoto.forEach(user => {
      console.log(`   - ID: ${user.idUsuario}, Nombre: ${user.nombre}, Correo: ${user.correo}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSpecificUser();
