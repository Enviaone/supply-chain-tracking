const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null; // Invalid or expired token
    }
};

module.exports = {
    generateToken,
    verifyToken
};
