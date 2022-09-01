const mongoose = require('mongoose')

const addressSchema = mongoose.Schema({
    fullAddress: {
        type: String,
        required: true
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    radius: {
        type: Number,
        required: true
    },
    default: {
        type: Boolean,
        required: true
    }
}, {_id: false});

module.exports = addressSchema;