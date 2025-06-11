const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
    const token = req.headers['x-auth-token']; 
    if (!token) {
        return res.status(401).json({ message: 'JWT token must be provided in the Authorization header' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }

        req.user = decoded;  // Store the decoded token information in req.user
        next();  // Continue to the next middleware/controller
    });
};