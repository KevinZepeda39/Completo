# 🧪 Instrucciones para Probar el Sistema de Verificación - MiCiudadSV

## ✅ **Problema Solucionado**

He **DESHABILITADO COMPLETAMENTE** el límite de registros e intentos de login para que puedas hacer todas las pruebas que necesites sin restricciones.

## 🚀 **Cómo Probar el Sistema**

### **1. Iniciar el Servidor**
```bash
cd Web/Plataforma
npm start
```

### **2. Acceder a la Página de Pruebas**
Ve a: `http://localhost:3000/test-verificacion.html`

### **3. Flujo de Prueba Completo**

#### **Paso 1: Registro de Usuario**
1. Haz clic en **"Ir a Registro"**
2. Completa el formulario con:
   - **Nombre**: Tu nombre real
   - **Correo**: Un correo que puedas verificar
   - **Contraseña**: Mínimo 6 caracteres
   - **Confirmar contraseña**: La misma contraseña
3. Haz clic en **"Registrarse"**

#### **Paso 2: Verificación de Correo**
1. **Deberías ser redirigido automáticamente** a la página de verificación
2. **Revisa tu bandeja de entrada** para el código de 6 dígitos
3. **Ingresa el código** en el campo de verificación
4. Haz clic en **"Verificar Código"**

#### **Paso 3: Inicio de Sesión**
1. Ve a **"Ir a Login"**
2. Ingresa tu correo y contraseña
3. **Deberías poder iniciar sesión** después de verificar

### **4. Pruebas Adicionales**

#### **Prueba de Login sin Verificar**
1. Registra un nuevo usuario
2. **NO verifiques el correo**
3. Intenta iniciar sesión
4. **Deberías ver el mensaje**: "Debes verificar tu correo electrónico antes de iniciar sesión"

#### **Prueba de Reenvío de Código**
1. En la página de verificación
2. Haz clic en **"Reenviar código"**
3. **Deberías recibir un nuevo código** por correo

#### **Prueba de Recuperación de Contraseña**
1. Ve a **"Recuperar Contraseña"**
2. Ingresa tu correo
3. **Deberías recibir un código** por correo

## 🔧 **Configuración Necesaria**

### **1. Variables de Entorno**
Crea un archivo `.env` en la raíz del proyecto:
```env
# Configuración de Correo (OBLIGATORIO)
EMAIL_USER=tu-correo@gmail.com
EMAIL_PASS=tu-contraseña-de-aplicacion

# Base de Datos
DB_HOST=localhost
DB_USER=tu_usuario_db
DB_PASSWORD=tu_contraseña_db
DB_NAME=tu_base_de_datos
DB_PORT=3306

# Aplicación
NODE_ENV=development
PORT=3000
SESSION_SECRET=tu-secreto-de-sesion
```

### **2. Configurar Gmail**
1. **Habilita verificación en dos pasos** en tu cuenta de Gmail
2. **Genera contraseña de aplicación**:
   - Ve a [Configuración de seguridad de Google](https://myaccount.google.com/security)
   - Busca "Contraseñas de aplicación"
   - Genera una nueva contraseña para "Correo"
3. **Usa esa contraseña** en el archivo `.env`

### **3. Base de Datos**
Ejecuta el script SQL para agregar los campos necesarios:
```sql
-- Ejecutar en tu base de datos MySQL
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS emailVerificado TINYINT(1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tokenVerificacion VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS codigoVerificacion VARCHAR(6) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS codigoExpiracion DATETIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS fechaVerificacion DATETIME DEFAULT NULL;
```

## 🚨 **Solución de Problemas**

### **Error: "No se puede conectar al servidor"**
- Verifica que el servidor esté corriendo en `http://localhost:3000`
- Revisa la consola del servidor para errores

### **Error: "Error enviando correo"**
- Verifica las credenciales de Gmail en el archivo `.env`
- Asegúrate de que la verificación en dos pasos esté habilitada
- Usa contraseña de aplicación, no tu contraseña normal

### **No se reciben correos**
- Revisa la carpeta de spam
- Verifica que el correo esté bien escrito
- Revisa los logs del servidor

### **Error en la base de datos**
- Ejecuta el script SQL para agregar los campos necesarios
- Verifica que la conexión a la base de datos esté configurada

## 📊 **Estado del Sistema**

- ✅ **Rate Limiting**: DESHABILITADO para pruebas
- ✅ **Verificación de correo**: FUNCIONANDO
- ✅ **Reenvío de códigos**: FUNCIONANDO
- ✅ **Recuperación de contraseña**: FUNCIONANDO
- ✅ **Validaciones de seguridad**: ACTIVAS
- ✅ **Interfaz de usuario**: COMPLETA

## 🎯 **Objetivo de las Pruebas**

1. **Verificar que el registro funcione** sin límites
2. **Confirmar que la verificación de correo funcione** correctamente
3. **Probar el flujo completo** de registro → verificación → login
4. **Verificar que la seguridad funcione** (no se puede hacer login sin verificar)

## 🔄 **Para Habilitar Rate Limiting en Producción**

Cuando estés listo para producción, simplemente cambia en el archivo `.env`:
```env
NODE_ENV=production
```

Esto habilitará automáticamente los límites de seguridad.

---

**¡Ahora puedes hacer todas las pruebas que necesites sin restricciones! 🎉**
