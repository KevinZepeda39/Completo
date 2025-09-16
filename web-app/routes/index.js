// routes/index.js
const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { cargarInfoUsuario } = require('../middleware/auth');

// Importar fetch para Node.js (compatible con versiones < 18)
let fetch;
if (typeof globalThis.fetch === 'undefined') {
  fetch = require('node-fetch');
} else {
  fetch = globalThis.fetch;
}

// Aplicar middleware para cargar info del usuario en todas las rutas
router.use(cargarInfoUsuario);

// Función para obtener estadísticas seguras
async function obtenerEstadisticas() {
  let usuarios = 0, comunidades = 0, mensajes = 0, reportes = 0;
  
  // Usuarios (obligatorio)
  try {
    const usuariosResult = await executeQuery('SELECT COUNT(*) as total FROM usuarios WHERE activo = 1');
    usuarios = usuariosResult[0]?.total || 0;
  } catch (error) {
    console.log('❌ Error obteniendo usuarios:', error.message);
  }
  
  // Comunidades (opcional)
  try {
    const comunidadesResult = await executeQuery('SELECT COUNT(*) as total FROM comunidad WHERE estado = "activa"');
    comunidades = comunidadesResult[0]?.total || 0;
  } catch (error) {
    console.log('⚠️ Tabla comunidad no existe o error:', error.message);
  }
  
  // Mensajes (opcional)
  try {
    const mensajesResult = await executeQuery('SELECT COUNT(*) as total FROM comentarios_globales');
    mensajes = mensajesResult[0]?.total || 0;
  } catch (error) {
    console.log('⚠️ Tabla comentarios_globales no existe o error:', error.message);
  }
  
  // Reportes (opcional)
  try {
    const reportesResult = await executeQuery('SELECT COUNT(*) as total FROM reportes');
    reportes = reportesResult[0]?.total || 0;
  } catch (error) {
    console.log('⚠️ Tabla reportes no existe o error:', error.message);
  }
  
  return { usuarios, comunidades, mensajes, reportes };
}

// RUTA PRINCIPAL (LANDING PAGE)
router.get('/', async (req, res) => {
  try {
    console.log('🏠 Cargando landing page...');
    
    // Verificar si el usuario está logueado
    const loggedIn = !!req.session.usuario;
    
    // Si está logueado, obtener algunas estadísticas básicas
    let estadisticas = null;
    if (loggedIn) {
      estadisticas = await obtenerEstadisticas();
    }

    // Obtener reportes recientes para mostrar en el landing
    let reportesRecientes = [];
    try {
      reportesRecientes = await executeQuery(`
        SELECT 
          r.idReporte as id,
          r.titulo,
          r.descripcion,
          r.fechaCreacion,
          r.estado,
          r.categoria,
          u.nombre as nombreCreador
        FROM reportes r
        LEFT JOIN usuarios u ON r.idUsuario = u.idUsuario
        ORDER BY r.fechaCreacion DESC
        LIMIT 3
      `);
      console.log('✅ Reportes recientes cargados:', reportesRecientes.length);
    } catch (error) {
      console.log('⚠️ Error obteniendo reportes recientes para landing:', error.message);
    }
    
    res.render('landing', {
      loggedIn: loggedIn,
      usuario: req.session.usuario || null,
      estadisticas: estadisticas,
      reportesRecientes: reportesRecientes || [],
      titulo: 'MiCiudadSV - Plataforma Ciudadana'
    });
  } catch (error) {
    console.error('❌ Error en landing page:', error);
    res.render('landing', {
      loggedIn: false,
      usuario: null,
      estadisticas: null,
      reportesRecientes: [],
      titulo: 'MiCiudadSV - Plataforma Ciudadana'
    });
  }
});

