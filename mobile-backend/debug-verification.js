// debug-verification.js - Script para debuggear el estado de verificación
const { execute } = require('./config/database');

async function debugUserVerification(email) {
  try {
    console.log('\n🔍 === DEBUG USER VERIFICATION ===');
    console.log('📧 Email:', email);
    
    // Buscar usuario
    const userSql = `
      SELECT idUsuario, nombre, correo, emailVerificado, 
             codigoVerificacion, codigoExpiracion,
             fechaVerificacion
      FROM usuarios 
      WHERE correo = ?
    `;
    
    const users = await execute(userSql, [email]);
    
    if (users.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = users[0];
    
    console.log('\n👤 User found:');
    console.log('  - ID:', user.idUsuario);
    console.log('  - Name:', user.nombre);
    console.log('  - Email:', user.correo);
    console.log('  - emailVerificado:', user.emailVerificado);
    console.log('  - emailVerificado type:', typeof user.emailVerificado);
    console.log('  - emailVerificado === 1:', user.emailVerificado === 1);
    console.log('  - emailVerificado === true:', user.emailVerificado === true);
    console.log('  - emailVerificado === "1":', user.emailVerificado === "1");
    console.log('  - codigoVerificacion:', user.codigoVerificacion);
    console.log('  - codigoExpiracion:', user.codigoExpiracion);
    console.log('  - fechaVerificacion:', user.fechaVerificacion);
    
    // Verificar si hay inconsistencias
    if (user.emailVerificado && user.codigoVerificacion) {
      console.log('\n⚠️ WARNING: User marked as verified but still has verification code');
    }
    
    if (!user.emailVerificado && !user.codigoVerificacion) {
      console.log('\n⚠️ WARNING: User not verified and no verification code');
    }
    
    console.log('\n✅ Debug completed');
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Función para verificar todos los usuarios
async function debugAllUsers() {
  try {
    console.log('\n🔍 === DEBUG ALL USERS ===');
    
    const allUsersSql = `
      SELECT idUsuario, nombre, correo, emailVerificado, 
             codigoVerificacion, codigoExpiracion
      FROM usuarios 
      ORDER BY idUsuario
    `;
    
    const users = await execute(allUsersSql, []);
    
    console.log(`\n👥 Total users: ${users.length}`);
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.nombre} (${user.correo})`);
      console.log(`   - ID: ${user.idUsuario}`);
      console.log(`   - emailVerificado: ${user.emailVerificado} (${typeof user.emailVerificado})`);
      console.log(`   - codigoVerificacion: ${user.codigoVerificacion ? 'SÍ' : 'NO'}`);
    });
    
    console.log('\n✅ All users debug completed');
    
  } catch (error) {
    console.error('❌ Debug all users error:', error);
  }
}

// Función para forzar verificación de un usuario
async function forceVerifyUser(email) {
  try {
    console.log('\n🔧 === FORCE VERIFY USER ===');
    console.log('📧 Email:', email);
    
    const updateSql = `
      UPDATE usuarios 
      SET emailVerificado = 1, 
          codigoVerificacion = NULL,
          codigoExpiracion = NULL
      WHERE correo = ?
    `;
    
    await execute(updateSql, [email]);
    
    console.log('✅ User force verified');
    
    // Verificar el cambio
    await debugUserVerification(email);
    
  } catch (error) {
    console.error('❌ Force verify error:', error);
  }
}

// Función para limpiar códigos de verificación expirados
async function cleanExpiredCodes() {
  try {
    console.log('\n🧹 === CLEANING EXPIRED CODES ===');
    
    const now = new Date();
    const cleanSql = `
      UPDATE usuarios 
      SET codigoVerificacion = NULL, 
          codigoExpiracion = NULL
      WHERE codigoExpiracion < ?
    `;
    
    await execute(cleanSql, [now]);
    
    console.log('✅ Expired codes cleaned');
    
  } catch (error) {
    console.error('❌ Clean expired codes error:', error);
  }
}

// Exportar funciones para uso en consola
module.exports = {
  debugUserVerification,
  debugAllUsers,
  forceVerifyUser,
  cleanExpiredCodes
};

// Si se ejecuta directamente, mostrar ayuda
if (require.main === module) {
  console.log('\n🔧 === VERIFICATION DEBUG TOOL ===');
  console.log('\nUso:');
  console.log('  node debug-verification.js');
  console.log('\nFunciones disponibles:');
  console.log('  - debugUserVerification(email)');
  console.log('  - debugAllUsers()');
  console.log('  - forceVerifyUser(email)');
  console.log('  - cleanExpiredCodes()');
  console.log('\nEjemplo:');
  console.log('  const { debugUserVerification } = require("./debug-verification");');
  console.log('  debugUserVerification("usuario@example.com");');
}
