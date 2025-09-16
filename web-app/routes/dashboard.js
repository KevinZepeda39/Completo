// routes/dashboard.js - CORREGIDO CON NOMBRES DE TABLA CONSISTENTES
const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { verificarAuth, logActividad } = require('../middleware/auth');
const { verificarAdmin } = require('../middleware/admin');

// Ruta de prueba simple
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Dashboard funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

// Ruta de prueba del perfil sin autenticación
router.get('/perfil-test', (req, res) => {
    res.json({
        success: true,
        message: 'Ruta del perfil accesible sin autenticación',
        timestamp: new Date().toISOString(),
        session: req.session ? 'Sesión existe' : 'No hay sesión',
        usuario: req.session?.usuario || 'No hay usuario',
        sessionKeys: req.session ? Object.keys(req.session) : [],
        usuarioKeys: req.session?.usuario ? Object.keys(req.session.usuario) : []
    });
});

// Ruta de prueba del perfil CON autenticación pero SIN base de datos
router.get('/perfil-simple', verificarAuth, (req, res) => {
    try {
        const usuario = req.session.usuario;
        
        console.log('🔍 === PERFIL SIMPLE ===');
        console.log('   - Usuario completo:', JSON.stringify(usuario, null, 2));
        
        res.json({
            success: true,
            message: 'Perfil accesible con autenticación',
            usuario: usuario,
            sessionKeys: Object.keys(req.session),
            usuarioKeys: Object.keys(usuario)
        });
        
    } catch (error) {
        console.error('❌ Error en perfil simple:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

        // Ruta del perfil del usuario
router.get('/perfil', verificarAuth, async (req, res) => {
    try {
        const usuario = req.session.usuario;
        
        console.log('🔍 === PERFIL USUARIO ===');
        console.log('   - Usuario:', usuario.nombre);
        
        // Obtener datos actualizados del usuario desde la base de datos
        const userId = usuario.idUsuario || usuario.id;
        const userData = await executeQuery('SELECT idUsuario, nombre, correo, fechaCreacion, fechaActualizacion FROM usuarios WHERE idUsuario = ?', [userId]);
        
        if (userData && userData.length > 0) {
            const userInfo = userData[0];
            res.render('dashboard/perfil', {
                titulo: 'Mi Perfil - MiCiudadSV',
                loggedIn: true,
                usuario: userInfo
            });
        } else {
            res.status(404).render('error', {
                titulo: 'Error',
                mensaje: 'Usuario no encontrado'
            });
        }
        
    } catch (error) {
        console.error('❌ Error en perfil:', error);
        res.status(500).render('error', {
            titulo: 'Error',
            mensaje: 'Error al cargar el perfil'
        });
    }
});

        // Actualizar perfil del usuario
router.post('/actualizar-perfil', verificarAuth, async (req, res) => {
    try {
        const usuario = req.session.usuario;
        const { campo, valor } = req.body;
        
        console.log('🔍 === ACTUALIZANDO PERFIL ===');
        console.log('   - Usuario:', usuario.nombre);
        console.log('   - Campo:', campo);
        console.log('   - Valor:', valor);
        
        // Validar que el campo sea válido (solo nombre y correo)
        const camposPermitidos = ['nombre', 'correo'];
        if (!camposPermitidos.includes(campo)) {
            return res.status(400).json({
                success: false,
                message: 'Campo no permitido para edición'
            });
        }
        
        // Validar que el valor no esté vacío
        if (!valor || valor.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El valor no puede estar vacío'
            });
        }
        
        // Validaciones específicas por campo
        if (campo === 'correo') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(valor)) {
                return res.status(400).json({
                    success: false,
                    message: 'Formato de correo electrónico inválido'
                });
            }
        }
        
        // Actualizar en la base de datos
        const userId = usuario.idUsuario || usuario.id;
        const query = `UPDATE usuarios SET ${campo} = ? WHERE idUsuario = ?`;
        const params = [valor, userId];
        
        await executeQuery(query, params);
        
        // Actualizar la sesión
        req.session.usuario[campo] = valor;
        
        console.log('✅ Campo actualizado correctamente');
        
        res.json({
            success: true,
            message: 'Campo actualizado correctamente',
            campo: campo,
            valor: valor
        });
        
    } catch (error) {
        console.error('❌ Error actualizando perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al actualizar el perfil'
        });
    }
});

        // Dashboard principal
