// ===============================
// CONTROLADOR ADAPTADO A TU ESTRUCTURA DE BD
// backend/controllers/communitiesController.js
// ===============================

const { execute, transaction } = require('../config/database');

const communitiesController = {
  // 🆕 FUNCIÓN HELPER: Obtener nombre real del usuario
  async getUserName(userId) {
    try {
      const userQuery = await execute(
        'SELECT nombre FROM usuarios WHERE idUsuario = ?',
        [userId]
      );
      
      if (userQuery.length > 0 && userQuery[0].nombre) {
        return userQuery[0].nombre;
      } else {
        // Generar nombre realista basado en el ID
        const nombres = [
          'María González', 'Carlos Rodríguez', 'Ana Martínez', 'Luis García',
          'Carmen López', 'José Hernández', 'Patricia Pérez', 'Francisco Sánchez',
          'Elena Moreno', 'Roberto Delgado', 'Lucía Torres', 'Miguel Jiménez'
        ];
        return nombres[userId % nombres.length] || `Usuario ${userId}`;
      }
    } catch (error) {
      console.error(`❌ Error obteniendo nombre de usuario ${userId}:`, error);
      return `Usuario ${userId}`;
    }
  },

  // 🔧 FUNCIÓN: Asegurar que el usuario existe
  async ensureUserExists(userId) {
    try {
      const userExists = await execute(
        'SELECT idUsuario, nombre FROM usuarios WHERE idUsuario = ?',
        [userId]
      );

      if (userExists.length === 0) {
        const realName = await this.getUserName(userId);
        
        await execute(`
          INSERT INTO usuarios (idUsuario, nombre, correo, contraseña, fechaCreacion, fechaActualizacion, activo)
          VALUES (?, ?, ?, ?, NOW(), NOW(), 1)
        `, [
          userId,
          realName,
          `usuario${userId}@miciudadsv.com`,
          'password123'
        ]);
        
        console.log(`✅ Usuario ${userId} (${realName}) creado`);
      }
      return true;
    } catch (error) {
      console.error(`❌ Error verificando usuario ${userId}:`, error);
      return false;
    }
  },

  // 🔍 FUNCIÓN HELPER: Detectar estructura de tablas automáticamente
  async detectTableStructure() {
    try {
      // Verificar si existe usuario_comunidad
      const checkUserCommunity = await execute(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = 'usuario_comunidad'
      `);

      // Verificar si existe usuario_comentario
      const checkUserComment = await execute(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = 'usuario_comentario'
      `);

      return {
        hasUserCommunity: checkUserCommunity[0]?.count > 0,
        hasUserComment: checkUserComment[0]?.count > 0
      };
    } catch (error) {
      console.warn('⚠️ No se pudo detectar estructura, usando valores por defecto');
      return { hasUserCommunity: true, hasUserComment: false };
    }
  },

  // Obtener todas las comunidades ADAPTADO
  getAllCommunities: async (req, res) => {
    try {
      console.log('🔍 Obteniendo todas las comunidades...');
      
      let userId = 3;
      if (req.headers['x-user-id']) {
        userId = parseInt(req.headers['x-user-id']);
      } else if (req.query.userId) {
        userId = parseInt(req.query.userId);
      }
      
      await communitiesController.ensureUserExists(userId);
      const structure = await communitiesController.detectTableStructure();
      
      let query, params;
      
      if (structure.hasUserCommunity) {
        // Estructura con tabla usuario_comunidad
        query = `
          SELECT 
            c.idComunidad as id,
            c.titulo as name,
            c.descripcion as description,
            c.categoria as category,
            NULL as imagen,
            c.fechaCreacion,
            COALESCE(u.nombre, CONCAT('Usuario ', c.idUsuario)) as creadorNombre,
            c.idUsuario as creadorId,
            COUNT(DISTINCT uc.idUsuario) as memberCount,
            CASE 
              WHEN ucu.idUsuario IS NOT NULL THEN 1 
              ELSE 0 
            END as isJoined,
            CASE 
              WHEN c.idUsuario = ? THEN 1
              WHEN ucu.rolEnComunidad = 'administrador' THEN 1
              ELSE 0 
            END as isAdmin,
            CASE 
              WHEN c.idUsuario = ? THEN 1
              ELSE 0 
            END as isCreator
          FROM comunidad c
          LEFT JOIN usuarios u ON c.idUsuario = u.idUsuario
          LEFT JOIN usuario_comunidad uc ON c.idComunidad = uc.idComunidad
          LEFT JOIN usuario_comunidad ucu ON c.idComunidad = ucu.idComunidad AND ucu.idUsuario = ?
          WHERE c.estado = 'activa' OR c.estado IS NULL
          GROUP BY c.idComunidad, c.titulo, c.descripcion, c.categoria, c.fechaCreacion, u.nombre, c.idUsuario, ucu.idUsuario, ucu.rolEnComunidad
          ORDER BY c.fechaCreacion DESC
        `;
        params = [userId, userId, userId];
      } else {
        // Estructura simple sin tabla usuario_comunidad
        query = `
          SELECT 
            c.idComunidad as id,
            c.titulo as name,
            c.descripcion as description,
            c.categoria as category,
            NULL as imagen,
            c.fechaCreacion,
            COALESCE(u.nombre, CONCAT('Usuario ', c.idUsuario)) as creadorNombre,
            c.idUsuario as creadorId,
            1 as memberCount,
            CASE 
              WHEN c.idUsuario = ? THEN 1
              ELSE 0 
            END as isJoined,
            CASE 
              WHEN c.idUsuario = ? THEN 1
              ELSE 0 
            END as isAdmin,
            CASE 
              WHEN c.idUsuario = ? THEN 1
              ELSE 0 
            END as isCreator
          FROM comunidad c
          LEFT JOIN usuarios u ON c.idUsuario = u.idUsuario
          WHERE c.estado = 'activa' OR c.estado IS NULL
          ORDER BY c.fechaCreacion DESC
        `;
        params = [userId, userId, userId];
      }
      
      const communities = await execute(query, params);
      
      // Procesar nombres reales
      const processedCommunities = await Promise.all(
        communities.map(async (community) => {
          let finalCreatorName = community.creadorNombre;
          
          if (!finalCreatorName || finalCreatorName.includes('Usuario ')) {
            finalCreatorName = await communitiesController.getUserName(community.creadorId);
          }
          
          return {
            ...community,
            isJoined: Boolean(community.isJoined),
            isAdmin: Boolean(community.isAdmin),
            isCreator: Boolean(community.isCreator),
            memberCount: Number(community.memberCount) || 0,
            creadorNombre: finalCreatorName
          };
        })
      );
      
      console.log(`✅ ${processedCommunities.length} comunidades obtenidas`);
      
      res.json({
        success: true,
        communities: processedCommunities,
        userId: userId,
        message: 'Comunidades obtenidas exitosamente'
      });
      
    } catch (error) {
      console.error('❌ Error en getAllCommunities:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        communities: [],
        details: error.message
      });
    }
  },

  // Obtener comunidades del usuario ADAPTADO
  getUserCommunities: async (req, res) => {
    try {
      console.log('🔍 Obteniendo comunidades del usuario...');
      
      let userId = 3;
      if (req.headers['x-user-id']) {
        userId = parseInt(req.headers['x-user-id']);
      } else if (req.query.userId) {
        userId = parseInt(req.query.userId);
      }
      
      await communitiesController.ensureUserExists(userId);
      const structure = await communitiesController.detectTableStructure();
      
      let query, params;
      
      if (structure.hasUserCommunity) {
        query = `
          SELECT DISTINCT
            c.idComunidad as id,
            c.titulo as name,
            c.descripcion as description,
            c.categoria as category,
            NULL as imagen,
            c.fechaCreacion,
            COALESCE(u.nombre, CONCAT('Usuario ', c.idUsuario)) as creadorNombre,
            c.idUsuario as creadorId,
            COUNT(DISTINCT uc2.idUsuario) as memberCount,
            1 as isJoined,
            CASE 
              WHEN c.idUsuario = ? THEN 1
              WHEN uc.rolEnComunidad = 'administrador' THEN 1
              ELSE 0 
            END as isAdmin,
            CASE 
              WHEN c.idUsuario = ? THEN 1
              ELSE 0 
            END as isCreator
          FROM comunidad c
          LEFT JOIN usuarios u ON c.idUsuario = u.idUsuario
          LEFT JOIN usuario_comunidad uc ON c.idComunidad = uc.idComunidad AND uc.idUsuario = ?
          LEFT JOIN usuario_comunidad uc2 ON c.idComunidad = uc2.idComunidad
          WHERE (c.estado = 'activa' OR c.estado IS NULL)
            AND (uc.idUsuario = ? OR c.idUsuario = ?)
          GROUP BY c.idComunidad, c.titulo, c.descripcion, c.categoria, c.fechaCreacion, u.nombre, c.idUsuario, uc.rolEnComunidad
          ORDER BY c.fechaCreacion DESC
        `;
        params = [userId, userId, userId, userId, userId];
      } else {
        // Sin tabla usuario_comunidad, solo mostrar comunidades creadas
        query = `
          SELECT 
            c.idComunidad as id,
            c.titulo as name,
            c.descripcion as description,
            c.categoria as category,
            NULL as imagen,
            c.fechaCreacion,
            COALESCE(u.nombre, CONCAT('Usuario ', c.idUsuario)) as creadorNombre,
            c.idUsuario as creadorId,
            1 as memberCount,
            1 as isJoined,
            1 as isAdmin,
            1 as isCreator
          FROM comunidad c
          LEFT JOIN usuarios u ON c.idUsuario = u.idUsuario
          WHERE (c.estado = 'activa' OR c.estado IS NULL) AND c.idUsuario = ?
          ORDER BY c.fechaCreacion DESC
        `;
        params = [userId];
      }
      
      const communities = await execute(query, params);
      
      // Procesar nombres reales
      const processedCommunities = await Promise.all(
        communities.map(async (community) => {
          let finalCreatorName = community.creadorNombre;
          
          if (!finalCreatorName || finalCreatorName.includes('Usuario ')) {
            finalCreatorName = await communitiesController.getUserName(community.creadorId);
          }
          
          return {
            ...community,
            isJoined: true,
            isAdmin: Boolean(community.isAdmin),
            isCreator: Boolean(community.isCreator),
            memberCount: Number(community.memberCount) || 0,
            creadorNombre: finalCreatorName
          };
        })
      );
      
      console.log(`✅ ${processedCommunities.length} comunidades del usuario obtenidas`);
      
      res.json({
        success: true,
        communities: processedCommunities,
        userId: userId,
        message: 'Comunidades del usuario obtenidas exitosamente'
      });
      
    } catch (error) {
      console.error('❌ Error en getUserCommunities:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        communities: []
      });
    }
  },

  // Crear nueva comunidad ADAPTADO
  createCommunity: async (req, res) => {
    try {
      console.log('🔄 Creando nueva comunidad...');
      const { name, description, category = 'general', tags = '' } = req.body;
      
      let userId = 3;
      if (req.headers['x-user-id']) {
        userId = parseInt(req.headers['x-user-id']);
      } else if (req.query.userId) {
        userId = parseInt(req.query.userId);
      }
      
      // Validaciones
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'El nombre de la comunidad es requerido'
        });
      }
      
      if (!description || !description.trim()) {
        return res.status(400).json({
          success: false,
          error: 'La descripción es requerida'
        });
      }
      
      await communitiesController.ensureUserExists(userId);
      const structure = await communitiesController.detectTableStructure();
      
      // Obtener nombre real del creador
      const realUserName = await communitiesController.getUserName(userId);
      
      // Crear comunidad con transacción
      const result = await transaction(async (connection) => {
        // 1. Insertar comunidad
        const insertCommunityQuery = `
          INSERT INTO comunidad (
            idUsuario, 
            titulo, 
            descripcion, 
            categoria, 
            tags, 
            fechaCreacion, 
            estado
          ) VALUES (?, ?, ?, ?, ?, NOW(), 'activa')
        `;
        
        const [communityResult] = await connection.execute(insertCommunityQuery, [
          userId, name.trim(), description.trim(), category, tags
        ]);
        
        const communityId = communityResult.insertId;
        
        // 2. Agregar al creador como administrador (solo si existe la tabla)
        if (structure.hasUserCommunity) {
          const insertMemberQuery = `
            INSERT INTO usuario_comunidad (idUsuario, idComunidad, rolEnComunidad, fechaUnion)
            VALUES (?, ?, 'administrador', NOW())
          `;
          
          await connection.execute(insertMemberQuery, [userId, communityId]);
        }
        
        // 3. Crear mensaje de bienvenida
        const welcomeMessage = `¡Bienvenidos a ${name.trim()}! Esta comunidad fue creada por ${realUserName}. ${description.trim()}. ¡Comencemos a conversar!`;
        
        // Insertar en comentarios
        const insertCommentQuery = `
          INSERT INTO comentarios (idComunidad, idUsuario, comentario, fechaComentario)
          VALUES (?, ?, ?, NOW())
        `;
        
        const [commentResult] = await connection.execute(insertCommentQuery, [communityId, userId, welcomeMessage]);
        
        // Si existe usuario_comentario, insertar relación
        if (structure.hasUserComment) {
          await connection.execute(
            'INSERT INTO usuario_comentario (idUsuario, idComentario, rolEnComentario) VALUES (?, ?, ?)',
            [userId, commentResult.insertId, 'autor']
          );
        }
        
        return {
          id: communityId,
          name: name.trim(),
          description: description.trim(),
          category: category,
          tags: tags,
          imagen: null,
          fechaCreacion: new Date().toISOString(),
          creadorNombre: realUserName,
          creadorId: userId,
          memberCount: 1,
          isJoined: true,
          isAdmin: true,
          isCreator: true
        };
      });
      
      console.log('✅ Comunidad creada exitosamente:', result.name);
      
      res.status(201).json({
        success: true,
        community: result,
        userId: userId,
        message: 'Comunidad creada exitosamente'
      });
      
    } catch (error) {
      console.error('❌ Error en createCommunity:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      });
    }
  },

  // Unirse/salir de comunidad ADAPTADO
  toggleMembership: async (req, res) => {
    try {
      const { action, communityId } = req.body;
      
      let userId = 3;
      if (req.headers['x-user-id']) {
        userId = parseInt(req.headers['x-user-id']);
      } else if (req.query.userId) {
        userId = parseInt(req.query.userId);
      }
      
      console.log(`🔄 ${action} comunidad ${communityId} para usuario ${userId}`);
      
      if (!['join', 'leave'].includes(action)) {
        return res.status(400).json({
          success: false,
          error: 'Acción inválida. Use "join" o "leave"'
        });
      }
      
      await communitiesController.ensureUserExists(userId);
      const structure = await communitiesController.detectTableStructure();
      
      // Verificar si es el creador
      const creatorCheck = await execute(
        'SELECT idUsuario FROM comunidad WHERE idComunidad = ?',
        [communityId]
      );

      if (creatorCheck.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Comunidad no encontrada'
        });
      }

      const isCreator = creatorCheck[0].idUsuario === userId;

      if (action === 'leave' && isCreator) {
        return res.status(400).json({
          success: false,
          error: 'El creador no puede abandonar su propia comunidad'
        });
      }

      // Solo procesar si existe tabla usuario_comunidad
      if (structure.hasUserCommunity) {
        if (action === 'join') {
          await execute(`
            INSERT IGNORE INTO usuario_comunidad (idUsuario, idComunidad, rolEnComunidad, fechaUnion)
            VALUES (?, ?, 'miembro', NOW())
          `, [userId, communityId]);
        } else {
          await execute(`
            DELETE FROM usuario_comunidad 
            WHERE idUsuario = ? AND idComunidad = ?
          `, [userId, communityId]);
        }
      }

      const userName = await communitiesController.getUserName(userId);
      console.log(`✅ ${userName} ${action === 'join' ? 'se unió a' : 'salió de'} la comunidad`);
      
      res.json({
        success: true,
        message: action === 'join' ? 
          'Te has unido a la comunidad exitosamente' : 
          'Has salido de la comunidad exitosamente',
        isJoined: action === 'join',
        userId: userId
      });
      
    } catch (error) {
      console.error('❌ Error en toggleMembership:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      });
    }
  },

  // Obtener mensajes de comunidad ADAPTADO
  getCommunityMessages: async (req, res) => {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;
      
      let userId = 3;
      if (req.headers['x-user-id']) {
        userId = parseInt(req.headers['x-user-id']);
      } else if (req.query.userId) {
        userId = parseInt(req.query.userId);
      }
      
      console.log(`📬 Obteniendo mensajes de comunidad ${id}, página ${page}`);
      
      await communitiesController.ensureUserExists(userId);
      const structure = await communitiesController.detectTableStructure();
      
      // Auto-unir usuario si es necesario y existe la tabla
      if (structure.hasUserCommunity) {
        const membershipCheck = await execute(`
          SELECT uc.idUsuario, c.idUsuario as creatorId
          FROM usuario_comunidad uc
          RIGHT JOIN comunidad c ON uc.idComunidad = c.idComunidad
          WHERE c.idComunidad = ? AND (uc.idUsuario = ? OR uc.idUsuario IS NULL)
        `, [id, userId]);

        if (membershipCheck.length > 0) {
          const creatorId = membershipCheck[0].creatorId;
          
          if (!membershipCheck[0].idUsuario && userId !== creatorId) {
            await execute(`
              INSERT IGNORE INTO usuario_comunidad (idUsuario, idComunidad, rolEnComunidad, fechaUnion)
              VALUES (?, ?, 'miembro', NOW())
            `, [userId, id]);
          } else if (userId === creatorId) {
            await execute(`
              INSERT IGNORE INTO usuario_comunidad (idUsuario, idComunidad, rolEnComunidad, fechaUnion)
              VALUES (?, ?, 'administrador', NOW())
            `, [userId, id]);
          }
        }
      }
      
      let query, params;
      
      if (structure.hasUserComment) {
        // Usar tabla usuario_comentario
        query = `
          SELECT
            uc.idComentario as id,
            c.comentario as text,
            c.fechaComentario as timestamp,
            COALESCE(u.nombre, CONCAT('Usuario ', uc.idUsuario)) as userName,
            uc.idUsuario as userId,
            CASE WHEN uc.idUsuario = ? THEN 1 ELSE 0 END as isOwn,
            CASE WHEN uc.idUsuario = co.idUsuario THEN 1 ELSE 0 END as isCreatorMessage,
            CASE
              WHEN uc.idUsuario = co.idUsuario THEN 'Creador'
              WHEN ucm.rolEnComunidad = 'administrador' THEN 'Admin'
              ELSE 'Miembro'
            END as userRole
          FROM usuario_comentario uc
          INNER JOIN comentarios c ON uc.idComentario = c.idComentario
          INNER JOIN usuarios u ON uc.idUsuario = u.idUsuario
          INNER JOIN comunidad co ON c.idComunidad = co.idComunidad
          LEFT JOIN usuario_comunidad ucm ON co.idComunidad = ucm.idComunidad AND uc.idUsuario = ucm.idUsuario
          WHERE c.idComunidad = ?
          ORDER BY c.fechaComentario ASC
          LIMIT ? OFFSET ?
        `;
        params = [userId, id, limit, offset];
      } else {
        // Usar solo tabla comentarios
        query = `
          SELECT
            c.idComentario as id,
            c.comentario as text,
            c.fechaComentario as timestamp,
            COALESCE(u.nombre, CONCAT('Usuario ', c.idUsuario)) as userName,
            c.idUsuario as userId,
            CASE WHEN c.idUsuario = ? THEN 1 ELSE 0 END as isOwn,
            CASE WHEN c.idUsuario = co.idUsuario THEN 1 ELSE 0 END as isCreatorMessage,
            CASE
              WHEN c.idUsuario = co.idUsuario THEN 'Creador'
              WHEN ucm.rolEnComunidad = 'administrador' THEN 'Admin'
              ELSE 'Miembro'
            END as userRole
          FROM comentarios c
          INNER JOIN usuarios u ON c.idUsuario = u.idUsuario
          INNER JOIN comunidad co ON c.idComunidad = co.idComunidad
          LEFT JOIN usuario_comunidad ucm ON co.idComunidad = ucm.idComunidad AND c.idUsuario = ucm.idUsuario
          WHERE c.idComunidad = ?
          ORDER BY c.fechaComentario ASC
          LIMIT ? OFFSET ?
        `;
        params = [userId, id, limit, offset];
      }

      const messages = await execute(query, params);

      // Procesar mensajes con nombres reales
      const processedMessages = await Promise.all(
        messages.map(async (message) => {
          let finalUserName = message.userName;
          
          if (!finalUserName || finalUserName.includes('Usuario ')) {
            finalUserName = await communitiesController.getUserName(message.userId);
          }

          return {
            ...message,
            userName: finalUserName,
            isOwn: Boolean(message.isOwn),
            isCreatorMessage: Boolean(message.isCreatorMessage),
            imagenes: []
          };
        })
      );
      
      console.log(`✅ ${processedMessages.length} mensajes obtenidos`);
      
      res.json({
        success: true,
        messages: processedMessages,
        page: page,
        userId: userId,
        totalMessages: processedMessages.length,
        hasMore: processedMessages.length === limit,
        message: 'Mensajes obtenidos exitosamente'
      });
      
    } catch (error) {
      console.error('❌ Error en getCommunityMessages:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        messages: [],
        details: error.message
      });
    }
  },

  // Enviar mensaje ADAPTADO
  sendMessage: async (req, res) => {
    try {
      const { id } = req.params;
      const { text } = req.body;
      
      let userId = 3;
      if (req.headers['x-user-id']) {
        userId = parseInt(req.headers['x-user-id']);
      } else if (req.query.userId) {
        userId = parseInt(req.query.userId);
      }
      
      console.log(`📝 Enviando mensaje a comunidad ${id} por usuario ${userId}`);
      
      if (!text || !text.trim()) {
        return res.status(400).json({
          success: false,
          error: 'El mensaje no puede estar vacío'
        });
      }
      
      await communitiesController.ensureUserExists(userId);
      const structure = await communitiesController.detectTableStructure();
      
      // Verificar comunidad existe
      const communityCheck = await execute(
        'SELECT idUsuario as creatorId, titulo FROM comunidad WHERE idComunidad = ?',
        [id]
      );

      if (communityCheck.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Comunidad no encontrada'
        });
      }

      const creatorId = communityCheck[0].creatorId;
      let userRole = 'Miembro';

      if (userId === creatorId) {
        userRole = 'Creador';
        // Asegurar que el creador esté en usuario_comunidad si existe la tabla
        if (structure.hasUserCommunity) {
          await execute(`
            INSERT IGNORE INTO usuario_comunidad (idUsuario, idComunidad, rolEnComunidad, fechaUnion)
            VALUES (?, ?, 'administrador', NOW())
          `, [userId, id]);
        }
      } else if (structure.hasUserCommunity) {
        // Verificar rol en usuario_comunidad
        const roleCheck = await execute(
          'SELECT rolEnComunidad FROM usuario_comunidad WHERE idUsuario = ? AND idComunidad = ?',
          [userId, id]
        );
        
        if (roleCheck.length > 0) {
          userRole = roleCheck[0].rolEnComunidad === 'administrador' ? 'Admin' : 'Miembro';
        } else {
          // Auto-unir como miembro
          await execute(`
            INSERT IGNORE INTO usuario_comunidad (idUsuario, idComunidad, rolEnComunidad, fechaUnion)
            VALUES (?, ?, 'miembro', NOW())
          `, [userId, id]);
        }
      }
      
      // Insertar mensaje usando transacción
      const result = await transaction(async (connection) => {
        // 1. Insertar en comentarios
        const [commentResult] = await connection.execute(
          'INSERT INTO comentarios (idComunidad, idUsuario, comentario, fechaComentario) VALUES (?, ?, ?, NOW())',
          [id, userId, text.trim()]
        );
        
        const comentarioId = commentResult.insertId;
        
        // 2. Insertar en usuario_comentario si existe la tabla
        if (structure.hasUserComment) {
          await connection.execute(
            'INSERT INTO usuario_comentario (idUsuario, idComentario, rolEnComentario) VALUES (?, ?, ?)',
            [userId, comentarioId, 'autor']
          );
        }
        
        return comentarioId;
      });
      
      // Obtener nombre real del usuario
      const realUserName = await communitiesController.getUserName(userId);
      
      const newMessage = {
        id: result,
        text: text.trim(),
        userName: realUserName,
        userId: userId,
        timestamp: new Date().toISOString(),
        userRole: userRole,
        isCreatorMessage: userRole === 'Creador'
      };
      
      console.log(`✅ Mensaje enviado por ${realUserName} (${userRole})`);
      
      res.status(201).json({
        success: true,
        message: {
          ...newMessage,
          isOwn: true,
          imagenes: []
        },
        userId: userId,
        messageText: 'Mensaje enviado exitosamente'
      });
      
    } catch (error) {
      console.error('❌ Error en sendMessage:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      });
    }
  },

  // Obtener detalles de comunidad ADAPTADO
  getCommunityDetails: async (req, res) => {
    try {
      const { id } = req.params;
      
      let userId = 3;
      if (req.headers['x-user-id']) {
        userId = parseInt(req.headers['x-user-id']);
      } else if (req.query.userId) {
        userId = parseInt(req.query.userId);
      }
      
      console.log(`🔍 Obteniendo detalles de comunidad ${id} para usuario ${userId}`);
      
      await communitiesController.ensureUserExists(userId);
      const structure = await communitiesController.detectTableStructure();
      
      let query, params;
      
      if (structure.hasUserCommunity) {
        query = `
          SELECT 
            c.idComunidad as id,
            c.titulo as name,
            c.descripcion as description,
            c.categoria as category,
            NULL as imagen,
            c.fechaCreacion,
            COALESCE(u.nombre, CONCAT('Usuario ', c.idUsuario)) as creadorNombre,
            c.idUsuario as creadorId,
            COUNT(DISTINCT uc.idUsuario) as memberCount,
            CASE 
              WHEN ucu.idUsuario IS NOT NULL OR c.idUsuario = ? THEN 1 
              ELSE 0 
            END as isJoined,
            CASE 
              WHEN c.idUsuario = ? THEN 1
              WHEN ucu.rolEnComunidad = 'administrador' THEN 1
              ELSE 0 
            END as isAdmin,
            CASE 
              WHEN c.idUsuario = ? THEN 1
              ELSE 0 
            END as isCreator
          FROM comunidad c
          LEFT JOIN usuarios u ON c.idUsuario = u.idUsuario
          LEFT JOIN usuario_comunidad uc ON c.idComunidad = uc.idComunidad
          LEFT JOIN usuario_comunidad ucu ON c.idComunidad = ucu.idComunidad AND ucu.idUsuario = ?
          WHERE c.idComunidad = ? AND (c.estado = 'activa' OR c.estado IS NULL)
          GROUP BY c.idComunidad, c.titulo, c.descripcion, c.categoria, c.fechaCreacion, u.nombre, c.idUsuario, ucu.idUsuario, ucu.rolEnComunidad
        `;
        params = [userId, userId, userId, userId, id];
      } else {
        query = `
          SELECT 
            c.idComunidad as id,
            c.titulo as name,
            c.descripcion as description,
            c.categoria as category,
            NULL as imagen,
            c.fechaCreacion,
            COALESCE(u.nombre, CONCAT('Usuario ', c.idUsuario)) as creadorNombre,
            c.idUsuario as creadorId,
            1 as memberCount,
            CASE 
              WHEN c.idUsuario = ? THEN 1
              ELSE 0 
            END as isJoined,
            CASE 
              WHEN c.idUsuario = ? THEN 1
              ELSE 0 
            END as isAdmin,
            CASE 
              WHEN c.idUsuario = ? THEN 1
              ELSE 0 
            END as isCreator
          FROM comunidad c
          LEFT JOIN usuarios u ON c.idUsuario = u.idUsuario
          WHERE c.idComunidad = ? AND (c.estado = 'activa' OR c.estado IS NULL)
        `;
        params = [userId, userId, userId, id];
      }
      
      const result = await execute(query, params);
      
      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Comunidad no encontrada'
        });
      }
      
      const community = result[0];
      
      // Asegurar nombre real del creador
      let finalCreatorName = community.creadorNombre;
      if (!finalCreatorName || finalCreatorName.includes('Usuario ')) {
        finalCreatorName = await communitiesController.getUserName(community.creadorId);
      }
      
      const processedCommunity = {
        ...community,
        isJoined: Boolean(community.isJoined),
        isAdmin: Boolean(community.isAdmin),
        isCreator: Boolean(community.isCreator),
        memberCount: Number(community.memberCount) || 0,
        creadorNombre: finalCreatorName
      };
      
      console.log('✅ Detalles de comunidad obtenidos');
      
      res.json({
        success: true,
        community: processedCommunity,
        userId: userId,
        message: 'Detalles de comunidad obtenidos exitosamente'
      });
      
    } catch (error) {
      console.error('❌ Error en getCommunityDetails:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      });
    }
  },

  // 🆕 FUNCIÓN DEBUG: Para verificar estructura de BD
  debugDatabase: async (req, res) => {
    try {
      console.log('🔍 Ejecutando debug de base de datos...');
      
      const debugInfo = {};
      
      // Verificar tablas existentes
      try {
        const tables = await execute(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = DATABASE() 
          AND table_name IN ('comunidad', 'comentarios', 'usuarios', 'usuario_comunidad', 'usuario_comentario')
        `);
        debugInfo.existingTables = tables.map(t => t.table_name || t.TABLE_NAME);
      } catch (error) {
        debugInfo.existingTables = ['Error verificando tablas'];
      }
      
      // Verificar estructura de comentarios
      try {
        const commentStructure = await execute('DESCRIBE comentarios');
        debugInfo.comentariosStructure = commentStructure.map(col => ({
          field: col.Field || col.field,
          type: col.Type || col.type,
          null: col.Null || col.null,
          key: col.Key || col.key
        }));
      } catch (error) {
        debugInfo.comentariosStructure = ['Error: ' + error.message];
      }
      
      // Verificar estructura de comunidad
      try {
        const communityStructure = await execute('DESCRIBE comunidad');
        debugInfo.comunidadStructure = communityStructure.map(col => ({
          field: col.Field || col.field,
          type: col.Type || col.type,
          null: col.Null || col.null,
          key: col.Key || col.key
        }));
      } catch (error) {
        debugInfo.comunidadStructure = ['Error: ' + error.message];
      }
      
      // Verificar estructura de usuario_comentario si existe
      if (debugInfo.existingTables.includes('usuario_comentario')) {
        try {
          const userCommentStructure = await execute('DESCRIBE usuario_comentario');
          debugInfo.usuarioComentarioStructure = userCommentStructure.map(col => ({
            field: col.Field || col.field,
            type: col.Type || col.type,
            null: col.Null || col.null,
            key: col.Key || col.key
          }));
        } catch (error) {
          debugInfo.usuarioComentarioStructure = ['Error: ' + error.message];
        }
      }
      
      // Verificar datos de ejemplo
      try {
        const sampleCommunities = await execute('SELECT * FROM comunidad LIMIT 3');
        debugInfo.sampleCommunities = sampleCommunities;
      } catch (error) {
        debugInfo.sampleCommunities = ['Error: ' + error.message];
      }
      
      try {
        const sampleComments = await execute('SELECT * FROM comentarios LIMIT 3');
        debugInfo.sampleComments = sampleComments;
      } catch (error) {
        debugInfo.sampleComments = ['Error: ' + error.message];
      }
      
      // Detectar estructura automáticamente
      const detectedStructure = await communitiesController.detectTableStructure();
      debugInfo.detectedStructure = detectedStructure;
      
      console.log('✅ Debug completado');
      
      res.json({
        success: true,
        debug: debugInfo,
        recommendations: [
          debugInfo.existingTables.includes('usuario_comentario') ? 
            '✅ Tabla usuario_comentario existe - usando estructura completa' :
            '⚠️ Tabla usuario_comentario no existe - usando estructura simple',
          debugInfo.existingTables.includes('usuario_comunidad') ? 
            '✅ Tabla usuario_comunidad existe - membresías habilitadas' :
            '⚠️ Tabla usuario_comunidad no existe - solo creadores pueden administrar',
          '💡 Revisar los campos detectados para optimizar las consultas'
        ],
        message: 'Debug de base de datos completado'
      });
      
    } catch (error) {
      console.error('❌ Error en debugDatabase:', error);
      res.status(500).json({
        success: false,
        error: 'Error ejecutando debug',
        details: error.message
      });
    }
  }
};

module.exports = communitiesController;

// ===============================
// 2. RUTAS ACTUALIZADAS CON DEBUG
// backend/routes/communities.js
// ===============================

const express = require('express');
const router = express.Router();
const communitiesController = require('../controllers/communitiesController');

// Middleware de autenticación
const authMiddleware = (req, res, next) => {
  let userId = 3;
  
  if (req.headers['x-user-id']) {
    userId = parseInt(req.headers['x-user-id']);
  } else if (req.query.userId) {
    userId = parseInt(req.query.userId);
  }
  
  req.user = {
    idUsuario: userId,
    nombre: `Usuario ${userId}`
  };
  
  next();
};

// 🆕 Rutas de debug (MUY ESPECÍFICAS PRIMERO)
router.get('/debug/database', authMiddleware, communitiesController.debugDatabase);
router.get('/test/debug', (req, res) => {
  console.log('🔍 Test de debug básico');
  res.json({
    success: true,
    debug: {
      database: 'Conectada',
      timestamp: new Date().toISOString(),
      server: 'Running'
    },
    message: 'API de comunidades funcionando correctamente'
  });
});

router.get('/test/connection', (req, res) => {
  console.log('🔍 Test de conexión');
  res.json({
    success: true,
    message: 'API de comunidades funcionando',
    timestamp: new Date().toISOString()
  });
});

// Rutas de usuario (específicas)
router.get('/user', authMiddleware, communitiesController.getUserCommunities);

// Rutas de acciones (específicas)
router.post('/action', authMiddleware, communitiesController.toggleMembership);

// Rutas específicas de comunidad (orden importante)
router.get('/:id/messages', authMiddleware, communitiesController.getCommunityMessages);
router.post('/:id/messages', authMiddleware, communitiesController.sendMessage);
router.get('/:id', authMiddleware, communitiesController.getCommunityDetails);

// Rutas generales (menos específicas)
router.get('/', authMiddleware, communitiesController.getAllCommunities);
router.post('/', authMiddleware, communitiesController.createCommunity);

module.exports = router;

// ===============================
// 3. INSTRUCCIONES PARA IMPLEMENTACIÓN
// ===============================

/*
🔧 PASOS PARA IMPLEMENTAR:

1. **Reemplazar tu controlador actual:**
   - Guarda una copia de seguridad de tu archivo actual
   - Reemplaza el contenido con este código adaptado

2. **Actualizar las rutas:**
   - Asegúrate de que tu server.js use: app.use('/api/communities', communitiesRoutes);
   - Elimina cualquier ruta manual de communities en server.js

3. **Probar la detección automática:**
   - Ve a: http://tu-ip:3000/api/communities/debug/database
   - Esto te mostrará la estructura detectada de tu BD

4. **Verificar funcionamiento:**
   - Todas las funciones se adaptarán automáticamente a tu estructura
   - Si tienes usuario_comentario, usará esa tabla
   - Si no la tienes, usará solo la tabla comentarios

5. **Personalizar si es necesario:**
   - Revisa el debug para ver qué estructura se detectó
   - Ajusta los nombres de campos si son diferentes

🚨 CAMPOS QUE ASUME EL CÓDIGO:
- comunidad: idComunidad, titulo, descripcion, categoria, idUsuario, fechaCreacion, estado
- comentarios: idComentario, idComunidad, idUsuario, comentario, fechaComentario  
- usuarios: idUsuario, nombre, correo, contraseña, fechaCreacion
- usuario_comunidad (opcional): idUsuario, idComunidad, rolEnComunidad, fechaUnion
- usuario_comentario (opcional): idUsuario, idComentario, rolEnComentario

Si tus campos tienen nombres diferentes, ajusta las consultas SQL.
*/