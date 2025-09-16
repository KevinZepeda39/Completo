# 🔒 Funcionalidad de Comunidades Suspendidas

## 📋 Descripción

Esta funcionalidad permite a los administradores suspender comunidades, impidiendo que los usuarios envíen mensajes en ellas hasta que sean reactivadas.

## 🚀 Características Implementadas

### Backend
- ✅ **Validación de estado**: El servidor verifica el estado de la comunidad antes de permitir envío de mensajes
- ✅ **Bloqueo de mensajes**: Las comunidades suspendidas devuelven error 403 al intentar enviar mensajes
- ✅ **Mensajes de error claros**: Informa al usuario que la comunidad está suspendida

### Frontend
- ✅ **Indicador visual**: Muestra una advertencia cuando la comunidad está suspendida
- ✅ **Input deshabilitado**: El campo de mensaje se deshabilita para comunidades suspendidas
- ✅ **Manejo de errores**: Alertas específicas para diferentes tipos de errores
- ✅ **Botón de envío deshabilitado**: No permite enviar mensajes en comunidades suspendidas

## 🧪 Cómo Probar

### 1. Preparar el Entorno
```bash
# Navegar al directorio del backend
cd Prueba21/MiCiudadSV-New/backend

# Asegurarse de que el servidor esté corriendo
node server.js
```

### 2. Suspender una Comunidad
```bash
# Opción A: Usar el script de Node.js
node suspend-community.js suspend 71

# Opción B: Usar SQL directamente
mysql -u root -p miciudadsv < suspend-community-test.sql
```

### 3. Probar la Funcionalidad
```bash
# Ejecutar el script de prueba
node test-suspended-community.js
```

### 4. Probar desde la Aplicación Móvil
1. Abrir la aplicación
2. Ir a la comunidad suspendida
3. Intentar enviar un mensaje
4. Verificar que aparezca el indicador de comunidad suspendida

## 📁 Archivos Modificados

### Backend
- `server.js`: Validación de estado en endpoints de mensajes
- `communityQueries.sendMessage()`: Verificación de estado antes de enviar mensajes

### Frontend
- `CommunityDetailScreen.js`: UI para comunidades suspendidas
- `communityService.js`: Manejo de errores del backend

### Scripts de Prueba
- `test-suspended-community.js`: Prueba la validación del backend
- `suspend-community.js`: Gestiona estados de comunidades
- `suspend-community-test.sql`: Scripts SQL para pruebas

## 🔧 Comandos Útiles

### Listar Comunidades
```bash
node suspend-community.js list
```

### Suspender Comunidad
```bash
node suspend-community.js suspend [ID_COMUNIDAD]
```

### Reactivar Comunidad
```bash
node suspend-community.js reactivate [ID_COMUNIDAD]
```

### Ver Estado Actual
```sql
SELECT idComunidad, titulo, estado FROM comunidad WHERE idComunidad = 71;
```

## 🎯 Casos de Uso

### Administrador
1. **Suspender comunidad problemática**: Cambiar estado a 'suspendida'
2. **Reactivar comunidad**: Cambiar estado a 'activa'
3. **Monitorear estados**: Ver qué comunidades están suspendidas

### Usuario
1. **Ver indicador**: Notar que la comunidad está suspendida
2. **No poder enviar mensajes**: Input deshabilitado
3. **Mensaje de error claro**: Entender por qué no puede enviar mensajes

## 🚨 Estados de Comunidad

- **`activa`**: Funcionamiento normal, se pueden enviar mensajes
- **`suspendida`**: No se pueden enviar mensajes, input deshabilitado
- **`null` o `undefined`**: Se trata como 'activa' por compatibilidad

## 🔍 Logs del Sistema

El sistema registra todas las acciones relacionadas con comunidades suspendidas:

```
🚫 Comunidad Salal está suspendida. No se pueden enviar mensajes.
🚫 Comunidad Salal tiene estado inválido: suspendida
```

## 🐛 Solución de Problemas

### Error 403 al Enviar Mensaje
- ✅ **Esperado**: La comunidad está suspendida
- ❌ **Inesperado**: Verificar que el estado en la BD sea 'suspendida'

### Input No Se Deshabilita
- Verificar que `community.estado === 'suspendida'`
- Revisar la consola del navegador para errores

### Mensaje de Error No Aparece
- Verificar que el backend devuelva el mensaje correcto
- Revisar el manejo de errores en `handleSendMessage`

## 📱 Compatibilidad

- ✅ **Android**: Funciona en todas las versiones
- ✅ **iOS**: Funciona en todas las versiones  
- ✅ **Redes**: Funciona en cualquier red o IP
- ✅ **Dispositivos**: Funciona en cualquier teléfono

## 🔮 Próximas Mejoras

- [ ] **Notificaciones push**: Alertar a usuarios cuando su comunidad sea suspendida
- [ ] **Historial de suspensiones**: Registrar quién y cuándo suspendió/reactivó
- [ ] **Suspensión temporal**: Establecer fechas de reactivación automática
- [ ] **Panel de moderación**: Interfaz para moderadores gestionar suspensiones

## 📞 Soporte

Si encuentras problemas:
1. Revisar logs del servidor
2. Verificar estado en la base de datos
3. Probar con los scripts de prueba
4. Verificar que el servidor esté corriendo
