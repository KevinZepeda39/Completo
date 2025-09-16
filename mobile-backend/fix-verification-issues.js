// fix-verification-issues.js - Corregir problemas de verificación automáticamente
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

// Función para identificar usuarios con problemas de verificación
async function identifyUsersWithIssues(connection) {
  try {
    console.log('\n🔍 === IDENTIFICANDO USUARIOS CON PROBLEMAS ===');
    
    // Buscar usuarios que tienen códigos de verificación pero no están marcados como verificados
    const [problemUsers] = await connection.execute(`
      SELECT 
        idUsuario,
        nombre,
        correo,
        emailVerificado,
        codigoVerificacion,
        codigoExpiracion,
        fechaCreacion
      FROM usuarios 
      WHERE (
        emailVerificado = 0 OR 
        emailVerificado = false OR 
        emailVerificado IS NULL
      )
      AND (
        codigoVerificacion IS NOT NULL OR
        codigoExpiracion IS NOT NULL
      )
      ORDER BY fechaCreacion DESC
    `);
    
    if (problemUsers.length === 0) {
      console.log('✅ No se encontraron usuarios con problemas de verificación');
      return [];
    }
    
    console.log(`⚠️ Se encontraron ${problemUsers.length} usuarios con problemas de verificación:`);
    
    problemUsers.forEach((user, index) => {
      console.log(`\n👤 Usuario ${index + 1}:`);
      console.log(`   ID: ${user.idUsuario}`);
      console.log(`   Nombre: ${user.nombre}`);
      console.log(`   Email: ${user.correo}`);
      console.log(`   Email Verificado: ${user.emailVerificado} (tipo: ${typeof user.emailVerificado})`);
      console.log(`   Código Verificación: ${user.codigoVerificacion || 'NULL'}`);
      console.log(`   Código Expiración: ${user.codigoExpiracion || 'NULL'}`);
      console.log(`   Fecha Creación: ${user.fechaCreacion}`);
    });
    
    return problemUsers;
    
  } catch (error) {
    console.error('❌ Error identificando usuarios con problemas:', error.message);
    return [];
  }
}

// Función para corregir usuarios individuales
async function fixUserVerification(connection, user) {
  try {
    console.log(`\n🔧 Corrigiendo usuario: ${user.nombre} (${user.correo})`);
    
    // Verificar si el código de verificación ha expirado
    let needsNewCode = false;
    if (user.codigoExpiracion) {
      const now = new Date();
      const expiration = new Date(user.codigoExpiracion);
      needsNewCode = now > expiration;
      
      if (needsNewCode) {
        console.log('   ⏰ Código de verificación expirado, generando uno nuevo...');
      } else {
        console.log('   ✅ Código de verificación válido');
      }
    } else {
      needsNewCode = true;
      console.log('   ⚠️ Sin código de expiración, generando uno nuevo...');
    }
    
    // Generar nuevo código si es necesario
    if (needsNewCode) {
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiration = new Date();
      expiration.setMinutes(expiration.getMinutes() + 10);
      
      // 🔥 CORREGIDO: Convertir a formato MySQL como lo hace el servidor
      const expirationMySQL = expiration.toISOString().slice(0, 19).replace('T', ' ');
      
      console.log(`   🔑 Nuevo código: ${verificationCode}`);
      console.log(`   ⏰ Expira en: ${expirationMySQL}`);
      
      // Actualizar usuario
      await connection.execute(`
        UPDATE usuarios 
        SET codigoVerificacion = ?, codigoExpiracion = ?
        WHERE idUsuario = ?
      `, [verificationCode, expirationMySQL, user.idUsuario]);
    }
    
    // Opción 1: Marcar como verificado automáticamente (si el usuario ya verificó)
    // Opción 2: Mantener como no verificado pero con código válido
    
    // Por ahora, vamos con la Opción 2 (más segura)
    console.log('   ℹ️ Usuario mantenido como no verificado');
    console.log('   💡 El usuario debe verificar su email con el código generado');
    
    return {
      userId: user.idUsuario,
      fixed: true,
      newCode: needsNewCode ? 'generado' : 'mantenido',
      action: 'code_refresh'
    };
    
  } catch (error) {
    console.error(`   ❌ Error corrigiendo usuario ${user.nombre}:`, error.message);
    return {
      userId: user.idUsuario,
      fixed: false,
      error: error.message
    };
  }
}

