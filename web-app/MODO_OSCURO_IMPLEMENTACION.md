# 🌙 IMPLEMENTACIÓN DEL MODO OSCURO

## 📋 Resumen
Este documento explica cómo implementar el modo oscuro en todas las vistas de la aplicación web, tanto en las vistas públicas como en las del panel de administración.

## 🚀 Archivos Creados

### 1. **`/public/css/themes.css`**
- Sistema de variables CSS para temas claro y oscuro
- Estilos adaptativos para todos los componentes
- Transiciones suaves entre temas

### 2. **`/public/js/theme-switcher.js`**
- Clase JavaScript para manejar el cambio de tema
- Detección automática de preferencia del sistema
- Persistencia del tema en localStorage
- Botón de cambio de tema automático

### 3. **`/views/layouts/base-admin.ejs`**
- Layout base para vistas de administración
- Incluye automáticamente el sistema de temas

## 🔧 Cómo Implementar en Vistas Existentes

### **Paso 1: Agregar CSS del Sistema de Temas**
```html
<!-- Agregar en el <head> de cada vista -->
<link href="/css/themes.css" rel="stylesheet">
```

### **Paso 2: Agregar JavaScript del Theme Switcher**
```html
<!-- Agregar antes del cierre de </body> -->
<script src="/js/theme-switcher.js"></script>
```

### **Paso 3: Agregar Botón de Cambio de Tema**
```html
<!-- Agregar en el header o navbar -->
<button type="button" class="btn btn-outline-secondary btn-sm theme-toggle-btn" id="theme-toggle" title="Cambiar tema">
    <i class="bi bi-moon-stars"></i>
</button>
```

### **Paso 4: Actualizar Estilos CSS**
Reemplazar colores hardcodeados por variables CSS:

```css
/* ANTES */
background-color: #ffffff;
color: #111827;
border: 1px solid #e5e7eb;

/* DESPUÉS */
background-color: var(--bg-card);
color: var(--text-primary);
border: 1px solid var(--border-primary);
```

## 🎨 Variables CSS Disponibles

### **Colores de Fondo**
- `--bg-primary`: Fondo principal
- `--bg-secondary`: Fondo secundario
- `--bg-tertiary`: Fondo terciario
- `--bg-card`: Fondo de tarjetas
- `--bg-sidebar`: Fondo del sidebar

### **Colores de Texto**
- `--text-primary`: Texto principal
- `--text-secondary`: Texto secundario
- `--text-muted`: Texto atenuado
- `--text-inverse`: Texto inverso (para fondos oscuros)

### **Colores de Bordes**
- `--border-primary`: Borde principal
- `--border-secondary`: Borde secundario
- `--border-accent`: Borde de acento

### **Colores de Acento**
- `--accent-primary`: Color primario
- `--accent-success`: Color de éxito
- `--accent-warning`: Color de advertencia
- `--accent-danger`: Color de peligro
- `--accent-info`: Color de información

### **Sombras**
- `--shadow-sm`: Sombra pequeña
- `--shadow-md`: Sombra media
- `--shadow-lg`: Sombra grande
- `--shadow-xl`: Sombra extra grande

## 📱 Vistas a Actualizar

### **Panel de Administración**
- [x] `admin/editar-reporte.ejs` ✅
- [ ] `admin/reportes.ejs`
- [ ] `admin/usuarios.ejs`
- [ ] `admin/comunidades.ejs`
- [ ] `admin/dashboard.ejs`
- [ ] `admin/logs.ejs`

### **Vistas Públicas**
- [ ] `index.ejs` (página principal)
- [ ] `reportar.ejs`
- [ ] `login.ejs`
- [ ] `registro.ejs`
- [ ] `perfil.ejs`

### **Vistas de Usuario**
- [ ] `usuario/dashboard.ejs`
- [ ] `usuario/mis-reportes.ejs`
- [ ] `usuario/perfil.ejs`

## 🎯 Ejemplo de Implementación Rápida

### **Para cualquier vista existente:**

1. **Agregar en `<head>`:**
```html
<link href="/css/themes.css" rel="stylesheet">
```

2. **Agregar antes de `</body>`:**
```html
<script src="/js/theme-switcher.js"></script>
```

3. **Agregar botón de tema:**
```html
<button type="button" class="btn btn-outline-secondary btn-sm theme-toggle-btn" id="theme-toggle" title="Cambiar tema">
    <i class="bi bi-moon-stars"></i>
</button>
```

4. **Reemplazar colores en CSS:**
```css
/* Cambiar esto: */
background: white;
color: #333;
border: 1px solid #ccc;

/* Por esto: */
background: var(--bg-card);
color: var(--text-primary);
border: 1px solid var(--border-primary);
```

## 🌟 Características del Sistema

### **Automático**
- Detecta preferencia del sistema operativo
- Se aplica automáticamente al cargar la página
- Persiste la elección del usuario

### **Inteligente**
- Botón de cambio de tema se posiciona automáticamente
- Iconos cambian según el tema (luna/sol)
- Notificaciones visuales del cambio

### **Responsivo**
- Funciona en todos los dispositivos
- Transiciones suaves entre temas
- Compatible con Bootstrap y componentes existentes

## 🔍 Verificación

Para verificar que funciona:

1. **Recargar la página** - El tema se aplica automáticamente
2. **Hacer clic en el botón de tema** - Cambia entre claro/oscuro
3. **Revisar localStorage** - El tema se guarda
4. **Cambiar tema del sistema** - Se detecta automáticamente (si no hay preferencia manual)

## 🚨 Notas Importantes

- **No eliminar** las clases CSS existentes de Bootstrap
- **Mantener** la estructura HTML existente
- **Usar** las variables CSS en lugar de colores hardcodeados
- **Probar** en diferentes navegadores y dispositivos

## 📞 Soporte

Si encuentras problemas:
1. Verificar que los archivos CSS y JS se cargan correctamente
2. Revisar la consola del navegador para errores
3. Verificar que el botón de tema tiene el ID correcto (`theme-toggle`)
4. Comprobar que las variables CSS se aplican correctamente

