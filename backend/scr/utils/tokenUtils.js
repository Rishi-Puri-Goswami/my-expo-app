import jwt from "jsonwebtoken";

export const generateTokens = async (user, userType) => {
    try {
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Save refresh token to user
        user.refreshtoken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        console.error(`Error generating tokens for ${userType}:`, error);
        throw new Error(`Failed to generate tokens for ${userType}`);
    }
};

export const verifyRefreshToken = async (refreshToken, userType) => {
    try {
        if (!refreshToken) {
            throw new Error("No refresh token provided");
        }

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        return decoded;
    } catch (error) {
        console.error(`Error verifying refresh token for ${userType}:`, error);
        throw error;
    }
};

export const clearTokens = (res) => {
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "Strict"
    };

    res.clearCookie("accesstoken", options);
    res.clearCookie("refreshtoken", options);
};

export const setTokens = (res, accessToken, refreshToken) => {
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "Strict"
    };

    res.cookie("accesstoken", accessToken, options);
    res.cookie("refreshtoken", refreshToken, options);
}; 