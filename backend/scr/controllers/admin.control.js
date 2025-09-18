import brycpt from "bcrypt";
import { Admin } from "../modules/admin.module.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Student } from "../modules/student.module.js";
import { Gatekeeper } from "../modules/gatekeeper.module.js";
import { Warden } from "../modules/warden.module.js";
import { Hestory } from "../modules/gatekeeperhestory.js";


const adminregister = async (req , res) =>{
    
try {
    
    const {name , phoneno ,  email , password , role} =   req.body ;
console.log(req.body , "sldsld");
    if(!name || !phoneno || !email || !password ||!role ){
        return res.status(404).json({message : "all field are required"});
    }


    const checkadmin = await Admin.findOne({email});
     console.log(checkadmin , " sdmksdskd ");


    if(checkadmin){
        return res.status(200).json({message : "admin with this same email already exit"});
    }


 const hash = await bcrypt.hash(password , 10);


 
 if(!hash){
    return res.status(400).json({message : "error on hashing"})
 }

    const createadmin = await Admin.create({
        name ,
        email ,
        password :  hash ,
        role
    })
    

    if(!createadmin){
        return res.status(400).json({message : "error on create admin"});
    }


    
    return  res.status(200).json({message : "admin register successfully"});





} catch (error) {
    console.log("error on register ADMIN" , error);
}



};



const adminlogin = async (req, res) => {
  try {
    const { email, password } = req.body;


    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }


    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "No admin found with this email" });
    }

if(admin.role != "SuperAdmin"){
    return res.status(400).json({message : "invalid admin login"});
}

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

   
    const token = jwt.sign(
      { id: admin._id, role: "admin" }, 
      process.env.JWT_SERECT,
      { expiresIn: "1d" } 
    );

  
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    };


    res.cookie("token", token, options);

    return res.status(200).json({
      message: "Admin logged in successfully",
      token,
      admin: {
        id: admin._id,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("Error on login admin:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};




const registerstudent = async (req, res) => {
    try {
        console.log("Incoming Request:", req.body);

        const { name, phoneNo, email, password, collageYear, roomNo } = req.body;

        if (!name || !phoneNo || !email || !password || !collageYear || !roomNo) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const existingStudent = await Student.findOne({ $or: [{ email }, { phoneNo }] });
        if (existingStudent) {
            return res.status(400).json({ message: "User with this email or phone number already exists." });
        }



        const newStudent = await Student.create({
            name,
            phoneNo,
            email,
            password,
            collageYear,
            roomNo,

        });



        const createstudent = await Student.findById(newStudent._id).select("-password -refreshtoken");
        if (!createstudent) {
            return res.status(500).json({ message: "user not created " });

        }




        console.log("User created successfully:", createstudent);
        return res.status(201).json({ message: "User registered successfully", student: createstudent });
    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};




const registerGatekeeper = async (req, res) => {
    try {
        const { name, phoneNo, email, password } = req.body;

        if (!name || !phoneNo || !email || !password) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format." });
        }

        const existingGatekeeper = await Gatekeeper.findOne({ $or: [{ email }, { phoneNo }] });
        if (existingGatekeeper) {
            return res.status(400).json({ message: "Gatekeeper with this email or phone number already exists." });
        }

        const newGatekeeper = await Gatekeeper.create({ name, phoneNo, email, password });

        const createGatekeeper = await Gatekeeper.findById(newGatekeeper._id).select("-password -refreshtoken");
        return res.status(201).json({ message: "Gatekeeper registered successfully", gatekeeper: createGatekeeper });
    } catch (error) {
        console.error("Error creating gatekeeper:", error);
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};




const registerWarden = async (req, res) => {
    try {
        const { name, phoneNo, email, password } = req.body;
        if (!name || !phoneNo || !email || !password)
            return res.status(400).json({ message: "All fields are required." });

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email))
            return res.status(400).json({ message: "Invalid email format." });

        const existingWarden = await Warden.findOne({ $or: [{ email }, { phoneNo }] });
        if (existingWarden)
            return res.status(400).json({ message: "Warden with this email or phone number already exists." });

        const newWarden = await Warden.create({ name, phoneNo, email, password });
        const createWarden = await Warden.findById(newWarden._id).select("-password -refreshtoken");

        return res.status(201).json({ message: "Warden registered successfully", warden: createWarden });
    } catch (error) {
        console.error("Error creating warden:", error);
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};



const outgoingstudentdata = async (req ,res)=>{
   try {
     
const outstudent = await Student.find({gatepermission : "outside"})

if(!outstudent){
    return res.status(200).json({message : "no student are outside"});
}

return res.status(200).json({message : "live student data" , outstudent});

   } catch (error) {
    console.log("server error to fetch data: " , error);
   }

}




const getallstudent = async (req , res) => {
try {

    const {hostel} = req.params ;


    const findallstudent = await Student.find({hostel});
    if(!findallstudent){

return res.status(404).json({message : "student not found"});

    }

    return res.status(200).json({message : "student found" , findallstudent});
    

} catch (error) {
      console.log("error on get all student" , error);
}

}



const getstudenthestory = async ( req , res) =>{
try {
    

    const {studentid} = req.params ;

 if(!studentid){
return res.status(404).json({message : "student hestory not found"});
 }

 const findhestory = await Hestory.findOne({studentId:studentid});

 if(!findhestory){
    return res.status(400).json({message : "student hestory  not found"})
 }

return res.status(200).json({message : "student hestory  fouend" , findhestory});

} catch (error) {
    console.log("error on get student hestory" , error);
}
}


const deletewarden = async (req , res) => {
    try {
        
        const {wardenid} = req.params ;
         if(!wardenid){
            return res.status(404).json({message : "warden id not found"})
         }

         const deletewarden = await Warden.findByIdAndDelete(wardenid);
         
         if(!deletewarden){
            return res.status(400).json({message : "error on delete warden"})
         }

         return res.status(200).json({message : "warden deleate successfully" , deletewarden});



    } catch (error) {
        console.log("error on deletewarden" , error)
    }
}



const deletestudent = async (req, res) =>{
try {
    
    const {studentid} = req.params ;

    if(!studentid){
        return res.status(400).json({message : "student id not found "});
    }

    const deletestudent = await Student.findByIdAndDelete(studentid);

    if(!deletestudent){
        return res.status(400).json({message : "error on deleate successfully "})
    }

    return res.status(200).json({message : "student delete successfully" , deletestudent});



} catch (error) {
    console.log("error on delete student" , error)
}
}


const deletegatekeeper = async (req , res) =>{
    try {
    const {gatekeeperid} = req.params ;
    
    if(!gatekeeperid){
        return res.status(404).json({message : "gatekeeper not found"})
    }

    const deletegatekeeper = await Gatekeeper.findByIdAndDelete(gatekeeperid);
    if(!deletegatekeeper){
        return res.status(400).json({message : "error on delete the gatekeeper"});
    }

    return res.status(200).json({message : "gatekeeper delete successfully" , deletegatekeeper});
    
    } catch (error) {
        console.log("error on delete gatekeeper " , error  
        )
    }
}



export {deletegatekeeper , deletestudent , deletewarden , getallstudent , getstudenthestory ,  adminlogin , adminregister , registerGatekeeper , registerstudent , registerWarden , outgoingstudentdata}




