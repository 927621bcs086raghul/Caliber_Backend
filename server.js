require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { sequelize, connectDB } = require('./config/db');

const authRoutes = require('./routes/auth');
const createVideoRouter = require('./routes/video');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
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
        url: 'http://localhost:5000',
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
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect Database
connectDB();

// Sync models with DB (dev-friendly)
sequelize
  .sync()
  .then(() => console.log('Database synced'))
  .catch((err) => console.error('Sync error:', err));

// Socket.IO events
io.on('connection', (socket) => {
  console.log('Client connected', socket.id);

  // Join a room (e.g., dashboard, specific user, etc.)
  socket.on('joinRoom', (room) => {
    socket.join(room);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
  });
});

// Attach io to app so routes can emit events
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', createVideoRouter(io));

app.get('/', (req, res) => {
  res.json({ message: 'Caliber API is running' });
});

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
