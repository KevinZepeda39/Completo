// routes/auth.js - CON VERIFICACIÓN DE CORREO ELECTRÓNICO
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { redirigirSiAutenticado, logActividad } = require('../middleware/auth');
// Usar versión de prueba para correos (temporal)
const { enviarCorreoVerificacion, enviarCorreoRecuperacion } = require('../config/email-test');
const { generarCodigoVerificacion, generarTokenVerificacion, generarFechaExpiracion, codigoExpirado, limpiarCodigo } = require('../utils/verification');
const { loginLimiter, registroLimiter } = require('../config/rate-limit-config');
// ✅ NO IMPORTAR ADMIN HARDCODED
// const { loginAdminHardcoded } = require('../middleware/admin');

// Rate limiting configurado en config/rate-limit-config.js

// RUTA LOGIN - Mostrar formulario
router.get('/login', redirigirSiAutenticado, (req, res) => {
  console.log('🔐 Mostrando formulario de login');
  res.render('login', {
    titulo: 'Iniciar Sesión - MiCiudadSV',
    error: null,
    success: null
  });
});

// ✅ PROCESAR LOGIN - SOLO BASE DE DATOS (SIN HARDCODED)
router.post('/login', loginLimiter, logActividad('Intento de login'), async (req, res) => {
  try {
    const { correo, contraseña } = req.body;
    
    console.log('🔐 === LOGIN NORMAL (SOLO BD) ===');
    console.log('   - Correo:', correo);
    console.log('   - Contraseña:', contraseña);
    
    // Validaciones básicas
    if (!correo || !contraseña) {
      console.log('❌ Login fallido: campos vacíos');
      return res.render('login', { 
        error: 'Por favor, completa todos los campos',
        titulo: 'Iniciar Sesión - MiCiudadSV'
      });
    }
    
    // Buscar usuario en la base de datos
    console.log('🔍 Buscando usuario en la base de datos...');
    const usuarios = await executeQuery(
      'SELECT * FROM usuarios WHERE correo = ? AND activo = 1',
      [correo]
    );
    
    if (usuarios.length === 0) {
      console.log('❌ Usuario no encontrado o inactivo');
      return res.render('login', { 
        error: 'Credenciales incorrectas',
        titulo: 'Iniciar Sesión - MiCiudadSV'
      });
    }
    
    const usuario = usuarios[0];
    console.log('✅ Usuario encontrado:', usuario.nombre);
    console.log('   - ID:', usuario.idUsuario);
    console.log('   - Email:', usuario.correo);
    console.log('   - Email verificado:', usuario.emailVerificado);
    
    // Verificar si el correo está verificado
    if (!usuario.emailVerificado) {
      console.log('❌ Email no verificado');
      return res.render('login', { 
        error: 'Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada o solicita un nuevo código.',
        titulo: 'Iniciar Sesión - MiCiudadSV'
      });
    }
    
    // Verificar contraseña
    console.log('🔒 Verificando contraseña...');
    console.log('   - Contraseña ingresada:', contraseña ? '***' : 'vacía');
    console.log('   - Hash almacenado:', usuario.contraseña ? usuario.contraseña.substring(0, 20) + '...' : 'vacío');
    
    const passwordValido = await bcrypt.compare(contraseña, usuario.contraseña);
    
    if (!passwordValido) {
      console.log('❌ Contraseña incorrecta');
      return res.render('login', { 
        error: 'Credenciales incorrectas',
        titulo: 'Iniciar Sesión - MiCiudadSV'
      });
    }
    
    console.log('✅ Contraseña válida');
    
    // Actualizar último acceso (comentado temporalmente)
    try {
      console.log('📝 Actualizando último acceso...');
      // Comentado temporalmente para evitar errores si la columna no existe
      // await executeQuery(
      //   'UPDATE usuarios SET ultimoAcceso = CURRENT_TIMESTAMP WHERE idUsuario = ?',
      //   [usuario.idUsuario]
      // );
      console.log('✅ Último acceso actualizado (simulado)');
    } catch (error) {
      console.log('⚠️ Error actualizando último acceso (no crítico):', error.message);
    }
    
    // Obtener roles del usuario
    let roles = [];
    try {
      console.log('👥 Obteniendo roles del usuario...');
      roles = await executeQuery(`
        SELECT r.* FROM roles r 
        JOIN usuario_rol ur ON r.idRol = ur.idRol 
        WHERE ur.idUsuario = ?
      `, [usuario.idUsuario]);
      console.log('✅ Roles encontrados:', roles.length);
      console.log('   - Roles:', roles);
    } catch (error) {
      console.log('⚠️ Error obteniendo roles (no crítico):', error.message);
    }
    
    // Crear sesión para el usuario
    req.session.usuario = {
      id: usuario.idUsuario,
      nombre: usuario.nombre,
      correo: usuario.correo,
      fechaCreacion: usuario.fechaCreacion,
      roles: roles || []
    };
    
    console.log('🎉 Login exitoso para:', usuario.nombre);
    console.log('💾 Sesión creada:', req.session.usuario);
    
    // ✅ VERIFICAR SI TIENE ROL DE ADMIN EN BD
    const esAdminBD = roles.some(rol => rol.idRol === 2 || rol.nombreRol === 'admin');
    console.log('🔍 ¿Es admin?', esAdminBD);
    
    if (esAdminBD) {
      console.log('🔑 ¡Usuario es ADMIN! Redirigiendo a /admin');
      
      // ✅ GUARDAR SESIÓN Y REDIRIGIR A ADMIN
      req.session.save((err) => {
          if (err) {
              console.error('❌ Error guardando sesión admin BD:', err);
              return res.status(500).render('login', { 
                  error: 'Error interno del servidor. Intenta de nuevo.',
                  titulo: 'Iniciar Sesión - MiCiudadSV'
              });
          }
          
          console.log('💾 ✅ Sesión admin BD guardada correctamente');
          console.log('🚀 REDIRIGIENDO A /admin');
          return res.redirect('/admin');
      });
      
      return;
    }
    
    // ✅ USUARIO NORMAL - GUARDAR SESIÓN Y REDIRIGIR
    console.log('👤 Usuario normal, redirigiendo a dashboard o home');
    req.session.save((err) => {
        if (err) {
            console.error('❌ Error guardando sesión usuario normal:', err);
            return res.status(500).render('login', { 
                error: 'Error interno del servidor. Intenta de nuevo.',
                titulo: 'Iniciar Sesión - MiCiudadSV'
            });
        }
        
        console.log('💾 ✅ Sesión usuario normal guardada correctamente');
        
        // Redirigir a la página que intentaba visitar o a la landing page
        const redirectTo = req.session.redirectTo || '/';
        delete req.session.redirectTo;
        console.log('🏠 Redirigiendo usuario normal a:', redirectTo);
        return res.redirect(redirectTo);
    });
    
  } catch (error) {
    console.error('❌ Error crítico en login:', error);
    res.status(500).render('login', { 
      error: 'Error interno del servidor. Intenta de nuevo más tarde.',
      titulo: 'Iniciar Sesión - MiCiudadSV'
    });
  }
});

