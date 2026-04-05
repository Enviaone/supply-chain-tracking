const itemService = require('./item.service');
const { apiResponse } = require('../../utils/response');

class ItemController {
  static async getItemsByBrand(req, res) {
    try {
      const items = await itemService.getItemsByBrand(req.params.brandId);
      return apiResponse(res, 200, 'success', items);
    } catch (error) {
      console.error('Error fetching items:', error);
      return apiResponse(res, 500, error.message);
    }
  }

  static async getItemsByBrandAndStage(req, res) {
    try {
      let items = await itemService.getItemsByBrandAndStage(
        req.params.stageKey,
        req.params.brandId,
      );

      if (!items.length) {
        return apiResponse(
          res,
          200,
          'No items found for the stage and brand',
          [],
        );
      }

      items.forEach((item) => {
        item.has_fettling_option = item.has_fettling_option == 1;
        item.has_first_coat_option = item.has_first_coat_option == 1;
        item.has_next_step_select = item.has_next_step_select == 1;

        //! Replace with actual next step options from database
        if (item.processId === 2) {
          item.next_step_options = [
            { id: '54', stage_name: 'Re Shot Blast' },
            { id: '55', stage_name: 'Super Technology' },
          ];
        }
      });

      return apiResponse(res, 200, 'success', items);
    } catch (error) {
      console.error('Error fetching items:', error);
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
