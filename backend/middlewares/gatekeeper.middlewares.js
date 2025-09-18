import jwt from "jsonwebtoken";
import { Gatekeeper } from "../scr/modules/gatekeeper.module.js"; 

const verifyGatekeeperJwt = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const tokenn = req.headers?.authorization;
        console.log("user token:", tokenn);

        if (!tokenn) {
            return res.status(401).json({ 
                message: "Unauthorized: No token provided",
                details: "Please login to access this resource"
            });
        }

        // Extract "Bearer <token>"
        const token = tokenn.split(" ")[1];
        console.log("Extracted token:", token);

        console.log("JWT secret:", process.env.JWT_SERECT);

        if (!process.env.JWT_SERECT) {
            return res.status(500).json({ 
                message: "JWT secret not defined",
                details: "Set JWT_SERECT in environment variables"
            });
        }

        // Verify token
        const decode = jwt.verify(token, process.env.JWT_SERECT);
        console.log("decoded token:", decode);

        // Find gatekeeper and validate
        const gatekeeper = await Gatekeeper.findById(decode.id).select("-password -refreshtoken");
        if (!gatekeeper) {
            return res.status(401).json({ 
                message: "Gatekeeper not found",
                details: "The gatekeeper associated with this token no longer exists"
            });
        }

        // Attach gatekeeper to request
        req.gatekeeper = gatekeeper;
        console.log("✅ Gatekeeper verified successfully");
        next();

    } catch (error) {
        console.error("Error in gatekeeper auth middleware:", error);

        // Handle specific JWT errors
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token" });
        }
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired" });
        }

        return res.status(500).json({ 
            message: "Internal Server Error",
            details: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
};

export { verifyGatekeeperJwt };
