
import http from "http";
import app from "../app.js";
import { initializeSocket, connectedUsers, io } from "./index.js";

const server = http.createServer(app);

initializeSocket(server); 

server.listen(4000, '0.0.0.0', () => {
  console.log(`⚙️ Server running on http://10.105.1.152:4000`);
});

export { io, connectedUsers };







