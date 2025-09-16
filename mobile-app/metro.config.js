// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Permitir peticiones HTTP en desarrollo
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
