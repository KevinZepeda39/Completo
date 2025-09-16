// backend/utils/passwordUtils.js
// Utilidades para manejo seguro de contraseñas

const bcrypt = require('bcrypt');

// Configuración de bcrypt
const SALT_ROUNDS = 12; // Número de rondas de salt (más alto = más seguro pero más lento)

/**
 * Hashea una contraseña usando bcrypt
 * @param {string} password - Contraseña en texto plano
 * @returns {Promise<string>} - Contraseña hasheada
 */
async function hashPassword(password) {
  try {
    if (!password || typeof password !== 'string') {
      throw new Error('Contraseña inválida');
    }
    
    console.log('🔐 Hashing password with bcrypt...');
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    console.log('✅ Password hashed successfully');
    
    return hashedPassword;
  } catch (error) {
    console.error('❌ Error hashing password:', error);
    throw new Error('Error al procesar la contraseña');
  }
}

/**
 * Verifica una contraseña contra su hash
 * @param {string} password - Contraseña en texto plano a verificar
 * @param {string} hashedPassword - Contraseña hasheada almacenada
 * @returns {Promise<boolean>} - true si la contraseña es correcta
 */
async function verifyPassword(password, hashedPassword) {
  try {
    if (!password || !hashedPassword) {
      console.log('⚠️ Missing password or hash for verification');
      return false;
    }
    
    console.log('🔍 Verifying password with bcrypt...');
    const isValid = await bcrypt.compare(password, hashedPassword);
    console.log('✅ Password verification result:', isValid);
    
    return isValid;
  } catch (error) {
    console.error('❌ Error verifying password:', error);
    return false;
  }
}

/**
 * Verifica si una contraseña ya está hasheada
 * @param {string} password - Contraseña a verificar
 * @returns {boolean} - true si ya está hasheada
 */
function isPasswordHashed(password) {
  if (!password || typeof password !== 'string') {
    return false;
  }
  
  // Las contraseñas hasheadas con bcrypt tienen un formato específico
  // Comienzan con $2b$ o $2a$ y tienen una longitud específica
  return /^\$2[ab]\$\d{1,2}\$/.test(password);
}

/**
 * Migra contraseñas existentes sin hash a bcrypt
 * @param {string} plainPassword - Contraseña en texto plano
 * @returns {Promise<string>} - Contraseña hasheada
 */
async function migratePassword(plainPassword) {
  try {
    if (isPasswordHashed(plainPassword)) {
      console.log('ℹ️ Password already hashed, no migration needed');
      return plainPassword;
    }
    
    console.log('🔄 Migrating plain password to bcrypt...');
    const hashedPassword = await hashPassword(plainPassword);
    console.log('✅ Password migration completed');
    
    return hashedPassword;
  } catch (error) {
    console.error('❌ Error migrating password:', error);
    throw new Error('Error al migrar la contraseña');
  }
}

/**
 * Valida la fortaleza de una contraseña
 * @param {string} password - Contraseña a validar
 * @returns {object} - Objeto con información de fortaleza
 */
function validatePasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      score: 0,
      issues: ['La contraseña es requerida']
    };
  }
  
  const issues = [];
  let score = 0;
  
  // Longitud mínima
  if (password.length < 8) {
    issues.push('Debe tener al menos 8 caracteres');
  } else if (password.length >= 12) {
    score += 2;
  } else {
    score += 1;
  }
  
  // Caracteres especiales
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    issues.push('Incluir caracteres especiales mejora la seguridad');
  }
  
  // Números
  if (/\d/.test(password)) {
    score += 1;
  } else {
    issues.push('Incluir números mejora la seguridad');
  }
  
  // Mayúsculas y minúsculas
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score += 1;
  } else {
    issues.push('Incluir mayúsculas y minúsculas mejora la seguridad');
  }
  
  // Contraseñas comunes (lista básica)
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    issues.push('Esta contraseña es muy común, elige algo más único');
    score = Math.max(0, score - 2);
  }
  
  const isValid = score >= 3 && password.length >= 8;
  
  return {
    isValid,
    score: Math.min(score, 5),
    issues,
    strength: score < 2 ? 'Muy débil' : 
              score < 3 ? 'Débil' : 
              score < 4 ? 'Regular' : 
              score < 5 ? 'Buena' : 'Excelente'
  };
}

module.exports = {
  hashPassword,
  verifyPassword,
  isPasswordHashed,
  migratePassword,
  validatePasswordStrength,
  SALT_ROUNDS
};
