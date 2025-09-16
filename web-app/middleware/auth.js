// middleware/auth.js
const { executeQuery } = require('../config/database');

// Middleware para verificar si el usuario está autenticado
function verificarAuth(req, res, next) {
  if (req.session.usuario) {
    next();
  } else {
    // Guardar la URL que intentaba visitar para redirigir después del login
    req.session.redirectTo = req.originalUrl;
    res.redirect('/auth/login');
  }
}

// Middleware para verificar si el usuario es administrador
function verificarAdmin(req, res, next) {
  if (!req.session.usuario || req.session.usuario.rol !== 'admin') {
    return res.status(403).render('error', {
      mensaje: 'Acceso denegado',
      error: { 
        status: 403,
        message: 'No tienes permisos para acceder a esta sección'
      }
    });
  }
  next();
}

// Middleware para verificar si el usuario es moderador o administrador
function verificarModerador(req, res, next) {
  if (!req.session.usuario) {
    return res.redirect('/auth/login');
  }

  const tienePermisos = req.session.usuario.roles && 
    req.session.usuario.roles.some(rol => 
      ['Administrador', 'Admin', 'Moderador'].includes(rol.nombreRol)
    );

  if (tienePermisos) {
    next();
  } else {
    res.status(403).render('error', {
      mensaje: 'Acceso denegado. Se requieren permisos de moderador.',
      error: { status: 403 },
      titulo: 'Acceso Denegado'
    });
  }
}

// Middleware para redirigir usuarios autenticados (para login/registro)
function redirigirSiAutenticado(req, res, next) {
  if (req.session.usuario) {
    const redirectTo = req.session.redirectTo || '/';
    delete req.session.redirectTo;
    return res.redirect(redirectTo);
  }
  next();
}

// Middleware para cargar información adicional del usuario
async function cargarInfoUsuario(req, res, next) {
  if (req.session.usuario) {
    try {
      // Obtener información actualizada del usuario
      const usuarios = await executeQuery(
        'SELECT * FROM usuarios WHERE idUsuario = ? AND activo = 1',
        [req.session.usuario.id]
      );

      if (usuarios.length > 0) {
        const usuario = usuarios[0];
        
        // Obtener roles actualizados
        const roles = await executeQuery(`
          SELECT r.* FROM roles r 
          JOIN usuario_rol ur ON r.idRol = ur.idRol 
          WHERE ur.idUsuario = ?
        `, [usuario.idUsuario]);

        // Actualizar información en la sesión
        req.session.usuario = {
          id: usuario.idUsuario,
          nombre: usuario.nombre,
          correo: usuario.correo,
          fechaCreacion: usuario.fechaCreacion,
          ultimoAcceso: usuario.ultimoAcceso,
          roles: roles || []
        };

        // Hacer disponible en las vistas
        res.locals.usuario = req.session.usuario;
      } else {
        // Usuario no existe o está inactivo
        delete req.session.usuario;
        res.locals.loggedIn = false;
        res.locals.usuario = null;
      }
    } catch (error) {
      console.error('⚠️ Error cargando info del usuario:', error.message);
    }
  }
  next();
}

// Middleware para log de actividad
function logActividad(accion) {
  return async (req, res, next) => {
    try {
      if (req.session.usuario) {
        // Log básico en consola
        console.log(`📝 [${new Date().toISOString()}] Usuario ${req.session.usuario.nombre} (ID: ${req.session.usuario.id}) realizó: ${accion}`);
        
        // Aquí podrías guardar en una tabla de logs si la tienes
        // await executeQuery('INSERT INTO activity_logs (usuario_id, accion, ip, timestamp) VALUES (?, ?, ?, NOW())', 
        //   [req.session.usuario.id, accion, req.ip]);
      }
    } catch (error) {
      console.error('⚠️ Error logging actividad:', error.message);
    }
    next();
  };
}

// Middleware para verificar propiedad de recurso (ej: solo el creador puede editar su reporte)
function verificarPropietario(tabla, campoId, campoUsuario = 'usuario_id') {
  return async (req, res, next) => {
    try {
      if (!req.session.usuario) {
        return res.redirect('/auth/login');
      }

      const id = req.params[campoId] || req.body[campoId];
      if (!id) {
        return res.status(400).render('error', {
          mensaje: 'ID del recurso no especificado',
          error: { status: 400 },
          titulo: 'Error de solicitud'
        });
      }

      // Verificar si el recurso pertenece al usuario o si es admin
      const esAdmin = req.session.usuario.roles && 
        req.session.usuario.roles.some(rol => 
          ['Administrador', 'Admin'].includes(rol.nombreRol)
        );

      if (esAdmin) {
        return next(); // Los admins pueden acceder a todo
      }

      const recurso = await executeQuery(
        `SELECT ${campoUsuario} FROM ${tabla} WHERE ${campoId} = ?`,
        [id]
      );

      if (recurso.length === 0) {
        return res.status(404).render('error', {
          mensaje: 'Recurso no encontrado',
          error: { status: 404 },
          titulo: 'No encontrado'
        });
      }

      if (recurso[0][campoUsuario] !== req.session.usuario.id) {
        return res.status(403).render('error', {
          mensaje: 'No tienes permisos para acceder a este recurso',
          error: { status: 403 },
          titulo: 'Acceso Denegado'
        });
      }

      next();
    } catch (error) {
      console.error('❌ Error verificando propiedad:', error);
      res.status(500).render('error', {
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error : {},
        titulo: 'Error 500'
      });
    }
  };
}

module.exports = {
  verificarAuth,
  verificarAdmin,
  verificarModerador,
  redirigirSiAutenticado,
  cargarInfoUsuario,
  logActividad,
  verificarPropietario
};