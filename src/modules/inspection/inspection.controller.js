const inspectionService = require('./inspection.service');
const { apiResponse } = require('../../utils/response');

class InspectionController {
    static async inspectBatch(req, res) {
        try {
            await inspectionService.inspectBatch(req.body, req.user);
            return apiResponse(res, 201, 'Inspection recorded successfully');
        } catch (error) {
            return apiResponse(res, 400, error.message);
        }
    }
}

module.exports = InspectionController;
