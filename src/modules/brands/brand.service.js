const pool = require('../../config/mysql');

class BrandService {
    static async createBrand(name) {
        const [result] = await pool.execute('INSERT INTO brands (name) VALUES (?)', [name]);
        return result.insertId;
    }

    static async getBrands() {
        const [brands] = await pool.query('SELECT * FROM brands WHERE status = 1');
        return brands;
    }

    static async updateBrand(id, name, status) {
        let query = 'UPDATE brands SET ';
        const fields = [];
        const values = [];

        if (name) { fields.push('name = ?'); values.push(name); }
        if (status !== undefined) { fields.push('status = ?'); values.push(status); }

        if (fields.length === 0) return;

        query += fields.join(', ') + ' WHERE id = ?';
        values.push(id);

        await pool.execute(query, values);
    }

    static async deleteBrand(id) {
        await pool.execute('UPDATE brands SET status = 0 WHERE id = ?', [id]);
    }
}

module.exports = BrandService;
