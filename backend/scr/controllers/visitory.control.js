
import { Visitory } from "../modules/visitors.module.js";
const visitorcomein = async (req, res) => {


    try {



        const { name, age, phoneno, relation, QRkey } = req.body;


        if (!name || !age || !phoneno || !relation) {
            return res.status(200).json({ message: "All fields are required", status: 400 });
        }






        const group = await Visitory.findOne({ QRkey });

        if (group) {
            group.groupmember.push({
                name,
                age,
                phoneno,
                relation
            });

            await group.save();

            return res.status(200).json({ message: "people was add " });
        }



        const visitorcreate = await Visitory.create({
            groupmember: [

                {
                    name,
                    age,
                    phoneno,
                    relation,

                }

            ]
            ,
            QRkey,

        });

        const createdvisitor = await Visitory.findOne({ _id: visitorcreate._id });

        if (!createdvisitor) {
            return res.status(200).json({ message: "Visitor not created" });
        }


        if (createdvisitor.groupmember && createdvisitor.groupmember.length === 1) {
            const option = {
               
                secure: true,
                sameSite: "none",
                maxAge: 10 * 24 * 60 * 60 * 1000
            };


            res.cookie("visitor", visitorcreate._id, option);
            return res.status(200).json({ message: "Visitor created", ok: createdvisitor });


        }


    } catch (error) {
        console.log("error during create visitor in server ::> ", error)
        return res.status(200).json({ message: "error during create visitor " })
    }
};





const getvisitor = async (req , res) => {

    const visitorid = req.cookies?.visitor;

    if(!visitorid) {
        return res.status(200).json({ message: "visitor id required" });
    }

    const findvisitor = await Visitory.findOne({ _id: visitorid });
if(!findvisitor){
    return res.status(200).json({message :"visitor not found "});
}
    return res.status(200).json({ message: "visitor found", visitor: findvisitor });

}



export { visitorcomein , getvisitor };




