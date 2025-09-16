# 🔧 CONFIGURACIÓN DE LA PLATAFORMA WEB PARA DIRECTORIO COMPARTIDO

## 📋 **OBJETIVO**
Configurar la plataforma web para que use el mismo directorio de imágenes que la app móvil, permitiendo que las imágenes sean visibles en ambos sistemas.

## 📁 **DIRECTORIO COMPARTIDO**
```
C:\ImagenesCompartidas\uploads\reportes\
```

## 🔄 **PASOS PARA CONFIGURAR LA PLATAFORMA WEB**

### **1. Detener el servidor de la plataforma web**
```bash
# En la terminal de la plataforma web
Ctrl+C
```

### **2. ✅ CONFIGURACIÓN COMPLETADA**
Los siguientes archivos ya han sido modificados:

- **`routes/reportes.js`**: Configuración de multer actualizada para usar directorio compartido
- **`server.js`**: Middleware para servir imágenes desde directorio compartido
- **`scripts/migrate-images.bat`**: Script de migración para Windows
- **`scripts/migrate-images.ps1`**: Script de migración para PowerShell

### **3. Ejecutar la migración de imágenes existentes**
```bash
# Opción 1: Script batch (Windows)
scripts\migrate-images.bat

# Opción 2: Script PowerShell
powershell -ExecutionPolicy Bypass -File scripts\migrate-images.ps1
```

### **4. Reiniciar el servidor de la plataforma web**
```bash
# En la terminal de la plataforma web
node server.js
```

## ✅ **VERIFICACIÓN**

### **1. Subir una imagen desde la plataforma web**
- Crear un reporte con imagen
- Verificar que se guarde en `C:\ImagenesCompartidas\uploads\reportes\`

### **2. Verificar en la app móvil**
- La imagen debería aparecer en la lista de reportes
- La imagen debería cargar en los detalles del reporte

### **3. Subir una imagen desde la app móvil**
- Crear un reporte con imagen desde la app
- Verificar que se guarde en `C:\ImagenesCompartidas\uploads\reportes\`

### **4. Verificar en la plataforma web**
- La imagen debería aparecer en la lista de reportes
- La imagen debería cargar en los detalles del reporte

## 🔍 **SOLUCIÓN DE PROBLEMAS**

### **Error: "ENOENT: no such file or directory"**
- Verificar que el directorio `C:\ImagenesCompartidas\uploads\reportes\` existe
- Ejecutar el script de migración: `migrate-images.bat` o `migrate-images.ps1`

### **Error: "EACCES: permission denied"**
- Verificar permisos de escritura en `C:\ImagenesCompartidas\`
- Ejecutar como administrador si es necesario

### **Imágenes no se muestran**
- Verificar que la ruta `/uploads` esté configurada correctamente
- Verificar que las imágenes existan en el directorio compartido
- Revisar los logs del servidor para errores

## 📝 **NOTAS IMPORTANTES**

1. **Ambos sistemas deben estar detenidos** antes de ejecutar la migración
2. **El directorio compartido debe tener permisos de escritura** para ambos sistemas
3. **Las rutas de imagen en la base de datos** seguirán siendo las mismas (`/uploads/reportes/filename`)
4. **Solo cambia la ubicación física** de los archivos, no la estructura de la base de datos

## 🎯 **RESULTADO FINAL**

Con esta configuración:
- ✅ **Imágenes subidas desde la web** aparecerán en la app móvil
- ✅ **Imágenes subidas desde la app** aparecerán en la web
- ✅ **Ambos sistemas comparten** el mismo directorio de imágenes
- ✅ **No hay duplicación** de archivos
- ✅ **Sincronización automática** entre ambos sistemas

## 🔧 **ARCHIVOS MODIFICADOS**

### **1. `routes/reportes.js`**
```javascript
// ✅ DIRECTORIO COMPARTIDO CON LA APP MÓVIL
const uploadDir = 'C:/ImagenesCompartidas/uploads/reportes/';
```

### **2. `server.js`**
```javascript
// ✅ SERVIR IMÁGENES DESDE DIRECTORIO COMPARTIDO
app.use('/uploads', express.static('C:/ImagenesCompartidas/uploads'));
```

### **3. Scripts de migración**
- `scripts/migrate-images.bat` - Para Windows
- `scripts/migrate-images.ps1` - Para PowerShell

## 🚀 **PRÓXIMOS PASOS**

1. **Ejecutar el script de migración** para mover imágenes existentes
2. **Reiniciar el servidor** de la plataforma web
3. **Probar la funcionalidad** subiendo imágenes desde ambos sistemas
4. **Verificar que las imágenes** se muestren correctamente en ambos sistemas
