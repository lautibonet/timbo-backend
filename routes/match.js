const router = require('express').Router();
const matchModel = require('../models/Match');
const userModel = require('../models/User');
const friendModel = require('../models/Friend');
const validations = require('../utils/validations');
const responseUtils = require('../utils/response-utils');
const catchObjectIdError = require('../utils/catchObjectIdError');

const buildMatch = (body) => {
    var location;
    if(body.fullAddress != null && body.fullAddress != ''){
        location = {
            type: "Point",
            coordinates: [body.longitude, body.latitude]
        };
    }
    return {
        organizer: body.organizer,
        name: body.name,
        createdOn: body.createdOn,
        startTime: body.startTime,
        fullAddress: body.fullAddress,
        location: location,
        status: body.status,
        totalPlayers: body.totalPlayers,
        privacy: body.privacy,
        price: body.price,
        players: body.players
    }
}

router.post('/', async (req, res) => {
    const {error} = validations.createMatch.validate(req.body);
    if(error) return responseUtils.setJoiValidationError(res, error);
    const organizerId = req.body.organizer;
    try{
        const user = await userModel.findById(organizerId);
        if(!user) return responseUtils.setUserNotFound(res, organizerId);
        const match = new matchModel(buildMatch(req.body));
        var savedMatch = await match.save();
        savedMatch = await matchModel.populate(savedMatch, {path: 'organizer', select: 'name nickname imageUrl attributes'});
        res.json({ data: savedMatch })
    } catch (error) {
        responseUtils.setServerError(res, error);
    }
})

router.get('/:id', async (req, res) => {
    const { error } = validations.getMatch(req.params);
    if (error) return responseUtils.setJoiValidationError(res, error);
    const matchId = req.params.id;
    try{
        const match = await matchModel.findById(matchId);
        if(match == null) return responseUtils.setMatchNotFound(res, matchId);
        res.json({ data: match })
    } catch (error) {
        catchObjectIdError(error, 
            () => responseUtils.setMatchNotFound(res, matchId), 
            () => responseUtils.setServerError(error)
        );
    }
})

router.post('/search', async (req, res) => {
    const { error } = validations.searchMatch.validate(req.body);
    if(error) return responseUtils.setJoiValidationError(res, error);
    const userId = req.body.userId;
    try{
        const user = await userModel.findById(userId);
        if(!user) return responseUtils.setUserNotFound(res, userId);
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
            () => responseUtils.setUserNotFound(res, userId), 
            () => responseUtils.setServerError(res, error)
        );
    }
})

module.exports = router;