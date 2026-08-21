require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const connectToDB = require("./Config/db");
const productRoutes = require("./Routes/ProductRoute");
const userRoutes = require("./Routes/UserRoute");
const orderRoutes = require("./Routes/OrderRoute");
const { connectRedis } = require("./Config/redis");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use("/", userRoutes);

app.use("/", productRoutes);
app.use("/orders", orderRoutes);


connectToDB();
connectRedis();

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});