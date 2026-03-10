const app = require('./app');
const connectMongo = require('./config/mongo');
const pool = require('./config/mysql');
// const redisConnection = require('./config/redis');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        console.log("Starting Server!!!")
        // // Connect to MongoDB
        await connectMongo();

        // Verify MySQL Connection
        const [rows] = await pool.query('SELECT 1 + 1 AS solution');
        console.log('MySQL Connected');

        // // Verify Redis (BullMQ needs this, so we implicitly check if it's fine)
        // if (redisConnection.status === 'ready' || redisConnection.status === 'connecting') {
        //     console.log('Redis initialized');
        // }

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
