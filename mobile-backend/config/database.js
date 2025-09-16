// backend/config/database.js - Todo en un archivo con función execute ultra-simplificada
const mysql = require('mysql2/promise');

// Configuración de la base de datos (solo opciones válidas)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'miciudadsv',
  port: process.env.DB_PORT || 3306,
  connectionLimit: 10,
  charset: 'utf8mb4'
};

console.log('🔧 Configuración de Base de Datos:');
console.log(`📡 Host: ${dbConfig.host}:${dbConfig.port}`);
console.log(`🗃️ Database: ${dbConfig.database}`);
console.log(`👤 User: ${dbConfig.user}`);

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// 🔥 FUNCIÓN execute ULTRA-SIMPLIFICADA - MEJORADA
const execute = async (sql, params = []) => {
  let connection;
  try {
    console.log('🔍 EXECUTE ULTRA SIMPLE:');
    console.log('  SQL:', sql.substring(0, 150) + '...');
    console.log('  Params:', params);
    console.log('  Params count:', params.length);
    
    // Obtener conexión del pool
    connection = await pool.getConnection();
    console.log('🔗 Conexión obtenida del pool');
    
    // 🔥 SI NO HAY PARÁMETROS, USAR QUERY SIMPLE
    if (!params || params.length === 0) {
      console.log('🔧 Ejecutando query sin parámetros...');
      const [results] = await connection.query(sql);
      console.log('✅ Query sin parámetros ejecutada exitosamente');
      console.log('📊 Resultados:', Array.isArray(results) ? `${results.length} filas` : 'Resultado no array');
      return results;
    }
    
    // 🔥 SI HAY PARÁMETROS, INTENTAR PREPARED STATEMENT
    console.log('🔧 Ejecutando query con parámetros...');
    
    // Validar y limpiar parámetros
    const cleanParams = params.map((param, index) => {
      if (param === null || param === undefined) {
        console.log(`⚠️ Param ${index} es null/undefined`);
        return null;
      }
      
      // Mantener números como están
      if (typeof param === 'number' && !isNaN(param)) {
        console.log(`✅ Param ${index}: ${param} (number)`);
        return param;
      }
      
      // Mantener strings como están (NO convertir a números)
      if (typeof param === 'string') {
        console.log(`📝 Param ${index}: "${param}" (string)`);
        return param;
      }
      
      // Para otros tipos, convertirlos a string
      console.log(`🔄 Param ${index}: ${param} -> "${String(param)}" (converted to string)`);
      return String(param);
    });
    
    console.log('✅ Parámetros limpiados:', cleanParams);
    
    try {
      const [results] = await connection.execute(sql, cleanParams);
      console.log('✅ Query con parámetros ejecutada exitosamente');
      console.log('📊 Resultados:', Array.isArray(results) ? `${results.length} filas` : 'Resultado no array');
      return results;
    } catch (executeError) {
      console.error('❌ Error en prepared statement:', executeError.message);
      console.log('🔄 Intentando fallback con query normal...');
      
      // 🔥 FALLBACK: Construir query manualmente (solo para casos simples)
      let fallbackQuery = sql;
      let paramIndex = 0;
      
      fallbackQuery = sql.replace(/\?/g, () => {
        if (paramIndex < cleanParams.length) {
          const param = cleanParams[paramIndex++];
          if (typeof param === 'string') {
            return `'${param.replace(/'/g, "''")}'`; // Escapar comillas
          }
          return param;
        }
        return '?';
      });
      
      console.log('🔧 Fallback query:', fallbackQuery);
      
      const [fallbackResults] = await connection.query(fallbackQuery);
      console.log('✅ Fallback query ejecutada exitosamente');
      return fallbackResults;
    }
    
  } catch (error) {
    console.error('❌ Error general en execute:');
    console.error('  SQL:', sql);
    console.error('  Params:', params);
    console.error('  Error:', error.message);
    console.error('  Error code:', error.code);
    console.error('  Error sqlState:', error.sqlState);
    
    throw error;
  } finally {
    if (connection) {
      connection.release();
      console.log('🔓 Conexión liberada');
    }
  }
};

