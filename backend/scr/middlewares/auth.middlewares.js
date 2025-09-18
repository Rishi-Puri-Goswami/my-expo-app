import jwt from "jsonwebtoken"
import { Student } from "../modules/student.module.js";
    
const verifyjwt = async (req ,res , next)=>{
  try {
    const tokenform = req.headers?.authorization;


    if(!tokenform){
        return res.status(401).json({ 
            message: "Unauthorized: No token provided",
            details: "Please login to access this resource"
        });
    }



    const token = tokenform.split(" ")[1];

    console.log(token , "tokenskdnskndsk ")

console.log(  "after the token check" , token )
 


    const decode = await jwt.verify(token, process.env.JWT_SERECT);

    console.log(decode , "decoded");

if(!decode){
    return res.status(404).json({message : "no token found"})
}

    const student = await Student.findById(decode.id).select("-password -refreshtoken");
    if(!student){
        return res.status(401).json({ 
            message: "Student not found",
            details: "The student associated with this token no longer exists"
        });
    }



    req.student = student;
    console.log(req.student._id)
    next();


  } catch (error) {
    console.error("Error in student auth middleware:", error);
    
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
            message: "Invalid token",
            details: "The provided token is invalid"
        });   
    }
    
    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
            message: "Token expired",
            details: "Please login again to get a new token"
        });
    }

    return res.status(500).json({ 
        message: "Internal Server Error",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export {verifyjwt};