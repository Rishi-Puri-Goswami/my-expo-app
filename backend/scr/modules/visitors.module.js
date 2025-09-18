import mongoose, { Schema } from "mongoose";
const visitorySchema = new Schema({
    groupmember: [{
        name: {
            type: String,
            require: true
        },
        age: {
            type: Number,
            require: true
        },
        phoneno: {
            type: String,
            require: true,
            unique: true
        },
        relation: {
            type: String,
          
        },
    }],

    intime: {
        type: Date,
        default: Date.now()
    }
    ,

    isactive: {

        type: Boolean,
        default: false

    }

    ,


    QRkey: {
        type: String,
    }



}, {


    timestamps: true


})


export const Visitory = mongoose.model("Visitory", visitorySchema);
