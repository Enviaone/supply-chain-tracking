const dashboardService = require('./dashboard.service');
const { apiResponse } = require('../../utils/response');

class DashboardController {
    static async getProductionSummary(req, res) {
        try {
            const range = req.query.range || '7d';
            const data = await dashboardService.getProductionSummary(range);
            return apiResponse(res, 200, 'success', data);
        } catch (error) {
            return apiResponse(res, 500, error.message);
        }
    }

    static async getRejectionAnalysis(req, res) {
        try {
            const range = req.query.range || '30d';
            const data = await dashboardService.getRejectionAnalysis(range);
            return apiResponse(res, 200, 'success', data);
        } catch (error) {
            return apiResponse(res, 500, error.message);
        }
    }
}

module.exports = DashboardController;
