const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar carpeta compartida para uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos de imagen'), false);
        }
    }
});

// Configuración de la base de datos
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'miciudadsv',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para ejecutar consultas
async function executeQuery(query, params = []) {
    try {
        const [rows] = await pool.execute(query, params);
        return rows;
    } catch (error) {
        console.error('Error en consulta SQL:', error);
        throw error;
    }
}

// Middleware para detectar IP automáticamente
app.use((req, res, next) => {
    // Detectar IP del servidor para la app móvil
    const serverIP = req.connection.localAddress || 
                    req.connection.address || 
                    req.socket.localAddress || 
                    req.connection.remoteAddress || 
                    'localhost';
    
    req.serverIP = serverIP;
    next();
});

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ 
        message: 'Servidor backend funcionando correctamente',
        timestamp: new Date().toISOString(),
        serverIP: req.serverIP
    });
});

// Ruta de salud
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: 'Connected',
        uploadsDir: uploadsDir
    });
});

// Ruta para servir archivos estáticos (imágenes)
app.use('/uploads', express.static(uploadsDir));

// RUTAS DE USUARIOS
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email y contraseña son requeridos' 
            });
        }

        const query = 'SELECT * FROM usuarios WHERE correo = ? AND contrasena = ?';
        const users = await executeQuery(query, [email, password]);
        
        if (users.length > 0) {
            const user = users[0];
            res.json({
                success: true,
                message: 'Login exitoso',
                user: {
                    id: user.idUsuario,
                    nombre: user.nombre,
                    email: user.correo,
                    rol: user.rol
                }
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { nombre, email, password, telefono } = req.body;
        
        if (!nombre || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Nombre, email y contraseña son requeridos' 
            });
        }

        // Verificar si el usuario ya existe
        const existingUser = await executeQuery('SELECT * FROM usuarios WHERE correo = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        // Insertar nuevo usuario
        const insertQuery = 'INSERT INTO usuarios (nombre, correo, contrasena, telefono, rol, fechaCreacion) VALUES (?, ?, ?, ?, ?, NOW())';
        const result = await executeQuery(insertQuery, [nombre, email, password, telefono || null, 'ciudadano']);
        
        res.json({
            success: true,
            message: 'Usuario registrado exitosamente',
            userId: result.insertId
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// RUTAS DE REPORTES
app.get('/api/reports', async (req, res) => {
    try {
        const query = `
            SELECT r.*, u.nombre as nombreUsuario 
            FROM reportes r 
            LEFT JOIN usuarios u ON r.idUsuario = u.idUsuario 
            ORDER BY r.fechaCreacion DESC
        `;
        const reports = await executeQuery(query);
        
        res.json({
            success: true,
            data: reports
        });
    } catch (error) {
        console.error('Error obteniendo reportes:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo reportes',
            error: error.message
        });
    }
});

app.get('/api/reports/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT r.*, u.nombre as nombreUsuario 
            FROM reportes r 
            LEFT JOIN usuarios u ON r.idUsuario = u.idUsuario 
            WHERE r.idReporte = ?
        `;
        const reports = await executeQuery(query, [id]);
        
        if (reports.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reporte no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: reports[0]
        });
    } catch (error) {
        console.error('Error obteniendo reporte:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo reporte',
            error: error.message
        });
    }
});

app.post('/api/reports', upload.single('imagen'), async (req, res) => {
    try {
        const { titulo, descripcion, ubicacion, latitud, longitud, categoria, idUsuario } = req.body;
        
        if (!titulo || !descripcion || !idUsuario) {
            return res.status(400).json({
                success: false,
                message: 'Título, descripción y ID de usuario son requeridos'
            });
        }

        let imagenUrl = null;
        let nombreImagen = null;
        
        if (req.file) {
            imagenUrl = `uploads/${req.file.filename}`;
            nombreImagen = req.file.filename;
        }

        const query = `
            INSERT INTO reportes (
                titulo, descripcion, idUsuario, ubicacion, latitud, longitud, 
                categoria, imagenUrl, nombreImagen, estado, fechaCreacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente', NOW())
        `;
        
        const params = [
            titulo, descripcion, idUsuario, ubicacion || null, 
            latitud ? parseFloat(latitud) : null, 
            longitud ? parseFloat(longitud) : null,
            categoria || 'general', imagenUrl, nombreImagen
        ];

        const result = await executeQuery(query, params);
        
        res.json({
            success: true,
            message: 'Reporte creado exitosamente',
            reportId: result.insertId,
            imagenUrl: imagenUrl
        });
    } catch (error) {
        console.error('Error creando reporte:', error);
        res.status(500).json({
            success: false,
            message: 'Error creando reporte',
            error: error.message
        });
    }
});

app.put('/api/reports/:id', upload.single('imagen'), async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, descripcion, ubicacion, latitud, longitud, categoria } = req.body;
        
        // Obtener reporte actual
        const currentReport = await executeQuery('SELECT * FROM reportes WHERE idReporte = ?', [id]);
        if (currentReport.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reporte no encontrado'
            });
        }

        let imagenUrl = currentReport[0].imagenUrl;
        let nombreImagen = currentReport[0].nombreImagen;
        
        // Si se subió una nueva imagen
        if (req.file) {
            // Eliminar imagen anterior si existe
            if (currentReport[0].imagenUrl) {
                const oldImagePath = path.join(__dirname, '..', currentReport[0].imagenUrl);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            
            imagenUrl = `uploads/${req.file.filename}`;
            nombreImagen = req.file.filename;
        }

        const query = `
            UPDATE reportes SET 
                titulo = ?, descripcion = ?, ubicacion = ?, latitud = ?, 
                longitud = ?, categoria = ?, imagenUrl = ?, nombreImagen = ?, 
                fechaActualizacion = NOW()
            WHERE idReporte = ?
        `;
        
        const params = [
            titulo, descripcion, ubicacion || null, 
            latitud ? parseFloat(latitud) : null, 
            longitud ? parseFloat(longitud) : null,
            categoria || 'general', imagenUrl, nombreImagen, id
        ];

        await executeQuery(query, params);
        
        res.json({
            success: true,
            message: 'Reporte actualizado exitosamente',
            imagenUrl: imagenUrl
        });
    } catch (error) {
        console.error('Error actualizando reporte:', error);
        res.status(500).json({
            success: false,
            message: 'Error actualizando reporte',
            error: error.message
        });
    }
});

app.delete('/api/reports/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Obtener reporte para eliminar imagen
        const report = await executeQuery('SELECT imagenUrl FROM reportes WHERE idReporte = ?', [id]);
        if (report.length > 0 && report[0].imagenUrl) {
            const imagePath = path.join(__dirname, '..', report[0].imagenUrl);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        await executeQuery('DELETE FROM reportes WHERE idReporte = ?', [id]);
        
        res.json({
            success: true,
            message: 'Reporte eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error eliminando reporte:', error);
        res.status(500).json({
            success: false,
            message: 'Error eliminando reporte',
            error: error.message
        });
    }
});

// RUTAS DE COMUNIDADES
app.get('/api/communities', async (req, res) => {
    try {
        const query = 'SELECT * FROM comunidades ORDER BY nombre';
        const communities = await executeQuery(query);
        
        res.json({
            success: true,
            data: communities
        });
    } catch (error) {
        console.error('Error obteniendo comunidades:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo comunidades',
            error: error.message
        });
    }
});

app.get('/api/communities/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'SELECT * FROM comunidades WHERE idComunidad = ?';
        const communities = await executeQuery(query, [id]);
        
        if (communities.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Comunidad no encontrada',
                path: req.path
            });
        }
        
        res.json({
            success: true,
            data: communities[0]
        });
    } catch (error) {
        console.error('Error obteniendo comunidad:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo comunidad',
            error: error.message
        });
    }
});

app.post('/api/communities', async (req, res) => {
    try {
        const { nombre, descripcion, ubicacion } = req.body;
        
        if (!nombre) {
            return res.status(400).json({
                success: false,
                message: 'Nombre es requerido'
            });
        }

        const query = 'INSERT INTO comunidades (nombre, descripcion, ubicacion, fechaCreacion) VALUES (?, ?, ?, NOW())';
        const result = await executeQuery(query, [nombre, descripcion || null, ubicacion || null]);
        
        res.json({
            success: true,
            message: 'Comunidad creada exitosamente',
            communityId: result.insertId
        });
    } catch (error) {
        console.error('Error creando comunidad:', error);
        res.status(500).json({
            success: false,
            message: 'Error creando comunidad',
            error: error.message
        });
    }
});

app.put('/api/communities/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, ubicacion } = req.body;
        
        if (!nombre) {
            return res.status(400).json({
                success: false,
                message: 'Nombre es requerido'
            });
        }

        const query = 'UPDATE comunidades SET nombre = ?, descripcion = ?, ubicacion = ?, fechaActualizacion = NOW() WHERE idComunidad = ?';
        await executeQuery(query, [nombre, descripcion || null, ubicacion || null, id]);
        
        res.json({
            success: true,
            message: 'Comunidad actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error actualizando comunidad:', error);
        res.status(500).json({
            success: false,
            message: 'Error actualizando comunidad',
            error: error.message
        });
    }
});

app.delete('/api/communities/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await executeQuery('DELETE FROM comunidades WHERE idComunidad = ?', [id]);
        
        res.json({
            success: true,
            message: 'Comunidad eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error eliminando comunidad:', error);
        res.status(500).json({
            success: false,
            message: 'Error eliminando comunidad',
            error: error.message
        });
    }
});

// RUTAS DE ACTIVIDADES
app.get('/api/activities', async (req, res) => {
    try {
        const query = `
            SELECT a.*, u.nombre as nombreUsuario, r.titulo as tituloReporte
            FROM actividades a 
            LEFT JOIN usuarios u ON a.idUsuario = u.idUsuario 
            LEFT JOIN reportes r ON a.idReporte = r.idReporte
            ORDER BY a.fechaCreacion DESC
        `;
        const activities = await executeQuery(query);
        
        res.json({
            success: true,
            data: activities
        });
    } catch (error) {
        console.error('Error obteniendo actividades:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo actividades',
            error: error.message
        });
    }
});

app.get('/api/activities/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT a.*, u.nombre as nombreUsuario, r.titulo as tituloReporte
            FROM actividades a 
            LEFT JOIN usuarios u ON a.idUsuario = u.idUsuario 
            LEFT JOIN reportes r ON a.idReporte = r.idReporte
            WHERE a.idActividad = ?
        `;
        const activities = await executeQuery(query, [id]);
        
        if (activities.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Actividad no encontrada'
            });
        }
        
        res.json({
            success: true,
            data: activities[0]
        });
    } catch (error) {
        console.error('Error obteniendo actividad:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo actividad',
            error: error.message
        });
    }
});

