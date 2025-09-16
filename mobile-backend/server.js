// backend/server.js - Versión completa con autenticación integrada
// Al INICIO del archivo server.js
require('dotenv').config();
console.log('🔧 Environment loaded');
console.log('📧 EMAIL_USER:', process.env.EMAIL_USER);
console.log('🔑 EMAIL_PASSWORD configured:', !!process.env.EMAIL_PASSWORD);

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const connectDB = require('./config/database');
const { pool, execute } = require('./config/database');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10; // Número de rondas de encriptación

// 🔔 Importar rutas de notificaciones push

// ✅ IMPORTAR MULTER PARA SUBIDA DE ARCHIVOS
const multer = require('multer');

// ✅ CONFIGURAR MULTER PARA SUBIDA DE IMÁGENES DE REPORTES
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // ✅ USAR DIRECTORIO COMPARTIDO CON LA PLATAFORMA WEB
    const uploadDir = 'C:/ImagenesCompartidas/uploads/reportes/';
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)){
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('📁 Directorio compartido creado:', uploadDir);
    }
    
    console.log('📁 Guardando imagen en directorio compartido:', uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'reporte-' + uniqueSuffix + path.extname(file.originalname);
    cb(null, filename);
  }
});

// ✅ CONFIGURAR MULTER PARA FOTOS DE PERFIL
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // ✅ USAR DIRECTORIO COMPARTIDO PARA FOTOS DE PERFIL
    const uploadDir = 'C:/ImagenesCompartidas/uploads/profiles/';
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)){
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('📁 Directorio de perfiles creado:', uploadDir);
    }
    
    console.log('📁 Guardando foto de perfil en:', uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'profile-' + uniqueSuffix + path.extname(file.originalname);
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

// ✅ CONFIGURAR MULTER PARA FOTOS DE PERFIL
const profileUpload = multer({ 
  storage: profileStorage,
  limits: {
    fileSize: 3 * 1024 * 1024, // 3MB máximo para fotos de perfil
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

// ✅ IMPORTAR RUTAS DE REPORTES CON MULTER
const reportesRoutes = require('./routes/reportes');

let emailService = null;
try {
  emailService = require('./services/emailService');
  console.log('✅ EmailService loaded successfully');
  console.log('📧 EmailService instance:', !!emailService);
  if (emailService) {
    console.log('🔧 EmailService available:', true);
  }
} catch (error) {
  console.warn('⚠️ EmailService not available:', error.message);
  console.error('❌ Error details:', error);
}
// ✅ FUNCIÓN HELPER PARA GENERAR CÓDIGOS
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ✅ FUNCIÓN HELPER PARA CALCULAR EXPIRACIÓN (10 minutos)
function getCodeExpiration() {
  const expiration = new Date();
  expiration.setMinutes(expiration.getMinutes() + 10);
  // Convertir a formato MySQL: YYYY-MM-DD HH:MM:SS
  return expiration.toISOString().slice(0, 19).replace('T', ' ');
}

// ✅ FUNCIÓN HELPER PARA GENERAR CONTRASEÑA TEMPORAL
function generateTemporaryPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 🆕 FUNCIÓN PARA CREAR TABLA DE USUARIOS EXPULSADOS
async function createExpelledUsersTable() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS usuarios_expulsados (
        id INT NOT NULL AUTO_INCREMENT,
        idUsuario INT NOT NULL,
        idComunidad INT NOT NULL,
        fechaExpulsion DATETIME DEFAULT CURRENT_TIMESTAMP,
        motivo VARCHAR(255) DEFAULT 'Expulsado por el creador',
        PRIMARY KEY (id),
        UNIQUE KEY unique_user_community (idUsuario, idComunidad),
        FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) ON DELETE CASCADE,
        FOREIGN KEY (idComunidad) REFERENCES comunidad(idComunidad) ON DELETE CASCADE
      )
    `;
    
    await execute(createTableQuery);
    console.log('✅ Tabla usuarios_expulsados creada/verificada');
  } catch (error) {
    console.error('❌ Error creando tabla usuarios_expulsados:', error);
  }
}

// Función para crear tabla de reacciones a comentarios
async function createReactionsTable() {
  try {
    const sql = `
      CREATE TABLE IF NOT EXISTS reacciones_comentarios (
        id INT NOT NULL AUTO_INCREMENT,
        idComentario INT NOT NULL,
        idUsuario INT NOT NULL,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY unique_reaction (idComentario, idUsuario),
        FOREIGN KEY (idComentario) REFERENCES comentarios_reportes(id) ON DELETE CASCADE,
        FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) ON DELETE CASCADE
      )
    `;
    
    await execute(sql);
    console.log('✅ Tabla reacciones_comentarios creada/verificada');
  } catch (error) {
    console.error('❌ Error creando tabla reacciones_comentarios:', error);
  }
}

// Función para crear tabla de respuestas a comentarios
async function createRepliesTable() {
  try {
    const sql = `
      CREATE TABLE IF NOT EXISTS respuestas_comentarios (
        id INT NOT NULL AUTO_INCREMENT,
        idComentarioPadre INT NOT NULL,
        idUsuario INT NOT NULL,
        respuesta TEXT NOT NULL,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        activo TINYINT(1) DEFAULT 1,
        PRIMARY KEY (id),
        FOREIGN KEY (idComentarioPadre) REFERENCES comentarios_reportes(id) ON DELETE CASCADE,
        FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) ON DELETE CASCADE
      )
    `;
    
    await execute(sql);
    console.log('✅ Tabla respuestas_comentarios creada/verificada');
  } catch (error) {
    console.error('❌ Error creando tabla respuestas_comentarios:', error);
  }
}

// ✅ NUEVA FUNCIÓN DE DEBUG
function debugFormData(body, contentType) {
  console.log('\n🔍 ===== DEBUG FORMDATA =====');
  console.log('📋 Content-Type:', contentType);
  console.log('📊 Body length:', body.length);
  
  if (contentType.includes('multipart/form-data')) {
    const boundary = contentType.split('boundary=')[1];
    console.log('🔗 Boundary:', boundary);
    
    if (boundary) {
      const parts = body.split(`--${boundary}`);
      console.log('📦 Parts found:', parts.length);
      
      parts.forEach((part, index) => {
        if (part.includes('Content-Disposition: form-data')) {
          const nameMatch = part.match(/name="([^"]+)"/);
          if (nameMatch) {
            const fieldName = nameMatch[1];
            const valueStart = part.indexOf('\r\n\r\n');
            if (valueStart !== -1) {
              let value = part.substring(valueStart + 4);
              value = value.replace(/\r\n$/, '');
              
              if (part.includes('Content-Type:')) {
                console.log(`📷 Part ${index} - ${fieldName}: [IMAGE DATA - ${value.length} bytes]`);
              } else {
                console.log(`📝 Part ${index} - ${fieldName}: "${value.trim()}"`);
              }
            }
          }
        }
      });
    }
  }
  console.log('===== END DEBUG =====\n');
}



const PORT = process.env.PORT || 3000;

// Variable para saber si la base de datos está disponible
let isDatabaseConnected = false;

// ===============================
// FUNCIONES DE COMUNIDADES - VERSIÓN COMPLETA Y CORREGIDA CON NOMBRES REALES
// ===============================

// 🆕 CATEGORÍAS PREDEFINIDAS PARA COMUNIDADES
const COMMUNITY_CATEGORIES = [
  'General',
  'Seguridad Ciudadana',
  'Medio Ambiente',
  'Educación',
  'Salud',
  'Transporte',
  'Cultura',
  'Deportes',
  'Tecnología',
  'Negocios',
  'Turismo',
  'Servicios Públicos',
  'Eventos',
  'Voluntariado',
  'Otros'
];

const communityQueries = {
  // 🆕 FUNCIÓN HELPER: Obtener nombre real del usuario
  async getUserName(userId) {
    if (!isDatabaseConnected || !userId) {
      return `Usuario ${userId}`;
    }

    try {
      const userQuery = `
        SELECT nombre FROM usuarios WHERE idUsuario = ?
      `;
      const userResult = await execute(userQuery, [userId]);
      
      if (userResult.length > 0 && userResult[0].nombre) {
        console.log(`✅ Nombre real encontrado para usuario ${userId}: ${userResult[0].nombre}`);
        return userResult[0].nombre;
      }
      
      // 🎯 FALLBACK CON NOMBRES REALISTAS BASADOS EN EL ID
      const nombres = [
        'Ana García', 'Carlos Rodríguez', 'María González', 'José Martínez', 'Elena Moreno',
        'David López', 'Carmen Sánchez', 'Miguel Fernández', 'Laura Jiménez', 'Antonio Ruiz',
        'Patricia Díaz', 'Manuel Álvarez', 'Rosa Romero', 'Francisco Torres', 'Isabel Navarro',
        'Alejandro Ramos', 'Cristina Vega', 'Roberto Delgado', 'Mónica Castro', 'Fernando Gil',
        'Sandra Ortega', 'Pedro Serrano', 'Beatriz Molina', 'Raúl Morales', 'Nuria Iglesias',
        'Sergio Guerrero', 'Silvia Medina', 'Adrián Garrido', 'Pilar Cortés', 'Rubén León',
        'Teresa Herrera', 'Iván Peña', 'Natalia Vargas', 'Óscar Herrero', 'Verónica Campos',
        'Daniel Valencia', 'Lorena Cano', 'Marcos Prieto', 'Andrea Calvo'
      ];
      
      const nombreIndex = (parseInt(userId) - 1) % nombres.length;
      const nombreGenerado = nombres[nombreIndex];
      
      console.log(`📝 Nombre generado para usuario ${userId}: ${nombreGenerado}`);
      return nombreGenerado;
      
    } catch (error) {
      console.error('❌ Error obteniendo nombre de usuario:', error);
      return `Usuario ${userId}`;
    }
  },

  // Función para obtener o crear usuario por defecto
  async ensureUserExists(userId = 1) {
    if (!isDatabaseConnected) {
      console.log('⚠️ Base de datos no conectada, no hay usuario existente');
      return true;
    }
    
    try {
      console.log(`🔍 Verificando si usuario ${userId} existe...`);
      
      const userExists = await execute(
        'SELECT idUsuario FROM usuarios WHERE idUsuario = ?', 
        [userId]
      );
      
      if (userExists.length > 0) {
        console.log(`✅ Usuario ${userId} ya existe`);
        return true;
      }
      
      console.log(`🔄 Usuario ${userId} no existe, creándolo...`);
      
      try {
        // Obtener nombre realista para el nuevo usuario
        const nombreUsuario = await this.getUserName(userId);
        
        await execute(
          'INSERT INTO usuarios (idUsuario, nombre, correo, contraseña, fechaCreacion, fechaActualizacion, activo) VALUES (?, ?, ?, ?, NOW(), NOW(), 1)',
          [userId, nombreUsuario, `usuario${userId}@miciudadsv.com`, 'password123']
        );
        console.log(`✅ Usuario ${userId} creado exitosamente con nombre: ${nombreUsuario}`);
        return true;
      } catch (insertError) {
        if (insertError.code === 'ER_DUP_ENTRY') {
          console.log(`✅ Usuario ${userId} ya existía`);
          return true;
        }
        console.error(`❌ No se pudo crear usuario ${userId}:`, insertError);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error en ensureUserExists:', error);
      return false;
    }
  },

  // 🆕 OBTENER TODAS LAS COMUNIDADES CON NOMBRES REALES
  async getAllCommunities(userId) { // Usar el ID real del usuario autenticado
    console.log('🔍 [backend] getAllCommunities - userId recibido:', userId);
    
    if (!isDatabaseConnected) {
      console.error('❌ [backend] getAllCommunities - Base de datos no disponible');
      throw new Error('Base de datos no disponible');
    }

    await this.ensureUserExists(userId);

    try {
      console.log(`🏘️ [backend] getAllCommunities - Obteniendo todas las comunidades para usuario ${userId}...`);
      
      // 🔥 CONSULTA ADAPTADA CON NOMBRES REALES
      const sql = `
        SELECT 
          c.idComunidad as id,
          c.titulo as name,
          c.descripcion as description,
          c.categoria as category,
          NULL as imagen,
          c.fechaCreacion,
          u.nombre as creadorNombre,
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
      
      console.log('🔍 [backend] getAllCommunities - Ejecutando SQL con parámetros:', [userId, userId, userId]);
      const communities = await execute(sql, [userId, userId, userId]);
      
      console.log(`✅ [backend] getAllCommunities - Query ejecutada, ${communities.length} comunidades encontradas`);
      console.log('🔍 [backend] getAllCommunities - Raw communities data:', JSON.stringify(communities, null, 2));
      
      // 🎯 PROCESAR RESULTADOS CON NOMBRES REALES
      const processedCommunities = [];
      
      for (let community of communities) {
        // Obtener nombre real del creador
        const creadorNombreReal = await this.getUserName(community.creadorId);
        
        const processedCommunity = {
          ...community,
          isJoined: Boolean(community.isJoined),
          isAdmin: Boolean(community.isAdmin),
          isCreator: Boolean(community.isCreator),
          memberCount: Number(community.memberCount) || 0,
          creadorNombre: creadorNombreReal
        };
        
        console.log('🔍 [backend] getAllCommunities - Community procesada:', {
          id: processedCommunity.id,
          name: processedCommunity.name,
          isJoined: processedCommunity.isJoined,
          memberCount: processedCommunity.memberCount,
          isCreator: processedCommunity.isCreator,
          creadorId: processedCommunity.creadorId,
          userId: userId
        });
        
        processedCommunities.push(processedCommunity);
      }
      
      console.log(`🎯 [backend] getAllCommunities - Procesadas ${processedCommunities.length} comunidades con nombres reales`);
      console.log('🔍 [backend] getAllCommunities - Final processed communities:', JSON.stringify(processedCommunities, null, 2));
      return processedCommunities;
      
    } catch (error) {
      console.error('❌ [backend] getAllCommunities - Error:', error);
      throw error;
    }
  },

  // 🆕 OBTENER COMUNIDADES DEL USUARIO CON NOMBRES REALES
  async getUserCommunities(userId) {
    if (!isDatabaseConnected) {
      throw new Error('Base de datos no disponible');
    }

    await this.ensureUserExists(userId);

    try {
      console.log(`👤 Obteniendo comunidades del usuario ${userId}...`);
      
      const sql = `
        SELECT DISTINCT
          c.idComunidad as id,
          c.titulo as name,
          c.descripcion as description,
          c.categoria as category,
          NULL as imagen,
          c.fechaCreacion,
          u.nombre as creadorNombre,
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
      
      const communities = await execute(sql, [userId, userId, userId, userId, userId]);
      
      // 🎯 PROCESAR CON NOMBRES REALES
      const processedCommunities = [];
      
      for (let community of communities) {
        const creadorNombreReal = await this.getUserName(community.creadorId);
        
        processedCommunities.push({
          ...community,
          isJoined: true,
          isAdmin: Boolean(community.isAdmin),
          isCreator: Boolean(community.isCreator),
          memberCount: Number(community.memberCount) || 0,
          creadorNombre: creadorNombreReal
        });
      }
      
      console.log(`✅ Usuario ${userId} tiene ${processedCommunities.length} comunidades`);
      return processedCommunities;
      
    } catch (error) {
      console.error('❌ Error en getUserCommunities:', error);
      throw error;
    }
  },

  // 🆕 CREAR NUEVA COMUNIDAD CON NOMBRE REAL
  async createCommunity(communityData, userId) {
    if (!isDatabaseConnected) {
      throw new Error('Base de datos no disponible');
    }

    const userCreated = await this.ensureUserExists(userId);
    if (!userCreated) {
      throw new Error('No se pudo verificar o crear el usuario');
    }

    const { name, description, category = 'general', tags = '' } = communityData;

    try {
      console.log(`🔄 Creando comunidad "${name}" - Creador: Usuario ${userId}...`);
      
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
      
      const result = await execute(insertCommunityQuery, [
        userId, name, description, category, tags
      ]);
      
      const communityId = result.insertId;
      console.log(`✅ Comunidad creada con ID: ${communityId}`);
      
      // 2. Agregar al creador como administrador en usuario_comunidad
      const insertMemberQuery = `
        INSERT INTO usuario_comunidad (idUsuario, idComunidad, rolEnComunidad, fechaUnion)
        VALUES (?, ?, 'administrador', NOW())
      `;
      
      await execute(insertMemberQuery, [userId, communityId]);
      console.log(`✅ Creador agregado como administrador`);
      
      // 3. Obtener nombre real del creador para el mensaje de bienvenida
      const creadorNombreReal = await this.getUserName(userId);
      
      // 4. Crear mensaje de bienvenida personalizado
      const welcomeMessage = `¡Bienvenidos a ${name}! Esta comunidad fue creada por ${creadorNombreReal} para ${description.toLowerCase()}. ¡Comencemos a conversar!`;
      
      const insertWelcomeMessageQuery = `
        INSERT INTO comentarios (idComunidad, idUsuario, comentario, fechaComentario)
        VALUES (?, ?, ?, NOW())
      `;
      
      await execute(insertWelcomeMessageQuery, [communityId, userId, welcomeMessage]);
      console.log(`✅ Mensaje de bienvenida creado con nombre real: ${creadorNombreReal}`);
      
      return {
        id: communityId,
        name: name,
        description: description,
        category: category,
        tags: tags,
        imagen: null,
        fechaCreacion: new Date().toISOString(),
        creadorNombre: creadorNombreReal,
        creadorId: userId,
        memberCount: 1,
        isJoined: true,
        isAdmin: true,
        isCreator: true
      };
      
    } catch (error) {
      console.error('❌ Error creando comunidad:', error);
      throw new Error('Error al crear la comunidad: ' + error.message);
    }
  },

  // 🆕 TOGGLE MEMBERSHIP CON NOMBRES REALES
  async toggleMembership(action, communityId, userId) {
    console.log('🔍 [backend] toggleMembership - Parámetros recibidos:', { action, communityId, userId });
    
    if (!isDatabaseConnected) {
      console.error('❌ [backend] toggleMembership - Base de datos no disponible');
      throw new Error('Base de datos no disponible');
    }

    await this.ensureUserExists(userId);

    const numCommunityId = parseInt(communityId);
    const numUserId = parseInt(userId);
    
    console.log('🔍 [backend] toggleMembership - IDs convertidos:', { numCommunityId, numUserId });

    // Verificar comunidad y obtener nombre real del creador
    const communityQuery = `
      SELECT c.idComunidad, c.titulo, c.idUsuario as creadorId, u.nombre as creadorNombre
      FROM comunidad c
      LEFT JOIN usuarios u ON c.idUsuario = u.idUsuario
      WHERE c.idComunidad = ? AND (c.estado = 'activa' OR c.estado IS NULL)
    `;
    
    console.log('🔍 [backend] toggleMembership - Ejecutando communityQuery con:', numCommunityId);
    const communityExists = await execute(communityQuery, [numCommunityId]);
    console.log('🔍 [backend] toggleMembership - Resultado communityQuery:', communityExists);
    
    if (communityExists.length === 0) {
      console.error('❌ [backend] toggleMembership - Comunidad no encontrada');
      throw new Error('Comunidad no encontrada');
    }

    const community = communityExists[0];
    console.log('🔍 [backend] toggleMembership - Comunidad encontrada:', community);
    
    // Obtener nombre real del creador si no está en la BD
    let creadorNombreReal = community.creadorNombre;
    if (!creadorNombreReal) {
      creadorNombreReal = await this.getUserName(community.creadorId);
      console.log('🔍 [backend] toggleMembership - Nombre del creador obtenido:', creadorNombreReal);
    }
    
    // Si es el creador
    if (community.creadorId === numUserId) {
      console.log('🔍 [backend] toggleMembership - Usuario es el creador de la comunidad');
      if (action === 'join') {
        const response = { 
          message: `Eres el creador de "${community.titulo}". Ya eres miembro automáticamente.`,
          isCreator: true,
          autoJoined: true
        };
        console.log('🔍 [backend] toggleMembership - Respuesta para creador (join):', response);
        return response;
      } else {
        console.error('❌ [backend] toggleMembership - Creador intentando abandonar su comunidad');
        throw new Error('El creador no puede abandonar su propia comunidad');
      }
    }

    if (action === 'join') {
      console.log('🔍 [backend] toggleMembership - Ejecutando JOIN para usuario:', numUserId);
      
      // Verificar si el usuario fue expulsado previamente
      const checkExpelledQuery = 'SELECT id, motivo, fechaExpulsion FROM usuarios_expulsados WHERE idUsuario = ? AND idComunidad = ?';
      const expelledResult = await execute(checkExpelledQuery, [numUserId, numCommunityId]);
      
      if (expelledResult.length > 0) {
        // 🆕 USUARIO EXPULSADO - NO GENERAR ERROR, SOLO RETORNAR RESPUESTA SILENCIOSA
        const expulsionInfo = expelledResult[0];
        const expulsionDate = new Date(expulsionInfo.fechaExpulsion).toLocaleDateString('es-ES');
        
        console.log(`🚫 Usuario ${numUserId} expulsado de comunidad ${numCommunityId} - Acceso denegado silenciosamente`);
        
        return { 
          message: `Acceso restringido`,
          isExpelled: true,
          reason: expulsionInfo.motivo,
          expulsionDate: expulsionDate
        };
      }
      
      try {
        const insertQuery = 'INSERT INTO usuario_comunidad (idUsuario, idComunidad, rolEnComunidad, fechaUnion) VALUES (?, ?, "miembro", NOW())';
        console.log('🔍 [backend] toggleMembership - Ejecutando INSERT con parámetros:', [numUserId, numCommunityId]);
        
        await execute(insertQuery, [numUserId, numCommunityId]);
        
        const nombreUsuario = await this.getUserName(numUserId);
        console.log(`✅ [backend] toggleMembership - ${nombreUsuario} (ID: ${numUserId}) se unió a comunidad ${numCommunityId}`);
        
        const response = { 
          message: `Te has unido a "${community.titulo}" exitosamente`,
          isCreator: false,
          autoJoined: true
        };
        console.log('🔍 [backend] toggleMembership - Respuesta exitosa (join):', response);
        return response;
      } catch (error) {
        console.error('🔍 [backend] toggleMembership - Error en JOIN:', error);
        if (error.code === 'ER_DUP_ENTRY') {
          const response = { 
            message: 'Ya eres miembro de esta comunidad',
            isCreator: false,
            autoJoined: true
        };
          console.log('🔍 [backend] toggleMembership - Respuesta para usuario ya miembro:', response);
          return response;
        }
        throw error;
      }
    } else if (action === 'leave') {
      console.log('🔍 [backend] toggleMembership - Ejecutando LEAVE para usuario:', numUserId);
      
      const deleteQuery = 'DELETE FROM usuario_comunidad WHERE idComunidad = ? AND idUsuario = ?';
      console.log('🔍 [backend] toggleMembership - Ejecutando DELETE con parámetros:', [numCommunityId, numUserId]);
      
      const result = await execute(deleteQuery, [numCommunityId, numUserId]);
      console.log('🔍 [backend] toggleMembership - Resultado DELETE:', result);
      
      if (result.affectedRows === 0) {
        console.error('❌ [backend] toggleMembership - Usuario no es miembro de la comunidad');
        throw new Error('No eres miembro de esta comunidad');
      }
      
      const nombreUsuario = await this.getUserName(numUserId);
      console.log(`✅ [backend] toggleMembership - ${nombreUsuario} (ID: ${numUserId}) salió de comunidad ${numCommunityId}`);
      
      const response = { message: `Has salido de "${community.titulo}" exitosamente` };
      console.log('🔍 [backend] toggleMembership - Respuesta exitosa (leave):', response);
      return response;
    } else {
      console.error('❌ [backend] toggleMembership - Acción inválida:', action);
      throw new Error('Acción inválida. Use "join" o "leave"');
    }
  },

  // 🆕 GET COMMUNITY DETAILS CON NOMBRES REALES
  async getCommunityDetails(communityId, userId) {
    if (!isDatabaseConnected) {
      throw new Error('Base de datos no disponible');
    }

    await this.ensureUserExists(userId);

    const numCommunityId = parseInt(communityId);
    const numUserId = parseInt(userId);

    const sql = `
      SELECT 
        c.idComunidad as id,
        c.titulo as name,
        c.descripcion as description,
        c.categoria as category,
        NULL as imagen,
        c.fechaCreacion,
        u.nombre as creadorNombre,
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
    
    const result = await execute(sql, [numUserId, numUserId, numUserId, numUserId, numCommunityId]);
    
    if (result.length === 0) {
      return null;
    }
    
    const community = result[0];
    
    // Obtener nombre real del creador
    const creadorNombreReal = await this.getUserName(community.creadorId);
    
    return {
      ...community,
      isJoined: Boolean(community.isJoined),
      isAdmin: Boolean(community.isAdmin),
      isCreator: Boolean(community.isCreator),
      memberCount: Number(community.memberCount) || 0,
      creadorNombre: creadorNombreReal
    };
  },

  // 🆕 GET COMMUNITY MESSAGES CON NOMBRES REALES
  async getCommunityMessages(communityId, userId, page = 1, limit = 50) {
    if (!isDatabaseConnected) {
      throw new Error('Base de datos no disponible');
    }

    await this.ensureUserExists(userId);

    const numCommunityId = parseInt(communityId);
    const numUserId = parseInt(userId);
    const numPage = parseInt(page);
    const numLimit = parseInt(limit);

    console.log('🔍 Parámetros messages:', { communityId: numCommunityId, userId: numUserId, page: numPage, limit: numLimit });

    // Verificar membresía o creador
    const membershipQuery = `
      SELECT 
        uc.idUsuario as idMiembro,
        uc.rolEnComunidad,
        c.idUsuario as creadorId,
        c.titulo as comunidadNombre,
        CASE WHEN c.idUsuario = ? THEN 1 ELSE 0 END as isCreator
      FROM comunidad c
      LEFT JOIN usuario_comunidad uc ON c.idComunidad = uc.idComunidad AND uc.idUsuario = ?
      WHERE c.idComunidad = ?
    `;
    
    const memberCheck = await execute(membershipQuery, [numUserId, numUserId, numCommunityId]);
    
    if (memberCheck.length === 0) {
      throw new Error('Comunidad no encontrada');
    }
    
    const membership = memberCheck[0];
    const isCreator = membership.isCreator === 1;
    const isMember = membership.idMiembro !== null;
    
    // Auto-unirse si no es miembro ni creador
    if (!isMember && !isCreator) {
      const nombreUsuario = await this.getUserName(numUserId);
      console.log(`🔄 ${nombreUsuario} (ID: ${numUserId}) no es miembro, uniéndose automáticamente...`);
      try {
        await execute(
          'INSERT INTO usuario_comunidad (idUsuario, idComunidad, rolEnComunidad, fechaUnion) VALUES (?, ?, "miembro", NOW())',
          [numUserId, numCommunityId]
        );
        console.log(`✅ ${nombreUsuario} agregado como miembro automáticamente`);
      } catch (error) {
        console.error('❌ Error agregando usuario como miembro:', error);
        throw new Error('No se pudo acceder a los mensajes de la comunidad');
      }
    }

    const offset = (numPage - 1) * numLimit;
    
    const sql = `
      SELECT 
        c.idComentario as id,
        c.comentario as text,
        c.fechaComentario as timestamp,
        u.nombre as userName,
        u.idUsuario as userId,
        CASE WHEN c.idUsuario = ? THEN 1 ELSE 0 END as isOwn,
        CASE WHEN c.idUsuario = co.idUsuario THEN 1 ELSE 0 END as isCreatorMessage,
        CASE 
          WHEN c.idUsuario = co.idUsuario THEN 'Creador' 
          WHEN uc.rolEnComunidad = 'administrador' THEN 'Admin'
          ELSE 'Miembro' 
        END as userRole
      FROM comentarios c
      INNER JOIN usuarios u ON c.idUsuario = u.idUsuario
      INNER JOIN comunidad co ON c.idComunidad = co.idComunidad
      LEFT JOIN usuario_comunidad uc ON c.idComunidad = uc.idComunidad AND c.idUsuario = uc.idUsuario
      WHERE c.idComunidad = ?
      ORDER BY c.fechaComentario DESC
      LIMIT ? OFFSET ?
    `;
    
    const params = [numUserId, numCommunityId, numLimit, offset];
    console.log('📋 Parámetros SQL messages:', params);
    
    const messages = await execute(sql, params);
    
    // 🎯 PROCESAR MENSAJES CON NOMBRES REALES
    const processedMessages = [];
    
    for (let msg of messages) {
      // Obtener nombre real del usuario del mensaje
      const nombreRealUsuario = await this.getUserName(msg.userId);
      
      processedMessages.push({
        ...msg,
        userName: nombreRealUsuario,
        imagenes: [],
        isOwn: msg.isOwn === 1,
        isCreatorMessage: msg.isCreatorMessage === 1,
        userRole: msg.userRole || (msg.isCreatorMessage === 1 ? 'Creador' : 'Miembro')
      });
    }
    
    console.log(`✅ ${processedMessages.length} mensajes procesados con nombres reales`);
    return processedMessages;
  },

  // 🆕 SEND MESSAGE CON NOMBRE REAL
  async sendMessage(communityId, messageText, userId) {
    if (!isDatabaseConnected) {
      throw new Error('Base de datos no disponible');
    }

    await this.ensureUserExists(userId);

    const numCommunityId = parseInt(communityId);
    const numUserId = parseInt(userId);

    const nombreUsuario = await this.getUserName(numUserId);
    console.log(`📤 ${nombreUsuario} (ID: ${numUserId}) enviando mensaje a comunidad ${numCommunityId}...`);

    // Verificar membresía y estado de la comunidad
    const membershipCheck = `
      SELECT 
        uc.idUsuario as idMiembro, 
        c.idUsuario as creadorId,
        c.titulo as comunidadNombre,
        c.estado as estadoComunidad
      FROM comunidad c
      LEFT JOIN usuario_comunidad uc ON c.idComunidad = uc.idComunidad AND uc.idUsuario = ?
      WHERE c.idComunidad = ?
    `;
    
    const memberCheck = await execute(membershipCheck, [numUserId, numCommunityId]);
    
    if (memberCheck.length === 0) {
      throw new Error('Comunidad no encontrada');
    }
    
    const membership = memberCheck[0];
    const isCreator = membership.creadorId === numUserId;
    const isMember = membership.idMiembro !== null;
    
    // 🔒 VERIFICAR ESTADO DE LA COMUNIDAD
    if (membership.estadoComunidad === 'suspendida') {
      console.log(`🚫 Comunidad ${membership.comunidadNombre} está suspendida. No se pueden enviar mensajes.`);
      throw new Error('Esta comunidad está suspendida. No se pueden enviar mensajes hasta que sea reactivada.');
    }
    
    // Verificar que la comunidad esté activa o tenga estado nulo (por compatibilidad)
    if (membership.estadoComunidad && membership.estadoComunidad !== 'activa') {
      console.log(`🚫 Comunidad ${membership.comunidadNombre} tiene estado inválido: ${membership.estadoComunidad}`);
      throw new Error('Esta comunidad no está disponible para mensajes en este momento.');
    }
    
    // Auto-unirse si no es miembro ni creador
    if (!isMember && !isCreator) {
      console.log(`🔄 Agregando ${nombreUsuario} (ID: ${numUserId}) como miembro para enviar mensaje...`);
      try {
        await execute(
          'INSERT INTO usuario_comunidad (idUsuario, idComunidad, rolEnComunidad, fechaUnion) VALUES (?, ?, "miembro", NOW())',
          [numUserId, numCommunityId]
        );
        console.log(`✅ ${nombreUsuario} agregado como miembro automáticamente`);
      } catch (error) {
        console.error('❌ Error agregando usuario:', error);
        throw new Error('No se pudo unir a la comunidad para enviar el mensaje');
      }
    }

    // Insertar mensaje
    const insertResult = await execute(
      'INSERT INTO comentarios (idComunidad, idUsuario, comentario, fechaComentario) VALUES (?, ?, ?, NOW())',
      [numCommunityId, numUserId, messageText]
    );

    // Obtener el mensaje creado con nombre real
    const messageQuery = `
      SELECT 
        c.idComentario as id,
        c.comentario as text,
        c.fechaComentario as timestamp,
        u.nombre as userName,
        u.idUsuario as userId,
        CASE 
          WHEN c.idUsuario = co.idUsuario THEN 'Creador'
          WHEN uc.rolEnComunidad = 'administrador' THEN 'Admin'
          ELSE 'Miembro' 
        END as userRole
      FROM comentarios c
      INNER JOIN usuarios u ON c.idUsuario = u.idUsuario
      INNER JOIN comunidad co ON c.idComunidad = co.idComunidad
      LEFT JOIN usuario_comunidad uc ON c.idComunidad = uc.idComunidad AND c.idUsuario = uc.idUsuario
      WHERE c.idComentario = ?
    `;
    
    const result = await execute(messageQuery, [insertResult.insertId]);
    
    if (result.length > 0) {
      // Obtener nombre real para asegurar consistencia
      const nombreRealFinal = await this.getUserName(result[0].userId);
      
      console.log(`✅ Mensaje enviado exitosamente por ${nombreRealFinal}`);
      
      return {
        ...result[0],
        userName: nombreRealFinal,
        isOwn: true,
        imagenes: []
      };
    }
    
    throw new Error('No se pudo obtener el mensaje creado');
  },

  // 🆕 NUEVA FUNCIÓN: Eliminar comunidad (solo para creadores)
  async deleteCommunity(communityId) {
    if (!isDatabaseConnected) {
      throw new Error('Base de datos no disponible');
    }

    const numCommunityId = parseInt(communityId);
    
    if (!numCommunityId || isNaN(numCommunityId)) {
      throw new Error('ID de comunidad inválido');
    }

    try {
      console.log(`🗑️ Eliminando comunidad ${numCommunityId}...`);
      
      // 1. Eliminar todos los mensajes de la comunidad
      const deleteMessagesQuery = 'DELETE FROM comentarios WHERE idComunidad = ?';
      const messagesResult = await execute(deleteMessagesQuery, [numCommunityId]);
      console.log(`🗑️ ${messagesResult.affectedRows} mensajes eliminados`);
      
      // 2. Eliminar todas las membresías de la comunidad
      const deleteMembershipsQuery = 'DELETE FROM usuario_comunidad WHERE idComunidad = ?';
      const membershipsResult = await execute(deleteMembershipsQuery, [numCommunityId]);
      console.log(`🗑️ ${membershipsResult.affectedRows} membresías eliminadas`);
      
      // 3. Eliminar la comunidad
      const deleteCommunityQuery = 'DELETE FROM comunidad WHERE idComunidad = ?';
      const communityResult = await execute(deleteCommunityQuery, [numCommunityId]);
      
      if (communityResult.affectedRows === 0) {
        throw new Error('Comunidad no encontrada');
      }
      
      console.log(`✅ Comunidad ${numCommunityId} eliminada exitosamente`);
      return true;
      
    } catch (error) {
      console.error('❌ Error eliminando comunidad:', error);
      throw error;
    }
  },

  // 🆕 NUEVA FUNCIÓN: Expulsar usuario de comunidad (solo para creadores)
  async expelUserFromCommunity(communityId, userIdToExpel) {
    if (!isDatabaseConnected) {
      throw new Error('Base de datos no disponible');
    }

    const numCommunityId = parseInt(communityId);
    const numUserIdToExpel = parseInt(userIdToExpel);
    
    if (!numCommunityId || isNaN(numCommunityId)) {
      throw new Error('ID de comunidad inválido');
    }
    
    if (!numUserIdToExpel || isNaN(numUserIdToExpel)) {
      throw new Error('ID de usuario a expulsar inválido');
    }

    try {
      console.log(`🚫 Expulsando usuario ${numUserIdToExpel} de comunidad ${numCommunityId}...`);
      
      // 1. Verificar que el usuario esté en la comunidad
      const checkMembershipQuery = 'SELECT idUsuario FROM usuario_comunidad WHERE idComunidad = ? AND idUsuario = ?';
      const membershipResult = await execute(checkMembershipQuery, [numCommunityId, numUserIdToExpel]);
      
      if (membershipResult.length === 0) {
        throw new Error('El usuario no está en esta comunidad');
      }
      
      // 2. Verificar que no sea el creador
      const checkCreatorQuery = 'SELECT idUsuario FROM comunidad WHERE idComunidad = ? AND idUsuario = ?';
      const creatorResult = await execute(checkCreatorQuery, [numCommunityId, numUserIdToExpel]);
      
      if (creatorResult.length > 0) {
        throw new Error('No se puede expulsar al creador de la comunidad');
      }
      
      // 3. Eliminar la membresía del usuario
      const deleteMembershipQuery = 'DELETE FROM usuario_comunidad WHERE idComunidad = ? AND idUsuario = ?';
      const deleteResult = await execute(deleteMembershipQuery, [numCommunityId, numUserIdToExpel]);
      
      if (deleteResult.affectedRows === 0) {
        throw new Error('No se pudo expulsar al usuario');
      }
      
      // 4. Agregar usuario a la tabla de expulsados para prevenir re-unión
      const addToExpelledQuery = 'INSERT INTO usuarios_expulsados (idUsuario, idComunidad, motivo) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE fechaExpulsion = NOW()';
      await execute(addToExpelledQuery, [numUserIdToExpel, numCommunityId, 'Expulsado por el creador']);
      
      // 5. Obtener nombre de la comunidad para la notificación
      const communityNameQuery = 'SELECT titulo FROM comunidad WHERE idComunidad = ?';
      const communityNameResult = await execute(communityNameQuery, [numCommunityId]);
      const communityName = communityNameResult.length > 0 ? communityNameResult[0].titulo : 'la comunidad';
      
      
      console.log(`✅ Usuario ${numUserIdToExpel} expulsado exitosamente de comunidad ${numCommunityId}`);
      return true;
      
    } catch (error) {
      console.error('❌ Error expulsando usuario:', error);
      throw error;
    }
  },

  // 🆕 NUEVA FUNCIÓN: Actualizar información de la comunidad (solo para creadores)
  async updateCommunity(communityId, updateData, userId) {
    if (!isDatabaseConnected) {
      throw new Error('Base de datos no disponible');
    }

    const numCommunityId = parseInt(communityId);
    
    if (!numCommunityId || isNaN(numCommunityId)) {
      throw new Error('ID de comunidad inválido');
    }

    try {
      console.log(`✏️ Actualizando comunidad ${numCommunityId} con datos:`, updateData);
      console.log(`👤 Usuario que actualiza: ${userId}`);
      
      // Construir la consulta SQL dinámicamente
      const updateFields = [];
      const updateValues = [];
      
      if (updateData.name) {
        console.log('📝 Agregando campo nombre (titulo)');
        updateFields.push('titulo = ?');
        updateValues.push(updateData.name);
      }
      
      if (updateData.description) {
        console.log('📝 Agregando campo descripción');
        updateFields.push('descripcion = ?');
        updateValues.push(updateData.description);
      }
      
      if (updateData.categoria) {
        console.log('📝 Agregando campo categoría');
        updateFields.push('categoria = ?');
        updateValues.push(updateData.categoria);
      }
      
      if (updateFields.length === 0) {
        throw new Error('No hay campos para actualizar');
      }
      
      console.log(`✅ ${updateFields.length} campos para actualizar`);
      
      // Agregar fecha de actualización (solo si la columna existe)
      try {
        updateFields.push('fechaActualizacion = NOW()');
        console.log('📅 Agregando campo fechaActualizacion');
      } catch (error) {
        console.log('⚠️ Columna fechaActualizacion no disponible, omitiendo...');
      }
      
      // Agregar el ID de la comunidad al final
      updateValues.push(numCommunityId);
      
      const updateQuery = `
        UPDATE comunidad 
        SET ${updateFields.join(', ')}
        WHERE idComunidad = ?
      `;
      
      console.log('🔍 Query de actualización:', updateQuery);
      console.log('📝 Valores:', updateValues);
      console.log('🔢 Número de valores:', updateValues.length);
      
      console.log('🔄 Ejecutando query de actualización...');
      const result = await execute(updateQuery, updateValues);
      console.log('✅ Resultado de execute:', result);
      
      if (result.affectedRows === 0) {
        throw new Error('Comunidad no encontrada');
      }
      
      console.log(`✅ Comunidad ${numCommunityId} actualizada exitosamente`);
      
      // Retornar confirmación de éxito en lugar de intentar obtener detalles
      console.log('✅ Comunidad actualizada exitosamente en la base de datos');
      
      return {
        success: true,
        message: 'Comunidad actualizada exitosamente',
        communityId: numCommunityId,
        updatedFields: updateData
      };
      
    } catch (error) {
      console.error('❌ Error actualizando comunidad:', error);
              console.error('❌ Stack trace completo:', error && error.stack ? error.stack : 'No disponible');
      throw error;
    }
  },

  // 🆕 ENDPOINT: Verificar si usuario está expulsado de una comunidad
  async checkUserExpulsion(communityId, userId) {
    if (!isDatabaseConnected) {
      throw new Error('Base de datos no disponible');
    }

    const numCommunityId = parseInt(communityId);
    const numUserId = parseInt(userId);
    
    if (!numCommunityId || isNaN(numCommunityId)) {
      throw new Error('ID de comunidad inválido');
    }
    
    if (!numUserId || isNaN(numUserId)) {
      throw new Error('ID de usuario inválido');
    }

    try {
      console.log(`🔍 Verificando si usuario ${numUserId} está expulsado de comunidad ${numCommunityId}...`);
      
      const checkExpelledQuery = `
        SELECT id, motivo, fechaExpulsion 
        FROM usuarios_expulsados 
        WHERE idUsuario = ? AND idComunidad = ?
      `;
      
      const expelledResult = await execute(checkExpelledQuery, [numUserId, numCommunityId]);
      
      if (expelledResult.length > 0) {
        const expulsionInfo = expelledResult[0];
        const expulsionDate = new Date(expulsionInfo.fechaExpulsion).toLocaleDateString('es-ES');
        
        return {
          isExpelled: true,
          reason: expulsionInfo.motivo,
          expulsionDate: expulsionDate,
          message: `Usuario expulsado el ${expulsionDate}. Motivo: ${expulsionInfo.motivo}`
        };
      } else {
        return {
          isExpelled: false,
          reason: null,
          expulsionDate: null,
          message: 'Usuario no está expulsado de esta comunidad'
        };
      }
      
    } catch (error) {
      console.error('❌ Error verificando expulsión:', error);
      throw error;
    }
  }
};





