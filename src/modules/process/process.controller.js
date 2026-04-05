const processService = require('./process.service');
const { apiResponse } = require('../../utils/response');
const pool = require('../../config/mysql');
const { PROCESS_QUERIES } = require('./queries');

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
    const { processId } = req.params;

    if (!processId) {
      return res.status(400).json({
        success: false,
        message: 'processId is required',
      });
    }

    try {
      const [[stageRows], [locationTransRows], [flowRows]] = await Promise.all([
        pool.query(PROCESS_QUERIES.GET_STAGES, [processId]),
        pool.query(PROCESS_QUERIES.GET_STAGE_TRANSITIONS, [processId]),
        pool.query(PROCESS_QUERIES.GET_RECURSIVE_FLOW, [processId]),
      ]);

      const locationMetaMap = new Map();

      for (const row of locationTransRows) {
        const key = `${row.from_stage_id}_${row.location_id}`;
        if (!locationMetaMap.has(key)) {
          locationMetaMap.set(key, {
            location_id: parseInt(row.location_id),
            location_name: row.location_name,
            location_code: row.location_code,
            location_stages: [],
          });
        }
      }

      for (const row of flowRows) {
        const key = `${row.from_stage_id}_${row.location_id}`;
        if (locationMetaMap.has(key)) {
          locationMetaMap
            .get(key)
            .location_stages.push(formatStage(row, 'stage_id'));
        }
      }

      const stageLocationMap = new Map();

      for (const [key, locGroup] of locationMetaMap.entries()) {
        const fromStageId = parseInt(key.split('_')[0]);
        if (!stageLocationMap.has(fromStageId)) {
          stageLocationMap.set(fromStageId, []);
        }
        stageLocationMap.get(fromStageId).push(locGroup);
      }

      const branchStages = stageRows.filter((s) => s.has_next_step_select);

      const branchResults = await Promise.all(
        branchStages.map((s) =>
          pool
            .query(PROCESS_QUERIES.GET_BRANCH_OPTIONS, [s.id])
            .then(([rows]) => ({ stage_id: s.id, options: rows })),
        ),
      );

      const branchMap = new Map(
        branchResults.map((r) => [r.stage_id, r.options]),
      );

      const stages = stageRows.map((row) => {
        const stage = formatStage(row);

        // Inject location tree for outward transfer stages
        if (stage.has_outward_transfer && stageLocationMap.has(stage.id)) {
          stage.locations = stageLocationMap.get(stage.id);
        }

        // Inject branch options for next step select stages
        if (stage.has_next_step_select && branchMap.has(stage.id)) {
          stage.next_step_options = branchMap.get(stage.id).map((opt) => ({
            ...opt,
          }));
        }

        return stage;
      });

      return res.status(200).json({
        success: true,
        total: stages.length,
        data: stages,
      });
    } catch (err) {
      console.error('getProcessStages error:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
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

const formatStage = (row) => ({
  id: row.id ?? row.stage_id,
  process_id: row.process_id,
  stage_key: row.stage_key,
  stage_name: row.stage_name,
  sequence_order: row.sequence_order,
  has_input_qty: Boolean(row.has_input_qty),
  has_production_qty: Boolean(row.has_production_qty),
  has_rejection_qty: Boolean(row.has_rejection_qty),
  has_salvage_qty: Boolean(row.has_salvage_qty),
  has_dispatch_qty: Boolean(row.has_dispatch_qty),
  has_fettling_option: Boolean(row.has_fettling_option),
  has_first_coat_option: Boolean(row.has_first_coat_option),
  has_location_select: Boolean(row.has_location_select),
  has_outward_transfer: Boolean(row.has_outward_transfer),
  has_inward_transfer: Boolean(row.has_inward_transfer),
  has_next_step_select: Boolean(row.has_next_step_select),
  status: row.status,
});

module.exports = ProcessController;
