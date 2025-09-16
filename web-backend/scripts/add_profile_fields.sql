-- Script para agregar campos del perfil a la tabla usuarios
-- Ejecutar este script si los campos no existen

-- Agregar campo teléfono
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS telefono VARCHAR(20) NULL COMMENT 'Número de teléfono del usuario';

-- Agregar campo ubicación
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS ubicacion VARCHAR(100) NULL COMMENT 'Ciudad o zona del usuario';

-- Agregar campo biografía
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS biografia TEXT NULL COMMENT 'Biografía o descripción personal del usuario';

-- Agregar campo fecha_actualizacion
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de última actualización del perfil';

-- Verificar que los campos se agregaron correctamente
DESCRIBE usuarios;

-- Mostrar algunos usuarios de ejemplo
SELECT idUsuario, nombre, correo, telefono, ubicacion, biografia, fecha_actualizacion 
FROM usuarios 
LIMIT 5;
