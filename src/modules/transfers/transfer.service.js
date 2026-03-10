const pool = require('../../config/mysql');
const LedgerService = require('../ledger/ledger.service');
// const { addAuditLog } = require('../../queues/audit.queue');

class TransferService {
    static async transferOut(data, user) {
        const { batchNumber, stageId: stageName, toLocationId, transferQty } = data;
        
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

            const parsedQty = parseInt(transferQty) || 0;
            if (parsedQty <= 0) throw new Error('Quantity must be positive');

            const availableStock = await LedgerService.getBatchInventory(batch.id, targetStageId);
            if (parsedQty > availableStock) {
                throw new Error('Insufficient stock for transfer');
            }

            const [transferRes] = await connection.execute(
                `INSERT INTO batch_transfers (batch_id, stage_id, from_plant_id, to_location_id, transfer_qty, transfer_date, created_by)
                 VALUES (?, ?, ?, ?, ?, CURDATE(), ?)`,
                [batch.id, targetStageId, batch.plant_id, toLocationId, parsedQty, user.id]
            );

            await LedgerService.addLedgerEntry(connection, {
                batch_id: batch.id,
                brand_id: batch.brand_id,
                item_id: batch.item_id,
                plant_id: batch.plant_id,
                stage_id: targetStageId,
                movement_type: 'transfer_out',
                reference_table: 'batch_transfers',
                reference_id: transferRes.insertId,
                qty: parsedQty,
                created_by: user.id
            });

            // addAuditLog({
            //     module: 'batch_transfers',
            //     recordId: transferRes.insertId,
            //     action: 'CREATE',
            //     batchId: batch.id,
            //     stageId: targetStageId,
            //     newValue: { transferQty: parsedQty, toLocationId },
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

    static async receiveTransfer(data, user) {
        const { transferId, locationId, receivedQty } = data;
        
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [transfers] = await connection.execute('SELECT * FROM batch_transfers WHERE id = ?', [transferId]);
            if (transfers.length === 0) throw new Error('Transfer record not found');
            const transfer = transfers[0];

            const parsedQty = parseInt(receivedQty) || 0;
            if (parsedQty <= 0) throw new Error('Quantity must be positive');

            const [receiptRes] = await connection.execute(
                `INSERT INTO batch_receipts (transfer_id, batch_id, stage_id, location_id, received_qty, received_date, received_by)
                 VALUES (?, ?, ?, ?, ?, CURDATE(), ?)`,
                [transfer.id, transfer.batch_id, transfer.stage_id, locationId, parsedQty, user.id]
            );

            // Need to get details for ledger
            const [batches] = await connection.execute('SELECT brand_id, item_id, plant_id FROM production_batches WHERE id = ?', [transfer.batch_id]);
            const batch = batches[0];

            await LedgerService.addLedgerEntry(connection, {
                batch_id: transfer.batch_id,
                brand_id: batch.brand_id,
                item_id: batch.item_id,
                plant_id: batch.plant_id,
                stage_id: transfer.stage_id,
                location_id: locationId,
                movement_type: 'transfer_in',
                reference_table: 'batch_receipts',
                reference_id: receiptRes.insertId,
                qty: parsedQty,
                created_by: user.id
            });

            // addAuditLog({
            //     module: 'batch_receipts',
            //     recordId: receiptRes.insertId,
            //     action: 'CREATE',
            //     batchId: transfer.batch_id,
            //     stageId: transfer.stage_id,
            //     newValue: { receivedQty: parsedQty, locationId },
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

module.exports = TransferService;
