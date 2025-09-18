import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const studentSchema = new mongoose.Schema(
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
        collageYear: {
            type: Number,
            required: true
        },
        roomNo: {
            type: Number,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        }
        ,wardenname : {
        type : String ,
        default : "none"
        },
        wardenid: { type: mongoose.Schema.Types.ObjectId, ref: "Warden" },
        permission: { type: String, enum: ["none","pending", "accepted", "rejected"], default: "none" },
        
        destination: {
            type: String,
            default: "nothing"
        },

   gatepermission : {
    type : String ,
    enmu : ["inside" , "outside" ],
   default : "inside"
   },

key : {
    type : String ,
     default : "none"
},  

refreshtoken : {
            type: String
        },

        hostel :{
            
type : String,
enum : ["h2" , "h3" , "h4" , "h5" , "h6" , "h7"]

        },

        outgoingtime: {
            type: Date,
            default: null
          }
          
    },

 

    {
        timestamps: true
    }
);



studentSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});


studentSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

studentSchema.methods.GenerateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            name: this.name,
            phoneNo: this.phoneNo,
            collageYear: this.collageYear,
            roomNo: this.roomNo
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRE }
    );
};


studentSchema.methods.GenerateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRE }
    );
};

export const Student = mongoose.model("Student", studentSchema);


