// const { Queue, Worker } = require('bullmq');
// const redisConnection = require('../config/redis');
// const Alert = require('../models/Alert');
// const mongoose = require('mongoose');

// // Optional: mongoose connection is managed in server.js, assuming it's up
// const alertQueue = new Queue('AlertQueue', { connection: redisConnection });

// const alertWorker = new Worker('AlertQueue', async (job) => {
//     try {
//         const alertData = job.data;
        
//         // Save alert to Mongo
//         const newAlert = new Alert({
//             type: 'MISMATCH',
//             batchId: alertData.batchId,
//             stageId: alertData.stageId,
//             expectedQty: alertData.expectedQty,
//             enteredQty: alertData.enteredQty,
//             recipients: alertData.recipients || ['+91xxxx'] // Should be pulled from settings or plant
//         });

//         await newAlert.save();

//         // MOCK: Send WhatsApp message using external API
//         console.log(`[AlertQueue] WhatsApp message sent for Batch ${alertData.batchId}. Alert saved.`);
        
//         newAlert.whatsappSent = true;
//         await newAlert.save();

//     } catch (error) {
//         console.error(`[AlertQueue] Error processing job:`, error);
//         throw error;
//     }
// }, { connection: redisConnection });

// alertWorker.on('failed', (job, err) => {
//     console.error(`[AlertQueue] Job ${job.id} failed:`, err);
// });

// // const addMismatchAlert = async (alertData) => {
// //     await alertQueue.add('mismatch', alertData, {
// //         attempts: 3,
// //         backoff: { type: 'exponential', delay: 2000 }
// //     });
// // };

// module.exports = {
//     alertQueue,
//     addMismatchAlert
// };
