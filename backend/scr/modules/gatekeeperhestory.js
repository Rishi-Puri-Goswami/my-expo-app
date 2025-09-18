import mongoose, { Schema } from "mongoose";
const GatekeeperhestorySchema = new Schema ({

studentname :{
    type : String,
    require : true 
},
studentId :{
type : String 
},
studentphoneNO:{
type : String ,
require : true
},
studentcollegeyear :{
    type : Number ,
    require : true 
},
studentwardenname : {
    type:String ,
    require : true
},
studentdestination : {
    type : String ,
    require : true 
},
studentgoouttime  : {
    type : Number,
require : true
},
studentcomeintime : {
    type : Date ,
    require : true
}

},{timestamps : true});

export const Hestory = mongoose.model("Hestory" , GatekeeperhestorySchema);

















