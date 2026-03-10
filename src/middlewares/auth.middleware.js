const { verifyToken } = require('../utils/jwt');
const pool = require('../config/mysql');
const { apiResponse } = require('../utils/response');

const authMiddleware = async (req, res, next) => {
    try {
        
        
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return apiResponse(res, 401, 'Unauthorized: No token provided');
        }

        const token = authHeader.split(' ')[1];
    

        const decoded = verifyToken(token);
        if (!decoded) {
            return apiResponse(res, 401, 'Unauthorized: Invalid or expired token');
        }

        // Verify user exists and is active
        const [users] = await pool.query('SELECT * FROM users WHERE id = ? AND status = 1', [decoded.id]);
        if (users.length === 0) {
            return apiResponse(res, 401, 'Unauthorized: User not found or inactive');
        }

        // Attach user info to req
        req.user = users[0];
        
        // Fetch user roles
        const [roles] = await pool.query(`
            SELECT r.name, r.is_admin 
            FROM roles r
            JOIN user_roles ur ON ur.role_id = r.id
            WHERE ur.user_id = ?
        `, [decoded.id]);
        
        req.user.roles = roles.map(r => r.name);
        req.user.isAdmin = roles.some(r => r.is_admin);

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return apiResponse(res, 500, 'Internal Server Error');
    }
};

module.exports = authMiddleware;
