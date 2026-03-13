const pool = require('../../config/mysql');

class ItemService {
  static async getItemsByBrand(brandId) {
    const [items] = await pool.query(
      'SELECT * FROM items WHERE brand_id = ? AND status = 1',
      [brandId],
    );
    return items;
  }

  static async createItem(data) {
    const [result] = await pool.execute(
      'INSERT INTO items (brand_id, name) VALUES (?, ?)',
      [data.brandId, data.name],
    );
    return result.insertId;
  }

  static async updateItem(id, data) {
    let query = 'UPDATE items SET ';
    const fields = [];
    const values = [];

    if (data.name) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }

    if (fields.length === 0) return;

    query += fields.join(', ') + ' WHERE id = ?';
    values.push(id);

    await pool.execute(query, values);
  }

  static async deleteItem(id) {
    await pool.execute('UPDATE items SET status = 0 WHERE id = ?', [id]);
  }
}

module.exports = ItemService;
