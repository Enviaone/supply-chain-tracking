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
        'INSERT INTO users (name, phone, plant_id,email_id,password, status) VALUES (?, ?, ?, ?, ?, ?)',
        [
          data.name,
          data.phone,
          data.plantId || null,
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
                u.phone,
                u.status,
                p.name as plant_name,
                u.email_id as email,
                u.created_at as createdAt,
                GROUP_CONCAT(r.name) as roles
            FROM users u
            LEFT JOIN plants p ON p.id = u.plant_id
            LEFT JOIN user_roles ur ON ur.user_id = u.id
            LEFT JOIN roles r ON r.id = ur.role_id
            GROUP BY u.id
        `);

    let totalUsers = users.length;
    let totalActiveUsers = 0;
    let adminUsersCount = 0;
    let stageOperatorCount = 0;

    const formattedUsers = users.map((u) => {
      const isActive = u.status === 1 || u.status === '1';
      if (isActive) totalActiveUsers++;

      const rolesArr = u.roles ? u.roles.split(',') : [];

      if (rolesArr.includes('ADMIN')) {
        adminUsersCount++;
      } else if (rolesArr.length > 0) {
        stageOperatorCount++;
      }

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        roles: rolesArr,
        phone: u.phone,
        createdAt: new Date(u.createdAt).toISOString().split('T')[0],
        isActive: isActive,
      };
    });

    return {
      users: formattedUsers,
      totalUsers,
      totalActiveUsers,
      adminUsersCount,
      stageOperatorCount,
    };
  }

  static async updateUser(id, data) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const updateFields = [];
      const values = [];

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
      if (data.plantId !== undefined) {
        updateFields.push('plant_id = ?');
        values.push(data.plantId);
      }
      if (data.emailId !== undefined) {
        updateFields.push('email_id = ?');
        values.push(data.emailId);
      }
      if (data.password !== undefined) {
        updateFields.push('password = ?');
        values.push(data.password);
      }

      if (updateFields.length > 0) {
        values.push(id);
        await connection.execute(
          `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
          values,
        );
      }

      if (data.roles && Array.isArray(data.roles)) {
        await connection.execute('DELETE FROM user_roles WHERE user_id = ?', [
          id,
        ]);
        for (const roleName of data.roles) {
          const [roleRecords] = await connection.execute(
            'SELECT id FROM roles WHERE name = ?',
            [roleName],
          );
          if (roleRecords.length > 0) {
            await connection.execute(
              'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
              [id, roleRecords[0].id],
            );
          }
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
      'SELECT id, name FROM roles WHERE status = 1',
    );
    return roles;
  }

  static async getUserDetails(phone) {
    const [users] = await pool.query(
      'SELECT id, name, phone, plant_id, email_id as emailId, status FROM users WHERE phone = ?',
      [phone],
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
            u.password_hash AS password,
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
