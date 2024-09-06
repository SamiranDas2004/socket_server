const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Create an Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Get the PORT from the environment or use 3001 for local development
const PORT = process.env.PORT || 3001;

// Configure Socket.io and CORS for security in production
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',  // In production, set FRONTEND_URL to your frontend domain
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',  // Same as above for CORS in express
}));
app.use(express.json());

const activeUsers = {};
console.log("active users", activeUsers);

// Socket connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // When a user joins a room
  socket.on('joinRoom', (email) => {
    activeUsers[email] = socket.id;
    console.log(`${email} joined with socket ID ${socket.id}`);
    console.log('Active users:', activeUsers);
  });

  // When a user sends a message
  socket.on('sendMessage', ({ fromUser, toUser, message }) => {
    const toSocketId = activeUsers[toUser];

    if (toSocketId) {
      io.to(toSocketId).emit('receiveMessage', { fromUser, message });
    } else {
      console.log('User not found or not connected:', toUser);
    }
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    for (const email in activeUsers) {
      if (activeUsers[email] === socket.id) {
        delete activeUsers[email];
        break;
      }
    }
    console.log('A user disconnected:', socket.id);
    console.log('Active users:', activeUsers);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
});
