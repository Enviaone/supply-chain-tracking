const pool = require('../../config/mysql');

class LocationService {
    static async createLocation(data) {
        const [result] = await pool.execute(
            'INSERT INTO locations (name, location_type, plant_id) VALUES (?, ?, ?)',
            [data.name, data.locationType || 'internal', data.plantId || null]
        );
        return result.insertId;
    }

    static async getLocations() {
        const [locations] = await pool.query('SELECT * FROM locations WHERE status = 1');
        return locations;
    }

    static async updateLocation(id, data) {
        let query = 'UPDATE locations SET ';
        const fields = [];
        const values = [];

        if (data.name) { fields.push('name = ?'); values.push(data.name); }
        if (data.locationType) { fields.push('location_type = ?'); values.push(data.locationType); }
        if (data.plantId !== undefined) { fields.push('plant_id = ?'); values.push(data.plantId); }
        if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }

        if (fields.length === 0) return;

        query += fields.join(', ') + ' WHERE id = ?';
        values.push(id);

        await pool.execute(query, values);
    }

    static async deleteLocation(id) {
        await pool.execute('UPDATE locations SET status = 0 WHERE id = ?', [id]);
    }
}

module.exports = LocationService;