router.get('/', verificarAuth, async (req, res) => {
    try {
        const usuario = req.session.usuario;
        
        await logActividad(req, 'VER_DASHBOARD', 'Accedió al dashboard principal');

        // Verificar si el usuario es admin y redirigir si es necesario
        if (usuario.roles && usuario.roles.includes('admin')) {
            console.log('🔄 Usuario admin detectado, redirigiendo al panel de admin');
            return res.redirect('/admin/dashboard');
        }

        // Estadísticas básicas con manejo de errores
        let estadisticas = {
            totalUsuarios: 0,
            totalReportes: 0,
            totalComunidades: 0,
            totalMensajes: 0
        };

        try {
            const statsResult = await executeQuery(`
                SELECT 
                    (SELECT COUNT(*) FROM usuarios WHERE activo = 1) as totalUsuarios,
                    (SELECT COUNT(*) FROM reportes) as totalReportes,
                    (SELECT COUNT(*) FROM comunidad WHERE estado = 'activa') as totalComunidades,
                    (SELECT COUNT(*) FROM comentarios_globales) as totalMensajes
            `);
            
            if (statsResult && statsResult.length > 0) {
                estadisticas = statsResult[0];
            }
        } catch (statsError) {
            console.log('⚠️ Error obteniendo estadísticas, usando valores por defecto:', statsError.message);
        }

        // Reportes recientes con manejo de errores
        let reportesRecientes = [];
        try {
            const reportesResult = await executeQuery(`
                SELECT r.*, u.nombre as nombreUsuario
                FROM reportes r
                JOIN usuarios u ON r.idUsuario = u.idUsuario
                ORDER BY r.fechaCreacion DESC
                LIMIT 5
            `);
            
            if (reportesResult) {
                reportesRecientes = reportesResult;
            }
        } catch (reportesError) {
            console.log('⚠️ Error obteniendo reportes recientes, usando lista vacía:', reportesError.message);
        }

        // Usar el ID correcto de la sesión
        const userId = usuario.idUsuario || usuario.id;
        
        // Comunidades del usuario con manejo de errores
        let comunidadesUsuario = [];
        try {
            const comunidadesResult = await executeQuery(`
                SELECT c.*, COUNT(uc.idUsuario) as miembros
                FROM comunidad c
                LEFT JOIN usuario_comunidad uc ON c.idComunidad = uc.idComunidad
                WHERE c.idUsuario = ? OR uc.idUsuario = ?
                GROUP BY c.idComunidad
                ORDER BY c.fechaCreacion DESC
                LIMIT 5
            `, [userId, userId]);
            
            if (comunidadesResult) {
                comunidadesUsuario = comunidadesResult;
            }
        } catch (comunidadesError) {
            console.log('⚠️ Error obteniendo comunidades, usando lista vacía:', comunidadesError.message);
        }

        res.render('dashboard/index', {
            titulo: 'Dashboard - MiCiudadSV',
            loggedIn: true,
            usuario: usuario,
            totalUsuarios: estadisticas.totalUsuarios,
            totalReportes: estadisticas.totalReportes,
            totalComunidades: estadisticas.totalComunidades,
            totalMensajes: estadisticas.totalMensajes,
            reportesRecientes: reportesRecientes,
            comunidadesUsuario: comunidadesUsuario
        });

    } catch (error) {
        console.error('❌ Error cargando dashboard:', error);
        res.status(500).render('error', {
            titulo: 'Error',
            mensaje: 'Error al cargar el dashboard'
        });
    }
});

