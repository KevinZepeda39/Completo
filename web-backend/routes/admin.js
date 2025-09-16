// routes/admin.js - ROUTER COMPLETO
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { executeQuery } = require('../config/database');
const { verificarAdmin } = require('../middleware/admin');
const fs = require('fs');
const path = require('path');

// ============================================================================
// APLICAR MIDDLEWARE A TODAS LAS RUTAS DE ADMIN
// ============================================================================
router.use(verificarAdmin);

// ============================================================================
// RUTA PRINCIPAL DEL DASHBOARD
// ============================================================================
router.get('/', async (req, res) => {
    try {
        console.log('🏠 Accediendo al dashboard admin');
        
        // Obtener estadísticas generales
        const estadisticas = await obtenerEstadisticas();
        
        res.render('admin/dashboard', {
            titulo: 'Dashboard - Admin Panel',
            usuario: req.session.usuario,
            estadisticas: estadisticas
        });
        
    } catch (error) {
        console.error('❌ Error en dashboard admin:', error);
        res.status(500).render('error', {
            mensaje: 'Error cargando el dashboard',
            error: { status: 500 }
        });
    }
});

// ============================================================================
// RUTAS DE VISTAS PRINCIPALES
// ============================================================================

// Ruta para Usuarios
router.get('/usuarios', async (req, res) => {
    try {
        console.log('👥 Accediendo a gestión de usuarios');
        
        // Obtener usuarios con sus roles
        const usuarios = await executeQuery(`
            SELECT 
                u.idUsuario,
                u.nombre,
                u.correo,
                u.fechaCreacion,
                u.fechaActualizacion,
                u.activo,
                GROUP_CONCAT(r.nombreRol) as roles
            FROM usuarios u
            LEFT JOIN usuario_rol ur ON u.idUsuario = ur.idUsuario
            LEFT JOIN roles r ON ur.idRol = r.idRol
            GROUP BY u.idUsuario
            ORDER BY u.fechaCreacion DESC
        `);
        
        // Obtener todos los roles disponibles
        const roles = await executeQuery(`
            SELECT idRol, nombreRol, descripcion
            FROM roles
            ORDER BY nombreRol
        `);
        
        res.render('admin/usuarios', {
            titulo: 'Gestión de Usuarios - Admin Panel',
            usuario: req.session.usuario,
            usuarios: usuarios,
            roles: roles
        });
        
    } catch (error) {
        console.error('❌ Error cargando usuarios:', error);
        res.status(500).render('error', {
            mensaje: 'Error cargando usuarios',
            error: { status: 500 }
        });
    }
});

// ============================================================================
// ACCIONES DE USUARIOS
// ============================================================================

