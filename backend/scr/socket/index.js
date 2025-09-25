import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { Student } from "../modules/student.module.js";
import { Warden } from "../modules/warden.module.js";
import { Gatekeeper } from "../modules/gatekeeper.module.js";
import cookie from "cookie"
import dotenv from "dotenv"

dotenv.config({
  path : "../../.env"
})




const connectedUsers = new Map();
let io;

function initializeSocket(server) {
  console.log("Initializing Socket.IO...");

  io = new Server(server, {
    cors: {
      origin: "*", // You can restrict it to your frontend URL
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
  });

  
  // Middleware to authenticate socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token ;
      if (!token) return next(new Error("Authentication error: No token provided"));
console.log(token , "token smdsmdos");

console.log(process.env.JWT_SERECT  , "rocess.env.JWT_SECRET")

      const decoded = jwt.verify(token, process.env.JWT_SERECT);
      if (!decoded) return next(new Error("Invalid token"));

      let finduser = null;
      if (decoded.role === "Student") finduser = await Student.findById(decoded.id);
      else if (decoded.role === "Warden") finduser = await Warden.findById(decoded.id);
      else if (decoded.role === "Gatekeeper") finduser = await Gatekeeper.findById(decoded.id);
      else return next(new Error("Invalid role"));

      if (!finduser) return next(new Error("User not found"));

      socket.user = finduser;
      connectedUsers.set(finduser._id.toString(), socket.id);

      next();
    } catch (err) {
      console.error("Socket authentication error:", err);
      next(new Error("Authentication failed"));
    }
  });

  // Socket connection
  io.on("connection", (socket) => {
    console.log("🔌 New client connected:", socket.id);
    console.log("User data:", socket.user);

    // Example event listener
    socket.on("outpass_permission", (data) => {
      console.log("Permission event received:", data);
    });

    // Disconnect handling
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
