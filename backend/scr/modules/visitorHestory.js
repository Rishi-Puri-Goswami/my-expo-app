import mongoose, { Schema } from "mongoose";


const hestoryschema = new Schema({


    visitorname :{
        type : String,
        require : true 
    },
    visitorphoneno : {
        type : String ,
        require : true
    },
    visitorage : {
        type : String,
        require : true 
    },
      visitorrelation:{
        type : String,
        require : true 
      },
      outtime : {
        type : Date,
        default : Date.now()

      }
,

intime :{
    type : Date ,
    ref : "Visitory"
}

})


export const VisitorHistory = mongoose.model("VisitorHistory" ,hestoryschema )