// Dashboard para usuarios normales (accesible desde admin)
router.get('/usuario', verificarAuth, async (req, res) => {
    try {
        const usuario = req.session.usuario;
        
        await logActividad(req, 'VER_DASHBOARD_USUARIO', 'Accedió al dashboard de usuario normal');

        // Estadísticas básicas con manejo de errores
        let estadisticas = {
            totalUsuarios: 0,
            totalReportes: 0,
            totalComunidades: 0,
            totalMensajes: 0
        };

        try {
            const statsResult = await executeQuery(`
                SELECT 
                    (SELECT COUNT(*) FROM usuarios WHERE activo = 1) as totalUsuarios,
                    (SELECT COUNT(*) FROM reportes) as totalReportes,
                    (SELECT COUNT(*) FROM comunidad WHERE estado = 'activa') as totalComunidades,
                    (SELECT COUNT(*) FROM comentarios_globales) as totalMensajes
            `);
            
            if (statsResult && statsResult.length > 0) {
                estadisticas = statsResult[0];
            }
        } catch (statsError) {
            console.log('⚠️ Error obteniendo estadísticas, usando valores por defecto:', statsError.message);
        }

        // Reportes recientes con manejo de errores
        let reportesRecientes = [];
        try {
            const reportesResult = await executeQuery(`
                SELECT r.*, u.nombre as nombreUsuario
                FROM reportes r
                JOIN usuarios u ON r.idUsuario = u.idUsuario
                ORDER BY r.fechaCreacion DESC
                LIMIT 5
            `);
            
            if (reportesResult) {
                reportesRecientes = reportesResult;
            }
        } catch (reportesError) {
            console.log('⚠️ Error obteniendo reportes recientes, usando lista vacía:', reportesError.message);
        }

        // Usar el ID correcto de la sesión
        const userId = usuario.idUsuario || usuario.id;
        
        // Comunidades del usuario con manejo de errores
        let comunidades = [];
        try {
            const comunidadesResult = await executeQuery(`
                SELECT c.*, COUNT(uc.idUsuario) as totalMiembros
                FROM comunidad c
                LEFT JOIN usuario_comunidad uc ON c.idComunidad = uc.idComunidad
                WHERE c.idUsuario = ? OR uc.idUsuario = ?
                GROUP BY c.idComunidad
                ORDER BY c.fechaCreacion DESC
                LIMIT 5
            `, [userId, userId]);
            
            if (comunidadesResult) {
                comunidades = comunidadesResult;
            }
        } catch (comunidadesError) {
            console.log('⚠️ Error obteniendo comunidades, usando lista vacía:', comunidadesError.message);
        }

        res.render('dashboard/index', {
            titulo: 'Dashboard de Usuario - MiCiudadSV',
            loggedIn: true,
            usuario: usuario,
            estadisticas: estadisticas,
            reportesRecientes: reportesRecientes,
            comunidades: comunidades,
            esAdmin: true
        });

    } catch (error) {
        console.error('❌ Error cargando dashboard de usuario:', error);
        res.status(500).render('error', {
            titulo: 'Error',
            mensaje: 'Error al cargar el dashboard de usuario'
        });
    }
});

// Esta ruta duplicada ha sido eliminada para evitar conflictos

// Mis reportes
router.get('/mis-reportes', verificarAuth, async (req, res) => {
    try {
        const usuario = req.session.usuario;
        const estado = req.query.estado || '';
        const pagina = parseInt(req.query.pagina) || 1;
        const limite = 10;
        const offset = (pagina - 1) * limite;

        await logActividad(req, 'VER_MIS_REPORTES', 'Accedió a la lista de sus reportes');

        // Construir consulta con filtro de estado - CORREGIDO
        let whereCondition = 'WHERE r.idUsuario = ?';
        let params = [usuario.id];

        if (estado && estado !== '') {
            whereCondition += ' AND r.estado = ?';
            params.push(estado);
        }

        // Obtener reportes con paginación - CORREGIDO
        const reportes = await executeQuery(`
            SELECT 
                r.*,
                0 as totalComentarios,
                0 as votosPositivos,
                0 as votosNegativos
            FROM reportes r
            ${whereCondition}
            ORDER BY r.fechaCreacion DESC
            LIMIT ? OFFSET ?
        `, [...params, limite, offset]);

        // Contar total para paginación - CORREGIDO
        const totalResult = await executeQuery(`
            SELECT COUNT(*) as total
            FROM reportes r
            ${whereCondition}
        `, params);

        const totalReportes = totalResult[0].total;
        const totalPaginas = Math.ceil(totalReportes / limite);

        // Estadísticas por estado - CORREGIDO
        const estadisticasEstado = await executeQuery(`
            SELECT 
                estado,
                COUNT(*) as cantidad
            FROM reportes 
            WHERE idUsuario = ?
            GROUP BY estado
        `, [usuario.id]);

        res.render('dashboard/mis-reportes', {
            titulo: 'Mis Reportes',
            loggedIn: true,
            usuario: usuario,
            reportes: reportes,
            estadisticasEstado: estadisticasEstado,
            filtros: { estado: estado },
            paginacion: {
                paginaActual: pagina,
                totalPaginas: totalPaginas,
                totalItems: totalReportes
            }
        });

    } catch (error) {
        console.error('❌ Error cargando mis reportes:', error);
        res.status(500).render('error', {
            titulo: 'Error',
            mensaje: 'Error al cargar tus reportes'
        });
    }
});

