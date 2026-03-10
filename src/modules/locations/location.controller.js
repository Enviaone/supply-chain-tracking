const locationService = require('./location.service');
const { apiResponse } = require('../../utils/response');

class LocationController {
    static async createLocation(req, res) {
        try {
            const locationId = await locationService.createLocation(req.body);
            return apiResponse(res, 201, 'Location created', { locationId });
        } catch (error) {
            return apiResponse(res, 400, error.message);
        }
    }

    static async getLocations(req, res) {
        try {
            const locations = await locationService.getLocations();
            return apiResponse(res, 200, 'success', locations);
        } catch (error) {
            return apiResponse(res, 500, error.message);
        }
    }

    static async updateLocation(req, res) {
        try {
            await locationService.updateLocation(req.params.id, req.body);
            return apiResponse(res, 200, 'Location updated');
        } catch (error) {
            return apiResponse(res, 400, error.message);
        }
    }

    static async deleteLocation(req, res) {
        try {
            await locationService.deleteLocation(req.params.id);
            return apiResponse(res, 200, 'Location deleted');
        } catch (error) {
            return apiResponse(res, 400, error.message);
        }
    }
}

module.exports = LocationController;
