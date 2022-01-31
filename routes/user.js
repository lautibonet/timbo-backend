const router = require('express').Router();
const userModel = require('../models/User');
const friendModel = require('../models/Friend');
const matchModel = require('../models/Match');
const catchObjectIdError = require('../utils/catchObjectIdError');
const joi = require('joi');

const schemaAddress = joi.object({
    fullAddress: joi.string().required(),
    latitude: joi.number().required(),
    longitude: joi.number().required(),
    radius: joi.number().required()
})

router.get('/', async (req, res) => {
    try{
        const users = await userModel.find();
        res.json({ data: users });
    } catch (error) {
        res.status(500).json({ error });
    }
})

router.get('/:id', async (req, res) => {
    if(req.params.id == null) return res.status(400).json({error: 'userId_required'})
    try{
        const user = await userModel.findById(req.params.id);
        if(!user) res.status(404).json({ message: 'user_not_found' })
        res.json({ data: user });
    } catch (error) {
        catchObjectIdError(error, 
            () => res.status(404).json({ message: 'user_not_found' }) , 
            () => res.status(500).json({ error })
        );
    }
})

router.put('/:googleId/imageUrl', async (req, res) => {
    if(req.params.googleId == null) return res.status(400).json({error: 'googleId_required'})
    if(req.body.imageUrl == null) return res.status(400).json({error: 'imageUrl_required'})
    try{
        const user = await userModel.findOne({ googleId: req.params.googleId });
        if(!user) res.status(404).json({ message: 'user_not_found' })
        user.imageUrl = req.body.imageUrl;
        const savedUser = await user.save();
        res.json({ data: {user:savedUser} });
    } catch (error) {
        catchObjectIdError(error, 
            () => res.status(404).json({ message: 'user_not_found' }) , 
            () => res.status(500).json({ error })
        );
    }
})

router.patch('/:id', async (req, res) => {
    if(req.params.id == null) return res.status(400).json({error: 'userId_required'})
    try{
        const user = await userModel.findById(req.params.id);
        console.log(req.body);
        if(req.body.name != null && req.body.name != user.name) user.name = req.body.name
        if(req.body.nickname != null && req.body.nickname != user.nickname) user.nickname = req.body.nickname
        if(req.body.birthday != null && req.body.birthday != user.birthday) user.birthday = req.body.birthday
        if(req.body.imageUrl != null && req.body.imageUrl != user.imageUrl) user.imageUrl = req.body.imageUrl
        if(req.body.email != null && req.body.email != user.email) user.email = req.body.email
        if(req.body.enabled != null && req.body.enabled != user.enabled) user.enabled = req.body.enabled
        if(req.body.phoneNumber != null && req.body.phoneNumber != user.phoneNumber) user.phoneNumber = req.body.phoneNumber
        if(req.body.attributes != null) {
            req.body.attributes.forEach(attr => {
                if(!user.attributes || !user.attributes.map(e => e.name).includes(attr.name)){
                    user.attributes.push(attr)
                } else {
                    var found = user.attributes.find(a => a.name == attr.name);
                    if(found){
                        found.value = attr.value;
                    }
                }
            });
        }
        const savedUser = await user.save();
        res.json({ data: {user: savedUser} })
    } catch (error) {
        console.log(error);
        catchObjectIdError(error, 
            () => res.status(404).json({ message: 'user_not_found' }) , 
            () => res.status(500).json({ error })
        );
    }
})

router.post('/:id/address', async (req, res) => {
    if(req.params.id == null) return res.status(400).json({error: 'userId_required'})
    if(req.body.address == null) return res.status(400).json({error: 'address_required'})
    const { error } = schemaAddress.validate(req.body.address);
    if (error) return res.status(400).json({ error: error.details[0].message });
    try{
        const user = await userModel.findById(req.params.id);
        user.addresses.push(req.body.address);
        const savedUser = await user.save();
        res.json({ data: { user:savedUser } });
    } catch (error) {
        catchObjectIdError(error, 
            () => res.status(404).json({ message: 'user_not_found' }) , 
            () => res.status(500).json({ error })
        );
    }
})

router.post('/search', async (req, res) => {
    const criteria = req.body.criteria;
    const requesterUserId = req.body.userId;
    var users;
    try{
        if(criteria == null) {
            users = await userModel.find()
             .select({ "addresses": 0, "password": 0, "phoneNumber": 0, "googleId": 0, "__v": 0 })
             .limit(10);
        } else {
            users = await userModel.find({ 
                $or: [
                    { name: { $regex: `.*${criteria}.*`, $options: "i" } },
                    { nickname: { $regex: `.*${criteria}.*`, $options: "i" } }
                ],
                _id: { $ne: requesterUserId }
             })
             .select({ "addresses": 0, "password": 0, "phoneNumber": 0, "googleId": 0, "__v": 0 })
             .limit(10);
        }
        res.json({ data: users });
    } catch (error) {
        catchObjectIdError(error, 
            () => res.status(404).json({ message: 'user_not_found' }) , 
            () => res.status(500).json({ error })
        );
    }
})

router.get('/:id/friends', async (req, res) => {
    if(req.params.id == null) return res.status(400).json({error: 'userId_required'})
    try{
        const user = await userModel.findById(req.params.id);
        if(!user) res.status(404).json({ message: 'user_not_found' })
        const friends = await friendModel.find({ recipient: user._id }, 'requester -_id').populate({
            path: 'requester' ,
            select: 'name nickname email imageUrl attributes',
        })
        res.json({ data: friends.map(f => f.requester) });
    } catch (error) {
        catchObjectIdError(error, 
            () => res.status(404).json({ message: 'user_not_found' }) , 
            () => res.status(500).json({ error })
        );
    }
})

router.get('/:id/friends/count', async (req, res) => {
    if(req.params.id == null) return res.status(400).json({error: 'userId_required'})
    try{
        const user = await userModel.findById(req.params.id);
        if(!user) res.status(404).json({ message: 'user_not_found' })
        const friendsCount = await friendModel.countDocuments({ recipient: user._id });
        res.json({ data: { count: friendsCount } });
    } catch (error) {
        catchObjectIdError(error, 
            () => res.status(404).json({ message: 'user_not_found' }) , 
            () => res.status(500).json({ error })
        );
    }
})

router.get('/:id/matches/count', async (req, res) => {
    if(req.params.id == null) return res.status(400).json({error: 'userId_required'})
    try {
        const user = await userModel.findById(req.params.id);
        if(!user) res.status(404).json({ message: 'user_not_found' })
        const matchCount = await matchModel.countDocuments({ organizer: user._id });
        res.json({ data: { count: matchCount } });
    } catch (error) {
        catchObjectIdError(error, 
            () => res.status(404).json({ message: 'user_not_found' }) , 
            () => res.status(500).json({ error })
        );
    }
})

router.get('/:id/matches', async (req, res) => {
    if(req.params.id == null) return res.status(400).json({error: 'userId_required'})
    try {
        const user = await userModel.findById(req.params.id);
        if(!user) res.status(404).json({ message: 'user_not_found' })
        const matches = await matchModel
            .find({ organizer: user._id })
            .select({"__v": 0})
            .populate({path: 'organizer', select: 'name nickname imageUrl'});
        res.json({ data: matches });
    } catch (error) {
        catchObjectIdError(error, 
            () => res.status(404).json({ message: 'user_not_found' }) , 
            () => res.status(500).json({ error })
        );
    }
})

module.exports = router;