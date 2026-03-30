const StageInventoryService = require('./stage-inventory.service');
const { apiResponse } = require('../../utils/response');

class StageInventoryController {
  static async getStageTracking(req, res) {
    const { process_id, item_id, entry_date } = req.query;

    if (!process_id || !item_id || !entry_date) {
      return apiResponse(
        res,
        400,
        'process_id, item_id and entry_date are required',
      );
    }

    try {
      const stages = await StageInventoryService.getStageTracking(
        process_id,
        item_id,
        entry_date,
      );

      return apiResponse(res, 200, 'success', {
        process_id: parseInt(process_id),
        item_id: parseInt(item_id),
        entry_date,
        stages,
      });
    } catch (err) {
      console.error('getStageTracking error:', err);
      return apiResponse(res, 500, 'Internal server error');
    }
  }

  static async getAvailableAtStage(req, res) {
    const { process_stage_id, item_id } = req.query;

    if (!process_stage_id || !item_id) {
      return apiResponse(res, 400, 'process_stage_id and item_id are required');
    }

    try {
      const rows = await StageInventoryService.getAvailableAtStage(
        process_stage_id,
        item_id,
      );

      if (!rows.length) {
        return apiResponse(res, 404, 'Stage not found');
      }

      return apiResponse(res, 200, 'success', {
        process_stage_id: parseInt(process_stage_id),
        item_id: parseInt(item_id),
        stage_name: rows[0].stage_name,
        stage_key: rows[0].stage_key,
        item_name: rows[0].item_name,
        item_code: rows[0].item_code,
        brand_name: rows[0].brand_name,
        available_qty: rows[0].available_qty,
      });
    } catch (err) {
      console.error('getAvailableAtStage error:', err);
      return apiResponse(res, 500, 'Internal server error');
    }
  }
}

module.exports = StageInventoryController;
