import mongoose, { Schema } from "mongoose";

const Adminschema = new Schema({

    name :{
        type : String ,
        required : true
    }
    ,
    phoneno :{
        type : String
    },

    email : {
        type : String,
        required : true
    },
    password : {
        type : String,
        required : true
    },
    role :{
        type : String ,
        enum : ["SuperAdmin" , "Admin"]
    }

    

});

export const Admin = mongoose.model("Admin"  , Adminschema);