// Funciones de base de datos para reportes (mantener las existentes)
const reportQueries = {
  // Obtener todos los reportes
  async getAllReports() {
    if (!isDatabaseConnected) {
      throw new Error('Base de datos no disponible');
    }

    const sql = `
      SELECT 
        r.idReporte as id,
        r.titulo as title,
        r.descripcion as description,
        r.nombreImagen,
        r.tipoImagen,
        r.fechaCreacion as createdAt,
        r.estado as status,
        r.ubicacion as location,
        r.categoria as category,
        CASE 
          WHEN r.imagen IS NOT NULL THEN 1 
          ELSE 0 
        END as hasImage,
        r.idUsuario,
        u.nombre as nombreUsuario
      FROM reportes r
      LEFT JOIN usuarios u ON r.idUsuario = u.idUsuario
      ORDER BY r.fechaCreacion DESC
    `;
    
    const reports = await execute(sql);
    
    // Agregar campos compatibles con la app
    return reports.map(report => ({
      ...report,
      status: report.status || 'Pendiente',
      category: report.category || 'General',
      priority: 'Media',
      date: report.createdAt,
      location: report.location || 'San Salvador, El Salvador',
      idUsuario: report.idUsuario,
      nombreUsuario: report.nombreUsuario
    }));
  },

  // Obtener reporte por ID
  async getReportById(id) {
    if (!isDatabaseConnected) {
      throw new Error('Base de datos no disponible');
    }

    const sql = `
      SELECT 
        r.idReporte as id,
        r.titulo as title,
        r.descripcion as description,
        r.nombreImagen,
        r.tipoImagen,
        r.fechaCreacion as createdAt,
        r.estado as status,
        r.ubicacion as location,
        r.categoria as category,
        r.imagen,
        CASE 
          WHEN r.imagen IS NOT NULL THEN 1 
          ELSE 0 
        END as hasImage,
        r.idUsuario,
        u.nombre as nombreUsuario
      FROM reportes r
      LEFT JOIN usuarios u ON r.idUsuario = u.idUsuario
      WHERE r.idReporte = ?
    `;
    
    const reports = await execute(sql, [id]);
    
    if (reports.length === 0) {
      return null;
    }
    
    const report = reports[0];
    
    // No incluir la imagen en la respuesta para evitar grandes payloads
    delete report.imagen;
    
    return {
      ...report,
      status: report.status || 'Pendiente',
      category: report.category || 'General',
      priority: 'Media',
      date: report.createdAt,
      location: report.location || 'San Salvador, El Salvador',
      idUsuario: report.idUsuario,
      nombreUsuario: report.nombreUsuario
    };
  },

  // Crear nuevo reporte
  async createReport(reportData) {
    if (!isDatabaseConnected) {
      throw new Error('Base de datos no disponible');
    }

    const { title, description, imageData = null, imageName = null, imageType = null, ubicacion = 'San Salvador, El Salvador', categoria = 'general' } = reportData;
    
    const sql = `
      INSERT INTO reportes (titulo, descripcion, ubicacion, categoria, imagen, nombreImagen, tipoImagen, fechaCreacion)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const result = await execute(sql, [title, description, ubicacion, categoria, imageData, imageName, imageType]);
    const newId = result.insertId;
    
    // Obtener el reporte recién creado
    return await this.getReportById(newId);
  },

  // Actualizar reporte
  async updateReport(id, updates) {
    if (!isDatabaseConnected) {
      throw new Error('Base de datos no disponible');
    }

    const allowedFields = ['titulo', 'descripcion', 'ubicacion', 'categoria'];
    const updateFields = [];
    const values = [];
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });
    
    if (updateFields.length === 0) {
      throw new Error('No hay campos válidos para actualizar');
    }
    
    values.push(id);
    const sql = `UPDATE reportes SET ${updateFields.join(', ')} WHERE idReporte = ?`;
    
    await execute(sql, values);
    return await this.getReportById(id);
  },

  // Eliminar reporte
  async deleteReport(id) {
    if (!isDatabaseConnected) {
      throw new Error('Base de datos no disponible');
    }

    const sql = 'DELETE FROM reportes WHERE idReporte = ?';
    const result = await execute(sql, [id]);
    return result.affectedRows > 0;
  },

  // Obtener estadísticas
  async getStats() {
    if (!isDatabaseConnected) {
      // Retornar estadísticas dummy si no hay base de datos
      return {
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        resolutionRate: 0,
        recentCount: 0
      };
    }

    try {
      // Estadísticas básicas
      const totalResult = await execute('SELECT COUNT(*) as total FROM reportes');
      const total = totalResult[0].total;
      
      // Reportes recientes (últimos 7 días)
      const recentResult = await execute(`
        SELECT COUNT(*) as recent 
        FROM reportes 
        WHERE fechaCreacion >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `);
      const recentCount = recentResult[0].recent;
      
      // Como tu tabla no tiene estado, simulamos los estados basado en fecha
      const pending = Math.ceil(total * 0.6);
      const inProgress = Math.ceil(total * 0.25);
      const resolved = total - pending - inProgress;
      const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
      
      return {
        total,
        pending,
        inProgress, 
        resolved,
        resolutionRate,
        recentCount
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        resolutionRate: 0,
        recentCount: 0
      };
    }
  }
};

// Función para parsear FormData con imagen - CORREGIDA
function parseFormDataWithImage(body, contentType) {
  console.log('🔍 === PARSING FORMDATA CON MULTIPARTY ===');
  
  const boundary = contentType.split('boundary=')[1];
  if (!boundary) {
    console.log('❌ No boundary found in content-type');
    return {};
  }

  console.log('🔗 Boundary encontrado:', boundary);
  const parts = body.split(`--${boundary}`);
  const fields = {};

  console.log('📦 Parts encontrados:', parts.length);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    if (part.includes('Content-Disposition: form-data')) {
      console.log(`\n📝 Procesando part ${i}:`);
      
      const nameMatch = part.match(/name="([^"]+)"/);
      if (!nameMatch) {
        console.log('⚠️ No name found in part');
        continue;
      }

      const fieldName = nameMatch[1];
      console.log(`📋 Campo encontrado: ${fieldName}`);
      
      const valueStart = part.indexOf('\r\n\r\n');
      if (valueStart === -1) {
        console.log('⚠️ No value start found');
        continue;
      }

      let value = part.substring(valueStart + 4);
      // Limpiar el valor final
      value = value.replace(/\r\n--$/, '').replace(/\r\n$/, '');

      // ✅ VERIFICAR SI ES IMAGEN
      if (part.includes('Content-Type:') && (fieldName === 'imagen' || fieldName === 'image')) {
        console.log('📷 === PROCESANDO IMAGEN ===');
        
        // Extraer tipo de contenido
        const typeMatch = part.match(/Content-Type:\s*([^\r\n]+)/);
        const contentTypeImg = typeMatch ? typeMatch[1].trim() : 'image/jpeg';
        console.log('📋 Tipo de imagen:', contentTypeImg);
        
        // Extraer filename si existe
        const filenameMatch = part.match(/filename="([^"]+)"/);
        const originalFilename = filenameMatch ? filenameMatch[1] : null;
        console.log('📁 Filename original:', originalFilename);
        
        // Crear Buffer de la imagen
        const imageBuffer = Buffer.from(value, 'binary');
        console.log('📊 Tamaño de imagen:', imageBuffer.length, 'bytes');
        
        if (imageBuffer.length > 0) {
          // Generar nombre único para la imagen
          const timestamp = Date.now();
          const random = Math.round(Math.random() * 1E9);
          const extension = contentTypeImg.includes('png') ? 'png' : 'jpg';
          const uniqueFilename = `reporte-${timestamp}-${random}.${extension}`;
          
          fields['imageData'] = imageBuffer;
          fields['imageName'] = uniqueFilename;
          fields['imageType'] = contentTypeImg;
          fields['originalFilename'] = originalFilename;
          fields['hasImage'] = true;
          
          console.log('✅ Imagen procesada exitosamente:');
          console.log('  - Nombre único:', uniqueFilename);
          console.log('  - Tipo:', contentTypeImg);
          console.log('  - Tamaño:', imageBuffer.length, 'bytes');
        } else {
          console.log('❌ Buffer de imagen vacío');
        }
      } else {
        // Campo de texto normal
        const cleanValue = value.trim();
        fields[fieldName] = cleanValue;
        console.log(`📝 Campo ${fieldName}: "${cleanValue}"`);
      }
    }
  }

  console.log('\n✅ === RESUMEN DE FORMDATA PROCESADO ===');
  console.log('📝 Campos de texto:');
  Object.keys(fields).forEach(key => {
    if (!['imageData', 'imageName', 'imageType', 'hasImage', 'originalFilename'].includes(key)) {
      console.log(`  ${key}: "${fields[key]}"`);
    }
  });
  
  console.log('📷 Imagen:');
  console.log('  hasImage:', !!fields.imageData);
  console.log('  imageName:', fields.imageName || 'N/A');
  console.log('  imageType:', fields.imageType || 'N/A');
  console.log('  imageSize:', fields.imageData ? fields.imageData.length + ' bytes' : 'N/A');

  return fields;
}

// ✅ FUNCIÓN MEJORADA PARA GUARDAR IMÁGENES
function saveImageToUploads(imageData, imageName) {
  try {
    console.log('💾 === GUARDANDO IMAGEN ===');
    console.log('📁 Nombre:', imageName);
    console.log('📊 Tamaño:', imageData.length, 'bytes');
    
    const uploadsDir = path.join(__dirname, 'uploads');
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('📁 Directorio uploads creado');
    }
    
    const imagePath = path.join(uploadsDir, imageName);
    console.log('📍 Ruta completa:', imagePath);
    
    // Escribir archivo
    fs.writeFileSync(imagePath, imageData);
    
    // Verificar que se guardó correctamente
    if (fs.existsSync(imagePath)) {
      const savedSize = fs.statSync(imagePath).size;
      console.log('✅ Imagen guardada exitosamente');
      console.log('📊 Tamaño verificado:', savedSize, 'bytes');
      return true;
    } else {
      console.log('❌ Error: archivo no encontrado después de guardar');
      return false;
    }
  } catch (error) {
    console.error('❌ Error guardando imagen:', error);
    return false;
  }
}


// Crear servidor HTTP
const server = http.createServer(async (req, res) => {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Content-Type', 'application/json');

  // Logging
  const timestamp = new Date().toLocaleTimeString();
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${clientIP}`);

  // Manejar OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const requestPath = parsedUrl.pathname;
  const method = req.method;

  try {
    // Root endpoint - Información del servidor
    if (requestPath === '/' && method === 'GET') {
      const stats = await reportQueries.getStats();
      res.writeHead(200);
      res.end(JSON.stringify({
        message: 'Mi Ciudad SV API',
        status: 'OK',
        version: '2.0.0',
        database: isDatabaseConnected ? 'MySQL Connected' : 'Database Offline',
        timestamp: new Date().toISOString(),
        stats: stats
      }));
      return;
    }

    // Health check endpoint
    if (requestPath === '/api/test' && method === 'GET') {
      const stats = await reportQueries.getStats();
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        message: 'API funcionando correctamente',
        server: 'Node.js HTTP Server',
        database: isDatabaseConnected ? 'MySQL - miciudadsv' : 'Sin conexión DB',
        timestamp: new Date().toISOString(),
        stats: stats
      }));
      return;
    }




    // ===============================
// FUNCIÓN PARA EXTRAER USUARIO AUTENTICADO - CORREGIDA
// ===============================

