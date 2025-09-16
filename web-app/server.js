const express = require('express');
const session = require('express-session');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
require('dotenv').config();

// Importar configuración de base de datos
const { testConnection } = require('./config/database');

// ============================================================================
// IMPORTAR TODOS LOS ROUTERS AQUÍ (ORGANIZADOS)
// ============================================================================
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const reportesRoutes = require('./routes/reportes');
const dashboardRoutes = require('./routes/dashboard');
const comunidadesRoutes = require('./routes/comunidades');
const adminRoutes = require('./routes/admin'); // ✅ ADMIN ROUTES ACTIVO

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001", 
      "https://miciudadsv-web.railway.app",
      "https://miciudadsv-mobile-api.railway.app"
    ],
    methods: ["GET", "POST"]
  }
});

// Seguridad básica con Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://cdnjs.cloudflare.com", 
        "https://cdn.jsdelivr.net",
        "https://unpkg.com"
      ],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://cdnjs.cloudflare.com", 
        "https://cdn.jsdelivr.net", 
        "https://code.jquery.com",
        "https://unpkg.com"
      ],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: [
        "'self'", 
        "https://cdnjs.cloudflare.com", 
        "https://cdn.jsdelivr.net"
      ],
      connectSrc: [
        "'self'", 
        "https://*.tile.openstreetmap.org",
        "wss://localhost:*",
        "ws://localhost:*"
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // límite de 1000 requests por IP en 15 minutos
  message: {
    error: 'Demasiadas solicitudes, intenta de nuevo más tarde.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware básico
app.use(globalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// ✅ SERVIR IMÁGENES DESDE DIRECTORIO COMPARTIDO
app.use('/uploads', express.static('C:/ImagenesCompartidas/uploads'));

// ✅ MIDDLEWARE ADICIONAL PARA SERVIR IMÁGENES DE MANERA MÁS DIRECTA
app.get('/uploads/reportes/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join('C:/ImagenesCompartidas/uploads/reportes', filename);
  
  console.log(`🖼️ Solicitando imagen: ${filename}`);
  console.log(`📁 Ruta completa: ${imagePath}`);
  
  // Verificar si el archivo existe
  if (fs.existsSync(imagePath)) {
    console.log(`✅ Imagen encontrada, enviando...`);
    res.sendFile(imagePath);
  } else {
    console.log(`❌ Imagen no encontrada: ${imagePath}`);
    res.status(404).send('Imagen no encontrada');
  }
});

// ✅ RUTA DE PRUEBA PARA VERIFICAR IMÁGENES
app.get('/test-images', (req, res) => {
  const sharedDir = 'C:/ImagenesCompartidas/uploads/reportes';
  
  try {
    if (fs.existsSync(sharedDir)) {
      const files = fs.readdirSync(sharedDir);
      const imageList = files.map(file => {
        const filePath = path.join(sharedDir, file);
        const stats = fs.statSync(filePath);
        return {
          nombre: file,
          ruta: `/uploads/reportes/${file}`,
          tamaño: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
          existe: true
        };
      });
      
      res.json({
        mensaje: '✅ Directorio compartido accesible',
        total: imageList.length,
        imagenes: imageList
      });
    } else {
      res.json({
        mensaje: '❌ Directorio compartido no encontrado',
        total: 0,
        imagenes: []
      });
    }
  } catch (error) {
    res.status(500).json({
      mensaje: '❌ Error accediendo al directorio',
      error: error.message
    });
  }
});

// ✅ RUTA DE PRUEBA PARA VERIFICAR UNA IMAGEN ESPECÍFICA
app.get('/test-image/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join('C:/ImagenesCompartidas/uploads/reportes', filename);
  
  console.log(`🧪 TEST: Verificando imagen: ${filename}`);
  console.log(`📁 Ruta completa: ${imagePath}`);
  
  if (fs.existsSync(imagePath)) {
    console.log(`✅ Imagen encontrada, enviando...`);
    res.sendFile(imagePath);
  } else {
    console.log(`❌ Imagen no encontrada: ${imagePath}`);
    res.status(404).json({
      error: 'Imagen no encontrada',
      filename: filename,
      path: imagePath,
      exists: false
    });
  }
});

// ✅ CONFIGURACIÓN DE SESIONES CORREGIDA
app.use(session({
  secret: process.env.SESSION_SECRET || 'tu_clave_secreta_super_segura_aqui_2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // ✅ FORZAR false para desarrollo local
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    sameSite: 'lax'
  },
  name: 'miciudadsv.sid',
  rolling: true, // ✅ AGREGADO - Renueva la cookie en cada request
  proxy: false   // ✅ AGREGADO - Para desarrollo local
}));