// RUTA REGISTRO - Mostrar formulario
router.get('/registro', redirigirSiAutenticado, (req, res) => {
  console.log('📝 Mostrando formulario de registro');
  res.render('registro', {
    titulo: 'Registro - MiCiudadSV',
    error: null,
    nombre: '',
    correo: ''
  });
});

// PROCESAR REGISTRO
router.post('/registro', registroLimiter, logActividad('Intento de registro'), async (req, res) => {
  try {
    const { nombre, correo, contraseña, confirmar_contraseña } = req.body;
    console.log('📝 Intento de registro para:', correo);
    
    // Validaciones básicas
    if (!nombre || !correo || !contraseña || !confirmar_contraseña) {
      return res.render('registro', { 
        error: 'Por favor, completa todos los campos',
        nombre, 
        correo,
        titulo: 'Registro - MiCiudadSV'
      });
    }
    
    if (contraseña !== confirmar_contraseña) {
      return res.render('registro', { 
        error: 'Las contraseñas no coinciden',
        nombre, 
        correo,
        titulo: 'Registro - MiCiudadSV'
      });
    }
    
    if (contraseña.length < 6) {
      return res.render('registro', { 
        error: 'La contraseña debe tener al menos 6 caracteres',
        nombre, 
        correo,
        titulo: 'Registro - MiCiudadSV'
      });
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.render('registro', { 
        error: 'Por favor ingresa un correo electrónico válido',
        nombre,
        correo: '',
        titulo: 'Registro - MiCiudadSV'
      });
    }
    
    // Verificar si el correo ya existe
    console.log('🔍 Verificando si el correo ya existe...');
    const usuarioExistente = await executeQuery(
      'SELECT idUsuario FROM usuarios WHERE correo = ?',
      [correo]
    );
    
    if (usuarioExistente.length > 0) {
      console.log('❌ Correo ya registrado');
      return res.render('registro', { 
        error: 'Este correo ya está registrado',
        nombre,
        correo: '',
        titulo: 'Registro - MiCiudadSV'
      });
    }
    
    // Encriptar contraseña
    console.log('🔐 Encriptando contraseña...');
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(contraseña, saltRounds);
    
    // Generar código y token de verificación
    console.log('🔐 Generando código de verificación...');
    const codigoVerificacion = generarCodigoVerificacion();
    const tokenVerificacion = generarTokenVerificacion();
    const fechaExpiracion = generarFechaExpiracion();
    
    // Insertar usuario con datos de verificación
    console.log('💾 Insertando usuario en la base de datos...');
    const resultado = await executeQuery(
      `INSERT INTO usuarios (
        nombre, correo, contraseña, fechaCreacion, activo, 
        emailVerificado, tokenVerificacion, codigoVerificacion, codigoExpiracion
      ) VALUES (?, ?, ?, NOW(), 1, 0, ?, ?, ?)`,
      [nombre, correo, hashedPassword, tokenVerificacion, codigoVerificacion, fechaExpiracion]
    );
    
    console.log('✅ Usuario creado con ID:', resultado.insertId);
    
    // Asignar rol de usuario por defecto
    try {
      console.log('👥 Asignando rol por defecto...');
      const rolUsuario = await executeQuery('SELECT idRol FROM roles WHERE nombreRol = "usuario" OR nombreRol = "Usuario" LIMIT 1');
      if (rolUsuario.length > 0) {
        await executeQuery(
          'INSERT INTO usuario_rol (idUsuario, idRol) VALUES (?, ?)',
          [resultado.insertId, rolUsuario[0].idRol]
        );
        console.log('✅ Rol asignado correctamente');
      } else {
        console.log('⚠️ No se encontró el rol "Usuario", continuando sin asignar rol');
      }
    } catch (error) {
      console.log('⚠️ Error asignando rol (no crítico):', error.message);
    }
    
    // Enviar correo de verificación
    console.log('📧 Enviando correo de verificación...');
    const correoEnviado = await enviarCorreoVerificacion(correo, nombre, codigoVerificacion);
    
    if (correoEnviado) {
      console.log('✅ Correo de verificación enviado exitosamente');
      
      // Redirigir a la página de verificación
      res.redirect(`/auth/verificar-email?token=${tokenVerificacion}&correo=${encodeURIComponent(correo)}`);
    } else {
      console.log('⚠️ Error enviando correo, pero usuario creado');
      
      // Mostrar mensaje de éxito pero con advertencia
      res.render('login', { 
        success: 'Cuenta creada exitosamente, pero hubo un problema enviando el correo de verificación. Contacta al administrador.',
        titulo: 'Iniciar Sesión - MiCiudadSV'
      });
    }
    
  } catch (error) {
    console.error('❌ Error en registro:', error);
    res.status(500).render('registro', { 
      error: 'Error interno del servidor. Intenta de nuevo más tarde.',
      nombre: req.body.nombre || '',
      correo: req.body.correo || '',
      titulo: 'Registro - MiCiudadSV'
    });
  }
});

