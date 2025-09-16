-- Script para crear tabla de tokens de dispositivos
-- Ejecutar en MySQL

CREATE TABLE IF NOT EXISTS device_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  expoPushToken VARCHAR(255) NOT NULL,
  deviceInfo JSON,
  isActive BOOLEAN DEFAULT TRUE,
  lastUsed TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Índices para optimizar consultas
  INDEX idx_userId (userId),
  INDEX idx_expoPushToken (expoPushToken),
  INDEX idx_isActive (isActive),
  
  -- Clave foránea a usuarios
  FOREIGN KEY (userId) REFERENCES usuarios(idUsuario) ON DELETE CASCADE,
  
  -- Token único por usuario
  UNIQUE KEY unique_user_token (userId, expoPushToken)
);

-- Tabla para historial de notificaciones enviadas
CREATE TABLE IF NOT EXISTS notification_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  data JSON,
  type ENUM('community_message', 'system', 'other') DEFAULT 'other',
  status ENUM('sent', 'delivered', 'failed') DEFAULT 'sent',
  sentAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_userId (userId),
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_sentAt (sentAt),
  
  FOREIGN KEY (userId) REFERENCES usuarios(idUsuario) ON DELETE CASCADE
);

-- Insertar algunos datos de ejemplo (opcional)
-- INSERT INTO device_tokens (userId, expoPushToken, deviceInfo) VALUES 
-- (1, 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]', '{"platform": "ios", "version": "15.0", "brand": "iPhone", "model": "iPhone 13"}');

SELECT '✅ Tablas de notificaciones creadas exitosamente' as status;