// 🔥 FUNCIÓN PRINCIPAL PARA OBTENER ID DEL USUARIO AUTENTICADO
function getAuthenticatedUser(req) {
  console.log('🔍 === EXTRACTING AUTHENTICATED USER ===');
  console.log('🔍 [getAuthenticatedUser] Headers completos:', JSON.stringify(req.headers, null, 2));
  
  // 1. Verificar header x-user-id (más confiable)
  if (req.headers['x-user-id']) {
    const userId = parseInt(req.headers['x-user-id']);
    console.log('🔍 [getAuthenticatedUser] x-user-id header encontrado:', req.headers['x-user-id']);
    console.log('🔍 [getAuthenticatedUser] x-user-id parseado:', userId);
    
    if (!isNaN(userId)) {
      console.log(`✅ [getAuthenticatedUser] Usuario desde x-user-id header: ${userId}`);
      return userId;
    } else {
      console.log('❌ [getAuthenticatedUser] x-user-id no es un número válido');
    }
  } else {
    console.log('❌ [getAuthenticatedUser] No se encontró header x-user-id');
  }
  
  // 2. Verificar Authorization header (token)
  if (req.headers['authorization']) {
    const authHeader = req.headers['authorization'];
    console.log('🔑 [getAuthenticatedUser] Authorization header encontrado:', authHeader);
    
    // Extraer token (formato: "Bearer token-{userId}-{timestamp}" o "token-{userId}-{timestamp}")
    const token = authHeader.replace('Bearer ', '').replace('bearer ', '');
    console.log('🎫 [getAuthenticatedUser] Token extraído:', token);
    
    // Verificar si el token tiene el formato token-{userId}-{timestamp}
    if (token.startsWith('token-')) {
      const tokenParts = token.split('-');
      console.log('🔍 [getAuthenticatedUser] Token parts:', tokenParts);
      
      if (tokenParts.length >= 2 && !isNaN(tokenParts[1])) {
        const userId = parseInt(tokenParts[1]);
        console.log(`✅ [getAuthenticatedUser] Usuario extraído del token: ${userId}`);
        return userId;
      } else {
        console.log('❌ [getAuthenticatedUser] Token no tiene formato válido o userId no es número');
      }
    } else {
      console.log('❌ [getAuthenticatedUser] Token no empieza con "token-"');
    }
  } else {
    console.log('❌ [getAuthenticatedUser] No se encontró header authorization');
  }
  
  // 3. Verificar query parameters (para testing)
  const url = require('url');
  const urlParts = url.parse(req.url, true);
  console.log('🔍 [getAuthenticatedUser] URL parts:', urlParts);
  
  if (urlParts.query.userId) {
    const userId = parseInt(urlParts.query.userId);
    if (!isNaN(userId)) {
      console.log(`⚠️ [getAuthenticatedUser] Usuario desde query parameter: ${userId} (solo para testing)`);
      return userId;
    }
  }
  
  // 4. Si no se encuentra nada, lanzar error
  console.log('❌ [getAuthenticatedUser] No se pudo extraer usuario autenticado');
  throw new Error('Usuario no autenticado. Se requiere header x-user-id o token válido.');
}


// ========================================
    // FUNCIONES HELPER PARA VERIFICACIÓN
    // ========================================
    
    // 🔥 FUNCIÓN HELPER: Verificar si el email está verificado de forma robusta
    function isEmailVerified(emailVerificado) {
      // Manejar diferentes tipos de datos que MySQL puede devolver
      if (emailVerificado === null || emailVerificado === undefined) {
        return false;
      }
      
      // 🔥 CORREGIDO: Manejar específicamente el valor 1 de MySQL
      if (emailVerificado === 1 || emailVerificado === '1') {
        return true;
      }
      
      // Convertir a string para comparaciones consistentes
      const value = String(emailVerificado).toLowerCase();
      
      // Valores que indican verificación exitosa
      const verifiedValues = ['1', 'true', 'yes', 'on'];
      
      return verifiedValues.includes(value) || Boolean(emailVerificado);
    }
    
    // ========================================
    // ENDPOINTS DE AUTENTICACIÓN CON VERIFICACIÓN
    // ========================================

    // POST /api/auth/login - Iniciar sesión CON VERIFICACIÓN DE EMAIL
    if (requestPath === '/api/auth/login' && method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          console.log('\n🔐 === LOGIN WITH EMAIL VERIFICATION ===');
          
          const data = JSON.parse(body || '{}');
          const email = data.email || data.correo;
          const password = data.password || data.contraseña;
          
          console.log('📧 Email/Correo:', email);
          console.log('🔑 Password provided:', !!password);
          console.log('📦 Raw data received:', data);

          // Validar campos requeridos
          if (!email || !password) {
            console.log('❌ Missing required fields');
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Email/correo y contraseña son requeridos'
            }));
            return;
          }

          // Verificar conexión a base de datos
          if (!isDatabaseConnected) {
            console.log('⚠️ Database not connected - using demo mode');
            
            // Modo demo - credenciales de prueba
            if ((email === 'lucia@example.com' || email === 'kevin.zepeda4cm@gmail.com') && 
                (password === 'password123' || password === '123456')) {
              console.log('✅ Demo login successful');
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                user: {
                  id: 3,
                  idUsuario: 3,
                  nombre: email === 'kevin.zepeda4cm@gmail.com' ? 'Kevin Zepeda' : 'Lucía Martínez',
                  name: email === 'kevin.zepeda4cm@gmail.com' ? 'Kevin Zepeda' : 'Lucía Martínez',
                  correo: email,
                  email: email,
                  emailVerificado: true,
                  fotoPerfil: null
                },
                token: `demo-token-${Date.now()}`,
                message: 'Login exitoso (modo demo)',
                requiresVerification: false
              }));
              return;
            } else {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                error: 'Credenciales inválidas (demo: lucia@example.com/password123 o kevin.zepeda4cm@gmail.com/123456)'
              }));
              return;
            }
          }

          // Buscar usuario en la base de datos
          console.log('🔍 Searching user in database...');
          const sql = `
            SELECT idUsuario, nombre, correo, contraseña, activo, emailVerificado, 
                   codigoVerificacion, codigoExpiracion, fotoPerfil
            FROM usuarios 
            WHERE correo = ?
          `;
          const users = await execute(sql, [email]);
          
          console.log('👥 Users found:', users.length);

          if (users.length === 0) {
            console.log('❌ User not found');
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Credenciales inválidas'
            }));
            return;
          }

          const user = users[0];
          console.log('👤 User found:', user.nombre);
          console.log('✅ User active:', user.activo);
          console.log('📧 Email verified:', user.emailVerificado);

          // Verificar si el usuario está activo
          if (!user.activo) {
            console.log('❌ User is inactive');
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Usuario desactivado. Contacta al administrador.'
            }));
            return;
          }

          // ✅ VERIFICAR CONTRASEÑA CON BCRYPT
          let isValidPassword = false;
          
          try {
            // Verificar si la contraseña almacenada está hasheada
            const bcrypt = require('bcrypt');
            const isHashed = /^\$2[ab]\$\d{1,2}\$/.test(user.contraseña);
            
            if (isHashed) {
              // Contraseña hasheada - usar bcrypt.compare
              console.log('🔐 Comparing with bcrypt hash...');
              isValidPassword = await bcrypt.compare(password, user.contraseña);
            } else {
              // Contraseña sin hash (usuarios antiguos) - comparar directamente
              console.log('⚠️ Plain password detected, comparing directly...');
              isValidPassword = password === user.contraseña;
              
              // Si la contraseña es correcta, migrar a bcrypt
              if (isValidPassword) {
                console.log('🔄 Migrating plain password to bcrypt...');
                const hashedPassword = await bcrypt.hash(password, 12);
                await execute(
                  'UPDATE usuarios SET contraseña = ? WHERE idUsuario = ?',
                  [hashedPassword, user.idUsuario]
                );
                console.log('✅ Password migrated to bcrypt successfully');
              }
            }
          } catch (bcryptError) {
            console.error('❌ Bcrypt error:', bcryptError);
            // Fallback a comparación directa para usuarios antiguos
            isValidPassword = password === user.contraseña;
          }
          
          console.log('🔑 Password valid:', isValidPassword);

          if (!isValidPassword) {
            console.log('❌ Invalid password');
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Credenciales inválidas'
            }));
            return;
          }

          // ✅ REQUERIR VERIFICACIÓN DE EMAIL ANTES DEL LOGIN
          // 🔥 CORREGIDO: Usar función helper robusta para verificación
          const emailVerified = isEmailVerified(user.emailVerificado);
          
          console.log('🔍 === EMAIL VERIFICATION CHECK ===');
          console.log('🔍 User emailVerificado value from DB:', user.emailVerificado);
          console.log('🔍 User emailVerificado type:', typeof user.emailVerificado);
          console.log('🔍 User emailVerificado === 1:', user.emailVerificado === 1);
          console.log('🔍 User emailVerificado === true:', user.emailVerificado === true);
          console.log('🔍 User emailVerificado === "1":', user.emailVerificado === "1");
          console.log('🔍 emailVerified (helper function):', emailVerified);
          console.log('🔍 Helper function details:');
          console.log('   - Input value:', user.emailVerificado);
          console.log('   - Input type:', typeof user.emailVerificado);
          console.log('   - String conversion:', String(user.emailVerificado));
          console.log('   - Boolean conversion:', Boolean(user.emailVerificado));
          
          if (!emailVerified) {
            console.log('⚠️ Email not verified, requiring verification first');
            
            // Verificar si tiene código activo
            let needsNewCode = true;
            if (user.codigoVerificacion && user.codigoExpiracion) {
              const now = new Date();
              const expiration = new Date(user.codigoExpiracion);
              needsNewCode = now > expiration;
            }

            // Si necesita nuevo código, generarlo
            if (needsNewCode) {
              const newCode = generateVerificationCode();
              const newExpiration = getCodeExpiration();
              
              await execute(
                'UPDATE usuarios SET codigoVerificacion = ?, codigoExpiracion = ? WHERE idUsuario = ?',
                [newCode, newExpiration, user.idUsuario]
              );

              // Intentar enviar email
              if (emailService) {
                try {
                  await emailService.sendVerificationCode(email, newCode, user.nombre);
                  console.log('📧 New verification code sent');
                } catch (error) {
                  console.log('⚠️ Failed to send verification email:', error.message);
                }
              }
            }

            // Login fallido - requiere verificación
            console.log('❌ LOGIN FAILED - Email verification required');
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Tu email no está verificado. Revisa tu correo electrónico.',
              requiresVerification: true,
              user: {
                id: user.idUsuario,
                idUsuario: user.idUsuario,
                nombre: user.nombre,
                name: user.nombre,
                correo: user.correo,
                email: user.correo,
                emailVerificado: false
              },
              verification: {
                codeSent: !!emailService,
                message: emailService ? 
                  'Te hemos enviado un nuevo código de verificación' :
                  'Servicio de email no disponible'
              }
            }));
            return;
          }

          // Login exitoso - usuario verificado
          console.log('✅ User email verified, proceeding with login');
          console.log('🔍 Final emailVerificado value:', user.emailVerificado);
          console.log('🔍 Final emailVerificado type:', typeof user.emailVerificado);
          console.log('🔍 emailVerified helper result:', emailVerified);
          
          const token = `token-${user.idUsuario}-${Date.now()}`;
          
          console.log('✅ LOGIN SUCCESSFUL for verified user:', user.nombre);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            user: {
              id: user.idUsuario,
              idUsuario: user.idUsuario,
              nombre: user.nombre,
              name: user.nombre,
              correo: user.correo,
              email: user.correo,
              emailVerificado: true,
              fotoPerfil: user.fotoPerfil || null
            },
            token: token,
            message: 'Inicio de sesión exitoso',
            requiresVerification: false
          }));

        } catch (error) {
          console.log('❌ LOGIN ERROR:', error.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Error interno del servidor'
          }));
        }
      });
      return;
    }

    // POST /api/auth/register - Registrar nuevo usuario CON VERIFICACIÓN
    if (requestPath === '/api/auth/register' && method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          console.log('\n📝 === REGISTER WITH VERIFICATION ===');
          
          const data = JSON.parse(body || '{}');
          const nombre = data.nombre || data.name;
          const email = data.email || data.correo;
          const password = data.password || data.contraseña;
          
          console.log('👤 Name:', nombre);
          console.log('📧 Email/Correo:', email);
          console.log('🔑 Password provided:', !!password);
          console.log('📦 Raw data received:', data);

          // Validar campos requeridos
          if (!nombre || !email || !password) {
            console.log('❌ Missing required fields');
            console.log('❌ Received:', { nombre: !!nombre, email: !!email, password: !!password });
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Nombre, correo y contraseña son requeridos'
            }));
            return;
          }

          // Validar formato de email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            console.log('❌ Invalid email format');
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Formato de correo electrónico inválido'
            }));
            return;
          }

          // Validar longitud de contraseña
          if (password.length < 6) {
            console.log('❌ Password too short');
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'La contraseña debe tener al menos 6 caracteres'
            }));
            return;
          }

          // Verificar conexión a base de datos
          if (!isDatabaseConnected) {
            console.log('⚠️ Database not connected - registration not available');
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Servicio de registro no disponible. Intenta más tarde.'
            }));
            return;
          }

          // Verificar si el email ya existe
          console.log('🔍 Checking if email already exists...');
          const checkEmailSql = 'SELECT idUsuario, emailVerificado FROM usuarios WHERE correo = ?';
          const existingUsers = await execute(checkEmailSql, [email]);
          
          if (existingUsers.length > 0) {
            const existingUser = existingUsers[0];
            if (existingUser.emailVerificado) {
              console.log('❌ Email already exists and verified');
              res.writeHead(409, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                error: 'Este correo electrónico ya está registrado'
              }));
              return;
            } else {
              console.log('⚠️ Email exists but not verified, allowing re-registration');
              // Eliminar usuario no verificado para permitir re-registro
              await execute('DELETE FROM usuarios WHERE idUsuario = ?', [existingUser.idUsuario]);
            }
          }

          // Generar código de verificación
          const verificationCode = generateVerificationCode();
          const codeExpiration = getCodeExpiration();
          
          console.log('📧 Generated verification code:', verificationCode);
          console.log('⏰ Code expires at:', codeExpiration);

          // Crear nuevo usuario (NO VERIFICADO)
          console.log('💾 Creating new user...');
          
          // ✅ HASHEAR CONTRASEÑA CON BCRYPT
          const bcrypt = require('bcrypt');
          const SALT_ROUNDS = 12;
          const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
          console.log('🔐 Password hashed with bcrypt successfully');
          
          const insertSql = `
            INSERT INTO usuarios (
              nombre, correo, contraseña, 
              emailVerificado, codigoVerificacion, codigoExpiracion,
              fechaCreacion, fechaActualizacion, activo
            ) VALUES (?, ?, ?, 0, ?, ?, NOW(), NOW(), 1)
          `;
          
          const result = await execute(insertSql, [
            nombre, email, hashedPassword, 
            verificationCode, codeExpiration
          ]);
          
          const newUserId = result.insertId;
          console.log('✅ User created with ID:', newUserId);

          // Intentar enviar email de verificación
          let emailSent = false;
          let emailError = null;
          
          if (emailService) {
            try {
              console.log('📧 Sending verification email...');
              await emailService.sendVerificationCode(email, verificationCode, nombre);
              emailSent = true;
              console.log('✅ Verification email sent successfully');
            } catch (error) {
              console.error('❌ Failed to send verification email:', error);
              emailError = error.message;
            }
          } else {
            console.log('⚠️ Email service not available');
            emailError = 'Servicio de email no disponible';
          }

          // Respuesta exitosa
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            user: {
              id: newUserId,
              idUsuario: newUserId,
              nombre: nombre,
              name: nombre,
              correo: email,
              email: email,
              emailVerificado: false
            },
            verification: {
              required: true,
              emailSent: emailSent,
              emailError: emailError,
              message: emailSent 
                ? 'Te hemos enviado un código de verificación a tu correo'
                : 'Usuario creado, pero no se pudo enviar el email de verificación'
            },
            message: 'Usuario registrado exitosamente. Verifica tu correo electrónico.'
          }));

        } catch (error) {
          console.log('❌ REGISTER ERROR:', error.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Error interno del servidor'
          }));
        }
      });
      return;
    }

    // POST /api/auth/verify-code - Verificar código de 6 dígitos
    if (requestPath === '/api/auth/verify-code' && method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          console.log('\n🔐 === VERIFY CODE ===');
          
          const data = JSON.parse(body || '{}');
          const email = data.email || data.correo;
          const code = data.code || data.codigo;
          
          console.log('📧 Email:', email);
          console.log('🔑 Code:', code);

          if (!email || !code) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Email y código son requeridos'
            }));
            return;
          }

          if (!isDatabaseConnected) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Base de datos no disponible'
            }));
            return;
          }

          // Buscar usuario con el código
          console.log('🔍 Searching user with verification code...');
          const sql = `
            SELECT idUsuario, nombre, correo, codigoVerificacion, codigoExpiracion, emailVerificado
            FROM usuarios 
            WHERE correo = ? AND codigoVerificacion = ?
          `;
          
          const users = await execute(sql, [email, code]);
          
          if (users.length === 0) {
            console.log('❌ Invalid code or email');
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Código de verificación inválido'
            }));
            return;
          }

          const user = users[0];
          
          // Verificar si ya está verificado
          if (user.emailVerificado) {
            console.log('✅ User already verified');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              message: 'Email ya verificado anteriormente',
              user: {
                id: user.idUsuario,
                idUsuario: user.idUsuario,
                nombre: user.nombre,
                correo: user.correo,
                emailVerificado: true
              }
            }));
            return;
          }

          // Verificar si el código no ha expirado
          const now = new Date();
          const expiration = new Date(user.codigoExpiracion);
          
          if (now > expiration) {
            console.log('❌ Code expired');
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Código de verificación expirado. Solicita uno nuevo.',
              expired: true
            }));
            return;
          }

          // Marcar como verificado
          console.log('✅ Verifying user...');
          const updateSql = `
            UPDATE usuarios 
            SET emailVerificado = 1, 
                fechaVerificacion = NOW(),
                codigoVerificacion = NULL,
                codigoExpiracion = NULL
            WHERE idUsuario = ?
          `;
          
          await execute(updateSql, [user.idUsuario]);
          
          // Enviar email de bienvenida
          if (emailService) {
            try {
              await emailService.sendWelcomeEmail(user.correo, user.nombre);
              console.log('✅ Welcome email sent');
            } catch (error) {
              console.log('⚠️ Welcome email failed:', error.message);
            }
          }

          console.log('🎉 User verified successfully:', user.nombre);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: '¡Email verificado exitosamente!',
            user: {
              id: user.idUsuario,
              idUsuario: user.idUsuario,
              nombre: user.nombre,
              name: user.nombre,
              correo: user.correo,
              email: user.correo,
              emailVerificado: true
            },
            token: `token-${user.idUsuario}-${Date.now()}`
          }));

        } catch (error) {
          console.log('❌ VERIFY CODE ERROR:', error.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Error interno del servidor'
          }));
        }
      });
      return;
    }

