const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const connectDB = require("./src/config/database");
const encryptionUtils = require("./src/utils/Encryption");
const encryptionMiddleware = require("./src/middleware/encryption");
const key = process.env.CRYPTION_KEY;
const { encrypt, decrypt } = encryptionUtils(key);
const { decryptRequestBody, encryptResponseBody } = encryptionMiddleware(
  encrypt,
  decrypt
);
connectDB();

app.use(bodyParser.json());
app.use(cors());
app.use(express.json());

// app.use(decryptRequestBody);
// app.use(encryptResponseBody);

app.use(express.json());

const userRoutes = require("./src/routes/user_routes");
const courseRoutes = require("./src/routes/course_routes");
const subjectRoutes = require("./src/routes/subject_routes");
const notesRoutes = require("./src/routes/notes_routes");
const faqRouter = require("./src/routes/faqRoutes");
const contentRouter = require("./src/routes/contentRoutes");
const examRouter = require("./src/routes/examRoutes");
const tickerRouter = require("./src/routes/tickerRoutes");
const testimonialRouter = require("./src/routes/testimonialsRoutes");
const questionRouter = require("./src/routes/questionRoutes");
const entranceRouter = require("./src/routes/entranceRoutes");
const achieverRouter = require("./src/routes/achieverRoutes");
const aboutUsRouter = require("./src/routes/aboutUsRoutes");
const WhyRouter = require("./src/routes/whyRoutes");
const StaticRouter = require("./src/routes/staticRoutes");

app.use("/user", userRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/subject", subjectRoutes);
app.use("/note", notesRoutes);
app.use("/faq", faqRouter);
app.use("/content", contentRouter);
app.use("/exam", examRouter);
app.use("/ticker", tickerRouter);
app.use("/testimonials", testimonialRouter);
app.use("/question", questionRouter);
app.use("/entrance", entranceRouter);
app.use("/achiever", achieverRouter);
app.use("/aboutus", aboutUsRouter);
app.use("/why", WhyRouter);
app.use("/static", StaticRouter);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
