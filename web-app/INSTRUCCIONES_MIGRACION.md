# 🔧 Instrucciones de Migración para Comunidades Admin

## Problema Identificado
El sistema de administrador de comunidades necesita que la tabla `comunidad` incluya el estado `eliminada` en su ENUM.

## Solución

### Opción 1: Ejecutar script automático
```bash
cd Plataforma
node scripts/update_comunidad_table.js
```

### Opción 2: Ejecutar SQL manualmente
```sql
-- Conectarse a la base de datos y ejecutar:
ALTER TABLE `comunidad` 
MODIFY COLUMN `estado` ENUM('activa','suspendida','eliminada') NOT NULL DEFAULT 'activa';
```

### Opción 3: Ejecutar desde MySQL/phpMyAdmin
1. Abrir phpMyAdmin o MySQL Workbench
2. Seleccionar la base de datos
3. Ejecutar el comando SQL del Opción 2

## Verificación
Después de ejecutar la migración, verificar que la tabla tiene los 3 estados:
```sql
SHOW COLUMNS FROM `comunidad` WHERE Field = 'estado';
```

Deberías ver: `enum('activa','suspendida','eliminada')`

## ✅ Errores Corregidos

1. **❌ Error `r.activo`** ➜ ✅ **Removido filtro inexistente**
   - Archivo: `middleware/auth.js`
   - Cambio: Eliminada condición `AND r.activo = 1`

2. **❌ Error `fechaActualizacion`** ➜ ✅ **Removido campo inexistente**
   - Archivo: `routes/admin.js`
   - Cambio: Eliminado `fechaActualizacion = NOW()`

3. **❌ Error `usuario_rol` columnas** ➜ ✅ **Corregidas columnas**
   - Archivo: `middleware/admin.js`
   - Cambio: `rol_id` ➜ `idRol`, `usuario_id` ➜ `idUsuario`

4. **❌ Estado `eliminada` faltante** ➜ ✅ **Script de migración creado**
   - Archivos: `scripts/update_comunidad_table.js`, `scripts/fix_comunidad_table.sql`

## ⚠️ Importante
Ejecutar la migración de la base de datos ANTES de usar las funciones de administrador de comunidades.

## 🎯 Resultado Final
Una vez aplicada la migración, el panel de administrador podrá:
- ✅ Suspender comunidades (bloquea comentarios)
- ✅ Eliminar comunidades (las oculta del público)
- ✅ Restaurar comunidades eliminadas
- ✅ Ver estadísticas correctas en tiempo real
