const pool = require('../../config/mysql');

class ProcessService {
  static async getProcesses() {
    const [processes] = await pool.query(
      'SELECT * FROM processes WHERE status = 1',
    );
    return processes;
  }

  static async getProcessById(processId) {
    const [[process]] = await pool.query(
      'SELECT * FROM processes WHERE id = ? AND status = 1',
      [processId],
    );
    return process;
  }

  static async getProcessStages(processId) {
    const [stages] = await pool.query(
      'SELECT * FROM process_stages WHERE process_id = ? AND status = 1 AND is_global = 0',
      [processId],
    );
    return stages;
  }

  static async getProcessStageById(processId, stageId) {
    const [[stage]] = await pool.query(
      'SELECT * FROM process_stages WHERE id = ? AND process_id = ? AND status = 1',
      [stageId, processId],
    );
    return stage;
  }

  static async updateProcessStagesOrder(processId, stageIds) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Pass 1: Set to temporary values to avoid unique constraint collisions
      // We add 10000 to the order to ensure it doesn't collide with existing orders
      for (const stageId of stageIds) {
        await connection.query(
          'UPDATE process_stages SET sequence_order = ? WHERE id = ? AND process_id = ?',
          [stageId.order + 10000, stageId.id, processId],
        );
      }

      // Pass 2: Set to final positive values
      for (const stageId of stageIds) {
        await connection.query(
          'UPDATE process_stages SET sequence_order = ? WHERE id = ? AND process_id = ?',
          [stageId.order, stageId.id, processId],
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = ProcessService;
