const express = require("express");
const router = express.Router();
const authenticateJWT = require("../middleware/authenticator");

const { register, login } = require("../controller/user_controller");

router.post("/register", register);
router.post("/login", login);

module.exports = router;