// Script para actualizar la tabla comunidad
const { executeQuery } = require('../config/database');

async function updateComunidadTable() {
  try {
    console.log('🔧 Modificando tabla comunidad...');
    
    // Agregar el estado 'eliminada' al ENUM
    await executeQuery(`
      ALTER TABLE \`comunidad\` 
      MODIFY COLUMN \`estado\` ENUM('activa','suspendida','eliminada') NOT NULL DEFAULT 'activa'
    `);
    
    console.log('✅ Tabla comunidad modificada correctamente');
    console.log('📊 Estados disponibles: activa, suspendida, eliminada');
    
    // Verificar el cambio
    const result = await executeQuery('SHOW COLUMNS FROM `comunidad` WHERE Field = "estado"');
    console.log('🔍 Verificación del campo estado:');
    console.log('   Tipo:', result[0].Type);
    console.log('   Por defecto:', result[0].Default);
    
    console.log('\n🎉 ¡Migración completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error modificando tabla:', error.message);
    
    if (error.message.includes('Duplicate entry')) {
      console.log('ℹ️  El estado "eliminada" ya existe en la tabla');
    }
  }
  
  process.exit(0);
}

// Ejecutar la migración
updateComunidadTable();