app.post('/api/activities', async (req, res) => {
    try {
        const { titulo, descripcion, idUsuario, idReporte } = req.body;
        
        if (!titulo || !idUsuario) {
            return res.status(400).json({
                success: false,
                message: 'Título y ID de usuario son requeridos'
            });
        }

        const query = 'INSERT INTO actividades (titulo, descripcion, idUsuario, idReporte, fechaCreacion) VALUES (?, ?, ?, ?, NOW())';
        const result = await executeQuery(query, [titulo, descripcion || null, idUsuario, idReporte || null]);
        
        res.json({
            success: true,
            message: 'Actividad creada exitosamente',
            activityId: result.insertId
        });
    } catch (error) {
        console.error('Error creando actividad:', error);
        res.status(500).json({
            success: false,
            message: 'Error creando actividad',
            error: error.message
        });
    }
});

app.put('/api/activities/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, descripcion, idReporte } = req.body;
        
        if (!titulo) {
            return res.status(400).json({
                success: false,
                message: 'Título es requerido'
            });
        }

        const query = 'UPDATE actividades SET titulo = ?, descripcion = ?, idReporte = ?, fechaActualizacion = NOW() WHERE idActividad = ?';
        await executeQuery(query, [titulo, descripcion || null, idReporte || null, id]);
        
        res.json({
            success: true,
            message: 'Actividad actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error actualizando actividad:', error);
        res.status(500).json({
            success: false,
            message: 'Error actualizando actividad',
            error: error.message
        });
    }
});

