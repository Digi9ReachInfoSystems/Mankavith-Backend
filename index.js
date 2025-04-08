const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectDB = require("./src/config/database");
connectDB();

const userRouter = require("./src/routes/user_routes");


app.use(cors());
app.use(express.json());
app.use("/user", userRouter);


app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });