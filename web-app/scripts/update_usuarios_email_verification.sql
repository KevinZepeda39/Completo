-- Script para actualizar la tabla usuarios con campos de verificación de correo
-- Ejecutar este script en tu base de datos MySQL

USE tu_base_de_datos; -- Cambia esto por el nombre de tu base de datos

-- Agregar campos para verificación de correo
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS emailVerificado TINYINT(1) DEFAULT 0 COMMENT 'Indica si el email ha sido verificado',
ADD COLUMN IF NOT EXISTS tokenVerificacion VARCHAR(255) DEFAULT NULL COMMENT 'Token único para verificación',
ADD COLUMN IF NOT EXISTS codigoVerificacion VARCHAR(6) DEFAULT NULL COMMENT 'Código de 6 dígitos para verificación',
ADD COLUMN IF NOT EXISTS tokenExpiracion DATETIME DEFAULT NULL COMMENT 'Fecha de expiración del token',
ADD COLUMN IF NOT EXISTS codigoExpiracion DATETIME DEFAULT NULL COMMENT 'Fecha de expiración del código',
ADD COLUMN IF NOT EXISTS fechaVerificacion DATETIME DEFAULT NULL COMMENT 'Fecha y hora cuando se verificó el email';

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_token_verificacion ON usuarios(tokenVerificacion);
CREATE INDEX IF NOT EXISTS idx_codigo_verificacion ON usuarios(codigoVerificacion);
CREATE INDEX IF NOT EXISTS idx_email_verificado ON usuarios(emailVerificado);

-- Verificar que los campos se agregaron correctamente
DESCRIBE usuarios;

-- Mostrar la estructura actualizada
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'usuarios'
ORDER BY ORDINAL_POSITION;
