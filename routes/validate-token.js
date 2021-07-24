const jwt = require('jsonwebtoken')

const validateToken = (req, res, next) => {
    const token = req.header('Authorization')
    if (!token) return res.status(401).json({ error: 'unauthorized' })
    try {
        const verified = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({error: 'invalid_token'})
    }
}

module.exports = validateToken;