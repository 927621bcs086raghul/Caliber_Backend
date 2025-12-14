/**
 * Centralized Environment Configuration
 */

require('dotenv').config();

const requiredEnvVars = ['JWT_SECRET'];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

const config = {
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT) || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },

  // Database Configuration
  database: {
    name: process.env.DB_NAME || 'caliber',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging: process.env.DB_LOGGING === 'true',
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    cookieName: process.env.JWT_COOKIE_NAME || 'token',
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100MB
    allowedVideoTypes: ['video/mp4', 'video/mpeg', 'video/quicktime'],
    allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
  },

  // API Documentation
  swagger: {
    enabled: process.env.SWAGGER_ENABLED !== 'false',
    url: process.env.API_DOCS_URL || 'http://localhost:5000',
  },

  // Socket.IO Configuration
  socketIO: {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
    },
  },

  // Security Configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  },
};

// Log configuration in development
if (config.server.isDevelopment) {
  console.log('📋 Configuration loaded:', {
    environment: config.server.nodeEnv,
    port: config.server.port,
    database: config.database.name,
    dbHost: config.database.host,
    jwtConfigured: !!config.jwt.secret,
    corsOrigin: config.cors.origin,
  });
}

module.exports = config;