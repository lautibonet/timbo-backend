const jwt = require('jsonwebtoken');
const responseUtils = require('../utils/response-utils');

const validateToken = (req, res, next) => {
    const token = req.header('Authorization')
    if (!token) return responseUtils.setUnauthorizedError(res);
    try {
        const verified = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        responseUtils.setInvalidTokenError(res);
    }
}

module.exports = validateToken;