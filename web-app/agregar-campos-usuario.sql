-- Script para agregar campos faltantes a la tabla usuarios
-- Ejecutar este script en tu base de datos MySQL

USE miciudadsv;

-- Agregar campos faltantes a la tabla usuarios
ALTER TABLE usuarios 
ADD COLUMN telefono VARCHAR(20) NULL AFTER correo,
ADD COLUMN ubicacion VARCHAR(200) NULL AFTER telefono,
ADD COLUMN biografia TEXT NULL AFTER ubicacion;

-- Verificar que los campos se agregaron correctamente
DESCRIBE usuarios;

-- Actualizar algunos usuarios de ejemplo con datos de prueba
UPDATE usuarios 
SET telefono = '+503 1234-5678', 
    ubicacion = 'San Salvador, El Salvador', 
    biografia = 'Usuario activo de MiCiudadSV'
WHERE idUsuario = 1;

UPDATE usuarios 
SET telefono = '+503 9876-5432', 
    ubicacion = 'Santa Ana, El Salvador', 
    biografia = 'Miembro de la comunidad'
WHERE idUsuario = 3;

-- Mostrar la estructura actualizada
SELECT idUsuario, nombre, correo, telefono, ubicacion, biografia 
FROM usuarios 
LIMIT 5;
