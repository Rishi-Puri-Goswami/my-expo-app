import jwt from "jsonwebtoken";
import { Warden } from "../modules/warden.module.js"; 

const verifyWardenJwt = async (req, res, next) => {
    try {


        // Get token from cookies or Authorization header
        const tokenn =  req.headers?.authorization;;
console.log("user token",tokenn);
        if (!tokenn) {
            return res.status(401).json({ 
                message: "Unauthorized: No token provided",
                details: "Please login to access this resource"
            });
        }


            const token = tokenn.split(" ")[1];
console.log(token);

console.log(process.env.JWT_SERECT , "process.env.JWT_SERECT");



        if (!process.env.JWT_SERECT) {
          return res.status(200).json({message : "jwt serect define"});
        }

   
        const decode = jwt.verify(token, process.env.JWT_SERECT);

        console.log("decoded token" , decode);

        // Find warden and validate
        const warden = await Warden.findById(decode.id).select("-password -refreshtoken");
        if (!warden) {
            return res.status(200).json({ 
                message: "Warden not found",
                details: "The warden associated with this token no longer exists"
            });
        }

        // Attach warden to request
        req.warden = warden;
        console.log("complete")
        next();

    } catch (error) {
        console.error("Error in warden auth middleware:", error);


        // return res.status(500).json({ 
        //     message: "Internal Server Error",
        //     details: process.env.NODE_ENV === 'development' ? error.message : undefined
        // });
    }
};

export { verifyWardenJwt };
