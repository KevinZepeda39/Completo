-- Script para agregar el estado 'eliminada' a la tabla comunidad
-- Ejecutar este script en la base de datos

-- Modificar el ENUM para incluir 'eliminada'
ALTER TABLE `comunidad` 
MODIFY COLUMN `estado` ENUM('activa','suspendida','eliminada') NOT NULL DEFAULT 'activa';

-- Verificar el cambio
DESCRIBE `comunidad`;

-- Consulta para verificar que el cambio se aplicó correctamente
SHOW COLUMNS FROM `comunidad` WHERE Field = 'estado';
