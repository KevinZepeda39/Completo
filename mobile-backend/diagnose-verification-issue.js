// diagnose-verification-issue.js - Diagnóstico avanzado del problema de verificación
const mysql = require('mysql2/promise');

// Configuración de la base de datos
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'miciudadsv'
};

// Función para conectar a la base de datos
async function connectToDatabase() {
  try {
    const connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Conexión a la base de datos establecida');
    return connection;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    throw error;
  }
}

// Función para verificar la estructura de la tabla usuarios
async function checkTableStructure(connection) {
  try {
    console.log('\n🔍 === VERIFICANDO ESTRUCTURA DE TABLA ===');
    
    const [rows] = await connection.execute('DESCRIBE usuarios');
    console.log('📋 Estructura de la tabla usuarios:');
    
    rows.forEach(row => {
      console.log(`   - ${row.Field}: ${row.Type} ${row.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${row.Default !== null ? `DEFAULT: ${row.Default}` : ''}`);
    });
    
    // Verificar si existe el campo emailVerificado
    const emailVerificadoField = rows.find(row => row.Field === 'emailVerificado');
    if (emailVerificadoField) {
      console.log('✅ Campo emailVerificado encontrado');
      console.log(`   Tipo: ${emailVerificadoField.Type}`);
      console.log(`   Permite NULL: ${emailVerificadoField.Null}`);
      console.log(`   Valor por defecto: ${emailVerificadoField.Default}`);
    } else {
      console.log('❌ Campo emailVerificado NO encontrado');
    }
    
  } catch (error) {
    console.error('❌ Error verificando estructura de tabla:', error.message);
  }
}

// Función para verificar usuarios con problemas de verificación
async function checkUsersWithVerificationIssues(connection) {
  try {
    console.log('\n👥 === VERIFICANDO USUARIOS CON PROBLEMAS ===');
    
    // Buscar usuarios que se han registrado recientemente
    const [recentUsers] = await connection.execute(`
      SELECT 
        idUsuario,
        nombre,
        correo,
        emailVerificado,
        codigoVerificacion,
        codigoExpiracion,
        fechaCreacion,
        activo
      FROM usuarios 
      WHERE fechaCreacion >= DATE_SUB(NOW(), INTERVAL 1 DAY)
      ORDER BY fechaCreacion DESC
    `);
    
    if (recentUsers.length === 0) {
      console.log('📅 No hay usuarios registrados en las últimas 24 horas');
      return;
    }
    
    console.log(`📅 Usuarios registrados en las últimas 24 horas: ${recentUsers.length}`);
    
    recentUsers.forEach((user, index) => {
      console.log(`\n👤 Usuario ${index + 1}:`);
      console.log(`   ID: ${user.idUsuario}`);
      console.log(`   Nombre: ${user.nombre}`);
      console.log(`   Email: ${user.correo}`);
      console.log(`   Email Verificado: ${user.emailVerificado} (tipo: ${typeof user.emailVerificado})`);
      console.log(`   Código Verificación: ${user.codigoVerificacion || 'NULL'}`);
      console.log(`   Código Expiración: ${user.codigoExpiracion || 'NULL'}`);
      console.log(`   Fecha Creación: ${user.fechaCreacion}`);
      console.log(`   Activo: ${user.activo}`);
      
      // Análisis del problema
      if (user.emailVerificado == 0 || user.emailVerificado == false || user.emailVerificado == null) {
        console.log('   ⚠️ PROBLEMA: emailVerificado indica que NO está verificado');
      } else {
        console.log('   ✅ emailVerificado indica que SÍ está verificado');
      }
      
      if (user.codigoVerificacion && user.codigoExpiracion) {
        const now = new Date();
        const expiration = new Date(user.codigoExpiracion);
        if (now > expiration) {
          console.log('   ⚠️ PROBLEMA: Código de verificación expirado');
        } else {
          console.log('   ✅ Código de verificación válido');
        }
      } else {
        console.log('   ℹ️ Sin código de verificación activo');
      }
    });
    
  } catch (error) {
    console.error('❌ Error verificando usuarios:', error.message);
  }
}

