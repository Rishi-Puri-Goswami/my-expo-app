import express from "express";
import { handleStudentRequest, loginWarden, logoutWarden, refreshTokenWarden, registerWarden, getPendingRequests } from "../controllers/wardencontrole.js";
import { verifyWardenJwt } from "../middlewares/warden.middlewares.js";

const wardenRouter = express.Router();

wardenRouter.route("/register").post(registerWarden);
wardenRouter.route("/login").post(loginWarden);
wardenRouter.route("/logout").get(verifyWardenJwt, logoutWarden);
wardenRouter.route("/refreshTokenWarden").post(refreshTokenWarden);

wardenRouter.route("/handle-request/:studentId").post(verifyWardenJwt, handleStudentRequest);
wardenRouter.route("/requests").get(verifyWardenJwt, getPendingRequests);

export { wardenRouter };