// 🔥 FUNCIÓN DE TESTING ESPECÍFICA
const testDatabaseQueries = async () => {
  try {
    console.log('\n🧪 === TESTING DATABASE QUERIES ===');
    
    // Test 1: Query sin parámetros
    console.log('🧪 Test 1: Query sin parámetros');
    const test1 = await execute('SELECT COUNT(*) as total FROM comentarios');
    console.log('✅ Test 1 exitoso:', test1[0].total, 'mensajes totales');
    
    // Test 2: Query con 1 parámetro número
    console.log('🧪 Test 2: Query con 1 parámetro');
    const test2 = await execute('SELECT COUNT(*) as total FROM comentarios WHERE idComunidad = ?', [58]);
    console.log('✅ Test 2 exitoso:', test2[0].total, 'mensajes en comunidad 58');
    
    // Test 3: Query con múltiples parámetros
    console.log('🧪 Test 3: Query con múltiples parámetros');
    const test3 = await execute('SELECT * FROM comentarios WHERE idComunidad = ? LIMIT ?', [58, 3]);
    console.log('✅ Test 3 exitoso:', test3.length, 'mensajes obtenidos');
    
    // Test 4: Query problemática simplificada
    console.log('🧪 Test 4: Query problemática');
    const test4 = await execute('SELECT idComentario, idUsuario FROM comentarios WHERE idComunidad = ? LIMIT ?', [58, 5]);
    console.log('✅ Test 4 exitoso:', test4.length, 'mensajes obtenidos');
    
    console.log('=== TODOS LOS TESTS EXITOSOS ===\n');
    
    return {
      allTestsPassed: true,
      totalMessages: test1[0].total,
      community58Messages: test2[0].total,
      sampleMessages: test3.length
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return {
      allTestsPassed: false,
      error: error.message
    };
  }
};

// Función para verificar la conexión
const checkConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conectado a la base de datos MySQL');
    
    // Probar consulta simple
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Consulta de prueba exitosa:', rows[0]);
    
    // Verificar que las tablas existen
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Tablas disponibles:');
    tables.forEach(table => {
      console.log(`   - ${Object.values(table)[0]}`);
    });
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    return false;
  }
};

// Función para asegurar que las columnas ubicacion y categoria existan
const ensureColumnsExist = async () => {
  try {
    console.log('🔍 Verificando columnas ubicacion y categoria...');
    
    // Verificar si existe la columna ubicacion
    const ubicacionExists = await execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'reportes' 
      AND COLUMN_NAME = 'ubicacion' 
      AND TABLE_SCHEMA = DATABASE()
    `);
    
    if (ubicacionExists.length === 0) {
      console.log('➕ Agregando columna ubicacion...');
      await execute(`
        ALTER TABLE reportes 
        ADD COLUMN ubicacion VARCHAR(255) AFTER descripcion
      `);
      console.log('✅ Columna ubicacion agregada');
    } else {
      console.log('✅ Columna ubicacion ya existe');
    }
    
    // Verificar si existe la columna categoria
    const categoriaExists = await execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'reportes' 
      AND COLUMN_NAME = 'categoria' 
      AND TABLE_SCHEMA = DATABASE()
    `);
    
    if (categoriaExists.length === 0) {
      console.log('➕ Agregando columna categoria...');
      await execute(`
        ALTER TABLE reportes 
        ADD COLUMN categoria ENUM('general', 'infraestructura', 'limpieza', 'seguridad', 'alumbrado', 'agua') DEFAULT 'general' AFTER ubicacion
      `);
      console.log('✅ Columna categoria agregada');
    } else {
      console.log('✅ Columna categoria ya existe');
    }
    
    // Verificar y agregar índices si no existen
    try {
      const categoriaIndex = await execute(`
        SELECT INDEX_NAME 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_NAME = 'reportes' 
        AND INDEX_NAME = 'idx_categoria' 
        AND TABLE_SCHEMA = DATABASE()
      `);
      
      if (categoriaIndex.length === 0) {
        await execute(`ALTER TABLE reportes ADD INDEX idx_categoria (categoria)`);
        console.log('✅ Índice idx_categoria creado');
      } else {
        console.log('✅ Índice idx_categoria ya existe');
      }
      
      const ubicacionIndex = await execute(`
        SELECT INDEX_NAME 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_NAME = 'reportes' 
        AND INDEX_NAME = 'idx_ubicacion' 
        AND TABLE_SCHEMA = DATABASE()
      `);
      
      if (ubicacionIndex.length === 0) {
        await execute(`ALTER TABLE reportes ADD INDEX idx_ubicacion (ubicacion)`);
        console.log('✅ Índice idx_ubicacion creado');
      } else {
        console.log('✅ Índice idx_ubicacion ya existe');
      }
      
    } catch (error) {
      console.log('ℹ️ Información sobre índices:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error verificando columnas:', error.message);
    // No lanzar error aquí, continuar con la inicialización
  }
};

