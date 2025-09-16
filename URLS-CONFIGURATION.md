# 🌐 URLs Configuradas para Railway

## 📱 **App Móvil (React Native)**

### **Archivo:** `mobile-app/constants/networkConfig.js`
```javascript
// URLs configuradas:
PRODUCTION: 'https://miciudadsv-mobile-api.railway.app'
EMULATOR: 'http://10.0.2.2:3001'
LOCAL: 'http://[TU_IP]:3001' (se detecta automáticamente)
```

### **Archivo:** `mobile-app/constants/imagesConfig.js`
```javascript
// URLs de imágenes configuradas:
PRODUCTION: 'https://miciudadsv-images.railway.app/uploads'
LOCAL: 'http://localhost:3000/uploads'
```

## 🌐 **Web App**

### **Archivo:** `web-app/config/appConfig.js`
```javascript
// URLs configuradas:
API_URLS.PRODUCTION: 'https://miciudadsv-web-api.railway.app'
IMAGE_URLS.PRODUCTION: 'https://miciudadsv-images.railway.app/uploads'
```

### **Archivo:** `web-app/server.js`
```javascript
// CORS configurado para:
- http://localhost:3000
- http://localhost:3001
- https://miciudadsv-web.railway.app
- https://miciudadsv-mobile-api.railway.app
```

## 🔧 **Backends**

### **Mobile Backend**
- **Puerto:** 3001
- **URL Producción:** `https://miciudadsv-mobile-api.railway.app`
- **Archivo:** `mobile-backend/server.js`

### **Web Backend**
- **Puerto:** 3002
- **URL Producción:** `https://miciudadsv-web-api.railway.app`
- **Archivo:** `web-backend/server.js`

## 📋 **Variables de Entorno Configuradas**

### **Mobile Backend (.env)**
```env
NODE_ENV=production
PORT=3001
DB_HOST=[RAILWAY_DB_HOST]
DB_USER=[RAILWAY_DB_USER]
DB_PASSWORD=[RAILWAY_DB_PASSWORD]
DB_NAME=miciudadsv_mobile
JWT_SECRET=[TU_JWT_SECRET]
EMAIL_USER=[TU_EMAIL]
EMAIL_PASS=[TU_EMAIL_PASSWORD]
WEB_API_URL=https://miciudadsv-web-api.railway.app
SHARED_IMAGES_URL=https://miciudadsv-images.railway.app
```

### **Web Backend (.env)**
```env
NODE_ENV=production
PORT=3002
DB_HOST=[RAILWAY_DB_HOST]
DB_USER=[RAILWAY_DB_USER]
DB_PASSWORD=[RAILWAY_DB_PASSWORD]
DB_NAME=miciudadsv_web
JWT_SECRET=[TU_JWT_SECRET]
EMAIL_USER=[TU_EMAIL]
EMAIL_PASS=[TU_EMAIL_PASSWORD]
MOBILE_API_URL=https://miciudadsv-mobile-api.railway.app
SHARED_IMAGES_URL=https://miciudadsv-images.railway.app
```

### **Web App (.env)**
```env
NODE_ENV=production
PORT=3000
API_URL=https://miciudadsv-web-api.railway.app
MOBILE_API_URL=https://miciudadsv-mobile-api.railway.app
SHARED_IMAGES_URL=https://miciudadsv-images.railway.app
```

## 🚀 **URLs Finales de Producción**

Después del deploy en Railway tendrás:

1. **Mobile Backend API:** `https://miciudadsv-mobile-api.railway.app`
2. **Web Backend API:** `https://miciudadsv-web-api.railway.app`
3. **Web App Frontend:** `https://miciudadsv-web.railway.app`
4. **Shared Images:** `https://miciudadsv-images.railway.app`

## ✅ **Estado de Configuración**

- [x] URLs de producción configuradas
- [x] CORS configurado para todos los dominios
- [x] Variables de entorno preparadas
- [x] Scripts de deploy configurados
- [x] Archivos railway.json creados
- [x] Configuración de imágenes compartidas

## 🔄 **Próximos Pasos**

1. **Subir a GitHub** el proyecto completo
2. **Conectar Railway** con el repositorio
3. **Configurar variables** de entorno en Railway
4. **Deploy automático** de los 3 servicios
5. **Probar conexiones** entre servicios
6. **Configurar base de datos** en Railway

---

**¡Todas las URLs están configuradas y listas para Railway!** 🎉
