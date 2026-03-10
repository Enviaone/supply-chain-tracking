const authService = require('./auth.service');
const { apiResponse } = require('../../utils/response');

class AuthController {
    static async login(req, res) {
        try {
            // Check if postman legacy email/password login
            if (req.body.email && req.body.password) {
                const token = await authService.adminEmailLogin(req.body.email, req.body.password);
                return apiResponse(res, 200, 'success', { token });
            }

            // Otherwise, OTP flow
            const { phone } = req.body;
            if (!phone) {
                return apiResponse(res, 400, 'Phone number is required');
            }

            const otp = await authService.generateOtp(phone);
            return apiResponse(res, 200, 'success', { message: 'OTP sent successfully', otp }); // returning OTP for testing purposes
        } catch (error) {
            return apiResponse(res, 400, error.message);
        }
    }

    static async verifyOtp(req, res) {
        try {
            const { phone, otp } = req.body;
            if (!phone || !otp) {
                return apiResponse(res, 400, 'Phone and OTP are required');
            }

            const token = await authService.verifyOtp(phone, otp);
            return apiResponse(res, 200, 'success', { token });
        } catch (error) {
            return apiResponse(res, 400, error.message);
        }
    }

    static async getCurrentUser(req, res) {
        try {
            return apiResponse(res, 200, 'success', { user: req.user });
        } catch (error) {
            return apiResponse(res, 500, 'Internal Server Error');
        }
    }
}

module.exports = AuthController;