// RUTA DE INFORMACIÓN
router.get('/informacion', async (req, res) => {
  try {
    console.log('ℹ️ Cargando página de información...');
    
    // Verificar si el usuario está logueado
    const loggedIn = !!req.session.usuario;
    
    // Obtener estadísticas para mostrar en información
    const estadisticas = await obtenerEstadisticas();
    
    // Obtener reportes recientes (máximo 5)
    let reportesRecientes = [];
    try {
      reportesRecientes = await executeQuery(`
        SELECT 
          r.idReporte as id,
          r.titulo,
          r.descripcion,
          r.fechaCreacion,
          r.estado,
          r.categoria as tipo,
          r.urgente,
          u.nombre as nombreCreador
        FROM reportes r
        LEFT JOIN usuarios u ON r.idUsuario = u.idUsuario
        WHERE r.eliminado IS NULL OR r.eliminado = 0
        ORDER BY r.fechaCreacion DESC
        LIMIT 5
      `);
      console.log('✅ Reportes recientes para información cargados:', reportesRecientes.length);
    } catch (error) {
      console.log('⚠️ Error obteniendo reportes recientes:', error.message);
    }

    // Obtener estadísticas de reportes por tipo
    let estadisticasReportes = {
      emergency: 0,
      infrastructure: 0,
      security: 0,
      general: 0
    };
    
    try {
      const reportesPorTipo = await executeQuery(`
        SELECT categoria as tipo, COUNT(*) as total 
        FROM reportes 
        WHERE eliminado IS NULL OR eliminado = 0
        GROUP BY categoria
      `);
      
      reportesPorTipo.forEach(item => {
        if (estadisticasReportes.hasOwnProperty(item.tipo)) {
          estadisticasReportes[item.tipo] = item.total;
        }
      });
    } catch (error) {
      console.log('⚠️ Error obteniendo estadísticas de reportes:', error.message);
    }
    
    res.render('informacion', {
      loggedIn: loggedIn,
      usuario: req.session.usuario || null,
      estadisticas: estadisticas,
      estadisticasReportes: estadisticasReportes,
      reportesRecientes: reportesRecientes || [],
      titulo: 'Información - MiCiudadSV'
    });
  } catch (error) {
    console.error('❌ Error en página de información:', error);
    res.render('informacion', {
      loggedIn: false,
      usuario: null,
      estadisticas: { usuarios: 0, comunidades: 0, mensajes: 0, reportes: 0 },
      estadisticasReportes: { emergency: 0, infrastructure: 0, security: 0, general: 0 },
      reportesRecientes: [],
      titulo: 'Información - MiCiudadSV'
    });
  }
});

// API para estadísticas públicas (sin autenticación requerida)
router.get('/api/estadisticas-publicas', async (req, res) => {
  try {
    const estadisticas = await obtenerEstadisticas();
    
    // Solo devolver estadísticas públicas (sin datos sensibles)
    const estadisticasPublicas = {
      reportesActivos: estadisticas.reportes,
      usuariosRegistrados: estadisticas.usuarios,
      timestamp: new Date().toISOString()
    };
    
    res.json(estadisticasPublicas);
  } catch (error) {
    console.error('❌ Error API estadísticas públicas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      reportesActivos: 0,
      usuariosRegistrados: 0,
      timestamp: new Date().toISOString()
    });
  }
});

// Ruta para políticas de privacidad
router.get('/privacidad', (req, res) => {
  res.render('privacidad', {
    titulo: 'Política de Privacidad - MiCiudadSV'
  });
});

// Ruta para términos de servicio
router.get('/terminos', (req, res) => {
  res.render('terminos', {
    titulo: 'Términos de Servicio - MiCiudadSV'
  });
});

// Ruta para contacto
router.get('/contacto', (req, res) => {
  res.render('contacto', {
    titulo: 'Contacto - MiCiudadSV'
  });
});

// Ruta de ayuda/FAQ
router.get('/ayuda', (req, res) => {
  const faqs = [
    {
      pregunta: '¿Cómo creo un reporte?',
      respuesta: 'Para crear un reporte, debes registrarte en la plataforma, iniciar sesión y usar el botón "Reportar" en el menú principal.'
    },
    {
      pregunta: '¿Qué tipos de reportes puedo hacer?',
      respuesta: 'Puedes reportar emergencias, problemas de infraestructura, situaciones de seguridad y otros problemas generales de tu comunidad.'
    },
    {
      pregunta: '¿Cuánto tiempo toma que revisen mi reporte?',
      respuesta: 'Los reportes se revisan en orden de llegada. Los reportes marcados como urgentes tienen prioridad y se revisan dentro de 24 horas.'
    },
    {
      pregunta: '¿Puedo hacer reportes anónimos?',
      respuesta: 'No, necesitas tener una cuenta registrada para crear reportes. Esto nos ayuda a mantener la calidad y veracidad de la información.'
    }
  ];

  res.render('ayuda', {
    titulo: 'Ayuda - MiCiudadSV',
    faqs: faqs
  });
});


module.exports = router;