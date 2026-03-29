const pool = require('../../config/mysql');
const bcrypt = require('bcrypt');

class UserService {
  static async createUser(data) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const status = data.isActive === undefined ? 1 : data.isActive ? 1 : 0;

      if (data.password) {
        data.password = bcrypt.hashSync(data.password, 10);
        console.log('hashed password', data.password);
      }

      const [result] = await connection.execute(
        'INSERT INTO users (name, phone, email, password, status) VALUES (?, ?, ?, ?, ?)',
        [
          data.name,
          data.phone,
          data.email || null,
          data.password || null,
          status,
        ],
      );

      const userId = result.insertId;

      // Handle roles (admin role cannot be assigned alongside others, handled externally usually)
      if (data.roles && Array.isArray(data.roles)) {
        for (const roleId of data.roles) {
          const [roleRecords] = await connection.execute(
            `SELECT id FROM roles WHERE id = ? AND status = '1'`,
            [roleId],
          );
          if (roleRecords.length > 0) {
            await connection.execute(
              'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
              [userId, roleId],
            );
          }
        }
      }

      await connection.commit();
      return userId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getUsers() {
    const [users] = await pool.query(`
            SELECT
          u.id,
          u.name,
          u.email,
          u.phone,
          u.status AS isActive,
          CASE WHEN u.status = 1 THEN 'Active' ELSE 'Inactive' END   AS status,
          GROUP_CONCAT(r.id ORDER BY r.id SEPARATOR ', ')          AS roles,
          DATE_FORMAT(u.created_at, '%b %d, %Y')                        AS since
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r        ON r.id      = ur.role_id
      GROUP BY u.id, u.name, u.email, u.phone, u.status, u.created_at
      ORDER BY u.id DESC;
        `);

    return users;
  }

  static async updateUser(id, data) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const updateFields = [];
      const values = [];

      // 🔹 Basic fields update
      if (data.name !== undefined) {
        updateFields.push('name = ?');
        values.push(data.name);
      }

      if (data.phone !== undefined) {
        updateFields.push('phone = ?');
        values.push(data.phone);
      }

      if (data.isActive !== undefined) {
        updateFields.push('status = ?');
        values.push(data.isActive ? 1 : 0);
      }

      if (data.emailId !== undefined) {
        updateFields.push('email = ?');
        values.push(data.emailId);
      }

      // 🔐 Password hashing
      if (data.password !== undefined && data.password !== '') {
        // use bcrypt for password hashing
        data.password = bcrypt.hashSync(data.password, 10);

        updateFields.push('password = ?');
        values.push(data.password);
      }

