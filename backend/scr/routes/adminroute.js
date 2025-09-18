import express from "express";
import { adminlogin, adminregister, deletegatekeeper, deletestudent, deletewarden, getallstudent, getstudenthestory, registerWarden } from "../controllers/admin.control.js";
import { registerstudent } from "../controllers/studentcontrol.js";
import { outgoingstudentdata, registerGatekeeper } from "../controllers/gatekeeper.control.js";
const adminrouter = express.Router();

adminrouter.route("/register").post(adminregister);
adminrouter.route("/login").post(adminlogin);
adminrouter.route("/registerstudent").post(registerstudent);
adminrouter.route("/registerGatekeeper").post(registerGatekeeper);
adminrouter.route("/registerWarden").post(registerWarden);
adminrouter.route("/outgoingstudentdata").post(outgoingstudentdata);
adminrouter.route("/getallstudent/:hostel").get(getallstudent);
adminrouter.route("/getstudenthestory/:studentid").get(getstudenthestory);
adminrouter.route("/deletewarden/:wardenid").post(deletewarden);
adminrouter.route("/deletestudent/:studentid").post(deletestudent);
adminrouter.route("/deletegatekeeper/:gatekeeperid").post(deletegatekeeper);

export default adminrouter ;



