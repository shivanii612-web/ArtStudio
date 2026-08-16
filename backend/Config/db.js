const mongoose = require("mongoose");

require("dotenv").config();
const connectToDB=async () => {
    try{
        const connection = await mongoose.connect(
            process.env.MONGODB_URI,
        );
        console.log("connected to MongoDB");
        console.log("Database Name:", connection.connection.name);
        console.log("Host:", connection.connection.host);
        return connection;
    } catch (error) {
        console.log(error);
    }
};
module.exports = connectToDB;
    




    


