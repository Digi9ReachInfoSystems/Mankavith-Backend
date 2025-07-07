const jwt = require('jsonwebtoken');
const User = require('../model/user_model');

const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return res.status(401).send('Access Denied');
    }
    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) return res.status(401).send('Invalid Token');
        const userData = await User.findOne({ email: user.username });
        if(userData.isBlocked){
            return res.status(401).send('Account is blocked');
        }
        if (userData.refreshToken != user.refreshToken) {
            return res.status(401).send('Invalid Token');
        }

        req.user = user;

        next();
    });
};

module.exports = authenticateJWT;