// POST /api/auth/verify-code - Verificar código de 6 dígitos (SIN fechaVerificacion)
    if (requestPath === '/api/auth/verify-code' && method === 'POST') {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      console.log('\n🔐 === VERIFY CODE ===');
      
      const data = JSON.parse(body || '{}');
      const email = data.email || data.correo;
      const code = data.code || data.codigo;
      
      console.log('📧 Email:', email);
      console.log('🔑 Code:', code);

      if (!email || !code) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Email y código son requeridos'
        }));
        return;
      }

      if (!isDatabaseConnected) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Base de datos no disponible'
        }));
        return;
      }

      // Buscar usuario con el código
      console.log('🔍 Searching user with verification code...');
      const sql = `
        SELECT idUsuario, nombre, correo, codigoVerificacion, codigoExpiracion, emailVerificado
        FROM usuarios 
        WHERE correo = ? AND codigoVerificacion = ?
      `;
      
      const users = await execute(sql, [email, code]);
      
      if (users.length === 0) {
        console.log('❌ Invalid code or email');
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Código de verificación inválido'
        }));
        return;
      }

      const user = users[0];
      
      // Verificar si ya está verificado
      if (user.emailVerificado) {
        console.log('✅ User already verified');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Email ya verificado anteriormente',
          user: {
            id: user.idUsuario,
            idUsuario: user.idUsuario,
            nombre: user.nombre,
            correo: user.correo,
            emailVerificado: true
          }
        }));
        return;
      }

      // Verificar si el código no ha expirado
      const now = new Date();
      const expiration = new Date(user.codigoExpiracion);
      
      if (now > expiration) {
        console.log('❌ Code expired');
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Código de verificación expirado. Solicita uno nuevo.',
          expired: true
        }));
        return;
      }

      // Marcar como verificado (SIN fechaVerificacion)
      console.log('✅ Verifying user...');
      console.log('🔍 Before update - User ID:', user.idUsuario);
      console.log('🔍 Before update - emailVerificado:', user.emailVerificado);
      
      const updateSql = `
        UPDATE usuarios 
        SET emailVerificado = 1, 
            codigoVerificacion = NULL,
            codigoExpiracion = NULL
        WHERE idUsuario = ?
      `;
      
      await execute(updateSql, [user.idUsuario]);
      
      // Verificar que se actualizó correctamente
      const verifyUpdateSql = `
        SELECT emailVerificado FROM usuarios WHERE idUsuario = ?
      `;
      const updatedUsers = await execute(verifyUpdateSql, [user.idUsuario]);
      
      if (updatedUsers.length > 0) {
        console.log('🔍 After update - emailVerificado from DB:', updatedUsers[0].emailVerificado);
        console.log('🔍 After update - emailVerificado type:', typeof updatedUsers[0].emailVerificado);
      }
      
      console.log('🎉 User verified successfully:', user.nombre);
      
      // 🔥 CORREGIDO: Generar token válido y permitir acceso directo
      const token = `token-${user.idUsuario}-${Date.now()}`;
      
      // 🔥 NUEVO: Logging detallado para debug
      console.log('📤 Sending verification success response:');
      console.log('  - success: true');
      console.log('  - canLoginDirectly: true');
      console.log('  - token: exists');
      console.log('  - user.emailVerificado: true');
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: '¡Email verificado exitosamente!',
        user: {
          id: user.idUsuario,
          idUsuario: user.idUsuario,
          nombre: user.nombre,
          name: user.nombre,
          correo: user.correo,
          email: user.correo,
          emailVerificado: true
        },
        token: token,
        // 🔥 NUEVO: Indicar que el usuario puede acceder directamente
        canLoginDirectly: true,
        // 🔥 NUEVO: Incluir credenciales para login automático
        loginCredentials: {
          email: user.correo,
          password: null // No podemos incluir la contraseña por seguridad
        }
      }));

    } catch (error) {
      console.log('❌ VERIFY CODE ERROR:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Error interno del servidor'
      }));
    }
  });
  return;
}

    // POST /api/auth/fix-demo-users - Corregir usuarios de demo
    if (requestPath === '/api/auth/fix-demo-users' && method === 'POST') {
      try {
        console.log('\n🔧 === FIXING DEMO USERS ===');
        
        if (!isDatabaseConnected) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Base de datos no disponible'
          }));
          return;
        }

        // Usuarios demo específicos
        const demoUsers = [
          'lucia@example.com',
          'kevin.zepeda4cm@gmail.com'
        ];

        const results = [];
        
        for (const email of demoUsers) {
          try {
            // Buscar usuario
            const [users] = await execute(
              'SELECT idUsuario, nombre, emailVerificado, codigoVerificacion FROM usuarios WHERE correo = ?',
              [email]
            );
            
            if (users.length === 0) {
              results.push({ email, status: 'not_found' });
              continue;
            }
            
            const user = users[0];
            console.log(`👤 Fixing user: ${user.nombre} (${email})`);
            console.log(`   - Current emailVerificado: ${user.emailVerificado} (type: ${typeof user.emailVerificado})`);
            
            // Forzar verificación y limpiar códigos
            await execute(
              'UPDATE usuarios SET emailVerificado = 1, codigoVerificacion = NULL, codigoExpiracion = NULL WHERE idUsuario = ?',
              [user.idUsuario]
            );
            
            // Verificar el cambio
            const [updatedUsers] = await execute(
              'SELECT emailVerificado FROM usuarios WHERE idUsuario = ?',
              [user.idUsuario]
            );
            
            const updatedUser = updatedUsers[0];
            console.log(`   - Updated emailVerificado: ${updatedUser.emailVerificado} (type: ${typeof updatedUser.emailVerificado})`);
            
            results.push({ 
              email, 
              status: 'fixed',
              before: user.emailVerificado,
              after: updatedUser.emailVerificado
            });
            
          } catch (error) {
            console.error(`❌ Error fixing user ${email}:`, error.message);
            results.push({ email, status: 'error', error: error.message });
          }
        }
        
        console.log('✅ Demo users fix completed');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Usuarios demo corregidos',
          results: results
        }));
        
      } catch (error) {
        console.error('❌ Error in fix-demo-users:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Error interno del servidor'
        }));
      }
      return;
    }

    // 🔥 ENDPOINT: Recuperación de contraseña (NUEVA VERSIÓN - SIN MODIFICAR BASE)
    if (requestPath === '/api/auth/forgot-password' && method === 'POST') {
      try {
        console.log('\n🔑 === FORGOT PASSWORD (NUEVA VERSIÓN) ===');
        
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            // 🔍 DEBUG: Log raw request body
            console.log('🔍 Raw request body:', body);
            console.log('🔍 Request body type:', typeof body);
            console.log('🔍 Request body length:', body.length);
            console.log('🔍 Request headers:', JSON.stringify(req.headers, null, 2));
            
            const data = JSON.parse(body || '{}');
            console.log('🔍 Parsed data:', JSON.stringify(data, null, 2));
            const email = data.email || data.correo;
            
            if (!email) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                error: 'Email es requerido'
              }));
              return;
            }
            
            console.log(`📧 Password recovery requested for: ${email}`);
            
            if (!isDatabaseConnected) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                error: 'Base de datos no disponible'
              }));
              return;
            }
            
            // Buscar usuario
            console.log('🔍 Executing SQL query for email:', email);
            const [queryResult] = await execute(`
              SELECT idUsuario, nombre, correo, activo
              FROM usuarios 
              WHERE correo = ?
            `, [email]);
            
            // Ensure users is always an array of user objects
            const users = Array.isArray(queryResult) ? queryResult : (queryResult ? [queryResult] : []);
            
            console.log('🔍 Raw query result (after execute):', JSON.stringify(queryResult, null, 2));
            console.log('🔍 Users array (after normalization):', JSON.stringify(users, null, 2));
            console.log('🔍 Users array length (after normalization):', users ? users.length : 'undefined');
            console.log('🔍 Users type (after normalization):', typeof users);
            
            if (!users || users.length === 0) {
              // Por seguridad, no revelar si el email existe o no
              console.log('📧 Password recovery email sent (user not found)');
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                message: 'Si el email existe en nuestra base de datos, recibirás una nueva contraseña temporal.'
              }));
              return;
            }
            
            const user = users[0];
            console.log('🔍 First user object:', JSON.stringify(user, null, 2));
            
            // 🔍 DEBUG: Verificar estructura del usuario
            console.log('🔍 User object structure:', JSON.stringify(user, null, 2));
            console.log('🔍 User.activo value:', user?.activo);
            console.log('🔍 User.activo type:', typeof user?.activo);
            
            // Verificar si el usuario está activo (con manejo seguro)
            if (user && user.activo === 0) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                message: 'Si el email existe en nuestra base de datos, recibirás una nueva contraseña temporal.'
              }));
              return;
            }
            
            // Generar contraseña temporal segura
            const tempPassword = generateTemporaryPassword();
            const hashedTempPassword = await bcrypt.hash(tempPassword, SALT_ROUNDS);
            
            console.log('🔍 About to access user.idUsuario:', user?.idUsuario);
            console.log('🔍 User object at this point:', JSON.stringify(user, null, 2));
            
            // Actualizar contraseña en la base de datos
            await execute(`
              UPDATE usuarios 
              SET contraseña = ?
              WHERE idUsuario = ?
            `, [hashedTempPassword, user.idUsuario]);
            
            console.log(`🔑 Temporary password generated for user ${user.idUsuario}`);
            
            // Enviar email con contraseña temporal
            if (emailService) {
              try {
                await emailService.sendTemporaryPassword(user.correo, user.nombre, tempPassword);
                console.log('✅ Temporary password email sent successfully');
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  success: true,
                  message: 'Se ha enviado una nueva contraseña temporal a tu correo electrónico. Revisa tu bandeja de entrada.'
                }));
              } catch (emailError) {
                console.error('❌ Error sending temporary password email:', emailError.message);
                
                // Revertir contraseña si falla el email
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  success: false,
                  error: 'Error enviando el email con la contraseña temporal. Intenta más tarde.'
                }));
              }
            } else {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                error: 'Servicio de email no disponible. Contacta al administrador.'
              }));
            }
            
          } catch (parseError) {
            console.error('❌ Error parsing request body:', parseError.message);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Error en el formato de la solicitud'
            }));
          }
        });
        return;
      } catch (error) {
        console.error('❌ Error in forgot-password:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Error interno del servidor'
        }));
      }
      return;
    }



    // 🔥 NUEVO ENDPOINT: Diagnóstico de verificación de email
    if (requestPath === '/api/auth/debug-verification' && method === 'POST') {
      try {
        console.log('\n🔍 === DEBUG EMAIL VERIFICATION ===');
        
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const data = JSON.parse(body || '{}');
            const email = data.email || data.correo;
            
            if (!email) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                error: 'Email es requerido'
              }));
              return;
            }
            
            console.log(`📧 Debugging verification for: ${email}`);
            
            if (!isDatabaseConnected) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                error: 'Base de datos no disponible'
              }));
              return;
            }
            
            // Buscar usuario
            const [users] = await execute(`
              SELECT 
                idUsuario, 
                nombre, 
                correo, 
                emailVerificado, 
                codigoVerificacion, 
                codigoExpiracion, 
                fechaVerificacion, 
                activo
              FROM usuarios 
              WHERE correo = ?
            `, [email]);
            
            if (users.length === 0) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                error: 'Usuario no encontrado'
              }));
              return;
            }
            
            const user = users[0];
            console.log('👤 User found:', user.nombre);
            console.log('🔍 Verification details:');
            console.log(`   - emailVerificado: ${user.emailVerificado} (type: ${typeof user.emailVerificado})`);
            console.log(`   - codigoVerificacion: ${user.codigoVerificacion}`);
            console.log(`   - codigoExpiracion: ${user.codigoExpiracion}`);
            console.log(`   - fechaVerificacion: ${user.fechaVerificacion}`);
            console.log(`   - activo: ${user.activo}`);
            
            // Probar diferentes verificaciones
            const verificationTests = {
              directComparison: user.emailVerificado === 1,
              booleanConversion: Boolean(user.emailVerificado),
              stringComparison: String(user.emailVerificado) === '1',
              helperFunction: isEmailVerified(user.emailVerificado)
            };
            
            console.log('🧪 Verification tests:', verificationTests);
            
            // Determinar estado real
            let actualStatus = 'unknown';
            if (user.fechaVerificacion) {
              actualStatus = 'verified_by_date';
            } else if (user.emailVerificado && verificationTests.helperFunction) {
              actualStatus = 'verified_by_flag';
            } else if (user.codigoVerificacion) {
              actualStatus = 'needs_verification';
            } else {
              actualStatus = 'not_verified';
            }
            
            console.log(`📊 Actual status: ${actualStatus}`);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              user: {
                id: user.idUsuario,
                nombre: user.nombre,
                correo: user.correo,
                emailVerificado: user.emailVerificado,
                codigoVerificacion: user.codigoVerificacion,
                codigoExpiracion: user.codigoExpiracion,
                fechaVerificacion: user.fechaVerificacion,
                activo: user.activo
              },
              verificationTests: verificationTests,
              actualStatus: actualStatus,
              shouldBeVerified: actualStatus === 'verified_by_date' || actualStatus === 'verified_by_flag'
            }));
            
          } catch (parseError) {
            console.error('❌ Error parsing request body:', parseError.message);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Error en el formato de la solicitud'
            }));
          }
        });
        return;
      } catch (error) {
        console.error('❌ Error in debug-verification:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Error interno del servidor'
        }));
      }
      return;
    }

    // POST /api/auth/test-email - Enviar email de prueba
    if (requestPath === '/api/auth/test-email' && method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          console.log('\n🧪 === TEST EMAIL ===');
          
          const data = JSON.parse(body || '{}');
          const email = data.email || data.correo;
          
          console.log('📧 Test email to:', email);

          if (!email) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Email es requerido'
            }));
            return;
          }

          if (!emailService) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Servicio de email no disponible'
            }));
            return;
          }

          await emailService.sendTestEmail(email);
          
          console.log('✅ Test email sent successfully');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: 'Email de prueba enviado exitosamente'
          }));

        } catch (error) {
          console.error('❌ Test email error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Error enviando email de prueba: ' + error.message
          }));
        }
      });
      return;
    }

    // GET /api/auth/email-debug - Debug del email service
    if (requestPath === '/api/auth/email-debug' && method === 'GET') {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    emailService: {
      available: !!emailService,
      configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD),
      user: process.env.EMAIL_USER,
      passwordLength: process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 0
    },
    environment: {
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASSWORD_SET: !!process.env.EMAIL_PASSWORD,
      EMAIL_HOST: process.env.EMAIL_HOST,
      EMAIL_PORT: process.env.EMAIL_PORT
    },
    timestamp: new Date().toISOString()
  }));
  return;
}

    // GET /api/auth/test - Endpoint de prueba
    if (requestPath === '/api/auth/test' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Auth endpoints funcionando correctamente',
        timestamp: new Date().toISOString(),
        database: isDatabaseConnected ? 'MySQL conectada' : 'Base de datos desconectada',
        emailService: emailService ? 'Disponible' : 'No disponible',
        availableEndpoints: [
          'POST /api/auth/login - Iniciar sesión',
          'POST /api/auth/register',
          'POST /api/auth/verify-code',
          'POST /api/auth/resend-code',
          'POST /api/auth/test-email',
          'GET /api/auth/test'
        ]
      }));
      return;
    }

    // GET /api/users - Ver todos los usuarios (para testing)
    if (requestPath === '/api/users' && method === 'GET') {
      try {
        if (!isDatabaseConnected) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Base de datos no conectada'
          }));
          return;
        }

        const sql = `
          SELECT 
            idUsuario as id, 
            nombre, 
            correo, 
            fechaCreacion, 
            activo,
            emailVerificado,
            fechaVerificacion
          FROM usuarios 
          ORDER BY fechaCreacion DESC
        `;
        const users = await execute(sql);
        
        const processedUsers = users.map(user => ({
          ...user,
          activo: user.activo ? 'Sí' : 'No',
          estado: user.activo ? '🟢 Activo' : '🔴 Inactivo',
          emailVerificado: user.emailVerificado ? '✅ Verificado' : '⚠️ No Verificado'
        }));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          users: processedUsers,
          count: users.length,
          message: `Se encontraron ${users.length} usuarios en la base de datos`
        }));
      } catch (error) {
        console.error('❌ Error obteniendo usuarios:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Error interno del servidor'
        }));
      }
      return;
    }

    // GET /api/users/:id - Ver usuario específico
    if (requestPath.startsWith('/api/users/') && requestPath.split('/').length === 4 && method === 'GET') {
      try {
        const userId = requestPath.split('/')[3];
        
        if (!isDatabaseConnected) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Base de datos no conectada'
          }));
          return;
        }

        const sql = `
          SELECT 
            idUsuario as id, 
            nombre, 
            correo, 
            fechaCreacion, 
            activo,
            emailVerificado,
            fechaVerificacion
          FROM usuarios 
          WHERE idUsuario = ?
        `;
        const users = await execute(sql, [userId]);
        
        if (users.length === 0) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: `Usuario con ID ${userId} no encontrado`
          }));
          return;
        }
        
        const user = users[0];
        const processedUser = {
          ...user,
          activo: user.activo ? 'Sí' : 'No',
          estado: user.activo ? '🟢 Activo' : '🔴 Inactivo',
          emailStatus: user.emailVerificado ? '✅ Verificado' : '⚠️ No Verificado'
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          user: processedUser,
          message: `Usuario ${userId} encontrado exitosamente`
        }));
      } catch (error) {
        console.error('❌ Error obteniendo usuario:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Error interno del servidor'
        }));
      }
      return;


      
    }
    // PUT /api/users/update/:userId - Actualizar información personal del usuario
    if (requestPath.match(/\/api\/users\/update\/\d+$/) && method === 'PUT') {
  const pathParts = requestPath.split('/');
  const userId = pathParts[4]; // /api/users/update/123 -> 123
  
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      console.log('\n🔄 === UPDATE USER INFO ===');
      console.log('👤 User ID:', userId);
      
      const data = JSON.parse(body || '{}');
      const { nombre, correo } = data;
      
      console.log('📝 New name:', nombre);
      console.log('📧 New email:', correo);

      // Validar campos requeridos
      if (!nombre || !correo) {
        console.log('❌ Missing required fields');
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Nombre y correo son requeridos'
        }));
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correo)) {
        console.log('❌ Invalid email format');
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Formato de correo electrónico inválido'
        }));
        return;
      }

      // Verificar conexión a base de datos
      if (!isDatabaseConnected) {
        console.log('⚠️ Database not connected');
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Base de datos no disponible'
        }));
        return;
      }

      // Verificar que el usuario existe
      console.log('🔍 Checking if user exists...');
      const userExists = await execute(
        'SELECT idUsuario, correo as currentEmail FROM usuarios WHERE idUsuario = ?',
        [userId]
      );
      
      if (userExists.length === 0) {
        console.log('❌ User not found');
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Usuario no encontrado'
        }));
        return;
      }

      const currentUser = userExists[0];
      const emailChanged = currentUser.currentEmail.toLowerCase() !== correo.toLowerCase();
      
      // Si cambió el email, verificar disponibilidad
      if (emailChanged) {
        console.log('🔍 Checking email availability...');
        const emailCheck = await execute(
          'SELECT idUsuario FROM usuarios WHERE correo = ? AND idUsuario != ?',
          [correo, userId]
        );
        
        if (emailCheck.length > 0) {
          console.log('❌ Email already in use');
          res.writeHead(409, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Este correo ya está siendo usado por otra cuenta'
          }));
          return;
        }
      }

      // Actualizar información del usuario
      console.log('💾 Updating user information...');
      let updateSql;
      let updateParams;
      
      if (emailChanged) {
        // Si cambió el email, marcar como no verificado
        updateSql = `
          UPDATE usuarios 
          SET nombre = ?, correo = ?, emailVerificado = 0, fechaActualizacion = NOW() 
          WHERE idUsuario = ?
        `;
        updateParams = [nombre.trim(), correo.trim(), userId];
        console.log('📧 Email changed, marking as unverified');
      } else {
        // Solo actualizar nombre
        updateSql = `
          UPDATE usuarios 
          SET nombre = ?, fechaActualizacion = NOW() 
          WHERE idUsuario = ?
        `;
        updateParams = [nombre.trim(), userId];
        console.log('📝 Only updating name');
      }
      
      const result = await execute(updateSql, updateParams);
      
      if (result.affectedRows === 0) {
        console.log('❌ No rows affected');
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'No se pudo actualizar la información'
        }));
        return;
      }

      // Obtener la información actualizada
      const updatedUser = await execute(
        'SELECT idUsuario, nombre, correo, emailVerificado, fechaCreacion, fechaActualizacion FROM usuarios WHERE idUsuario = ?',
        [userId]
      );

      console.log('✅ User information updated successfully');
      console.log('📧 Email changed:', emailChanged);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Información actualizada exitosamente',
        emailChanged: emailChanged,
        user: {
          id: updatedUser[0].idUsuario,
          idUsuario: updatedUser[0].idUsuario,
          nombre: updatedUser[0].nombre,
          name: updatedUser[0].nombre,
          correo: updatedUser[0].correo,
          email: updatedUser[0].correo,
          emailVerificado: updatedUser[0].emailVerificado,
          fechaCreacion: updatedUser[0].fechaCreacion,
          fechaActualizacion: updatedUser[0].fechaActualizacion
        }
      }));

    } catch (error) {
      console.log('❌ UPDATE USER ERROR:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Error interno del servidor: ' + error.message
      }));
    }
  });
  return;
}

// POST /api/users/check-email - Verificar disponibilidad de email
    if (requestPath === '/api/users/check-email' && method === 'POST') {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      console.log('\n📧 === CHECK EMAIL AVAILABILITY ===');
      
      const data = JSON.parse(body || '{}');
      const { correo, userId } = data;
      
      console.log('📧 Checking email:', correo);
      console.log('👤 For user ID:', userId);

      if (!correo) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Email es requerido'
        }));
        return;
      }

      if (!isDatabaseConnected) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          available: true,
          message: 'Email disponible (modo offline)'
        }));
        return;
      }

      // Verificar si el email ya existe (excluyendo al usuario actual si se proporciona)
      let sql = 'SELECT idUsuario FROM usuarios WHERE correo = ?';
      let params = [correo.toLowerCase()];
      
      if (userId) {
        sql += ' AND idUsuario != ?';
        params.push(userId);
      }

      const existingUsers = await execute(sql, params);
      const available = existingUsers.length === 0;
      
      console.log('✅ Email availability check completed');
      console.log('📊 Available:', available);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        available: available,
        message: available ? 'Email disponible' : 'Email ya está en uso'
      }));

    } catch (error) {
      console.log('❌ CHECK EMAIL ERROR:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Error interno del servidor'
      }));
    }
  });
  return;
}

// GET /api/users/:userId/stats - Obtener estadísticas del usuario
    if (requestPath.match(/\/api\/users\/\d+\/stats$/) && method === 'GET') {
  try {
    const pathParts = requestPath.split('/');
    const userId = pathParts[3]; // /api/users/123/stats -> 123
    
    console.log('\n📊 === GET USER STATS ===');
    console.log('👤 User ID:', userId);

    if (!isDatabaseConnected) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        stats: {
          totalReports: 0,
          communitiesJoined: 0,
          userId: parseInt(userId)
        },
        message: 'Estadísticas no disponibles (modo offline)'
      }));
      return;
    }

    // Obtener estadísticas de reportes
    const reportsStats = await execute(
      'SELECT COUNT(*) as totalReports FROM reportes WHERE idUsuario = ?',
      [userId]
    );

    // Obtener estadísticas de comunidades
    const communitiesStats = await execute(
      'SELECT COUNT(*) as communitiesJoined FROM usuario_comunidad WHERE idUsuario = ?',
      [userId]
    );

    const stats = {
      totalReports: reportsStats[0]?.totalReports || 0,
      communitiesJoined: communitiesStats[0]?.communitiesJoined || 0,
      userId: parseInt(userId)
    };

    console.log('✅ User stats retrieved:', stats);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      stats: stats,
      message: 'Estadísticas obtenidas exitosamente'
    }));

  } catch (error) {
    console.log('❌ GET USER STATS ERROR:', error.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }));
  }
  return;
}

// GET /api/users/test - Test de rutas de usuarios
    if (requestPath === '/api/users/test' && method === 'GET') {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: 'Rutas de usuarios funcionando correctamente',
    timestamp: new Date().toISOString(),
    database: isDatabaseConnected ? 'MySQL conectada' : 'Base de datos desconectada',
    availableRoutes: [
      'PUT /api/users/update/:userId - Actualizar información personal',
      'POST /api/users/check-email - Verificar disponibilidad de email',
      'GET /api/users/:userId/stats - Obtener estadísticas del usuario',
      'GET /api/users/test - Este endpoint de prueba'
    ]
  }));
  return;
}

// ✅ PUT /api/users/:id/profile-photo - Actualizar foto de perfil del usuario
if (requestPath.match(/\/api\/users\/\d+\/profile-photo$/) && method === 'PUT') {
  const userId = requestPath.split('/')[3];
  
  console.log('\n📸 === UPDATE PROFILE PHOTO ===');
  console.log('👤 User ID:', userId);
  console.log('📋 Content-Type:', req.headers['content-type']);
  
  try {
    // Usar multer para manejar la subida de archivos
    profileUpload.single('fotoPerfil')(req, res, async (err) => {
      if (err) {
        console.log('❌ Multer error:', err.message);
        console.log('❌ Multer error stack:', err.stack);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: err.message
        }));
        return;
      }
      
      try {
        console.log('📸 Multer processing completed');
        console.log('📸 req.file:', req.file);
        
        if (!req.file) {
          console.log('❌ No file uploaded');
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'No se proporcionó ninguna imagen'
          }));
          return;
        }
        
        console.log('📸 File uploaded successfully:', req.file.filename);
        console.log('📁 File path:', req.file.path);
        console.log('📁 File size:', req.file.size);
        console.log('📁 File mimetype:', req.file.mimetype);
        
        // Construir la URL de la imagen
        const imageUrl = `http://192.168.1.13:3000/uploads/profiles/${req.file.filename}`;
        console.log('🔗 Image URL:', imageUrl);
        
        // Verificar que el usuario existe primero
        const checkUserQuery = 'SELECT idUsuario FROM usuarios WHERE idUsuario = ?';
        const userResult = await execute(checkUserQuery, [userId]);
        console.log('👤 User check result:', userResult);
        
        // El resultado puede venir en diferentes formatos
        let userExists = false;
        if (Array.isArray(userResult)) {
          userExists = userResult.length > 0;
        } else if (userResult && typeof userResult === 'object') {
          userExists = Object.keys(userResult).length > 0;
        }
        
        if (!userExists) {
          console.log('❌ User not found:', userId);
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Usuario no encontrado'
          }));
          return;
        }
        
        console.log('✅ User found');
        
        // Actualizar la base de datos
        const updateQuery = 'UPDATE usuarios SET fotoPerfil = ? WHERE idUsuario = ?';
        console.log('📝 Executing update query:', updateQuery);
        console.log('📝 With params:', [imageUrl, userId]);
        
        const result = await execute(updateQuery, [imageUrl, userId]);
        
        console.log('📝 Update result:', result);
        
        // Verificar si la actualización fue exitosa
        let affectedRows = 0;
        if (Array.isArray(result)) {
          affectedRows = result[0]?.affectedRows || 0;
        } else if (result && typeof result === 'object') {
          affectedRows = result.affectedRows || 0;
        }
        
        console.log('📝 Affected rows:', affectedRows);
        
        if (affectedRows === 0) {
          console.log('❌ No rows affected in update');
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'No se pudo actualizar la foto de perfil'
          }));
          return;
        }
        
        console.log('✅ Profile photo updated successfully');
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Foto de perfil actualizada exitosamente',
          fotoPerfil: imageUrl
        }));
        
      } catch (error) {
        console.log('❌ UPDATE PROFILE PHOTO ERROR:', error.message);
        console.log('❌ UPDATE PROFILE PHOTO STACK:', error.stack);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Error interno del servidor: ' + error.message
        }));
      }
    });
  } catch (error) {
    console.log('❌ OUTER CATCH ERROR:', error.message);
    console.log('❌ OUTER CATCH STACK:', error.stack);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    }));
  }
  return;
}

    
// PUT /api/users/:id - Actualizar información personal del usuario
if (requestPath.startsWith('/api/users/') && method === 'PUT' && requestPath.split('/').length === 4) {
  const userId = requestPath.split('/')[3];
  
  // Si la ruta termina en /password, manejar cambio de contraseña
  if (requestPath.endsWith('/password')) {
    // Este endpoint se maneja más abajo
    return;
  }
  
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      console.log('\n🔄 === UPDATE USER INFO ===');
      console.log('👤 User ID:', userId);
      
      const { nombre, correo } = JSON.parse(body || '{}');
      
      console.log('📝 New name:', nombre);
      console.log('📧 New email:', correo);

      // Validar campos requeridos
      if (!nombre || !correo) {
        console.log('❌ Missing required fields');
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Nombre y correo son requeridos'
        }));
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correo)) {
        console.log('❌ Invalid email format');
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Formato de correo electrónico inválido'
        }));
        return;
      }

      // Verificar conexión a base de datos
      if (!isDatabaseConnected) {
        console.log('⚠️ Database not connected');
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Base de datos no disponible'
        }));
        return;
      }

      // Verificar que el usuario existe
      console.log('🔍 Checking if user exists...');
      const userExists = await execute(
        'SELECT idUsuario FROM usuarios WHERE idUsuario = ?',
        [userId]
      );
      
      if (userExists.length === 0) {
        console.log('❌ User not found');
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Usuario no encontrado'
        }));
        return;
      }

      // Verificar si el email ya está siendo usado por otro usuario
      console.log('🔍 Checking email availability...');
      const emailCheck = await execute(
        'SELECT idUsuario FROM usuarios WHERE correo = ? AND idUsuario != ?',
        [correo, userId]
      );
      
      if (emailCheck.length > 0) {
        console.log('❌ Email already in use');
        res.writeHead(409, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Este correo ya está siendo usado por otra cuenta'
        }));
        return;
      }

      // Actualizar información del usuario
      console.log('💾 Updating user information...');
      const updateSql = `
        UPDATE usuarios 
        SET nombre = ?, correo = ?, fechaActualizacion = NOW() 
        WHERE idUsuario = ?
      `;
      
      const result = await execute(updateSql, [nombre.trim(), correo.trim(), userId]);
      
      if (result.affectedRows === 0) {
        console.log('❌ No rows affected');
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'No se pudo actualizar la información'
        }));
        return;
      }

      // Obtener la información actualizada
      const updatedUser = await execute(
        'SELECT idUsuario, nombre, correo, fechaCreacion, fechaActualizacion FROM usuarios WHERE idUsuario = ?',
        [userId]
      );

      console.log('✅ User information updated successfully');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Información actualizada exitosamente',
        user: {
          id: updatedUser[0].idUsuario,
          idUsuario: updatedUser[0].idUsuario,
          nombre: updatedUser[0].nombre,
          name: updatedUser[0].nombre,
          correo: updatedUser[0].correo,
          email: updatedUser[0].correo,
          fechaCreacion: updatedUser[0].fechaCreacion,
          fechaActualizacion: updatedUser[0].fechaActualizacion
        }
      }));

    } catch (error) {
      console.log('❌ UPDATE USER ERROR:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Error interno del servidor'
      }));
    }
  });
  return;
}

// PUT /api/users/:id/password - Cambiar contraseña del usuario
    if (requestPath.match(/\/api\/users\/\d+\/password$/) && method === 'PUT') {
  const userId = requestPath.split('/')[3];
  
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      console.log('\n🔐 === CHANGE USER PASSWORD ===');
      console.log('👤 User ID:', userId);
      
      const { currentPassword, newPassword } = JSON.parse(body || '{}');
      
      console.log('🔑 Current password provided:', !!currentPassword);
      console.log('🔑 New password provided:', !!newPassword);

      // Validar campos requeridos
      if (!currentPassword || !newPassword) {
        console.log('❌ Missing required fields');
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Contraseña actual y nueva contraseña son requeridas'
        }));
        return;
      }

      // Validar longitud de nueva contraseña
      if (newPassword.length < 6) {
        console.log('❌ New password too short');
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'La nueva contraseña debe tener al menos 6 caracteres'
        }));
        return;
      }

      // Verificar conexión a base de datos
      if (!isDatabaseConnected) {
        console.log('⚠️ Database not connected');
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Base de datos no disponible'
        }));
        return;
      }

      // Verificar que el usuario existe y obtener su contraseña actual
      console.log('🔍 Checking if user exists and verifying current password...');
      const userData = await execute(
        'SELECT idUsuario, contraseña, nombre FROM usuarios WHERE idUsuario = ?',
        [userId]
      );
      
      if (userData.length === 0) {
        console.log('❌ User not found');
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Usuario no encontrado'
        }));
        return;
      }

      const user = userData[0];
      const storedPassword = user.contraseña;
      
      console.log('👤 User found:', user.nombre);
      console.log('🔑 Stored password type:', typeof storedPassword);
      console.log('🔑 Stored password length:', storedPassword ? storedPassword.length : 0);
      console.log('🔑 Current password provided length:', currentPassword.length);

      // Verificar si la contraseña actual es correcta
      console.log('🔐 Verifying current password...');
      let isCurrentPasswordValid = false;
      
      try {
        // Intentar verificar con bcrypt primero
        console.log('🔄 Trying bcrypt comparison...');
        isCurrentPasswordValid = await bcrypt.compare(currentPassword, storedPassword);
        console.log('✅ Bcrypt comparison result:', isCurrentPasswordValid);
      } catch (bcryptError) {
        console.log('⚠️ Bcrypt comparison failed:', bcryptError.message);
        console.log('🔄 Trying plain text fallback...');
        // Fallback para contraseñas en texto plano (durante migración)
        isCurrentPasswordValid = (currentPassword === storedPassword);
        console.log('✅ Plain text comparison result:', isCurrentPasswordValid);
      }

      if (!isCurrentPasswordValid) {
        console.log('❌ Current password is incorrect');
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'La contraseña actual es incorrecta'
        }));
        return;
      }

      // Hash de la nueva contraseña
      console.log('🔐 Hashing new password...');
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Actualizar contraseña del usuario
      console.log('💾 Updating user password...');
      const updateSql = `
        UPDATE usuarios 
        SET contraseña = ?, fechaActualizacion = NOW() 
        WHERE idUsuario = ?
      `;
      
      const result = await execute(updateSql, [hashedNewPassword, userId]);
      
      if (result.affectedRows === 0) {
        console.log('❌ No rows affected');
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'No se pudo actualizar la contraseña'
        }));
        return;
      }

      console.log('✅ User password updated successfully');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      }));

    } catch (error) {
      console.log('❌ CHANGE PASSWORD ERROR:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Error interno del servidor'
      }));
    }
  });
  return;
}

// POST /api/users/test-password - Endpoint de prueba para verificar contraseña
    if (requestPath === '/api/users/test-password' && method === 'POST') {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      console.log('\n🧪 === TEST PASSWORD ENDPOINT ===');
      const { userId, password } = JSON.parse(body || '{}');
      
      if (!userId || !password) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Se requiere userId y password'
        }));
        return;
      }

      const userData = await execute(
        'SELECT idUsuario, contraseña, nombre FROM usuarios WHERE idUsuario = ?',
        [userId]
      );
      
      if (userData.length === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Usuario no encontrado'
        }));
        return;
      }

      const user = userData[0];
      const storedPassword = user.contraseña;
      
      console.log('👤 Testing password for user:', user.nombre);
      console.log('🔑 Stored password type:', typeof storedPassword);
      console.log('🔑 Stored password length:', storedPassword ? storedPassword.length : 0);
      console.log('🔑 Test password length:', password.length);
      
      // Probar bcrypt
      let bcryptResult = false;
      try {
        bcryptResult = await bcrypt.compare(password, storedPassword);
      } catch (error) {
        console.log('❌ Bcrypt error:', error.message);
      }
      
      // Probar texto plano
      const plainTextResult = (password === storedPassword);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        user: {
          id: user.idUsuario,
          nombre: user.nombre
        },
        storedPassword: {
          type: typeof storedPassword,
          length: storedPassword ? storedPassword.length : 0,
          preview: storedPassword ? storedPassword.substring(0, 20) + '...' : 'null'
        },
        testResults: {
          bcrypt: bcryptResult,
          plainText: plainTextResult
        }
      }));

    } catch (error) {
      console.log('❌ TEST PASSWORD ERROR:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Error interno del servidor'
      }));
    }
  });
  return;
}

