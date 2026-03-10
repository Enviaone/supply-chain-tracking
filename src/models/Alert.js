const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    type: { type: String, enum: ['MISMATCH'], default: 'MISMATCH' },
    batchId: { type: Number, required: true },
    stageId: { type: Number, required: true },
    expectedQty: { type: Number, required: true },
    enteredQty: { type: Number, required: true },
    recipients: [{ type: String }],
    whatsappSent: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alert', alertSchema, 'alerts');
