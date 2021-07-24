const mongoose = require('mongoose');

const friendSchema = mongoose.Schema({
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    status: {
        type: Number,
        enum: [
            1,    // requested
            2,    // pending
            3,    // friends
        ]
    }
})

module.exports = mongoose.model('Friend', friendSchema);