// LOGOUT
router.post('/logout', logActividad('Logout'), (req, res) => {
  const nombreUsuario = req.session.usuario?.nombre || 'Usuario';
  console.log('👋 Cerrando sesión de:', nombreUsuario);
  
  req.session.destroy((err) => {
    if (err) {
      console.error('❌ Error al cerrar sesión:', err);
      return res.redirect('/');
    } else {
      console.log('✅ Sesión cerrada correctamente para:', nombreUsuario);
    }
    res.redirect('/');
  });
});

// Ruta GET para logout (para enlaces directos)
router.get('/logout', (req, res) => {
  res.redirect('/');
});

// Verificar estado de sesión (API)
router.get('/verificar-sesion', (req, res) => {
  if (req.session.usuario) {
    res.json({
      loggedIn: true,
      usuario: {
        id: req.session.usuario.id,
        nombre: req.session.usuario.nombre,
        correo: req.session.usuario.correo,
        roles: req.session.usuario.roles || []
      }
    });
  } else {
    res.json({
      loggedIn: false,
      usuario: null
    });
  }
});

// Ruta para recuperar contraseña (formulario)
router.get('/recuperar', (req, res) => {
  res.render('recuperar-password', {
    titulo: 'Recuperar Contraseña - MiCiudadSV',
    error: null,
    success: null
  });
});

