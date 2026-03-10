// Centralized response formatter
const apiResponse = (res, status, message, data = {}) => {
    return res.status(status).json({
        status,
        message,
        data
    });
};

module.exports = {
    apiResponse
};
