const pool = require('../../config/mysql');

class UserService {
    static async createUser(data) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const status = data.isActive === undefined ? 1 : (data.isActive ? 1 : 0);

            const [result] = await connection.execute(
                'INSERT INTO users (name, phone, plant_id, status) VALUES (?, ?, ?, ?)',
                [data.name, data.phone, data.plantId || null, status]
            );

            const userId = result.insertId;

            // Handle roles (admin role cannot be assigned alongside others, handled externally usually)
            if (data.roles && Array.isArray(data.roles)) {
                for (const roleName of data.roles) {
                    const [roleRecords] = await connection.execute('SELECT id FROM roles WHERE name = ?', [roleName]);
                    if (roleRecords.length > 0) {
                        await connection.execute(
                            'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
                            [userId, roleRecords[0].id]
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
            SELECT u.id, u.name, u.phone, u.status, p.name as plant_name 
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
}

module.exports = UserService;
