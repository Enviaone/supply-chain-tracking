const pool = require('../../config/mysql');
const { STAGE_INVENTORY_QUERIES } = require('./query');

class StageInventoryService {
  static async getStageTracking(process_id, item_id, entry_date) {
    const [rows] = await pool.query(
      STAGE_INVENTORY_QUERIES.GET_STAGE_TRACKING,
      [entry_date, process_id, item_id],
    );

    // Shape into a flow with carry-forward tracking
    const stages = rows.map((row) => ({
      sequence_order: row.sequence_order,
      process_stage_id: row.process_stage_id,
      stage_key: row.stage_key,
      stage_name: row.stage_name,
      is_external: row.is_external === 1,
      item: {
        item_id: row.item_id,
        item_name: row.item_name,
        item_code: row.item_code,
        brand_name: row.brand_name,
      },
      units: {
        input_qty: row.total_input_qty,
        produced_qty: row.total_produced_qty,
        available_qty: row.available_qty,
      },
      has_activity: row.total_produced_qty > 0,
      updated_at: row.updated_at,
    }));

    return stages;
  }

  static async getAvailableAtStage(process_stage_id, item_id) {
    const [rows] = await pool.query(
      STAGE_INVENTORY_QUERIES.GET_AVAILABLE_AT_STAGE,
      [item_id, item_id, process_stage_id],
    );
    return rows;
  }
}

module.exports = StageInventoryService;
