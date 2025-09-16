// routes/reportes.js - VERSIÓN FINAL CORREGIDA PARA MYSQL
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { verificarAuth, logActividad, verificarPropietario } = require('../middleware/auth');

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // ✅ DIRECTORIO COMPARTIDO CON LA APP MÓVIL
    const uploadDir = 'C:/ImagenesCompartidas/uploads/reportes/';
    
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

// RUTA PARA MOSTRAR TODOS LOS REPORTES - CORREGIDA PARA MYSQL
router.get('/', async (req, res) => {
    try {
    console.log('📋 Cargando TODOS los reportes de la base de datos...');
    
    // Verificar si el usuario está logueado
    const loggedIn = !!req.session.usuario;
    console.log('🔍 Usuario logueado:', loggedIn);
    
    if (loggedIn) {
      console.log('👤 Usuario actual:', req.session.usuario.nombre);
    }
    
    // Obtener filtros (opcionales)
    const tipo = req.query.tipo;
    const estado = req.query.estado;
    const buscar = req.query.buscar;
    const success = req.query.success;
    const page = parseInt(req.query.page) || 1;
    const limit = 12; // Reportes por página
    const offset = (page - 1) * limit;
    
    // PRIMERO: Verificar cuántos reportes hay en total SIN filtros
    console.log('🔍 Verificando total de reportes en la BD...');
    const totalQuery = `SELECT COUNT(*) as total FROM reportes`;
    const [totalCheck] = await executeQuery(totalQuery, []);
    console.log(`📊 TOTAL de reportes en BD (sin filtros): ${totalCheck.total}`);
    
    // Query base para obtener reportes CON filtros
    let query = `
      SELECT 
        r.idReporte as id,
        r.titulo,
        r.descripcion,
        r.ubicacion,
        r.latitud,
        r.longitud,
        r.categoria as tipo,
        r.estado,
        r.fechaCreacion,
        r.fechaActualizacion,
        r.imagenUrl as imagen,
        r.nombreImagen,
        u.nombre as nombreCreador,
        u.idUsuario as idCreador
      FROM reportes r 
      LEFT JOIN usuarios u ON r.idUsuario = u.idUsuario 
      WHERE 1=1
    `;
        let params = [];

    console.log('🔍 Query base:', query);
    
    // Aplicar filtros solo si se especifican
    if (tipo && tipo !== '') {
      query += ` AND r.categoria = ?`;
      params.push(tipo);
      console.log('🔍 Filtro aplicado - Tipo:', tipo);
        }

        if (estado && estado !== '') {
      query += ` AND r.estado = ?`;
            params.push(estado);
      console.log('🔍 Filtro aplicado - Estado:', estado);
    }
    
    if (buscar && buscar.trim() !== '') {
      query += ` AND (r.titulo LIKE ? OR r.descripcion LIKE ? OR u.nombre LIKE ?)`;
      const searchTerm = `%${buscar.trim()}%`;
            params.push(searchTerm, searchTerm, searchTerm);
      console.log('🔍 Filtro aplicado - Búsqueda:', buscar);
    }
    
    // Contar total de reportes CON filtros aplicados
    const countQuery = query.replace(
      /SELECT[\s\S]*FROM/i,
      'SELECT COUNT(*) as total FROM'
    );
    
    console.log('🔢 Query para contar CON filtros:', countQuery);
    console.log('🔢 Parámetros para contar:', params);
    
    const [totalResult] = await executeQuery(countQuery, params);
    const totalReportes = totalResult ? totalResult.total : 0;
    const totalPages = Math.ceil(totalReportes / limit);
    
    console.log(`📊 Total de reportes CON filtros aplicados: ${totalReportes}`);
    console.log(`📊 Total de páginas: ${totalPages}`);
    
    // CORRECCIÓN: Agregar LIMIT y OFFSET directamente en el string del query
    query += ` ORDER BY r.fechaCreacion DESC LIMIT ${limit} OFFSET ${offset}`;
    
    console.log('📝 Query FINAL completa:', query);
    console.log('📝 Parámetros FINALES:', params);
    
    // Obtener reportes
    const reportes = await executeQuery(query, params);
    console.log(`✅ Reportes obtenidos para página ${page}: ${reportes.length}`);
    
    // Log detallado de los reportes obtenidos
    if (reportes.length > 0) {
      console.log('📋 Detalles de los primeros reportes:');
      reportes.slice(0, 2).forEach((reporte, index) => {
        console.log(`   [${index + 1}] ID: ${reporte.id}, Título: "${reporte.titulo}", Estado: ${reporte.estado}, Creador: ${reporte.nombreCreador}`);
      });
    } else {
      console.log('⚠️ No se obtuvieron reportes con la consulta');
    }
    
    // Obtener reportes recientes para la sidebar (sin filtros)
    const reportesRecientes = await executeQuery(`
            SELECT 
        r.idReporte as id,
        r.titulo,
        r.descripcion,
        r.estado,
        r.fechaCreacion,
        u.nombre as nombreCreador
            FROM reportes r
            LEFT JOIN usuarios u ON r.idUsuario = u.idUsuario
      ORDER BY r.fechaCreacion DESC 
      LIMIT 5
    `);
    
    console.log('📋 Reportes recientes obtenidos:', reportesRecientes.length);
    
    // Obtener estadísticas generales
        const estadisticas = await executeQuery(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN estado = 'Completado' THEN 1 ELSE 0 END) as completados,
        SUM(CASE WHEN estado = 'En progreso' THEN 1 ELSE 0 END) as enProgreso,
        SUM(CASE WHEN estado = 'Rechazado' THEN 1 ELSE 0 END) as rechazados
            FROM reportes
        `);

    const stats = estadisticas[0] || { 
      total: 0, pendientes: 0, completados: 0, enProgreso: 0, rechazados: 0 
    };
    
    console.log('📊 Estadísticas generales:', stats);
    
    // Preparar datos para el template
    const templateData = {
            loggedIn: loggedIn,
            usuario: loggedIn ? req.session.usuario : null,
      reportes: reportes || [],
      reportesRecientes: reportesRecientes || [],
      estadisticas: stats,
      filtros: { tipo, estado, buscar },
      paginacion: {
        currentPage: page,
        totalPages: totalPages,
        totalReportes: totalReportes,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        inicio: offset + 1,
        fin: Math.min(offset + limit, totalReportes)
      },
      mensaje: success ? '¡Reporte creado exitosamente!' : null,
      titulo: 'Reportes Ciudadanos - MiCiudadSV'
    };
    
    console.log('📊 RESUMEN FINAL de datos enviados al template:');
    console.log(`   ✓ Usuario logueado: ${templateData.loggedIn}`);
    console.log(`   ✓ Usuario nombre: ${templateData.usuario ? templateData.usuario.nombre : 'null'}`);
    console.log(`   ✓ Reportes en página: ${templateData.reportes.length}`);
    console.log(`   ✓ Total de reportes: ${templateData.paginacion.totalReportes}`);
    console.log(`   ✓ Página actual: ${templateData.paginacion.currentPage} de ${templateData.paginacion.totalPages}`);
    console.log(`   ✓ Estadísticas total: ${templateData.estadisticas.total}`);
    
    res.render('reportes', templateData);
    
  } catch (error) {
    console.error('❌ ERROR COMPLETO obteniendo reportes:');
    console.error('❌ Mensaje:', error.message);
    console.error('❌ Código:', error.code);
    console.error('❌ Stack trace:', error.stack);
    
    // Preservar la sesión real incluso en errores
    const loggedIn = !!req.session.usuario;
    
    const errorTemplateData = {
      loggedIn: loggedIn,
      usuario: loggedIn ? req.session.usuario : null,
      reportes: [],
      reportesRecientes: [],
      estadisticas: { total: 0, pendientes: 0, completados: 0, enProgreso: 0, rechazados: 0 },
      filtros: { tipo: '', estado: '', buscar: '' },
            paginacion: {
        currentPage: 1, 
        totalPages: 0, 
        totalReportes: 0, 
        hasNext: false, 
        hasPrev: false,
        inicio: 0,
        fin: 0
      },
      mensaje: null,
      error: 'Error cargando reportes. Revisa los logs del servidor para más detalles.',
      titulo: 'Reportes Ciudadanos - MiCiudadSV'
    };
    
    console.log('📊 Enviando template de error con sesión preservada');
    res.render('reportes', errorTemplateData);
  }
});

// RUTA PARA MOSTRAR FORMULARIO DE CREAR REPORTE
router.get('/crear', verificarAuth, (req, res) => {
  console.log('➕ Mostrando formulario de crear reporte para:', req.session.usuario.nombre);
  res.render('reportar', {
    loggedIn: true,
    usuario: req.session.usuario,
    error: null,
    formData: {},
    titulo: 'Crear Reporte - MiCiudadSV'
  });
});

// PROCESAR CREACIÓN DE REPORTE - ADAPTADO A TU ESTRUCTURA
router.post('/crear', 
  verificarAuth, 
  upload.single('imagen'), 
  logActividad('Crear reporte'), 
  async (req, res) => {
    try {
      const { titulo, descripcion, ubicacion, latitud, longitud, categoria } = req.body;
             const imagen = req.file ? req.file.filename : null;
       const imagenUrl = imagen ? `uploads/reportes/${imagen}` : null;
      
      console.log('📝 Creando reporte:', { 
        titulo, 
        descripcion: descripcion?.substring(0, 50) + '...', 
        ubicacion, 
        categoria,
        imagen: imagen,
        idUsuario: req.session.usuario.id 
      });
      
      // Validaciones básicas
      if (!titulo || !descripcion) {
        console.log('❌ Validación fallida: título o descripción vacíos');
        
        // Eliminar archivo subido si la validación falla
        if (req.file) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (err) {
            console.log('⚠️ No se pudo eliminar archivo temporal:', err.message);
          }
        }
        
        return res.render('reportar', {
          loggedIn: true,
          usuario: req.session.usuario,
          error: 'El título y la descripción son obligatorios',
          formData: req.body,
          titulo: 'Crear Reporte - MiCiudadSV'
        });
      }
      
      // Validar longitudes
      if (titulo.length > 255) {
        if (req.file) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (err) {
            console.log('⚠️ No se pudo eliminar archivo temporal:', err.message);
          }
        }
        
        return res.render('reportar', {
          loggedIn: true,
          usuario: req.session.usuario,
          error: 'El título no puede superar los 255 caracteres',
          formData: req.body,
          titulo: 'Crear Reporte - MiCiudadSV'
        });
      }
      
      // Preparar datos para inserción USANDO TU ESTRUCTURA
      const categoriaFinal = categoria || 'general';
      const ubicacionFinal = ubicacion || null;
      const latitudFinal = latitud ? parseFloat(latitud) : null;
      const longitudFinal = longitud ? parseFloat(longitud) : null;
      
      console.log('💾 Datos a insertar:', {
        titulo,
        descripcion: descripcion.substring(0, 100) + '...',
        idUsuario: req.session.usuario.id,
        ubicacion: ubicacionFinal,
        categoria: categoriaFinal,
        imagen: imagen,
        imagenUrl: imagenUrl,
        latitud: latitudFinal,
        longitud: longitudFinal
      });
      
      // Insertar reporte en la base de datos - USANDO TU ESTRUCTURA
      const query = `
        INSERT INTO reportes (
          titulo, 
          descripcion, 
          idUsuario, 
          ubicacion, 
          latitud, 
          longitud, 
          categoria, 
          imagenUrl,
          nombreImagen,
          tipoImagen,
          estado, 
          fechaCreacion
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente', NOW())
      `;
      
      const params = [
        titulo,
        descripcion,
        req.session.usuario.id,
        ubicacionFinal,
        latitudFinal,
        longitudFinal,
        categoriaFinal,
        imagenUrl,
        imagen,
        req.file ? req.file.mimetype : null
      ];
      
      console.log('📊 Query SQL:', query);
      console.log('📊 Parámetros:', params.map(p => typeof p === 'string' && p.length > 50 ? p.substring(0, 50) + '...' : p));
      
      const resultado = await executeQuery(query, params);
      
      console.log('✅ Reporte creado exitosamente con ID:', resultado.insertId);
      
      // Emitir notificación por WebSocket si está disponible
      if (req.io) {
        req.io.to('admins').emit('nuevo-reporte', {
          id: resultado.insertId,
          titulo: titulo,
          categoria: categoriaFinal,
          usuario: req.session.usuario.nombre,
          timestamp: new Date()
        });
      }
      
      // Redirigir con mensaje de éxito
      res.redirect('/reportes?success=1');
      
    } catch (error) {
      console.error('❌ Error detallado creando reporte:', error);
      console.error('❌ Stack trace:', error.stack);
      
      // Eliminar archivo subido si hay error
        if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.log('⚠️ No se pudo eliminar archivo temporal:', err.message);
        }
      }
      
      res.render('reportar', {
        loggedIn: true,
        usuario: req.session.usuario,
        error: 'Error interno del servidor: ' + error.message,
        formData: req.body,
        titulo: 'Crear Reporte - MiCiudadSV'
      });
    }
  }
);

// VER DETALLES DE UN REPORTE ESPECÍFICO
router.get('/:id', async (req, res) => {
  try {
    const reporteId = req.params.id;
    
    console.log('👁️ Viendo detalles del reporte:', reporteId);
    
    // Obtener reporte específico USANDO TU ESTRUCTURA
    const reportes = await executeQuery(`
      SELECT 
        r.idReporte as id,
        r.titulo,
        r.descripcion,
        r.ubicacion,
        r.latitud,
        r.longitud,
        r.categoria as tipo,
        r.estado,
        r.fechaCreacion,
        r.fechaActualizacion,
        r.imagenUrl as imagen,
        u.nombre as nombreCreador,
        u.correo as correoCreador
      FROM reportes r 
      LEFT JOIN usuarios u ON r.idUsuario = u.idUsuario 
      WHERE r.idReporte = ?
    `, [reporteId]);
    
    if (reportes.length === 0) {
      console.log('❌ Reporte no encontrado:', reporteId);
      return res.status(404).render('error', {
        mensaje: 'Reporte no encontrado',
        error: { status: 404 },
        titulo: 'Error 404'
      });
    }
    
    const reporte = reportes[0];
    
    // Obtener reportes relacionados (misma categoria)
    const reportesRelacionados = await executeQuery(`
      SELECT 
        r.idReporte as id,
        r.titulo,
        r.fechaCreacion,
        r.estado,
        u.nombre as nombreCreador
      FROM reportes r 
      LEFT JOIN usuarios u ON r.idUsuario = u.idUsuario 
      WHERE r.categoria = ? AND r.idReporte != ?
      ORDER BY r.fechaCreacion DESC 
      LIMIT 5
    `, [reporte.tipo, reporteId]);
    
    res.render('reporte-detalle', {
      loggedIn: !!req.session.usuario,
      usuario: req.session.usuario || null,
      reporte: reporte,
      reportesRelacionados: reportesRelacionados || [],
      esCreador: req.session.usuario && req.session.usuario.id === reporte.idCreador,
      titulo: `${reporte.titulo} - MiCiudadSV`
        });

    } catch (error) {
    console.error('❌ Error obteniendo detalles del reporte:', error);
    res.status(500).render('error', {
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error : {},
      titulo: 'Error 500'
        });
    }
});

// API para obtener reportes (JSON) - CORREGIDA PARA MYSQL
router.get('/api/lista', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const categoria = req.query.categoria;
    const estado = req.query.estado;
    
    let query = `
      SELECT 
        r.idReporte as id,
        r.titulo,
        r.descripcion,
        r.ubicacion,
        r.categoria as tipo,
        r.estado,
        r.fechaCreacion,
        u.nombre as autorNombre
      FROM reportes r
      LEFT JOIN usuarios u ON r.idUsuario = u.idUsuario
      WHERE 1=1
    `;
    let params = [];
    
    if (categoria) {
      query += ` AND r.categoria = ?`;
      params.push(categoria);
    }
    
    if (estado) {
      query += ` AND r.estado = ?`;
      params.push(estado);
    }
    
    // CORRECCIÓN: Usar concatenación directa para LIMIT y OFFSET
    query += ` ORDER BY r.fechaCreacion DESC LIMIT ${limit} OFFSET ${offset}`;
    
    const reportes = await executeQuery(query, params);
    
    console.log('📡 API reportes - encontrados:', reportes.length);
        res.json({
            success: true,
      data: reportes,
      pagination: {
        limit: limit,
        offset: offset,
        total: reportes.length
      }
    });
    } catch (error) {
    console.error('❌ Error API reportes:', error);
        res.status(500).json({
            success: false,
      message: "Error al obtener reportes",
      error: error.message 
        });
    }
});

// API para estadísticas de reportes - ADAPTADO A TU ESTRUCTURA
router.get('/api/estadisticas', async (req, res) => {
  try {
    // Total de reportes
    const totalReportes = await executeQuery(`
      SELECT COUNT(*) as total FROM reportes
    `);
    
    // Reportes por estado
    const porEstado = await executeQuery(`
      SELECT estado, COUNT(*) as total 
      FROM reportes 
      GROUP BY estado
    `);
    
    // Reportes por categoria
    const porCategoria = await executeQuery(`
      SELECT categoria, COUNT(*) as total 
            FROM reportes
      GROUP BY categoria
        `);

    // Reportes por mes (últimos 6 meses)
    const porMes = await executeQuery(`
            SELECT 
        YEAR(fechaCreacion) as anio,
        MONTH(fechaCreacion) as mes,
        COUNT(*) as total
      FROM reportes 
      WHERE fechaCreacion >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY YEAR(fechaCreacion), MONTH(fechaCreacion)
      ORDER BY anio DESC, mes DESC
    `);
    
    res.json({
      success: true,
      estadisticas: {
        total: totalReportes[0]?.total || 0,
        porEstado: porEstado,
        porCategoria: porCategoria,
        porMes: porMes
      }
        });

    } catch (error) {
    console.error('❌ Error API estadísticas reportes:', error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas",
      error: error.message
        });
    }
});

// Buscar reportes (API) - CORREGIDA PARA MYSQL
router.get('/api/buscar', async (req, res) => {
    try {
    const { q, categoria, estado, limite = 10 } = req.query;

    if (!q || q.length < 3) {
      return res.json({
                success: false,
        message: 'La búsqueda debe tener al menos 3 caracteres',
        data: []
      });
    }
    
    let query = `
      SELECT 
        r.idReporte as id,
        r.titulo,
        r.descripcion,
        r.categoria as tipo,
        r.estado,
        r.fechaCreacion,
        u.nombre as nombreCreador
      FROM reportes r
      LEFT JOIN usuarios u ON r.idUsuario = u.idUsuario
      WHERE (r.titulo LIKE ? OR r.descripcion LIKE ?)
    `;
    
    let params = [`%${q}%`, `%${q}%`];
    
    if (categoria) {
      query += ` AND r.categoria = ?`;
      params.push(categoria);
    }
    
    if (estado) {
      query += ` AND r.estado = ?`;
      params.push(estado);
    }
    
    // CORRECCIÓN: Usar concatenación directa para LIMIT
    query += ` ORDER BY r.fechaCreacion DESC LIMIT ${parseInt(limite)}`;
    
    const resultados = await executeQuery(query, params);

        res.json({
            success: true,
      data: resultados,
      total: resultados.length,
      query: q
        });

    } catch (error) {
    console.error('❌ Error en búsqueda de reportes:', error);
        res.status(500).json({
            success: false,
      message: 'Error en la búsqueda',
      error: error.message
        });
    }
});

module.exports = router;