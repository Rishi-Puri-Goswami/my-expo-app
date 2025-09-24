import { Server } from "socket.io";
import cookie from "cookie"
import jwt from "jsonwebtoken"
import { Student } from "../modules/student.module.js";
import { Warden } from "../modules/warden.module.js";
import { Gatekeeper } from "../modules/gatekeeper.module.js";
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

  
io.use(async (socket, next) => {
  try {
    const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
    const token = cookies.token;
    if (!token) return next(new Error("Authentication error: No token provided"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) return next(new Error("Invalid token"));

    let finduser = null;
    if (decoded.role === "Student") finduser = await Student.findById(decoded.id);
    else if (decoded.role === "Warden") finduser = await Warden.findById(decoded.id);
    else if (decoded.role === "Gatekeeper") finduser = await Gatekeeper.findById(decoded.id);
    else return next(new Error("Invalid role"));

    if (!finduser) return next(new Error("User not found"));

    socket.user = finduser;

    // Save user -> socket mapping
    connectedUsers.set(finduser._id.toString(), socket.id);

    next();
  } catch (err) {
    console.error("Socket authentication error:", err);
    next(new Error("Authentication failed"));
  }
});





  io.on("connection", (socket) => {
    console.log("🔌 New client connected:", socket.id);
    console.log("user data" , socket.user);


  


socket.on("")









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