app.delete('/api/activities/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await executeQuery('DELETE FROM actividades WHERE idActividad = ?', [id]);
        
        res.json({
            success: true,
            message: 'Actividad eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error eliminando actividad:', error);
        res.status(500).json({
            success: false,
            message: 'Error eliminando actividad',
            error: error.message
        });
    }
});

// RUTA PARA OBTENER IMAGEN
app.get('/api/image/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const imagePath = path.join(uploadsDir, filename);
        
        if (fs.existsSync(imagePath)) {
            res.sendFile(imagePath);
        } else {
            res.status(404).json({
                success: false,
                message: 'Imagen no encontrada'
            });
        }
    } catch (error) {
        console.error('Error sirviendo imagen:', error);
        res.status(500).json({
            success: false,
            message: 'Error sirviendo imagen',
            error: error.message
        });
    }
});

// RUTA PARA OBTENER IMAGEN POR URL
app.get('/api/image-url', (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'URL de imagen es requerida'
            });
        }

        // Extraer el nombre del archivo de la URL
        const filename = url.split('/').pop();
        const imagePath = path.join(uploadsDir, filename);
        
        if (fs.existsSync(imagePath)) {
            res.sendFile(imagePath);
        } else {
            res.status(404).json({
                success: false,
                message: 'Imagen no encontrada'
            });
        }
    } catch (error) {
        console.error('Error sirviendo imagen por URL:', error);
        res.status(500).json({
            success: false,
            message: 'Error sirviendo imagen',
            error: error.message
        });
    }
});

