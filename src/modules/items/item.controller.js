const itemService = require('./item.service');
const { apiResponse } = require('../../utils/response');

class ItemController {
    static async getItemsByBrand(req, res) {
        try {
            const items = await itemService.getItemsByBrand(req.params.brandId);
            return apiResponse(res, 200, 'success', items);
        } catch (error) {
            return apiResponse(res, 500, error.message);
        }
    }

    static async createItem(req, res) {
        try {
            const itemId = await itemService.createItem(req.body);
            return apiResponse(res, 201, 'Item created', { itemId });
        } catch (error) {
            return apiResponse(res, 400, error.message);
        }
    }

    static async updateItem(req, res) {
        try {
            await itemService.updateItem(req.params.id, req.body);
            return apiResponse(res, 200, 'Item updated');
        } catch (error) {
            return apiResponse(res, 400, error.message);
        }
    }

    static async deleteItem(req, res) {
        try {
            await itemService.deleteItem(req.params.id);
            return apiResponse(res, 200, 'Item deleted');
        } catch (error) {
            return apiResponse(res, 400, error.message);
        }
    }
}

module.exports = ItemController;
