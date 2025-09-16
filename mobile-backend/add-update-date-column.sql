-- Script para agregar columna fechaActualizacion a la tabla comunidad
-- Ejecutar solo si la columna no existe

ALTER TABLE `comunidad` 
ADD COLUMN IF NOT EXISTS `fechaActualizacion` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Verificar que la columna se agregó correctamente
DESCRIBE `comunidad`;
