# MiCiudadSV - Proyecto Completo

## 📁 Estructura del Proyecto

```
MiCiudadSV-Complete/
├── mobile-app/          # App React Native (MiCiudadSV-New)
├── web-app/            # Aplicación Web (WebTwo)
├── mobile-backend/     # Backend para app móvil
├── web-backend/        # Backend para web
└── shared-images/      # Imágenes compartidas
```

## 🚀 Pasos para Organizar el Proyecto

### 1. Mover App Móvil
```bash
# Copiar desde: C:\Aplicación\Prueba21\MiCiudadSV-New
# Hacia: C:\MiCiudadSV-Complete\mobile-app\
```

### 2. Mover Web App
```bash
# Copiar desde: C:\WebTwo
# Hacia: C:\MiCiudadSV-Complete\web-app\
```

### 3. Mover Imágenes Compartidas
```bash
# Copiar desde: C:\ImagenesCompartidas
# Hacia: C:\MiCiudadSV-Complete\shared-images\
```

### 4. Organizar Backends
- **Mobile Backend**: Ya está en mobile-app/backend/
- **Web Backend**: Mover desde web-app/backend/ hacia web-backend/

## 🌐 URLs para Deploy

### Desarrollo Local
- **Mobile App**: http://localhost:19006
- **Web App**: http://localhost:3000
- **Mobile Backend**: http://localhost:3001
- **Web Backend**: http://localhost:3002

### Producción (Railway)
- **Mobile Backend**: https://miciudadsv-mobile-api.railway.app
- **Web Backend**: https://miciudadsv-web-api.railway.app
- **Web App**: https://miciudadsv-web.railway.app
- **Shared Images**: https://miciudadsv-images.railway.app

## 📱 Configuración de URLs

### En Mobile App (constants/networkConfig.js)
```javascript
const API_URL = 'https://miciudadsv-mobile-api.railway.app';
const SHARED_IMAGES_URL = 'https://miciudadsv-images.railway.app';
```

### En Web App
```javascript
const API_URL = 'https://miciudadsv-web-api.railway.app';
const SHARED_IMAGES_URL = 'https://miciudadsv-images.railway.app';
```

## 🔧 Comandos de Deploy

### Mobile Backend
```bash
cd mobile-backend
npm install
npm run build
railway deploy
```

### Web Backend
```bash
cd web-backend
npm install
npm run build
railway deploy
```

### Web App
```bash
cd web-app
npm install
npm run build
railway deploy
```

## ✅ **ESTADO ACTUAL - COMPLETADO**

### **📁 Estructura Final:**
```
C:\MiCiudadSV-Complete\
├── mobile-app\          ✅ App React Native completa
├── web-app\            ✅ Aplicación web completa
├── mobile-backend\     ✅ Backend de la app móvil
├── web-backend\        ✅ Backend de la web
├── shared-images\      ✅ Imágenes compartidas
└── README.md          ✅ Instrucciones
```

### **🎯 Archivos Organizados:**
- ✅ **Mobile App**: React Native con todos los componentes
- ✅ **Web App**: Aplicación web con frontend
- ✅ **Mobile Backend**: Servidor Node.js para app móvil
- ✅ **Web Backend**: Servidor Node.js para web
- ✅ **Shared Images**: Imágenes compartidas entre ambos
- ✅ **Archivos .env**: Configuración de entorno

## 📋 Checklist de Deploy

- [x] Mover todos los archivos a las carpetas correctas
- [x] Configurar variables de entorno
- [ ] Actualizar URLs en ambos proyectos
- [ ] Probar conexiones entre servicios
- [ ] Deploy en Railway
- [ ] Configurar dominios personalizados
- [ ] Probar en producción

## 🆘 Soporte

Si tienes problemas con el deploy, revisa:
1. Variables de entorno
2. URLs de conexión
3. Permisos de archivos
4. Logs de Railway
