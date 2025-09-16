const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'miciudadsv',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function checkMyPhoto() {
  let connection;
  
  try {
    console.log('🔧 Configuración de Base de Datos:');
    console.log('📡 Host: localhost:3306');
    console.log('🗃️ Database: miciudadsv');
    console.log('👤 User: root');
    console.log('🔍 Verificando mi foto de perfil...\n');

    // Crear conexión
    connection = await mysql.createConnection(dbConfig);
    console.log('🔗 Conexión establecida');

    // Buscar mi usuario específico
    const [rows] = await connection.execute(
      'SELECT idUsuario, nombre, correo, fotoPerfil FROM usuarios WHERE idUsuario = 161'
    );

    if (rows.length > 0) {
      const user = rows[0];
      console.log('👤 Mi usuario:');
      console.log(`   ID: ${user.idUsuario}`);
      console.log(`   Nombre: ${user.nombre}`);
      console.log(`   Correo: ${user.correo}`);
      console.log(`   Foto: ${user.fotoPerfil}`);
      
      if (user.fotoPerfil) {
        console.log('✅ SÍ tengo foto de perfil');
        console.log(`📸 URL completa: ${user.fotoPerfil}`);
      } else {
        console.log('❌ NO tengo foto de perfil');
      }
    } else {
      console.log('❌ Usuario no encontrado');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔓 Conexión cerrada');
    }
  }
}

checkMyPhoto();

