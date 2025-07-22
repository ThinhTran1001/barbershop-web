// back-end/services/socket.service.js
const { Server } = require("socket.io");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const userId = socket.handshake.auth.userId;
    if (userId) {
      socket.userId = userId;
      next();
    } else {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("joinRoom", (userId, role) => {
      if (!userId) {
        console.error("User ID is required to join room");
        return;
      }
      socket.join(userId);
      console.log(`${role === 'admin' ? 'Admin' : 'User'} ${userId} joined room ${userId}`);
      if (role === 'admin') {
        io.to(userId).emit("updateRooms", Object.keys(io.sockets.adapter.rooms).filter(r => r !== userId));
      }
    });

    socket.on("sendMessage", (data, callback) => {
      const { roomId, senderId, text, senderRole } = data;
      if (!roomId || !senderId || !text || !senderRole) {
        console.error("Missing required fields:", { roomId, senderId, text, senderRole });
        if (callback) callback({ error: "Missing required fields: roomId, senderId, text, or senderRole" });
        return;
      }

      const message = {
        roomId,
        senderId,
        text,
        timestamp: new Date(),
        senderRole,
      };
      try {
        const ChatMessage = require("../models/chatMessage.model");
        ChatMessage.create(message).then(() => {
          io.to(roomId).emit("receiveMessage", message);
          if (senderRole === 'admin') {
            io.emit("updateRooms", Object.keys(io.sockets.adapter.rooms).filter(r => r !== senderId));
          }
          if (callback) callback({ success: true });
        }).catch((err) => {
          console.error("Error saving message:", err);
          if (callback) callback({ error: "Failed to save message" });
        });
      } catch (err) {
        console.error("Error saving message:", err);
        if (callback) callback({ error: "Failed to save message" });
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

module.exports = { initSocket };