const authService = require('./auth.service');
const { apiResponse } = require('../../utils/response');
const whatsappService = require('../../services/whatsapp.service');

class AuthController {
    static async login(req, res) {
        try {
            // Check if postman legacy email/password login
            if (req.body.email && req.body.password) {
                const result = await authService.adminEmailLogin(req.body.email, req.body.password);

                if (result && result.success == false) {
                    return apiResponse(res, 400, result.message, {});
                }
                return apiResponse(res, 200, result.message, result.data);
            }

            // Otherwise, OTP flow
            const { phone } = req.body;
            if (!phone) {
                return apiResponse(res, 400, 'Phone number is required');
            }

            const otp = await authService.generateOtp(phone);
            console.log("otp", otp);

            // Send WhatsApp message containing the OTP
            // Ensure the template name 'send_otp' matches your approved WhatsApp Business configuration
            /*
            await whatsappService.sendTemplateMessage(
          `91${phone}`,
          config.whatsapp.templateLoginOtp,
          [otp],
          [otp],
          loginDetails
        )
             */
            await whatsappService.sendTemplateMessage(
                `91${phone}`,
                process.env.WHATSAPP_LOGIN_OTP_TEMPLATE || "verify_code_2", // Replace with the real template name
                [otp], // Pass the OTP variable to the template
                [otp], // Pass the OTP variable to the template
                null
            );

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
