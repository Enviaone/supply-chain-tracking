const { apiResponse } = require('../utils/response');

const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return apiResponse(res, 401, 'Unauthorized');
        }

        if (req.user.isAdmin) {
            return next();
        }

        const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
        
        if (!hasRole) {
            return apiResponse(res, 403, 'Forbidden: Insufficient privileges');
        }

        next();
    };
};

module.exports = requireRole;
