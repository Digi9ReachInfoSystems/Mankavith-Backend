const express = require("express");
const router = express.Router();
const authenticateJWT = require("../middleware/authenticator");
const userController = require("../controller/user_controller");
const allowedRoles = require("../middleware/roleMiddleware");

router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/verify-otp", userController.verifyOTP);
router.post("/resend-otp", userController.resendOTP);
router.post("/refreshToken", userController.refreshToken);
router.post("/loginSendOtp", userController.loginSendOtp);
router.post("/verifyLoginOtp", userController.verifyLoginOtp);
router.post("/resendLoginOtp", userController.resendLoginOtp);
router.post("/logout", userController.logout);
router.post("/createAdmin", userController.createAdmin);
router.get("/get/userById/:id", userController.getUserById);
router.get("/get/users",  userController.getAllUsers);
router.delete("/delete/userById/:id", userController.deleteUser);

// Update wishlist (add/remove)
router.post("/update", userController.updateWishlist);

// Get wishlist
router.get("/wishlist/:userId", userController.getWishlist);

// Check if course is in wishlist
router.get("/:userId/:courseId", userController.checkWishlistItem);
router.put("/updateUser/:userId", userController.editUser);
router.get("/get/allEnrolledCourses/:userId", userController.getAllEnrolledCourses);
router.get("/get/ongoingEnrolledCourses/:userId", userController.getOngoingCourses);
router.get("/get/completedEnrolledCourses/:userId", userController.getCompletedCourses);
router.get("/get/notStartedEnrolledCourses/:userId", userController.getNotStartedCourses);
router.post("/createStudent", userController.createStudent);
router.get("/get/all/students",authenticateJWT,allowedRoles(["admin", "user"]), userController.getAllStudents);
router.put("/addCourseToStudent", userController.addCourseSubscriptionToStudent);
router.delete("/deleteUser/:id", userController.deleteUserById);
router.post("/verifyRoles",authenticateJWT,allowedRoles(["admin", "user"]), userController.verifyUserRoles);
router.put("/removeCourseFromStudent", userController.removeCourseSubscriptionToStudent);
router.post("/sendPhoneOtp", userController.phoneOtpGenerate);
router.post("/verifyPhoneOtp", userController.phoneOtpVerify);
router.post("/resendPhoneOtp", userController.resendPhoneotp);
router.post("/forceLogin", userController.forceLogin);
router.delete("/bulkDelete", userController.bulkDeleteUsers);
router.delete("/deleteStudent", userController.deleteStudents);
router.put("/blockAndUnblockUser", userController.blockAndUnblockUser);
router.put("/enableAndDisableMasterOtp", userController.enableDisableMasterOtp);
router.post("/sendChangePasswordOtp", userController.sendChangePasswordOtp);
router.post("/resendChangePasswordOtp", userController.resendChangePasswordOtp);
router.post("/verifyChangePasswordOtp", userController.verifyChangePassword);
router.post("/verify/changePasswordOtp", userController.verifyChangePasswordOtp);
router.post("/confirmChangePassword", userController.changePassword);
router.post("/collectQuestionPaperDetails", userController.collectDetailsOnQuestionPaperDownload);
router.get("/get/stubents/byCourse", userController.getAllStudentsByCourse);
router.post("/create/sub/Admin", userController.createSubAdmin);
router.put("/update/sub/Admin/:id", userController.updateSubAdmin);
router.delete("/delete/sub/Admin/:id", userController.deleteSubAdmin);
router.put("/reset/adminPassword/:id", userController.resetAdminPassword);
router.get("/get/sub/Admins", userController.getAllAdmins);
router.post("/send/forgotPasswordOtp", userController.forgotPasswordSendOtp);
router.post("/verify/forgotPasswordOtp", userController.verifyForgotPasswordOtp);
router.post("/resend/forgotPasswordOtp", userController.resendForgotPasswordOtp);
router.put("/reset/password", userController.resetPassword);
module.exports = router;

module.exports = router;
