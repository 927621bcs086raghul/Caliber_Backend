require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize, connectDB } = require('./config/db');

const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/video');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect Database
connectDB();

// Sync models with DB (dev-friendly)
sequelize
  .sync()
  .then(() => console.log('Database synced'))
  .catch((err) => console.error('Sync error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Caliber API is running' });
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