// POST /api/users/search - Buscar usuario por nombre o email
    if (requestPath === '/api/users/search' && method === 'POST') {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      console.log('\n🔍 === BÚSQUEDA DE USUARIO ===');
      const { nombre, correo } = JSON.parse(body || '{}');
      
      console.log('📝 Buscando usuario:');
      console.log('  - Nombre:', nombre);
      console.log('  - Correo:', correo);

      if (!nombre && !correo) {
        console.log('❌ No se proporcionó nombre ni correo');
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Se requiere nombre o correo para buscar'
        }));
        return;
      }

          if (!isDatabaseConnected) {
            console.log('⚠️ Base de datos no conectada - modo demo');
            
            // Usuario demo para Manuel Hernández
            if (nombre && nombre.toLowerCase().includes('manuel')) {
              const demoUser = {
                idUsuario: 67,
                id: 67,
                nombre: 'Manuel Hernández',
                correo: 'manuel@gmail.com',
                fechaCreacion: '2025-08-10',
                activo: true
              };
              
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                user: demoUser,
                message: 'Usuario encontrado (modo demo)'
              }));
              return;
            } else {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                error: 'Usuario no encontrado (modo demo)'
              }));
              return;
            }
          }

          // Construir consulta SQL
          let sql = 'SELECT idUsuario, nombre, correo, fechaCreacion, activo FROM usuarios WHERE ';
          let params = [];
          let conditions = [];

          if (nombre) {
            conditions.push('nombre LIKE ?');
            params.push(`%${nombre}%`);
          }

          if (correo) {
            conditions.push('correo LIKE ?');
            params.push(`%${correo}%`);
          }

          sql += conditions.join(' OR ');
          sql += ' LIMIT 5'; // Máximo 5 resultados

          console.log('📊 SQL Query:', sql);
          console.log('📊 Parámetros:', params);

          const users = await execute(sql, params);
          console.log('👥 Usuarios encontrados:', users.length);

          if (users.length > 0) {
            // Tomar el primer usuario que coincida mejor
            let bestMatch = users[0];
            
            // Si se busca por nombre, priorizar coincidencia exacta
            if (nombre) {
              const exactMatch = users.find(user => 
                user.nombre.toLowerCase() === nombre.toLowerCase()
              );
              if (exactMatch) {
                bestMatch = exactMatch;
              }
            }

            console.log('✅ Mejor coincidencia:', bestMatch.nombre, 'ID:', bestMatch.idUsuario);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              user: {
                idUsuario: bestMatch.idUsuario,
                id: bestMatch.idUsuario,
                nombre: bestMatch.nombre,
                correo: bestMatch.correo,
                fechaCreacion: bestMatch.fechaCreacion,
                activo: bestMatch.activo
              },
              message: 'Usuario encontrado exitosamente',
              totalFound: users.length
            }));
          } else {
            console.log('❌ No se encontraron usuarios');
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'No se encontraron usuarios con esos criterios'
            }));
          }

        } catch (error) {
          console.log('❌ ERROR EN BÚSQUEDA:', error.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Error interno del servidor'
          }));
        }
      });
      return;
    }


    // GET /api/auth/test-email - Test rápido de email
if (requestPath.startsWith('/api/auth/test-email') && method === 'GET') {
  const urlParams = new URLSearchParams(url.parse(req.url).query);
  const email = urlParams.get('email') || 'manuel.paz4cm@gmail.com';
  
  console.log(`🧪 Testing email to: ${email}`);
  
  if (emailService) {
    try {
      await emailService.sendTestEmail(email);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: `Email de prueba enviado a ${email}`,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.log('❌ Test email failed:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: error.message
      }));
    }
  } else {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: 'Email service not available'
    }));
  }
  return;
}

// POST /api/auth/resend-code - Reenviar código de verificación
    if (requestPath === '/api/auth/resend-code' && method === 'POST') {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      const data = JSON.parse(body || '{}');
      const email = data.email || data.correo;
      
      console.log(`🔄 Resending code to: ${email}`);
      
      if (!email) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Email es requerido'
        }));
        return;
      }

      // Buscar usuario
      const sql = 'SELECT idUsuario, nombre, correo, emailVerificado FROM usuarios WHERE correo = ?';
      const users = await execute(sql, [email]);
      
      if (users.length === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Usuario no encontrado'
        }));
        return;
      }

      const user = users[0];
      
      if (user.emailVerificado) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Email ya está verificado'
        }));
        return;
      }

      // Generar nuevo código
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
      
      // Actualizar código en BD
      const updateSql = `
        UPDATE usuarios 
        SET codigoVerificacion = ?, codigoExpiracion = ?
        WHERE idUsuario = ?
      `;
      await execute(updateSql, [code, expiration, user.idUsuario]);
      
      // Enviar email
      if (emailService) {
        try {
          await emailService.sendVerificationCode(email, user.nombre, code);
          console.log('✅ Verification code resent successfully');
        } catch (error) {
          console.log('⚠️ Email failed but code generated:', error.message);
        }
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Código de verificación reenviado',
        code: code // Solo para debugging
      }));

    } catch (error) {
      console.log('❌ Resend code error:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Error interno del servidor'
      }));
    }
  });
  return;
}


// GET /api/auth/resend-code - Test resend code con GET
if (requestPath.startsWith('/api/auth/resend-code') && method === 'GET') {
  const urlParams = new URLSearchParams(url.parse(req.url).query);
  const email = urlParams.get('email') || 'manuel.paz4cm@gmail.com';
  
  console.log(`🔄 GET Resending code to: ${email}`);
  
  try {
    if (!isDatabaseConnected) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Base de datos no disponible'
      }));
      return;
    }

    // Buscar usuario
    const sql = 'SELECT idUsuario, nombre, correo, emailVerificado FROM usuarios WHERE correo = ?';
    const users = await execute(sql, [email]);
    
    if (users.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Usuario no encontrado'
      }));
      return;
    }

    const user = users[0];
    
    if (user.emailVerificado) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Email ya está verificado'
      }));
      return;
    }

    // Generar nuevo código
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
    
    console.log('📧 Generated new code:', code);
    
    // Actualizar código en BD
    const updateSql = `
      UPDATE usuarios 
      SET codigoVerificacion = ?, codigoExpiracion = ?
      WHERE idUsuario = ?
    `;
    await execute(updateSql, [code, expiration, user.idUsuario]);
    
    // Enviar email
    let emailSent = false;
    let emailError = null;
    
    if (emailService) {
      try {
        await emailService.sendVerificationCode(email, user.nombre, code);
        emailSent = true;
        console.log('✅ Verification code resent successfully');
      } catch (error) {
        emailError = error.message;
        console.log('⚠️ Email failed but code generated:', error.message);
      }
    } else {
      emailError = 'Email service not available';
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'Código de verificación reenviado',
      code: code, // Solo para debugging
      email: email,
      usuario: user.nombre,
      emailSent: emailSent,
      emailError: emailError
    }));

  } catch (error) {
    console.log('❌ GET Resend code error:', error.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }));
  }
  return;
}


// GET /api/auth/reload-email - Recargar email service
    if (requestPath === '/api/auth/reload-email' && method === 'GET') {
  try {
    delete require.cache[require.resolve('./services/emailService')];
    emailService = require('./services/emailService');
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'Email service reloaded',
      available: !!emailService,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }));
  }
  return;
}

// GET /api/auth/quick-register - Registro rápido para testing
if (requestPath.startsWith('/api/auth/quick-register') && method === 'GET') {
  const urlParams = new URLSearchParams(url.parse(req.url).query);
  const nombre = urlParams.get('nombre') || urlParams.get('name') || 'Usuario Test';
  const correo = urlParams.get('email') || urlParams.get('correo') || 'test@example.com';
  const password = urlParams.get('password') || urlParams.get('contraseña') || '123456';
  
  console.log('\n📝 === QUICK REGISTER ===');
  console.log('👤 Name:', nombre);
  console.log('📧 Email:', correo);
  console.log('🔑 Password:', password);

  try {
    // Validar campos básicos
    if (!nombre || !correo || !password) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Nombre, correo y contraseña son requeridos'
      }));
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Formato de email inválido'
      }));
      return;
    }

    if (!isDatabaseConnected) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Base de datos no disponible'
      }));
      return;
    }

    // Verificar si el email ya existe
    const checkEmailSql = 'SELECT idUsuario, emailVerificado FROM usuarios WHERE correo = ?';
    const existingUsers = await execute(checkEmailSql, [correo]);
    
    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      if (existingUser.emailVerificado) {
        res.writeHead(409, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Este email ya está registrado y verificado'
        }));
        return;
      } else {
        // Eliminar usuario no verificado para permitir re-registro
        await execute('DELETE FROM usuarios WHERE idUsuario = ?', [existingUser.idUsuario]);
        console.log('🔄 Usuario no verificado eliminado, permitiendo re-registro');
      }
    }

    // Generar código de verificación
    const verificationCode = generateVerificationCode();
    const codeExpiration = getCodeExpiration();
    
    console.log('📧 Generated code:', verificationCode);

    // Crear usuario
    const insertSql = `
      INSERT INTO usuarios (
        nombre, correo, contraseña, 
        emailVerificado, codigoVerificacion, codigoExpiracion,
        fechaCreacion, fechaActualizacion, activo
      ) VALUES (?, ?, ?, 0, ?, ?, NOW(), NOW(), 1)
    `;
    
    const result = await execute(insertSql, [
      nombre, correo, password, 
      verificationCode, codeExpiration
    ]);
    
    const newUserId = result.insertId;
    console.log('✅ User created with ID:', newUserId);

    // Enviar email de verificación
    let emailSent = false;
    let emailError = null;
    
    if (emailService) {
      try {
        await emailService.sendVerificationCode(correo, nombre, verificationCode);
        emailSent = true;
        console.log('✅ Verification email sent');
      } catch (error) {
        emailError = error.message;
        console.log('❌ Email failed:', error.message);
      }
    } else {
      emailError = 'Email service not available';
    }

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'Usuario creado exitosamente',
      user: {
        id: newUserId,
        nombre: nombre,
        correo: correo,
        emailVerificado: false
      },
      verification: {
        code: verificationCode, // Solo para debugging
        emailSent: emailSent,
        emailError: emailError
      },
      nextStep: `Usa este código para verificar: ${verificationCode}`,
      verifyUrl: `http://192.168.1.13:3000/api/auth/verify-code`
    }));

  } catch (error) {
    console.log('❌ Quick register error:', error.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    }));
  }
  return;
} 



// ===============================
    // ENDPOINTS DE COMUNIDADES - VERSIÓN CORREGIDA COMPLETA
    // ===============================

    // 🆕 GET /api/communities/categories - Obtener categorías disponibles (ANTES de todas las demás rutas)
    if (requestPath === '/api/communities/categories' && method === 'GET') {
      try {
        console.log('📍 GET /api/communities/categories - Obteniendo categorías disponibles');
        
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          categories: COMMUNITY_CATEGORIES,
          message: `${COMMUNITY_CATEGORIES.length} categorías disponibles`
        }));
      } catch (error) {
        console.error('❌ Error obteniendo categorías:', error);
        res.writeHead(500);
        res.end(JSON.stringify({
          success: false,
          error: 'Error interno del servidor',
          categories: []
        }));
      }
      return;
    }

    // GET /api/communities/test/debug - Test de conexión específico
if (requestPath === '/api/communities/test/debug' && method === 'GET') {
  try {
    const userId = getAuthenticatedUser(req);
    console.log('🔍 Ruta de prueba de comunidades - Usuario:', userId);
    
    const dbStatus = isDatabaseConnected ? 'Conectada' : 'Desconectada';
    
    let communitiesCount = 0;
    let error = null;
    
    try {
      if (isDatabaseConnected) {
        const communities = await communityQueries.getAllCommunities(userId);
        communitiesCount = communities.length;
      }
    } catch (err) {
      error = err.message;
    }
    
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      debug: {
        timestamp: new Date().toISOString(),
        database: dbStatus,
        communitiesCount: communitiesCount,
        authenticatedUserId: userId,
        error: error
      }
    }));
    
  } catch (error) {
    console.error('❌ Error en ruta de debug:', error);
    res.writeHead(500);
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }));
  }
  return;
}

    // 🆕 GET /api/communities/:id/check-expulsion - Verificar si usuario está expulsado
    if (requestPath.match(/^\/api\/communities\/(\d+)\/check-expulsion$/) && method === 'GET') {
      try {
        const userId = getAuthenticatedUser(req);
        if (!userId) {
          res.writeHead(401);
          res.end(JSON.stringify({
            success: false,
            error: 'Usuario no autenticado'
          }));
          return;
        }

        const communityId = requestPath.match(/^\/api\/communities\/(\d+)\/check-expulsion$/)[1];
        console.log(`🔍 Verificando expulsión - Usuario: ${userId}, Comunidad: ${communityId}`);
        
        const expulsionInfo = await communityQueries.checkUserExpulsion(communityId, userId);
        
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          data: expulsionInfo
        }));
        
      } catch (error) {
        console.error('❌ Error verificando expulsión:', error);
        res.writeHead(500);
        res.end(JSON.stringify({
          success: false,
          error: error.message
        }));
      }
      return;
    }

    // GET /api/communities/user - Obtener comunidades del usuario (ANTES de :id)
    if (requestPath === '/api/communities/user' && method === 'GET') {
      try {
        console.log('📋 Obteniendo comunidades del usuario...');
        
        if (!isDatabaseConnected) {
          const fallbackData = [
            {
              id: 2,
              name: 'Medio Ambiente',
              description: 'Cuidemos nuestro planeta juntos',
              memberCount: 567,
              isJoined: true,
              isAdmin: false,
              isCreator: false,
              imagen: null,
              creadorNombre: 'Usuario Demo',
              roleBadge: 'Miembro'
            }
          ];
          
          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            communities: fallbackData, // ✅ CORREGIDO
            message: 'Datos de respaldo (sin conexión)'
          }));
          return;
        }
        
        // Obtener el ID del usuario autenticado desde los headers
        const userId = req.headers['x-user-id'];
        if (!userId) {
          res.writeHead(401);
          res.end(JSON.stringify({
            success: false,
            error: 'Usuario no autenticado'
          }));
          return;
        }
        
        const numUserId = parseInt(userId);
        const communities = await communityQueries.getUserCommunities(numUserId);
        console.log(`✅ Usuario tiene ${communities.length} comunidades`);
        
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          communities: communities, // ✅ CORREGIDO
          message: 'Comunidades del usuario obtenidas exitosamente'
        }));
      } catch (error) {
        console.error('❌ Error obteniendo comunidades del usuario:', error);
        res.writeHead(500);
        res.end(JSON.stringify({
          success: false,
          error: 'Error interno del servidor',
          details: error.message
        }));
      }
      return;
    }

    // POST /api/communities/action - Unirse/salir de comunidad
    if (requestPath === '/api/communities/action' && method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const { action, communityId } = JSON.parse(body || '{}');
          
          console.log('📍 POST /api/communities/action - Acción de membresía');
          console.log('📝 Datos recibidos:', { action, communityId });
          
          if (!action || !communityId) {
            res.writeHead(400);
            res.end(JSON.stringify({
              success: false,
              error: 'Acción y ID de comunidad son obligatorios'
            }));
            return;
          }
          
          if (!['join', 'leave'].includes(action)) {
            res.writeHead(400);
            res.end(JSON.stringify({
              success: false,
              error: 'Acción debe ser "join" o "leave"'
            }));
            return;
          }
          
          if (!isDatabaseConnected) {
            res.writeHead(200);
            res.end(JSON.stringify({
              success: true,
              message: action === 'join' ? 'Te has unido a la comunidad (offline)' : 'Has salido de la comunidad (offline)',
              isCreator: false,
              autoJoined: action === 'join'
            }));
            return;
          }
          
          // 🔥 OBTENER USUARIO AUTENTICADO
          const userId = getAuthenticatedUser(req);
          console.log(`👤 Usuario autenticado: ${userId}`);
          
          // 🔥 CONVERTIR A NÚMERO
          const numCommunityId = parseInt(communityId);
          console.log(`🔄 ${action} comunidad ${numCommunityId} para usuario ${userId}`);
          
          const result = await communityQueries.toggleMembership(action, numCommunityId, userId);
          console.log('✅ Acción completada exitosamente');
          
          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            ...result
          }));
        } catch (error) {
          console.error('❌ Error en toggleMembership:', error);
          res.writeHead(500);
          res.end(JSON.stringify({
            success: false,
            error: error.message
          }));
        }
      });
      return;
    }

// ===============================
// ENDPOINTS DE COMUNIDADES - VERSIÓN COMPLETA CORREGIDA CON CARGA DE MENSAJES Y DEBUG
// ===============================

// 🗑️ DELETE /api/admin/users/:userId - Eliminar usuario (solo admin)
    if (requestPath.match(/^\/api\/admin\/users\/\d+$/) && method === 'DELETE') {
  try {
    console.log('🗑️ === ELIMINANDO USUARIO ===');
    
    // Verificar que sea un admin
    const adminUserId = getAuthenticatedUser(req);
    console.log(`👤 Admin ID: ${adminUserId}`);
    
    // Obtener ID del usuario a eliminar
    const pathParts = requestPath.split('/');
    const targetUserId = parseInt(pathParts[4]);
    console.log(`🎯 Usuario a eliminar: ${targetUserId}`);
    
    if (!isDatabaseConnected) {
      res.writeHead(503);
      res.end(JSON.stringify({
        success: false,
        error: 'Base de datos no disponible'
      }));
      return;
    }
    
    // 1. Obtener información del usuario antes de eliminarlo
    const userInfo = await execute(
      'SELECT idUsuario, nombre, correo FROM usuarios WHERE idUsuario = ?',
      [targetUserId]
    );
    
    if (userInfo.length === 0) {
      res.writeHead(404);
      res.end(JSON.stringify({
        success: false,
        error: 'Usuario no encontrado'
      }));
      return;
    }
    
    const user = userInfo[0];
    console.log(`📋 Usuario encontrado: ${user.nombre} (${user.correo})`);
    
    // 2. Obtener comunidades donde el usuario es miembro
    const userCommunities = await execute(`
      SELECT DISTINCT c.idComunidad, c.titulo, c.idUsuario as creadorId
      FROM usuario_comunidad ucu
      JOIN comunidad c ON ucu.idComunidad = c.idComunidad
      WHERE ucu.idUsuario = ?
    `, [targetUserId]);
    
    console.log(`🏘️ Usuario es miembro de ${userCommunities.length} comunidades`);
    
    // 3. Obtener comunidades creadas por el usuario
    const createdCommunities = await execute(`
      SELECT idComunidad, titulo
      FROM comunidad
      WHERE idUsuario = ?
    `, [targetUserId]);
    
    console.log(`👑 Usuario creó ${createdCommunities.length} comunidades`);
    
    // 4. Eliminar membresías del usuario en todas las comunidades
    if (userCommunities.length > 0) {
      const deleteMemberships = await execute(`
        DELETE FROM usuario_comunidad 
        WHERE idUsuario = ?
      `, [targetUserId]);
      
      console.log(`✅ Eliminadas ${deleteMemberships.affectedRows} membresías`);
    }
    
    // 5. Eliminar comunidades creadas por el usuario (esto activará CASCADE DELETE)
    if (createdCommunities.length > 0) {
      const deleteCommunities = await execute(`
        DELETE FROM comunidad 
        WHERE idUsuario = ?
      `, [targetUserId]);
      
      console.log(`✅ Eliminadas ${deleteCommunities.affectedRows} comunidades creadas`);
    }
    
    // 6. Eliminar reportes del usuario
    const deleteReports = await execute(`
      DELETE FROM reportes 
      WHERE idUsuario = ?
    `, [targetUserId]);
    
    console.log(`✅ Eliminados ${deleteReports.affectedRows} reportes`);
    
    // 7. Eliminar comentarios del usuario
    const deleteComments = await execute(`
      DELETE FROM comentarios 
      WHERE idUsuario = ?
    `, [targetUserId]);
    
    console.log(`✅ Eliminados ${deleteComments.affectedRows} comentarios`);
    
    // 8. Finalmente, eliminar el usuario
    const deleteUser = await execute(`
      DELETE FROM usuarios 
      WHERE idUsuario = ?
    `, [targetUserId]);
    
    if (deleteUser.affectedRows === 0) {
      res.writeHead(500);
      res.end(JSON.stringify({
        success: false,
        error: 'No se pudo eliminar el usuario'
      }));
      return;
    }
    
    console.log(`✅ Usuario ${user.nombre} eliminado exitosamente`);
    

    
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      message: `Usuario ${user.nombre} eliminado exitosamente`,
      details: {
        membershipsRemoved: userCommunities.length,
        communitiesDeleted: createdCommunities.length,
        reportsDeleted: deleteReports.affectedRows,
        commentsDeleted: deleteComments.affectedRows,
        notificationsSent: createdCommunities.length > 0 ? 'Notificaciones enviadas a miembros de comunidades eliminadas' : 'No se enviaron notificaciones de comunidades eliminadas'
      }
    }));
    
  } catch (error) {
    console.error('❌ Error eliminando usuario:', error);
    res.writeHead(500);
    res.end(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    }));
  }
  return;
}



// 🔔 GET /api/notifications/unread - Obtener notificaciones no leídas

// 🔥 ENDPOINT TEMPORAL DE DEBUG - Agregar en server.js ANTES de otros endpoints

// GET /api/debug/messages/:id - Debug completo de mensajes
    if (requestPath.match(/\/api\/debug\/messages\/\d+$/) && method === 'GET') {
  try {
    const pathParts = requestPath.split('/');
    const communityId = parseInt(pathParts[4]);
    
    console.log('\n🔍 === DEBUG MESSAGES ENDPOINT ===');
    console.log('🏘️ Community ID:', communityId);
    
    if (!isDatabaseConnected) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Base de datos no disponible'
      }));
      return;
    }
    
    const debugResults = {
      communityId: communityId,
      timestamp: new Date().toISOString(),
      tests: {}
    };
    
    // Test 1: Verificar pool de conexiones
    try {
      const basicMessages = await execute('SELECT COUNT(*) as total FROM comentarios');
      debugResults.tests.basicQuery = { 
        success: true, 
        totalMessages: basicMessages[0].total 
      };
      console.log('✅ Test 1 - Basic query successful:', basicMessages[0].total);
    } catch (error) {
      debugResults.tests.basicQuery = { error: error.message };
      console.log('❌ Test 1 failed:', error.message);
    }
    
    // Test 2: Query con un parámetro
    try {
      const communityMessages = await execute(
        'SELECT COUNT(*) as total FROM comentarios WHERE idComunidad = ?', 
        [communityId]
      );
      debugResults.tests.singleParamQuery = { 
        success: true, 
        messagesInCommunity: communityMessages[0].total 
      };
      console.log('✅ Test 2 - Single param query successful:', communityMessages[0].total);
    } catch (error) {
      debugResults.tests.singleParamQuery = { error: error.message };
      console.log('❌ Test 2 failed:', error.message);
    }
    
    // Test 3: Query con múltiples parámetros SIMPLE
    try {
      const userId = 1; // Usuario por defecto para testing
      const multiParamMessages = await execute(
        'SELECT idComentario, comentario, idUsuario FROM comentarios WHERE idComunidad = ? LIMIT ?', 
        [communityId, 5]
      );
      debugResults.tests.multiParamQuerySimple = { 
        success: true, 
        sampleMessages: multiParamMessages.length,
        messages: multiParamMessages
      };
      console.log('✅ Test 3 - Multi param simple query successful:', multiParamMessages.length);
    } catch (error) {
      debugResults.tests.multiParamQuerySimple = { error: error.message };
      console.log('❌ Test 3 failed:', error.message);
    }
    
    // Test 4: Query con CASE WHEN (la problemática)
    try {
      const userId = 1;
      
      const caseQuery = `
        SELECT 
          idComentario as id,
          comentario as text,
          idUsuario as userId,
          CASE WHEN idUsuario = ? THEN 1 ELSE 0 END as isOwn
        FROM comentarios 
        WHERE idComunidad = ? 
        LIMIT 3
      `;
      
      const caseParams = [userId, communityId];
      
      console.log('🔄 Testing CASE WHEN query...');
      console.log('📋 Query:', caseQuery);
      console.log('📋 Params:', caseParams);
      
      const caseResult = await execute(caseQuery, caseParams);
      
      debugResults.tests.caseWhenQuery = { 
        success: true, 
        messages: caseResult.length,
        sampleData: caseResult
      };
      console.log('✅ Test 4 - CASE WHEN query successful!:', caseResult.length);
    } catch (error) {
      debugResults.tests.caseWhenQuery = { 
        error: error.message,
        code: error.code,
        sqlState: error.sqlState
      };
      console.log('❌ Test 4 failed:', error.message);
    }
    
    // Test 5: La query problemática original SIMPLIFICADA
    try {
      const userId = 1;
      const limit = 5;
      const offset = 0;
      
      const originalQuery = `
        SELECT 
          c.idComentario as id,
          c.comentario as text,
          c.fechaComentario as timestamp,
          c.idUsuario as userId,
          CASE WHEN c.idUsuario = ? THEN 1 ELSE 0 END as isOwn
        FROM comentarios c
        WHERE c.idComunidad = ?
        ORDER BY c.fechaComentario ASC
        LIMIT ? OFFSET ?
      `;
      
      const originalParams = [userId, communityId, limit, offset];
      
      console.log('🔄 Testing original problematic query...');
      console.log('📋 Query:', originalQuery.substring(0, 200) + '...');
      console.log('📋 Params:', originalParams);
      console.log('📋 Params types:', originalParams.map(p => typeof p));
      
      const originalResult = await execute(originalQuery, originalParams);
      
      debugResults.tests.originalQuery = { 
        success: true, 
        messages: originalResult.length,
        sampleData: originalResult.slice(0, 2) // Solo primeros 2 para no saturar
      };
      console.log('✅ Test 5 - Original query successful!:', originalResult.length);
    } catch (error) {
      debugResults.tests.originalQuery = { 
        error: error.message,
        code: error.code,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      };
      console.log('❌ Test 5 failed:', error.message);
    }
    
    // Test 6: Información de la tabla
    try {
      const tableInfo = await execute('DESCRIBE comentarios');
      debugResults.tests.tableStructure = { 
        success: true, 
        columns: tableInfo 
      };
      console.log('✅ Test 6 - Table structure obtained');
    } catch (error) {
      debugResults.tests.tableStructure = { error: error.message };
      console.log('❌ Test 6 failed:', error.message);
    }
    
    // Test 7: Mensajes de la comunidad específica
    try {
      const specificMessages = await execute(
        'SELECT * FROM comentarios WHERE idComunidad = ? ORDER BY fechaComentario DESC LIMIT 3',
        [communityId]
      );
      debugResults.tests.specificCommunityMessages = { 
        success: true, 
        messages: specificMessages 
      };
      console.log('✅ Test 7 - Specific community messages:', specificMessages.length);
    } catch (error) {
      debugResults.tests.specificCommunityMessages = { error: error.message };
      console.log('❌ Test 7 failed:', error.message);
    }
    
    console.log('=== DEBUG COMPLETED ===\n');
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      debug: debugResults,
      summary: {
        testsRun: Object.keys(debugResults.tests).length,
        testsSuccessful: Object.values(debugResults.tests).filter(t => t.success).length,
        testsFailed: Object.values(debugResults.tests).filter(t => t.error).length
      }
    }));
    
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: 'Error en debug endpoint',
      details: error.message
    }));
  }
  return;
}

// GET /api/debug/simple-messages/:id - Versión simplificada
    if (requestPath.match(/\/api\/debug\/simple-messages\/\d+$/) && method === 'GET') {
  try {
    const pathParts = requestPath.split('/');
    const communityId = parseInt(pathParts[4]);
    
    console.log('\n🧪 === SIMPLE DEBUG MESSAGES ===');
    console.log('🏘️ Community ID:', communityId);
    
    // Query muy simple sin JOINs ni CASE
    const simpleQuery = 'SELECT idComentario, comentario, idUsuario, fechaComentario FROM comentarios WHERE idComunidad = ? ORDER BY fechaComentario ASC LIMIT 10';
    const simpleParams = [communityId];
    
    console.log('📋 Simple Query:', simpleQuery);
    console.log('📋 Simple Params:', simpleParams);
    
    const messages = await execute(simpleQuery, simpleParams);
    
    console.log('✅ Simple query successful:', messages.length, 'messages');
    
    const processedMessages = messages.map((msg, index) => ({
      id: msg.idComentario,
      text: msg.comentario,
      userId: msg.idUsuario,
      timestamp: msg.fechaComentario,
      userName: `Usuario ${msg.idUsuario}`,
      isOwn: false, // Por defecto
      userRole: 'Miembro',
      formattedTime: new Date(msg.fechaComentario).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }));
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      messages: processedMessages,
      totalMessages: messages.length,
      communityId: communityId,
      message: 'Mensajes obtenidos con query simple'
    }));
    
  } catch (error) {
    console.error('❌ Simple debug error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: error.message,
      details: error.code
    }));
  }
  return;
}

