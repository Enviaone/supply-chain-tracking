const pool = require('../../config/mysql');
const bcrypt = require('bcrypt');

class UserService {
    static async createUser(data) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const status = data.isActive === undefined ? 1 : (data.isActive ? 1 : 0);

            if (data.password) {
                data.password = bcrypt.hashSync(data.password, 10);
                console.log("hashed password", data.password);
            }

            const [result] = await connection.execute(
                'INSERT INTO users (name, phone, plant_id,email_id,password, status) VALUES (?, ?, ?, ?, ?, ?)',
                [data.name, data.phone, data.plantId || null, data.email || null, data.password || null, status]
            );

            const userId = result.insertId;

            // Handle roles (admin role cannot be assigned alongside others, handled externally usually)
            if (data.roles && Array.isArray(data.roles)) {
                for (const roleId of data.roles) {
                    const [roleRecords] = await connection.execute(`SELECT id FROM roles WHERE id = ? AND status = '1'`, [roleId]);
                    if (roleRecords.length > 0) {
                        await connection.execute(
                            'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
                            [userId, roleId]
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
        // Just fetch basic joined details for MVP
        const [users] = await pool.query(`
            SELECT u.id, u.name, u.phone, u.status, p.name as plant_name ,u.email_id as emailId
            FROM users u
            LEFT JOIN plants p ON p.id = u.plant_id
        `);
        return users;
    }

    static async updateUser(id, data) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const updateFields = [];
            const values = [];

            if (data.name !== undefined) { updateFields.push('name = ?'); values.push(data.name); }
            if (data.phone !== undefined) { updateFields.push('phone = ?'); values.push(data.phone); }
            if (data.isActive !== undefined) { updateFields.push('status = ?'); values.push(data.isActive ? 1 : 0); }
            if (data.plantId !== undefined) { updateFields.push('plant_id = ?'); values.push(data.plantId); }
            if (data.emailId !== undefined) { updateFields.push('email_id = ?'); values.push(data.emailId); }
            if (data.password !== undefined) { updateFields.push('password = ?'); values.push(data.password); }

            if (updateFields.length > 0) {
                values.push(id);
                await connection.execute(
                    `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
                    values
                );
            }

            if (data.roles && Array.isArray(data.roles)) {
                await connection.execute('DELETE FROM user_roles WHERE user_id = ?', [id]);
                for (const roleName of data.roles) {
                    const [roleRecords] = await connection.execute('SELECT id FROM roles WHERE name = ?', [roleName]);
                    if (roleRecords.length > 0) {
                        await connection.execute(
                            'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
                            [id, roleRecords[0].id]
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

    static async getRoles() {
        const [roles] = await pool.query('SELECT id, name FROM roles WHERE status = 1');
        return roles;
    }

    static async getUserDetails(phone) {
        const [users] = await pool.query('SELECT id, name, phone, plant_id, email_id as emailId, status FROM users WHERE phone = ?', [phone]);
        return users.length > 0 ? users[0] : null;
    }
}

module.exports = UserService;
