import express from "express";
import { verifyGatekeeperJwt } from "../../middlewares/gatekeeper.middlewares.js";
import { gatekeeperdata, loginGatekeeper, logoutGatekeeper, outgoingstudentdata, qrscane, refreshTokenGatekeeper, registerGatekeeper, visitorqrscane } from "../controllers/gatekeeper.control.js";

const gatekeeperrouter = express.Router();
gatekeeperrouter.route("/register").post( registerGatekeeper);
gatekeeperrouter.route("/loginGatekeeper").post( loginGatekeeper);
gatekeeperrouter.route("/logout").get(verifyGatekeeperJwt , logoutGatekeeper);
gatekeeperrouter.route("/refreshTokenGatekeeper").post(refreshTokenGatekeeper);

gatekeeperrouter.route("/qrcodescan").post(verifyGatekeeperJwt, qrscane);

gatekeeperrouter.route("/outside_student_data").get(verifyGatekeeperJwt , outgoingstudentdata );
gatekeeperrouter.route("/gatekeeperdata").get(verifyGatekeeperJwt , gatekeeperdata );
gatekeeperrouter.route("/visitorqrscane").post(verifyGatekeeperJwt , visitorqrscane );



export {gatekeeperrouter};


