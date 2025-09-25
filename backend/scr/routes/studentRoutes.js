import express from "express";
import { registerstudent, loginstudent, logoutstudent, refreshtoken, studentSendRequestToWarden, allwarden, getStudentById, checkStudentStatus, getingkey,history } from "../controllers/studentcontrol.js";
import { verifyjwt } from "../middlewares/auth.middlewares.js";

const studentRouter = express.Router();

studentRouter.route("/register").post(registerstudent);
studentRouter.route("/login").post(loginstudent);
studentRouter.route("/logout").get(verifyjwt, logoutstudent);
studentRouter.route("/refreshtoken").post(refreshtoken);
studentRouter.route("/allwarden").get(allwarden);
studentRouter.route("/request/:id").post(verifyjwt, studentSendRequestToWarden);
// studentRouter.route("/student/:id").get(verifyjwt, getStudentById);
studentRouter.route("/student").get(verifyjwt, getStudentById);

studentRouter.route("/status").get(verifyjwt, checkStudentStatus);
studentRouter.route("/getingkey").post(verifyjwt, getingkey);
studentRouter.route("/history").get(verifyjwt, history);

export { studentRouter };