// Función para verificar estructura de tablas existentes
const verifyTablesStructure = async () => {
  try {
    console.log('🔍 Verificando estructura de tablas existentes...');
    
    // Verificar tabla reportes
    const reportesColumns = await execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'reportes' 
      AND TABLE_SCHEMA = DATABASE()
      ORDER BY ORDINAL_POSITION
    `);
    
    if (reportesColumns.length > 0) {
      console.log('✅ Tabla "reportes" encontrada con columnas:');
      reportesColumns.forEach(col => {
        console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
      });
      
      // Verificar si las nuevas columnas existen
      await ensureColumnsExist();
    } else {
      console.log('⚠️ Tabla "reportes" no encontrada');
    }
    
    // Verificar tabla usuarios
    const usuariosColumns = await execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'usuarios' 
      AND TABLE_SCHEMA = DATABASE()
    `);
    
    if (usuariosColumns.length > 0) {
      console.log('✅ Tabla "usuarios" encontrada');
    } else {
      console.log('ℹ️ Tabla "usuarios" no encontrada (opcional)');
    }
    
    // Verificar tabla usuario_reporte
    const usuarioReporteColumns = await execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'usuario_reporte' 
      AND TABLE_SCHEMA = DATABASE()
    `);
    
    if (usuarioReporteColumns.length > 0) {
      console.log('✅ Tabla "usuario_reporte" encontrada');
    } else {
      console.log('ℹ️ Tabla "usuario_reporte" no encontrada (opcional)');
    }
    
    // Verificar tabla comentarios (para comunidades)
    const comentariosColumns = await execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'comentarios' 
      AND TABLE_SCHEMA = DATABASE()
    `);
    
    if (comentariosColumns.length > 0) {
      console.log('✅ Tabla "comentarios" encontrada');
    } else {
      console.log('ℹ️ Tabla "comentarios" no encontrada');
    }
    
    // Verificar tabla comunidad
    const comunidadColumns = await execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'comunidad' 
      AND TABLE_SCHEMA = DATABASE()
    `);
    
    if (comunidadColumns.length > 0) {
      console.log('✅ Tabla "comunidad" encontrada');
    } else {
      console.log('ℹ️ Tabla "comunidad" no encontrada');
    }
    
    console.log('✅ Verificación de estructura completada\n');
    
  } catch (error) {
    console.error('❌ Error verificando estructura de tablas:', error.message);
    // No lanzar error, continuar
  }
};

// Función helper para transacciones
const transaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Función principal de conexión
const connectDB = async () => {
  try {
    console.log('\n🔄 ===== INICIANDO CONEXIÓN A BASE DE DATOS =====');
    console.log('🔄 Iniciando conexión a la base de datos...');
    
    const isConnected = await checkConnection();
    
    if (isConnected) {
      console.log('✅ Base de datos MySQL conectada exitosamente');
      
      // Verificar estructura de tablas existentes
      await verifyTablesStructure();
      
      // 🔥 EJECUTAR TESTS DE LA FUNCIÓN execute
      console.log('\n🧪 === EJECUTANDO TESTS DE DATABASE ===');
      const testResults = await testDatabaseQueries();
      
      if (testResults.allTestsPassed) {
        console.log('🎉 ✅ Todos los tests de database pasaron exitosamente');
        console.log(`📊 Total mensajes en BD: ${testResults.totalMessages}`);
        console.log(`📊 Mensajes en comunidad 58: ${testResults.community58Messages}`);
      } else {
        console.log('⚠️ ❌ Algunos tests fallaron:', testResults.error);
      }
      
      console.log('🎉 ===== BASE DE DATOS LISTA =====\n');
      return true;
    } else {
      console.log('❌ No se pudo establecer conexión con la base de datos');
      throw new Error('Falló la conexión a la base de datos');
    }
  } catch (error) {
    console.error('❌ Error en connectDB:', error.message);
    
    // En modo desarrollo, continuar sin base de datos
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Modo desarrollo: continuando sin base de datos...');
      return false;
    } else {
      // En producción, terminar la aplicación
      console.log('❌ Modo producción: terminando aplicación por error de BD');
      process.exit(1);
    }
  }
};

// Función de cierre elegante
const closeConnection = async () => {
  try {
    console.log('\n🔄 Cerrando conexiones de base de datos...');
    await pool.end();
    console.log('✅ Conexiones cerradas correctamente');
  } catch (error) {
    console.error('❌ Error cerrando conexiones:', error.message);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeConnection();
  process.exit(0);
});

// Exportar la función connectDB como default export
module.exports = connectDB;

// También exportar las otras funciones
module.exports.pool = pool;
module.exports.execute = execute;
module.exports.transaction = transaction;
module.exports.checkConnection = checkConnection;
module.exports.closeConnection = closeConnection;
module.exports.testDatabaseQueries = testDatabaseQueries;