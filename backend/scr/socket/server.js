import http from "http";
import app from "../app.js"; // Your Express app
import { initializeSocket, connectedUsers, io } from "./index.js";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const server = http.createServer(app);

// Initialize socket
initializeSocket(server);

server.listen(4000, '0.0.0.0', () => {
  console.log(`⚙️ Server running on http://0.0.0.0:4000`);
});

export { io, connectedUsers };
