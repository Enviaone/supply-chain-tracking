const transferService = require('./transfer.service');
const { apiResponse } = require('../../utils/response');

class TransferController {
    static async transferOut(req, res) {
        try {
            await transferService.transferOut(req.body, req.user);
            return apiResponse(res, 201, 'Transfer recorded successfully');
        } catch (error) {
            return apiResponse(res, 400, error.message);
        }
    }

    static async receiveTransfer(req, res) {
        try {
            await transferService.receiveTransfer(req.body, req.user);
            return apiResponse(res, 201, 'Transfer incoming recorded successfully');
        } catch (error) {
            return apiResponse(res, 400, error.message);
        }
    }
}

module.exports = TransferController;
