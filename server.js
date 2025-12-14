const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./config/env');
const { sequelize, connectDB } = require('./config/db');

const authRoutes = require('./routes/auth');
const createVideoRouter = require('./routes/video');

const app = express();
const server = http.createServer(app);
const io = new Server(server, config.socketIO);

// Middleware
app.use(cors(config.cors));
app.use(express.json());
app.use(cookieParser());

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Caliber Backend API',
      version: '1.0.0',
      description: 'API documentation for Caliber video platform',
    },
    servers: [
      {
        url: config.swagger.url,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
if (config.swagger.enabled) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(`📚 API Documentation: ${config.swagger.url}/api-docs`);
}

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, config.upload.uploadDir)));

// Connect Database
connectDB();

// Sync models with DB (dev-friendly). alter:true updates existing tables.
sequelize
  .sync({ alter: true })
  .then(() => console.log('Database synced'))
  .catch((err) => console.error('Sync error:', err));

io.on('connection', (socket) => {
  console.log('Client connected', socket.id);

  socket.on('joinRoom', (room) => {
    socket.join(room);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
  });
});

app.set('io', io);

app.use('/api/auth', authRoutes);
app.use('/api/videos', createVideoRouter(io));

app.get('/', (req, res) => {
  res.json({
    message: 'Caliber API is running',
    environment: config.server.nodeEnv,
    version: '1.0.0'
  });
});

server.listen(config.server.port, () => {
  console.log(`Server started on port ${config.server.port}`);
  console.log(`Environment: ${config.server.nodeEnv}`);
  console.log(`CORS Origin: ${config.cors.origin}`);
});
