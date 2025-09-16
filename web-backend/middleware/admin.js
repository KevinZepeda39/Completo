// middleware/admin.js - COMPLETO CORREGIDO
const { executeQuery } = require('../config/database');

// ============================================================================
// VERIFICACIÓN DE ADMIN USANDO TABLA usuario_rol
// ============================================================================

async function verificarAdmin(req, res, next) {
  try {
    console.log('🔍 === VERIFICANDO PERMISOS DE ADMIN ===');
    
    if (!req.session.usuario) {
      console.log('❌ No hay sesión de usuario válida, redirigiendo a login');
      req.session.redirectTo = req.originalUrl;
      return res.redirect('/auth/login');
    }

    const usuario = req.session.usuario;
    console.log(`🔍 Usuario en sesión: ${usuario.nombre} (ID: ${usuario.id})`);
    console.log(`🔍 Correo: ${usuario.correo || usuario.email}`);

    // 1. VERIFICAR ADMIN HARDCODED
    const adminHardcoded = usuario.correo === 'arielriv20111@gmail.com' || 
                          usuario.email === 'arielriv20111@gmail.com' ||
                          usuario.esAdminHardcoded === true;
    
    if (adminHardcoded) {
      console.log('👑 ✅ ADMIN HARDCODED CONFIRMADO');
      return next();
    }

    // 2. VERIFICAR EN TABLA usuario_rol (rol 2 = admin)
    const rolResult = await executeQuery(`
      SELECT ur.idRol, r.nombreRol as nombre_rol
      FROM usuario_rol ur
      LEFT JOIN roles r ON ur.idRol = r.idRol  
      WHERE ur.idUsuario = ? AND ur.idRol = 2
    `, [usuario.id]);

    console.log('🔍 Resultado consulta roles:', rolResult);

    if (rolResult.length > 0) {
      console.log(`👑 ✅ ADMIN POR ROL CONFIRMADO (Rol: ${rolResult[0].nombre_rol || 'Admin'})`);
      return next();
    }

    // 3. Si no es admin
    console.log('❌ Usuario no tiene permisos de administrador');
    return res.status(403).render('error', {
      titulo: 'Acceso Denegado',
      mensaje: 'No tienes permisos para acceder a esta sección.',
      loggedIn: true,
      usuario: usuario
    });

  } catch (error) {
    console.error('❌ Error verificando permisos de admin:', error);
    return res.status(500).render('error', {
      titulo: 'Error del Sistema',
      mensaje: 'Error al verificar permisos de administrador.',
      loggedIn: !!req.session.usuario,
      usuario: req.session.usuario || null
    });
  }
}

// Función para censurar contenido (placeholder)
async function censurarContenido(req, res, next) {
  // Por ahora solo pasa al siguiente middleware
  // Aquí puedes agregar lógica de censura en el futuro
  try {
    // Verificar contenido inapropiado (ejemplo básico)
    if (req.body.contenido || req.body.titulo || req.body.descripcion) {
      const contenido = (req.body.contenido || req.body.titulo || req.body.descripcion || '').toLowerCase();
      
      // Lista básica de palabras prohibidas
      const palabrasProhibidas = ['spam', 'scam', 'hack', 'illegal'];
      
      for (const palabra of palabrasProhibidas) {
        if (contenido.includes(palabra)) {
          console.log(`🚫 Contenido censurado por palabra: ${palabra}`);
          return res.status(400).json({
            success: false,
            error: 'El contenido contiene palabras no permitidas'
          });
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('❌ Error en censura de contenido:', error);
    next(); // Continuar aunque falle la censura
  }
}

module.exports = {
  verificarAdmin,
  censurarContenido
};