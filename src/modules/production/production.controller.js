const productionService = require('./production.service');
const { apiResponse } = require('../../utils/response');

class ProductionController {
    static async submitStageEntry(req, res) {
        try {
            await productionService.processSubmissions(req.body, req.user);
            return apiResponse(res, 201, 'success', { message: 'Stage entries recorded successfully' });
        } catch (error) {
            return apiResponse(res, 400, error.message);
        }
    }

    static async getPipeline(req, res) {
        try {
            const pipeline = await productionService.getPipeline(req.user);
            return apiResponse(res, 200, 'success', pipeline);
        } catch (error) {
            return apiResponse(res, 500, error.message);
        }
    }


    static async getShifts(req, res) {
        try {
            const shifts = await productionService.getShifts();
            return apiResponse(res, 200, 'success', shifts);
        } catch (error) {
            return apiResponse(res, 500, error.message);
        }
    }

    static async getStages(req, res) {
        try {
            const stages = await productionService.getStages();
            return apiResponse(res, 200, 'success', stages);
        } catch (error) {
            return apiResponse(res, 500, error.message);
        }
    }
}

module.exports = ProductionController;
