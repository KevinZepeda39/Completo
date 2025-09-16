const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para obtener conexión
async function getConnection() {
  try {
    return await pool.getConnection();
  } catch (error) {
    console.error('Error obteniendo conexión de la base de datos:', error);
    throw error;
  }
}

// Función para ejecutar queries
async function executeQuery(query, params = []) {
  try {
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error('❌ Error ejecutando query:', error);
    throw error;
  }
}

// Función para verificar conexión
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a la base de datos exitosa');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    return false;
  }
}

// Cerrar pool de conexiones
async function closePool() {
  try {
    await pool.end();
    console.log('🔌 Pool de conexiones cerrado');
  } catch (error) {
    console.error('Error cerrando pool:', error);
  }
}

// Exportar funciones
module.exports = {
  pool,
  getConnection,
  executeQuery,
  testConnection,
  closePool
};