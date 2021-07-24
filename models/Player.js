const mongoose = require('mongoose');

const playerSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    match: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match',
        required: true
    },
    status: {
        type: Number,
        enum: [
            1,    // requested
            2,    // pending
            3,    // confirmed
        ]
    },
    role: {
        type: Number,
        enum: [
            0,  // admin
            1,  // inviter
            2   // player
        ]
    }
})

module.exports = mongoose.model('Player', playerSchema);