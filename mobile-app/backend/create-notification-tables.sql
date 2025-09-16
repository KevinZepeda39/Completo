-- create-notification-tables.sql - Crear tablas para sistema de notificaciones push

-- Tabla para tokens de dispositivos
CREATE TABLE IF NOT EXISTS `device_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `deviceToken` varchar(500) NOT NULL,
  `platform` enum('ios','android','web') NOT NULL DEFAULT 'android',
  `deviceInfo` text,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `lastUsed` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_device` (`userId`, `deviceToken`),
  KEY `idx_userId` (`userId`),
  KEY `idx_deviceToken` (`deviceToken`),
  KEY `idx_isActive` (`isActive`),
  CONSTRAINT `fk_device_tokens_user` FOREIGN KEY (`userId`) REFERENCES `usuarios` (`idUsuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para historial de notificaciones enviadas
CREATE TABLE IF NOT EXISTS `notification_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `data` json,
  `sentAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('sent','delivered','failed','opened') NOT NULL DEFAULT 'sent',
  `platform` enum('ios','android','web') DEFAULT NULL,
  `deviceToken` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_userId` (`userId`),
  KEY `idx_sentAt` (`sentAt`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_notification_history_user` FOREIGN KEY (`userId`) REFERENCES `usuarios` (`idUsuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para logs de notificaciones de comunidad
CREATE TABLE IF NOT EXISTS `notification_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `communityId` int NOT NULL,
  `message` text NOT NULL,
  `totalMembers` int NOT NULL DEFAULT 0,
  `sentCount` int NOT NULL DEFAULT 0,
  `failedCount` int NOT NULL DEFAULT 0,
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_communityId` (`communityId`),
  KEY `idx_timestamp` (`timestamp`),
  CONSTRAINT `fk_notification_logs_community` FOREIGN KEY (`communityId`) REFERENCES `comunidad` (`idComunidad`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para preferencias de notificación por usuario
a ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar preferencias por defecto para usuarios existentes
INSERT IGNORE INTO `notification_preferences` (`userId`, `communityId`, `enabled`, `sound`, `vibration`, `showPreview`, `messageTypes`, `frequency`)
SELECT 
  u.idUsuario,
  NULL,
  1, -- enabled
  1, -- sound
  1, -- vibration
  1, -- showPreview
  '["text", "media", "admin", "system"]', -- messageTypes
  'immediate' -- frequency
FROM `usuarios` u
WHERE NOT EXISTS (
  SELECT 1 FROM `notification_preferences` np 
  WHERE np.userId = u.idUsuario AND np.communityId IS NULL
);

-- Insertar preferencias por defecto para comunidades existentes
INSERT IGNORE INTO `notification_preferences` (`userId`, `communityId`, `enabled`, `sound`, `vibration`, `showPreview`, `messageTypes`, `frequency`)
SELECT 
  uc.idUsuario,
  uc.idComunidad,
  1, -- enabled
  1, -- sound
  1, -- vibration
  1, -- showPreview
  '["text", "media", "admin", "system"]', -- messageTypes
  'immediate' -- frequency
FROM `usuario_comunidad` uc
WHERE NOT EXISTS (
  SELECT 1 FROM `notification_preferences` np 
  WHERE np.userId = uc.idUsuario AND np.communityId = uc.idComunidad
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS `idx_device_tokens_user_active` ON `device_tokens` (`userId`, `isActive`);
CREATE INDEX IF NOT EXISTS `idx_notification_history_user_time` ON `notification_history` (`userId`, `sentAt`);
CREATE INDEX IF NOT EXISTS `idx_notification_logs_community_time` ON `notification_logs` (`communityId`, `timestamp`);
CREATE INDEX IF NOT EXISTS `idx_notification_preferences_user_community` ON `notification_preferences` (`userId`, `communityId`);

-- Comentarios de las tablas
ALTER TABLE `device_tokens` COMMENT = 'Tokens de dispositivos para notificaciones push';
ALTER TABLE `notification_history` COMMENT = 'Historial de notificaciones enviadas';
ALTER TABLE `notification_logs` COMMENT = 'Logs de notificaciones de comunidad';
ALTER TABLE `notification_preferences` COMMENT = 'Preferencias de notificación por usuario y comunidad';