      // 🔹 Update user table
      if (updateFields.length > 0) {
        values.push(id);

        await connection.execute(
          `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
          values,
        );
      }

      // 🔹 Roles update (SOFT DELETE LOGIC)
      if (Array.isArray(data.roles)) {
        // 1️⃣ Fetch valid roles
        const [validRoles] = await connection.query(
          `SELECT id, role_key FROM roles
         WHERE id IN (?) AND status = 1`,
          [data.roles],
        );

        if (validRoles.length !== data.roles.length) {
          throw new Error('One or more roles are invalid');
        }

        // 2️⃣ Admin exclusivity
        const isAdminSelected = validRoles.some((r) => r.role_key === 'ADMIN');

        if (isAdminSelected && validRoles.length > 1) {
          throw new Error('ADMIN role cannot be combined with other roles');
        }

        // 3️⃣ Fetch existing roles
        const [existingRoles] = await connection.query(
          `SELECT role_id FROM user_roles WHERE user_id = ?`,
          [id],
        );

        const existingRoleIds = existingRoles.map((r) => r.role_id);
        const newRoleIds = data.roles;

        // 4️⃣ Compute differences
        const rolesToDeactivate = existingRoleIds.filter(
          (r) => !newRoleIds.includes(r),
        );

        const rolesToAdd = newRoleIds.filter(
          (r) => !existingRoleIds.includes(r),
        );

        const rolesToKeep = newRoleIds.filter((r) =>
          existingRoleIds.includes(r),
        );

        // 5️⃣ Soft delete removed roles
        if (rolesToDeactivate.length > 0) {
          await connection.query(
            `UPDATE user_roles
           SET status = 0
           WHERE user_id = ? AND role_id IN (?)`,
            [id, rolesToDeactivate],
          );
        }

        // 6️⃣ Reactivate existing roles
        if (rolesToKeep.length > 0) {
          await connection.query(
            `UPDATE user_roles
           SET status = 1
           WHERE user_id = ? AND role_id IN (?)`,
            [id, rolesToKeep],
          );
        }

        // 7️⃣ Insert new roles
        if (rolesToAdd.length > 0) {
          const insertValues = rolesToAdd.map((roleId) => [id, roleId, 1]);

          await connection.query(
            `INSERT INTO user_roles (user_id, role_id, status) VALUES ?`,
            [insertValues],
          );
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

  static async deleteUser(id) {
    // Logical delete
    await pool.execute('UPDATE users SET status = 0 WHERE id = ?', [id]);
  }

  static async getUserStages(userId) {
    const [stages] = await pool.query(
      `SELECT *
       FROM (
           SELECT
               p.name            AS process_name,
               ps.sequence_order AS seq,
               p.id              AS process_id,
               ps.id             AS stage_id,
               ps.stage_name,
               ps.stage_key,
               rsa.can_view,
               rsa.can_enter,
               ROW_NUMBER() OVER (
                   PARTITION BY ps.stage_key
                   ORDER BY ps.sequence_order
               ) AS rn
           FROM user_roles ur
           JOIN roles r                ON r.id  = ur.role_id
           JOIN role_stage_access rsa  ON rsa.role_id = r.id
           JOIN process_stages ps      ON ps.id = rsa.process_stage_id
           JOIN processes p            ON p.id  = ps.process_id
           WHERE ur.user_id = ?
           AND ps.status = 1
           AND (
               r.role_key != 'INSPECTION'
               OR ps.stage_key = 'INSPECTION'
           )
       ) t
       WHERE rn = 1
       ORDER BY seq;`,
      [userId],
    );
    return stages;
  }

  static async getRoles() {
    const [roles] = await pool.query(
      'SELECT id, label AS role_name, role_key FROM roles WHERE status = 1',
    );
    return roles;
  }

  static async getUsersList() {
    const [users] = await pool.query(`
      SELECT
          u.id,
          u.name,
          u.email,
          u.phone,
          u.status AS isActive,
          CASE WHEN u.status = 1 THEN 'Active' ELSE 'Inactive' END   AS status,
          GROUP_CONCAT(r.id ORDER BY r.id SEPARATOR ', ')          AS roles,
          DATE_FORMAT(u.created_at, '%b %d, %Y')                        AS since
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r        ON r.id      = ur.role_id
      GROUP BY u.id, u.name, u.email, u.phone, u.status, u.created_at
      ORDER BY u.id DESC;
    `);
    return users;
  }

  static async getStats() {
    const [stats] = await pool.query(`
      SELECT
          COUNT(DISTINCT u.id) AS total_users,
          COUNT(DISTINCT CASE
              WHEN r.role_key = 'ADMIN' THEN u.id
          END) AS administrators,
          COUNT(DISTINCT CASE
              WHEN r.role_key != 'ADMIN' THEN u.id
          END) AS stage_operators,
          COUNT(DISTINCT CASE
              WHEN u.status = 1 THEN u.id
          END) AS active_users
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id;
    `);
    return stats[0];
  }

  static async getUserDetails(userId) {
    const [users] = await pool.query(
      `SELECT
          u.id,
          u.name,
          u.email,
          u.phone,

          -- ✅ Roles (deduplicated via subquery)
          (
              SELECT JSON_ARRAYAGG(
                  JSON_OBJECT(
                      'role_id',    r.id,
                      'role_key',   r.role_key,
                      'role_label', r.label,
                      'is_admin',   r.is_admin
                  )
              )
              FROM (
                  SELECT DISTINCT r.id, r.role_key, r.label, r.is_admin
                  FROM user_roles ur2
                  JOIN roles r ON r.id = ur2.role_id
                  WHERE ur2.user_id = u.id
                    AND r.status = 1
                    AND ur2.status = 1
              ) r
          ) AS roles,

          -- ✅ Stage access (deduplicated)
          (
              SELECT JSON_ARRAYAGG(
                  JSON_OBJECT(
                      'process_stage_id',  ps.id,
                      'stage_key',         ps.stage_key,
                      'stage_name',        ps.stage_name,
                      'sequence_order',    ps.sequence_order,
                      'has_input_qty',         ps.has_input_qty,
                      'has_first_coat_option', ps.has_first_coat_option,
                      'has_fettling_option',   ps.has_fettling_option,
                      'has_outward_transfer',  ps.has_outward_transfer,
                      'has_inward_transfer',   ps.has_inward_transfer,
                      'has_next_step_select',  ps.has_next_step_select
                  )
              )
        FROM (
            SELECT DISTINCT
                ps.id, ps.stage_key, ps.stage_name, ps.sequence_order,
                ps.has_input_qty, ps.has_first_coat_option,
                ps.has_fettling_option, ps.has_outward_transfer,
                ps.has_inward_transfer, ps.has_next_step_select,
                 p.name, p.code
            FROM user_roles ur3
            JOIN roles r3 ON r3.id = ur3.role_id
            LEFT JOIN role_stage_access rsa ON rsa.role_id = r3.id
            LEFT JOIN process_stages ps ON ps.id = rsa.process_stage_id
            LEFT JOIN processes p ON p.id = ps.process_id
            WHERE ur3.user_id = u.id
              AND ur3.status = 1
              AND r3.status = 1
              AND ps.status = 1
                    ) ps
                ) AS stage_access

            FROM users u
            WHERE u.id = ?
            AND u.status = 1;`,
      [userId],
    );
    return users.length > 0 ? users[0] : null;
  }

  static async mockLogin() {
    // format the query to return a flat structure
    const [users] = await pool.query(`
            SELECT
            u.id AS id,
            u.name,
            u.email AS email,
            u.password AS password,
            r.role_key AS roleKey,
            r.label AS roleLabel,
            r.is_admin AS isAdmin
            FROM user_roles ur
            JOIN users u ON u.id  = ur.user_id
            JOIN roles r  ON r.id = ur.role_id
            ORDER BY u.id, r.role_key;`);
    return users;
  }
}

module.exports = UserService;
