const mongoose = require('mongoose');

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
    }
}, {_id: false})

const attributeSchema = mongoose.Schema({
    name: String,
    value: String
}, {_id: false})

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    nickname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    enabled: {
        type: Boolean,
        required: true
    },
    phoneNumber: {
        type: String,
        required: false
    },
    googleId: {
        type: String,
        required: false
    },
    imageUrl: {
        type: String,
        required: false
    },
    birthday: {
        type: Date,
        required: false
    },
    attributes: [attributeSchema],
    addresses: [addressSchema],
    friends: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Friend'
    }]
})

module.exports = mongoose.model('User', userSchema);