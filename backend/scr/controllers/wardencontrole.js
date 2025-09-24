import { Warden } from "../modules/warden.module.js";
import { Student } from "../modules/student.module.js";
import jwt from "jsonwebtoken";
import { generateTokens, verifyRefreshToken, setTokens } from "../utils/tokenUtils.js";
import { io, connectedUsers } from "../socket/server.js";
import bcrypt from "bcryptjs";

const generateAccessAndRefreshTokenWarden = async (wardenId) => {
    const warden = await Warden.findById(wardenId);
    if (!warden) throw new Error("Warden not found");

    const accesstoken = warden.GenerateAccessToken();
    const refreshtoken = warden.GenerateRefreshToken();
    warden.refreshtoken = refreshtoken;
    await warden.save({ validateBeforeSave: false });

    return { accesstoken, refreshtoken };
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





// const loginWarden = async (req, res) => {
//     try {
//         const { phoneNo , password } = req.body;
//         if (!phoneNo || !password)
//             return res.status(400).json({ message: "Phone number and password are required." });

//         const warden = await Warden.findOne({ phoneNo });
//         if (!warden || !(await warden.isPasswordCorrect(password)))
//             return res.status(400).json({ message: "Invalid phone number or password." });

//         const { accesstoken, refreshtoken } = await generateAccessAndRefreshTokenWarden(warden._id);
//         const loginWarden = await Warden.findById(warden._id).select("-password -refreshtoken");

//         const options = { httpOnly: true, secure: true, sameSite: "Strict" };


//         return res.status(200)
//             .cookie("accesstoken", accesstoken, options)
//             .cookie("refreshtoken", refreshtoken, options)
//             .json({ message: "Login successful", warden: loginWarden, accesstoken, refreshtoken });

  

            
//     } catch (error) {
//         console.error("Error during login:", error);
//         return res.status(500).json({ message: "Internal Server Error", details: error.message });
//     }
// };




const loginWarden = async (req, res) => {
    try {

        console.log("request")
        const { phoneNo, password } = req.body;

        console.log(phoneNo , password)

        if (!phoneNo || !password) {
            return res.status(200).json({ message: "Phone number and password are required." });
        }



        const warden = await Warden.findOne({ phoneNo });
        if (!warden) {
            return res.status(200).json({ message: "Invalid phone number or password." });
        }

        // const passwordvalid = await Warden.isPasswordCorrect(password);

        const passwordvalid = await bcrypt.compare(password , warden.password);




        if (!passwordvalid) {
            return res.status(200).json({ message: "Invalid phone number or password." });
        }

      



        // const loginwarden = await Warden.findById(warden._id).select("-password");

// if(!loginwarden){
//     return res.status(404).json({message : "warden failed to login " , status : 404});
// }

    

       const token = jwt.sign(
  { id: warden._id , role : "Warden" },
  process.env.JWT_SERECT,
  { expiresIn: 10 * 24 * 60 * 60 } // 10 days in seconds
);


        return res.status(200).json({message : "student successfully login" , status : 200 , token});




    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};




const logoutWarden = async (req, res) => {
    try {
        const wardenId = req.warden?._id;
        const warden = await Warden.findById(wardenId);

        if (!warden) return res.status(401).json({ message: "Warden not found" });

        warden.refreshtoken = undefined;
        await warden.save({ validateBeforeSave: false });

        const options = { httpOnly: true, secure: true, sameSite: "Strict" };
        res.clearCookie("accesstoken", options);
        res.clearCookie("refreshtoken", options);

        return res.status(200).json({ message: "Logout successful." });
    } catch (error) {
        console.error("Error during logout:", error);
        return res.status(500).json({ message: "Internal Server Error", details: error.message });
    }
};

const refreshTokenWarden = async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshtoken || req.body.refreshtoken;
        if (!incomingRefreshToken)
            return res.status(401).json({ message: "Unauthorized request", details: "No refresh token provided" });

        const decoded = await verifyRefreshToken(incomingRefreshToken, "warden");
        const warden = await Warden.findById(decoded._id);
        if (!warden || incomingRefreshToken !== warden.refreshtoken)
            return res.status(401).json({ message: "Invalid or expired refresh token. Please login again." });

        const { accessToken, refreshToken } = await generateTokens(warden, "warden");
        setTokens(res, accessToken, refreshToken);

        return res.status(200).json({ message: "Access token refreshed", accessToken, refreshToken });
    } catch (error) {
        console.error("Error refreshing token:", error);
        return res.status(500).json({ message: "Internal Server Error", details: error.message });
    }
};



        const handleStudentRequest = async (req, res) => {
        try {
            const { action } = req.body;
            const studentId = req.params.studentId;

            if (!studentId || !["accept", "decline"].includes(action))
            return res.status(400).json({ message: "Invalid request parameters." });

            const student = await Student.findById(studentId);
            if (!student) return res.status(404).json({ message: "Student not found." });

            // Update student permission
            if (action === "accept") {
            student.permission = "accepted";
            } else {
            student.permission = "rejected";
            student.wardenid = null;
            student.destination = "nothing";
            }

            await student.save({ validateBeforeSave: false });

            // Emit real-time event to student
            const studentSocketId = connectedUsers.get(studentId.toString());
            if (studentSocketId) {
            io.to(studentSocketId).emit("outpass_permission", { permission: student.permission ,  wardenname: student.wardenname, });
            }

            
            // Optional: reset permission to "none" after some time for rejected students
            if (action === "decline") {
            setTimeout(async () => {
                student.permission = "none";
                await student.save({ validateBeforeSave: false });

                const studentSocketId = connectedUsers.get(studentId.toString());
                if (studentSocketId) {
                io.to(studentSocketId).emit("outpass_permission", { permission: "none" });
                }


            }, 2000);
            }

            return res.status(200).json({
            message: `Request ${action}ed successfully!`,
            student: {
                name: student.name,
                wardenname: student.wardenname,
                permission: student.permission,
                destination: student.destination,
            },
            });
        } catch (error) {
            console.error("Error handling student request:", error);
            return res.status(500).json({ message: "Internal server error.", details: error.message });
        }
        };



const getPendingRequests = async (req, res) => {
    try {
        console.log("running panding request")
        const wardenId = req.warden._id;
        const warden = await Warden.findById(wardenId).populate({
            path: "requests",
            match: { permission: "pending" },
            select: "name phoneNo email collageYear roomNo destination permission"
        });

        if (!warden) return res.status(404).json({ message: "Pending request not found." });

        const pendingRequests = warden.requests.filter(request => request !== null);
        return res.status(200).json({ message: "Pending requests fetched successfully", requests: pendingRequests });
    } catch (error) {
        console.error("Error fetching pending requests:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};








export {
    registerWarden,
    loginWarden,
    logoutWarden,
    refreshTokenWarden,
    handleStudentRequest,
    getPendingRequests
};



