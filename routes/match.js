const router = require('express').Router();
const joi = require('joi');
const matchModel = require('../models/Match');
const userModel = require('../models/User');
const friendModel = require('../models/Friend');
const catchObjectIdError = require('../utils/catchObjectIdError');

const schemaMatch = joi.object({
    organizer: joi.string().required(),
    name: joi.string().required(),
    startTime: joi.string().isoDate().required(),
    fullAddress: joi.string().required(),
    latitude: joi.number().required(),
    longitude: joi.number().required(),
    status: joi.number().allow(0,1,2).required(),
    totalPlayers: joi.number().min(0).required(),
    privacy: joi.number().allow(1,2,3).required(),
    price: joi.number().min(0).allow(null),
    players: joi.array().allow(null)
})

const schemaSearch = joi.object({
    userId: joi.string().required(),
    lat: joi.number().min(-90).max(90).required(),
    lon: joi.number().min(-180).max(180).required(),
    dis: joi.number().min(0).required()
})

const buildMatch = (body) => {
    return {
        organizer: body.organizer,
        name: body.name,
        startTime: body.startTime,
        fullAddress: body.fullAddress,
        location: {
            type: "Point",
            coordinates: [body.longitude, body.latitude]
        },
        status: body.status,
        totalPlayers: body.totalPlayers,
        privacy: body.privacy,
        price: body.price,
        players: body.players
    }
}

router.post('/', async (req, res) => {
    const {error} = schemaMatch.validate(req.body);
    if(error) return res.status(400).json({ error: error.details[0].message })
    try{
        const user = await userModel.findById(req.body.organizer);
        if(user == null) return res.status(400).json({ error: "user_not_found" })
        const match = new matchModel(buildMatch(req.body));
        var savedMatch = await match.save();
        savedMatch = await matchModel.populate(savedMatch, {path: 'organizer', select: 'name nickname imageUrl attributes'});
        res.json({ data: savedMatch })
    } catch (error) {
        console.log(error);
        res.status(400).json({ error });
    }
})

router.get('/:id', async (req, res) => {
    if (req.params.id == null) return res.status(400).json({ error: "match_id_required" });
    try{
        const match = await matchModel.findById(req.params.id);
        if(match == null) return res.status(404).json({ error: "match_not_found" })
        res.json({ data: match })
    } catch (error) {
        catchObjectIdError(error, 
            () => res.status(404).json({ message: 'match_not_found' }) , 
            () => res.status(500).json({ error })
        );
    }
})

router.post('/search', async (req, res) => {
    const {error} = schemaSearch.validate(req.body);
    if(error) return res.status(400).json({ error: error.details[0].message })
    try{
        const user = await userModel.findById(req.body.userId);
        if(user == null) return res.status(404).json({ error: "user_not_found" })
        const friends = (await friendModel.find({ recipient: user._id }, 'requester -_id')).map(f => f.requester);
        const matches = await matchModel.find({ $or: [
            { privacy: 1 },
            { $and: [
                { privacy: 2 },
                { organizer: { $in: friends } }
            ] },
            { $and: [
                { privacy: 3 },
                { players: user._id }
            ] }
        ] })
        .select('-__v')
        .where('location').near({ center: { coordinates: [req.body.lon, req.body.lat], type: "Point" }, maxDistance: req.body.dis });
        res.json({ data: matches });
    } catch (error) {
        console.log(error);
        catchObjectIdError(error, 
            () => res.status(404).json({ message: 'match_not_found' }) , 
            () => res.status(500).json({ error })
        );
    }
})

module.exports = router;