// Eliminar usuario
router.post('/usuarios/eliminar', async (req, res) => {
    try {
        const { idUsuario } = req.body;
        
        if (!idUsuario) {
            return res.json({
                success: false,
                error: 'ID de usuario requerido'
            });
        }
        
        console.log(`🗑️ Eliminando usuario ID: ${idUsuario}`);
        
        // Verificar que no se elimine a sí mismo
        if (parseInt(idUsuario) === req.session.usuario.id) {
            return res.json({
                success: false,
                error: 'No puedes eliminar tu propia cuenta'
            });
        }
        
        // Eliminar roles del usuario primero
        await executeQuery('DELETE FROM usuario_rol WHERE idUsuario = ?', [idUsuario]);
        
        // Eliminar usuario
        await executeQuery('DELETE FROM usuarios WHERE idUsuario = ?', [idUsuario]);
        
        console.log('✅ Usuario eliminado exitosamente');
        
        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error eliminando usuario:', error);
        res.json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Cambiar rol de usuario
router.post('/usuarios/cambiar-rol', async (req, res) => {
    try {
        const { idUsuario, idRol } = req.body;
        
        if (!idUsuario) {
            return res.json({
                success: false,
                error: 'ID de usuario requerido'
            });
        }
        
        console.log(`🔄 Cambiando rol del usuario ID: ${idUsuario} a rol ID: ${idRol}`);
        
        // Verificar que no se modifique a sí mismo
        if (parseInt(idUsuario) === req.session.usuario.id) {
            return res.json({
                success: false,
                error: 'No puedes cambiar tu propio rol'
            });
        }
        
        // Eliminar roles actuales del usuario
        await executeQuery('DELETE FROM usuario_rol WHERE idUsuario = ?', [idUsuario]);
        
        // Si se seleccionó un rol válido, asignarlo
        if (idRol && idRol !== '0') {
            await executeQuery('INSERT INTO usuario_rol (idUsuario, idRol) VALUES (?, ?)', [idUsuario, idRol]);
            console.log('✅ Rol asignado exitosamente');
        } else {
            console.log('ℹ️ Usuario sin rol asignado');
        }
        
        res.json({
            success: true,
            message: 'Rol actualizado exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error cambiando rol:', error);
        res.json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Obtener roles de un usuario específico
router.get('/usuarios/:id/roles', async (req, res) => {
    try {
        const { id } = req.params;
        
        const rolesUsuario = await executeQuery(`
            SELECT ur.idRol
            FROM usuario_rol ur
            WHERE ur.idUsuario = ?
        `, [id]);
        
        const rolesIds = rolesUsuario.map(r => r.idRol);
        
        res.json({
            success: true,
            roles: rolesIds
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo roles del usuario:', error);
        res.json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Obtener datos de un usuario específico para edición
router.get('/usuarios/:id/editar', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Obtener datos del usuario
        const usuario = await executeQuery(`
            SELECT idUsuario, nombre, correo, fechaCreacion, activo
            FROM usuarios 
            WHERE idUsuario = ?
        `, [id]);
        
        if (usuario.length === 0) {
            return res.status(404).render('error', {
                titulo: 'Usuario no encontrado',
                mensaje: 'El usuario que buscas no existe.',
                loggedIn: true,
                usuario: req.session.usuario
            });
        }
        
        // Obtener roles del usuario
        const rolesUsuario = await executeQuery(`
            SELECT ur.idRol, r.nombreRol
            FROM usuario_rol ur
            JOIN roles r ON ur.idRol = r.idRol
            WHERE ur.idUsuario = ?
        `, [id]);
        
        // Obtener todos los roles disponibles
        const roles = await executeQuery(`
            SELECT idRol, nombreRol, descripcion
            FROM roles
            ORDER BY nombreRol
        `);
        
        // Preparar datos del usuario para la vista
        const usuarioData = {
            ...usuario[0],
            id: usuario[0].idUsuario,
            roles: rolesUsuario
        };
        
        res.render('admin/editar-usuario', {
            titulo: `Editar Usuario - ${usuarioData.nombre}`,
            usuario: req.session.usuario,
            usuarioData: usuarioData,
            roles: roles
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo datos del usuario:', error);
        res.status(500).render('error', {
            titulo: 'Error',
            mensaje: 'Error al cargar los datos del usuario',
            loggedIn: true,
            usuario: req.session.usuario
        });
    }
});

// Actualizar datos de un usuario
router.post('/usuarios/:id/actualizar', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, correo, contraseña, idRol } = req.body;
        
        console.log(`✏️ Actualizando usuario ID: ${id}`);
        
        // Validaciones básicas
        if (!nombre || nombre.trim().length < 2) {
            return res.json({
                success: false,
                error: 'El nombre debe tener al menos 2 caracteres'
            });
        }
        
        if (!correo || !correo.includes('@')) {
            return res.json({
                success: false,
                error: 'El correo electrónico no es válido'
            });
        }
        
        // Verificar que no se modifique a sí mismo
        if (parseInt(id) === req.session.usuario.id) {
            return res.json({
                success: false,
                error: 'No puedes modificar tu propia cuenta desde aquí'
            });
        }
        
        // Verificar que el correo no esté duplicado (excluyendo el usuario actual)
        const correoExistente = await executeQuery(`
            SELECT idUsuario FROM usuarios 
            WHERE correo = ? AND idUsuario != ?
        `, [correo, id]);
        
        if (correoExistente.length > 0) {
            return res.json({
                success: false,
                error: 'El correo electrónico ya está en uso por otro usuario'
            });
        }
        
        // Construir query de actualización
        let updateQuery = 'UPDATE usuarios SET nombre = ?, correo = ?, fechaActualizacion = NOW()';
        let params = [nombre.trim(), correo.trim()];
        
        // Si se proporciona contraseña, incluirla en la actualización
        if (contraseña && contraseña.trim().length > 0) {
            if (contraseña.trim().length < 6) {
                return res.json({
                    success: false,
                    error: 'La contraseña debe tener al menos 6 caracteres'
                });
            }
            
            console.log('🔐 Hasheando nueva contraseña...');
            // Hashear la contraseña antes de guardarla
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(contraseña.trim(), saltRounds);
            console.log('✅ Contraseña hasheada correctamente');
            console.log('   - Hash generado:', hashedPassword.substring(0, 20) + '...');
            
            updateQuery += ', contraseña = ?';
            params.push(hashedPassword);
        }
        
        updateQuery += ' WHERE idUsuario = ?';
        params.push(id);
        
        // Actualizar datos del usuario
        await executeQuery(updateQuery, params);
        
        // Si se proporciona un nuevo rol, actualizarlo
        if (idRol !== undefined) {
            // Eliminar roles actuales
            await executeQuery('DELETE FROM usuario_rol WHERE idUsuario = ?', [id]);
            
            // Asignar nuevo rol si no es 0
            if (idRol && idRol !== '0') {
                await executeQuery('INSERT INTO usuario_rol (idUsuario, idRol) VALUES (?, ?)', [id, idRol]);
            }
        }
        
        console.log('✅ Usuario actualizado exitosamente');
        
        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error actualizando usuario:', error);
        res.json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Ruta para Reportes
router.get('/reportes', async (req, res) => {
    try {
        console.log('📋 Accediendo a gestión de reportes');
        
        // Obtener reportes con información del usuario
        const reportes = await executeQuery(`
            SELECT 
                r.*,
                u.nombre as usuarioNombre,
                u.correo as usuarioEmail
            FROM reportes r
            LEFT JOIN usuarios u ON r.idUsuario = u.idUsuario
            ORDER BY r.fechaCreacion DESC
            LIMIT 100
        `);
        
        // Obtener usuarios para asignación
        const usuarios = await executeQuery(`
            SELECT idUsuario, nombre, correo
            FROM usuarios
            WHERE activo = 1
            ORDER BY nombre
        `);
        
        res.render('admin/reportes', {
            titulo: 'Gestión de Reportes - Admin Panel',
            usuario: req.session.usuario,
            reportes: reportes,
            usuarios: usuarios
        });
        
    } catch (error) {
        console.error('❌ Error cargando reportes:', error);
        res.status(500).render('error', {
            mensaje: 'Error cargando reportes',
            error: { status: 500 }
        });
    }
});

// Ruta para Comunidades
router.get('/comunidades', async (req, res) => {
    try {
        console.log('🏘️ Accediendo a gestión de comunidades');
        
        // Obtener filtros de la URL
        const { estado = 'todas', categoria = 'todas', buscar = '', page = 1 } = req.query;
        const limit = 15;
        const offset = (page - 1) * limit;
        
        // Construir consulta base
        let whereConditions = ['1=1']; // Condición base que siempre es verdadera
        let params = [];
        
        // Aplicar filtros
        if (estado && estado !== 'todas') {
            whereConditions.push('c.estado = ?');
            params.push(estado);
        }
        
        if (categoria && categoria !== 'todas') {
            whereConditions.push('c.categoria = ?');
            params.push(categoria);
        }
        
        if (buscar && buscar.trim()) {
            whereConditions.push('(c.titulo LIKE ? OR c.descripcion LIKE ? OR u.nombre LIKE ?)');
            const searchTerm = `%${buscar.trim()}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        const whereClause = whereConditions.join(' AND ');
        
        // Obtener comunidades con información del creador
        const comunidades = await executeQuery(`
            SELECT 
                c.idComunidad as id,
                c.titulo,
                c.descripcion,
                c.categoria,
                c.tags,
                c.fechaCreacion,
                c.estado,
                u.nombre as creadorNombre,
                u.idUsuario as creadorId,
                (SELECT COUNT(*) FROM comentarios co WHERE co.idComunidad = c.idComunidad) as totalComentarios,
                (SELECT COUNT(*) FROM usuario_comunidad uc WHERE uc.idComunidad = c.idComunidad) as totalMiembros
            FROM comunidad c 
            LEFT JOIN usuarios u ON c.idUsuario = u.idUsuario 
            WHERE ${whereClause}
            ORDER BY c.fechaCreacion DESC
            LIMIT ${limit} OFFSET ${offset}
        `, params);
        
        // Contar total para paginación
        const countQuery = `
            SELECT COUNT(*) as total
            FROM comunidad c 
            LEFT JOIN usuarios u ON c.idUsuario = u.idUsuario 
            WHERE ${whereClause}
        `;
        const countResult = await executeQuery(countQuery, params);
        const totalComunidades = countResult[0].total;
        const totalPages = Math.ceil(totalComunidades / limit);
        
        // Obtener estadísticas
        const estadisticas = await executeQuery(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN estado = 'activa' THEN 1 END) as activas,
                COUNT(CASE WHEN estado = 'suspendida' THEN 1 END) as suspendidas,
                COUNT(CASE WHEN estado = 'eliminada' THEN 1 END) as eliminadas
            FROM comunidad
        `);
        
        res.render('admin/comunidades', {
            titulo: 'Gestión de Comunidades - Admin Panel',
            loggedIn: true,
            usuario: req.session.usuario,
            comunidades: comunidades,
            estadisticas: estadisticas[0],
            filtros: { estado, categoria, buscar },
            paginacion: {
                currentPage: parseInt(page),
                totalPages: totalPages,
                totalComunidades: totalComunidades,
                hasNext: page < totalPages,
                hasPrev: page > 1,
                nextPage: parseInt(page) + 1,
                prevPage: parseInt(page) - 1
            }
        });
        
    } catch (error) {
        console.error('❌ Error cargando comunidades:', error);
        res.status(500).render('error', {
            titulo: 'Error',
            mensaje: 'Error cargando comunidades: ' + error.message,
            loggedIn: true,
            usuario: req.session.usuario
        });
    }
});

// ============================================================================
// RUTA PARA EDITAR REPORTE
// ============================================================================

router.get('/editar-reporte', verificarAdmin, async (req, res) => {
    try {
        const reporteId = req.query.id;
        if (!reporteId) {
            return res.status(400).render('error', {
                mensaje: 'ID de reporte no proporcionado',
                error: { status: 400, stack: 'ID de reporte requerido' }
            });
        }

        res.render('admin/editar-reporte', {
            titulo: 'Editar Reporte - Admin Panel',
            usuario: req.session.usuario,
            reporteId: reporteId
        });
        
    } catch (error) {
        console.error('❌ Error cargando página de edición:', error);
        res.status(500).render('error', {
            mensaje: 'Error cargando página de edición',
            error: error
        });
    }
});

// ============================================================================
// RUTAS API PARA ADMINISTRACIÓN DE REPORTES
// ============================================================================

// API para obtener detalles de un reporte específico
router.get('/api/reportes/:id/detalles', async (req, res) => {
    try {
        const reporteId = parseInt(req.params.id);
        
        const reporte = await executeQuery(`
            SELECT 
                r.*,
                u.nombre as usuarioNombre,
                u.correo as usuarioEmail
            FROM reportes r
            LEFT JOIN usuarios u ON r.idUsuario = u.idUsuario
            WHERE r.idReporte = ?
        `, [reporteId]);
        
        if (reporte.length === 0) {
            return res.json({
                success: false,
                error: 'Reporte no encontrado'
            });
        }
        
        res.json({
            success: true,
            reporte: reporte[0]
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo detalles del reporte:', error);
        res.json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// API para cambiar estado de reporte
router.post('/api/reportes/:id/estado', async (req, res) => {
    try {
        const reporteId = parseInt(req.params.id);
        const { nuevoEstado, comentarioAdmin } = req.body;
        
        console.log(`🔄 Cambiando estado del reporte ${reporteId} a ${nuevoEstado}`);
        
        // Validar estados permitidos
        const estadosValidos = ['pendiente', 'en_progreso', 'completado', 'rechazado'];
        if (!estadosValidos.includes(nuevoEstado)) {
            return res.json({
                success: false,
                error: 'Estado no válido'
            });
        }
        
        // Verificar que el reporte existe
        const reporteExiste = await executeQuery('SELECT titulo FROM reportes WHERE idReporte = ?', [reporteId]);
        if (reporteExiste.length === 0) {
            return res.json({
                success: false,
                error: 'Reporte no encontrado'
            });
        }
        
        // Actualizar estado
        await executeQuery(`
            UPDATE reportes 
            SET estado = ?, fechaActualizacion = NOW()
            WHERE idReporte = ?
        `, [nuevoEstado, reporteId]);
        
        // Registrar la acción en logs si existe la tabla
        try {
            await executeQuery(`
                INSERT INTO logs_actividad (accion, descripcion, detalles, usuario, fecha, ip)
                VALUES (?, ?, ?, ?, NOW(), ?)
            `, [
                'ADMIN_CAMBIO_ESTADO_REPORTE',
                `Estado de reporte cambiado a ${nuevoEstado}`,
                `Reporte ID: ${reporteId}, Comentario: ${comentarioAdmin || 'No especificado'}`,
                req.session.usuario.nombre,
                req.ip
            ]);
        } catch (logError) {
            console.log('⚠️ No se pudo registrar en logs:', logError.message);
        }
        
        res.json({
            success: true,
            mensaje: `Estado cambiado a ${nuevoEstado} exitosamente`
        });
        
    } catch (error) {
        console.error('❌ Error cambiando estado del reporte:', error);
        res.json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// API para eliminar reporte
router.post('/api/reportes/:id/eliminar', async (req, res) => {
    try {
        const reporteId = parseInt(req.params.id);
        const { razon } = req.body;
        
        console.log(`🗑️ Eliminando reporte ID: ${reporteId}`);
        
        // Verificar que el reporte existe
        const reporteExiste = await executeQuery('SELECT titulo, imagenUrl FROM reportes WHERE idReporte = ?', [reporteId]);
        if (reporteExiste.length === 0) {
            return res.json({
                success: false,
                error: 'Reporte no encontrado'
            });
        }
        
        // Eliminar imagen si existe
        if (reporteExiste[0].imagenUrl) {
            try {
                const imagePath = path.join(__dirname, '../public', reporteExiste[0].imagenUrl);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                    console.log('✅ Imagen eliminada del servidor');
                }
            } catch (imageError) {
                console.log('⚠️ No se pudo eliminar la imagen:', imageError.message);
            }
        }
        
        // Eliminar reporte de la base de datos
        await executeQuery('DELETE FROM reportes WHERE idReporte = ?', [reporteId]);
        
        // Registrar la acción en logs si existe la tabla
        try {
            await executeQuery(`
                INSERT INTO logs_actividad (accion, descripcion, detalles, usuario, fecha, ip)
                VALUES (?, ?, ?, ?, NOW(), ?)
            `, [
                'ADMIN_ELIMINAR_REPORTE',
                `Reporte eliminado: ${reporteExiste[0].titulo}`,
                `Reporte ID: ${reporteId}, Razón: ${razon || 'No especificada'}`,
                req.session.usuario.nombre,
                req.ip
            ]);
        } catch (logError) {
            console.log('⚠️ No se pudo registrar en logs:', logError.message);
        }
        
        console.log('✅ Reporte eliminado exitosamente');
        
        res.json({
            success: true,
            message: 'Reporte eliminado exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error eliminando reporte:', error);
        res.json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// API para editar reporte
router.post('/api/reportes/:id/editar', async (req, res) => {
    try {
        const reporteId = parseInt(req.params.id);
        const { titulo, descripcion, categoria, ubicacion, latitud, longitud, estado } = req.body;
        
        console.log(`✏️ Editando reporte ID: ${reporteId}`);
        
        // Validaciones básicas
        if (!titulo || titulo.trim().length < 3) {
            return res.json({
                success: false,
                error: 'El título debe tener al menos 3 caracteres'
            });
        }
        
        if (!descripcion || descripcion.trim().length < 10) {
            return res.json({
                success: false,
                error: 'La descripción debe tener al menos 10 caracteres'
            });
        }
        
        if (!categoria) {
            return res.json({
                success: false,
                error: 'Debe seleccionar una categoría'
            });
        }
        
        const categoriasPermitidas = ['infraestructura', 'seguridad', 'emergencia', 'salud', 'general'];
        if (!categoriasPermitidas.includes(categoria)) {
            return res.json({
                success: false,
                error: 'Categoría no válida'
            });
        }
        
        // Verificar que el reporte existe
        const reporteExiste = await executeQuery('SELECT titulo FROM reportes WHERE idReporte = ?', [reporteId]);
        if (reporteExiste.length === 0) {
            return res.json({
                success: false,
                error: 'Reporte no encontrado'
            });
        }
        
        // Actualizar reporte
        await executeQuery(`
            UPDATE reportes 
            SET titulo = ?, descripcion = ?, categoria = ?, ubicacion = ?, 
                latitud = ?, longitud = ?, estado = ?, fechaActualizacion = NOW()
            WHERE idReporte = ?
        `, [
            titulo.trim(),
            descripcion.trim(),
            categoria,
            ubicacion ? ubicacion.trim() : null,
            latitud ? parseFloat(latitud) : null,
            longitud ? parseFloat(longitud) : null,
            estado,
            reporteId
        ]);
        
        // Registrar la acción en logs si existe la tabla
        try {
            await executeQuery(`
                INSERT INTO logs_actividad (accion, descripcion, detalles, usuario, fecha, ip)
                VALUES (?, ?, ?, ?, NOW(), ?)
            `, [
                'ADMIN_EDITAR_REPORTE',
                `Reporte editado: ${titulo.trim()}`,
                `Reporte ID: ${reporteId}, Categoría: ${categoria}`,
                req.session.usuario.nombre,
                req.ip
            ]);
        } catch (logError) {
            console.log('⚠️ No se pudo registrar en logs:', logError.message);
        }
        
        console.log('✅ Reporte editado exitosamente');
        
        res.json({
            success: true,
            message: 'Reporte editado exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error editando reporte:', error);
        res.json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// API para crear reporte desde admin (misma lógica que reportes.js)
router.post('/api/reportes/crear', async (req, res) => {
    try {
        const { titulo, descripcion, ubicacion, latitud, longitud, categoria, estado, idUsuario } = req.body;
        
        console.log('📝 Admin creando nuevo reporte');
        
        // Validaciones básicas
        if (!titulo || titulo.trim().length < 3) {
            return res.json({
                success: false,
                error: 'El título debe tener al menos 3 caracteres'
            });
        }
        
        if (!descripcion || descripcion.trim().length < 10) {
            return res.json({
                success: false,
                error: 'La descripción debe tener al menos 10 caracteres'
            });
        }
        
        if (!categoria) {
            return res.json({
                success: false,
                error: 'Debe seleccionar una categoría'
            });
        }
        
        const categoriasPermitidas = ['infraestructura', 'seguridad', 'emergencia', 'salud', 'general'];
        if (!categoriasPermitidas.includes(categoria)) {
            return res.json({
                success: false,
                error: 'Categoría no válida'
            });
        }
        
        if (!idUsuario) {
            return res.json({
                success: false,
                error: 'Debe seleccionar un usuario'
            });
        }
        
        // Verificar que el usuario existe
        const usuarioExiste = await executeQuery('SELECT nombre FROM usuarios WHERE idUsuario = ?', [idUsuario]);
        if (usuarioExiste.length === 0) {
            return res.json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
        
        // Preparar datos para inserción
        const categoriaFinal = categoria || 'general';
        const ubicacionFinal = ubicacion ? ubicacion.trim() : null;
        const latitudFinal = latitud ? parseFloat(latitud) : null;
        const longitudFinal = longitud ? parseFloat(longitud) : null;
        const estadoFinal = estado || 'pendiente';
        
        // Crear el reporte
        const insertResult = await executeQuery(`
            INSERT INTO reportes (
                titulo, 
                descripcion, 
                idUsuario, 
                ubicacion, 
                latitud, 
                longitud, 
                categoria, 
                estado, 
                fechaCreacion
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            titulo.trim(),
            descripcion.trim(),
            idUsuario,
            ubicacionFinal,
            latitudFinal,
            longitudFinal,
            categoriaFinal,
            estadoFinal
        ]);
        
        const reporteId = insertResult.insertId;
        
        // Log de actividad
        try {
            await executeQuery(`
                INSERT INTO logs_actividad (accion, descripcion, detalles, usuario, fecha, ip)
                VALUES (?, ?, ?, ?, NOW(), ?)
            `, [
                'ADMIN_CREAR_REPORTE',
                `Creó nuevo reporte: ${titulo.trim()}`,
                `Reporte ID: ${reporteId}, Categoría: ${categoria}, Usuario: ${usuarioExiste[0].nombre}`,
                req.session.usuario.nombre,
                req.ip
            ]);
        } catch (logError) {
            console.log('⚠️ No se pudo registrar en logs:', logError.message);
        }
        
        console.log('✅ Reporte creado exitosamente con ID:', reporteId);
        
        res.json({
            success: true,
            mensaje: 'Reporte creado exitosamente',
            reporteId: reporteId
        });
        
    } catch (error) {
        console.error('❌ Error creando reporte:', error);
        res.json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// ============================================================================
// RUTAS API PARA ADMINISTRACIÓN DE COMUNIDADES
// ============================================================================

// API para cambiar estado de comunidad
router.post('/comunidades/:id/estado', async (req, res) => {
    try {
        const comunidadId = parseInt(req.params.id);
        const { nuevoEstado, razon } = req.body;
        
        console.log(`🔄 Cambiando estado de comunidad ${comunidadId} a ${nuevoEstado}`);
        
        // Validar estados permitidos
        const estadosValidos = ['activa', 'suspendida', 'eliminada'];
        if (!estadosValidos.includes(nuevoEstado)) {
            return res.json({
                success: false,
                error: 'Estado no válido'
            });
        }
        
        // Verificar que la comunidad existe
        const comunidadExiste = await executeQuery('SELECT titulo FROM comunidad WHERE idComunidad = ?', [comunidadId]);
        if (comunidadExiste.length === 0) {
            return res.json({
                success: false,
                error: 'Comunidad no encontrada'
            });
        }
        
        // Actualizar estado
        await executeQuery(`
            UPDATE comunidad 
            SET estado = ? 
            WHERE idComunidad = ?
        `, [nuevoEstado, comunidadId]);
        
        // Registrar la acción en logs si existe la tabla
        try {
            await executeQuery(`
                INSERT INTO logs_actividad (accion, descripcion, detalles, usuario, fecha, ip)
                VALUES (?, ?, ?, ?, NOW(), ?)
            `, [
                'ADMIN_CAMBIO_ESTADO_COMUNIDAD',
                `Estado de comunidad cambiado a ${nuevoEstado}`,
                `Comunidad ID: ${comunidadId}, Razón: ${razon || 'No especificada'}`,
                req.session.usuario.nombre,
                req.ip
            ]);
        } catch (logError) {
            console.log('⚠️ No se pudo registrar en logs:', logError.message);
        }
        
        res.json({
            success: true,
            mensaje: `Estado cambiado a ${nuevoEstado} exitosamente`
        });
        
    } catch (error) {
        console.error('❌ Error cambiando estado de comunidad:', error);
        res.json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// API para eliminar completamente una comunidad de la base de datos
router.delete('/comunidades/:id', async (req, res) => {
    try {
        const comunidadId = parseInt(req.params.id);
        const { razon } = req.body;
        
        console.log(`🗑️ Eliminando comunidad ${comunidadId} completamente de la base de datos`);
        
        // Verificar que la comunidad existe
        const comunidadExiste = await executeQuery('SELECT titulo, idUsuario FROM comunidad WHERE idComunidad = ?', [comunidadId]);
        if (comunidadExiste.length === 0) {
            return res.json({
                success: false,
                error: 'Comunidad no encontrada'
            });
        }
        
        const comunidad = comunidadExiste[0];
        
        // Eliminar en orden secuencial (más simple y confiable)
        console.log(`🔄 Iniciando eliminación secuencial para comunidad ${comunidadId}`);
        
        // 1. Eliminar comentarios de la comunidad (si existen)
        try {
            await executeQuery('DELETE FROM comentarios WHERE idComunidad = ?', [comunidadId]);
            console.log(`🗑️ Comentarios eliminados para comunidad ${comunidadId}`);
        } catch (error) {
            console.log(`⚠️ No se pudieron eliminar comentarios: ${error.message}`);
        }
        
        // 2. Eliminar miembros de la comunidad (si existen)
        try {
            await executeQuery('DELETE FROM usuario_comunidad WHERE idComunidad = ?', [comunidadId]);
            console.log(`🗑️ Miembros eliminados para comunidad ${comunidadId}`);
        } catch (error) {
            console.log(`⚠️ No se pudieron eliminar miembros: ${error.message}`);
        }
        
        // 3. Eliminar reportes relacionados con la comunidad (si existen)
        try {
            await executeQuery('DELETE FROM reportes WHERE idComunidad = ?', [comunidadId]);
            console.log(`🗑️ Reportes eliminados para comunidad ${comunidadId}`);
        } catch (error) {
            console.log(`⚠️ No se pudieron eliminar reportes: ${error.message}`);
        }
        
        // 4. Finalmente, eliminar la comunidad
        await executeQuery('DELETE FROM comunidad WHERE idComunidad = ?', [comunidadId]);
        console.log(`🗑️ Comunidad ${comunidadId} eliminada completamente`);
        
        // Registrar la acción en logs
        try {
            await executeQuery(`
                INSERT INTO logs_actividad (accion, descripcion, detalles, usuario, fecha, ip)
                VALUES (?, ?, ?, ?, NOW(), ?)
            `, [
                'ADMIN_ELIMINAR_COMUNIDAD',
                `Comunidad eliminada completamente de la base de datos`,
                `Comunidad ID: ${comunidadId}, Título: ${comunidad.titulo}, Razón: ${razon || 'No especificada'}`,
                req.session.usuario.nombre,
                req.ip
            ]);
        } catch (logError) {
            console.log('⚠️ No se pudo registrar en logs:', logError.message);
        }
        
        res.json({
            success: true,
            mensaje: `Comunidad "${comunidad.titulo}" eliminada completamente de la base de datos`
        });
        
    } catch (error) {
        console.error('❌ Error eliminando comunidad:', error);
        res.json({
            success: false,
            error: `Error interno del servidor: ${error.message}`
        });
    }
});

// API para obtener detalles de una comunidad específica
router.get('/comunidades/:id', async (req, res) => {
    try {
        const comunidadId = parseInt(req.params.id);
        
        // Obtener información completa de la comunidad
        const comunidad = await executeQuery(`
            SELECT 
                c.*,
                u.nombre as creadorNombre,
                u.correo as creadorEmail,
                (SELECT COUNT(*) FROM comentarios co WHERE co.idComunidad = c.idComunidad) as totalComentarios,
                (SELECT COUNT(*) FROM usuario_comunidad uc WHERE uc.idComunidad = c.idComunidad) as totalMiembros
            FROM comunidad c 
            LEFT JOIN usuarios u ON c.idUsuario = u.idUsuario 
            WHERE c.idComunidad = ?
        `, [comunidadId]);
        
        if (comunidad.length === 0) {
            return res.status(404).render('error', {
                titulo: 'Comunidad no encontrada',
                mensaje: 'La comunidad que buscas no existe.',
                loggedIn: true,
                usuario: req.session.usuario
            });
        }
        
        // Obtener miembros de la comunidad
        const miembros = await executeQuery(`
            SELECT 
                u.idUsuario,
                u.nombre,
                u.correo,
                uc.rolEnComunidad,
                uc.fechaUnion
            FROM usuario_comunidad uc
            LEFT JOIN usuarios u ON uc.idUsuario = u.idUsuario
            WHERE uc.idComunidad = ?
            ORDER BY uc.rolEnComunidad DESC, uc.fechaUnion ASC
            LIMIT 50
        `, [comunidadId]);
        
        // Obtener comentarios recientes
        const comentarios = await executeQuery(`
            SELECT 
                co.*,
                u.nombre as autorNombre
            FROM comentarios co
            LEFT JOIN usuarios u ON co.idUsuario = u.idUsuario
            WHERE co.idComunidad = ?
            ORDER BY co.fechaComentario DESC
            LIMIT 20
        `, [comunidadId]);
        
        res.render('admin/comunidad-detalle', {
            titulo: `Gestión: ${comunidad[0].titulo}`,
            loggedIn: true,
            usuario: req.session.usuario,
            comunidad: comunidad[0],
            miembros: miembros,
            comentarios: comentarios
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo detalles de comunidad:', error);
        res.status(500).render('error', {
            titulo: 'Error',
            mensaje: 'Error al cargar los detalles de la comunidad',
            loggedIn: true,
            usuario: req.session.usuario
        });
    }
});

// API para obtener estadísticas de comunidades
router.get('/api/comunidades/estadisticas', async (req, res) => {
    try {
        const generales = await executeQuery(`
            SELECT 
                COUNT(*) as totalComunidades,
                COUNT(CASE WHEN estado = 'activa' THEN 1 END) as activas,
                COUNT(CASE WHEN estado = 'suspendida' THEN 1 END) as suspendidas,
                COUNT(CASE WHEN estado = 'eliminada' THEN 1 END) as eliminadas
            FROM comunidad
        `);
        
        const porCategoria = await executeQuery(`
            SELECT 
                categoria,
                COUNT(*) as cantidad
            FROM comunidad
            WHERE estado = 'activa'
            GROUP BY categoria
            ORDER BY cantidad DESC
        `);
        
        const actividad = await executeQuery(`
            SELECT 
                DATE(fechaCreacion) as fecha,
                COUNT(*) as nuevas
            FROM comunidad
            WHERE fechaCreacion >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(fechaCreacion)
            ORDER BY fecha DESC
        `);
        
        res.json({
            success: true,
            estadisticas: {
                generales: generales[0],
                porCategoria: porCategoria,
                actividad: actividad
            }
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo estadísticas de comunidades:', error);
        res.json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// API para crear nueva comunidad desde admin
router.post('/api/comunidades/crear', async (req, res) => {
    try {
        const { titulo, descripcion, categoria, tags } = req.body;
        const adminUserId = req.session.usuario.id;
        
        console.log('🏗️ Admin creando nueva comunidad');
        
        // Validaciones
        if (!titulo || titulo.trim().length < 3) {
            return res.json({
                success: false,
                error: 'El título debe tener al menos 3 caracteres'
            });
        }
        
        if (!descripcion || descripcion.trim().length < 10) {
            return res.json({
                success: false,
                error: 'La descripción debe tener al menos 10 caracteres'
            });
        }
        
        if (!categoria) {
            return res.json({
                success: false,
                error: 'Debe seleccionar una categoría'
            });
        }
        
        const categoriasPermitidas = ['infraestructura', 'seguridad', 'emergencia', 'salud', 'general'];
        if (!categoriasPermitidas.includes(categoria)) {
            return res.json({
                success: false,
                error: 'Categoría no válida'
            });
        }
        
        // Crear la comunidad
        const insertResult = await executeQuery(`
            INSERT INTO comunidad (titulo, descripcion, categoria, tags, idUsuario, fechaCreacion, estado)
            VALUES (?, ?, ?, ?, ?, NOW(), 'activa')
        `, [titulo.trim(), descripcion.trim(), categoria, tags ? tags.trim() : null, adminUserId]);
        
        const comunidadId = insertResult.insertId;
        
        // Agregar al admin como miembro administrador
        await executeQuery(`
            INSERT INTO usuario_comunidad (idUsuario, idComunidad, rolEnComunidad, fechaUnion)
            VALUES (?, ?, 'administrador', NOW())
        `, [adminUserId, comunidadId]);
        
        // Log de actividad
        try {
            await executeQuery(`
                INSERT INTO logs_actividad (accion, descripcion, detalles, usuario, fecha, ip)
                VALUES (?, ?, ?, ?, NOW(), ?)
            `, [
                'ADMIN_CREAR_COMUNIDAD',
                `Creó nueva comunidad: ${titulo.trim()}`,
                `Comunidad ID: ${comunidadId}, Categoría: ${categoria}`,
                req.session.usuario.nombre,
                req.ip
            ]);
        } catch (logError) {
            console.log('⚠️ No se pudo registrar en logs:', logError.message);
        }
        
        res.json({
            success: true,
            mensaje: 'Comunidad creada exitosamente',
            comunidadId: comunidadId
        });
        
    } catch (error) {
        console.error('❌ Error creando comunidad:', error);
        res.json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Ruta para Logs
router.get('/logs', async (req, res) => {
    try {
        console.log('📝 Accediendo a logs del sistema');
        
        // Obtener logs recientes
        const logs = await executeQuery(`
            SELECT *
            FROM logs_actividad
            ORDER BY fecha DESC
            LIMIT 200
        `);
        
        res.render('admin/logs', {
            titulo: 'Logs del Sistema - Admin Panel',
            usuario: req.session.usuario,
            logs: logs
        });
        
    } catch (error) {
        console.error('❌ Error cargando logs:', error);
        res.status(500).render('error', {
            mensaje: 'Error cargando logs',
            error: { status: 500 }
        });
    }
});

// Ruta para Configuración
router.get('/configuracion', async (req, res) => {
    try {
        console.log('⚙️ Accediendo a configuración');
        
        res.render('admin/configuracion', {
            titulo: 'Configuración del Sistema - Admin Panel',
            usuario: req.session.usuario
        });
        
    } catch (error) {
        console.error('❌ Error cargando configuración:', error);
        res.status(500).render('error', {
            mensaje: 'Error cargando configuración',
            error: { status: 500 }
        });
    }
});

// ============================================================================
// RUTAS DE API PARA EL DASHBOARD
// ============================================================================

// API: Estadísticas generales
router.get('/api/estadisticas', async (req, res) => {
    try {
        const estadisticas = await obtenerEstadisticas();
        res.json({
            success: true,
            estadisticas: estadisticas
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.json({
            success: false,
            message: 'Error obteniendo estadísticas'
        });
    }
});

// API: Actividad reciente
router.get('/api/actividad-reciente', async (req, res) => {
    try {
        const actividad = await executeQuery(`
            SELECT 
                fecha,
                accion as titulo,
                descripcion,
                usuario,
                ip
            FROM logs_actividad
            ORDER BY fecha DESC
            LIMIT 10
        `);
        
        res.json({
            success: true,
            actividad: actividad
        });
    } catch (error) {
        console.error('Error obteniendo actividad:', error);
        res.json({
            success: false,
            actividad: []
        });
    }
});

// API: Notificaciones
router.get('/api/notificaciones', async (req, res) => {
    try {
        // Usuarios nuevos (últimos 7 días)
        const usuariosNuevos = await executeQuery(`
            SELECT COUNT(*) as count
            FROM usuarios
            WHERE fechaCreacion >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `);
        
        // Reportes pendientes
        const reportesPendientes = await executeQuery(`
            SELECT COUNT(*) as count
            FROM reportes
            WHERE estado = 'pendiente'
        `);
        
        res.json({
            success: true,
            usuariosNuevos: usuariosNuevos[0].count,
            reportesPendientes: reportesPendientes[0].count
        });
    } catch (error) {
        console.error('Error obteniendo notificaciones:', error);
        res.json({
            success: false,
            usuariosNuevos: 0,
            reportesPendientes: 0
        });
    }
});

// API: Estado del sistema
router.get('/api/estado-sistema', async (req, res) => {
    try {
        // Verificar conexión a base de datos
        await executeQuery('SELECT 1');
        
        res.json({
            success: true,
            baseDatos: true,
            servidor: true,
            servicios: true
        });
    } catch (error) {
        res.json({
            success: false,
            baseDatos: false,
            servidor: true,
            servicios: false
        });
    }
});

// API: Ping para mantener sesión activa
router.post('/api/ping', (req, res) => {
    res.json({ success: true, timestamp: new Date() });
});

// ============================================================================
// APIS PARA GESTIÓN DE DATOS
// ============================================================================

// API: Obtener reportes
router.get('/api/reportes', async (req, res) => {
    try {
        const reportes = await executeQuery(`
            SELECT 
                r.*,
                u.nombre as usuarioNombre,
                u.correo as usuarioEmail
            FROM reportes r
            LEFT JOIN usuarios u ON r.idUsuario = u.idUsuario
            ORDER BY r.fechaCreacion DESC
        `);
        
        res.json({
            success: true,
            reportes: reportes
        });
    } catch (error) {
        console.error('Error obteniendo reportes:', error);
        res.json({
            success: false,
            message: 'Error obteniendo reportes'
        });
    }
});

// API: Obtener reporte específico
router.get('/api/reportes/:id', async (req, res) => {
    try {
        const reporte = await executeQuery(`
            SELECT 
                r.*,
                u.nombre as usuarioNombre,
                u.correo as usuarioEmail
            FROM reportes r
            LEFT JOIN usuarios u ON r.idUsuario = u.idUsuario
            WHERE r.idReporte = ?
        `, [req.params.id]);
        
        if (reporte.length === 0) {
            return res.json({
                success: false,
                message: 'Reporte no encontrado'
            });
        }
        
        res.json({
            success: true,
            reporte: reporte[0]
        });
    } catch (error) {
        console.error('Error obteniendo reporte:', error);
        res.json({
            success: false,
            message: 'Error obteniendo reporte'
        });
    }
});

// API: Cambiar estado de reporte
router.put('/api/reportes/:id/estado', async (req, res) => {
    try {
        const { estado } = req.body;
        
        await executeQuery(`
            UPDATE reportes 
            SET estado = ?, fechaActualizacion = NOW()
            WHERE idReporte = ?
        `, [estado, req.params.id]);
        
        res.json({
            success: true,
            message: 'Estado actualizado correctamente'
        });
    } catch (error) {
        console.error('Error actualizando estado:', error);
        res.json({
            success: false,
            message: 'Error actualizando estado'
        });
    }
});

// ============================================================================
// FUNCIÓN HELPER PARA OBTENER ESTADÍSTICAS
// ============================================================================
async function obtenerEstadisticas() {
    try {
        // Total usuarios
        const totalUsuarios = await executeQuery('SELECT COUNT(*) as count FROM usuarios WHERE activo = 1');
        
        // Total reportes
        const totalReportes = await executeQuery('SELECT COUNT(*) as count FROM reportes');
        
        // Reportes pendientes
        const reportesPendientes = await executeQuery('SELECT COUNT(*) as count FROM reportes WHERE estado = "pendiente"');
        
        // Total comunidades
        const totalComunidades = await executeQuery('SELECT COUNT(*) as count FROM comunidad WHERE estado = "activa"');
        
        return {
            totalUsuarios: totalUsuarios[0].count || 0,
            totalReportes: totalReportes[0].count || 0,
            reportesPendientes: reportesPendientes[0].count || 0,
            totalComunidades: totalComunidades[0].count || 0
        };
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        return {
            totalUsuarios: 0,
            totalReportes: 0,
            reportesPendientes: 0,
            totalComunidades: 0
        };
    }
}

// ============================================================================
// RUTA DE PRUEBA
// ============================================================================
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Router de admin funcionando',
        usuario: req.session.usuario,
        timestamp: new Date()
    });
});

module.exports = router;