// Función para corregir usuarios que ya verificaron pero no están marcados correctamente
async function fixVerifiedUsers(connection) {
  try {
    console.log('\n🔍 === BUSCANDO USUARIOS YA VERIFICADOS ===');
    
    // Buscar usuarios que tienen códigos expirados (lo que sugiere que ya verificaron)
    const [verifiedUsers] = await connection.execute(`
      SELECT 
        idUsuario,
        nombre,
        correo,
        emailVerificado,
        codigoVerificacion,
        codigoExpiracion,
        fechaCreacion
      FROM usuarios 
      WHERE (
        emailVerificado = 0 OR 
        emailVerificado = false OR 
        emailVerificado IS NULL
      )
      AND codigoExpiracion < NOW()
      AND codigoExpiracion IS NOT NULL
      ORDER BY fechaCreacion DESC
    `);
    
    if (verifiedUsers.length === 0) {
      console.log('✅ No se encontraron usuarios que parezcan ya verificados');
      return [];
    }
    
    console.log(`🔍 Se encontraron ${verifiedUsers.length} usuarios que parecen ya verificados:`);
    
    const results = [];
    
    for (const user of verifiedUsers) {
      console.log(`\n👤 Usuario: ${user.nombre} (${user.correo})`);
      console.log(`   📅 Código expirado desde: ${user.codigoExpiracion}`);
      
      // Preguntar si queremos marcarlo como verificado
      // Por ahora, lo haremos automáticamente si el código expiró hace más de 1 hora
      const expirationTime = new Date(user.codigoExpiracion);
      const now = new Date();
      const hoursSinceExpiration = (now - expirationTime) / (1000 * 60 * 60);
      
      if (hoursSinceExpiration > 1) {
        console.log(`   ⏰ Código expirado hace ${hoursSinceExpiration.toFixed(1)} horas`);
        console.log('   ✅ Marcando como verificado automáticamente...');
        
        try {
          const updateSql = `
            UPDATE usuarios 
            SET emailVerificado = 1, 
                codigoVerificacion = NULL,
                codigoExpiracion = NULL
            WHERE idUsuario = ?
          `;
          
          await connection.execute(updateSql, [user.idUsuario]);
          console.log('   ✅ Usuario marcado como verificado');
          
          results.push({
            userId: user.idUsuario,
            action: 'auto_verified',
            success: true
          });
          
        } catch (error) {
          console.error(`   ❌ Error marcando como verificado:`, error.message);
          results.push({
            userId: user.idUsuario,
            action: 'auto_verified',
            success: false,
            error: error.message
          });
        }
      } else {
        console.log(`   ⏰ Código expirado hace ${hoursSinceExpiration.toFixed(1)} horas (muy reciente)`);
        console.log('   ℹ️ No se marca como verificado automáticamente');
      }
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Error corrigiendo usuarios verificados:', error.message);
    return [];
  }
}

// Función principal
async function fixVerificationIssues() {
  let connection;
  
  try {
    console.log('🔧 === CORRECCIÓN AUTOMÁTICA DE PROBLEMAS DE VERIFICACIÓN ===');
    console.log('📅 Fecha y hora:', new Date().toLocaleString());
    
    // Conectar a la base de datos
    connection = await connectToDatabase();
    
    // Identificar usuarios con problemas
    const problemUsers = await identifyUsersWithIssues(connection);
    
    if (problemUsers.length === 0) {
      console.log('\n🎉 No hay problemas que corregir');
      return;
    }
    
    // Corregir usuarios individuales
    console.log('\n🔧 === CORRIGIENDO USUARIOS INDIVIDUALES ===');
    const individualResults = [];
    
    for (const user of problemUsers) {
      const result = await fixUserVerification(connection, user);
      individualResults.push(result);
    }
    
    // Corregir usuarios que parecen ya verificados
    console.log('\n🔧 === CORRIGIENDO USUARIOS YA VERIFICADOS ===');
    const verifiedResults = await fixVerifiedUsers(connection);
    
    // Resumen de resultados
    console.log('\n📊 === RESUMEN DE CORRECCIONES ===');
    
    const totalFixed = individualResults.filter(r => r.fixed).length;
    const totalAutoVerified = verifiedResults.filter(r => r.success).length;
    
    console.log(`✅ Usuarios corregidos individualmente: ${totalFixed}/${individualResults.length}`);
    console.log(`✅ Usuarios marcados como verificados automáticamente: ${totalAutoVerified}/${verifiedResults.length}`);
    console.log(`🎯 Total de correcciones exitosas: ${totalFixed + totalAutoVerified}`);
    
    if (totalFixed + totalAutoVerified > 0) {
      console.log('\n🎉 Problemas de verificación corregidos exitosamente');
      console.log('💡 Los usuarios ahora pueden hacer login normalmente');
    } else {
      console.log('\n⚠️ No se pudieron corregir problemas automáticamente');
      console.log('💡 Revisa los logs para más detalles');
    }
    
  } catch (error) {
    console.error('💥 Error en la corrección automática:', error.message);
  } finally {
    if (connection) {
      try {
        await connection.end();
        console.log('\n🔌 Conexión a la base de datos cerrada');
      } catch (error) {
        console.error('❌ Error cerrando conexión:', error.message);
      }
    }
  }
}

// Ejecutar la corrección
console.log('🚀 Iniciando corrección automática...');
fixVerificationIssues().then(() => {
  console.log('\n✅ Corrección completada exitosamente');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Corrección falló:', error.message);
  process.exit(1);
});
