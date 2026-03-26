const processService = require('./process.service');
const { apiResponse } = require('../../utils/response');

class ProcessController {
  static async getProcesses(req, res) {
    try {
      const processes = await processService.getProcesses();
      return apiResponse(res, 200, 'success', processes);
    } catch (error) {
      return apiResponse(res, 500, error.message);
    }
  }

  static async getProcessById(req, res) {
    try {
      const processId = req.params.id;
      const process = await processService.getProcessById(processId);
      if (!process) {
        return apiResponse(res, 404, 'Process not found');
      }
      return apiResponse(res, 200, 'success', process);
    } catch (error) {
      console.error('Error fetching process:', error);
      return apiResponse(res, 500, error.message);
    }
  }

  static async getProcessStages(req, res) {
    try {
      const processId = req.params.processId;
      let stages = await processService.getProcessStages(processId);

      if (stages && stages.length) {
        stages.forEach((stage) => {
          stage.has_input_qty = stage.has_input_qty === 1 ? true : false;
          stage.has_production_qty =
            stage.has_production_qty === 1 ? true : false;
          stage.has_rejection_qty =
            stage.has_rejection_qty === 1 ? true : false;
          stage.has_salvage_qty = stage.has_salvage_qty === 1 ? true : false;
          stage.has_dispatch_qty = stage.has_dispatch_qty === 1 ? true : false;
          stage.has_fettling_option =
            stage.has_fettling_option === 1 ? true : false;
          stage.has_first_coat_option =
            stage.has_first_coat_option === 1 ? true : false;
          stage.has_location_select =
            stage.has_location_select === 1 ? true : false;
          stage.has_next_step_select =
            stage.has_next_step_select === 1 ? true : false;
          stage.has_outward_transfer =
            stage.has_outward_transfer === 1 ? true : false;
          stage.has_inward_transfer =
            stage.has_inward_transfer === 1 ? true : false;
        });
      }

      return apiResponse(res, 200, 'success', stages);
    } catch (error) {
      console.error('Error fetching process stages:', error);
      return apiResponse(res, 500, error.message);
    }
  }

  static async getProcessStageById(req, res) {
    try {
      const processId = req.params.processId;
      const stageId = req.params.stageId;
      let stage = await processService.getProcessStageById(processId, stageId);
      if (!stage) {
        return apiResponse(res, 404, 'Stage not found');
      }

      stage.has_input_qty = stage.has_input_qty === 1 ? true : false;
      stage.has_production_qty = stage.has_production_qty === 1 ? true : false;
      stage.has_rejection_qty = stage.has_rejection_qty === 1 ? true : false;
      stage.has_salvage_qty = stage.has_salvage_qty === 1 ? true : false;
      stage.has_dispatch_qty = stage.has_dispatch_qty === 1 ? true : false;
      stage.has_fettling_option =
        stage.has_fettling_option === 1 ? true : false;
      stage.has_first_coat_option =
        stage.has_first_coat_option === 1 ? true : false;
      stage.has_location_select =
        stage.has_location_select === 1 ? true : false;
      stage.has_next_step_select =
        stage.has_next_step_select === 1 ? true : false;
      stage.has_outward_transfer =
        stage.has_outward_transfer === 1 ? true : false;
      stage.has_inward_transfer =
        stage.has_inward_transfer === 1 ? true : false;

      return apiResponse(res, 200, 'success', stage);
    } catch (error) {
      console.error('Error fetching process stage:', error);
      return apiResponse(res, 500, error.message);
    }
  }

  static async updateProcessStagesOrder(req, res) {
    try {
      const processId = req.params.processId;
      const stages = req.body.stageIds;
      await processService.updateProcessStagesOrder(processId, stages);
      return apiResponse(res, 200, 'success', 'Process stages order updated');
    } catch (error) {
      console.error('Error updating process stages order:', error);
      return apiResponse(res, 500, error.message);
    }
  }
}

module.exports = ProcessController;
