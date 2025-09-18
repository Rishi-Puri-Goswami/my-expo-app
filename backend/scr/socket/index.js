import { Server } from "socket.io";
const connectedUsers = new Map();
let io;

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*", 
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"]
    }
  });

  io.on("connection", (socket) => {
    console.log("🔌 New client connected:", socket.id);

  








    socket.on("disconnect", () => {
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          break;
        }
      }
      console.log("❌ Client disconnected:", socket.id);
      io.emit("get_users", Array.from(connectedUsers.keys()));
    });
  });
}

export { initializeSocket, connectedUsers, io };
