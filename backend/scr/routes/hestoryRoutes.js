import express from "express"
import { verifyGatekeeperJwt } from "../middlewares/gatekeeper.middlewares.js";
import { hestorycontrol } from "../controllers/hestory.control.js";

const hestoryrouter = express.Router();
hestoryrouter.route("/hestory").get(verifyGatekeeperJwt , hestorycontrol);

export {hestoryrouter};

