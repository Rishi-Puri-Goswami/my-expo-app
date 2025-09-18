import { Student } from "../modules/student.module.js";
import jwt from "jsonwebtoken"
import { Warden } from "../modules/warden.module.js";
import { Hestory } from "../modules/gatekeeperhestory.js";
import { connectedUsers, io } from "../socket/index.js";


const generateAccessAndRefereshToken = async (studentid) => {
    try {
        const student = await Student.findById(studentid);
        if (!student) {
            throw new Error("Student not found");
        }
        const accesstoken = student.GenerateAccessToken();
        const refreshtoken = student.GenerateRefreshToken();

        student.refreshtoken = refreshtoken;
        await student.save({ validateBeforeSave: false });
        return { accesstoken, refreshtoken };
    } catch (error) {
        console.error("Error during generating token:", error);
        throw error;
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



const loginstudent = async (req, res) => {
    try {

        console.log("request")
        const { phoneNo, password } = req.body;

        console.log(phoneNo , password)

        if (!phoneNo || !password) {
            return res.status(200).json({ message: "Phone number and password are required." });
        }



        const student = await Student.findOne({ phoneNo });
        if (!student) {
            return res.status(200).json({ message: "Invalid phone number or password." });
        }

        const passwordvalid = await student.isPasswordCorrect(password);

        if (!passwordvalid) {
            return res.status(200).json({ message: "Invalid phone number or password." });
        }

      
        const loginstudent = await Student.findById(student._id).select("-password");

if(!loginstudent){
    return res.status(404).json({message : "student failed to login " , status : 404});
}

    
       const token = jwt.sign(
  { id: loginstudent._id },
  process.env.JWT_SERECT,
  { expiresIn: 10 * 24 * 60 * 60 } // 10 days in seconds
);


        return res.status(200).json({message : "student successfully login" , status : 200 , token});




    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};



const logoutstudent = async (req, res) => {
    try {

        const studentid = req.student._id;

        if (!studentid) {
            return res.status(401).json({ message: "student not found" });

        }



        const student = await Student.findById(studentid);

        if (!student) {
            return res.status(400).json({ message: "Invalid refresh token." });
        }


        student.refreshtoken = undefined;
        await student.save({ validateBeforeSave: false });

        const options = {
            httpOnly: true,
            secure: true,
            sameSite: "Strict",
        };

        res.clearCookie("accesstoken", options);
        res.clearCookie("refreshtoken", options);

        return res.status(200).json({ message: "Logout successful." });
    } catch (error) {
        console.error("Error during logout:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const refreshtoken = async (req, res) => {

    try {
        const incomingrefreshtoken = req.cookies.refreshtoken || req.body.refreshtoken

        if (!incomingrefreshtoken) {
            return res.status(401).json({ message: "unauthorize request :" })
        }


        const decodetoken = jwt.verify(incomingrefreshtoken, process.env.REFRESH_TOKEN_SECRET);
        const student = await Student.findById(decodetoken?._id)

        if (!student) {
            return res.status(401).json({ message: "invalid refreshtoken" })
        }

        if (incomingrefreshtoken !== student?.refreshtoken) {
            return res.status(400).json({ message: "token was expire or used :" })
        }

        const option = {
            httpOnly: true,
            secure: true
        }

        const { accesstoken: newaccesstoken, refreshtoken: newrefreshtoken } = await generateAccessAndRefereshToken(student._id);

        return res.status(200).cookie("accesstoken", newaccesstoken, option).cookie("refreshtoken", newrefreshtoken, option).json({ message: "Access token refreshed", newaccesstoken, refreshtoken: newrefreshtoken });

    } catch (error) {
        console.error("Error during generating new access token:", error);
        return res.status(500).json({ message: "Internal Server Error", details: error.message });
    }

}





const studentSendRequestToWarden = async (req, res) => {
    try {

        console.log(req.student._id , "sdsds idddddddddddddd")

        const studentId = req.student._id;
        const wardenId = req.params.id;
        const { destination } = req.body;


        console.log( "Student id" ,studentId );
        console.log( "Warden id" ,wardenId );



        const student = await Student.findById(studentId);
        const warden = await Warden.findById(wardenId);

        if (!student || !warden) {
            return res.status(404).json({ message: "Student or Warden not found." });
        }

        if (student.wardenid) {
            return res.status(200).json({ message: "already" });
        }




        student.wardenid = wardenId;
        student.permission = "pending";
        student.wardenname = warden.name;
        student.destination = destination;

        const alreadyRequested = warden.requests.includes(studentId.toString());
        if (!alreadyRequested) {
            warden.requests.push(studentId);
        }

        await Promise.all([
            student.save({ validateBeforeSave: false }),
            warden.save({ validateBeforeSave: false })
        ]);

        

        const sentuserrequest = await Student.findById(studentId).select("name destination roomNo collageYear");

        
        const wardenSocketId = connectedUsers.get(wardenId.toString());
        if (wardenSocketId) {
            io.to(wardenSocketId).emit("new_request", {
                studentId,
                name: sentuserrequest.name,
                destination: sentuserrequest.destination,
                roomNo: sentuserrequest.roomNo,
                collageYear: sentuserrequest.collageYear
            });
        }

        return res.status(200).json({
            message: "Request sent successfully!",
            permission: student.permission,
            wardenname: student.wardenname
        });

    } catch (error) {
        console.error("Error sending request:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};








const allwarden = async (req, res) => {
    try {
        const allwarden = await Warden.find().select(["-password"]);
        if (!allwarden || allwarden.length === 0) {
            return res.status(404).json({ message: "No wardens found." });
        }
        return res.status(200).json({ message: "Wardens found.", warden: allwarden });
    } catch (error) {
        console.error("Error during finding all wardens:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};



const getStudentById = async (req, res) => {
    try {
        // const studentId = req.params.id;
        const studentId = req.student?._id;
        const student = await Student.findById(studentId).select("-password -refreshtoken");

        if (!student) {
            return res.status(404).json({ message: "Student not found." });
        }

        return res.status(200).json({
            message: "Student details fetched successfully",
            student
        });
    } catch (error) {
        console.error("Error fetching student details:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};



const checkStudentStatus = async (req, res) => {
    try {
        const studentId = req.student._id;
        // console.log(studentId)
        const student = await Student.findById(studentId).select("-password -refreshtoken");

        if (!student) {
            return res.status(404).json({ status: "401", message: "Student not found" });
        }

        return res.status(200).json({
            message: "Student status fetched successfully",
            student
        });
    } catch (error) {
        console.error("Error checking student status:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

const getingkey = async (req, res) => {
    try {
        const studentid = req.student?._id;
        const { key } = req.body;

        if (!studentid || !key) {
            return res.status(400).json({ message: "Key and student ID are required" });
        }

        const student = await Student.findById(studentid).select('-password -refreshtoken');

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        student.key = key;
        await student.save();

        return res.status(200).json({ message: "Key saved successfully", student });

    } catch (error) {
        console.error("Error saving student key:", error);
        return res.status(500).json({ message: "Error on saving key to student" });
    }
};

const history = async (req, res) => {

    try {
 const phoneno = req.student?.phoneNo

      const studentdata = await Hestory.find({studentphoneNO:phoneno })

if(!studentdata){
    res.status(200).json({message : "user history not found"})
}
console.log(studentdata);
return res.status(200).json({message : "user history found : " , user : studentdata })

   

    } catch (error) {
        console.log("error form server to give user history ", error)
    }
}



export { registerstudent, loginstudent, logoutstudent, refreshtoken, studentSendRequestToWarden, allwarden, getStudentById, checkStudentStatus, getingkey, history };









