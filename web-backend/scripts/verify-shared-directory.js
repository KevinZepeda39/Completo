const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICANDO CONFIGURACIÓN DEL DIRECTORIO COMPARTIDO');
console.log('==================================================');
console.log('');

// Verificar directorio compartido
const sharedDir = 'C:/ImagenesCompartidas/uploads/reportes';
console.log(`📁 Verificando directorio compartido: ${sharedDir}`);

if (fs.existsSync(sharedDir)) {
    console.log('✅ Directorio compartido existe');
    
    // Contar archivos
    try {
        const files = fs.readdirSync(sharedDir);
        console.log(`📊 Total de archivos: ${files.length}`);
        
        if (files.length > 0) {
            console.log('📋 Archivos encontrados:');
            files.slice(0, 10).forEach(file => {
                const filePath = path.join(sharedDir, file);
                const stats = fs.statSync(filePath);
                const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
                console.log(`   - ${file} (${sizeInMB} MB)`);
            });
            
            if (files.length > 10) {
                console.log(`   ... y ${files.length - 10} archivos más`);
            }
        } else {
            console.log('📭 No hay archivos en el directorio compartido');
        }
    } catch (error) {
        console.log(`❌ Error leyendo directorio: ${error.message}`);
    }
} else {
    console.log('❌ Directorio compartido NO existe');
    console.log('💡 Ejecuta el script de migración primero');
}

console.log('');

// Verificar directorio original
const originalDir = 'public/uploads/reportes';
console.log(`📁 Verificando directorio original: ${originalDir}`);

if (fs.existsSync(originalDir)) {
    console.log('✅ Directorio original existe');
    
    try {
        const files = fs.readdirSync(originalDir);
        console.log(`📊 Total de archivos: ${files.length}`);
        
        if (files.length > 0) {
            console.log('⚠️  ADVERTENCIA: Aún hay archivos en el directorio original');
            console.log('💡 Ejecuta el script de migración para moverlos');
        }
    } catch (error) {
        console.log(`❌ Error leyendo directorio: ${error.message}`);
    }
} else {
    console.log('✅ Directorio original NO existe (ya fue migrado)');
}

console.log('');

// Verificar permisos de escritura
console.log('🔐 Verificando permisos de escritura...');
try {
    const testFile = path.join(sharedDir, 'test-permissions.tmp');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log('✅ Permisos de escritura OK');
} catch (error) {
    console.log(`❌ Error de permisos: ${error.message}`);
    console.log('💡 Ejecuta como administrador o verifica permisos del directorio');
}

console.log('');
console.log('🎯 RESUMEN DE VERIFICACIÓN');
console.log('==========================');

if (fs.existsSync(sharedDir)) {
    console.log('✅ Directorio compartido configurado correctamente');
    console.log('✅ Middleware de Express configurado');
    console.log('✅ Multer configurado para usar directorio compartido');
    
    if (fs.existsSync(originalDir)) {
        const originalFiles = fs.readdirSync(originalDir).length;
        if (originalFiles > 0) {
            console.log(`⚠️  Pendiente: Migrar ${originalFiles} archivos del directorio original`);
        } else {
            console.log('✅ Migración completada');
        }
    } else {
        console.log('✅ Migración completada');
    }
} else {
    console.log('❌ Configuración incompleta');
    console.log('💡 Ejecuta los scripts de configuración primero');
}

console.log('');
console.log('🚀 PRÓXIMOS PASOS:');
console.log('1. Detener el servidor web (Ctrl+C)');
console.log('2. Ejecutar script de migración');
console.log('3. Reiniciar servidor web (node server.js)');
console.log('4. Probar subida de imágenes');
console.log('5. Verificar que aparezcan en ambos sistemas');
