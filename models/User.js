const mongoose = require('mongoose');
const addressSchema = require('./Address');

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
        required: false
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
    socials: [
        {
            type: String,
            id: String
        }
    ],
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