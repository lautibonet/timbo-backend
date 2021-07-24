const mongoose = require('mongoose');

const matchSchema = mongoose.Schema({
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    name: {
        type: String,
        required: true
    },
    createdOn: {
        type: Date,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    fullAddress: {
        type: String,
        required: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    status: {
        type: Number,
        required: true,
        enum: [
            0,  // created
            1,  // finished
            2   // cancelled
        ]
    },
    totalPlayers: {
        type: Number,
        min: 0
    },
    privacy: {
        type: Number,
        enum: [
            1,  // public
            2,  // private
            3   // secret
        ]
    },
    price: Number,
    players: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Player'
    }]
})

matchSchema.index({ location: '2dsphere' })

module.exports = mongoose.model('Match', matchSchema);