// GET /api/communities/:id/messages - VERSIÓN ULTRA SIMPLE (REEMPLAZADA)
    if (requestPath.match(/\/api\/communities\/\d+\/messages$/) && method === 'GET') {
  try {
    console.log('\n📬 === GET COMMUNITY MESSAGES (ULTRA SIMPLE) ===');
    
    // 🔥 PARSING CORRECTO DE PARÁMETROS
    const pathParts = requestPath.split('/');
    const communityId = parseInt(pathParts[3]);
    
    console.log(`📬 Obteniendo mensajes de comunidad ${communityId}`);
    
    // 🔥 OBTENER USUARIO AUTENTICADO
    const userId = getAuthenticatedUser(req);
    console.log(`👤 Usuario autenticado: ${userId}`);
    
    if (!isDatabaseConnected) {
      console.log('⚠️ Database not connected - returning fallback messages');
      
      const fallbackMessages = [
        {
          id: 1,
          text: 'Mensaje de ejemplo (sin conexión a BD)',
          userName: 'Usuario Demo',
          userId: 1,
          timestamp: new Date().toISOString(),
          isOwn: userId === 1,
          userRole: 'Miembro',
          isCreatorMessage: false,
          imagenes: [],
          formattedTime: new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          })
        }
      ];
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        messages: fallbackMessages,
        totalMessages: fallbackMessages.length,
        message: 'Mensajes de respaldo (sin conexión)'
      }));
      return;
    }
    
    // 🔥 PASO 1: VERIFICAR QUE LA COMUNIDAD EXISTE (SIN PARÁMETROS)
    console.log('🔄 Paso 1: Verificando comunidad...');
    let communityExists = false;
    try {
      const allCommunities = await execute('SELECT idComunidad FROM comunidad');
      communityExists = allCommunities.some(c => c.idComunidad === communityId);
      console.log(`✅ Comunidad ${communityId} ${communityExists ? 'existe' : 'no existe'}`);
    } catch (error) {
      console.error('❌ Error verificando comunidad:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Error verificando comunidad',
        messages: []
      }));
      return;
    }
    
    if (!communityExists) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Comunidad no encontrada',
        messages: []
      }));
      return;
    }
    
    // 🔥 PASO 2: OBTENER TODOS LOS MENSAJES Y FILTRAR MANUALMENTE
    console.log('🔄 Paso 2: Obteniendo todos los mensajes...');
    let allMessages = [];
    try {
      allMessages = await execute('SELECT * FROM comentarios ORDER BY fechaComentario ASC');
      console.log(`✅ Total de mensajes en BD: ${allMessages.length}`);
    } catch (error) {
      console.error('❌ Error obteniendo mensajes:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Error obteniendo mensajes: ' + error.message,
        messages: []
      }));
      return;
    }
    
    // 🔥 PASO 3: FILTRAR MENSAJES DE LA COMUNIDAD EN JAVASCRIPT
    console.log('🔄 Paso 3: Filtrando mensajes de la comunidad...');
    const communityMessages = allMessages.filter(msg => msg.idComunidad === communityId);
    console.log(`✅ Mensajes de comunidad ${communityId}: ${communityMessages.length}`);
    
    // 🔥 PASO 4: PROCESAR MENSAJES DE FORMA SIMPLE
    console.log('🔄 Paso 4: Procesando mensajes...');
    const processedMessages = [];
    
    for (let i = 0; i < communityMessages.length; i++) {
      const msg = communityMessages[i];
      
      console.log(`📝 Procesando mensaje ${i + 1}/${communityMessages.length}:`, {
        id: msg.idComentario,
        text: msg.comentario ? msg.comentario.substring(0, 30) + '...' : 'Sin texto',
        userId: msg.idUsuario,
        timestamp: msg.fechaComentario
      });
      
      // Formatear tiempo de forma segura
      let formattedTime = '00:00';
      try {
        if (msg.fechaComentario) {
          const messageDate = new Date(msg.fechaComentario);
          if (!isNaN(messageDate.getTime())) {
            formattedTime = messageDate.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit'
            });
          }
        }
      } catch (timeError) {
        console.warn(`⚠️ Error formateando tiempo:`, timeError.message);
      }
      
      // Determinar nombre de usuario y foto de perfil
      let userName = `Usuario ${msg.idUsuario}`;
      let userPhoto = null;
      try {
        // Obtener información completa del usuario
        const userInfo = await execute('SELECT nombre, fotoPerfil FROM usuarios WHERE idUsuario = ?', [msg.idUsuario]);
        if (userInfo && userInfo.length > 0) {
          userName = userInfo[0].nombre || userName;
          userPhoto = userInfo[0].fotoPerfil || null;
        }
      } catch (nameError) {
        console.warn(`⚠️ Error obteniendo información del usuario:`, nameError.message);
      }
      
      // Crear mensaje procesado
      const processedMessage = {
        id: msg.idComentario,
        text: msg.comentario || '',
        userName: userName,
        userPhoto: userPhoto,
        userId: msg.idUsuario,
        timestamp: msg.fechaComentario || new Date().toISOString(),
        isOwn: msg.idUsuario === userId,
        userRole: 'Miembro', // Por defecto
        isCreatorMessage: false, // Por defecto  
        imagenes: [],
        formattedTime: formattedTime
      };
      
      processedMessages.push(processedMessage);
    }
    
    console.log(`✅ ${processedMessages.length} mensajes procesados exitosamente`);
    
    // 🔥 RESPUESTA EXITOSA
    const response = {
      success: true,
      messages: processedMessages,
      totalMessages: processedMessages.length,
      userId: userId,
      communityId: communityId,
      message: 'Mensajes obtenidos exitosamente (método ultra-simple)'
    };
    
    console.log(`✅ Enviando respuesta con ${processedMessages.length} mensajes para usuario ${userId}`);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
    
  } catch (error) {
    console.error('❌ Error general obteniendo mensajes:', error);
    console.error('❌ Stack trace:', error && error.stack ? error.stack : 'No disponible');
    
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + (error && error.message ? error.message : 'Error desconocido'),
      details: error && error.message ? error.message : 'Error desconocido',
      messages: []
    }));
  }
  return;
}

