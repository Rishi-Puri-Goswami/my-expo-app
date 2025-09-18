import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const wardenSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        phoneNo: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        email: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        refreshtoken : {
            type: String
        },
        
        requests: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }]

    },
    {
        timestamps: true
    }
);


wardenSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});


wardenSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};


wardenSchema.methods.GenerateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            name: this.name,
            phoneNo: this.phoneNo
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRE }
    );
};

wardenSchema.methods.GenerateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRE }
    );
};

export const Warden = mongoose.model("Warden", wardenSchema);

