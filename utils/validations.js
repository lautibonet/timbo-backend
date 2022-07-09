const joi = require('joi');

const address = joi.object({
    fullAddress: joi.string().required(),
    latitude: joi.number().required(),
    longitude: joi.number().required(),
    radius: joi.number().required()
})

const userRegistration = joi.object({
    name: joi.string().max(255).required(),
    email: joi.string().min(6).max(255).required().email(),
    password: joi.string().min(8).max(1024).required(),
    enabled: joi.boolean().default(true),
    phoneNumber: joi.string().allow(null).allow(''),
    imageUrl: joi.string().allow(null),
    birthday: joi.string().isoDate().allow(null)
})

const userLogin = joi.object({
    email: joi.string().min(6).max(255).required().email(),
    password: joi.string().min(8).max(1024).required()
})

const userSocialLogin = joi.object({
    type: joi.string().max(255).required(),
    email: joi.string().min(6).max(255).required().email(),
    id: joi.string().max(255).required()
})

const footballTeam = joi.object({
    name: joi.string().required()
})

const friendRequest = joi.object({
    requesterId: joi.string().required(),
    recipientId: joi.string().required()
})

const createMatch = joi.object({
    organizer: joi.string().required(),
    name: joi.string().allow(null, ''),
    createdOn: joi.string().isoDate().required(),
    startTime: joi.string().isoDate().allow(null),
    fullAddress: joi.string().allow(null),
    latitude: joi.number().allow(null),
    longitude: joi.number().allow(null),
    status: joi.number().allow(0,1,2).required(),
    totalPlayers: joi.number().min(0).required(),
    privacy: joi.number().allow(1,2,3).required(),
    price: joi.number().min(0).allow(null),
    players: joi.array().allow(null)
})

const searchMatch = joi.object({
    userId: joi.string().required(),
    lat: joi.number().min(-90).max(90).required(),
    lon: joi.number().min(-180).max(180).required(),
    dis: joi.number().min(0).required()
})

const getMatch = joi.object({
    id: joi.string().required()
})

module.exports = { address, userRegistration, userLogin, userSocialLogin, footballTeam, friendRequest, createMatch, searchMatch, getMatch };