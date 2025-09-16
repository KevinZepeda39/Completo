# 🚀 CONFIGURACIÓN RÁPIDA - DIRECTORIO COMPARTIDO

## ⚡ **PASOS RÁPIDOS (5 minutos)**

### **1. Detener servidor**
```bash
Ctrl+C
```

### **2. Ejecutar migración**
```bash
# Windows
scripts\migrate-images.bat

# PowerShell
powershell -ExecutionPolicy Bypass -File scripts\migrate-images.ps1
```

### **3. Reiniciar servidor**
```bash
node server.js
```

### **4. Verificar configuración**
```bash
node scripts\verify-shared-directory.js
```

## ✅ **¿QUÉ CAMBIÓ?**

- **Imágenes se guardan en**: `C:\ImagenesCompartidas\uploads\reportes\`
- **App móvil y web** comparten el mismo directorio
- **No más duplicación** de archivos
- **Sincronización automática** entre sistemas

## 🔧 **ARCHIVOS MODIFICADOS**

- ✅ `routes/reportes.js` - Multer configurado
- ✅ `server.js` - Middleware de imágenes
- ✅ Scripts de migración creados
- ✅ Documentación completa

## 📁 **ESTRUCTURA FINAL**

```
C:\ImagenesCompartidas\
└── uploads\
    └── reportes\
        ├── imagen1.jpg
        ├── imagen2.png
        └── ...
```

## 🎯 **RESULTADO**

- **Web** → **App Móvil**: ✅ Imágenes visibles
- **App Móvil** → **Web**: ✅ Imágenes visibles
- **Un solo directorio**: ✅ Sin duplicación
- **Sincronización**: ✅ Automática

## 📖 **DOCUMENTACIÓN COMPLETA**

Ver: `CONFIGURACION_DIRECTORIO_COMPARTIDO.md`
