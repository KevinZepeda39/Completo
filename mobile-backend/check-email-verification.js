// check-email-verification.js - Script para verificar el estado de verificación de email
const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'miciudadsv'
};

async function checkEmailVerification() {
  let connection;
  
  try {
    console.log('🔍 === VERIFICANDO ESTADO DE VERIFICACIÓN DE EMAIL ===\n');
    
    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos');
    
    // Verificar estructura de la tabla usuarios
    console.log('\n1️⃣ === ESTRUCTURA DE LA TABLA usuarios ===');
    const [columns] = await connection.execute('DESCRIBE usuarios');
    
    const emailVerificadoColumn = columns.find(col => col.Field === 'emailVerificado');
    if (emailVerificadoColumn) {
      console.log('📋 Campo emailVerificado encontrado:');
      console.log('   - Tipo:', emailVerificadoColumn.Type);
      console.log('   - Null:', emailVerificadoColumn.Null);
      console.log('   - Default:', emailVerificadoColumn.Default);
      console.log('   - Key:', emailVerificadoColumn.Key);
    } else {
      console.log('❌ Campo emailVerificado NO encontrado');
    }
    
    // Verificar usuarios y su estado de verificación
    console.log('\n2️⃣ === ESTADO DE VERIFICACIÓN DE USUARIOS ===');
    const [users] = await connection.execute(`
      SELECT idUsuario, nombre, correo, emailVerificado, 
             codigoVerificacion, codigoExpiracion, activo
      FROM usuarios 
      ORDER BY idUsuario
    `);
    
    if (users.length === 0) {
      console.log('⚠️ No hay usuarios en la base de datos');
    } else {
      console.log(`📊 Encontrados ${users.length} usuarios:`);
      
      users.forEach((user, index) => {
        console.log(`\n👤 Usuario ${index + 1}:`);
        console.log(`   - ID: ${user.idUsuario}`);
        console.log(`   - Nombre: ${user.nombre}`);
        console.log(`   - Email: ${user.correo}`);
        console.log(`   - emailVerificado: ${user.emailVerificado} (tipo: ${typeof user.emailVerificado})`);
        console.log(`   - Código: ${user.codigoVerificacion || 'NULL'}`);
        console.log(`   - Expiración: ${user.codigoExpiracion || 'NULL'}`);
        console.log(`   - Activo: ${user.activo}`);
        
        // Verificar si la verificación está funcionando correctamente
        const isVerified = Boolean(user.emailVerificado);
        const hasCode = Boolean(user.codigoVerificacion);
        
        if (isVerified && hasCode) {
          console.log(`   ⚠️  PROBLEMA: Usuario verificado pero aún tiene código de verificación`);
        } else if (!isVerified && !hasCode) {
          console.log(`   ⚠️  PROBLEMA: Usuario no verificado y sin código de verificación`);
        } else if (isVerified && !hasCode) {
          console.log(`   ✅ CORRECTO: Usuario verificado correctamente`);
        } else {
          console.log(`   ⏳ PENDIENTE: Usuario esperando verificación`);
        }
      });
    }
    
    // Verificar lógica de comparación
    console.log('\n3️⃣ === PRUEBA DE LÓGICA DE COMPARACIÓN ===');
    
    const testValues = [0, 1, '0', '1', true, false, null, undefined];
    
    testValues.forEach(value => {
      const isVerified = Boolean(value);
      const notVerified = !value;
      const strictNotVerified = value !== 1 && value !== true;
      
      console.log(`\n🔍 Valor: ${value} (tipo: ${typeof value})`);
      console.log(`   - Boolean(value): ${isVerified}`);
      console.log(`   - !value: ${notVerified}`);
      console.log(`   - value !== 1 && value !== true: ${strictNotVerified}`);
      console.log(`   - value == 1: ${value == 1}`);
      console.log(`   - value == true: ${value == true}`);
    });
    
    // Verificar usuarios específicos
    console.log('\n4️⃣ === VERIFICACIÓN DE USUARIOS ESPECÍFICOS ===');
    
    const testEmails = ['lucia@example.com', 'kevin.zepeda4cm@gmail.com'];
    
    for (const email of testEmails) {
      const [userResults] = await connection.execute(
        'SELECT * FROM usuarios WHERE correo = ?',
        [email]
      );
      
      if (userResults.length > 0) {
        const user = userResults[0];
        console.log(`\n📧 Usuario: ${email}`);
        console.log(`   - ID: ${user.idUsuario}`);
        console.log(`   - Nombre: ${user.nombre}`);
        console.log(`   - emailVerificado: ${user.emailVerificado} (tipo: ${typeof user.emailVerificado})`);
        
        // Probar diferentes formas de verificar
        const method1 = Boolean(user.emailVerificado);
        const method2 = user.emailVerificado == 1;
        const method3 = user.emailVerificado === 1;
        const method4 = user.emailVerificado === true;
        
        console.log(`   - Boolean(): ${method1}`);
        console.log(`   - == 1: ${method2}`);
        console.log(`   - === 1: ${method3}`);
        console.log(`   - === true: ${method4}`);
        
        if (method1 && method2 && method3) {
          console.log(`   ✅ Usuario verificado correctamente`);
        } else {
          console.log(`   ❌ PROBLEMA: Inconsistencia en verificación`);
        }
      } else {
        console.log(`\n❌ Usuario no encontrado: ${email}`);
      }
    }
    
    console.log('\n🎯 === FIN DE VERIFICACIÓN ===');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar la verificación
checkEmailVerification();
