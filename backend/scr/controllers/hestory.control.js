import { Hestory } from "../modules/gatekeeperhestory.js";

const hestorycontrol = async (req , res )=>{


    try {

        const allHistory = await Hestory.find().sort({ createdAt: -1 });
        return res.status(200).json({message :"getint hestory successfully" , hestory : allHistory})

        
    } catch (error) {
        console.log("error in hestory control ::> " , error )
    }


}

export {hestorycontrol};