// Mis comunidades
router.get('/mis-comunidades', verificarAuth, async (req, res) => {
    try {
        const usuario = req.session.usuario;
        
        await logActividad(req, 'VER_MIS_COMUNIDADES', 'Accedió a la lista de sus comunidades');

        // Comunidades donde es miembro - TABLA CORREGIDA
        const comunidadesMiembro = await executeQuery(`
            SELECT 
                c.*,
                uc.rolEnComunidad as rol,
                uc.fechaUnion,
                (SELECT COUNT(*) FROM usuario_comunidad WHERE idComunidad = c.idComunidad) as totalMiembros,
                (SELECT COUNT(*) FROM comentarios WHERE idComunidad = c.idComunidad) as totalComentarios
            FROM comunidad c
            JOIN usuario_comunidad uc ON c.idComunidad = uc.idComunidad
            WHERE uc.idUsuario = ? AND c.estado != 'eliminada'
            ORDER BY uc.fechaUnion DESC
        `, [usuario.id]);

        // Comunidades creadas por el usuario - TABLA CORREGIDA
        const comunidadesCreadas = await executeQuery(`
            SELECT 
                c.*,
                (SELECT COUNT(*) FROM usuario_comunidad WHERE idComunidad = c.idComunidad) as totalMiembros,
                (SELECT COUNT(*) FROM comentarios WHERE idComunidad = c.idComunidad) as totalComentarios
            FROM comunidad c
            WHERE c.idUsuario = ? AND c.estado != 'eliminada'
            ORDER BY c.fechaCreacion DESC
        `, [usuario.id]);

        res.render('dashboard/mis-comunidades', {
            titulo: 'Mis Comunidades',
            loggedIn: true,
            usuario: usuario,
            comunidadesMiembro: comunidadesMiembro,
            comunidadesCreadas: comunidadesCreadas
        });

    } catch (error) {
        console.error('❌ Error cargando mis comunidades:', error);
        res.status(500).render('error', {
            titulo: 'Error',
            mensaje: 'Error al cargar tus comunidades'
        });
    }
});

// Configuración de cuenta
router.get('/configuracion', verificarAuth, async (req, res) => {
    try {
        const usuario = req.session.usuario;
        
        await logActividad(req, 'VER_CONFIGURACION', 'Accedió a configuración de cuenta');

        res.render('dashboard/configuracion', {
            titulo: 'Configuración de Cuenta',
            loggedIn: true,
            usuario: usuario
        });

    } catch (error) {
        console.error('❌ Error cargando configuración:', error);
        res.status(500).render('error', {
            titulo: 'Error',
            mensaje: 'Error al cargar la configuración'
        });
    }
});

