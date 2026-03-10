// const { Queue, Worker } = require('bullmq');
// const redisConnection = require('../config/redis');
// const AuditLog = require('../models/AuditLog');

// const auditQueue = new Queue('AuditQueue', { connection: redisConnection });

// const auditWorker = new Worker('AuditQueue', async (job) => {
//     try {
//         const logData = job.data;
//         const newLog = new AuditLog(logData);
//         await newLog.save();
//         console.log(`[AuditQueue] Log saved for recordId: ${logData.recordId}`);
//     } catch (error) {
//         console.error(`[AuditQueue] Error processing job:`, error);
//         throw error;
//     }
// }, { connection: redisConnection });

// auditWorker.on('failed', (job, err) => {
//     console.error(`[AuditQueue] Job ${job.id} failed:`, err);
// });

// const addAuditLog = async (logData) => {
//     await auditQueue.add('log', logData, {
//         attempts: 3,
//         backoff: { type: 'exponential', delay: 1000 }
//     });
// };

// module.exports = {
//     auditQueue,
//     addAuditLog
// };
