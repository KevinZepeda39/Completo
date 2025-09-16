# 🚀 Deploy en Railway - Guía Completa

## 📋 **Pasos para Deploy**

### **1. Crear Cuenta en Railway**
1. Ve a [railway.app](https://railway.app)
2. Haz clic en "Login"
3. Conecta con tu cuenta de GitHub

### **2. Crear Proyecto en Railway**
1. Haz clic en "New Project"
2. Selecciona "Deploy from GitHub repo"
3. Conecta tu repositorio de GitHub

### **3. Configurar Servicios**

#### **Mobile Backend:**
- **Nombre**: `miciudadsv-mobile-api`
- **Puerto**: `3001`
- **Comando**: `npm start`

#### **Web Backend:**
- **Nombre**: `miciudadsv-web-api`
- **Puerto**: `3002`
- **Comando**: `npm start`

#### **Web App:**
- **Nombre**: `miciudadsv-web`
- **Puerto**: `3000`
- **Comando**: `npm start`

### **4. Variables de Entorno**

#### **Para Mobile Backend:**
```env
NODE_ENV=production
PORT=3001
DB_HOST=tu-db-host
DB_USER=tu-db-user
DB_PASSWORD=tu-db-password
DB_NAME=miciudadsv_mobile
JWT_SECRET=tu-jwt-secret
EMAIL_USER=tu-email
EMAIL_PASS=tu-email-password
```

#### **Para Web Backend:**
```env
NODE_ENV=production
PORT=3002
DB_HOST=tu-db-host
DB_USER=tu-db-user
DB_PASSWORD=tu-db-password
DB_NAME=miciudadsv_web
JWT_SECRET=tu-jwt-secret
EMAIL_USER=tu-email
EMAIL_PASS=tu-email-password
```

#### **Para Web App:**
```env
NODE_ENV=production
PORT=3000
API_URL=https://miciudadsv-web-api.railway.app
```

### **5. URLs de Producción**

Después del deploy, tendrás estas URLs:
- **Mobile Backend**: `https://miciudadsv-mobile-api.railway.app`
- **Web Backend**: `https://miciudadsv-web-api.railway.app`
- **Web App**: `https://miciudadsv-web.railway.app`

### **6. Configurar Base de Datos**

1. En Railway, ve a "Add Service"
2. Selecciona "Database" → "PostgreSQL"
3. Configura las variables de entorno con los datos de la DB

### **7. Actualizar URLs en la App Móvil**

En `mobile-app/constants/networkConfig.js`:
```javascript
const API_URL = 'https://miciudadsv-mobile-api.railway.app';
const SHARED_IMAGES_URL = 'https://miciudadsv-images.railway.app';
```

## 🔧 **Comandos de Deploy**

### **Deploy Manual:**
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### **Deploy Automático:**
- Railway se conecta automáticamente a GitHub
- Cada push al repositorio hace deploy automático
- Configura webhooks para notificaciones

## 📱 **Configuración Final**

### **App Móvil:**
- Actualiza `networkConfig.js` con las URLs de producción
- Configura las variables de entorno
- Prueba la conexión

### **Web App:**
- Actualiza las URLs de API
- Configura las variables de entorno
- Prueba todas las funcionalidades

## 🆘 **Solución de Problemas**

### **Error de Puerto:**
- Verifica que el puerto esté configurado correctamente
- Railway asigna puertos automáticamente

### **Error de Base de Datos:**
- Verifica las variables de entorno
- Asegúrate de que la DB esté accesible

### **Error de Deploy:**
- Revisa los logs en Railway
- Verifica que todos los archivos estén en el repositorio

## ✅ **Checklist Final**

- [ ] Cuenta de Railway creada
- [ ] Repositorio en GitHub
- [ ] Servicios configurados en Railway
- [ ] Variables de entorno configuradas
- [ ] Base de datos conectada
- [ ] URLs actualizadas en la app móvil
- [ ] Deploy exitoso
- [ ] Pruebas en producción

---

**¡Tu proyecto estará en línea en minutos!** 🎉