// Configurar EJS como motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ MIDDLEWARE DE DEBUG DE SESIONES MEJORADO
app.use((req, res, next) => {
  const sessionExists = !!req.session.usuario;
  
  // Debug completo de sesiones para rutas admin
  if (req.originalUrl.includes('/admin')) {
    console.log('🔍 === DEBUG SESIÓN ADMIN ===');
    console.log(`   - URL: ${req.method} ${req.originalUrl}`);
    console.log(`   - Session ID: ${req.sessionID}`);
    console.log(`   - Sesión existe: ${sessionExists}`);
    console.log(`   - Session object:`, req.session);
    
    if (sessionExists) {
      console.log(`   - Usuario: ${req.session.usuario.nombre} (ID: ${req.session.usuario.id})`);
      console.log(`   - Correo: ${req.session.usuario.correo || req.session.usuario.email}`);
      console.log(`   - Es Admin Hardcoded: ${req.session.usuario.esAdminHardcoded || false}`);
      console.log(`   - Objeto usuario completo:`, req.session.usuario);
    } else {
      console.log('   - ❌ NO HAY DATOS DE USUARIO EN LA SESIÓN');
    }
    console.log('🔍 === FIN DEBUG SESIÓN ===');
  }
  
  // Logs para debugging de reportes
  if (req.originalUrl.includes('/reportes')) {
    console.log(`🔍 [${req.method} ${req.originalUrl}] Verificando sesión...`);
    console.log(`   - Sesión existe: ${sessionExists}`);
    if (sessionExists) {
      console.log(`   - Usuario: ${req.session.usuario.nombre} (ID: ${req.session.usuario.id})`);
    }
  }
  
  res.locals.loggedIn = sessionExists;
  res.locals.usuario = req.session.usuario || null;
  
  // Hacer disponible la URL actual para navigation activa
  res.locals.currentUrl = req.originalUrl;
  
  // Timestamp para el cache busting
  res.locals.timestamp = Date.now();
  
  next();
});

// Middleware para hacer io disponible en req para todos los routers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware de logging personalizado
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;
  
  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);
  next();
});

// ============================================================================
// RUTAS PRINCIPALES (ORGANIZADAS Y ORDENADAS)
// ============================================================================

// Rutas básicas y autenticación
app.use('/', indexRoutes);              // Rutas principales (/, /informacion)
app.use('/auth', authRoutes);           // Rutas de autenticación (/auth/login, /auth/logout, etc.)

// ✅ RUTAS DE ADMINISTRACIÓN (PRIMERO PARA MAYOR PRIORIDAD)
app.use('/admin', adminRoutes);         // Rutas de admin (/admin/*)

// Rutas de funcionalidades principales
app.use('/reportes', reportesRoutes);   // Rutas de reportes (/reportes/*, /reportes/crear)
app.use('/comunidades', comunidadesRoutes); // Rutas de comunidades (/comunidades/*)
app.use('/dashboard', dashboardRoutes); // Rutas del dashboard (/dashboard/*)

// Ruta directa para reportar (redirecciona al router de reportes)
app.get('/reportar', (req, res) => {
  if (!req.session.usuario) {
    req.session.redirectTo = '/reportar';
    return res.redirect('/auth/login');
  }
  res.redirect('/reportes/crear');
});

// Ruta directa para perfil (redirecciona al dashboard)
app.get('/perfil', (req, res) => {
  if (!req.session.usuario) {
    req.session.redirectTo = '/perfil';
    return res.redirect('/auth/login');
  }
  res.redirect('/dashboard/perfil');
});

// ============================================================================
// WEBSOCKET PARA TIEMPO REAL
// ============================================================================

