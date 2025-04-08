const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../model/user_model');

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit OTP
};

exports.register = async (req, res) => {
    const { email, password } = req.body;
    const transporter = nodemailer.createTransport({
        host: 'smtp.hostinger.com',
        port: 465,
        secure: true,
        auth: {
          user: "Info@gully2global.com",
          pass: "Shasudigi@217",
        },
      });

    try {
        const existingUser = await User.findOne({ email: username });
        if (existingUser) {
            return res.status(400).send('User already exists');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOTP();
        const otpExpiration = new Date();
        otpExpiration.setMinutes(otpExpiration.getMinutes() + 10);

        const newUser = new User({
            email,
            password: hashedPassword,
            otp,
            otpExpiration,
            isEmailVerified: false,
        });

        await newUser.save();

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Email Verification OTP',
            text: `Your OTP is: ${otp}. It will expire in 1 minutes.`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).send('Error sending OTP');
            }
            res.status(201).send('User registered successfully. OTP has been sent to your email.');
        });
    } catch (error) {
        res.status(500).send('Error registering user');
    }
};
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).send('Invalid credentials');
        }

        const token = jwt.sign(
            { username: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );


        res.json({ token });
    } catch (error) {
        res.status(500).send('Login failed');
    }
};