const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true
    },
    details: {
        type: Object
    },
    performedBy: {
        type: String,
        default: 'system'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);