io.on('connection', (socket) => {
  console.log('🔌 Usuario conectado via WebSocket:', socket.id);
  
  // Unirse a sala según el rol del usuario
  socket.on('join-room', (roomName) => {
    socket.join(roomName);
    console.log(`📡 Usuario ${socket.id} se unió a la sala: ${roomName}`);
  });
  
  // Emitir notificación de nuevo reporte
  socket.on('nuevo-reporte', (data) => {
    console.log('📢 Nuevo reporte recibido via WebSocket:', data.titulo);
    io.to('admins').emit('notificacion-reporte', {
      mensaje: 'Nuevo reporte creado',
      reporte: data,
      timestamp: new Date()
    });
    
    // También emitir a todos los usuarios conectados
    io.emit('reporte-publico', {
      tipo: 'nuevo_reporte',
      titulo: data.titulo,
      urgente: data.urgente,
      timestamp: new Date()
    });
  });
  
  // Actualización de estado de reporte
  socket.on('reporte-actualizado', (data) => {
    console.log('🔄 Reporte actualizado via WebSocket:', data.reporteId);
    io.emit('reporte-estado-cambiado', data);
  });
  
  // Estadísticas en tiempo real (cada 30 segundos)
  const estadisticasInterval = setInterval(async () => {
    try {
      // Solo enviar estadísticas si hay funciones disponibles
      socket.emit('estadisticas-ping', {
        timestamp: new Date(),
        conectados: io.engine.clientsCount
      });
    } catch (error) {
      console.error('❌ Error enviando estadísticas WS:', error);
    }
  }, 30000);
  
  socket.on('disconnect', () => {
    console.log('🔌 Usuario desconectado via WebSocket:', socket.id);
    clearInterval(estadisticasInterval);
  });
  
  // Manejo de errores de WebSocket
  socket.on('error', (error) => {
    console.error('❌ Error en WebSocket:', error);
  });
});

// ============================================================================
// MANEJO DE ERRORES
// ============================================================================

// Middleware para manejar errores de Multer (subida de archivos)
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.error('❌ Error de Multer:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).render('error', {
        mensaje: 'Archivo demasiado grande. El tamaño máximo permitido es 5MB.',
        error: { status: 400 },
        titulo: 'Error de archivo'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).render('error', {
        mensaje: 'Demasiados archivos. Solo se permite un archivo por reporte.',
        error: { status: 400 },
        titulo: 'Error de archivo'
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).render('error', {
        mensaje: 'Campo de archivo inesperado. Usa el campo "imagen".',
        error: { status: 400 },
        titulo: 'Error de archivo'
      });
    }
  }
  
  next(error);
});

// Manejo de errores 404 (página no encontrada)
app.use((req, res) => {
  console.log('📄 404 - Página no encontrada:', req.originalUrl);
  res.status(404).render('error', {
    mensaje: 'Página no encontrada',
    error: { 
      status: 404,
      message: `La página "${req.originalUrl}" no existe.`
    },
    titulo: 'Error 404 - Página no encontrada'
  });
});

// Manejo de errores generales del servidor
app.use((error, req, res, next) => {
  console.error('❌ Error no manejado:', error);
  console.error('Stack trace:', error.stack);
  
  // Errores de base de datos
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(400).render('error', {
      mensaje: 'Ya existe un registro con esos datos.',
      error: { status: 400 },
      titulo: 'Error de duplicado'
    });
  }
  
  if (error.code === 'ER_NO_SUCH_TABLE') {
    return res.status(500).render('error', {
      mensaje: 'Error de configuración de base de datos.',
      error: { status: 500 },
      titulo: 'Error de base de datos'
    });
  }
  
  if (error.code === 'ECONNREFUSED') {
    return res.status(500).render('error', {
      mensaje: 'No se puede conectar a la base de datos.',
      error: { status: 500 },
      titulo: 'Error de conexión'
    });
  }
  
  // Error genérico del servidor
  res.status(500).render('error', {
    mensaje: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? error : { status: 500 },
    titulo: 'Error 500 - Error interno'
  });
});

// ============================================================================
// FUNCIONES DE INICIO Y CIERRE DEL SERVIDOR
// ============================================================================

