const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectDB = require("./src/config/database");
connectDB();

const userRouter = require("./src/routes/user_routes");
const faqRouter = require("./src/routes/faqRoutes");
const contentRouter = require("./src/routes/contentRoutes");
const examRouter = require("./src/routes/examRoutes");
const tickerRouter = require("./src/routes/tickerRoutes");
const testimonialRouter = require("./src/routes/testimonialsRoutes");
const questionRouter = require("./src/routes/questionRoutes");
const entranceRouter = require("./src/routes/entranceRoutes");
const achieverRouter = require("./src/routes/achieverRoutes");

app.use(cors());
app.use(express.json());
app.use("/user", userRouter);
app.use("/faq", faqRouter);
app.use("/content", contentRouter);
app.use("/exam", examRouter);
app.use("/ticker", tickerRouter);
app.use("/testimonials", testimonialRouter);
app.use("/question", questionRouter);
app.use("/entrance", entranceRouter);
app.use("/achiever", achieverRouter);

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });