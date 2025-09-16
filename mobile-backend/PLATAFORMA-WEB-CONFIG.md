# 🔧 CONFIGURACIÓN DE LA PLATAFORMA WEB PARA DIRECTORIO COMPARTIDO
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

### **2. Editar el archivo de configuración de multer**
Buscar en `C:\WebTwo\Web\Plataforma\routes\reportes.js` (o archivo similar) la configuración de multer:

**ANTES:**
```javascript
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/uploads/reportes/';
    // ... resto del código
    cb(null, uploadDir);
  },
  // ... resto de la configuración
});
```

**DESPUÉS:**
```javascript
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // ✅ DIRECTORIO COMPARTIDO CON LA APP MÓVIL
    const uploadDir = 'C:/ImagenesCompartidas/uploads/reportes/';
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)){
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  // ... resto de la configuración
});
```

### **3. Actualizar la ruta para servir imágenes**
Buscar la ruta que sirve las imágenes (probablemente en `app.js` o `server.js`):

**ANTES:**
```javascript
app.use('/uploads', express.static('public/uploads'));
```

**DESPUÉS:**
```javascript
// ✅ SERVIR IMÁGENES DESDE DIRECTORIO COMPARTIDO
app.use('/uploads', express.static('C:/ImagenesCompartidas/uploads'));
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
- Ejecutar el script de migración: `migrate-images.bat`

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