// Función para verificar directorios necesarios
function verificarDirectorios() {
  const fs = require('fs');
  const directorios = [
    'public/uploads',
    'public/uploads/reportes',
    'views/admin' // ✅ VERIFICAR DIRECTORIO DE VISTAS ADMIN
  ];
  
  directorios.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Directorio creado: ${dir}`);
    }
  });
}

// Función para inicializar el servidor
async function iniciarServidor() {
  try {
    console.log('🚀 Iniciando servidor MiCiudadSV...');
    console.log('⚙️ Entorno:', process.env.NODE_ENV || 'development');
    
    // Verificar directorios necesarios
    verificarDirectorios();
    
    // Verificar conexión a la base de datos
    console.log('🔍 Verificando conexión a la base de datos...');
    const conexionOK = await testConnection();
    if (!conexionOK) {
      console.error('❌ No se pudo conectar a la base de datos');
      console.error('💡 Verifica tu configuración en el archivo .env');
      process.exit(1);
    }
    console.log('✅ Conexión a la base de datos exitosa');
    
    const PORT = process.env.PORT || 3000;
    const HOST = process.env.HOST || 'localhost';
    
    server.listen(PORT, () => {
      console.log('🎉 ¡Servidor MiCiudadSV iniciado exitosamente!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🌐 Servidor corriendo en: http://${HOST}:${PORT}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 URLs disponibles:');
      console.log(`   🏠 Página Principal:    http://${HOST}:${PORT}/`);
      console.log(`   ℹ️  Información:        http://${HOST}:${PORT}/informacion`);
      console.log(`   📊 Reportes:           http://${HOST}:${PORT}/reportes`);
      console.log(`   ➕ Crear Reporte:      http://${HOST}:${PORT}/reportar`);
      console.log(`   🏘️  Comunidades:       http://${HOST}:${PORT}/comunidades`);
      console.log(`   ➕ Crear Comunidad:    http://${HOST}:${PORT}/comunidades/crear`);
      console.log(`   💬 Chat Global:        http://${HOST}:${PORT}/comunidades/chat/global`);
      console.log(`   🔐 Login:              http://${HOST}:${PORT}/auth/login`);
      console.log(`   📝 Registro:           http://${HOST}:${PORT}/auth/registro`);
      console.log(`   📊 Dashboard:          http://${HOST}:${PORT}/dashboard`);
      console.log(`   ⚙️  Admin Panel:       http://${HOST}:${PORT}/admin`); // ✅ ACTIVO
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('👤 Admin Hardcoded disponible:');
      console.log('   📧 Correo: admin@miciudadsv.com');
      console.log('   🔑 Contraseña: Admin123!');
      console.log('   🎯 Acceso directo: Inicia sesión y serás redirigido al panel de admin');
      console.log('   🔧 Configuración de sesiones: secure=false, rolling=true');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⚡ Presiona Ctrl+C para detener el servidor');
      console.log('🔍 Revisa los logs para monitorear la actividad');
    });
  } catch (error) {
    console.error('❌ Error crítico iniciando servidor:', error);
    process.exit(1);
  }
}

// ============================================================================
// MANEJO DE CIERRE GRACEFUL
// ============================================================================

// Función para cerrar el servidor de manera limpia
function cerrarServidor(signal) {
  console.log(`\n🔄 Señal ${signal} recibida, cerrando servidor gracefully...`);
  
  server.close(() => {
    console.log('✅ Servidor HTTP cerrado');
    
    // Cerrar conexiones de WebSocket
    io.close(() => {
      console.log('✅ Servidor WebSocket cerrado');
      
      // Aquí podrías cerrar conexiones de BD si fuera necesario
      console.log('✅ Servidor cerrado correctamente');
      process.exit(0);
    });
  });
  
  // Forzar cierre después de 10 segundos
  setTimeout(() => {
    console.error('❌ Forzando cierre del servidor...');
    process.exit(1);
  }, 10000);
}

// Manejo de señales del sistema
process.on('SIGTERM', () => cerrarServidor('SIGTERM'));
process.on('SIGINT', () => cerrarServidor('SIGINT'));

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Excepción no capturada:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada en:', promise);
  console.error('Razón:', reason);
  // No cerrar el proceso, solo loguear
});

// ============================================================================
// INICIAR EL SERVIDOR
// ============================================================================

iniciarServidor();