// RUTA PARA OBTENER IMAGEN POR PATH
app.get('/api/image-path', (req, res) => {
    try {
        const { path: imagePath } = req.query;
        if (!imagePath) {
            return res.status(400).json({
                success: false,
                message: 'Path de imagen es requerido'
            });
        }

        // Normalizar el path
        let normalizedPath = imagePath;
        if (normalizedPath.startsWith('uploads/')) {
            normalizedPath = normalizedPath.substring(8); // Remover 'uploads/'
        }
        if (normalizedPath.startsWith('/uploads/')) {
            normalizedPath = normalizedPath.substring(9); // Remover '/uploads/'
        }

        const fullImagePath = path.join(uploadsDir, normalizedPath);
        
        if (fs.existsSync(fullImagePath)) {
            res.sendFile(fullImagePath);
        } else {
            res.status(404).json({
                success: false,
                message: 'Imagen no encontrada',
                requestedPath: imagePath,
                normalizedPath: normalizedPath,
                fullPath: fullImagePath
            });
        }
    } catch (error) {
        console.error('Error sirviendo imagen por path:', error);
        res.status(500).json({
            success: false,
            message: 'Error sirviendo imagen',
            error: error.message
        });
    }
});

// RUTA PARA VERIFICAR CONEXIÓN A BASE DE DATOS
app.get('/api/db-test', async (req, res) => {
    try {
        const result = await executeQuery('SELECT 1 as test');
        res.json({
            success: true,
            message: 'Conexión a base de datos exitosa',
            result: result[0]
        });
    } catch (error) {
        console.error('Error en test de base de datos:', error);
        res.status(500).json({
            success: false,
            message: 'Error en conexión a base de datos',
            error: error.message
        });
    }
});

// RUTA PARA VERIFICAR CARPETA DE UPLOADS
app.get('/api/uploads-test', (req, res) => {
    try {
        const files = fs.readdirSync(uploadsDir);
        res.json({
            success: true,
            message: 'Carpeta de uploads accesible',
            uploadsDir: uploadsDir,
            fileCount: files.length,
            files: files.slice(0, 10) // Solo mostrar primeros 10 archivos
        });
    } catch (error) {
        console.error('Error verificando carpeta de uploads:', error);
        res.status(500).json({
            success: false,
            message: 'Error accediendo a carpeta de uploads',
            error: error.message
        });
    }
});

// RUTA PARA OBTENER IP DEL SERVIDOR
app.get('/api/server-info', (req, res) => {
    res.json({
        success: true,
        serverIP: req.serverIP,
        port: PORT,
        uploadsDir: uploadsDir,
        timestamp: new Date().toISOString()
    });
});

// Manejador de errores 404
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
        path: req.originalUrl
    });
});

// Manejador de errores global
app.use((error, req, res, next) => {
    console.error('Error global:', error);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor backend ejecutándose en puerto ${PORT}`);
    console.log(`📁 Carpeta de uploads: ${uploadsDir}`);
    console.log(`🌐 Accesible desde: http://localhost:${PORT}`);
    console.log(`📱 Para app móvil: http://[IP-LOCAL]:${PORT}`);
});

// Manejo de señales para cierre limpio
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Cerrando servidor...');
    process.exit(0);
});
