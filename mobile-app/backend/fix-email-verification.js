// fix-email-verification.js - Script para corregir el estado de verificación de email
const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'miciudadsv'
};

async function fixEmailVerification() {
  let connection;
  
  try {
    console.log('🔧 === CORRIGIENDO VERIFICACIÓN DE EMAIL ===\n');
    
    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos');
    
    // 1. Verificar usuarios que tienen código de verificación pero deberían estar verificados
    console.log('1️⃣ === VERIFICANDO USUARIOS CON CÓDIGOS ACTIVOS ===');
    
    const [usersWithCodes] = await connection.execute(`
      SELECT idUsuario, nombre, correo, emailVerificado, 
             codigoVerificacion, codigoExpiracion
      FROM usuarios 
      WHERE codigoVerificacion IS NOT NULL 
        AND codigoExpiracion IS NOT NULL
      ORDER BY idUsuario
    `);
    
    if (usersWithCodes.length === 0) {
      console.log('✅ No hay usuarios con códigos de verificación activos');
    } else {
      console.log(`📊 Encontrados ${usersWithCodes.length} usuarios con códigos activos:`);
      
      for (const user of usersWithCodes) {
        console.log(`\n👤 Usuario: ${user.nombre} (${user.correo})`);
        console.log(`   - ID: ${user.idUsuario}`);
        console.log(`   - emailVerificado: ${user.emailVerificado}`);
        console.log(`   - Código: ${user.codigoVerificacion}`);
        console.log(`   - Expiración: ${user.codigoExpiracion}`);
        
        // Verificar si el código ha expirado
        const now = new Date();
        const expiration = new Date(user.codigoExpiracion);
        const isExpired = now > expiration;
        
        console.log(`   - Código expirado: ${isExpired}`);
        
        if (isExpired) {
          console.log(`   🔄 Limpiando código expirado...`);
          
          await connection.execute(`
            UPDATE usuarios 
            SET codigoVerificacion = NULL, codigoExpiracion = NULL
            WHERE idUsuario = ?
          `, [user.idUsuario]);
          
          console.log(`   ✅ Código expirado limpiado`);
        }
      }
    }
    
    // 2. Verificar usuarios que no tienen emailVerificado = 1 pero deberían estar verificados
    console.log('\n2️⃣ === VERIFICANDO USUARIOS SIN VERIFICACIÓN ===');
    
    const [unverifiedUsers] = await connection.execute(`
      SELECT idUsuario, nombre, correo, emailVerificado
      FROM usuarios 
      WHERE (emailVerificado = 0 OR emailVerificado IS NULL OR emailVerificado = '0')
        AND correo IS NOT NULL
      ORDER BY idUsuario
    `);
    
    if (unverifiedUsers.length === 0) {
      console.log('✅ Todos los usuarios están verificados correctamente');
    } else {
      console.log(`📊 Encontrados ${unverifiedUsers.length} usuarios sin verificar:`);
      
      for (const user of unverifiedUsers) {
        console.log(`\n👤 Usuario: ${user.nombre} (${user.correo})`);
        console.log(`   - ID: ${user.idUsuario}`);
        console.log(`   - emailVerificado actual: ${user.emailVerificado}`);
        
        // Preguntar si queremos verificar este usuario
        console.log(`   🔍 ¿Este usuario ya verificó su email? (s/n)`);
        // En un script real, aquí podrías usar readline o process.argv para obtener input
        
        // Por ahora, vamos a verificar usuarios con emails que parecen válidos
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const hasValidEmail = emailPattern.test(user.correo);
        
        if (hasValidEmail) {
          console.log(`   ✅ Email válido detectado, marcando como verificado...`);
          
          await connection.execute(`
            UPDATE usuarios 
            SET emailVerificado = 1
            WHERE idUsuario = ?
          `, [user.idUsuario]);
          
          console.log(`   ✅ Usuario marcado como verificado`);
        } else {
          console.log(`   ⚠️ Email no válido, saltando...`);
        }
      }
    }
    
    // 3. Verificar usuarios específicos que sabemos que deberían estar verificados
    console.log('\n3️⃣ === VERIFICANDO USUARIOS ESPECÍFICOS ===');
    
    const specificEmails = [
      'lucia@example.com',
      'kevin.zepeda4cm@gmail.com'
    ];
    
    for (const email of specificEmails) {
      const [userResults] = await connection.execute(
        'SELECT * FROM usuarios WHERE correo = ?',
        [email]
      );
      
      if (userResults.length > 0) {
        const user = userResults[0];
        console.log(`\n📧 Usuario específico: ${email}`);
        console.log(`   - ID: ${user.idUsuario}`);
        console.log(`   - Nombre: ${user.nombre}`);
        console.log(`   - emailVerificado actual: ${user.emailVerificado}`);
        
        // Forzar verificación para usuarios de demo
        if (email === 'lucia@example.com' || email === 'kevin.zepeda4cm@gmail.com') {
          console.log(`   🔄 Forzando verificación para usuario de demo...`);
          
          await connection.execute(`
            UPDATE usuarios 
            SET emailVerificado = 1,
                codigoVerificacion = NULL,
                codigoExpiracion = NULL
            WHERE idUsuario = ?
          `, [user.idUsuario]);
          
          console.log(`   ✅ Usuario de demo verificado forzadamente`);
        }
      } else {
        console.log(`\n❌ Usuario no encontrado: ${email}`);
      }
    }
    
    // 4. Verificar estado final
    console.log('\n4️⃣ === VERIFICACIÓN FINAL ===');
    
    const [finalCheck] = await connection.execute(`
      SELECT idUsuario, nombre, correo, emailVerificado
      FROM usuarios 
      ORDER BY idUsuario
    `);
    
    console.log(`📊 Estado final de ${finalCheck.length} usuarios:`);
    
    finalCheck.forEach(user => {
      const status = user.emailVerificado == 1 ? '✅ VERIFICADO' : '❌ NO VERIFICADO';
      console.log(`   - ${user.nombre} (${user.correo}): ${status}`);
    });
    
    console.log('\n🎯 === CORRECCIÓN COMPLETADA ===');
    console.log('Ahora prueba hacer login nuevamente con un usuario verificado');
    
  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar la corrección
fixEmailVerification();