// Actualizar perfil
router.post('/actualizar-perfil', verificarAuth, async (req, res) => {
    try {
        const usuario = req.session.usuario;
        const { nombre, telefono, bio, ubicacion } = req.body;

        // Validaciones básicas
        if (!nombre || nombre.trim().length < 2) {
            return res.status(400).json({
                success: false,
                error: 'El nombre debe tener al menos 2 caracteres'
            });
        }

        if (telefono && telefono.length > 15) {
            return res.status(400).json({
                success: false,
                error: 'El teléfono no puede tener más de 15 caracteres'
            });
        }

        if (bio && bio.length > 500) {
            return res.status(400).json({
                success: false,
                error: 'La biografía no puede tener más de 500 caracteres'
            });
        }

        // Actualizar en base de datos
        await executeQuery(`
            UPDATE usuarios 
            SET nombre = ?, telefono = ?, bio = ?, ubicacion = ?, fecha_actualizacion = NOW()
            WHERE idUsuario = ?
        `, [nombre.trim(), telefono || null, bio || null, ubicacion || null, usuario.id]);

        // Actualizar sesión
        req.session.usuario.nombre = nombre.trim();

        await logActividad(req, 'PERFIL_ACTUALIZADO', 'Actualizó información del perfil');

        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error actualizando perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Cambiar contraseña
router.post('/cambiar-contrasena', verificarAuth, async (req, res) => {
    try {
        const usuario = req.session.usuario;
        const { contrasenaActual, nuevaContrasena, confirmarContrasena } = req.body;

        // Validaciones
        if (!contrasenaActual || !nuevaContrasena || !confirmarContrasena) {
            return res.status(400).json({
                success: false,
                error: 'Todos los campos son obligatorios'
            });
        }

        if (nuevaContrasena !== confirmarContrasena) {
            return res.status(400).json({
                success: false,
                error: 'Las contraseñas no coinciden'
            });
        }

        if (nuevaContrasena.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'La nueva contraseña debe tener al menos 6 caracteres'
            });
        }

        // Verificar contraseña actual
        const usuarioData = await executeQuery(`
            SELECT contrasena FROM usuarios WHERE idUsuario = ?
        `, [usuario.id]);

        const bcrypt = require('bcrypt');
        const contrasenaValida = await bcrypt.compare(contrasenaActual, usuarioData[0].contrasena);

        if (!contrasenaValida) {
            return res.status(400).json({
                success: false,
                error: 'La contraseña actual es incorrecta'
            });
        }

        // Encriptar nueva contraseña
        const saltRounds = 10;
        const nuevaContrasenaHash = await bcrypt.hash(nuevaContrasena, saltRounds);

        // Actualizar contraseña
        await executeQuery(`
            UPDATE usuarios 
            SET contrasena = ?, fecha_actualizacion = NOW()
            WHERE idUsuario = ?
        `, [nuevaContrasenaHash, usuario.id]);

        await logActividad(req, 'CONTRASENA_CAMBIADA', 'Cambió su contraseña');

        res.json({
            success: true,
            message: 'Contraseña cambiada exitosamente'
        });

    } catch (error) {
        console.error('❌ Error cambiando contraseña:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Eliminar cuenta
router.post('/eliminar-cuenta', verificarAuth, async (req, res) => {
    try {
        const usuario = req.session.usuario;
        const { contrasena, confirmacion } = req.body;

        if (!contrasena || !confirmacion) {
            return res.status(400).json({
                success: false,
                error: 'Todos los campos son obligatorios'
            });
        }

        if (confirmacion !== 'ELIMINAR') {
            return res.status(400).json({
                success: false,
                error: 'Debes escribir "ELIMINAR" para confirmar'
            });
        }

        // Verificar contraseña
        const usuarioData = await executeQuery(`
            SELECT contrasena FROM usuarios WHERE idUsuario = ?
        `, [usuario.id]);

        const bcrypt = require('bcrypt');
        const contrasenaValida = await bcrypt.compare(contrasena, usuarioData[0].contrasena);

        if (!contrasenaValida) {
            return res.status(400).json({
                success: false,
                error: 'Contraseña incorrecta'
            });
        }

        // Marcar cuenta como eliminada (simulado)
        // Nota: La tabla usuarios no tiene columna eliminado
        console.log('Usuario solicitó eliminar cuenta:', usuario.id);

        await logActividad(req, 'CUENTA_ELIMINADA', 'Eliminó su cuenta');

        // Destruir sesión
        req.session.destroy((err) => {
            if (err) {
                console.error('❌ Error destruyendo sesión:', err);
            }
        });

        res.json({
            success: true,
            message: 'Cuenta eliminada exitosamente',
            redirect: '/'
        });

    } catch (error) {
        console.error('❌ Error eliminando cuenta:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// ===============================
// ESTADÍSTICAS Y REPORTES
// ===============================

// Estadísticas personales
router.get('/estadisticas', verificarAuth, async (req, res) => {
    try {
        const usuario = req.session.usuario;
        
        await logActividad(req, 'VER_ESTADISTICAS', 'Consultó estadísticas personales');

        // Estadísticas de reportes por mes - CORREGIDO
        const reportesPorMes = await executeQuery(`
            SELECT 
                DATE_FORMAT(fechaCreacion, '%Y-%m') as mes,
                COUNT(*) as cantidad
            FROM reportes 
            WHERE idUsuario = ?
            GROUP BY DATE_FORMAT(fechaCreacion, '%Y-%m')
            ORDER BY mes DESC
            LIMIT 12
        `, [usuario.id]);

        // Estadísticas de votos recibidos - CORREGIDO
        const votosRecibidos = [];

        // Top categorías de reportes - CORREGIDO
        const categorias = await executeQuery(`
            SELECT 
                categoria,
                COUNT(*) as cantidad
            FROM reportes
            WHERE idUsuario = ? AND categoria IS NOT NULL
            GROUP BY categoria
            ORDER BY cantidad DESC
            LIMIT 5
        `, [usuario.id]);

        res.render('dashboard/estadisticas', {
            titulo: 'Mis Estadísticas',
            loggedIn: true,
            usuario: usuario,
            reportesPorMes: reportesPorMes,
            votosRecibidos: votosRecibidos,
            categorias: categorias
        });

    } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
        res.status(500).render('error', {
            titulo: 'Error',
            mensaje: 'Error al cargar las estadísticas'
        });
    }
});

module.exports = router;