// Procesar recuperación de contraseña
router.post('/recuperar', async (req, res) => {
  const { correo } = req.body;
  
  if (!correo) {
    return res.render('recuperar-password', {
      titulo: 'Recuperar Contraseña - MiCiudadSV',
      error: 'Por favor ingresa tu correo electrónico',
      success: null
    });
  }

  try {
    // Verificar si el usuario existe
    const usuarios = await executeQuery(
      'SELECT idUsuario, nombre FROM usuarios WHERE correo = ? AND activo = 1',
      [correo]
    );

    if (usuarios.length > 0) {
      const usuario = usuarios[0];
      console.log('📧 Solicitud de recuperación de contraseña para:', correo);
      
      // Generar nuevo código de verificación
      const codigoVerificacion = generarCodigoVerificacion();
      const fechaExpiracion = generarFechaExpiracion();
      
      // Actualizar código en la base de datos
      await executeQuery(
        'UPDATE usuarios SET codigoVerificacion = ?, codigoExpiracion = ? WHERE idUsuario = ?',
        [codigoVerificacion, fechaExpiracion, usuario.idUsuario]
      );
      
      // Enviar correo de recuperación
      const correoEnviado = await enviarCorreoRecuperacion(correo, usuario.nombre, codigoVerificacion);
      
      if (correoEnviado) {
        console.log('✅ Correo de recuperación enviado exitosamente');
        res.render('recuperar-password', {
          titulo: 'Recuperar Contraseña - MiCiudadSV',
          error: null,
          success: 'Se ha enviado un código de verificación a tu correo electrónico. Revisa tu bandeja de entrada.'
        });
      } else {
        console.log('❌ Error enviando correo de recuperación');
        res.render('recuperar-password', {
          titulo: 'Recuperar Contraseña - MiCiudadSV',
          error: 'Error enviando el correo de recuperación. Intenta de nuevo más tarde.',
          success: null
        });
      }
    } else {
      // Siempre mostrar el mismo mensaje por seguridad
      res.render('recuperar-password', {
        titulo: 'Recuperar Contraseña - MiCiudadSV',
        error: null,
        success: 'Si el correo existe en nuestros registros, recibirás instrucciones para recuperar tu contraseña.'
      });
    }

  } catch (error) {
    console.error('❌ Error en recuperación de contraseña:', error);
    res.render('recuperar-password', {
      titulo: 'Recuperar Contraseña - MiCiudadSV',
      error: 'Error interno del servidor. Intenta de nuevo más tarde.',
      success: null
    });
  }
});

