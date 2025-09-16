# 📧 Configuración de Correo Electrónico - MiCiudadSV

## ⚠️ **PROBLEMA ACTUAL**

El sistema está funcionando correctamente, pero **NO PUEDE ENVIAR CORREOS** porque no están configuradas las credenciales de Gmail.

## 🔧 **SOLUCIÓN PASO A PASO**

### **Paso 1: Crear archivo .env**
En la carpeta `Web/Plataforma`, crea un archivo llamado `.env` con este contenido:

```env
# CORREO ELECTRÓNICO (OBLIGATORIO)
EMAIL_USER=tu-correo@gmail.com
EMAIL_PASS=tu-contraseña-de-aplicacion

# BASE DE DATOS
DB_HOST=localhost
DB_USER=tu_usuario_db
DB_PASSWORD=tu_contraseña_db
DB_NAME=tu_base_de_datos
DB_PORT=3306

# APLICACIÓN
NODE_ENV=development
PORT=3000
SESSION_SECRET=tu-secreto-de-sesion
```

### **Paso 2: Configurar Gmail**
1. **Ve a**: https://myaccount.google.com/security
2. **Habilita "Verificación en dos pasos"**
3. **Busca "Contraseñas de aplicación"**
4. **Genera una nueva contraseña** para "Correo"
5. **Copia esa contraseña** y pégala en `EMAIL_PASS`

### **Paso 3: Reiniciar el servidor**
```bash
# Detén el servidor (Ctrl+C)
# Luego inicia de nuevo:
npm run dev
```

## 🎯 **FLUJO COMPLETO DESPUÉS DE CONFIGURAR**

1. **Usuario se registra** → ✅ Funciona
2. **Se envía código por correo** → ✅ Funcionará después de configurar
3. **Usuario va a verificación** → ✅ Funciona
4. **Usuario ingresa código** → ✅ Funciona
5. **Usuario es redirigido a login** → ✅ Funciona
6. **Usuario inicia sesión** → ✅ Funciona
7. **Usuario va al dashboard** → ✅ Funciona

## 🚨 **ERRORES COMUNES**

### **Error: "Invalid login: Username and Password not accepted"**
- **Causa**: Credenciales de Gmail incorrectas
- **Solución**: Usa contraseña de aplicación, no tu contraseña normal

### **Error: "Less secure app access"**
- **Causa**: Gmail bloquea aplicaciones menos seguras
- **Solución**: Habilita verificación en dos pasos y usa contraseña de aplicación

### **No se reciben correos**
- **Causa**: Configuración incorrecta o correo en spam
- **Solución**: Verifica las credenciales y revisa la carpeta de spam

## 📊 **ESTADO ACTUAL**

- ✅ **Rate Limiting**: DESHABILITADO
- ✅ **Registro**: FUNCIONANDO
- ✅ **Base de datos**: FUNCIONANDO
- ❌ **Envío de correos**: NO FUNCIONA (falta configuración)
- ✅ **Verificación**: FUNCIONANDO (cuando se recibe el código)
- ✅ **Login**: FUNCIONANDO
- ✅ **Dashboard**: FUNCIONANDO

## 🎉 **DESPUÉS DE CONFIGURAR EL CORREO**

**¡Todo funcionará perfectamente!** El flujo será:
1. Registro → 2. Código por correo → 3. Verificación → 4. Login → 5. Dashboard
