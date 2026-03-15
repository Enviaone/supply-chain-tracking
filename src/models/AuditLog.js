const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    module: { type: String, required: true },
    recordId: { type: Number, required: true },
    action: { type: String, enum: ['CREATE', 'UPDATE', 'DELETE'], required: true },
    batchId: { type: Number },
    stageId: { type: Number },
    oldValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    comment: { type: String },
    userId: { type: Number },
    plantId: { type: Number },
    shiftId: { type: Number },
    locationId: { type: Number, default: 0 },
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now }
});

auditLogSchema.index({ recordId: 1 });
auditLogSchema.index({ batchId: 1 });
auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema, 'audit_logs');
