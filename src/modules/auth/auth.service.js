const pool = require('../../config/mysql');
const { generateToken } = require('../../utils/jwt');
const moment = require('moment');

class AuthService {
    static async adminEmailLogin(email, password) {
        // Postman compatibility helper.
        // It bypasses real DB since schema doesn't have email/password,
        // and just assumes admin@lamina.com logs in as the first admin user in the system.

          const [[user]] = await pool.query(`
                 SELECT u.id, u.name, u.phone ,u.email_id as email,r.name as role
                FROM users u
                JOIN user_roles ur ON ur.user_id = u.id
                JOIN roles r ON r.id = ur.role_id
                WHERE u.email_id = ? AND u.status = '1'
                LIMIT 1
            `, [email]);

            console.log("user", user);

        if (!user) {
            return{
                success: false,
                message: 'User not found!!'
            }
        }

        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) {
            return{
                success: false,
                message: 'Invalid credentials!!'
            }
        }

        return {
            success: true,
            message: 'Login successful!!',
            data: {
                token:generateToken({ id: user.id }),
                user
            }
        };
    }

    static async generateOtp(phone) {
        // Verify user exists first
        const [users] = await pool.query('SELECT * FROM users WHERE phone = ? AND status = 1', [phone]);
        if (users.length === 0) {
            throw new Error('User not found or inactive');
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = moment().add(process.env.OTP_EXPIRY_MINUTES || 5, 'minutes').format('YYYY-MM-DD HH:mm:ss');

        await pool.query(
            'INSERT INTO otp_sessions (phone, otp, expires_at, verified) VALUES (?, ?, ?, FALSE)',
            [phone, otp, expiresAt]
        );

        return otp;
    }

    static async verifyOtp(phone, otp) {
        const [sessions] = await pool.query(
            'SELECT * FROM otp_sessions WHERE phone = ? AND otp = ? AND verified = FALSE ORDER BY id DESC LIMIT 1',
            [phone, otp]
        );

        if (sessions.length === 0) {
            throw new Error('Invalid OTP');
        }

        const session = sessions[0];
        if (moment().isAfter(moment(session.expires_at))) {
            throw new Error('OTP expired');
        }

        // Mark verified
        await pool.query('UPDATE otp_sessions SET verified = TRUE WHERE id = ?', [session.id]);

        // Get user for token
        const [users] = await pool.query('SELECT id FROM users WHERE phone = ?', [phone]);
        if (users.length === 0) {
            throw new Error('User not found');
        }

        return generateToken({ id: users[0].id });
    }
}

module.exports = AuthService;
