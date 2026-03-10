const pool = require('../../config/mysql');

class LedgerService {
    /**
     * Add an entry to the inventory ledger.
     * All inventory calculations rely on this.
     */
    static async addLedgerEntry(connection, entryData) {
        // connection can be a transaction connection or the default pool
        const db = connection || pool;
        
        const {
            batch_id,
            brand_id,
            item_id,
            plant_id,
            stage_id,
            location_id,
            movement_type,
            reference_table,
            reference_id,
            qty,
            shift_id,
            created_by
        } = entryData;

        // Ensure movement rules apply (e.g., rejection/stage_input are negative qty)
        let finalQty = qty;
        if (['stage_input', 'transfer_out', 'rejection'].includes(movement_type)) {
            finalQty = -Math.abs(qty); // Always negative
        } else if (['production', 'stage_output', 'transfer_in'].includes(movement_type)) {
            finalQty = Math.abs(qty); // Always positive
        }

        const query = `
            INSERT INTO inventory_ledger 
            (batch_id, brand_id, item_id, plant_id, stage_id, location_id, movement_type, reference_table, reference_id, qty, shift_id, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            batch_id || null,
            brand_id || null,
            item_id || null,
            plant_id || null,
            stage_id || null,
            location_id || null,
            movement_type,
            reference_table,
            reference_id,
            finalQty,
            shift_id || null,
            created_by
        ];

        const [result] = await db.execute(query, values);
        return result.insertId;
    }

    /**
     * Get available stock for a batch at a particular stage
     */
    static async getBatchInventory(batch_id, stage_id) {
        const query = `
            SELECT COALESCE(SUM(qty), 0) AS available_stock 
            FROM inventory_ledger 
            WHERE batch_id = ? AND stage_id = ?
        `;
        const [rows] = await pool.execute(query, [batch_id, stage_id]);
        return parseInt(rows[0].available_stock, 10);
    }
    
    /**
     * Get available stock at a location for an item
     */
    static async getLocationInventory(location_id, item_id) {
        const query = `
            SELECT COALESCE(SUM(qty), 0) AS available_stock 
            FROM inventory_ledger 
            WHERE location_id = ? AND item_id = ?
        `;
        const [rows] = await pool.execute(query, [location_id, item_id]);
        return parseInt(rows[0].available_stock, 10);
    }
}

module.exports = LedgerService;
