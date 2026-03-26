const pool = require('../../config/mysql');

class BrandService {
  static async createBrand(name, code) {
    const [result] = await pool.execute(
      'INSERT INTO brands (name, code) VALUES (?, ?)',
      [name, code],
    );
    return result.insertId;
  }

  static async getBrandById(id) {
    const [brands] = await pool.query(
      `SELECT * FROM brands WHERE id = ? AND status = 1`,
      [id],
    );
    return brands[0];
  }

  static async getBrands(search = '') {
    const [brands] = await pool.query(
      `SELECT brands.*, COUNT(items.id) AS itemsCount FROM brands
      LEFT JOIN items ON brands.id = items.brand_id
      WHERE brands.status = 1 ${search ? ' AND brands.name LIKE ?' : ''}
      GROUP BY brands.id`,
      [`%${search}%`],
    );
    return brands;
  }

  static async updateBrand(id, name, status) {
    let query = 'UPDATE brands SET ';
    const fields = [];
    const values = [];

    if (name) {
      fields.push('name = ?');
      values.push(name);
    }
    if (status !== undefined) {
      fields.push('status = ?');
      values.push(status);
    }

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
