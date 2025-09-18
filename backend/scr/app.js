import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import dbconnect from "./db/databseConnect.js";
import cookieParser from "cookie-parser";
import { studentRouter } from "./routes/studentRoutes.js";
import {wardenRouter} from "./routes/wardenRoutes.js";
import { gatekeeperrouter } from "./routes/gatekeeperRoutes.js";
import { hestoryrouter } from "./routes/hestoryRoutes.js";
import { visitorrouter } from "./routes/visitorRoutes.js";
import adminrouter from "./routes/adminroute.js";

dotenv.config({ path: "./.env" });

const app = express();

app.use(cookieParser());

app.use(express.json());


app.use(cors({
 origin: '*' ,
  credentials: true,
}));



dbconnect()
    .then(() => {
        app.on("error", (error) => {
            console.log(`Server is not talking: ${error}`);
            throw error;
        });
    })
    .catch((error) => {
        console.error(`Error from app.js:::-> ${error}`);
    });

app.use("/user", studentRouter);
app.use("/warden", wardenRouter);
app.use("/gatekeeper", gatekeeperrouter );
app.use("/student/hestory", hestoryrouter );
app.use("/visiter" , visitorrouter)
app.use("/admin" , adminrouter)



export default app;










































