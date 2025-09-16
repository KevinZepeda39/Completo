-- Script para agregar restricciones CASCADE DELETE
-- Esto hará que cuando se elimine un usuario, se eliminen automáticamente:
-- 1. Todos sus reportes
-- 2. Todas las comunidades que creó
-- 3. Todas sus membresías en comunidades

-- ============================================================================
-- PASO 1: VERIFICAR ESTRUCTURA ACTUAL
-- ============================================================================

-- Verificar si ya existen las restricciones
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME,
    DELETE_RULE
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE REFERENCED_TABLE_NAME = 'usuarios' 
AND TABLE_SCHEMA = 'miciudadsv';

-- ============================================================================
-- PASO 2: AGREGAR RESTRICCIÓN PARA REPORTES
-- ============================================================================

-- Agregar restricción CASCADE DELETE para reportes
-- Esto hará que cuando se elimine un usuario, se eliminen todos sus reportes
ALTER TABLE reportes 
ADD CONSTRAINT fk_reportes_usuario_cascade 
FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) 
ON DELETE CASCADE;

-- ============================================================================
-- PASO 3: AGREGAR RESTRICCIÓN PARA COMUNIDADES
-- ============================================================================

-- Agregar restricción CASCADE DELETE para comunidades
-- Esto hará que cuando se elimine un usuario, se eliminen todas las comunidades que creó
ALTER TABLE comunidad 
ADD CONSTRAINT fk_comunidad_creador_cascade 
FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) 
ON DELETE CASCADE;

-- ============================================================================
-- PASO 4: AGREGAR RESTRICCIÓN PARA MEMBRESÍAS EN COMUNIDADES
-- ============================================================================

-- Agregar restricción CASCADE DELETE para usuario_comunidad
-- Esto hará que cuando se elimine un usuario, se eliminen todas sus membresías
ALTER TABLE usuario_comunidad 
ADD CONSTRAINT fk_usuario_comunidad_usuario_cascade 
FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) 
ON DELETE CASCADE;

-- ============================================================================
-- PASO 5: AGREGAR RESTRICCIÓN PARA COMENTARIOS EN COMUNIDADES
-- ============================================================================

-- Agregar restricción CASCADE DELETE para comentarios
-- Esto hará que cuando se elimine un usuario, se eliminen todos sus comentarios
ALTER TABLE comentarios 
ADD CONSTRAINT fk_comentarios_usuario_cascade 
FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) 
ON DELETE CASCADE;

-- ============================================================================
-- PASO 6: VERIFICAR QUE SE APLICARON LAS RESTRICCIONES
-- ============================================================================

-- Verificar que todas las restricciones se aplicaron correctamente
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME,
    DELETE_RULE
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE REFERENCED_TABLE_NAME = 'usuarios' 
AND TABLE_SCHEMA = 'miciudadsv'
ORDER BY TABLE_NAME;

-- ============================================================================
-- PASO 7: PROBAR LA FUNCIONALIDAD (OPCIONAL)
-- ============================================================================

-- NOTA: Solo ejecutar esto en un entorno de pruebas
-- Crear un usuario de prueba para verificar que funciona
-- INSERT INTO usuarios (nombre, correo, contraseña, emailVerificado, activo) 
-- VALUES ('Usuario Test', 'test@test.com', 'hash123', 1, 1);

-- Crear un reporte de prueba
-- INSERT INTO reportes (titulo, descripcion, idUsuario, categoria, estado) 
-- VALUES ('Reporte Test', 'Descripción test', LAST_INSERT_ID(), 'general', 'pendiente');

-- Crear una comunidad de prueba
-- INSERT INTO comunidad (titulo, descripcion, idUsuario, categoria) 
-- VALUES ('Comunidad Test', 'Descripción test', LAST_INSERT_ID(), 'general');

-- Ahora eliminar el usuario de prueba para verificar CASCADE DELETE
-- DELETE FROM usuarios WHERE correo = 'test@test.com';

-- Verificar que se eliminaron los datos relacionados
-- SELECT COUNT(*) as reportes_restantes FROM reportes WHERE titulo = 'Reporte Test';
-- SELECT COUNT(*) as comunidades_restantes FROM comunidad WHERE titulo = 'Comunidad Test';

-- ============================================================================
-- INFORMACIÓN IMPORTANTE
-- ============================================================================

/*
ESTE SCRIPT HACE LO SIGUIENTE:

✅ Cuando se elimine un usuario:
   - Se eliminan TODOS sus reportes automáticamente
   - Se eliminan TODAS las comunidades que creó automáticamente  
   - Se eliminan TODAS sus membresías en comunidades automáticamente
   - Se eliminan TODOS sus comentarios automáticamente

✅ Ventajas:
   - Automático y eficiente
   - No requiere código adicional
   - Mantiene la integridad de la base de datos

✅ Consideraciones:
   - Los datos se eliminan PERMANENTEMENTE
   - No hay posibilidad de recuperación
   - Afecta a todos los usuarios de las comunidades eliminadas

✅ Para usar en la app:
   - Solo necesitas eliminar el usuario: DELETE FROM usuarios WHERE idUsuario = ?
   - Todo lo demás se elimina automáticamente
   - La app del teléfono verá que los reportes y comunidades desaparecieron
*/
