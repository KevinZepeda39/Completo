// backend/debug-email-verification-status.js
const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'miciudadsv'
};

async function debugEmailVerificationStatus() {
  let connection;
  
  try {
    console.log('🔍 === DEBUGGING EMAIL VERIFICATION STATUS ===\n');
    
    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully');
    
    // Verificar usuarios específicos
    const testEmails = [
      'lucia@example.com',
      'kevin.zepeda4cm@gmail.com'
    ];
    
    for (const email of testEmails) {
      console.log(`\n📧 Checking user: ${email}`);
      
      const [users] = await connection.execute(`
        SELECT 
          idUsuario,
          nombre,
          correo,
          emailVerificado,
          codigoVerificacion,
          codigoExpiracion,
          fechaVerificacion,
          activo
        FROM usuarios 
        WHERE correo = ?
      `, [email]);
      
      if (users.length === 0) {
        console.log('❌ User not found');
        continue;
      }
      
      const user = users[0];
      console.log('👤 User found:');
      console.log(`   - ID: ${user.idUsuario}`);
      console.log(`   - Name: ${user.nombre}`);
      console.log(`   - Email: ${user.correo}`);
      console.log(`   - emailVerificado: ${user.emailVerificado} (type: ${typeof user.emailVerificado})`);
      console.log(`   - codigoVerificacion: ${user.codigoVerificacion}`);
      console.log(`   - codigoExpiracion: ${user.codigoExpiracion}`);
      console.log(`   - fechaVerificacion: ${user.fechaVerificacion}`);
      console.log(`   - activo: ${user.activo}`);
      
      // Probar diferentes comparaciones
      console.log('\n🔍 Testing different verification checks:');
      console.log(`   - emailVerificado === 1: ${user.emailVerificado === 1}`);
      console.log(`   - emailVerificado === true: ${user.emailVerificado === true}`);
      console.log(`   - emailVerificado === "1": ${user.emailVerificado === "1"}`);
      console.log(`   - Boolean(emailVerificado): ${Boolean(user.emailVerificado)}`);
      console.log(`   - String(emailVerificado): "${String(user.emailVerificado)}"`);
      
      // Función helper del backend
      function isEmailVerified(emailVerificado) {
        if (emailVerificado === null || emailVerificado === undefined) {
          return false;
        }
        const value = String(emailVerificado).toLowerCase();
        const verifiedValues = ['1', 'true', 'yes', 'on'];
        return verifiedValues.includes(value) || Boolean(emailVerificado);
      }
      
      const helperResult = isEmailVerified(user.emailVerificado);
      console.log(`   - Helper function result: ${helperResult}`);
      
      // Verificar si debería estar verificado
      if (user.fechaVerificacion) {
        console.log('✅ User has verification date - should be verified');
      } else if (user.codigoVerificacion) {
        console.log('⚠️ User has verification code - needs to verify');
      } else if (user.emailVerificado) {
        console.log('✅ User marked as verified in database');
      } else {
        console.log('❌ User not verified');
      }
    }
    
    // Verificar estructura de la tabla
    console.log('\n🔍 === TABLE STRUCTURE ===');
    const [columns] = await connection.execute(`
      DESCRIBE usuarios
    `);
    
    console.log('Table structure:');
    columns.forEach(col => {
      if (col.Field.includes('email') || col.Field.includes('verific')) {
        console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} Default: ${col.Default}`);
      }
    });
    
    // Verificar todos los usuarios y su estado de verificación
    console.log('\n🔍 === ALL USERS VERIFICATION STATUS ===');
    const [allUsers] = await connection.execute(`
      SELECT 
        idUsuario,
        nombre,
        correo,
        emailVerificado,
        fechaVerificacion,
        activo
      FROM usuarios 
      ORDER BY idUsuario
    `);
    
    console.log('All users:');
    allUsers.forEach(user => {
      const status = user.emailVerificado ? '✅ VERIFIED' : '❌ NOT VERIFIED';
      const verificationDate = user.fechaVerificacion ? `(${user.fechaVerificacion})` : '';
      console.log(`   - ${user.idUsuario}: ${user.nombre} <${user.correo}> - ${status} ${verificationDate}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Ejecutar el diagnóstico
debugEmailVerificationStatus();
