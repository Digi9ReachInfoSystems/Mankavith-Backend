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
const paymentController = require("./src/controller/paymentController");
const { decryptRequestBody, encryptResponseBody } = encryptionMiddleware(
  encrypt,
  decrypt
);
// connectDB();
const webhookController = require("./src/controller/razor_pay_webhook");

app.post(
  "/api/webhooks/razorpay-webhook",
  express.raw({ type: "application/json" }),
  paymentController.handleWebhook
);

app.use(bodyParser.json({limit:'1024mb'}));
app.use(cors());
app.use(express.json());

app.use(decryptRequestBody);
app.use(encryptResponseBody);
// app.use(express.json());

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
const Feedback = require("./src/routes/feedbackRoutes");
const certificatesRoutes = require("./src/routes/certificatesRoutes");
const kycDetailsRouter = require("./src/routes/kycRoutes");
const recordedSession = require("./src/routes/recordedSessionRoutes");
const BannersRouter = require("./src/routes/bannerRoutes");
const CategoryRouter = require("./src/routes/categoryRoutes");
const uploadRoutes = require("./src/routes/uploadRoutes");
const lectureRoutes = require("./src/routes/lectureRoutes");
const missionRoutes = require("./src/routes/missionRoutes");
const aspirantRoutes = require("./src/routes/aspirantRoutes");
const studentRoutes = require("./src/routes/studentRoutes");
const zoomRoutes = require("./src/routes/zoomRoutes");
const paymentRoutes = require("./src/routes/paymentRoutes");
const blogRoutes = require("./src/routes/blogRoutes");
const userProgressRoutes = require("./src/routes/userProgressRoutes");
const meetingRoutes = require("./src/routes/meetingRoutes");
const contactSupportRoutes = require("./src/routes/supportRoutes");
const mockTestRoutes = require("./src/routes/mockTestRoutes");
const userAttemptRoutes = require("./src/routes/userAttemptRoutes");  
const userRankingRoutes = require("./src/routes/userRankingRoutes");
const pdfCertificatesRoutes = require("./src/routes/pdfCertificateRoutes");
const socialMedialinksRoutes = require("./src/routes/socialMediaLinksRoutes");

app.use("/user", userRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/subject", subjectRoutes);
app.use("/notes", notesRoutes);
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
app.use("/feedback", Feedback);
app.use("/kyc", kycDetailsRouter);
app.use("/recordedSession", recordedSession);
app.use("/certificates", certificatesRoutes);
app.use("/banners", BannersRouter);
app.use("/category", CategoryRouter);
app.use("/upload", uploadRoutes);
app.use("/lecture", lectureRoutes);
app.use("/mission", missionRoutes);
app.use("/aspirants", aspirantRoutes);
app.use("/student", studentRoutes);
app.use("/api/v1/zoom", zoomRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/blog", blogRoutes);
app.use("/contactSupport", contactSupportRoutes);


app.use("/userProgress", userProgressRoutes);   
app.use("/meeting", meetingRoutes);
app.use("/mockTest", mockTestRoutes);
app.use("/userAttempt", userAttemptRoutes);
app.use("/userRanking", userRankingRoutes);
app.use("/pdfCertificates", pdfCertificatesRoutes);
app.use("/socialMediaLinks", socialMedialinksRoutes);





connectDB()
  .then(() => {
    console.log("Connected to MongoDB");

    // Start the Server
    const PORT = process.env.PORT;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit process with failure
  });
