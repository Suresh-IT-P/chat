require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const pool = require('./config/db');
const { setupSocket } = require('./sockets/index');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/games', require('./routes/games'));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Initialize database tables
async function initDatabase() {
  try {
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    const conn = await pool.getConnection();
    try {
      conn.query(schema);
    } catch (err) {
      console.warn('Schema warning:', err.message);
    }
    conn.release();
    console.log('✅ Database tables initialized');
  } catch (err) {
    console.error('❌ Database init error:', err.message);
  }
}

// Setup Socket.IO
const io = setupSocket(server);

// Start server
const PORT = process.env.PORT || 3000;

async function start() {
  await initDatabase();
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 ChatApp server running on http://0.0.0.0:${PORT}`);
    console.log(`📱 Open in browser to start chatting!\n`);
  });
}

start();
