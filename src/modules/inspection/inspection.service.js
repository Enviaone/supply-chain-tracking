const pool = require('../../config/mysql');
const LedgerService = require('../ledger/ledger.service');
// const { addAuditLog } = require('../../queues/audit.queue');

class InspectionService {
    static async inspectBatch(data, user) {
        const { batchNumber, stageId: stageName, rejectionQty } = data;
        
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [batches] = await connection.execute('SELECT id, brand_id, item_id, current_stage_id, plant_id FROM production_batches WHERE batch_number = ?', [batchNumber]);
            if (batches.length === 0) throw new Error('Batch not found');
            const batch = batches[0];

            let targetStageId = batch.current_stage_id;
            if (stageName) {
                const [stages] = await connection.execute('SELECT id FROM stages WHERE name = ?', [stageName]);
                if (stages.length > 0) targetStageId = stages[0].id;
            }

            const parsedRejectionQty = parseInt(rejectionQty) || 0;
            if (parsedRejectionQty <= 0) throw new Error('Rejection quantity must be greater than zero');

            // Insert into inspection_logs
            const [inspectionRes] = await connection.execute(
                `INSERT INTO inspection_logs (batch_id, stage_id, rejection_qty, inspected_by, inspection_date)
                 VALUES (?, ?, ?, ?, CURDATE())`,
                [batch.id, targetStageId, parsedRejectionQty, user.id]
            );

            // Create negative ledger entry
            await LedgerService.addLedgerEntry(connection, {
                batch_id: batch.id,
                brand_id: batch.brand_id,
                item_id: batch.item_id,
                plant_id: batch.plant_id,
                stage_id: targetStageId,
                movement_type: 'rejection',
                reference_table: 'inspection_logs',
                reference_id: inspectionRes.insertId,
                qty: parsedRejectionQty, // LedgerService.addLedgerEntry makes it negative for rejection
                created_by: user.id
            });

            // Audit
            // addAuditLog({
            //     module: 'inspection_logs',
            //     recordId: inspectionRes.insertId,
            //     action: 'CREATE',
            //     batchId: batch.id,
            //     stageId: targetStageId,
            //     newValue: { rejectionQty: parsedRejectionQty },
            //     userId: user.id,
            //     plantId: batch.plant_id
            // });

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = InspectionService;
