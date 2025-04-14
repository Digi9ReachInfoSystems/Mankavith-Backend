const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../model/user_model');
const nodemailer = require('nodemailer');

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit OTP
};
const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    auth: {
        user: "Info@gully2global.com",
        pass: "Shasudigi@217",
    },
});

exports.register = async (req, res) => {
    const { email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'email already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOTP();
        const otpExpiration = new Date();
        otpExpiration.setMinutes(otpExpiration.getMinutes() + 1);

        const newUser = new User({
            email,
            password: hashedPassword,
            otp,
            otpExpiration,
            isEmailVerified: false,
        });

        await newUser.save();

        const mailOptions = {
            from: "Info@gully2global.com",
            to: email,
            subject: 'Email Verification OTP',
            text: `Your OTP is: ${otp}. It will expire in 1 minutes.`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ success: false, message: 'Error sending OTP' });
            }
            res.status(201).json({ success: true, message: 'User registered successfully. OTP has been sent to your email.' });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error registering user', error: error.message });
    }
};
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: "Account with this email does not exist" });
        }
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const accessToken = jwt.sign(
            { username: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        user.accessToken = accessToken;
        const refreshToken = jwt.sign(
            { username: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );
        user.refreshToken = refreshToken;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Login failed', error: error.message });
    }
};
exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (user.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        if (new Date() > user.otpExpiration) {
            return res.status(400).json({ success: false, message: 'OTP has expired' });
        }

        user.isEmailVerified = true;
        user.otp = undefined;
        user.otpExpiration = undefined;
        await user.save();

        res.status(200).json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error verifying OTP', error: error.message });
    }
};
exports.resendOTP = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const currentTime = new Date();
        if (user.otpExpiration && currentTime < user.otpExpiration) {
            return res.status(400).json({ success: false, message: 'OTP is still valid. Please try again after it expires.', otpExpiration: user.otpExpiration.toISOString() });
        }
        const otp = generateOTP();
        const otpExpiration = new Date();
        otpExpiration.setMinutes(otpExpiration.getMinutes() + 1);


        user.otp = otp;
        user.otpExpiration = otpExpiration;

        await user.save();

        const mailOptions = {
            from: "Info@gully2global.com",
            to: email,
            subject: 'Email Verification OTP',
            text: `Your new OTP is: ${otp}. It will expire in 10 minutes.`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ success: false, message: 'Error sending OTP' });
            }
            res.status(200).json({ success: true, message: 'New OTP has been sent to your email' });
        });
    } catch (error) {
        console.error("Error resending OTP:", error);
        res.status(500).json({ success: false, message: 'Error resending OTP', error: error.message });
    }
};

exports.refreshToken = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'No refresh token provided' });
    }

    try {
        const user = await User.findOne({ refreshToken });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid refresh token' });
        }
        jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({ success: false, message: 'Refresh token is expired or invalid' });
            }

            const newAccessToken = jwt.sign(
                { username: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            res.status(200).json({ success: true, accessToken: newAccessToken });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error refreshing token', error: error.message });
    }
};

exports.loginSendOtp = async (req, res) => {
    try {
        const { email, } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Account with this email does not exist' });
        }

        const loginOtp = generateOTP();
        const loginOtpExpiration = new Date();
        loginOtpExpiration.setMinutes(loginOtpExpiration.getMinutes() + 1);

        user.loginOtp = loginOtp;
        user.loginOtpExpiration = loginOtpExpiration;
        await user.save();

        const mailOptions = {
            from: "Info@gully2global.com",
            to: email,
            subject: 'Login Verification OTP',
            text: `Your login OTP is: ${loginOtp}. It will expire in 1 minutes.`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ success: false, message: 'Error sending OTP' });
            }
            res.status(200).json({ success: true, message: 'Login OTP has been sent to your email' });
        });
    } catch (error) {
        console.error("Error sending login OTP:", error);
        res.status(500).json({ success: false, message: 'Error sending login OTP', error: error.message });
    }
};

exports.verifyLoginOtp = async (req, res) => {
    const { email, loginOtp } = req.body;
    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Account with this email does not exist' });
        }

        if (user.loginOtp !== loginOtp) {
            return res.status(401).json({ success: false, message: 'Invalid OTP' });
        }

        if (user.loginOtpExpiration < new Date()) {
            return res.status(401).json({ success: false, message: 'OTP has expired' });
        }

        const accessToken = jwt.sign(
            { username: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        const refreshToken = jwt.sign(
            { username: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );
        user.refreshToken = refreshToken;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error verifying login OTP', error: error.message });
    }
};

exports.resendLoginOtp = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Account with this email does not exist' });
        }

        const loginOtp = generateOTP();
        const loginOtpExpiration = new Date();
        loginOtpExpiration.setMinutes(loginOtpExpiration.getMinutes() + 1);

        user.loginOtp = loginOtp;
        user.loginOtpExpiration = loginOtpExpiration;
        await user.save();

        const mailOptions = {
            from: "Info@gully2global.com",
            to: email,
            subject: 'Login Verification OTP',
            text: `Your login OTP is: ${loginOtp}. It will expire in 1 minutes.`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ success: false, message: 'Error sending OTP' });
            }
            res.status(200).json({ success: true, message: 'Login OTP has been sent to your email' });
        });
    } catch (error) {
        console.error("Error sending login OTP:", error);
        res.status(500).json({ success: false, message: 'Error sending login OTP', error: error.message });
    }
};
exports.logout = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Account with this email does not exist' });
        }
        user.refreshToken = undefined;
        user.accessToken = undefined;
        await user.save();
        res.status(200).json({ success: true, message: 'Logout successful' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error logging out', error: error.message });
    }
};
exports.createAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = new User({ email, password: hashedPassword, role: 'admin' });
        await admin.save();
        res.status(200).json({ success: true, message: 'Admin created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating admin', error: error.message });
    }
};
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, message: 'User found', user: user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error getting user', error: error.message });
    }
};
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: 'user' });
        res.status(200).json({ success: true, message: 'Users found', users: users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error getting users', error: error.message });
    }
};