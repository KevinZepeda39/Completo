const config = {
  API_URL: __DEV__
    ? 'http://192.168.1.13:3000' // URL de desarrollo local
    : 'https://api.miciudadsv.com', // Production URL
  TIMEOUT: 10000, // 10 segundos de timeout
  RETRY_ATTEMPTS: 3, // Intentos de reintento
};

export default config;
