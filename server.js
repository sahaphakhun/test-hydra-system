require('dotenv').config();
const express = require('express');
const http = require('http');
const next = require('next');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server: SocketIOServer } = require('socket.io');

// นำเข้า API routes และ config จาก backend ที่ build แล้ว
const automationRoutes = require('./line-automation-api/dist/routes/automationRoutes').default;
const accountRoutes = require('./line-automation-api/dist/routes/accountRoutes').default;
const { setSocketIO } = require('./line-automation-api/dist/controllers/automationController');
const { SERVER_CONFIG, DB_CONFIG, SOCKET_CONFIG } = require('./line-automation-api/dist/config');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: path.join(__dirname, 'line-automation-ui') });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const serverApp = express();
  const server = http.createServer(serverApp);

  // ตั้งค่า Socket.IO
  const io = new SocketIOServer(server, {
    cors: {
      origin: SOCKET_CONFIG.CORS_ORIGIN,
      methods: ['GET', 'POST'],
    },
  });
  setSocketIO(io);

  // Middleware
  serverApp.use(express.json());
  serverApp.use(cors({ origin: SERVER_CONFIG.CORS_ORIGIN }));

  // API routes
  serverApp.use('/api', automationRoutes);
  serverApp.use('/api', accountRoutes);

  // Next.js pages & assets
  serverApp.all('*', (req, res) => handle(req, res));

  // เชื่อมต่อ MongoDB
  mongoose
    .connect(process.env.MONGO_URL || DB_CONFIG.MONGODB_URI)
    .then(() => {
      console.log('เชื่อมต่อกับ MongoDB สำเร็จ');
      server.listen(process.env.PORT || SERVER_CONFIG.PORT, () => {
        console.log(`> Ready on http://localhost:${process.env.PORT || SERVER_CONFIG.PORT}`);
      });

      io.on('connection', (socket) => {
        console.log('Client เชื่อมต่อ Socket.IO: ' + socket.id);
        socket.emit('connection', {
          type: 'connection',
          message: 'Connection to status server established.',
        });
        socket.on('disconnect', () => {
          console.log('Client ตัดการเชื่อมต่อ Socket.IO: ' + socket.id);
        });
      });
    })
    .catch((error) => {
      console.error('เกิดข้อผิดพลาดในการเชื่อมต่อกับ MongoDB:', error);
      process.exit(1);
    });
}); 