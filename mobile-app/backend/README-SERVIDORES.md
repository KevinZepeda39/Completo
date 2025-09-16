# 🚀 GUÍA PARA EJECUTAR AMBOS SERVIDORES SIMULTÁNEAMENTE

## 📋 **CONFIGURACIÓN DE PUERTOS**

### **📱 App Móvil (MiCiudadSV-New)**
- **Puerto:** 3000
- **URL:** http://localhost:3000
- **Directorio:** `Prueba21/MiCiudadSV-New/backend/`

### **🌐 Plataforma Web (Plataforma)**
- **Puerto:** 3001
- **URL:** http://localhost:3001
- **Directorio:** `C:\WebTwo\Web\Plataforma\`

## 🎯 **OPCIONES PARA INICIAR LOS SERVIDORES**

### **✅ OPCIÓN 1: Script Batch (Recomendado para Windows)**
```bash
# En el directorio del backend de la app móvil
start-servers.bat
```

### **✅ OPCIÓN 2: Script Node.js**
```bash
# En el directorio del backend de la app móvil
node start-both-servers.js
```

### **✅ OPCIÓN 3: Manual (En ventanas separadas)**
```bash
# Terminal 1 - App Móvil (Puerto 3000)
cd "Prueba21/MiCiudadSV-New/backend"
node server.js

# Terminal 2 - Plataforma Web (Puerto 3001)
cd "C:\WebTwo\Web\Plataforma"
node server.js
```

## 🔧 **VERIFICACIÓN DE FUNCIONAMIENTO**

### **📱 Verificar App Móvil (Puerto 3000)**
```bash
# Test de imágenes
node test-images.js

# Test de conectividad
curl http://localhost:3000/health
```

### **🌐 Verificar Plataforma Web (Puerto 3001)**
```bash
# Abrir en navegador
http://localhost:3001
```

## 📱 **CONFIGURACIÓN DE LA APP MÓVIL**

La app móvil ahora está configurada para usar el puerto 3000. Los siguientes archivos han sido actualizados:

- ✅ `backend/server.js` - Puerto 3000
- ✅ `services/ipDetector.js` - IPs con puerto 3000
- ✅ `backend/test-images.js` - Tests en puerto 3000

## 🌐 **ENDPOINTS DISPONIBLES**

### **App Móvil (Puerto 3000)**
- `GET /health` - Health check
- `GET /api/reports` - Lista de reportes
- `GET /uploads/reportes/:filename` - Imágenes de reportes
- `POST /api/reports/upload` - Subir reportes con imágenes

### **Plataforma Web (Puerto 3001)**
- `GET /` - Página principal
- `GET /reportes` - Lista de reportes
- `GET /auth/login` - Login
- `GET /comunidades` - Comunidades

## 🛑 **DETENER LOS SERVIDORES**

### **Script Batch/Node.js**
- Presiona `Ctrl+C` en la ventana principal

### **Manual**
- Presiona `Ctrl+C` en cada terminal
- O cierra las ventanas de terminal

## 🔍 **SOLUCIÓN DE PROBLEMAS**

### **Puerto ya en uso**
```bash
# Verificar qué está usando el puerto
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Terminar proceso si es necesario
taskkill /PID [PID] /F
```

### **Error de conexión**
- Verificar que ambos servidores estén ejecutándose
- Verificar que los puertos estén libres
- Verificar firewall de Windows

### **Imágenes no se cargan**
- Verificar que el servidor de la app móvil esté en puerto 3001
- Verificar que las imágenes existan en `uploads/reportes/`
- Usar `node test-images.js` para diagnosticar

## 📝 **NOTAS IMPORTANTES**

1. **La app móvil ahora usa el puerto 3001**
2. **La plataforma web mantiene el puerto 3000**
3. **Ambos servidores pueden ejecutarse simultáneamente**
4. **Las imágenes se sirven desde el puerto 3001**
5. **La app móvil detecta automáticamente el puerto correcto**

## 🎉 **RESULTADO FINAL**

Con esta configuración tendrás:
- ✅ **App móvil funcionando** en puerto 3001 con imágenes
- ✅ **Plataforma web funcionando** en puerto 3000
- ✅ **Ambos sistemas operando** simultáneamente
- ✅ **Sin conflictos de puertos**
- ✅ **Imágenes accesibles** desde la app móvil
