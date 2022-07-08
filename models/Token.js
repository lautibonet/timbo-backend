const mongoose = require('mongoose');

const tokenSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    refreshToken: {
        type: String,
        required: true
    },
    accessToken: {
        type: String,
        required: false
    }
});

module.exports = mongoose.model('Token', tokenSchema);