-- Script para suspender una comunidad para pruebas
-- Ejecutar este script en tu base de datos MySQL

-- Opción 1: Suspender una comunidad específica por ID
UPDATE comunidad 
SET estado = 'suspendida' 
WHERE idComunidad = 71; -- Cambiar por el ID de la comunidad que quieres suspender

-- Opción 2: Suspender la primera comunidad que encuentre (para pruebas rápidas)
-- UPDATE comunidad 
-- SET estado = 'suspendida' 
-- WHERE idComunidad = (SELECT idComunidad FROM comunidad LIMIT 1);

-- Opción 3: Ver el estado actual de todas las comunidades
SELECT 
    idComunidad,
    titulo,
    estado,
    fechaCreacion
FROM comunidad 
ORDER BY fechaCreacion DESC;

-- Opción 4: Reactivar una comunidad suspendida
-- UPDATE comunidad 
-- SET estado = 'activa' 
-- WHERE idComunidad = 71;

-- Verificar el cambio
SELECT 
    idComunidad,
    titulo,
    estado,
    fechaCreacion
FROM comunidad 
WHERE idComunidad = 71;
