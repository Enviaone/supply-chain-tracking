const pool = require('../../config/mysql');

class ItemService {
  static async getItemsByBrand(brandId) {
    const [items] = await pool.query(
      'SELECT items.id, items.brand_id, items.name, items.item_code as code, processes.id as processId, processes.name AS processName FROM items JOIN processes ON items.process_id = processes.id WHERE items.brand_id = ? AND items.status = 1',
      [brandId],
    );
    return items;
  }

  static async getItemsByBrandAndStage(stageKey, brandId) {
    const [items] = await pool.query(
      `SELECT
           i.id ,
           i.item_code AS code,
           i.name         ,
           b.id                    AS brand_id,
           b.name                  AS brand_name,
           ps.id                   AS process_stage_id,
           ps.stage_key,
           ps.stage_name,
           p.id                    AS processId,
           p.code                  AS processCode,

           ps.has_fettling_option,
           ps.has_first_coat_option,
           ps.has_next_step_select,

          -- default_location_id: only populated for GD
          CASE
          WHEN p.id = 2 THEN (
              SELECT pst_inner.condition_value
              FROM process_stage_transitions pst_inner
              WHERE pst_inner.from_stage_id  = ps.id
                AND pst_inner.process_id     = p.id
                AND pst_inner.condition_type = 'LOCATION'
                AND pst_inner.is_default     = 1
                AND (pst_inner.status = 1 OR pst_inner.status IS NULL)
              LIMIT 1
          )
          ELSE NULL
          END AS default_location_id

       FROM process_stages ps
       JOIN processes p ON p.id  = ps.process_id
       JOIN items i     ON i.process_id = ps.process_id
       JOIN brands b    ON b.id  = i.brand_id
       WHERE ps.stage_key  = ?
         AND b.id = ?
         AND ps.status  = 1
         AND i.status   = 1
       ORDER BY b.name, i.name;`,
      [stageKey, brandId],
    );
    return items;
  }

  static async createItem(data) {
    const [result] = await pool.execute(
      'INSERT INTO items (brand_id, name, item_code, process_id) VALUES (?, ?, ?, ?)',
      [data.brandId, data.name, data.code, data.processId],
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
    if (data.itemCode) {
      fields.push('item_code = ?');
      values.push(data.itemCode);
    }
    if (data.processId) {
      fields.push('process_id = ?');
      values.push(data.processId);
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
