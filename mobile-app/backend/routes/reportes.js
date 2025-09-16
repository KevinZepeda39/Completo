// routes/reportes.js - Sistema de reportes con multer para React Native
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { execute } = require('../config/database');

// ✅ CONFIGURAR MULTER PARA SUBIDA DE ARCHIVOS (igual que tu plataforma web)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/reportes/');
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)){
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'reporte-' + uniqueSuffix + path.extname(file.originalname);
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
  fileFilter: function (req, file, cb) {
    // Solo permitir imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});

// ✅ ENDPOINT PRINCIPAL PARA CREAR REPORTES CON IMAGEN (React Native)
router.post('/upload', upload.single('imagen'), async (req, res) => {
  try {
    console.log('📱 === CREANDO REPORTE CON IMAGEN (React Native) ===');
    console.log('📋 Body recibido:', req.body);
    console.log('📷 Archivo recibido:', req.file);
    
    // ✅ VALIDAR DATOS OBLIGATORIOS
    const { titulo, descripcion, ubicacion, categoria, idUsuario } = req.body;
    
    if (!titulo || !descripcion || !ubicacion || !idUsuario) {
      console.log('❌ Datos faltantes:', { titulo: !!titulo, descripcion: !!descripcion, ubicacion: !!ubicacion, idUsuario: !!idUsuario });
      
      // Eliminar archivo subido si la validación falla
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
          console.log('🗑️ Archivo temporal eliminado por validación fallida');
        } catch (err) {
          console.log('⚠️ No se pudo eliminar archivo temporal:', err.message);
        }
      }
      
      return res.status(400).json({
        success: false,
        error: 'Título, descripción, ubicación y ID de usuario son obligatorios'
      });
    }
    
    // ✅ VALIDAR LONGITUDES
    if (titulo.length > 255) {
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.log('⚠️ No se pudo eliminar archivo temporal:', err.message);
        }
      }
      
      return res.status(400).json({
        success: false,
        error: 'El título no puede superar los 255 caracteres'
      });
    }
    
    // ✅ PREPARAR DATOS PARA INSERCIÓN
    const categoriaFinal = categoria || 'general';
    const imagen = req.file ? req.file.filename : null;
    const imagenUrl = imagen ? `/uploads/reportes/${imagen}` : null;
    const tipoImagen = req.file ? req.file.mimetype : null;
    
    console.log('💾 Datos a insertar:', {
      titulo,
      descripcion: descripcion.substring(0, 100) + '...',
      ubicacion,
      categoria: categoriaFinal,
      idUsuario,
      imagen: imagen,
      imagenUrl: imagenUrl,
      tipoImagen: tipoImagen
    });
    
    // ✅ INSERTAR REPORTE EN LA BASE DE DATOS
    const query = `
      INSERT INTO reportes (
        titulo, 
        descripcion, 
        idUsuario, 
        ubicacion, 
        categoria, 
        imagenUrl,
        nombreImagen,
        tipoImagen,
        estado, 
        fechaCreacion
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente', NOW())
    `;
    
    const params = [
      titulo,
      descripcion,
      parseInt(idUsuario),
      ubicacion,
      categoriaFinal,
      imagenUrl,
      imagen,
      tipoImagen
    ];
    
    console.log('📊 Query SQL:', query);
    console.log('📊 Parámetros:', params);
    
    const resultado = await execute(query, params);
    
    console.log('✅ Reporte creado exitosamente con ID:', resultado.insertId);
    
    // ✅ PREPARAR RESPUESTA
    const newReport = {
      id: resultado.insertId,
      idReporte: resultado.insertId,
      titulo,
      descripcion,
      ubicacion,
      categoria: categoriaFinal,
      idUsuario: parseInt(idUsuario),
      nombreImagen: imagen,
      imagenUrl: imagenUrl,
      estado: 'Pendiente',
      fechaCreacion: new Date().toISOString()
    };
    
    console.log('📤 Enviando respuesta exitosa:', newReport);
    
    res.status(201).json({
      success: true,
      report: newReport,
      message: 'Reporte con imagen creado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error creando reporte:', error);
    console.error('❌ Stack trace:', error.stack);
    
    // ✅ ELIMINAR ARCHIVO SUBIDO SI HAY ERROR
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🗑️ Archivo temporal eliminado por error');
      } catch (err) {
        console.log('⚠️ No se pudo eliminar archivo temporal:', err.message);
      }
    }
    
    res.status(500).json({
      success: false,
      error: `Error interno del servidor: ${error.message}`,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ✅ ENDPOINT PARA CREAR REPORTES SIN IMAGEN (JSON)
router.post('/', async (req, res) => {
  try {
    console.log('📝 === CREANDO REPORTE SIN IMAGEN (JSON) ===');
    console.log('📋 Body recibido:', req.body);
    
    // ✅ VALIDAR DATOS OBLIGATORIOS
    const { titulo, descripcion, ubicacion, categoria, idUsuario } = req.body;
    
    if (!titulo || !descripcion || !ubicacion || !idUsuario) {
      console.log('❌ Datos faltantes:', { titulo: !!titulo, descripcion: !!descripcion, ubicacion: !!ubicacion, idUsuario: !!idUsuario });
      
      return res.status(400).json({
        success: false,
        error: 'Título, descripción, ubicación y ID de usuario son obligatorios'
      });
    }
    
    // ✅ VALIDAR LONGITUDES
    if (titulo.length > 255) {
      return res.status(400).json({
        success: false,
        error: 'El título no puede superar los 255 caracteres'
      });
    }
    
    // ✅ PREPARAR DATOS PARA INSERCIÓN
    const categoriaFinal = categoria || 'general';
    
    console.log('💾 Datos a insertar:', {
      titulo,
      descripcion: descripcion.substring(0, 100) + '...',
      ubicacion,
      categoria: categoriaFinal,
      idUsuario
    });
    
    // ✅ INSERTAR REPORTE EN LA BASE DE DATOS
    const query = `
      INSERT INTO reportes (
        titulo, 
        descripcion, 
        idUsuario, 
        ubicacion, 
        categoria, 
        estado, 
        fechaCreacion
      ) 
      VALUES (?, ?, ?, ?, ?, 'Pendiente', NOW())
    `;
    
    const params = [
      titulo,
      descripcion,
      parseInt(idUsuario),
      ubicacion,
      categoriaFinal
    ];
    
    console.log('📊 Query SQL:', query);
    console.log('📊 Parámetros:', params);
    
    const resultado = await execute(query, params);
    
    console.log('✅ Reporte creado exitosamente con ID:', resultado.insertId);
    
    // ✅ PREPARAR RESPUESTA
    const newReport = {
      id: resultado.insertId,
      idReporte: resultado.insertId,
      titulo,
      descripcion,
      ubicacion,
      categoria: categoriaFinal,
      idUsuario: parseInt(idUsuario),
      estado: 'Pendiente',
      fechaCreacion: new Date().toISOString()
    };
    
    console.log('📤 Enviando respuesta exitosa:', newReport);
    
    res.status(201).json({
      success: true,
      report: newReport,
      message: 'Reporte creado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error creando reporte:', error);
    console.error('❌ Stack trace:', error.stack);
    
    res.status(500).json({
      success: false,
      error: `Error interno del servidor: ${error.message}`,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ✅ ENDPOINT PARA OBTENER TODOS LOS REPORTES
router.get('/', async (req, res) => {
  try {
    console.log('📋 === OBTENIENDO TODOS LOS REPORTES ===');
    
    const query = `
      SELECT 
        r.idReporte as id,
        r.titulo,
        r.descripcion,
        r.ubicacion,
        r.categoria,
        r.estado,
        r.fechaCreacion,
        r.imagenUrl,
        u.nombre as nombreCreador,
        u.idUsuario as idCreador
      FROM reportes r 
      LEFT JOIN usuarios u ON r.idUsuario = u.idUsuario 
      ORDER BY r.fechaCreacion DESC
    `;
    
    const reportes = await execute(query);
    
    console.log(`✅ Reportes obtenidos: ${reportes.length}`);
    
    res.json({
      success: true,
      reports: reportes,
      reportCount: reportes.length
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo reportes:', error);
    
    res.status(500).json({
      success: false,
      error: `Error interno del servidor: ${error.message}`
    });
  }
});

// ✅ ENDPOINT PARA OBTENER REPORTES DE UN USUARIO
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(`📋 === OBTENIENDO REPORTES DEL USUARIO ${userId} ===`);
    
    const query = `
      SELECT 
        r.idReporte as id,
        r.titulo,
        r.descripcion,
        r.ubicacion,
        r.categoria,
        r.estado,
        r.fechaCreacion,
        r.imagenUrl,
        u.nombre as nombreCreador,
        u.idUsuario as idCreador
      FROM reportes r 
      LEFT JOIN usuarios u ON r.idUsuario = u.idUsuario 
      WHERE r.idUsuario = ?
      ORDER BY r.fechaCreacion DESC
    `;
    
    const reportes = await execute(query, [userId]);
    
    console.log(`✅ Reportes del usuario ${userId} obtenidos: ${reportes.length}`);
    
    res.json({
      success: true,
      reports: reportes,
      reportCount: reportes.length
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo reportes del usuario:', error);
    
    res.status(500).json({
      success: false,
      error: `Error interno del servidor: ${error.message}`
    });
  }
});

// ✅ ENDPOINT PARA OBTENER UN REPORTE ESPECÍFICO
router.get('/:id', async (req, res) => {
  try {
    const reportId = req.params.id;
    console.log(`👁️ === OBTENIENDO REPORTE ${reportId} ===`);
    
    const query = `
      SELECT 
        r.idReporte as id,
        r.titulo,
        r.descripcion,
        r.ubicacion,
        r.categoria,
        r.estado,
        r.fechaCreacion,
        r.imagenUrl,
        u.nombre as nombreCreador,
        u.idUsuario as idCreador
      FROM reportes r 
      LEFT JOIN usuarios u ON r.idUsuario = u.idUsuario 
      WHERE r.idReporte = ?
    `;
    
    const reportes = await execute(query, [reportId]);
    
    if (reportes.length === 0) {
      console.log(`❌ Reporte ${reportId} no encontrado`);
      return res.status(404).json({
        success: false,
        error: 'Reporte no encontrado'
      });
    }
    
    const reporte = reportes[0];
    console.log(`✅ Reporte ${reportId} obtenido exitosamente`);
    
    res.json({
      success: true,
      report: reporte
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo reporte:', error);
    
    res.status(500).json({
      success: false,
      error: `Error interno del servidor: ${error.message}`
    });
  }
});

// ✅ ENDPOINT DE TEST PARA CONECTIVIDAD
router.post('/test', (req, res) => {
  console.log('🧪 === TEST DE CONECTIVIDAD ===');
  console.log('📋 Headers:', req.headers);
  console.log('📋 Body:', req.body);
  
  res.json({
    success: true,
    message: 'Test de conectividad exitoso',
    timestamp: new Date().toISOString(),
    headers: req.headers,
    body: req.body
  });
});

module.exports = router;
