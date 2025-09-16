// test-verification-flow.js - Script para probar el flujo completo
const { execute } = require('./config/database');

async function testVerificationFlow() {
  try {
    console.log('\n🧪 === TESTING VERIFICATION FLOW ===');
    
    // 1. Crear un usuario de prueba
    const testEmail = 'test@example.com';
    const testName = 'Usuario de Prueba';
    
    console.log('\n1️⃣ Creating test user...');
    
    // Verificar si ya existe
    const existingUserSql = 'SELECT * FROM usuarios WHERE correo = ?';
    const existingUsers = await execute(existingUserSql, [testEmail]);
    
    let userId;
    if (existingUsers.length > 0) {
      userId = existingUsers[0].idUsuario;
      console.log('✅ Test user already exists, ID:', userId);
    } else {
      const createUserSql = `
        INSERT INTO usuarios (nombre, correo, contraseña, activo, emailVerificado)
        VALUES (?, ?, ?, 1, 0)
      `;
      const result = await execute(createUserSql, [testName, testEmail, 'password123']);
      userId = result.insertId;
      console.log('✅ Test user created, ID:', userId);
    }
    
    // 2. Verificar estado inicial
    console.log('\n2️⃣ Checking initial state...');
    const initialStateSql = `
      SELECT emailVerificado, codigoVerificacion, codigoExpiracion
      FROM usuarios WHERE idUsuario = ?
    `;
    const initialState = await execute(initialStateSql, [userId]);
    
    console.log('📊 Initial state:');
    console.log('  - emailVerificado:', initialState[0].emailVerificado);
    console.log('  - codigoVerificacion:', initialState[0].codigoVerificacion);
    console.log('  - codigoExpiracion:', initialState[0].codigoExpiracion);
    
    // 3. Generar código de verificación
    console.log('\n3️⃣ Generating verification code...');
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + 10);
    
    // 🔥 CORREGIDO: Convertir a formato MySQL como lo hace el servidor
    const expirationMySQL = expiration.toISOString().slice(0, 19).replace('T', ' ');
    
    const updateCodeSql = `
      UPDATE usuarios 
      SET codigoVerificacion = ?, codigoExpiracion = ?
      WHERE idUsuario = ?
    `;
    await execute(updateCodeSql, [verificationCode, expirationMySQL, userId]);
    
    console.log('✅ Verification code generated:', verificationCode);
    console.log('⏰ Expires at:', expirationMySQL);
    
    // 4. Simular verificación exitosa
    console.log('\n4️⃣ Simulating successful verification...');
    const verifySql = `
      UPDATE usuarios 
      SET emailVerificado = 1, 
          codigoVerificacion = NULL,
          codigoExpiracion = NULL
      WHERE idUsuario = ?
    `;
    await execute(verifySql, [userId]);
    
    console.log('✅ User marked as verified');
    
    // 5. Verificar estado después de verificación
    console.log('\n5️⃣ Checking state after verification...');
    const verifiedState = await execute(initialStateSql, [userId]);
    
    console.log('📊 State after verification:');
    console.log('  - emailVerificado:', verifiedState[0].emailVerificado);
    console.log('  - codigoVerificacion:', verifiedState[0].codigoVerificacion);
    console.log('  - codigoExpiracion:', verifiedState[0].codigoExpiracion);
    
    // 6. Simular intento de login
    console.log('\n6️⃣ Simulating login attempt...');
    const loginCheckSql = `
      SELECT idUsuario, nombre, correo, emailVerificado, activo
      FROM usuarios 
      WHERE correo = ?
    `;
    const loginUser = await execute(loginCheckSql, [testEmail]);
    
    if (loginUser.length > 0) {
      const user = loginUser[0];
      console.log('👤 Login check result:');
      console.log('  - ID:', user.idUsuario);
      console.log('  - Name:', user.nombre);
      console.log('  - Email:', user.correo);
      console.log('  - emailVerificado:', user.emailVerificado);
      console.log('  - Active:', user.activo);
      
      // Verificar si debería permitir login
      if (user.emailVerificado && user.activo) {
        console.log('✅ User should be able to login successfully');
      } else if (!user.emailVerificado) {
        console.log('❌ User should NOT be able to login (email not verified)');
      } else if (!user.activo) {
        console.log('❌ User should NOT be able to login (inactive)');
      }
    }
    
    // 7. Limpiar usuario de prueba
    console.log('\n7️⃣ Cleaning up test user...');
    const cleanupSql = 'DELETE FROM usuarios WHERE idUsuario = ?';
    await execute(cleanupSql, [userId]);
    console.log('✅ Test user cleaned up');
    
    console.log('\n🎉 Verification flow test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Función para probar con un usuario específico
async function testSpecificUser(email) {
  try {
    console.log(`\n🧪 === TESTING SPECIFIC USER: ${email} ===`);
    
    // Buscar usuario
    const userSql = `
      SELECT idUsuario, nombre, correo, emailVerificado, 
             codigoVerificacion, codigoExpiracion, activo
      FROM usuarios 
      WHERE correo = ?
    `;
    
    const users = await execute(userSql, [email]);
    
    if (users.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = users[0];
    
    console.log('\n👤 User details:');
    console.log('  - ID:', user.idUsuario);
    console.log('  - Name:', user.nombre);
    console.log('  - Email:', user.correo);
    console.log('  - emailVerificado:', user.emailVerificado);
    console.log('  - Active:', user.activo);
    console.log('  - codigoVerificacion:', user.codigoVerificacion);
    console.log('  - codigoExpiracion:', user.codigoExpiracion);
    
    // Simular verificación si no está verificado
    if (!user.emailVerificado) {
      console.log('\n🔧 User not verified, simulating verification...');
      
      const verifySql = `
        UPDATE usuarios 
        SET emailVerificado = 1, 
            codigoVerificacion = NULL,
            codigoExpiracion = NULL
        WHERE idUsuario = ?
      `;
      await execute(verifySql, [user.idUsuario]);
      
      console.log('✅ User marked as verified');
      
      // Verificar el cambio
      const updatedUser = await execute(userSql, [email]);
      console.log('📊 Updated state:');
      console.log('  - emailVerificado:', updatedUser[0].emailVerificado);
      console.log('  - codigoVerificacion:', updatedUser[0].codigoVerificacion);
    }
    
    console.log('\n✅ Specific user test completed');
    
  } catch (error) {
    console.error('❌ Specific user test failed:', error);
  }
}

// Exportar funciones
module.exports = {
  testVerificationFlow,
  testSpecificUser
};

// Si se ejecuta directamente
if (require.main === module) {
  console.log('\n🧪 === VERIFICATION FLOW TEST TOOL ===');
  console.log('\nUso:');
  console.log('  node test-verification-flow.js');
  console.log('\nFunciones disponibles:');
  console.log('  - testVerificationFlow()');
  console.log('  - testSpecificUser(email)');
  console.log('\nEjemplo:');
  console.log('  const { testSpecificUser } = require("./test-verification-flow");');
  console.log('  testSpecificUser("usuario@example.com");');
  
  // Ejecutar prueba automáticamente
  testVerificationFlow();
}
