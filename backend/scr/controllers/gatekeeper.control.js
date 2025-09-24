import { Student } from "../modules/student.module.js";
import { Hestory } from "../modules/gatekeeperhestory.js";
import { Gatekeeper } from "../modules/gatekeeper.module.js";
import jwt from "jsonwebtoken";
import { Visitory } from "../modules/visitors.module.js";
import { VisitorHistory } from "../modules/visitorHestory.js";
import bcrypt from "bcryptjs";
import { connectedUsers, io } from "../socket/index.js";

const generateAccessAndRefreshTokenGatekeeper = async (gatekeeperId) => {
    try {
        const gatekeeper = await Gatekeeper.findById(gatekeeperId);
        if (!gatekeeper) {
            throw new Error("Gatekeeper not found");
        }

        const accesstoken = gatekeeper.generateAccessToken(); 
        const refreshtoken = gatekeeper.generateRefreshToken(); 
        gatekeeper.refreshtoken = refreshtoken;
        await gatekeeper.save({ validateBeforeSave: false });

        return { accesstoken, refreshtoken };
    } catch (error) {
        console.error("Error generating tokens for gatekeeper:", error);
        throw new Error(error.message || "Failed to generate tokens");
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



const loginGatekeeper = async (req, res) => {
    try {
        console.log("Gatekeeper login request");

        const { phoneNo, password } = req.body;
        console.log("phone:", phoneNo, "password:", password);

        if (!phoneNo || !password) {
            return res.status(200).json({ 
                message: "Phone number and password are required.", 
                status: 400 
            });
        }

        // Find gatekeeper by phone number
        const gatekeeper = await Gatekeeper.findOne({ phoneNo });
        if (!gatekeeper) {
            return res.status(200).json({ 
                message: "Invalid phone number or password.", 
                status: 401 
            });
        }

        // Validate password
        const isPasswordValid = await bcrypt.compare(password, gatekeeper.password);
        if (!isPasswordValid) {
            return res.status(200).json({ 
                message: "Invalid phone number or password.", 
                status: 401 
            });
        }

        // Generate JWT token
        if (!process.env.JWT_SERECT) {
            throw new Error("JWT_SERECT is not defined in env");
        }

        const token = jwt.sign(
            { id: gatekeeper._id , role : "Gatekeeper" },
            process.env.JWT_SERECT,
            { expiresIn: 10 * 24 * 60 * 60 } // 10 days in seconds
        );

        // Optionally exclude password before sending response
        const safeGatekeeper = await Gatekeeper.findById(gatekeeper._id).select("-password -refreshtoken");

        return res.status(200).json({ 
            message: "Gatekeeper successfully logged in", 
            status: 200, 
            token, 
            gatekeeper: safeGatekeeper 
        });

    } catch (error) {
        console.error("Gatekeeper login error:", error);
        return res.status(500).json({ 
            message: "Internal server error", 
            error: error.message 
        });
    }
};



const logoutGatekeeper = async (req, res) => {
    try {
        const gatekeeperId = req.gatekeeper._id;

        const gatekeeper = await Gatekeeper.findById(gatekeeperId);
        if (!gatekeeper) {
            return res.status(401).json({ message: "Gatekeeper not found" });
        }

        gatekeeper.refreshtoken = undefined;
        await gatekeeper.save({ validateBeforeSave: false });

        const options = {
            httpOnly: true,
            secure: true,
            sameSite: "Strict"
        };

        res.clearCookie("accesstoken", options);
        res.clearCookie("refreshtoken", options);

        return res.status(200).json({ message: "Logout successful." });
    } catch (error) {
        console.error("Error during logout:", error);
        return res.status(500).json({ message: "Internal Server Error", details: error.message });
    }
};


const refreshTokenGatekeeper = async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshtoken || req.body.refreshtoken;

        if (!incomingRefreshToken) {
            return res.status(401).json({ message: "Unauthorized request" });
        }

        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const gatekeeper = await Gatekeeper.findById(decodedToken._id);

        if (!gatekeeper) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        if (incomingRefreshToken !== gatekeeper.refreshtoken) {
            return res.status(400).json({ message: "Token was expired or reused." });
        }

        const { accesstoken: newAccessToken, refreshtoken: newRefreshToken } = await generateAccessAndRefreshTokenGatekeeper(gatekeeper._id);

        const options = {
            httpOnly: true,
            secure: true,
            sameSite: "Strict"
        };

        return res.status(200)
            .cookie("accesstoken", newAccessToken, options)
            .cookie("refreshtoken", newRefreshToken, options)
            .json({ message: "Access token refreshed", newAccessToken, refreshtoken: newRefreshToken });
    } catch (error) {
        console.error("Error refreshing token:", error);
        return res.status(500).json({ message: "Internal Server Error", details: error.message });
    }
};