// Función para probar diferentes métodos de comparación
async function testComparisonMethods(connection) {
  try {
    console.log('\n🧪 === PROBANDO MÉTODOS DE COMPARACIÓN ===');
    
    // Obtener un usuario de ejemplo
    const [users] = await connection.execute(`
      SELECT idUsuario, nombre, correo, emailVerificado
      FROM usuarios 
      WHERE emailVerificado IS NOT NULL
      LIMIT 1
    `);
    
    if (users.length === 0) {
      console.log('❌ No hay usuarios para probar comparaciones');
      return;
    }
    
    const user = users[0];
    console.log(`👤 Usuario de prueba: ${user.nombre} (${user.correo})`);
    console.log(`📧 emailVerificado en BD: ${user.emailVerificado} (tipo: ${typeof user.emailVerificado})`);
    
    // Probar diferentes métodos de comparación
    console.log('\n🔍 Resultados de comparaciones:');
    console.log(`   emailVerificado == 1: ${user.emailVerificado == 1}`);
    console.log(`   emailVerificado == true: ${user.emailVerificado == true}`);
    console.log(`   emailVerificado == "1": ${user.emailVerificado == "1"}`);
    console.log(`   emailVerificado === 1: ${user.emailVerificado === 1}`);
    console.log(`   emailVerificado === true: ${user.emailVerificado === true}`);
    console.log(`   emailVerificado === "1": ${user.emailVerificado === "1"}`);
    console.log(`   Boolean(emailVerificado): ${Boolean(user.emailVerificado)}`);
    console.log(`   !!emailVerificado: ${!!user.emailVerificado}`);
    console.log(`   String(emailVerificado): "${String(user.emailVerificado)}"`);
    
    // Probar la función helper del servidor
    const isEmailVerified = (emailVerificado) => {
      if (emailVerificado === null || emailVerificado === undefined) {
        return false;
      }
      
      const value = String(emailVerificado).toLowerCase();
      const verifiedValues = ['1', 'true', 'yes', 'on'];
      
      return verifiedValues.includes(value) || Boolean(emailVerificado);
    };
    
    console.log(`\n🔧 Función helper isEmailVerified(): ${isEmailVerified(user.emailVerificado)}`);
    
  } catch (error) {
    console.error('❌ Error probando comparaciones:', error.message);
  }
}

// Función para simular el flujo de verificación
async function simulateVerificationFlow(connection) {
  try {
    console.log('\n🔄 === SIMULANDO FLUJO DE VERIFICACIÓN ===');
    
    // Buscar un usuario no verificado
    const [unverifiedUsers] = await connection.execute(`
      SELECT idUsuario, nombre, correo, emailVerificado, codigoVerificacion
      FROM usuarios 
      WHERE (emailVerificado = 0 OR emailVerificado = false OR emailVerificado IS NULL)
      AND codigoVerificacion IS NOT NULL
      LIMIT 1
    `);
    
    if (unverifiedUsers.length === 0) {
      console.log('❌ No hay usuarios no verificados con código activo');
      return;
    }
    
    const user = unverifiedUsers[0];
    console.log(`👤 Usuario no verificado: ${user.nombre} (${user.correo})`);
    console.log(`🔑 Código actual: ${user.codigoVerificacion}`);
    
    // Generar código de verificación
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + 10);
    
    // 🔥 CORREGIDO: Convertir a formato MySQL como lo hace el servidor
    const expirationMySQL = expiration.toISOString().slice(0, 19).replace('T', ' ');
    
    console.log(`   🔑 Nuevo código: ${verificationCode}`);
    console.log(`   ⏰ Expira en: ${expirationMySQL}`);
    
    // Actualizar usuario con nuevo código
    await connection.execute(`
      UPDATE usuarios 
      SET codigoVerificacion = ?, codigoExpiracion = ?
      WHERE idUsuario = ?
    `, [verificationCode, expirationMySQL, user.idUsuario]);
    
    // Verificar el cambio
    const [updatedUsers] = await connection.execute(`
      SELECT emailVerificado, codigoVerificacion
      FROM usuarios 
      WHERE idUsuario = ?
    `, [user.idUsuario]);
    
    if (updatedUsers.length > 0) {
      const updatedUser = updatedUsers[0];
      console.log(`\n🔍 Estado después de la actualización:`);
      console.log(`   emailVerificado: ${updatedUser.emailVerificado} (tipo: ${typeof updatedUser.emailVerificado})`);
      console.log(`   codigoVerificacion: ${updatedUser.codigoVerificacion}`);
      
      // Probar la función helper nuevamente
      const isEmailVerified = (emailVerificado) => {
        if (emailVerificado === null || emailVerificado === undefined) {
          return false;
        }
        
        const value = String(emailVerificado).toLowerCase();
        const verifiedValues = ['1', 'true', 'yes', 'on'];
        
        return verifiedValues.includes(value) || Boolean(emailVerificado);
      };
      
      console.log(`\n🔧 Función helper isEmailVerified() después de actualización: ${isEmailVerified(updatedUser.emailVerificado)}`);
    }
    
  } catch (error) {
    console.error('❌ Error simulando verificación:', error.message);
  }
}

// Función principal
async function diagnoseVerificationIssue() {
  let connection;
  
  try {
    console.log('🔍 === DIAGNÓSTICO DEL PROBLEMA DE VERIFICACIÓN ===');
    console.log('📅 Fecha y hora:', new Date().toLocaleString());
    
    // Conectar a la base de datos
    connection = await connectToDatabase();
    
    // Ejecutar diagnósticos
    await checkTableStructure(connection);
    await checkUsersWithVerificationIssues(connection);
    await testComparisonMethods(connection);
    await simulateVerificationFlow(connection);
    
    console.log('\n🏁 Diagnóstico completado');
    
  } catch (error) {
    console.error('💥 Error en el diagnóstico:', error.message);
  } finally {
    if (connection) {
      try {
        await connection.end();
        console.log('🔌 Conexión a la base de datos cerrada');
      } catch (error) {
        console.error('❌ Error cerrando conexión:', error.message);
      }
    }
  }
}

// Ejecutar el diagnóstico
console.log('🚀 Iniciando diagnóstico...');
diagnoseVerificationIssue().then(() => {
  console.log('\n✅ Diagnóstico completado exitosamente');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Diagnóstico falló:', error.message);
  process.exit(1);
});
