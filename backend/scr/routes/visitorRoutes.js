import express from "express"
import { getvisitor, visitorcomein } from "../controllers/visitory.control.js";

const visitorrouter = express.Router();

visitorrouter.route("/visitorcomein").post(visitorcomein);
visitorrouter.route("/getvisitor").get(getvisitor);

export {visitorrouter};