const qrscane = async (req, res) => {

  try {
    const {  key } = req.body;
    const Gatekeeperid = req.gatekeeper._id;
    console.log(key , Gatekeeperid , "all data");




    if (!key) {
      return res.status(200).json({ message: "Student ID and security key are required." });
    }

    if (!Gatekeeperid) {
      return res.status(200).json({ message: "Gatekeeper not found" });
    }
  
    const student = await Student.findOne({key}).select('-password -email');

    if (!student) {
      return res.status(200).json({ message: "Student not found." });
    }

    if (student.key !== key) {
      return res.status(200).json({ message: "Invalid QR code" });
    }

    if (student.permission !== "accepted") {
      return res.status(200).json({ message: "Student does not have permission to go out" });
    }

    const gatekeeper = await Gatekeeper.findById(Gatekeeperid).select('-password');
    if (!gatekeeper) {
      return res.status(200).json({ message: "Gatekeeper not found." });
    }

    
    if (student.gatepermission === "inside") {
      student.gatepermission = "outside";
      student.outgoingtime = new Date();
      gatekeeper.gooutstudent.push(student._id);

      await Promise.all([
        student.save({ validateBeforeSave: false }),
        gatekeeper.save({ validateBeforeSave: false })
      ]);


          const studentSocketId = connectedUsers.get(student._id.toString());
      if (studentSocketId) {
        io.to(studentSocketId).emit("qr_status", {
          status: "outside",
          message: "✅ QR scanned — you can go out now.",
        });
      }



      return res.status(200).json({ message: "Student can go out" });
    }
    
    
    if (student.gatepermission === "outside") {
      
      await Hestory.create({
        studentId: student._id,
        studentname: student.name,
        studentphoneNO: student.phoneNo,
        studentcollegeyear: student.collageYear,
        studentwardenname: student.wardenname,
        studentdestination: student.destination,
        studentgoouttime: student.outgoingtime,
        studentcomeintime: new Date(),
        gatekeeperId: Gatekeeperid
      });


      
   
      student.wardenname = "none";
      student.wardenid = null;
      student.permission = "none";
      student.destination = "nothing";
      student.gatepermission = "inside";
      student.key = "none";
      student.outgoingtime = null;

     
      gatekeeper.gooutstudent.pull(student._id);

      await Promise.all([
        student.save({ validateBeforeSave: false }),
        gatekeeper.save({ validateBeforeSave: false })
      ]);


        const studentSocketId = connectedUsers.get(student._id.toString());
      if (studentSocketId) {
        io.to(studentSocketId).emit("qr_status", {
          status: "inside",
          message: "✅ QR scanned — you are back inside.",
        });
      }


      return res.status(200).json({ message: "Student can come in" });
    }

    return res.status(400).json({ message: "Invalid student status" });

  } catch (error) {
    console.error("Error during QR scan:", error);
    return res.status(500).json({ message: "Server error during QR scan." });
  }
};



const outgoingstudentdata = async (req ,res)=>{
   try {
     const Gatekeeperid = req.gatekeeper._id;
 
 const gatekeeper = await Gatekeeper.findById(Gatekeeperid) .populate({
                 path: 'gooutstudent',
                 gatepermission: { permission: 'outside' },
                 select: 'name phoneNo email collageYear roomNo destination permission wardenname permission gatepermission outgoingtime'
             });

             
 
 if(!gatekeeper){
     return res.status(404).json({message : "gatekeeper not found"});
 }
 
 
 
 const gooutstudent = gatekeeper.gooutstudent.filter(request => request !== null);
 
 return res.status(200).json({
     message: "gooutstudent data fetch successfully ",
     gooutstudent: gooutstudent
 });
   } catch (error) {
    console.log("server error to fetch data: " , error);
   }

}


const gatekeeperdata = async (req , res) =>{
try {
    
    
        const gatekeeperid = req.gatekeeper._id
    
    
    const gatekeeper = await Gatekeeper.findById(gatekeeperid).select('-password');
    
    
    if(!gatekeeper){
      return res.status(200).json({status:404 , message : "gatekeeper was not found"})
    }
    
    return res.status(200).json({message:"gatekeeper details found " , gatekeeper :gatekeeper })
    
    
} catch (error) {
    console.log("error from server during find gatekeeper datils :" , error);
}

}


const visitorqrscane = async (req, res) => {
  try {
                                                    
    const { QRkey } = req.body;
    const Gatekeeperid = req.gatekeeper._id;

    if (!QRkey) {
      return res.status(200).json({ message: "QR key is required" });
    }

    const findvisitor = await Visitory.findOne({ QRkey });

    if (!findvisitor) {
      return res.status(200).json({ message: "invalid qrkey" });
    }

    if (findvisitor.isactive === false) {
      findvisitor.isactive = true;
      await findvisitor.save({ validateBeforeSave: false });

      const gatekeeper = await Gatekeeper.findById(Gatekeeperid);
      gatekeeper.invisitor.push(findvisitor._id);
      await gatekeeper.save();

      return res.status(200).json({ message: "Visitor entered the college" });
    } 

 
    if (findvisitor.isactive === true) {
      findvisitor.isactive = false;
      await findvisitor.save({ validateBeforeSave: false });

      const outtime = new Date();

     
      const historyData = findvisitor.groupmember.map((member) => ({
        visitorname: member.name,
        visitorphoneno: member.phoneno,
        visitorage: member.age,
        visitorrelation: member.relation,
        intime: findvisitor.intime,
        outtime
      }));

      await VisitorHistory.insertMany(historyData);

      const gatekeeper = await Gatekeeper.findById(Gatekeeperid);
      gatekeeper.invisitor.pull(findvisitor._id);
      await gatekeeper.save();

      await Visitory.findByIdAndDelete(findvisitor._id);

 const option = {
               
                secure: true,
                sameSite: "none",
                maxAge: 10 * 24 * 60 * 60 * 1000
            };

        res.clearCookie("visitor", option);




      return res.status(200).json({ message: "Visitor exited the college" , status : 300 });
    }
  } catch (error) {
    console.log("Error during visitor QR scan:", error);
    return res.status(500).json({ message: "Server error during QR scan" });
  }
};

export { 
    qrscane, gatekeeperdata , outgoingstudentdata, registerGatekeeper, loginGatekeeper, logoutGatekeeper, refreshTokenGatekeeper ,visitorqrscane
};






