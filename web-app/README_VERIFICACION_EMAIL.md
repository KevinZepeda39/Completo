# Sistema de Verificación de Correo Electrónico - MiCiudadSV

## 🚀 Características Implementadas

- ✅ **Verificación de correo al registrarse**: Los usuarios deben verificar su correo antes de poder iniciar sesión
- ✅ **Código de verificación de 6 dígitos**: Se envía por correo electrónico
- ✅ **Expiración automática**: Los códigos expiran en 15 minutos por seguridad
- ✅ **Reenvío de códigos**: Los usuarios pueden solicitar nuevos códigos
- ✅ **Recuperación de contraseña**: Sistema completo con verificación de correo
- ✅ **Interfaz moderna y responsiva**: Diseño atractivo con Bootstrap y FontAwesome
- ✅ **Validaciones de seguridad**: Múltiples capas de seguridad implementadas

## 📧 Configuración del Correo Electrónico

### 1. Configurar Gmail (Recomendado)

1. **Habilitar verificación en dos pasos** en tu cuenta de Gmail
2. **Generar contraseña de aplicación**:
   - Ve a [Configuración de seguridad de Google](https://myaccount.google.com/security)
   - Busca "Contraseñas de aplicación"
   - Genera una nueva contraseña para "Correo"
3. **Usar la contraseña generada** en tu archivo `.env`

### 2. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con:

```env
# Configuración de Correo
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
SESSION_SECRET=tu-secreto-de-sesion-super-seguro
```

### 3. Otros Proveedores de Correo

Puedes cambiar el proveedor en `config/email.js`:

```javascript
const transporter = nodemailer.createTransporter({
  service: 'outlook', // o 'yahoo', 'hotmail', etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

## 🗄️ Estructura de la Base de Datos

La tabla `usuarios` debe tener estos campos adicionales:

```sql
ALTER TABLE usuarios ADD COLUMN emailVerificado TINYINT(1) DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN tokenVerificacion VARCHAR(255) DEFAULT NULL;
ALTER TABLE usuarios ADD COLUMN codigoVerificacion VARCHAR(6) DEFAULT NULL;
ALTER TABLE usuarios ADD COLUMN tokenExpiracion DATETIME DEFAULT NULL;
ALTER TABLE usuarios ADD COLUMN codigoExpiracion DATETIME DEFAULT NULL;
ALTER TABLE usuarios ADD COLUMN fechaVerificacion DATETIME DEFAULT NULL;
```

## 🔄 Flujo de Verificación

### 1. Registro de Usuario
1. Usuario se registra con nombre, correo y contraseña
2. Sistema genera código de verificación de 6 dígitos
3. Sistema envía correo con el código
4. Usuario es redirigido a la página de verificación

### 2. Verificación de Correo
1. Usuario ingresa el código de 6 dígitos
2. Sistema valida el código y marca el email como verificado
3. Usuario es redirigido al login con mensaje de éxito

### 3. Inicio de Sesión
1. Usuario intenta iniciar sesión
2. Sistema verifica que el email esté verificado
3. Si no está verificado, se muestra mensaje de error
4. Si está verificado, se procede con la autenticación normal

### 4. Recuperación de Contraseña
1. Usuario solicita recuperar contraseña
2. Sistema envía nuevo código de verificación
3. Usuario ingresa el código y nueva contraseña
4. Sistema actualiza la contraseña y limpia datos de verificación

## 🛡️ Características de Seguridad

- **Rate Limiting**: Límite de intentos de login y registro por IP
- **Expiración de códigos**: Los códigos expiran en 15 minutos
- **Tokens únicos**: Cada usuario tiene un token de verificación único
- **Validación de contraseñas**: Requisitos mínimos de seguridad
- **Limpieza de datos**: Los tokens y códigos se limpian después de su uso
- **Logs de actividad**: Registro de todas las acciones importantes

## 🎨 Personalización

### Cambiar Diseño de Correos
Edita las funciones en `config/email.js`:

```javascript
function enviarCorreoVerificacion(correo, nombre, codigoVerificacion) {
  // Personaliza el HTML del correo aquí
  const html = `
    <div style="...">
      <h1>¡Bienvenido a MiCiudadSV!</h1>
      <p>Tu código: <strong>${codigoVerificacion}</strong></p>
    </div>
  `;
  // ... resto del código
}
```

### Cambiar Tiempo de Expiración
Edita `utils/verification.js`:

```javascript
function generarFechaExpiracion() {
  const ahora = new Date();
  ahora.setMinutes(ahora.getMinutes() + 30); // Cambiar a 30 minutos
  return ahora;
}
```

## 🧪 Pruebas

### 1. Probar Registro
1. Ve a `/auth/registro`
2. Completa el formulario
3. Verifica que recibas el correo
4. Usa el código para verificar

### 2. Probar Login sin Verificación
1. Intenta iniciar sesión sin verificar el correo
2. Deberías ver el mensaje de error

### 3. Probar Verificación
1. Ve a la página de verificación
2. Ingresa el código de 6 dígitos
3. Verifica que seas redirigido al login

### 4. Probar Recuperación de Contraseña
1. Ve a `/auth/recuperar`
2. Ingresa tu correo
3. Verifica que recibas el correo de recuperación

## 🚨 Solución de Problemas

### Error: "Error enviando correo"
- Verifica las credenciales de Gmail
- Asegúrate de que la verificación en dos pasos esté habilitada
- Usa contraseña de aplicación, no tu contraseña normal

### Error: "Código expirado"
- Los códigos expiran en 15 minutos
- Usa el botón "Reenviar código" para obtener uno nuevo

### Error: "Token inválido"
- Los tokens se generan únicamente para cada registro
- Si el token expira, el usuario debe registrarse nuevamente

### No se reciben correos
- Revisa la carpeta de spam
- Verifica que el correo esté bien escrito
- Revisa los logs del servidor para errores

## 📱 Compatibilidad

- ✅ **Navegadores**: Chrome, Firefox, Safari, Edge
- ✅ **Dispositivos**: Desktop, Tablet, Mobile
- ✅ **Sistemas**: Windows, macOS, Linux
- ✅ **Node.js**: Versión 16.0.0 o superior

## 🔧 Mantenimiento

### Limpiar Códigos Expirados
Puedes crear un cron job para limpiar códigos expirados:

```sql
DELETE FROM usuarios 
WHERE codigoExpiracion < NOW() 
AND emailVerificado = 0;
```

### Monitoreo
Revisa los logs del servidor para:
- Correos enviados exitosamente
- Errores de envío
- Intentos de verificación fallidos
- Usuarios verificados

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs del servidor
2. Verifica la configuración de correo
3. Asegúrate de que la base de datos esté actualizada
4. Contacta al administrador del sistema

---

**¡El sistema de verificación de correo está listo para usar! 🎉**
