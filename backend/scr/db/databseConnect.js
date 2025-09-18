import mongoose from "mongoose"
import dotenv from "dotenv"
dotenv.config({
    path:'../../.env'
})

const dbname = "srxit"
console.log("mongoo url  " , process.env.MONGODB_URI)
const dbconnect = async ()=>{
    try {
        const connectdb = await mongoose.connect(`${process.env.MONGODB_URI}/${dbname}`)
        console.log(`MongoDB connectedsuccesfully:-  ${connectdb.connection.host}`);
    } catch (error) {
        console.log(`Error is:::-> ` ,error);
        process.exit(1)
    }
}

export default dbconnect;