// Mostrar página de verificación de email
router.get('/verificar-email', (req, res) => {
  const { token, correo } = req.query;
  
  if (!token || !correo) {
    return res.redirect('/auth/login');
  }
  
  res.render('verificar-email', {
    titulo: 'Verificar Email - MiCiudadSV',
    token: token,
    correo: correo,
    error: null,
    success: null
  });
});

// Procesar verificación de email
router.post('/verificar-email', async (req, res) => {
  const { token, codigo } = req.body;
  
  if (!token || !codigo) {
    return res.render('verificar-email', {
      titulo: 'Verificar Email - MiCiudadSV',
      token: token,
      correo: '',
      error: 'Datos incompletos',
      success: null
    });
  }
  
  try {
    // Buscar usuario por token
    const usuarios = await executeQuery(
      'SELECT * FROM usuarios WHERE tokenVerificacion = ? AND activo = 1',
      [token]
    );
    
    if (usuarios.length === 0) {
      return res.render('verificar-email', {
        titulo: 'Verificar Email - MiCiudadSV',
        token: token,
        correo: '',
        error: 'Token de verificación inválido',
        success: null
      });
    }
    
    const usuario = usuarios[0];
    
    // Verificar si el código ha expirado
    if (codigoExpirado(usuario.codigoExpiracion)) {
      return res.render('verificar-email', {
        titulo: 'Verificar Email - MiCiudadSV',
        token: token,
        correo: usuario.correo,
        error: 'El código de verificación ha expirado. Solicita uno nuevo.',
        success: null
      });
    }
    
    // Verificar código
    const codigoLimpio = limpiarCodigo(codigo);
    if (codigoLimpio !== usuario.codigoVerificacion) {
      return res.render('verificar-email', {
        titulo: 'Verificar Email - MiCiudadSV',
        token: token,
        correo: usuario.correo,
        error: 'Código de verificación incorrecto',
        success: null
      });
    }
    
    // Marcar email como verificado
    await executeQuery(
      `UPDATE usuarios SET 
        emailVerificado = 1, 
        fechaVerificacion = NOW(),
        tokenVerificacion = NULL,
        codigoVerificacion = NULL,
        codigoExpiracion = NULL
      WHERE idUsuario = ?`,
      [usuario.idUsuario]
    );
    
    console.log('✅ Email verificado exitosamente para:', usuario.correo);
    
    // Redirigir al login con mensaje de éxito
    res.render('login', {
      success: '¡Email verificado exitosamente! Ahora puedes iniciar sesión.',
      titulo: 'Iniciar Sesión - MiCiudadSV'
    });
    
  } catch (error) {
    console.error('❌ Error verificando email:', error);
    res.render('verificar-email', {
      titulo: 'Verificar Email - MiCiudadSV',
      token: token,
      correo: '',
      error: 'Error interno del servidor. Intenta de nuevo más tarde.',
      success: null
    });
  }
});

// Reenviar código de verificación
router.post('/reenviar-codigo', async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.json({ success: false, error: 'Token requerido' });
  }
  
  try {
    // Buscar usuario por token
    const usuarios = await executeQuery(
      'SELECT * FROM usuarios WHERE tokenVerificacion = ? AND activo = 1',
      [token]
    );
    
    if (usuarios.length === 0) {
      return res.json({ success: false, error: 'Token inválido' });
    }
    
    const usuario = usuarios[0];
    
    // Generar nuevo código
    const nuevoCodigo = generarCodigoVerificacion();
    const nuevaFechaExpiracion = generarFechaExpiracion();
    
    // Actualizar en la base de datos
    await executeQuery(
      'UPDATE usuarios SET codigoVerificacion = ?, codigoExpiracion = ? WHERE idUsuario = ?',
      [nuevoCodigo, nuevaFechaExpiracion, usuario.idUsuario]
    );
    
    // Enviar nuevo correo
    const correoEnviado = await enviarCorreoVerificacion(usuario.correo, usuario.nombre, nuevoCodigo);
    
    if (correoEnviado) {
      res.json({ success: true });
    } else {
      res.json({ success: false, error: 'Error enviando el correo' });
    }
    
  } catch (error) {
    console.error('❌ Error reenviando código:', error);
    res.json({ success: false, error: 'Error interno del servidor' });
  }
});

