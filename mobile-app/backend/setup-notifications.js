// setup-notifications.js - Script para configurar sistema de notificaciones
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'miciudadsv',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function setupNotifications() {
  let connection;
  
  try {
    console.log('🔔 Configurando sistema de notificaciones...');
    
    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos');
    
    // Leer el script SQL
    const sqlPath = path.join(__dirname, 'create-device-tokens-table.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');
    
    // Dividir el script en comandos individuales
    const commands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 Ejecutando ${commands.length} comandos SQL...`);
    
    // Ejecutar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        try {
          await connection.execute(command);
          console.log(`✅ Comando ${i + 1} ejecutado`);
        } catch (error) {
          if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log(`⚠️ Tabla ya existe, saltando comando ${i + 1}`);
          } else {
            console.error(`❌ Error en comando ${i + 1}:`, error.message);
          }
        }
      }
    }
    
    // Verificar que las tablas se crearon correctamente
    const tables = await connection.execute(`
      SHOW TABLES LIKE 'device_tokens'
    `);
    
    if (tables[0].length > 0) {
      console.log('✅ Tabla device_tokens creada exitosamente');
    } else {
      console.log('❌ Error: Tabla device_tokens no se creó');
    }
    
    const historyTables = await connection.execute(`
      SHOW TABLES LIKE 'notification_history'
    `);
    
    if (historyTables[0].length > 0) {
      console.log('✅ Tabla notification_history creada exitosamente');
    } else {
      console.log('❌ Error: Tabla notification_history no se creó');
    }
    
    // Insertar datos de prueba (opcional)
    console.log('🧪 Insertando datos de prueba...');
    
    try {
      await connection.execute(`
        INSERT INTO device_tokens (userId, expoPushToken, deviceInfo, isActive)
        VALUES (1, 'ExponentPushToken[test-token-1]', '{"platform": "ios", "version": "15.0"}', TRUE)
        ON DUPLICATE KEY UPDATE deviceInfo = VALUES(deviceInfo)
      `);
      console.log('✅ Datos de prueba insertados');
    } catch (error) {
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        console.log('⚠️ Usuario 1 no existe, saltando datos de prueba');
      } else {
        console.log('⚠️ Error insertando datos de prueba:', error.message);
      }
    }
    
    console.log('🎉 Sistema de notificaciones configurado exitosamente!');
    
  } catch (error) {
    console.error('❌ Error configurando notificaciones:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔓 Conexión cerrada');
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupNotifications();
}

module.exports = { setupNotifications };
