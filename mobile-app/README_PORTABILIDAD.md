# 📱 Guía de Portabilidad - MiCiudadSV

## 🚀 Cómo Mover el Proyecto a Otra Computadora

### ✅ Sistema de Detección Automática de IP Implementado

El proyecto ahora tiene **detección automática de IP** que funciona en cualquier red WiFi. No necesitas cambiar código manualmente.

### 🔧 Configuración Automática

1. **El sistema detecta automáticamente la IP del servidor**
2. **Prueba múltiples IPs comunes automáticamente**
3. **Guarda la IP funcionando en caché para mejor rendimiento**
4. **Funciona en cualquier red WiFi**

### 📋 Pasos para Mover el Proyecto

#### 1. Copiar el Proyecto
```bash
# Copia toda la carpeta del proyecto a la nueva computadora
cp -r MiCiudadSV-New /ruta/nueva/computadora/
```

#### 2. Instalar Dependencias
```bash
cd MiCiudadSV-New
npm install
```

#### 3. Configurar el Backend
```bash
cd backend
npm install
```

#### 4. Iniciar el Backend
```bash
# En la nueva computadora
cd backend
npm start
```

#### 5. Iniciar la App
```bash
# En la nueva computadora
npx expo start
```

### 🔍 Detección Automática de IP

El sistema probará automáticamente estas IPs:
- `192.168.1.13` (IP original)
- `192.168.1.100`, `192.168.1.101`, `192.168.1.102`
- `192.168.0.13`, `192.168.0.100`
- `10.0.2.2` (Emulador Android)
- `localhost`, `127.0.0.1`

### ⚙️ Configuración Manual (Opcional)

Si quieres cambiar la IP por defecto, edita:
```
config/serverConfig.js
```

Cambia la línea:
```javascript
DEFAULT_IP: '192.168.1.13', // Cambia por tu IP
```

### 🧪 Verificar que Funciona

1. **Abre la app**
2. **Ve a Perfil → Cambiar Contraseña**
3. **Debería conectarse automáticamente**
4. **Si no funciona, revisa que el backend esté corriendo**

### 🔧 Solución de Problemas

#### Error: "No se puede conectar al servidor"
1. Verifica que el backend esté corriendo en el puerto 3000
2. Verifica que estés en la misma red WiFi
3. Limpia el caché de IP:
   ```javascript
   // En la consola de la app
   import { clearIPCache } from './constants/networkConfig';
   clearIPCache();
   ```

#### Error: "IP no encontrada"
1. Verifica la IP de tu computadora:
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```
2. Agrega tu IP a `config/serverConfig.js` en `COMMON_IPS`

### 📱 Funcionalidades que Funcionan en Cualquier Computadora

- ✅ **Cambio de contraseña**
- ✅ **Edición de perfil**
- ✅ **Subida de foto de perfil**
- ✅ **Envío de emails**
- ✅ **Todas las funciones de la app**

### 🎯 Ventajas del Sistema

1. **Portabilidad total**: Funciona en cualquier red
2. **Detección automática**: No necesitas cambiar código
3. **Caché inteligente**: Mejor rendimiento
4. **Fallback robusto**: Siempre encuentra una IP funcionando
5. **Fácil debugging**: Logs detallados en consola

### 📞 Soporte

Si tienes problemas:
1. Revisa los logs en la consola
2. Verifica que el backend esté corriendo
3. Verifica la conectividad de red
4. Limpia el caché de IP si es necesario

¡El proyecto ahora es completamente portátil! 🚀