// Mostrar página para restablecer contraseña
router.get('/restablecer-password', (req, res) => {
  const { token, codigo } = req.query;
  
  if (!token || !codigo) {
    return res.redirect('/auth/login');
  }
  
  res.render('restablecer-password', {
    titulo: 'Restablecer Contraseña - MiCiudadSV',
    token: token,
    codigo: codigo,
    error: null,
    success: null
  });
});

// Procesar restablecimiento de contraseña
router.post('/restablecer-password', async (req, res) => {
  const { token, codigo, nueva_contraseña, confirmar_contraseña } = req.body;
  
  if (!token || !codigo || !nueva_contraseña || !confirmar_contraseña) {
    return res.render('restablecer-password', {
      titulo: 'Restablecer Contraseña - MiCiudadSV',
      token: token,
      codigo: codigo,
      error: 'Todos los campos son requeridos',
      success: null
    });
  }
  
  if (nueva_contraseña !== confirmar_contraseña) {
    return res.render('restablecer-password', {
      titulo: 'Restablecer Contraseña - MiCiudadSV',
      token: token,
      codigo: codigo,
      error: 'Las contraseñas no coinciden',
      success: null
    });
  }
  
  if (nueva_contraseña.length < 8) {
    return res.render('restablecer-password', {
      titulo: 'Restablecer Contraseña - MiCiudadSV',
      token: token,
      codigo: codigo,
      error: 'La contraseña debe tener al menos 8 caracteres',
      success: null
    });
  }
  
  try {
    // Buscar usuario por token y código
    const usuarios = await executeQuery(
      'SELECT * FROM usuarios WHERE tokenVerificacion = ? AND codigoVerificacion = ? AND activo = 1',
      [token, codigo]
    );
    
    if (usuarios.length === 0) {
      return res.render('restablecer-password', {
        titulo: 'Restablecer Contraseña - MiCiudadSV',
        token: token,
        codigo: codigo,
        error: 'Datos de verificación inválidos',
        success: null
      });
    }
    
    const usuario = usuarios[0];
    
    // Verificar si el código ha expirado
    if (codigoExpirado(usuario.codigoExpiracion)) {
      return res.render('restablecer-password', {
        titulo: 'Restablecer Contraseña - MiCiudadSV',
        token: token,
        codigo: codigo,
        error: 'El código de verificación ha expirado. Solicita uno nuevo.',
        success: null
      });
    }
    
    // Encriptar nueva contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(nueva_contraseña, saltRounds);
    
    // Actualizar contraseña y limpiar datos de verificación
    await executeQuery(
      `UPDATE usuarios SET 
        contraseña = ?,
        tokenVerificacion = NULL,
        codigoVerificacion = NULL,
        codigoExpiracion = NULL
      WHERE idUsuario = ?`,
      [hashedPassword, usuario.idUsuario]
    );
    
    console.log('✅ Contraseña restablecida exitosamente para:', usuario.correo);
    
    // Redirigir al login con mensaje de éxito
    res.render('login', {
      success: 'Contraseña restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.',
      titulo: 'Iniciar Sesión - MiCiudadSV'
    });
    
  } catch (error) {
    console.error('❌ Error restableciendo contraseña:', error);
    res.render('restablecer-password', {
      titulo: 'Restablecer Contraseña - MiCiudadSV',
      token: token,
      codigo: codigo,
      error: 'Error interno del servidor. Intenta de nuevo más tarde.',
      success: null
    });
  }
});

module.exports = router;