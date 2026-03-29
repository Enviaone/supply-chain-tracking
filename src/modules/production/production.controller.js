const productionService = require('./production.service');
const { apiResponse } = require('../../utils/response');

class ProductionController {
  static async createEntry(req, res) {
    try {
      const {
        process_stage_id,
        item_id,
        brand_id,
        shift_id,
        location_id = null,
        entry_date,
        input_qty = 0,
        production_qty,
        rejected_qty = 0,
        solvage_qty = 0,
        fettling_option = null,
        first_coat_option = null,
        next_step_selection = null,
        transfer_type = null,
        transfer_location_id = null,
        transfer_qty = null,
        comment = 'Initial entry',
      } = req.body;

      const submitted_by = req.body.user;

      // Validate required fields
      if (
        !process_stage_id ||
        !item_id ||
        !brand_id ||
        !shift_id ||
        !entry_date ||
        production_qty === undefined
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Missing required fields: process_stage_id, item_id, brand_id, shift_id, entry_date, production_qty',
        });
      }

      // Validate transfer consistency
      if (
        (transfer_type && (!transfer_location_id || !transfer_qty)) ||
        (!transfer_type && (transfer_location_id || transfer_qty))
      ) {
        return res.status(400).json({
          success: false,
          message:
            'transfer_type, transfer_location_id and transfer_qty must all be provided together',
        });
      }

      const payload = {
        process_stage_id,
        item_id,
        brand_id,
        shift_id,
        location_id,
        submitted_by,
        entry_date,
        input_qty,
        production_qty,
        rejected_qty,
        solvage_qty,
        fettling_option,
        first_coat_option,
        next_step_selection,
        transfer_type,
        transfer_location_id,
        transfer_qty,
        comment,
      };

      await productionService.createEntry(payload, req.user);
      return apiResponse(res, 201, 'success', {
        message: 'Production entry created successfully',
      });
    } catch (error) {
      console.log(error);
      return apiResponse(res, 400, error.message);
    }
  }

  static async submitStageEntry(req, res) {
    try {
      await productionService.processSubmissions(req.body, req.user);
      return apiResponse(res, 201, 'success', {
        message: 'Stage entries recorded successfully',
      });
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

  static async getStats(req, res) {
    try {
      const stats = await productionService.getStats();
      return apiResponse(res, 200, 'success', stats);
    } catch (error) {
      return apiResponse(res, 500, error.message);
    }
  }

  static async getLogDetails(req, res) {
    try {
      const logs = await productionService.getLogDetails();
      return apiResponse(res, 200, 'success', logs);
    } catch (error) {
      return apiResponse(res, 500, error.message);
    }
  }
}

module.exports = ProductionController;