// POST /api/communities/:id/messages - Enviar mensaje (CORREGIDO)
    if (requestPath.match(/\/api\/communities\/\d+\/messages$/) && method === 'POST') {
  console.log('\n📤 === POST COMMUNITY MESSAGE (CORREGIDO) ===');
  
  // 🔥 PARSING CORRECTO DE PARÁMETROS
  const pathParts = requestPath.split('/');
  const communityId = parseInt(pathParts[3]);
  
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      console.log(`📤 Enviando mensaje a comunidad ${communityId}`);
      
      // 🔥 OBTENER USUARIO AUTENTICADO
      const userId = getAuthenticatedUser(req);
      console.log(`👤 Usuario enviando mensaje: ${userId}`);
      
      const data = JSON.parse(body || '{}');
      const messageText = data.text || '';
      
      console.log('📝 Datos recibidos:', { 
        text: messageText.substring(0, 50) + '...',
        length: messageText.length 
      });
      
      if (!messageText || !messageText.trim()) {
        console.log('❌ Mensaje vacío recibido');
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'El texto del mensaje es obligatorio'
        }));
        return;
      }
      
      if (!isDatabaseConnected) {
        console.log('⚠️ Database not connected - simulating message send');
        
        const fallbackMessage = {
          id: Date.now(),
          text: messageText.trim(),
          userName: `Usuario ${userId}`,
          userId: userId,
          timestamp: new Date().toISOString(),
          isOwn: true,
          userRole: 'Miembro',
          isCreatorMessage: false,
          imagenes: [],
          formattedTime: new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          })
        };
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: fallbackMessage,
          userId: userId,
          messageText: 'Mensaje enviado (offline)'
        }));
        return;
      }
      
      // 🔥 VERIFICAR QUE LA COMUNIDAD EXISTE Y SU ESTADO
      const communityCheck = await execute(
        'SELECT idComunidad, titulo, idUsuario as creadorId, estado FROM comunidad WHERE idComunidad = ?',
        [communityId]
      );
      
      if (communityCheck.length === 0) {
        console.log(`❌ Comunidad ${communityId} no encontrada`);
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Comunidad no encontrada'
        }));
        return;
      }
      
      const community = communityCheck[0];
      console.log(`✅ Comunidad encontrada: ${community.titulo} (Estado: ${community.estado || 'activa'})`);
      
      // 🔒 VERIFICAR ESTADO DE LA COMUNIDAD
      if (community.estado === 'suspendida') {
        console.log(`🚫 Comunidad ${community.titulo} está suspendida. No se pueden enviar mensajes.`);
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Esta comunidad está suspendida. No se pueden enviar mensajes hasta que sea reactivada.'
        }));
        return;
      }
      
      // Verificar que la comunidad esté activa o tenga estado nulo (por compatibilidad)
      if (community.estado && community.estado !== 'activa') {
        console.log(`🚫 Comunidad ${community.titulo} tiene estado inválido: ${community.estado}`);
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Esta comunidad no está disponible para mensajes en este momento.'
        }));
        return;
      }
      
      // 🔥 ASEGURAR QUE EL USUARIO EXISTE
      await communityQueries.ensureUserExists(userId);
      const nombreUsuario = await communityQueries.getUserName(userId);
      console.log(`👤 Usuario verificado: ${nombreUsuario} (ID: ${userId})`);
      
      // 🔥 INSERTAR MENSAJE EN LA BASE DE DATOS (SIMPLIFICADO)
      console.log('💾 Insertando mensaje en base de datos...');
      const insertResult = await execute(
        'INSERT INTO comentarios (idComunidad, idUsuario, comentario, fechaComentario) VALUES (?, ?, ?, NOW())',
        [communityId, userId, messageText.trim()]
      );
      
      const messageId = insertResult.insertId;
      console.log(`✅ Mensaje insertado con ID: ${messageId}`);
      
      // 🔥 OBTENER EL MENSAJE RECIÉN CREADO (QUERY SIMPLE)
      const messageQuery = `
        SELECT 
          idComentario as id,
          comentario as text,
          fechaComentario as timestamp,
          idUsuario as userId
        FROM comentarios
        WHERE idComentario = ?
      `;
      
      const result = await execute(messageQuery, [messageId]);
      
      if (result.length === 0) {
        console.log(`❌ No se pudo obtener el mensaje creado con ID ${messageId}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'No se pudo obtener el mensaje creado'
        }));
        return;
      }
      
      const createdMessage = result[0];
      
      // 🔥 FORMATEAR TIEMPO
      let formattedTime = '00:00';
      try {
        const messageDate = new Date(createdMessage.timestamp);
        formattedTime = messageDate.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        console.warn('⚠️ Error formateando tiempo:', error);
        formattedTime = new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      // 🔥 CONSTRUIR RESPUESTA FINAL
      const finalMessage = {
        id: createdMessage.id,
        text: createdMessage.text,
        userName: nombreUsuario,
        userId: createdMessage.userId,
        timestamp: createdMessage.timestamp,
        userRole: createdMessage.userId === community.creadorId ? 'Creador' : 'Miembro',
        isCreatorMessage: createdMessage.userId === community.creadorId,
        isOwn: true, // Siempre true para el mensaje que acabamos de enviar
        imagenes: [],
        formattedTime: formattedTime
      };
      
      console.log(`✅ Mensaje enviado exitosamente:`, {
        id: finalMessage.id,
        text: finalMessage.text.substring(0, 50) + '...',
        userName: finalMessage.userName,
        userRole: finalMessage.userRole,
        isCreatorMessage: finalMessage.isCreatorMessage
      });
      
      // 🔥 RESPUESTA EXITOSA
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: finalMessage,
        userId: userId,
        communityId: communityId,
        messageText: 'Mensaje enviado exitosamente'
      }));
      
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: error.message || 'Error interno del servidor',
        details: error && error.message ? error.message : 'Error desconocido'
      }));
    }
  });
  return;
}

// GET /api/communities/:id - Obtener detalles de comunidad (DESPUÉS de rutas específicas)
if (requestPath.startsWith('/api/communities/') && requestPath.split('/').length === 4 && method === 'GET') {
  try {
    const pathParts = requestPath.split('/');
    const communityId = parseInt(pathParts[3]); // Convertir a número
    
    // ✅ VERIFICAR QUE NO SEA UNA RUTA ESPECÍFICA
    const lastSegment = pathParts[3];
    if (lastSegment === 'user' || lastSegment === 'test' || lastSegment === 'action' || lastSegment === 'debug' || lastSegment === 'categories') {
      // Esta no es una ruta de ID, continuar
      res.writeHead(404);
      res.end(JSON.stringify({
        success: false,
        error: 'Ruta no encontrada',
        path: requestPath
      }));
      return;
    }

    if (!communityId || isNaN(communityId)) {
      res.writeHead(400);
      res.end(JSON.stringify({
        success: false,
        error: 'ID de comunidad inválido'
      }));
      return;
    }
    
    console.log(`🔍 Obteniendo detalles de comunidad ${communityId}`);
    
    const userId = getAuthenticatedUser(req);
    
    if (!isDatabaseConnected) {
      const mockCommunity = {
        id: communityId,
        name: 'Comunidad Local',
        description: 'Descripción de respaldo',
        memberCount: 100,
        isJoined: true,
        isAdmin: false,
        isCreator: false,
        imagen: null,
        creadorNombre: 'Usuario Local'
      };
      
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        community: mockCommunity,
        message: 'Datos de respaldo (sin conexión)'
      }));
      return;
    }
    
    const community = await communityQueries.getCommunityDetails(communityId, userId);
    
    if (community) {
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        community: community,
        message: 'Detalles de comunidad obtenidos exitosamente'
      }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({
        success: false,
        error: 'Comunidad no encontrada'
      }));
    }
  } catch (error) {
    console.error('❌ Error obteniendo detalles:', error);
    res.writeHead(500);
    res.end(JSON.stringify({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }));
  }
  return;
}

// 🆕 DELETE /api/communities/:id - Eliminar comunidad (solo para creadores)
if (requestPath.startsWith('/api/communities/') && requestPath.split('/').length === 4 && method === 'DELETE') {
  try {
    const pathParts = requestPath.split('/');
    const communityId = parseInt(pathParts[3]);
    
    // ✅ VERIFICAR QUE NO SEA UNA RUTA ESPECÍFICA
    const lastSegment = pathParts[3];
    if (lastSegment === 'user' || lastSegment === 'test' || lastSegment === 'action' || lastSegment === 'debug' || lastSegment === 'categories') {
      res.writeHead(404);
      res.end(JSON.stringify({
        success: false,
        error: 'Ruta no encontrada',
        path: requestPath
      }));
      return;
    }

    if (!communityId || isNaN(communityId)) {
      res.writeHead(400);
      res.end(JSON.stringify({
        success: false,
        error: 'ID de comunidad inválido'
      }));
      return;
    }
    
    console.log(`🗑️ Intentando eliminar comunidad ${communityId}`);
    
    const userId = getAuthenticatedUser(req);
    
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({
        success: false,
        error: 'Usuario no autenticado'
      }));
      return;
    }
    
    if (!isDatabaseConnected) {
      res.writeHead(503);
      res.end(JSON.stringify({
        success: false,
        error: 'Base de datos no disponible'
      }));
      return;
    }
    
    // Verificar que el usuario sea el creador de la comunidad
    const communityDetails = await communityQueries.getCommunityDetails(communityId, userId);
    
    if (!communityDetails) {
      res.writeHead(404);
      res.end(JSON.stringify({
        success: false,
        error: 'Comunidad no encontrada'
      }));
      return;
    }
    
    if (!communityDetails.isCreator) {
      res.writeHead(403);
      res.end(JSON.stringify({
        success: false,
        error: 'Solo el creador puede eliminar la comunidad'
      }));
      return;
    }
    
    // Eliminar la comunidad
    const deleteResult = await communityQueries.deleteCommunity(communityId);
    
    if (deleteResult) {
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        message: 'Comunidad eliminada exitosamente',
        communityId: communityId
      }));
    } else {
      res.writeHead(500);
      res.end(JSON.stringify({
        success: false,
        error: 'Error al eliminar la comunidad'
      }));
    }
  } catch (error) {
    console.error('❌ Error eliminando comunidad:', error);
    res.writeHead(500);
    res.end(JSON.stringify({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }));
  }
  return;
}

// GET /api/communities/:id/members - Obtener miembros de una comunidad
    if (requestPath.match(/\/api\/communities\/\d+\/members$/) && method === 'GET') {
  try {
    const pathParts = requestPath.split('/');
    const communityId = parseInt(pathParts[3]);
    
    if (!communityId || isNaN(communityId)) {
      res.writeHead(400);
      res.end(JSON.stringify({
        success: false,
        error: 'ID de comunidad inválido'
      }));
      return;
    }
    
    console.log(`🔍 Obteniendo miembros de comunidad ${communityId}`);
    
    const userId = getAuthenticatedUser(req);
    
    if (!isDatabaseConnected) {
      const mockMembers = [
        {
          id: 1,
          name: 'Usuario Local',
          role: 'Creador',
          status: 'En línea',
          isAdmin: true,
          isCreator: true,
          joinDate: new Date().toISOString()
        }
      ];
      
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        members: mockMembers,
        totalCount: mockMembers.length,
        message: 'Datos de respaldo (sin conexión)'
      }));
      return;
    }
    
    // Obtener información del creador
    const creatorQuery = `
      SELECT 
        c.idUsuario as id,
        COALESCE(u.nombre, CONCAT('Usuario ', c.idUsuario)) as name,
        u.fotoPerfil as photo,
        'Creador' as role,
        'En línea' as status,
        1 as isAdmin,
        1 as isCreator,
        c.fechaCreacion as joinDate
      FROM comunidad c
      LEFT JOIN usuarios u ON c.idUsuario = u.idUsuario
      WHERE c.idComunidad = ?
    `;
    
    const creator = await execute(creatorQuery, [communityId]);
    
    // Obtener otros miembros
    const membersQuery = `
      SELECT 
        uc.idUsuario as id,
        COALESCE(u.nombre, CONCAT('Usuario ', uc.idUsuario)) as name,
        u.fotoPerfil as photo,
        CASE 
          WHEN uc.rolEnComunidad = 'administrador' THEN 'Administrador'
          ELSE 'Miembro'
        END as role,
        'Última vez hace 2h' as status,
        CASE 
          WHEN uc.rolEnComunidad = 'administrador' THEN 1
          ELSE 0
        END as isAdmin,
        0 as isCreator,
        uc.fechaUnion as joinDate
      FROM usuario_comunidad uc
      LEFT JOIN usuarios u ON uc.idUsuario = u.idUsuario
      WHERE uc.idComunidad = ? AND uc.idUsuario != ?
      ORDER BY uc.fechaUnion ASC
    `;
    
    const members = await execute(membersQuery, [communityId, creator[0]?.id || 0]);
    
    // Combinar creador y miembros
    const allMembers = [...creator, ...members];
    
    console.log(`✅ ${allMembers.length} miembros obtenidos para comunidad ${communityId}`);
    
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      members: allMembers,
      totalCount: allMembers.length,
      message: 'Miembros de comunidad obtenidos exitosamente'
    }));
    
  } catch (error) {
    console.error('❌ Error obteniendo miembros:', error);
    res.writeHead(500);
    res.end(JSON.stringify({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }));
  }
  return;
}

// 🆕 POST /api/communities/:id/expel - Expulsar usuario de comunidad (solo para creadores)
    if (requestPath.match(/\/api\/communities\/\d+\/expel$/) && method === 'POST') {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      const pathParts = requestPath.split('/');
      const communityId = parseInt(pathParts[3]);
      
      if (!communityId || isNaN(communityId)) {
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: 'ID de comunidad inválido'
        }));
        return;
      }
      
      const { userIdToExpel } = JSON.parse(body || '{}');
      
      if (!userIdToExpel || isNaN(userIdToExpel)) {
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: 'ID de usuario a expulsar inválido'
        }));
        return;
      }
      
      console.log(`🚫 Intentando expulsar usuario ${userIdToExpel} de comunidad ${communityId}`);
      
      const currentUserId = getAuthenticatedUser(req);
      
      if (!currentUserId) {
        res.writeHead(401);
        res.end(JSON.stringify({
          success: false,
          error: 'Usuario no autenticado'
        }));
        return;
      }
      
      if (!isDatabaseConnected) {
        res.writeHead(503);
        res.end(JSON.stringify({
          success: false,
          error: 'Base de datos no disponible'
        }));
        return;
      }
      
      // Verificar que el usuario actual sea el creador de la comunidad
      const communityDetails = await communityQueries.getCommunityDetails(communityId, currentUserId);
      
      if (!communityDetails) {
        res.writeHead(404);
        res.end(JSON.stringify({
          success: false,
          error: 'Comunidad no encontrada'
        }));
        return;
      }
      
      if (!communityDetails.isCreator) {
        res.writeHead(403);
        res.end(JSON.stringify({
          success: false,
          error: 'Solo el creador puede expulsar usuarios'
        }));
        return;
      }
      
      // Verificar que no se esté expulsando al creador
      if (parseInt(userIdToExpel) === currentUserId) {
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: 'No puedes expulsarte a ti mismo'
        }));
        return;
      }
      
      // Expulsar al usuario
      const expelResult = await communityQueries.expelUserFromCommunity(communityId, userIdToExpel);
      
      if (expelResult) {
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          message: 'Usuario expulsado exitosamente',
          communityId: communityId,
          expelledUserId: userIdToExpel,
          action: 'user_expelled',
          expelledUserWillBeRedirected: true
        }));
      } else {
        res.writeHead(500);
        res.end(JSON.stringify({
          success: false,
          error: 'Error al expulsar al usuario'
        }));
      }
    } catch (error) {
      console.error('❌ Error expulsando usuario:', error);
      res.writeHead(500);
      res.end(JSON.stringify({
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      }));
    }
  });
  return;
}

// 🆕 PUT /api/communities/:id/update - Actualizar información de la comunidad (solo para creadores)
    if (requestPath.match(/\/api\/communities\/\d+\/update$/) && method === 'PUT') {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      const pathParts = requestPath.split('/');
      const communityId = parseInt(pathParts[3]);
      
      if (!communityId || isNaN(communityId)) {
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: 'ID de comunidad inválido'
        }));
        return;
      }
      
      const { name, description, categoria } = JSON.parse(body || '{}');
      
      // Verificar que al menos un campo se esté actualizando
      if (!name && !description && !categoria) {
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: 'Debe proporcionar al menos un campo para actualizar'
        }));
        return;
      }
      
      console.log(`✏️ Intentando actualizar comunidad ${communityId}:`, { name, description, categoria });
      
      const currentUserId = getAuthenticatedUser(req);
      
      if (!currentUserId) {
        res.writeHead(401);
        res.end(JSON.stringify({
          success: false,
          error: 'Usuario no autenticado'
        }));
        return;
      }
      
      if (!isDatabaseConnected) {
        res.writeHead(503);
        res.end(JSON.stringify({
          success: false,
          error: 'Base de datos no disponible'
        }));
        return;
      }
      
      // Verificar que el usuario actual sea el creador de la comunidad
      const communityDetails = await communityQueries.getCommunityDetails(communityId, currentUserId);
      
      if (!communityDetails) {
        res.writeHead(404);
        res.end(JSON.stringify({
          success: false,
          error: 'Comunidad no encontrada'
        }));
        return;
      }
      
      if (!communityDetails.isCreator) {
        res.writeHead(403);
        res.end(JSON.stringify({
          success: false,
          error: 'Solo el creador puede actualizar la comunidad'
        }));
        return;
      }
      
      // Actualizar la comunidad
      try {
        console.log('🔄 Llamando a updateCommunity con:', { communityId, updateData: { name, description, categoria }, currentUserId });
        
        const updateResult = await communityQueries.updateCommunity(communityId, { name, description, categoria }, currentUserId);
        
        console.log('✅ Resultado de updateCommunity:', updateResult);
        
        if (updateResult && updateResult.success) {
          console.log(`✅ Comunidad ${communityId} actualizada exitosamente por ${currentUserId}`);
          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            message: 'Comunidad actualizada exitosamente',
            communityId: communityId,
            updatedFields: { name, description, categoria }
          }));
        } else {
          console.error('❌ updateResult no tiene éxito:', updateResult);
          res.writeHead(500);
          res.end(JSON.stringify({
            success: false,
            error: 'Error al actualizar la comunidad',
            details: updateResult
          }));
        }
      } catch (updateError) {
        console.error('❌ Error específico en updateCommunity:', updateError);
        console.error('❌ Stack trace:', updateError && updateError.stack ? updateError.stack : 'No disponible');
        res.writeHead(500);
        res.end(JSON.stringify({
          success: false,
          error: 'Error interno del servidor',
          details: updateError.message
        }));
      }
    } catch (error) {
      console.error('❌ Error actualizando comunidad:', error);
      res.writeHead(500);
      res.end(JSON.stringify({
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      }));
    }
  });
  return;
}



// GET /api/communities - Obtener todas las comunidades (GENERAL AL FINAL)
if (requestPath === '/api/communities' && method === 'GET') {
  try {
    console.log('📍 GET /api/communities - Obteniendo todas las comunidades');
    
    if (!isDatabaseConnected) {
      // Datos de respaldo
      const fallbackData = [
        {
          id: 1,
          name: 'Seguridad Ciudadana',
          description: 'Comunidad para reportar problemas de seguridad',
          memberCount: 1234,
          isJoined: false,
          isAdmin: false,
          isCreator: false,
          imagen: null,
          creadorNombre: 'Sistema',
          roleBadge: null,
          fechaCreacion: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Medio Ambiente',
          description: 'Cuidemos nuestro planeta juntos',
          memberCount: 567,
          isJoined: true,
          isAdmin: false,
          isCreator: false,
          imagen: null,
          creadorNombre: 'Admin Ambiente',
          roleBadge: 'Miembro',
          fechaCreacion: new Date().toISOString()
        }
      ];
      
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        communities: fallbackData,
        message: 'Datos de respaldo (sin conexión)'
      }));
      return;
    }
    
    const userId = getAuthenticatedUser(req); // ✅ Obtiene ID real
    const communities = await communityQueries.getAllCommunities(userId); // ✅ Usa ID real
    console.log(`✅ ${communities.length} comunidades obtenidas`);
    
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      communities: communities,
      message: `${communities.length} comunidades encontradas`
    }));
  } catch (error) {
    console.error('❌ Error en GET /api/communities:', error);
    res.writeHead(500);
    res.end(JSON.stringify({
      success: false,
      error: error.message || 'Error interno del servidor',
      communities: [] // ✅ AGREGADO PARA EVITAR ERRORES
    }));
  }
  return;
}

// POST /api/communities - Crear nueva comunidad
  if (requestPath === '/api/communities' && method === 'POST') {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      console.log('📍 POST /api/communities - Creando nueva comunidad');
      const { name, description, category, tags } = JSON.parse(body || '{}');
      console.log('📝 Datos recibidos:', { name, description, category });
      
      // Validaciones
      if (!name || !name.trim()) {
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: 'El nombre de la comunidad es obligatorio'
        }));
        return;
      }
      
      if (!description || !description.trim()) {
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: 'La descripción es obligatoria'
        }));
        return;
      }
      
      if (name.length > 50) {
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: 'El nombre no puede superar los 50 caracteres'
        }));
        return;
      }
      
      if (description.length > 200) {
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: 'La descripción no puede superar los 200 caracteres'
        }));
        return;
      }
      
      if (!isDatabaseConnected) {
        // Crear comunidad localmente como respaldo
        const newCommunity = {
          id: Date.now(),
          name: name.trim(),
          description: description.trim(),
          category: category || 'general',
          tags: tags || '',
          memberCount: 1,
          isJoined: true,
          isAdmin: true,
          isCreator: true,
          imagen: null,
          creadorNombre: 'Tú',
          roleBadge: 'Creador',
          fechaCreacion: new Date().toISOString()
        };
        
        res.writeHead(201);
        res.end(JSON.stringify({
          success: true,
          community: newCommunity,
          message: 'Comunidad creada (offline)'
        }));
        return;
      }
      
      console.log('🔄 Creando nueva comunidad en base de datos...');
      const userId = getAuthenticatedUser(req);
      const communityData = { 
        name: name.trim(), 
        description: description.trim(),
        category: category || 'general',
        tags: tags || ''
      };
      
      const newCommunity = await communityQueries.createCommunity(communityData, userId);
      console.log('✅ Comunidad creada exitosamente:', newCommunity.name);
      
      res.writeHead(201);
      res.end(JSON.stringify({
        success: true,
        community: newCommunity,
        message: `Comunidad "${newCommunity.name}" creada exitosamente`
      }));
    } catch (error) {
      console.error('❌ Error en POST /api/communities:', error);
      res.writeHead(500);
      res.end(JSON.stringify({
        success: false,
        error: error.message || 'Error interno del servidor'
      }));
    }
  });
  return;
}

// POST /api/communities/action - Unirse/salir de comunidad
if (path === '/api/communities/action' && method === 'POST') {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      const { action, communityId } = JSON.parse(body || '{}');
      
      console.log('📍 POST /api/communities/action - Acción de membresía');
      console.log('📝 Datos recibidos:', { action, communityId });
      
      if (!action || !communityId) {
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: 'Acción y ID de comunidad son obligatorios'
        }));
        return;
      }
      
      if (!['join', 'leave'].includes(action)) {
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: 'Acción debe ser "join" o "leave"'
        }));
        return;
      }
      
      if (!isDatabaseConnected) {
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          message: action === 'join' ? 'Te has unido a la comunidad (offline)' : 'Has salido de la comunidad (offline)',
          isCreator: false,
          autoJoined: action === 'join'
        }));
        return;
      }
      
      const userId = getAuthenticatedUser(req);
      const numCommunityId = parseInt(communityId);
      console.log(`🔄 ${action} comunidad ${numCommunityId} para usuario ${userId}`);
      
      const result = await communityQueries.toggleMembership(action, numCommunityId, userId);
      console.log('✅ Acción completada exitosamente');
      
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        ...result
      }));
    } catch (error) {
      console.error('❌ Error en toggleMembership:', error);
      res.writeHead(500);
      res.end(JSON.stringify({
        success: false,
        error: error.message
      }));
    }
  });
  return;
}

// GET /api/communities/user - Obtener comunidades del usuario
if (path === '/api/communities/user' && method === 'GET') {
  try {
    console.log('📋 Obteniendo comunidades del usuario...');
    
    if (!isDatabaseConnected) {
      const fallbackData = [
        {
          id: 2,
          name: 'Medio Ambiente',
          description: 'Cuidemos nuestro planeta juntos',
          memberCount: 567,
          isJoined: true,
          isAdmin: false,
          isCreator: false,
          imagen: null,
          creadorNombre: 'Usuario Demo',
          roleBadge: 'Miembro'
        }
      ];
      
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        communities: fallbackData,
        message: 'Datos de respaldo (sin conexión)'
      }));
      return;
    }
    
    const userId = getAuthenticatedUser(req);
    const communities = await communityQueries.getUserCommunities(userId);
    console.log(`✅ Usuario ${userId} tiene ${communities.length} comunidades`);
    
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      communities: communities,
      message: 'Comunidades del usuario obtenidas exitosamente'
    }));
  } catch (error) {
    console.error('❌ Error obteniendo comunidades del usuario:', error);
    res.writeHead(500);
    res.end(JSON.stringify({
      success: false,
      error: 'Error interno del servidor',
      communities: []
    }));
  }
  return;
}

// GET /api/communities/test/debug - Test de conexión específico
if (requestPath === '/api/communities/test/debug' && method === 'GET') {
  try {
    const userId = getAuthenticatedUser(req);
    console.log('🔍 Ruta de prueba de comunidades - Usuario:', userId);
    
    const dbStatus = isDatabaseConnected ? 'Conectada' : 'Desconectada';
    
    let communitiesCount = 0;
    let error = null;
    
    try {
      if (isDatabaseConnected) {
        const communities = await communityQueries.getAllCommunities(userId);
        communitiesCount = communities.length;
      }
    } catch (err) {
      error = err.message;
    }
    
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      debug: {
        timestamp: new Date().toISOString(),
        database: dbStatus,
        communitiesCount: communitiesCount,
        authenticatedUserId: userId,
        error: error
      }
    }));
    
  } catch (error) {
    console.error('❌ Error en ruta de debug:', error);
    res.writeHead(500);
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }));
  }
  return;
}
  // ===============================
    // ENDPOINTS DE REPORTES - ORDEN CORRECTO
    // ===============================

    // GET /api/reports/user/:id - Obtener reportes de un usuario específico (PRIMERO - MÁS ESPECÍFICO)
    if (requestPath.startsWith('/api/reports/user/') && method === 'GET') {
      try {
        const pathParts = requestPath.split('/');
        const userId = pathParts[4]; // /api/reports/user/68 -> 68
        
        if (!userId || isNaN(userId)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'ID de usuario inválido'
          }));
          return;
        }

        console.log(`📋 Obteniendo reportes del usuario ${userId}...`);

        // ✅ CONSULTA PARA REPORTES DEL USUARIO ESPECÍFICO
        const sql = `
          SELECT 
            r.idReporte,
            r.titulo,
            r.descripcion,
            r.ubicacion,
            r.categoria,
            r.idUsuario,
            r.fechaCreacion,
            r.imagen,
            r.nombreImagen,
            r.tipoImagen,
            r.imagenUrl,
            u.nombre as nombreUsuario,
            u.correo as emailUsuario
          FROM reportes r
          LEFT JOIN usuarios u ON r.idUsuario = u.idUsuario
          WHERE r.idUsuario = ?
          ORDER BY r.fechaCreacion DESC
        `;

        const userReports = await execute(sql, [parseInt(userId)]);
        
        console.log(`✅ ${userReports.length} reportes encontrados para el usuario ${userId}`);

        // ✅ PROCESAR CADA REPORTE
        const processedReports = userReports.map(report => {
          const processedReport = {
            idReporte: report.idReporte,
            id: report.idReporte,
            titulo: report.titulo,
            descripcion: report.descripcion,
            ubicacion: report.ubicacion,
            categoria: report.categoria,
            idUsuario: report.idUsuario,
            fechaCreacion: report.fechaCreacion,
            nombreUsuario: report.nombreUsuario,
            emailUsuario: report.emailUsuario
          };

          // ✅ MANEJAR IMAGEN SI EXISTE
          if (report.nombreImagen) {
            processedReport.imagen = `${req.headers.host || 'localhost:3000'}/uploads/${report.nombreImagen}`;
            processedReport.hasImage = true;
          } else if (report.imagen) {
            // Si es un Buffer/BLOB
            if (Buffer.isBuffer(report.imagen) || report.imagen instanceof Buffer) {
              processedReport.imagen = `${req.headers.host || 'localhost:3000'}/uploads/reporte-${report.idReporte}.jpeg`;
              processedReport.hasImage = true;
            } else {
              processedReport.imagen = null;
              processedReport.hasImage = false;
            }
          } else {
            processedReport.imagen = null;
            processedReport.hasImage = false;
          }

          return processedReport;
        });

        // ✅ ESTADÍSTICAS DEL USUARIO
        const totalReports = processedReports.length;
        const reportsWithImages = processedReports.filter(r => r.hasImage).length;
        
        // Estadísticas por categoría
        const categoryStats = {};
        processedReports.forEach(report => {
          const category = report.categoria || 'general';
          categoryStats[category] = (categoryStats[category] || 0) + 1;
        });

        // Reportes recientes (última semana)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const recentReports = processedReports.filter(report => {
          const reportDate = new Date(report.fechaCreacion);
          return reportDate >= oneWeekAgo;
        }).length;

        console.log(`📊 Estadísticas usuario ${userId}:`);
        console.log(`  - Total reportes: ${totalReports}`);
        console.log(`  - Con imágenes: ${reportsWithImages}`);
        console.log(`  - Recientes: ${recentReports}`);
        console.log(`  - Por categoría:`, categoryStats);

        const response = {
          success: true,
          reports: processedReports,
          reportCount: totalReports,
          userId: parseInt(userId),
          userStats: {
            total: totalReports,
            withImages: reportsWithImages,
            recent: recentReports,
            byCategory: categoryStats
          },
          fromCache: false
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));

      } catch (error) {
        console.error('❌ Error obteniendo reportes del usuario:', error);
        res.writeHead(500);
        res.end(JSON.stringify({
          success: false,
          error: 'Error interno del servidor',
          details: error.message
        }));
      }
      return;
    }

    // GET /api/reports/stats - Estadísticas de reportes (ESPECÍFICO)
    if (requestPath === '/api/reports/stats' && method === 'GET') {
      try {
        console.log('📊 Obteniendo estadísticas de reportes...');
        
        if (!isDatabaseConnected) {
          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            stats: {
              total: 0,
              categories: {},
              recent: 0
            },
            warning: 'Base de datos no disponible'
          }));
          return;
        }

        const sql = `
          SELECT 
            COUNT(*) as total,
            categoria,
            COUNT(CASE WHEN imagen IS NOT NULL THEN 1 END) as withImages,
            COUNT(CASE WHEN fechaCreacion >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as recent
          FROM reportes 
          GROUP BY categoria
        `;
        
        const stats = await execute(sql);
        
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          stats: stats
        }));
      } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.writeHead(500);
        res.end(JSON.stringify({
          success: false,
          error: 'Error al obtener estadísticas: ' + error.message
        }));
      }
      return;
    }

    // 🔔 RUTAS DE NOTIFICACIONES PUSH
    // POST /api/notifications/push/community - Enviar notificación push a todos los miembros de una comunidad
    if (requestPath === '/api/notifications/push/community' && method === 'POST') {
      notificationRoutes.handlePushToCommunity(req, res, execute, isDatabaseConnected);
      return;
    }

    // POST /api/notifications/push/user - Enviar notificación push a un usuario específico
    if (requestPath === '/api/notifications/push/user' && method === 'POST') {
      notificationRoutes.handlePushToUser(req, res, execute, isDatabaseConnected);
      return;
    }

    // GET /api/notifications/history/:userId - Obtener historial de notificaciones de un usuario
    if (requestPath.match(/\/api\/notifications\/history\/\d+$/) && method === 'GET') {
      notificationRoutes.handleNotificationHistory(req, res, execute, isDatabaseConnected);
      return;
    }

    // GET /api/notifications/logs/community/:communityId - Obtener logs de notificaciones de comunidad
    if (requestPath.match(/\/api\/notifications\/logs\/community\/\d+$/) && method === 'GET') {
      notificationRoutes.handleNotificationLogs(req, res, execute, isDatabaseConnected);
      return;
    }

    // ✅ ENDPOINT DE HEALTH CHECK PARA DETECCIÓN DE IP
    if (requestPath === '/health' && method === 'GET') {
      console.log('🏥 Health check request received from:', req.headers['user-agent'] || 'Unknown');
      console.log('🏥 Client IP:', req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Unknown');
      
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Cache-Control': 'no-cache'
      });
      
        res.end(JSON.stringify({
          success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
        }));
        return;
      }
      
    // ✅ MANEJAR PETICIONES OPTIONS (CORS PREFLIGHT)
    if (method === 'OPTIONS') {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      });
      res.end();
            return;
          }

    // ✅ ENDPOINT DE TEST PARA CONECTIVIDAD
    if (requestPath === '/api/reports/test' && method === 'POST') {
      console.log('🧪 === TEST DE CONECTIVIDAD ===');
      console.log('📋 Headers:', req.headers);
      
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      });
      res.end(JSON.stringify({
        success: true,
        message: 'Test de conectividad exitoso',
        timestamp: new Date().toISOString(),
        headers: req.headers
      }));
      return;
    }

    // ✅ ENDPOINT PARA SUBIDA DE REPORTES CON IMAGEN (MULTER)
    if (requestPath === '/api/reports/upload' && method === 'POST') {
      console.log('📱 === SUBIENDO REPORTE CON IMAGEN (MULTER) ===');
      
      // ✅ USAR MULTER PARA PROCESAR LA SUBIDA
      upload.single('imagen')(req, res, async (err) => {
        try {
          if (err) {
            console.error('❌ Error en multer:', err);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Error en la subida del archivo: ' + err.message
            }));
            return;
          }
          
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
            
            res.writeHead(400, { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            });
              res.end(JSON.stringify({
                success: false,
              error: 'Título, descripción, ubicación y ID de usuario son obligatorios'
              }));
              return;
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
            
            res.writeHead(400, { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            });
              res.end(JSON.stringify({
                success: false,
              error: 'El título no puede superar los 255 caracteres'
              }));
              return;
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
          
          res.writeHead(201, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          });
            res.end(JSON.stringify({
              success: true,
              report: newReport,
              message: 'Reporte con imagen creado exitosamente'
            }));
            
          } catch (error) {
          console.error('❌ Error creando reporte:', error);
          console.error('❌ Stack trace:', error && error.stack ? error.stack : 'No disponible');
          
          // ✅ ELIMINAR ARCHIVO SUBIDO SI HAY ERROR
          if (req.file) {
            try {
              fs.unlinkSync(req.file.path);
              console.log('🗑️ Archivo temporal eliminado por error');
            } catch (err) {
              console.log('⚠️ No se pudo eliminar archivo temporal:', err.message);
            }
          }
          
          res.writeHead(500, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          });
      res.end(JSON.stringify({
        success: false,
            error: `Error interno del servidor: ${error && error.message ? error.message : 'Error desconocido'}`,
            details: error && error.message ? error.message : 'Error desconocido'
      }));
        }
      });
      return;
    }

    // GET /api/reports/:id - Ver reporte específico (DESPUÉS de rutas específicas)
    if (requestPath.startsWith('/api/reports/') && requestPath.split('/').length === 4 && method === 'GET') {
      try {
        const pathParts = requestPath.split('/');
        const reportId = pathParts[3]; // /api/reports/123 -> 123
        
        // ✅ VERIFICAR QUE NO SEA UNA RUTA ESPECÍFICA
        if (reportId === 'user' || reportId === 'stats' || reportId === 'upload') {
          res.writeHead(404);
          res.end(JSON.stringify({
            success: false,
            error: 'Ruta no encontrada',
            path: requestPath
          }));
          return;
        }

        if (!reportId || isNaN(reportId)) {
          res.writeHead(400);
          res.end(JSON.stringify({
            success: false,
            error: 'ID de reporte inválido'
          }));
          return;
        }

        console.log(`📋 Obteniendo reporte específico: ${reportId}`);

        const sql = `
          SELECT 
            r.idReporte,
            r.titulo,
            r.descripcion,
            r.ubicacion,
            r.categoria,
            r.estado,
            r.idUsuario,
            r.fechaCreacion,
            r.nombreImagen,
            r.imagenUrl,
            u.nombre as nombreUsuario,
            u.correo as emailUsuario
          FROM reportes r
          LEFT JOIN usuarios u ON r.idUsuario = u.idUsuario
          WHERE r.idReporte = ?
        `;

        const results = await execute(sql, [parseInt(reportId)]);
        
        if (results.length === 0) {
          res.writeHead(404);
          res.end(JSON.stringify({
            success: false,
            error: 'Reporte no encontrado'
          }));
          return;
        }

        const report = results[0];
        
        // ✅ LOG PARA DEBUGGING: Mostrar el estado actual del reporte
        console.log(`📊 Reporte ${reportId} - Estado actual: ${report.estado}`);
        
        const processedReport = {
          idReporte: report.idReporte,
          id: report.idReporte,
          titulo: report.titulo,
          descripcion: report.descripcion,
          ubicacion: report.ubicacion,
          categoria: report.categoria,
          estado: report.estado,
          idUsuario: report.idUsuario,
          fechaCreacion: report.fechaCreacion,
          nombreUsuario: report.nombreUsuario,
          emailUsuario: report.emailUsuario,
          imagen: report.nombreImagen ? `${req.headers.host || 'localhost:3000'}/uploads/${report.nombreImagen}` : null,
          hasImage: !!report.nombreImagen
        };
        
        // ✅ LOG PARA DEBUGGING: Mostrar el reporte procesado
        console.log(`📋 Reporte procesado enviado a la app:`, {
          id: processedReport.idReporte,
          titulo: processedReport.titulo,
          estado: processedReport.estado,
          categoria: processedReport.categoria
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          report: processedReport
        }));

      } catch (error) {
        console.error('❌ Error obteniendo reporte específico:', error);
        res.writeHead(500);
        res.end(JSON.stringify({
          success: false,
          error: 'Error interno del servidor'
        }));
      }
      return;
    }

    // PUT /api/reports/:id - Actualizar reporte
    if (requestPath.startsWith('/api/reports/') && requestPath.split('/').length === 4 && method === 'PUT') {
      const reportId = requestPath.split('/')[3];
      
      console.log(`📝 [BACKEND] PUT Request para actualizar reporte ${reportId}`);
      console.log('📝 [BACKEND] Headers:', req.headers);
      
      // ✅ NUEVO: Detectar si es FormData o JSON
      const contentType = req.headers['content-type'] || '';
      const isFormData = contentType.includes('multipart/form-data');
      
      console.log(`📝 [BACKEND] Content-Type: ${contentType}`);
      console.log(`📝 [BACKEND] Es FormData: ${isFormData}`);
      
      if (isFormData) {
        // ✅ MANEJAR FormData con imagen
        console.log(`🔄 Actualizando reporte ${reportId} con FormData (imagen)`);
        
        // ✅ USAR multer para procesar FormData
        const upload = multer({
          storage: multer.diskStorage({
            destination: function (req, file, cb) {
              const uploadDir = 'C:/ImagenesCompartidas/uploads/reportes/';
              if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
              }
              cb(null, uploadDir);
            },
            filename: function (req, file, cb) {
              const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
              const filename = 'reporte-' + uniqueSuffix + path.extname(file.originalname);
              cb(null, filename);
            }
          }),
          limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
          fileFilter: function (req, file, cb) {
            if (file.mimetype.startsWith('image/')) {
              cb(null, true);
            } else {
              cb(new Error('Solo se permiten archivos de imagen'), false);
            }
          }
        }).single('imagen');
        
        upload(req, res, async (err) => {
          try {
            console.log(`🔄 [BACKEND] Procesando FormData para reporte ${reportId}`);
            
            if (err) {
              console.error('❌ [BACKEND] Error procesando FormData:', err);
              res.writeHead(400);
              res.end(JSON.stringify({
                success: false,
                error: 'Error procesando imagen: ' + err.message
              }));
              return;
            }
            
            const updates = {
              titulo: req.body.titulo || req.body.title,
              descripcion: req.body.descripcion || req.body.description,
              ubicacion: req.body.ubicacion || req.body.location,
              categoria: req.body.categoria || req.body.category
            };
            
            console.log(`🔄 [BACKEND] Actualizando reporte ${reportId} con datos:`, updates);
            console.log(`🖼️ [BACKEND] Archivo de imagen:`, req.file);
            
            if (!isDatabaseConnected) {
              res.writeHead(200);
              res.end(JSON.stringify({
                success: true,
                message: 'Actualización simulada (base de datos no disponible)'
              }));
              return;
            }
            
            // ✅ SQL para actualizar con imagen si existe
            let sql, params;
            
            if (req.file) {
              // ✅ ACTUALIZAR CON NUEVA IMAGEN
              const imagenUrl = `uploads/reportes/${req.file.filename}`;
              sql = `
                UPDATE reportes 
                SET titulo = ?, descripcion = ?, ubicacion = ?, categoria = ?, imagenUrl = ?, nombreImagen = ?
                WHERE idReporte = ?
              `;
              params = [
                updates.titulo,
                updates.descripcion,
                updates.ubicacion,
                updates.categoria,
                imagenUrl,
                req.file.filename,
                parseInt(reportId)
              ];
              
              console.log(`🖼️ Nueva imagen guardada: ${imagenUrl}`);
            } else {
              // ✅ ACTUALIZAR SIN IMAGEN
              sql = `
                UPDATE reportes 
                SET titulo = ?, descripcion = ?, ubicacion = ?, categoria = ?
                WHERE idReporte = ?
              `;
              params = [
                updates.titulo,
                updates.descripcion,
                updates.ubicacion,
                updates.categoria,
                parseInt(reportId)
              ];
            }
            
            const result = await execute(sql, params);
            
            if (result.affectedRows > 0) {
              console.log(`✅ Reporte ${reportId} actualizado exitosamente`);
              res.writeHead(200);
              res.end(JSON.stringify({
                success: true,
                message: 'Reporte actualizado exitosamente',
                imagenUrl: req.file ? `uploads/reportes/${req.file.filename}` : null
              }));
            } else {
              res.writeHead(404);
              res.end(JSON.stringify({
                success: false,
                error: 'Reporte no encontrado'
              }));
            }
            
          } catch (error) {
            console.error('❌ Error actualizando reporte con FormData:', error);
            res.writeHead(400);
            res.end(JSON.stringify({
              success: false,
              error: 'Error al actualizar reporte: ' + error.message
            }));
          }
        });
        return;
        
      } else {
        // ✅ MANEJAR JSON normal (sin imagen)
        console.log(`🔄 Actualizando reporte ${reportId} con JSON`);
      
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const updates = JSON.parse(body || '{}');
          console.log(`🔄 Actualizando reporte ${reportId}:`, updates);
          
          if (!isDatabaseConnected) {
            res.writeHead(200);
            res.end(JSON.stringify({
              success: true,
              message: 'Actualización simulada (base de datos no disponible)'
            }));
            return;
          }
          
          const sql = `
            UPDATE reportes 
            SET titulo = ?, descripcion = ?, ubicacion = ?, categoria = ?
            WHERE idReporte = ?
          `;
          
          const result = await execute(sql, [
            updates.titulo || updates.title,
            updates.descripcion || updates.description,
            updates.ubicacion || updates.location,
            updates.categoria || updates.category,
            parseInt(reportId)
          ]);
          
          if (result.affectedRows > 0) {
            console.log(`✅ Reporte ${reportId} actualizado`);
            res.writeHead(200);
            res.end(JSON.stringify({
              success: true,
              message: 'Reporte actualizado exitosamente'
            }));
          } else {
            res.writeHead(404);
            res.end(JSON.stringify({
              success: false,
              error: 'Reporte no encontrado'
            }));
          }
        } catch (error) {
          console.error('❌ Error actualizando reporte:', error);
          res.writeHead(400);
          res.end(JSON.stringify({
            success: false,
            error: 'Error al actualizar reporte: ' + error.message
          }));
        }
      });
      return;
      }
    }

    // PATCH /api/reports/:id/status - Actualizar estado del reporte
    if (requestPath.startsWith('/api/reports/') && requestPath.endsWith('/status') && method === 'PATCH') {
      const reportId = requestPath.split('/')[3];
      
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const { status } = JSON.parse(body || '{}');
          console.log(`🔄 Actualizando estado del reporte ${reportId} a: ${status}`);
          
          if (!isDatabaseConnected) {
            res.writeHead(200);
            res.end(JSON.stringify({
              success: true,
              message: 'Actualización de estado simulada (base de datos no disponible)'
            }));
            return;
          }
          
          // Validar estado
          const validStatuses = ['Pendiente', 'En progreso', 'Verificado', 'Resuelto', 'Rechazado', 'Archivado'];
          if (!validStatuses.includes(status)) {
            res.writeHead(400);
            res.end(JSON.stringify({
              success: false,
              error: `Estado inválido. Estados válidos: ${validStatuses.join(', ')}`
            }));
            return;
          }
          
          // Verificar si el reporte existe
          const checkQuery = 'SELECT * FROM reportes WHERE idReporte = ?';
          const existing = await execute(checkQuery, [parseInt(reportId)]);
          
          if (existing.length === 0) {
            res.writeHead(404);
            res.end(JSON.stringify({
              success: false,
              error: 'Reporte no encontrado'
            }));
            return;
          }
          
          // Actualizar estado
          const updateQuery = `
            UPDATE reportes 
            SET estado = ?, fechaActualizacion = NOW()
            WHERE idReporte = ?
          `;
          
          const result = await execute(updateQuery, [status, parseInt(reportId)]);
          
          if (result.affectedRows > 0) {
            console.log(`✅ Estado del reporte ${reportId} actualizado a: ${status}`);
            res.writeHead(200);
            res.end(JSON.stringify({
              success: true,
              message: `Estado del reporte actualizado a: ${status}`,
              data: {
                id: parseInt(reportId),
                status: status,
                updatedAt: new Date()
              }
            }));
          } else {
            res.writeHead(404);
            res.end(JSON.stringify({
              success: false,
              error: 'Reporte no encontrado'
            }));
          }
        } catch (error) {
          console.error('❌ Error actualizando estado del reporte:', error);
          res.writeHead(400);
          res.end(JSON.stringify({
            success: false,
            error: 'Error al actualizar estado del reporte: ' + error.message
          }));
        }
      });
      return;
    }

    // DELETE /api/reports/:id - Eliminar reporte
    if (requestPath.startsWith('/api/reports/') && requestPath.split('/').length === 4 && method === 'DELETE') {
      try {
        const reportId = requestPath.split('/')[3];
        console.log(`🗑️ Eliminando reporte ID: ${reportId}`);
        
        if (!isDatabaseConnected) {
          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            message: 'Eliminación simulada (base de datos no disponible)'
          }));
          return;
        }
        
        const sql = 'DELETE FROM reportes WHERE idReporte = ?';
        const result = await execute(sql, [parseInt(reportId)]);
        
        if (result.affectedRows > 0) {
          console.log(`✅ Reporte ${reportId} eliminado`);
          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            message: 'Reporte eliminado exitosamente'
          }));
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({
            success: false,
            error: 'Reporte no encontrado'
          }));
        }
      } catch (error) {
        console.error('❌ Error eliminando reporte:', error);
        res.writeHead(500);
        res.end(JSON.stringify({
          success: false,
          error: 'Error al eliminar reporte: ' + error.message
        }));
      }
      return;
    }

    // POST /api/reports - Crear nuevo reporte (JSON)
    if (requestPath === '/api/reports' && method === 'POST') {
      const contentType = req.headers['content-type'] || '';
      console.log('📱 === ENDPOINT REPORTES APP MÓVIL ===');
      console.log('📋 Content-Type:', contentType);
      
      if (contentType.includes('application/json')) {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const data = JSON.parse(body);
            console.log('📝 === CREANDO NUEVO REPORTE CON JSON ===');
            
            const titulo = data.titulo || '';
            const descripcion = data.descripcion || '';
            const ubicacion = data.ubicacion || '';
            const categoria = data.categoria || 'general';
            const idUsuario = data.idUsuario || 1;

            console.log('📋 Datos extraídos del JSON:');
            console.log('📝 Título:', titulo);
            console.log('📝 Descripción:', descripcion);
            console.log('📍 Ubicación:', ubicacion);
            console.log('🏷️ Categoría:', categoria);
            console.log('👤 Usuario ID:', idUsuario);

            if (!titulo || !descripcion || !ubicacion) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                error: 'Todos los campos son requeridos'
              }));
              return;
            }

            console.log('💾 Guardando en base de datos MySQL...');
            
            const sql = `
              INSERT INTO reportes (titulo, descripcion, ubicacion, categoria, idUsuario, fechaCreacion)
              VALUES (?, ?, ?, ?, ?, NOW())
            `;
            
            const result = await execute(sql, [titulo, descripcion, ubicacion, categoria, idUsuario]);
            
            const newReport = {
              id: result.insertId,
              idReporte: result.insertId,
              titulo, descripcion, ubicacion, categoria, idUsuario,
              fechaCreacion: new Date().toISOString()
            };
            
            console.log('✅ Reporte creado exitosamente en MySQL:', result.insertId);
            
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              report: newReport,
              message: 'Reporte guardado exitosamente en MySQL'
            }));
            
          } catch (error) {
            console.error('❌ Error procesando JSON:', error);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Error procesando datos JSON: ' + error.message
            }));
          }
        });
        return;
      }
      
      // Content-Type no soportado
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Content-Type no soportado. Use application/json o multipart/form-data'
      }));
      return;
    }

    // GET /api/reports - Obtener todos los reportes (EL MÁS GENERAL AL FINAL)
    if (requestPath === '/api/reports' && method === 'GET') {
      try {
        const urlParts = url.parse(req.url, true);
        const userId = urlParts.query.userId || urlParts.query.user;
        
        console.log('📋 Obteniendo reportes...');
        if (userId) {
          console.log(`📋 Filtrando por usuario: ${userId}`);
        }

        let sql = `
          SELECT 
            r.idReporte,
            r.titulo,
            r.descripcion,
            r.ubicacion,
            r.categoria,
            r.estado,
            r.idUsuario,
            r.fechaCreacion,
            r.nombreImagen,
            r.imagenUrl,
            u.nombre as nombreUsuario,
            u.correo as emailUsuario
          FROM reportes r
          LEFT JOIN usuarios u ON r.idUsuario = u.idUsuario
        `;
        
        let params = [];
        
        if (userId) {
          sql += ' WHERE r.idUsuario = ?';
          params.push(parseInt(userId));
        }
        
        sql += ' ORDER BY r.fechaCreacion DESC';

        const reports = await execute(sql, params);
        
        console.log(`✅ ${reports.length} reportes obtenidos desde MySQL`);

        const processedReports = reports.map(report => {
          const processedReport = {
            idReporte: report.idReporte,
            id: report.idReporte,
            titulo: report.titulo,
            descripcion: report.descripcion,
            ubicacion: report.ubicacion,
            categoria: report.categoria,
            estado: report.estado,
            idUsuario: report.idUsuario,
            fechaCreacion: report.fechaCreacion,
            nombreUsuario: report.nombreUsuario,
            emailUsuario: report.emailUsuario
          };

          if (report.nombreImagen) {
            // ✅ CORREGIR: Usar imagenUrl en lugar de nombreImagen para compatibilidad
            processedReport.imagenUrl = `/uploads/reportes/${report.nombreImagen}`;
            processedReport.hasImage = true;
            processedReport.imagen = `/uploads/reportes/${report.nombreImagen}`; // Mantener compatibilidad
          } else if (report.imagenUrl) {
            // Si ya tenemos imagenUrl, usarlo
            processedReport.imagenUrl = report.imagenUrl;
            processedReport.hasImage = true;
            processedReport.imagen = report.imagenUrl;
          } else {
            processedReport.imagenUrl = null;
            processedReport.hasImage = false;
            processedReport.imagen = null;
          }

          // ✅ LOG PARA DEBUGGING: Mostrar información de imagen
          console.log(`📊 Reporte ${report.idReporte} - Estado: ${report.estado} - Imagen: ${processedReport.hasImage ? processedReport.imagenUrl : 'Sin imagen'}`);

          return processedReport;
        });

        const response = {
          success: true,
          reports: processedReports,
          reportCount: processedReports.length,
          fromCache: false
        };

        if (userId) {
          response.userId = parseInt(userId);
          response.filteredByUser = true;
        }

        res.writeHead(200, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        res.end(JSON.stringify(response));

      } catch (error) {
        console.error('❌ Error obteniendo reportes:', error);
        res.writeHead(500, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        res.end(JSON.stringify({
          success: false,
          error: 'Error interno del servidor',
          details: error && error.message ? error.message : 'Error desconocido'
        }));
      }
      return;
    }

    // ✅ GET /uploads/reportes/:filename - Servir imágenes desde directorio compartido
    if (requestPath.startsWith('/uploads/reportes/') && method === 'GET') {
      try {
                  const filename = requestPath.split('/').pop();
        const pathModule = require('path');
        
        console.log(`📷 Solicitando imagen: ${filename}`);
        
        // ✅ PRIMERO: Buscar en directorio compartido
        const sharedFilePath = 'C:/ImagenesCompartidas/uploads/reportes/' + filename;
        console.log(`📁 Ruta compartida: ${sharedFilePath}`);
        
        if (fs.existsSync(sharedFilePath)) {
          console.log('✅ Imagen encontrada en directorio compartido');
          const stat = fs.statSync(sharedFilePath);
          const fileSize = stat.size;
          const ext = pathModule.extname(filename).toLowerCase();
          
          let contentType = 'application/octet-stream';
          if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
          else if (ext === '.png') contentType = 'image/png';
          else if (ext === '.gif') contentType = 'image/gif';
          else if (ext === '.webp') contentType = 'image/webp';
          
          res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': fileSize,
            'Cache-Control': 'public, max-age=31536000',
            'Access-Control-Allow-Origin': '*'
          });
          
          const fileStream = fs.createReadStream(sharedFilePath);
          fileStream.pipe(res);
          return;
        }
        
        // ✅ FALLBACK: Buscar en directorio local de la app
        const localFilePath = pathModule.join(__dirname, 'uploads/reportes', filename);
        console.log(`📁 Ruta local (fallback): ${localFilePath}`);
        
        if (fs.existsSync(localFilePath)) {
          console.log('✅ Imagen encontrada en directorio local');
          const stat = fs.statSync(localFilePath);
          const fileSize = stat.size;
          const ext = pathModule.extname(filename).toLowerCase();
          
          let contentType = 'application/octet-stream';
          if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
          else if (ext === '.png') contentType = 'image/png';
          else if (ext === '.gif') contentType = 'image/gif';
          else if (ext === '.webp') contentType = 'image/webp';
          
          res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': fileSize,
            'Cache-Control': 'public, max-age=31536000',
            'Access-Control-Allow-Origin': '*'
          });
          
          const fileStream = fs.createReadStream(localFilePath);
          fileStream.pipe(res);
        } else {
          console.log(`❌ Imagen no encontrada en ningún directorio`);
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Imagen no encontrada');
        }
      } catch (error) {
        console.error('❌ Error sirviendo imagen:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error interno del servidor');
      }
      return;
    }

    // ✅ GET /uploads/profiles/:filename - Servir fotos de perfil
    if (requestPath.startsWith('/uploads/profiles/') && method === 'GET') {
      try {
        const filename = requestPath.split('/').pop();
        const pathModule = require('path');
        
        console.log(`📸 Solicitando foto de perfil: ${filename}`);
        
        // ✅ PRIMERO: Buscar en directorio compartido
        const sharedFilePath = 'C:/ImagenesCompartidas/uploads/profiles/' + filename;
        console.log(`📁 Ruta compartida: ${sharedFilePath}`);
        
        if (fs.existsSync(sharedFilePath)) {
          console.log('✅ Foto de perfil encontrada en directorio compartido');
          const stat = fs.statSync(sharedFilePath);
          
          // Determinar el tipo de contenido
          const ext = pathModule.extname(filename).toLowerCase();
          let contentType = 'image/jpeg';
          if (ext === '.png') contentType = 'image/png';
          else if (ext === '.gif') contentType = 'image/gif';
          else if (ext === '.webp') contentType = 'image/webp';
          
          res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': stat.size,
            'Cache-Control': 'public, max-age=3600'
          });
          
          const fileStream = fs.createReadStream(sharedFilePath);
          fileStream.pipe(res);
          return;
        }
        
        // ✅ FALLBACK: Buscar en directorio local de la app
        const localFilePath = pathModule.join(__dirname, 'uploads/profiles', filename);
        console.log(`📁 Ruta local (fallback): ${localFilePath}`);
        
        if (fs.existsSync(localFilePath)) {
          console.log('✅ Foto de perfil encontrada en directorio local');
          const stat = fs.statSync(localFilePath);
          
          // Determinar el tipo de contenido
          const ext = pathModule.extname(filename).toLowerCase();
          let contentType = 'image/jpeg';
          if (ext === '.png') contentType = 'image/png';
          else if (ext === '.gif') contentType = 'image/gif';
          else if (ext === '.webp') contentType = 'image/webp';
          
          res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': stat.size,
            'Cache-Control': 'public, max-age=3600'
          });
          
          const fileStream = fs.createReadStream(localFilePath);
          fileStream.pipe(res);
          return;
        }
        
        // ✅ NO ENCONTRADA
        console.log('❌ Foto de perfil no encontrada');
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Foto de perfil no encontrada');
        
      } catch (error) {
        console.error('❌ Error sirviendo foto de perfil:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error interno del servidor');
      }
      return;
    }

    // ===============================
    // ENDPOINTS DE COMENTARIOS DE REPORTES
    // ===============================

    // GET /api/reports/:id/comments - Obtener comentarios de un reporte
    if (requestPath.startsWith('/api/reports/') && requestPath.endsWith('/comments') && method === 'GET') {
      try {
        const pathParts = requestPath.split('/');
        const reportId = pathParts[3]; // /api/reports/123/comments -> 123
        
        if (!reportId || isNaN(reportId)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'ID de reporte inválido'
          }));
          return;
        }

        console.log(`💬 Obteniendo comentarios del reporte ${reportId}...`);

        const sql = `
          SELECT 
            c.id,
            c.idReporte,
            c.idUsuario,
            c.comentario,
            c.fecha_creacion,
            u.nombre as nombreUsuario,
            u.correo as emailUsuario,
            u.fotoPerfil as fotoPerfil
          FROM comentarios_reportes c
          LEFT JOIN usuarios u ON c.idUsuario = u.idUsuario
          WHERE c.idReporte = ? AND c.activo = 1
          ORDER BY c.fecha_creacion ASC
        `;

        const comments = await execute(sql, [parseInt(reportId)]);
        
        console.log(`✅ ${comments.length} comentarios encontrados para el reporte ${reportId}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          comments: comments,
          commentCount: comments.length
        }));
        return;
      } catch (error) {
        console.error('❌ Error obteniendo comentarios:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Error interno del servidor'
        }));
        return;
      }
    }

    // GET /api/reports/:id/comments/count - Obtener contador de comentarios
    if (requestPath.startsWith('/api/reports/') && requestPath.endsWith('/comments/count') && method === 'GET') {
      try {
        const pathParts = requestPath.split('/');
        const reportId = pathParts[3]; // /api/reports/123/comments/count -> 123
        
        if (!reportId || isNaN(reportId)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'ID de reporte inválido'
          }));
          return;
        }

        console.log(`🔢 Obteniendo contador de comentarios del reporte ${reportId}...`);

        const sql = `
          SELECT COUNT(*) as count
          FROM comentarios_reportes
          WHERE idReporte = ? AND activo = 1
        `;

        const result = await execute(sql, [parseInt(reportId)]);
        const count = result[0]?.count || 0;
        
        console.log(`✅ ${count} comentarios encontrados para el reporte ${reportId}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          count: count
        }));
        return;
      } catch (error) {
        console.error('❌ Error obteniendo contador de comentarios:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Error interno del servidor'
        }));
        return;
      }
    }

    // POST /api/reports/comments - Crear comentario
    if (requestPath === '/api/reports/comments' && method === 'POST') {
      try {
        console.log('💬 Creando nuevo comentario...');

        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const commentData = JSON.parse(body);
            
            console.log('📝 Datos del comentario:', commentData);

            // Validar datos requeridos
            if (!commentData.idReporte || !commentData.idUsuario || !commentData.comentario) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                error: 'Faltan datos requeridos: idReporte, idUsuario, comentario'
              }));
              return;
            }

            // Validar que el reporte existe
            const reportCheckSql = 'SELECT idReporte FROM reportes WHERE idReporte = ?';
            const reportExists = await execute(reportCheckSql, [commentData.idReporte]);
            
            if (reportExists.length === 0) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                error: 'Reporte no encontrado'
              }));
              return;
            }

            // Insertar comentario
            const insertSql = `
              INSERT INTO comentarios_reportes (idReporte, idUsuario, comentario, fecha_creacion, activo)
              VALUES (?, ?, ?, NOW(), 1)
            `;

            const result = await execute(insertSql, [
              commentData.idReporte,
              commentData.idUsuario,
              commentData.comentario.trim()
            ]);

            console.log('✅ Comentario creado exitosamente con ID:', result.insertId);

            // Obtener el comentario creado con información del usuario
            const selectSql = `
              SELECT 
                c.id,
                c.idReporte,
                c.idUsuario,
                c.comentario,
                c.fecha_creacion,
                u.nombre as nombreUsuario,
                u.correo as emailUsuario,
                u.fotoPerfil as fotoPerfil
              FROM comentarios_reportes c
              LEFT JOIN usuarios u ON c.idUsuario = u.idUsuario
              WHERE c.id = ?
            `;

            const newComment = await execute(selectSql, [result.insertId]);

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              comment: newComment[0],
              message: 'Comentario creado exitosamente'
            }));
          } catch (parseError) {
            console.error('❌ Error procesando comentario:', parseError);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Error procesando los datos del comentario'
            }));
          }
        });
        return;
      } catch (error) {
        console.error('❌ Error creando comentario:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Error interno del servidor'
        }));
        return;
      }
    }

    // ===============================
    // ENDPOINTS DE REACCIONES A COMENTARIOS
    // ===============================

    // POST /api/comments/:id/reactions - Agregar/quitar reacción a comentario
    if (requestPath.startsWith('/api/comments/') && requestPath.endsWith('/reactions') && method === 'POST') {
      try {
        const pathParts = requestPath.split('/');
        const commentId = pathParts[3]; // /api/comments/123/reactions -> 123
        
        if (!commentId || isNaN(commentId)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'ID de comentario inválido'
          }));
          return;
        }

        console.log(`❤️ Procesando reacción para comentario ${commentId}...`);

        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const reactionData = JSON.parse(body);
            
            console.log('📝 Datos de reacción:', reactionData);

            // Validar datos requeridos
            if (!reactionData.idUsuario) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                error: 'ID de usuario requerido'
              }));
              return;
            }

            // Verificar si ya existe una reacción del usuario
            const checkSql = `
              SELECT id FROM reacciones_comentarios 
              WHERE idComentario = ? AND idUsuario = ?
            `;
            const existingReaction = await execute(checkSql, [commentId, reactionData.idUsuario]);

            if (existingReaction.length > 0) {
              // Eliminar reacción existente
              const deleteSql = 'DELETE FROM reacciones_comentarios WHERE id = ?';
              await execute(deleteSql, [existingReaction[0].id]);
              
              console.log('✅ Reacción eliminada');
              
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                action: 'removed',
                message: 'Reacción eliminada'
              }));
            } else {
              // Crear nueva reacción
              const insertSql = `
                INSERT INTO reacciones_comentarios (idComentario, idUsuario, fecha_creacion)
                VALUES (?, ?, NOW())
              `;
              await execute(insertSql, [commentId, reactionData.idUsuario]);
              
              console.log('✅ Reacción agregada');
              
              res.writeHead(201, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                action: 'added',
                message: 'Reacción agregada'
              }));
            }
          } catch (parseError) {
            console.error('❌ Error procesando reacción:', parseError);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Error procesando los datos de reacción'
            }));
          }
        });
        return;
      } catch (error) {
        console.error('❌ Error procesando reacción:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Error interno del servidor'
        }));
        return;
      }
    }

    // GET /api/comments/:id/reactions - Obtener reacciones de un comentario
    if (requestPath.startsWith('/api/comments/') && requestPath.endsWith('/reactions') && method === 'GET') {
      try {
        const pathParts = requestPath.split('/');
        const commentId = pathParts[3]; // /api/comments/123/reactions -> 123
        
        if (!commentId || isNaN(commentId)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'ID de comentario inválido'
          }));
          return;
        }

        console.log(`❤️ Obteniendo reacciones del comentario ${commentId}...`);

        const sql = `
          SELECT 
            r.id,
            r.idComentario,
            r.idUsuario,
            r.fecha_creacion,
            u.nombre as nombreUsuario,
            u.fotoPerfil as fotoPerfil
          FROM reacciones_comentarios r
          LEFT JOIN usuarios u ON r.idUsuario = u.idUsuario
          WHERE r.idComentario = ?
          ORDER BY r.fecha_creacion DESC
        `;

        const reactions = await execute(sql, [parseInt(commentId)]);
        
        console.log(`✅ ${reactions.length} reacciones encontradas para el comentario ${commentId}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          reactions: reactions,
          reactionCount: reactions.length
        }));
        return;
      } catch (error) {
        console.error('❌ Error obteniendo reacciones:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Error interno del servidor'
        }));
        return;
      }
    }

    // ===============================
    // ENDPOINTS DE RESPUESTAS A COMENTARIOS
    // ===============================

    // GET /api/comments/:id/replies - Obtener respuestas de un comentario
    if (requestPath.startsWith('/api/comments/') && requestPath.endsWith('/replies') && method === 'GET') {
      try {
        const pathParts = requestPath.split('/');
        const commentId = pathParts[3]; // /api/comments/123/replies -> 123
        
        if (!commentId || isNaN(commentId)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'ID de comentario inválido'
          }));
          return;
        }

        console.log(`💬 Obteniendo respuestas del comentario ${commentId}...`);

        const sql = `
          SELECT 
            r.id,
            r.idComentarioPadre,
            r.idUsuario,
            r.respuesta,
            r.fecha_creacion,
            u.nombre as nombreUsuario,
            u.correo as emailUsuario,
            u.fotoPerfil as fotoPerfil
          FROM respuestas_comentarios r
          LEFT JOIN usuarios u ON r.idUsuario = u.idUsuario
          WHERE r.idComentarioPadre = ? AND r.activo = 1
          ORDER BY r.fecha_creacion ASC
        `;

        const replies = await execute(sql, [parseInt(commentId)]);
        
        console.log(`✅ ${replies.length} respuestas encontradas para el comentario ${commentId}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          replies: replies,
          replyCount: replies.length
        }));
        return;
      } catch (error) {
        console.error('❌ Error obteniendo respuestas:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Error interno del servidor'
        }));
        return;
      }
    }

    // POST /api/comments/replies - Crear respuesta a comentario
    if (requestPath === '/api/comments/replies' && method === 'POST') {
      try {
        console.log('💬 Creando nueva respuesta...');

        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const replyData = JSON.parse(body);
            
            console.log('📝 Datos de la respuesta:', replyData);

            // Validar datos requeridos
            if (!replyData.idComentarioPadre || !replyData.idUsuario || !replyData.respuesta) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                error: 'Faltan datos requeridos: idComentarioPadre, idUsuario, respuesta'
              }));
              return;
            }

            // Validar que el comentario padre existe
            const commentCheckSql = 'SELECT id FROM comentarios_reportes WHERE id = ?';
            const commentExists = await execute(commentCheckSql, [replyData.idComentarioPadre]);
            
            if (commentExists.length === 0) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                error: 'Comentario padre no encontrado'
              }));
              return;
            }

            // Insertar respuesta
            const insertSql = `
              INSERT INTO respuestas_comentarios (idComentarioPadre, idUsuario, respuesta, fecha_creacion, activo)
              VALUES (?, ?, ?, NOW(), 1)
            `;

            const result = await execute(insertSql, [
              replyData.idComentarioPadre,
              replyData.idUsuario,
              replyData.respuesta.trim()
            ]);

            console.log('✅ Respuesta creada exitosamente con ID:', result.insertId);

            // Obtener la respuesta creada con información del usuario
            const selectSql = `
              SELECT 
                r.id,
                r.idComentarioPadre,
                r.idUsuario,
                r.respuesta,
                r.fecha_creacion,
                u.nombre as nombreUsuario,
                u.correo as emailUsuario,
                u.fotoPerfil as fotoPerfil
              FROM respuestas_comentarios r
              LEFT JOIN usuarios u ON r.idUsuario = u.idUsuario
              WHERE r.id = ?
            `;

            const newReply = await execute(selectSql, [result.insertId]);

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              reply: newReply[0],
              message: 'Respuesta creada exitosamente'
            }));
          } catch (parseError) {
            console.error('❌ Error procesando respuesta:', parseError);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Error procesando los datos de la respuesta'
            }));
          }
        });
        return;
      } catch (error) {
        console.error('❌ Error creando respuesta:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Error interno del servidor'
        }));
        return;
      }
    }

    // GET /uploads/:filename - Servir imágenes desde BD o disco
    if (requestPath.startsWith('/uploads/') && method === 'GET') {
      try {
        const filename = requestPath.split('/uploads/')[1];
        console.log('🖼️ Sirviendo imagen:', filename);
        
        if (!filename) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Filename not provided' }));
          return;
        }
        
        const decodedFilename = decodeURIComponent(filename);
        const pathModule = require('path');
        const imagePath = pathModule.join(__dirname, 'uploads', decodedFilename);
        
        // ✅ PRIMERO: Intentar servir desde disco
        if (fs.existsSync(imagePath)) {
          console.log('📁 Imagen encontrada en disco');
          const stats = fs.statSync(imagePath);
          const fileSize = stats.size;
          
          const ext = pathModule.extname(decodedFilename).toLowerCase();
          let contentType = 'image/jpeg';
          if (ext === '.png') contentType = 'image/png';
          if (ext === '.gif') contentType = 'image/gif';
          
          res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': fileSize,
            'Cache-Control': 'public, max-age=31536000',
            'Access-Control-Allow-Origin': '*'
          });
          
          const readStream = fs.createReadStream(imagePath);
          readStream.pipe(res);
          return;
        }
        
        // ✅ SEGUNDO: Buscar en la base de datos
        console.log('📁 Imagen no encontrada en disco, buscando en BD...');
        
        if (!isDatabaseConnected) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Database not connected' }));
          return;
        }
        
        const sql = 'SELECT imagen, tipoImagen FROM reportes WHERE nombreImagen = ?';
        const results = await execute(sql, [decodedFilename]);
        
        if (results.length === 0) {
          console.log('❌ Imagen no encontrada en BD:', decodedFilename);
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Image not found' }));
          return;
        }
        
        const imageRecord = results[0];
        let imageBuffer = imageRecord.imagen;
        const imageType = imageRecord.tipoImagen || 'image/jpeg';
        
        if (!imageBuffer || imageBuffer.length === 0) {
          console.log('❌ Buffer de imagen vacío');
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid image buffer' }));
          return;
        }
        
        if (!Buffer.isBuffer(imageBuffer)) {
          imageBuffer = Buffer.from(imageBuffer);
        }
        
        console.log('✅ Imagen enviada desde BD:', imageBuffer.length, 'bytes');
        
        res.writeHead(200, {
          'Content-Type': imageType,
          'Content-Length': imageBuffer.length,
          'Cache-Control': 'public, max-age=31536000',
          'Access-Control-Allow-Origin': '*'
        });
        
        res.end(imageBuffer);
        
      } catch (error) {
        console.error('❌ Error sirviendo imagen:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error: ' + error.message }));
      }
      return;
    }
    // 404 - Ruta no encontrada
    console.log('❌ Ruta no encontrada:', requestPath);
    res.writeHead(404);
    res.end(JSON.stringify({
      success: false,
      error: 'Ruta no encontrada',
      path: requestPath,
      method: method,
      availableRoutes: [
        // Rutas básicas
        'GET /',
        'GET /api/test',
        
        // Rutas de autenticación  
        'POST /api/auth/login',
        'POST /api/auth/register',
        'GET /api/auth/test',
        'GET /api/users',
        'GET /api/users/:id',
        
        // Rutas de comunidades
        'GET /api/communities',
        'GET /api/communities/categories',
        'POST /api/communities',
        'POST /api/communities/action',
        'GET /api/communities/test/connection',
        'GET /api/communities/user',
            'GET /api/communities/:id',
        'DELETE /api/communities/:id',
        'PUT /api/communities/:id/update',
        'GET /api/communities/:id/members',
        'POST /api/communities/:id/expel',
        'GET /api/communities/:id/messages',
        'POST /api/communities/:id/messages',
        
        // Rutas de reportes
        'GET /api/reports',
        'POST /api/reports',
        'GET /api/reports/:id',
        'PUT /api/reports/:id',
        'PATCH /api/reports/:id/status',
        'DELETE /api/reports/:id',
        'GET /api/reports/stats',
        
        // 🔔 Rutas de notificaciones push
        'POST /api/notifications/push/community',
        'POST /api/notifications/push/user',
        'GET /api/notifications/history/:userId',
        'GET /api/notifications/logs/community/:communityId'
      ]
    }));

  } catch (error) {
    console.error('💥 Error general del servidor:', error);
    res.writeHead(500);
    res.end(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    }));
  }
});

// Función para inicializar el servidor
async function initializeServer() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Iniciando Mi Ciudad SV Backend Server');
  console.log('='.repeat(60));
  
  // Intentar conectar a la base de datos
  try {
    isDatabaseConnected = await connectDB();
    if (isDatabaseConnected) {
      console.log('✅ Base de datos MySQL conectada exitosamente');
      
      // Verificar las tablas
      try {
        const stats = await reportQueries.getStats();
        console.log(`📊 Reportes en la base de datos: ${stats.total}`);
        
        // Verificar comunidades
        const communities = await communityQueries.getAllCommunities();
        console.log(`🏘️ Comunidades en la base de datos: ${communities.length}`);
        
        // Crear tabla de usuarios expulsados
        await createExpelledUsersTable();
        
        // Crear tabla de reacciones a comentarios
        await createReactionsTable();
        
        // Crear tabla de respuestas a comentarios
        await createRepliesTable();
      } catch (error) {
        console.warn('⚠️ Advertencia: No se pudieron obtener estadísticas iniciales');
      }
    } else {
      console.log('⚠️ Continuando sin base de datos - Modo desarrollo');
    }
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    console.log('⚠️ El servidor funcionará sin persistencia de datos');
    isDatabaseConnected = false;
  }
  
  // Iniciar servidor HTTP
  server.listen(PORT, '0.0.0.0', (error) => {
    if (error) {
      console.error('💥 Error al iniciar servidor HTTP:', error);
      process.exit(1);
    }
    
    console.log('='.repeat(60));
    console.log(`📱 Local:        http://localhost:${PORT}`);
    console.log(`🌐 Network:      http://192.168.1.13:${PORT}`);
    console.log(`📡 API Test:     http://192.168.1.13:${PORT}/api/test`);
    console.log(`🔐 Auth Test:    http://192.168.1.13:${PORT}/api/auth/test`);
    console.log(`👥 Users:        http://192.168.1.13:${PORT}/api/users`);
    console.log(`📋 Reports:      http://192.168.1.13:${PORT}/api/reports`);
    console.log(`🏘️ Communities:  http://192.168.1.13:${PORT}/api/communities`);
    console.log('='.repeat(60));
    console.log(`✅ Servidor HTTP corriendo en puerto ${PORT}`);
    console.log(`💾 Estado DB: ${isDatabaseConnected ? 'Conectada' : 'Desconectada'}`);
    console.log('📝 Listo para recibir peticiones...\n');
  });
}

// Manejar cierre graceful del servidor
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  
  if (isDatabaseConnected && pool) {
    try {
      await pool.end();
      console.log('✅ Pool de conexiones cerrado');
    } catch (error) {
      console.error('❌ Error cerrando pool:', error);
    }
  }
  
  console.log('👋 Servidor cerrado exitosamente');
  process.exit(0);
});

// Manejar errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Inicializar servidor
initializeServer();

module.exports = server;