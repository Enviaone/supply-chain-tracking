const pool = require('../../config/mysql');

class DashboardService {
    static async getProductionSummary(range) {
        // Mock date filter logic, usually we'd parse this natively e.g. DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        const days = parseInt(range.replace('d', '')) || 7;

        const query = `
            SELECT p.plant_id, pl.name as plant_name, SUM(p.output_qty) as total_production
            FROM production_stage_entries p
            JOIN plants pl ON pl.id = p.plant_id
            WHERE p.entry_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY p.plant_id, pl.name
            ORDER BY total_production DESC
        `;

        const [results] = await pool.query(query, [days]);

        // Further detailed querying can be added here (e.g., stage-wise inventory)
        const [stageInventory] = await pool.query(`
            SELECT s.name as stage_name, SUM(i.qty) as pending_inventory
            FROM inventory_ledger i
            JOIN stages s ON s.id = i.stage_id
            GROUP BY s.name
        `);

        return {
            plantWiseProduction: results,
            stageWiseInventory: stageInventory
        };
    }

    static async getRejectionAnalysis(range) {
        const days = parseInt(range.replace('d', '')) || 30;

        const query = `
            SELECT s.name as stage_name, SUM(rl.rejection_qty) as total_rejections
            FROM inspection_logs rl
            JOIN stages s ON s.id = rl.stage_id
            WHERE rl.inspection_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY s.name
            ORDER BY total_rejections DESC
        `;

        const [results] = await pool.query(query, [days]);
        return results;
    }
}

module.exports = DashboardService;
