const pool = require('../../config/mysql');
const LedgerService = require('../ledger/ledger.service');
// const { addAuditLog } = require('../../queues/audit.queue');
// const { addMismatchAlert } = require('../../queues/alert.queue');
const moment = require('moment');

class ProductionService {
    static async processSubmissions(payload, user) {
        const { stageId: stageName, entries, shift } = payload;
        
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Resolve stage ID from name
            const [stages] = await connection.execute('SELECT id, sequence_order FROM stages WHERE name = ?', [stageName]);
            if (stages.length === 0) throw new Error(`Stage ${stageName} not found`);
            const stageId = stages[0].id;
            const sequenceOrder = stages[0].sequence_order;
            
            // Resolve shift ID if string, assuming it maps or just insert it
            let shiftId = null;
            if (shift) {
                const [shifts] = await connection.execute('SELECT id FROM shifts WHERE shift_name = ?', [shift]);
                if (shifts.length > 0) shiftId = shifts[0].id;
            }

            for (const entry of entries) {
                const { brandId, itemId, data } = entry;
                const { inputQty, productionQty, rejectionQty, location, batchNumber } = data; // Postman uses productionQty instead of outputQty for melting usually, we map it.
                
                const processInputQty = parseInt(inputQty) || 0;
                let processOutputQty = parseInt(productionQty) || parseInt(data.outputQty) || 0;
                const processRejectionQty = parseInt(rejectionQty) || 0;

                // MELTING (First stage) handling
                if (sequenceOrder === 1) {
                    const generatedBatchNumber = `BCH-${moment().format('YYYYMMDDHHmmss')}-${Math.floor(Math.random()*1000)}`;
                    
                    const [batchRes] = await connection.execute(
                        `INSERT INTO production_batches 
                        (batch_number, plant_id, brand_id, item_id, production_date, initial_qty, current_stage_id, created_by) 
                        VALUES (?, ?, ?, ?, CURDATE(), ?, ?, ?)`,
                        [generatedBatchNumber, user.plant_id, brandId, itemId, processOutputQty, stageId, user.id]
                    );
                    const batchId = batchRes.insertId;

                    const [stageEntryRes] = await connection.execute(
                        `INSERT INTO production_stage_entries 
                        (batch_id, stage_id, plant_id, shift_id, entry_date, input_qty, output_qty, rejection_qty, created_by)
                        VALUES (?, ?, ?, ?, CURDATE(), ?, ?, ?, ?)`,
                        [batchId, stageId, user.plant_id, shiftId, processInputQty, processOutputQty, processRejectionQty, user.id]
                    );

                    // Ledger: Production
                    await LedgerService.addLedgerEntry(connection, {
                        batch_id: batchId,
                        brand_id: brandId,
                        item_id: itemId,
                        plant_id: user.plant_id,
                        stage_id: stageId,
                        movement_type: 'production',
                        reference_table: 'production_stage_entries',
                        reference_id: stageEntryRes.insertId,
                        qty: processOutputQty,
                        shift_id: shiftId,
                        created_by: user.id
                    });

                    // Audit
                    // addAuditLog({
                    //     module: 'production_stage_entries',
                    //     recordId: stageEntryRes.insertId,
                    //     action: 'CREATE',
                    //     batchId,
                    //     stageId,
                    //     newValue: { inputQty: processInputQty, outputQty: processOutputQty },
                    //     userId: user.id,
                    //     plantId: user.plant_id
                    // });
                } else {
                    // Subsequent stages (SHOT_BLAST, etc.)
                    // Requires batchNumber to find batch
                    if (!batchNumber) throw new Error('batchNumber is required for subsequent stages');
                    
                    const [batches] = await connection.execute('SELECT id, current_stage_id, brand_id, item_id FROM production_batches WHERE batch_number = ?', [batchNumber]);
                    if (batches.length === 0) throw new Error(`Batch ${batchNumber} not found`);
                    
                    const batch = batches[0];
                    const batchId = batch.id;

                    // Mismatch checking against inventory
                    const availableStock = await LedgerService.getBatchInventory(batchId, batch.current_stage_id);
                    let isMismatch = false;

                    if (processInputQty > availableStock) {
                        isMismatch = true;
                        // Queue alert
                        // addMismatchAlert({
                        //     batchId,
                        //     stageId,
                        //     expectedQty: availableStock,
                        //     enteredQty: processInputQty
                        // });
                    }

                    const [stageEntryRes] = await connection.execute(
                        `INSERT INTO production_stage_entries 
                        (batch_id, stage_id, plant_id, shift_id, entry_date, input_qty, output_qty, rejection_qty, mismatch_flag, created_by)
                        VALUES (?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?)`,
                        [batchId, stageId, user.plant_id, shiftId, processInputQty, processOutputQty, processRejectionQty, isMismatch, user.id]
                    );

                    // Update batch current stage
                    await connection.execute('UPDATE production_batches SET current_stage_id = ? WHERE id = ?', [stageId, batchId]);

                    // Ledger: Consume from previous stage
                    await LedgerService.addLedgerEntry(connection, {
                        batch_id: batchId,
                        brand_id: batch.brand_id,
                        item_id: batch.item_id,
                        plant_id: user.plant_id,
                        stage_id: batch.current_stage_id,
                        movement_type: 'stage_input',
                        reference_table: 'production_stage_entries',
                        reference_id: stageEntryRes.insertId,
                        qty: processInputQty,
                        shift_id: shiftId,
                        created_by: user.id
                    });

                    // Ledger: Output to current stage
                    if (processOutputQty > 0) {
                        await LedgerService.addLedgerEntry(connection, {
                            batch_id: batchId,
                            brand_id: batch.brand_id,
                            item_id: batch.item_id,
                            plant_id: user.plant_id,
                            stage_id: stageId,
                            movement_type: 'stage_output',
                            reference_table: 'production_stage_entries',
                            reference_id: stageEntryRes.insertId,
                            qty: processOutputQty,
                            shift_id: shiftId,
                            created_by: user.id
                        });
                    }

                    // Ledger: Rejections
                    if (processRejectionQty > 0) {
                        await LedgerService.addLedgerEntry(connection, {
                            batch_id: batchId,
                            brand_id: batch.brand_id,
                            item_id: batch.item_id,
                            plant_id: user.plant_id,
                            stage_id: stageId,
                            movement_type: 'rejection',
                            reference_table: 'production_stage_entries',
                            reference_id: stageEntryRes.insertId,
                            qty: processRejectionQty,
                            shift_id: shiftId,
                            created_by: user.id
                        });
                    }

                    // Audit
                    // addAuditLog({
                    //     module: 'production_stage_entries',
                    //     recordId: stageEntryRes.insertId,
                    //     action: 'CREATE',
                    //     batchId,
                    //     stageId,
                    //     newValue: { inputQty: processInputQty, outputQty: processOutputQty },
                    //     userId: user.id,
                    //     plantId: user.plant_id
                    // });
                }
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async getPipeline(user) {
        // Simple query for now
        const [pipeline] = await pool.query(`
            SELECT b.batch_number, s.name as current_stage, b.initial_qty, i.name as item_name
            FROM production_batches b
            JOIN stages s ON s.id = b.current_stage_id
            JOIN items i ON i.id = b.item_id
            WHERE b.status = 'in_progress'
        `);
        return pipeline;
    }
}

module.exports = ProductionService;
