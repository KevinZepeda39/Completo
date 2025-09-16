// routes/comunidades.js - COMPLETO CON MANEJO DE SUSPENSIONES
const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { verificarAuth, logActividad } = require('../middleware/auth');
const { censurarContenido } = require('../middleware/admin');

// ========================
// RUTAS DE COMUNIDADES
// ========================

// Página principal de comunidades (SOLO ACTIVAS)
router.get('/', async (req, res) => {
    try {
        console.log('📋 Cargando página de comunidades...');
        
        const loggedIn = !!req.session.usuario;
        
        // Obtener filtros de la URL
        const { categoria, buscar, page = 1 } = req.query;
        const limit = 12;
        const offset = (page - 1) * limit;
        
        // Construir query para comunidades (SOLO ACTIVAS)
        let query = `
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
            WHERE c.estado = 'activa'
        `;
        
        let params = [];
        
        // Aplicar filtros
        if (categoria && categoria !== 'todas') {
            query += ` AND c.categoria = ?`;
            params.push(categoria);
        }
        
        if (buscar && buscar.trim()) {
            query += ` AND (c.titulo LIKE ? OR c.descripcion LIKE ? OR c.tags LIKE ?)`;
            const searchTerm = `%${buscar.trim()}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        // Contar total para paginación
        const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
        const countResult = await executeQuery(countQuery, params);
        const totalComunidades = countResult[0].total;
        
        // Agregar orden y paginación
        query += ` ORDER BY c.fechaCreacion DESC LIMIT ${limit} OFFSET ${offset}`;
        
        const comunidades = await executeQuery(query, params);
        
        // Obtener estadísticas con las nuevas categorías (SOLO ACTIVAS)
        const statsQuery = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN categoria = 'infraestructura' THEN 1 END) as infraestructura,
                COUNT(CASE WHEN categoria = 'seguridad' THEN 1 END) as seguridad,
                COUNT(CASE WHEN categoria = 'emergencia' THEN 1 END) as emergencia,
                COUNT(CASE WHEN categoria = 'salud' THEN 1 END) as salud,
                COUNT(CASE WHEN categoria = 'general' THEN 1 END) as general
            FROM comunidad 
            WHERE estado = 'activa'
        `;
        
        const estadisticas = await executeQuery(statsQuery);
        
        // Calcular paginación
        const totalPages = Math.ceil(totalComunidades / limit);
        const paginacion = {
            currentPage: parseInt(page),
            totalPages: totalPages,
            totalComunidades: totalComunidades,
            hasNext: page < totalPages,
            hasPrev: page > 1,
            nextPage: parseInt(page) + 1,
            prevPage: parseInt(page) - 1
        };
        
        console.log(`✅ ${comunidades.length} comunidades cargadas`);
        
        res.render('comunidades', {
            loggedIn: loggedIn,
            usuario: loggedIn ? req.session.usuario : null,
            comunidades: comunidades,
            estadisticas: estadisticas[0],
            paginacion: paginacion,
            filtros: { categoria, buscar },
            titulo: 'Comunidades - MiCiudadSV'
        });
        
    } catch (error) {
        console.error('❌ Error cargando comunidades:', error);
        
        const loggedIn = !!req.session.usuario;
        
        res.render('comunidades', {
            loggedIn: loggedIn,
            usuario: loggedIn ? req.session.usuario : null,
            comunidades: [],
            estadisticas: { total: 0, infraestructura: 0, seguridad: 0, emergencia: 0, salud: 0, general: 0 },
            paginacion: { currentPage: 1, totalPages: 1, totalComunidades: 0, hasNext: false, hasPrev: false },
            filtros: { categoria: '', buscar: '' },
            error: 'Error cargando las comunidades: ' + error.message,
            titulo: 'Comunidades - MiCiudadSV'
        });
    }
});

// ========================
// RUTAS PARA CREAR COMUNIDAD
// ========================

// Mostrar formulario para crear comunidad
router.get('/crear', verificarAuth, (req, res) => {
    try {
        console.log('📝 Mostrando formulario de crear comunidad...');
        
        res.render('crear-comunidad', {
            loggedIn: true,
            usuario: req.session.usuario,
            titulo: 'Crear Nueva Comunidad - MiCiudadSV'
        });
        
    } catch (error) {
        console.error('❌ Error cargando formulario crear comunidad:', error);
        res.render('error', {
            titulo: 'Error',
            mensaje: 'Error al cargar el formulario'
        });
    }
});

// Procesar creación de comunidad
router.post('/crear', verificarAuth, censurarContenido, async (req, res) => {
    try {
        const { titulo, descripcion, categoria, tags } = req.body;
        const userId = req.session.usuario.id;
        
        console.log('🏗️ Creando nueva comunidad...');
        
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
                error: 'Debes seleccionar una categoría'
            });
        }
        
        const categoriasPermitidas = ['infraestructura', 'seguridad', 'emergencia', 'salud', 'general'];
        if (!categoriasPermitidas.includes(categoria)) {
            return res.json({
                success: false,
                error: 'Categoría no válida'
            });
        }
        
        // Insertar comunidad
        const insertQuery = `
            INSERT INTO comunidad (titulo, descripcion, categoria, tags, idUsuario, fechaCreacion, estado)
            VALUES (?, ?, ?, ?, ?, NOW(), 'activa')
        `;
        
        const result = await executeQuery(insertQuery, [
            titulo.trim(),
            descripcion.trim(),
            categoria,
            tags ? tags.trim() : null,
            userId
        ]);
        
        const comunidadId = result.insertId;
        
        // Agregar al creador como administrador de la comunidad
        const addMemberQuery = `
            INSERT INTO usuario_comunidad (idComunidad, idUsuario, rolEnComunidad, fechaUnion)
            VALUES (?, ?, 'administrador', NOW())
        `;
        
        await executeQuery(addMemberQuery, [comunidadId, userId]);
        
        console.log(`✅ Comunidad creada con ID: ${comunidadId}`);
        
        // Log de actividad
        await logActividad(req, 'COMUNIDAD_CREADA', `Creó la comunidad: ${titulo.trim()}`);
        
        res.json({
            success: true,
            message: 'Comunidad creada exitosamente',
            comunidadId: comunidadId,
            redirect: `/comunidades/${comunidadId}`
        });
        
    } catch (error) {
        console.error('❌ Error creando comunidad:', error);
        res.json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// ========================
// RUTA PARA VER DETALLE DE COMUNIDAD
// ========================

// Ver detalle de una comunidad específica
router.get('/:id', async (req, res) => {
    try {
        const comunidadId = parseInt(req.params.id);
        const loggedIn = !!req.session.usuario;
        const userId = loggedIn ? req.session.usuario.id : null;
        
        console.log(`📋 Cargando detalle de comunidad ${comunidadId}...`);
        
        // Obtener información de la comunidad
        const comunidadQuery = `
            SELECT 
                c.*,
                u.nombre as creadorNombre,
                u.idUsuario as creadorId,
                (SELECT COUNT(*) FROM usuario_comunidad uc WHERE uc.idComunidad = c.idComunidad) as totalMiembros,
                (SELECT COUNT(*) FROM comentarios co WHERE co.idComunidad = c.idComunidad) as totalComentarios
            FROM comunidad c
            LEFT JOIN usuarios u ON c.idUsuario = u.idUsuario
            WHERE c.idComunidad = ?
        `;
        
        const comunidadResult = await executeQuery(comunidadQuery, [comunidadId]);
        
        if (comunidadResult.length === 0) {
            return res.status(404).render('error', {
                titulo: 'Comunidad no encontrada',
                mensaje: 'La comunidad que buscas no existe o ha sido eliminada.'
            });
        }
        
        const comunidad = comunidadResult[0];
        
        // Verificar si la comunidad está eliminada
        if (comunidad.estado === 'eliminada') {
            return res.status(404).render('error', {
                titulo: 'Comunidad no disponible',
                mensaje: 'Esta comunidad no está disponible.'
            });
        }
        
        // Verificar si el usuario es miembro (si está logueado)
        let esMiembro = false;
        let rolEnComunidad = null;
        
        if (loggedIn) {
            const miembroQuery = `
                SELECT rolEnComunidad 
                FROM usuario_comunidad 
                WHERE idComunidad = ? AND idUsuario = ?
            `;
            const miembroResult = await executeQuery(miembroQuery, [comunidadId, userId]);
            
            if (miembroResult.length > 0) {
                esMiembro = true;
                rolEnComunidad = miembroResult[0].rolEnComunidad;
            }
        }
        
        // Obtener comentarios recientes
        const comentariosQuery = `
            SELECT 
                co.*,
                u.nombre as autorNombre,
                u.idUsuario as autorId
            FROM comentarios co
            LEFT JOIN usuarios u ON co.idUsuario = u.idUsuario
            WHERE co.idComunidad = ?
            ORDER BY co.fechaComentario DESC
            LIMIT 20
        `;
        
        const comentarios = await executeQuery(comentariosQuery, [comunidadId]);
        
        // Obtener miembros destacados
        const miembrosQuery = `
            SELECT 
                u.idUsuario as id,
                u.nombre,
                uc.rolEnComunidad,
                uc.fechaUnion,
                (SELECT COUNT(*) FROM comentarios co WHERE co.idUsuario = u.idUsuario AND co.idComunidad = ?) as totalComentarios
            FROM usuario_comunidad uc
            LEFT JOIN usuarios u ON uc.idUsuario = u.idUsuario
            WHERE uc.idComunidad = ?
            ORDER BY uc.rolEnComunidad DESC, uc.fechaUnion ASC
            LIMIT 10
        `;
        
        const miembros = await executeQuery(miembrosQuery, [comunidadId, comunidadId]);
        
        console.log(`✅ Detalle de comunidad cargado: ${comunidad.titulo}`);
        
        res.render('comunidad-detalle', {
            loggedIn: loggedIn,
            usuario: loggedIn ? req.session.usuario : null,
            comunidad: comunidad,
            comentarios: comentarios,
            miembros: miembros,
            esMiembro: esMiembro,
            rolEnComunidad: rolEnComunidad,
            esCreador: loggedIn && userId === comunidad.creadorId,
            titulo: `${comunidad.titulo} - MiCiudadSV`
        });
        
    } catch (error) {
        console.error('❌ Error cargando detalle de comunidad:', error);
        res.status(500).render('error', {
            titulo: 'Error',
            mensaje: 'Error al cargar la comunidad'
        });
    }
});

// Unirse a una comunidad
router.post('/:id/unirse', verificarAuth, async (req, res) => {
    try {
        const comunidadId = parseInt(req.params.id);
        const userId = req.session.usuario.id;
        
        console.log(`👥 Usuario ${userId} intentando unirse a comunidad ${comunidadId}`);
        
        // Verificar que la comunidad existe y está activa
        const comunidadQuery = `
            SELECT titulo, estado 
            FROM comunidad 
            WHERE idComunidad = ?
        `;
        const comunidadResult = await executeQuery(comunidadQuery, [comunidadId]);
        
        if (comunidadResult.length === 0) {
            return res.json({
                success: false,
                error: 'Comunidad no encontrada'
            });
        }
        
        const comunidad = comunidadResult[0];
        
        if (comunidad.estado !== 'activa') {
            return res.json({
                success: false,
                error: 'No puedes unirte a esta comunidad'
            });
        }
        
        // Verificar si ya es miembro
        const yaEsMiembroQuery = `
            SELECT rolEnComunidad 
            FROM usuario_comunidad 
            WHERE idComunidad = ? AND idUsuario = ?
        `;
        const yaEsMiembro = await executeQuery(yaEsMiembroQuery, [comunidadId, userId]);
        
        if (yaEsMiembro.length > 0) {
            return res.json({
                success: false,
                error: 'Ya eres miembro de esta comunidad'
            });
        }
        
        // Unirse a la comunidad
        const unirseQuery = `
            INSERT INTO usuario_comunidad (idComunidad, idUsuario, rolEnComunidad, fechaUnion)
            VALUES (?, ?, 'miembro', NOW())
        `;
        
        await executeQuery(unirseQuery, [comunidadId, userId]);
        
        console.log('✅ Usuario se unió exitosamente');
        
        // Log de actividad
        await logActividad(req, 'UNIRSE_COMUNIDAD', `Se unió a la comunidad: ${comunidad.titulo}`);
        
        res.json({
            success: true,
            message: 'Te has unido exitosamente a la comunidad'
        });
        
    } catch (error) {
        console.error('❌ Error uniéndose a comunidad:', error);
        res.json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Salir de una comunidad
router.post('/:id/salir', verificarAuth, async (req, res) => {
    try {
        const comunidadId = parseInt(req.params.id);
        const userId = req.session.usuario.id;
        
        console.log(`👋 Usuario ${userId} intentando salir de comunidad ${comunidadId}`);
        
        // Verificar que es miembro
        const esMiembroQuery = `
            SELECT rolEnComunidad 
            FROM usuario_comunidad 
            WHERE idComunidad = ? AND idUsuario = ?
        `;
        const esMiembro = await executeQuery(esMiembroQuery, [comunidadId, userId]);
        
        if (esMiembro.length === 0) {
            return res.json({
                success: false,
                error: 'No eres miembro de esta comunidad'
            });
        }
        
        // Verificar que no es el creador
        const esCreadorQuery = `
            SELECT idUsuario 
            FROM comunidad 
            WHERE idComunidad = ? AND idUsuario = ?
        `;
        const esCreador = await executeQuery(esCreadorQuery, [comunidadId, userId]);
        
        if (esCreador.length > 0) {
            return res.json({
                success: false,
                error: 'No puedes salir de tu propia comunidad. Debes transferir la administración primero.'
            });
        }
        
        // Salir de la comunidad
        const salirQuery = `
            DELETE FROM usuario_comunidad 
            WHERE idComunidad = ? AND idUsuario = ?
        `;
        
        await executeQuery(salirQuery, [comunidadId, userId]);
        
        console.log('✅ Usuario salió exitosamente');
        
        // Log de actividad
        await logActividad(req, 'SALIR_COMUNIDAD', `Salió de la comunidad ID: ${comunidadId}`);
        
        res.json({
            success: true,
            message: 'Has salido exitosamente de la comunidad'
        });
        
    } catch (error) {
        console.error('❌ Error saliendo de comunidad:', error);
        res.json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// ========================
// CHAT GLOBAL
// ========================

// Mostrar página del chat global
router.get('/chat/global', async (req, res) => {
    try {
        console.log('💬 Cargando chat global...');
        
        const loggedIn = !!req.session.usuario;
        
        // Obtener comentarios globales recientes
        const comentariosQuery = `
            SELECT 
                cg.id,
                cg.comentario,
                cg.fecha_creacion as fechaCreacion,
                u.nombre as autorNombre,
                u.idUsuario as autorId
            FROM comentarios_globales cg
            LEFT JOIN usuarios u ON cg.idUsuario = u.idUsuario
            ORDER BY cg.fecha_creacion DESC
            LIMIT 100
        `;
        
        const comentarios = await executeQuery(comentariosQuery);
        
        // Obtener estadísticas del chat
        const statsQuery = `
            SELECT 
                COUNT(*) as totalMensajes,
                COUNT(DISTINCT idUsuario) as usuariosActivos,
                MAX(fecha_creacion) as ultimoMensaje
            FROM comentarios_globales
            WHERE fecha_creacion >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        `;
        
        const estadisticas = await executeQuery(statsQuery);
        
        console.log(`✅ ${comentarios.length} mensajes cargados para chat global`);
        
        res.render('chat-global', {
            loggedIn: loggedIn,
            usuario: loggedIn ? req.session.usuario : null,
            comentarios: comentarios.reverse(), // Mostrar más antiguos primero
            estadisticas: estadisticas[0],
            titulo: 'Chat Global - MiCiudadSV'
        });
        
    } catch (error) {
        console.error('❌ Error cargando chat global:', error);
        
        const loggedIn = !!req.session.usuario;
        
        res.render('chat-global', {
            loggedIn: loggedIn,
            usuario: loggedIn ? req.session.usuario : null,
            comentarios: [],
            estadisticas: { totalMensajes: 0, usuariosActivos: 0, ultimoMensaje: null },
            error: 'Error cargando el chat: ' + error.message,
            titulo: 'Chat Global - MiCiudadSV'
        });
    }
});

// Enviar mensaje al chat global
router.post('/chat/global/enviar', verificarAuth, censurarContenido, async (req, res) => {
    try {
        const { comentario } = req.body;
        const userId = req.session.usuario.id;
        
        console.log('💬 Enviando mensaje al chat global...');
        
        // Validaciones
        if (!comentario || comentario.trim().length < 1) {
            throw new Error('El mensaje no puede estar vacío');
        }
        
        if (comentario.trim().length > 500) {
            throw new Error('El mensaje es demasiado largo (máximo 500 caracteres)');
        }
        
        // Insertar mensaje
        const insertQuery = `
            INSERT INTO comentarios_globales (idUsuario, comentario, fecha_creacion)
            VALUES (?, ?, NOW())
        `;
        
        await executeQuery(insertQuery, [userId, comentario.trim()]);
        
        console.log('✅ Mensaje enviado al chat global');
        
        // Log de actividad
        await logActividad(req, 'MENSAJE_CHAT_GLOBAL', 'Mensaje enviado al chat global');
        
        res.redirect('/comunidades/chat/global#bottom');
        
    } catch (error) {
        console.error('❌ Error enviando mensaje:', error);
        res.redirect(`/comunidades/chat/global?error=${encodeURIComponent(error.message)}`);
    }
});

// ========================
// APIs PARA AJAX
// ========================

// API para obtener mensajes recientes del chat
router.get('/api/chat/mensajes', async (req, res) => {
    try {
        const { desde } = req.query;
        
        let query = `
            SELECT 
                cg.id,
                cg.comentario,
                cg.fecha_creacion as fechaCreacion,
                u.nombre as autorNombre,
                u.idUsuario as autorId
            FROM comentarios_globales cg
            LEFT JOIN usuarios u ON cg.idUsuario = u.idUsuario
        `;
        
        let params = [];
        
        if (desde) {
            query += ` WHERE cg.fecha_creacion > ?`;
            params.push(desde);
        }
        
        query += ` ORDER BY cg.fecha_creacion ASC LIMIT 50`;
        
        const mensajes = await executeQuery(query, params);
        
        res.json({
            success: true,
            mensajes: mensajes
        });
        
    } catch (error) {
        console.error('❌ Error API mensajes:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// API para obtener estadísticas de comunidades
router.get('/api/estadisticas', async (req, res) => {
    try {
        const query = `
            SELECT 
                COUNT(*) as totalcomunidad,
                COUNT(CASE WHEN categoria = 'infraestructura' THEN 1 END) as infraestructura,
                COUNT(CASE WHEN categoria = 'seguridad' THEN 1 END) as seguridad,
                COUNT(CASE WHEN categoria = 'emergencia' THEN 1 END) as emergencia,
                COUNT(CASE WHEN categoria = 'salud' THEN 1 END) as salud,
                COUNT(CASE WHEN categoria = 'general' THEN 1 END) as general,
                (SELECT COUNT(*) FROM comentarios) as totalComentarios,
                (SELECT COUNT(*) FROM comentarios_globales) as totalMensajesGlobales
            FROM comunidad 
            WHERE estado = 'activa'
        `;
        
        const estadisticas = await executeQuery(query);
        
        res.json({
            success: true,
            estadisticas: estadisticas[0]
        });
        
    } catch (error) {
        console.error('❌ Error API estadísticas:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// API para obtener comentarios de una comunidad
router.get('/:id/api/comentarios', async (req, res) => {
    try {
        const comunidadId = parseInt(req.params.id);
        const { desde } = req.query; // Para obtener solo comentarios nuevos
        
        // Verificar estado de la comunidad primero
        const estadoComunidad = await executeQuery(
            'SELECT estado FROM comunidad WHERE idComunidad = ?', 
            [comunidadId]
        );
        
        if (estadoComunidad.length === 0) {
            return res.json({
                success: false,
                error: 'Comunidad no encontrada'
            });
        }
        
        // Si la comunidad está eliminada, no mostrar comentarios
        if (estadoComunidad[0].estado === 'eliminada') {
            return res.json({
                success: false,
                error: 'Esta comunidad no está disponible'
            });
        }
        
        let query = `
            SELECT 
                co.idComentario as id,
                co.comentario,
                co.fechaComentario,
                u.nombre as autorNombre,
                u.idUsuario as autorId,
                c.idUsuario as creadorId,
                c.estado as estadoComunidad
            FROM comentarios co
            LEFT JOIN usuarios u ON co.idUsuario = u.idUsuario
            LEFT JOIN comunidad c ON co.idComunidad = c.idComunidad
            WHERE co.idComunidad = ? AND c.estado != 'eliminada'
        `;
        
        let params = [comunidadId];
        
        // Si se especifica "desde", solo traer comentarios nuevos
        if (desde) {
            query += ` AND co.fechaComentario > ?`;
            params.push(desde);
        }
        
        query += ` ORDER BY co.fechaComentario ASC`;
        
        const comentarios = await executeQuery(query, params);
        
        res.json({
            success: true,
            comentarios: comentarios,
            estadoComunidad: estadoComunidad[0].estado,
            puedeComentizar: estadoComunidad[0].estado === 'activa'
        });
        
    } catch (error) {
        console.error('❌ Error API comentarios:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// API para obtener estadísticas de la comunidad
router.get('/:id/api/stats', async (req, res) => {
    try {
        const comunidadId = parseInt(req.params.id);
        
        const statsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM comentarios WHERE idComunidad = ?) as totalComentarios,
                (SELECT COUNT(*) FROM usuario_comunidad WHERE idComunidad = ?) as totalMiembros,
                (SELECT estado FROM comunidad WHERE idComunidad = ?) as estado
        `;
        
        const stats = await executeQuery(statsQuery, [comunidadId, comunidadId, comunidadId]);
        
        res.json({
            success: true,
            stats: stats[0]
        });
        
    } catch (error) {
        console.error('❌ Error API stats:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// ========================
// COMENTARIOS EN COMUNIDADES
// ========================

// Enviar comentario a una comunidad
router.post('/:id/comentar', verificarAuth, censurarContenido, async (req, res) => {
    try {
        const comunidadId = parseInt(req.params.id);
        const userId = req.session.usuario.id;
        const { comentario } = req.body;
        
        console.log(`💬 Enviando comentario a comunidad ${comunidadId}`);
        console.log('📦 Request body:', req.body);
        console.log('📝 Comentario recibido:', comentario);
        console.log('📝 Tipo de comentario:', typeof comentario);
        console.log('📝 Longitud del comentario:', comentario ? comentario.length : 'undefined');
        
        // Validaciones básicas
        if (!comentario || comentario.trim().length < 1) {
            return res.json({
                success: false,
                error: 'El comentario no puede estar vacío'
            });
        }
        
        if (comentario.trim().length > 500) {
            return res.json({
                success: false,
                error: 'El comentario es demasiado largo (máximo 500 caracteres)'
            });
        }
        
        // Verificar que la comunidad existe y obtener su estado
        const comunidadQuery = `
            SELECT estado, titulo 
            FROM comunidad 
            WHERE idComunidad = ?
        `;
        const comunidadResult = await executeQuery(comunidadQuery, [comunidadId]);
        
        if (comunidadResult.length === 0) {
            return res.json({
                success: false,
                error: 'Comunidad no encontrada'
            });
        }
        
        const comunidad = comunidadResult[0];
        
        // VERIFICAR ESTADO DE LA COMUNIDAD
        if (comunidad.estado === 'suspendida') {
            return res.json({
                success: false,
                error: 'Esta comunidad está suspendida. No se pueden enviar comentarios.'
            });
        }
        
        if (comunidad.estado === 'eliminada') {
            return res.json({
                success: false,
                error: 'Esta comunidad no está disponible.'
            });
        }
        
        // Verificar que el usuario es miembro de la comunidad
        const esMiembroQuery = `
            SELECT rolEnComunidad 
            FROM usuario_comunidad 
            WHERE idComunidad = ? AND idUsuario = ?
        `;
        const esMiembro = await executeQuery(esMiembroQuery, [comunidadId, userId]);
        
        if (esMiembro.length === 0) {
            return res.json({
                success: false,
                error: 'Debes ser miembro de esta comunidad para comentar'
            });
        }
        
        // Insertar comentario
        const insertQuery = `
            INSERT INTO comentarios (idComunidad, idUsuario, comentario, fechaComentario)
            VALUES (?, ?, ?, NOW())
        `;
        
        const result = await executeQuery(insertQuery, [comunidadId, userId, comentario.trim()]);
        
        console.log('✅ Comentario enviado exitosamente');
        
        // Log de actividad
        await logActividad(req, 'COMENTARIO_COMUNIDAD', `Comentó en comunidad: ${comunidad.titulo}`);
        
        res.json({
            success: true,
            message: 'Comentario enviado exitosamente',
            comentarioId: result.insertId
        });
        
    } catch (error) {
        console.error('❌ Error enviando comentario:', error);
        res.json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// ========================
// BÚSQUEDA Y FILTROS AVANZADOS
// ========================

// API para búsqueda en tiempo real
router.get('/api/buscar', async (req, res) => {
    try {
        const { q, categoria, limite = 5 } = req.query;
        
        if (!q || q.trim().length < 2) {
            return res.json({
                success: false,
                error: 'La búsqueda debe tener al menos 2 caracteres'
            });
        }
        
        let query = `
            SELECT 
                c.idComunidad as id,
                c.titulo,
                c.descripcion,
                c.categoria,
                u.nombre as creadorNombre,
                (SELECT COUNT(*) FROM usuario_comunidad uc WHERE uc.idComunidad = c.idComunidad) as totalMiembros
            FROM comunidad c
            LEFT JOIN usuarios u ON c.idUsuario = u.idUsuario
            WHERE c.estado = 'activa'
            AND (c.titulo LIKE ? OR c.descripcion LIKE ? OR c.tags LIKE ?)
        `;
        
        let params = [];
        const searchTerm = `%${q.trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm);
        
        if (categoria && categoria !== 'todas') {
            query += ` AND c.categoria = ?`;
            params.push(categoria);
        }
        
        query += ` ORDER BY c.fechaCreacion DESC LIMIT ?`;
        params.push(parseInt(limite));
        
        const resultados = await executeQuery(query, params);
        
        res.json({
            success: true,
            resultados: resultados,
            total: resultados.length
        });
        
    } catch (error) {
        console.error('❌ Error API búsqueda:', error);
        res.json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// API para obtener comunidades populares
router.get('/api/populares', async (req, res) => {
    try {
        const { limite = 10 } = req.query;
        
        const query = `
            SELECT 
                c.idComunidad as id,
                c.titulo,
                c.descripcion,
                c.categoria,
                c.fechaCreacion,
                u.nombre as creadorNombre,
                (SELECT COUNT(*) FROM usuario_comunidad uc WHERE uc.idComunidad = c.idComunidad) as totalMiembros,
                (SELECT COUNT(*) FROM comentarios co WHERE co.idComunidad = c.idComunidad) as totalComentarios
            FROM comunidad c
            LEFT JOIN usuarios u ON c.idUsuario = u.idUsuario
            WHERE c.estado = 'activa'
            ORDER BY 
                (SELECT COUNT(*) FROM usuario_comunidad uc WHERE uc.idComunidad = c.idComunidad) DESC,
                (SELECT COUNT(*) FROM comentarios co WHERE co.idComunidad = c.idComunidad) DESC,
                c.fechaCreacion DESC
            LIMIT ?
        `;
        
        const comunidades = await executeQuery(query, [parseInt(limite)]);
        
        res.json({
            success: true,
            comunidades: comunidades
        });
        
    } catch (error) {
        console.error('❌ Error API populares:', error);
        res.json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// API para obtener comunidades recientes
router.get('/api/recientes', async (req, res) => {
    try {
        const { limite = 10 } = req.query;
        
        const query = `
            SELECT 
                c.idComunidad as id,
                c.titulo,
                c.descripcion,
                c.categoria,
                c.fechaCreacion,
                u.nombre as creadorNombre,
                (SELECT COUNT(*) FROM usuario_comunidad uc WHERE uc.idComunidad = c.idComunidad) as totalMiembros
            FROM comunidad c
            LEFT JOIN usuarios u ON c.idUsuario = u.idUsuario
            WHERE c.estado = 'activa'
            AND c.fechaCreacion >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            ORDER BY c.fechaCreacion DESC
            LIMIT ?
        `;
        
        const comunidades = await executeQuery(query, [parseInt(limite)]);
        
        res.json({
            success: true,
            comunidades: comunidades
        });
        
    } catch (error) {
        console.error('❌ Error API recientes:', error);
        res.json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// ========================
// GESTIÓN DE MIEMBROS (PARA ADMINISTRADORES)
// ========================

// API para obtener miembros de una comunidad
router.get('/:id/api/miembros', verificarAuth, async (req, res) => {
    try {
        const comunidadId = parseInt(req.params.id);
        const userId = req.session.usuario.id;
        const { page = 1, limite = 20 } = req.query;
        const offset = (page - 1) * limite;
        
        // Verificar que el usuario es miembro o administrador de la comunidad
        const esCreadorQuery = 'SELECT idUsuario FROM comunidad WHERE idComunidad = ? AND idUsuario = ?';
        const esCreador = await executeQuery(esCreadorQuery, [comunidadId, userId]);
        
        const esMiembroQuery = 'SELECT rolEnComunidad FROM usuario_comunidad WHERE idComunidad = ? AND idUsuario = ?';
        const esMiembro = await executeQuery(esMiembroQuery, [comunidadId, userId]);
        
        if (esCreador.length === 0 && (esMiembro.length === 0 || esMiembro[0].rolEnComunidad !== 'administrador')) {
            return res.json({
                success: false,
                error: 'No tienes permisos para ver la lista de miembros'
            });
        }
        
        const miembrosQuery = `
            SELECT 
                u.idUsuario as id,
                u.nombre,
                u.apellido,
                u.email,
                uc.fechaUnion,
                uc.rolEnComunidad,
                (SELECT COUNT(*) FROM comentarios co WHERE co.idUsuario = u.idUsuario AND co.idComunidad = ?) as totalComentarios
            FROM usuario_comunidad uc
            LEFT JOIN usuarios u ON uc.idUsuario = u.idUsuario
            WHERE uc.idComunidad = ?
            ORDER BY uc.rolEnComunidad DESC, uc.fechaUnion ASC
            LIMIT ? OFFSET ?
        `;
        
        const miembros = await executeQuery(miembrosQuery, [comunidadId, comunidadId, parseInt(limite), offset]);
        
        // Contar total de miembros
        const totalQuery = 'SELECT COUNT(*) as total FROM usuario_comunidad WHERE idComunidad = ?';
        const totalResult = await executeQuery(totalQuery, [comunidadId]);
        const total = totalResult[0].total;
        
        res.json({
            success: true,
            miembros: miembros,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limite),
                total: total,
                limite: parseInt(limite)
            }
        });
        
    } catch (error) {
        console.error('❌ Error API miembros:', error);
        res.json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// API para promover/degradar miembro (solo administradores)
router.post('/:id/api/miembros/:userId/rol', verificarAuth, async (req, res) => {
    try {
        const comunidadId = parseInt(req.params.id);
        const targetUserId = parseInt(req.params.userId);
        const adminUserId = req.session.usuario.id;
        const { nuevoRol } = req.body;
        
        if (!['miembro', 'administrador'].includes(nuevoRol)) {
            return res.json({
                success: false,
                error: 'Rol no válido'
            });
        }
        
        // Verificar que el usuario actual es creador o administrador
        const esCreadorQuery = 'SELECT idUsuario FROM comunidad WHERE idComunidad = ? AND idUsuario = ?';
        const esCreador = await executeQuery(esCreadorQuery, [comunidadId, adminUserId]);
        
        const esAdminQuery = 'SELECT rolEnComunidad FROM usuario_comunidad WHERE idComunidad = ? AND idUsuario = ?';
        const esAdmin = await executeQuery(esAdminQuery, [comunidadId, adminUserId]);
        
        if (esCreador.length === 0 && (esAdmin.length === 0 || esAdmin[0].rolEnComunidad !== 'administrador')) {
            return res.json({
                success: false,
                error: 'No tienes permisos para cambiar roles'
            });
        }
        
        // No permitir que se modifique a sí mismo
        if (adminUserId === targetUserId) {
            return res.json({
                success: false,
                error: 'No puedes cambiar tu propio rol'
            });
        }
        
        // Actualizar rol
        const updateQuery = 'UPDATE usuario_comunidad SET rolEnComunidad = ? WHERE idComunidad = ? AND idUsuario = ?';
        await executeQuery(updateQuery, [nuevoRol, comunidadId, targetUserId]);
        
        // Log de actividad
        await logActividad(req, 'CAMBIAR_ROL_MIEMBRO', `Cambió rol de usuario ${targetUserId} a ${nuevoRol} en comunidad ${comunidadId}`);
        
        res.json({
            success: true,
            mensaje: `Rol actualizado a ${nuevoRol} exitosamente`
        });
        
    } catch (error) {
        console.error('❌ Error cambiando rol miembro:', error);
        res.json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// API para expulsar miembro (solo administradores)
router.delete('/:id/api/miembros/:userId', verificarAuth, async (req, res) => {
    try {
        const comunidadId = parseInt(req.params.id);
        const targetUserId = parseInt(req.params.userId);
        const adminUserId = req.session.usuario.id;
        
        // Verificar que el usuario actual es creador o administrador
        const esCreadorQuery = 'SELECT idUsuario FROM comunidad WHERE idComunidad = ? AND idUsuario = ?';
        const esCreador = await executeQuery(esCreadorQuery, [comunidadId, adminUserId]);
        
        const esAdminQuery = 'SELECT rolEnComunidad FROM usuario_comunidad WHERE idComunidad = ? AND idUsuario = ?';
        const esAdmin = await executeQuery(esAdminQuery, [comunidadId, adminUserId]);
        
        if (esCreador.length === 0 && (esAdmin.length === 0 || esAdmin[0].rolEnComunidad !== 'administrador')) {
            return res.json({
                success: false,
                error: 'No tienes permisos para expulsar miembros'
            });
        }
        
        // No permitir que se expulse a sí mismo
        if (adminUserId === targetUserId) {
            return res.json({
                success: false,
                error: 'No puedes expulsarte a ti mismo'
            });
        }
        
        // No permitir expulsar al creador
        if (esCreador.length > 0 && targetUserId === esCreador[0].idUsuario) {
            return res.json({
                success: false,
                error: 'No puedes expulsar al creador de la comunidad'
            });
        }
        
        // Obtener datos del usuario antes de expulsarlo
        const userDataQuery = 'SELECT u.nombre FROM usuarios u JOIN usuario_comunidad uc ON u.idUsuario = uc.idUsuario WHERE uc.idComunidad = ? AND uc.idUsuario = ?';
        const userData = await executeQuery(userDataQuery, [comunidadId, targetUserId]);
        
        if (userData.length === 0) {
            return res.json({
                success: false,
                error: 'El usuario no es miembro de esta comunidad'
            });
        }
        
        // Expulsar miembro
        const deleteQuery = 'DELETE FROM usuario_comunidad WHERE idComunidad = ? AND idUsuario = ?';
        await executeQuery(deleteQuery, [comunidadId, targetUserId]);
        
        // Log de actividad
        await logActividad(req, 'EXPULSAR_MIEMBRO', `Expulsó a ${userData[0].nombre} de la comunidad ${comunidadId}`);
        
        res.json({
            success: true,
            mensaje: `${userData[0].nombre} ha sido expulsado de la comunidad`
        });
        
    } catch (error) {
        console.error('❌ Error expulsando miembro:', error);
        res.json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// ========================
// ADMINISTRACIÓN DE COMUNIDADES (PARA CREADORES/ADMINS)
// ========================

// API para editar información de la comunidad (solo creador/administrador)
router.post('/:id/api/editar', verificarAuth, censurarContenido, async (req, res) => {
    try {
        const comunidadId = parseInt(req.params.id);
        const userId = req.session.usuario.id;
        const { titulo, descripcion, categoria, tags } = req.body;
        
        // Verificar permisos
        const esCreadorQuery = 'SELECT idUsuario FROM comunidad WHERE idComunidad = ? AND idUsuario = ?';
        const esCreador = await executeQuery(esCreadorQuery, [comunidadId, userId]);
        
        const esAdminQuery = 'SELECT rolEnComunidad FROM usuario_comunidad WHERE idComunidad = ? AND idUsuario = ?';
        const esAdmin = await executeQuery(esAdminQuery, [comunidadId, userId]);
        
        if (esCreador.length === 0 && (esAdmin.length === 0 || esAdmin[0].rolEnComunidad !== 'administrador')) {
            return res.json({
                success: false,
                error: 'No tienes permisos para editar esta comunidad'
            });
        }
        
        // Validaciones
        if (titulo && titulo.trim().length < 3) {
            return res.json({
                success: false,
                error: 'El título debe tener al menos 3 caracteres'
            });
        }
        
        if (descripcion && descripcion.trim().length < 10) {
            return res.json({
                success: false,
                error: 'La descripción debe tener al menos 10 caracteres'
            });
        }
        
        if (categoria) {
            const categoriasPermitidas = ['infraestructura', 'seguridad', 'emergencia', 'salud', 'general'];
            if (!categoriasPermitidas.includes(categoria)) {
                return res.json({
                    success: false,
                    error: 'Categoría no válida'
                });
            }
        }
        
        // Construir query de actualización
        let updateQuery = 'UPDATE comunidad SET ';
        let updateParams = [];
        let updates = [];
        
        if (titulo) {
            updates.push('titulo = ?');
            updateParams.push(titulo.trim());
        }
        
        if (descripcion) {
            updates.push('descripcion = ?');
            updateParams.push(descripcion.trim());
        }
        
        if (categoria) {
            updates.push('categoria = ?');
            updateParams.push(categoria);
        }
        
        if (tags !== undefined) {
            updates.push('tags = ?');
            updateParams.push(tags ? tags.trim() : null);
        }
        
        if (updates.length === 0) {
            return res.json({
                success: false,
                error: 'No hay campos para actualizar'
            });
        }
        
        updateQuery += updates.join(', ') + ' WHERE idComunidad = ?';
        updateParams.push(comunidadId);
        
        await executeQuery(updateQuery, updateParams);
        
        // Log de actividad
        await logActividad(req, 'EDITAR_COMUNIDAD', `Editó información de comunidad ID: ${comunidadId}`);
        
        res.json({
            success: true,
            mensaje: 'Comunidad actualizada exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error editando comunidad:', error);
        res.json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// API para transferir administración (solo creador)
router.post('/:id/api/transferir/:userId', verificarAuth, async (req, res) => {
    try {
        const comunidadId = parseInt(req.params.id);
        const nuevoAdminId = parseInt(req.params.userId);
        const creadorId = req.session.usuario.id;
        
        // Verificar que es el creador
        const esCreadorQuery = 'SELECT idUsuario FROM comunidad WHERE idComunidad = ? AND idUsuario = ?';
        const esCreador = await executeQuery(esCreadorQuery, [comunidadId, creadorId]);
        
        if (esCreador.length === 0) {
            return res.json({
                success: false,
                error: 'Solo el creador puede transferir la administración'
            });
        }
        
        // Verificar que el nuevo admin es miembro
        const esMiembroQuery = 'SELECT rolEnComunidad FROM usuario_comunidad WHERE idComunidad = ? AND idUsuario = ?';
        const esMiembro = await executeQuery(esMiembroQuery, [comunidadId, nuevoAdminId]);
        
        if (esMiembro.length === 0) {
            return res.json({
                success: false,
                error: 'El usuario debe ser miembro de la comunidad'
            });
        }
        
        // Obtener datos del nuevo administrador
        const userDataQuery = 'SELECT nombre FROM usuarios WHERE idUsuario = ?';
        const userData = await executeQuery(userDataQuery, [nuevoAdminId]);
        
        // Transferir propiedad en la tabla comunidad
        await executeQuery('UPDATE comunidad SET idUsuario = ? WHERE idComunidad = ?', [nuevoAdminId, comunidadId]);
        
        // Actualizar roles: nuevo creador como administrador, creador anterior como miembro
        await executeQuery('UPDATE usuario_comunidad SET rolEnComunidad = "administrador" WHERE idComunidad = ? AND idUsuario = ?', [comunidadId, nuevoAdminId]);
        await executeQuery('UPDATE usuario_comunidad SET rolEnComunidad = "miembro" WHERE idComunidad = ? AND idUsuario = ?', [comunidadId, creadorId]);
        
        // Log de actividad
        await logActividad(req, 'TRANSFERIR_COMUNIDAD', `Transfirió administración de comunidad ${comunidadId} a ${userData[0].nombre}`);
        
        res.json({
            success: true,
            mensaje: `Administración transferida exitosamente a ${userData[0].nombre}`
        });
        
    } catch (error) {
        console.error('❌ Error transfiriendo administración:', error);
        res.json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

module.exports = router;