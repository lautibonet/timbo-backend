const router = require('express').Router();
const userModel = require('../models/User');
const friendModel = require('../models/Friend');
const matchModel = require('../models/Match');
const validations = require('../utils/validations');
const responseUtils = require('../utils/response-utils');
const catchObjectIdError = require('../utils/catchObjectIdError');

const multer = require('multer');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './static/uploads')
    },
    filename: function(req, file, cb) {
        cb(null, req.params.id + file.originalname)
    }
})

const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(new Error('Extension de imagen no permitido'), false);
    }
}

const fileHandler = multer({
    storage,
    fileFilter,
    limits: { fileSize: 1024 * 1024 * 5 }
});

router.get('/', async (req, res) => {
    return responseUtils.setRequiredParamError(res, 'id');
    // try{
    //     const users = await userModel.find();
    //     res.json({ data: users });
    // } catch (error) {
    //     responseUtils.setServerError(res, error);
    // }
})

router.get('/:id', async (req, res) => {
    if(req.params.id == null) return responseUtils.setRequiredParamError(res, 'id');
    const userId = req.params.id;
    try{
        const user = await userModel.findById(userId).select({ "addresses": 0, "password": 0, "socials": 0, "__v": 0 });
        if(!user) responseUtils.setUserNotFound(res);
        res.json({ data: user });
    } catch (error) {
        catchObjectIdError(error, 
            () => responseUtils.setUserNotFound(res,userId),
            () => responseUtils.setServerError(res, error)
        );
    }
})

router.patch('/:id', fileHandler.single('profilePicture'), async (req, res) => {
    if(req.params.id == null) return responseUtils.setRequiredParamError(res, 'id');
    const userId = req.params.id;
    try{
        const user = await userModel.findById(userId).select({ "friends": 0, "addresses": 0, "password": 0, "socials": 0, "__v": 0 });
        if(!user) responseUtils.setUserNotFound(res);
        const userRequest = req.body.user ? JSON.parse(req.body.user) : {};
        if(userRequest.name != null && userRequest.name !== user.name) user.name = userRequest.name;
        if(userRequest.nickname != null && userRequest.nickname !== user.nickname) user.nickname = userRequest.nickname;
        if(userRequest.birthday != null && userRequest.birthday !== user.birthday) user.birthday = userRequest.birthday;
        if(userRequest.enabled != null && userRequest.enabled !== user.enabled) user.enabled = userRequest.enabled;
        if(userRequest.gender != null && userRequest.gender !== user.gender) user.gender = userRequest.gender;
        if(userRequest.phoneNumber != null && userRequest.phoneNumber !== user.phoneNumber) user.phoneNumber = userRequest.phoneNumber;
        if(req.file) user.imageUrl = req.file.path;
        if(userRequest.attributes != null) {
            userRequest.attributes.forEach(attr => {
                if(!user.attributes || !user.attributes.map(e => e.name).includes(attr.name)){
                    user.attributes.push(attr);
                } else {
                    if(user.attributes.find(a => a.name == attr.name)){
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
            () => responseUtils.setUserNotFound(res, userId),
            () => responseUtils.setServerError(res, error)
        );
    }
})

router.post('/:id/address', async (req, res) => {
    if(req.params.id == null) return responseUtils.setRequiredParamError(res, 'id');
    if(req.body.address == null) return responseUtils.setRequiredParamError(res, 'address');
    const { error } = validations.address.validate(req.body.address);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const userId = req.params.id;
    try{
        const user = await userModel.findById(userId);
        if(!user) responseUtils.setUserNotFound(res);
        user.addresses.push(req.body.address);
        const savedUser = await user.save();
        res.json({ data: { user:savedUser } });
    } catch (error) {
        catchObjectIdError(error, 
            () => responseUtils.setUserNotFound(res,userId),
            () => responseUtils.setServerError(res, error)
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
             .select({ "addresses": 0, "password": 0, "phoneNumber": 0, "socials": 0, "__v": 0 })
             .limit(10);
        } else {
            users = await userModel.find({ 
                $or: [
                    { name: { $regex: `.*${criteria}.*`, $options: "i" } },
                    { nickname: { $regex: `.*${criteria}.*`, $options: "i" } }
                ],
                _id: { $ne: requesterUserId }
             })
             .select({ "addresses": 0, "password": 0, "phoneNumber": 0, "socials": 0, "__v": 0 })
             .limit(10);
        }
        res.json({ data: users });
    } catch (error) {
        catchObjectIdError(error, 
            () => responseUtils.setUserNotFound(res, requesterUserId),
            () => responseUtils.setServerError(res, error)
        );
    }
})

router.get('/:id/friends', async (req, res) => {
    if(req.params.id == null) return responseUtils.setRequiredParamError(res, 'id');
    const userId = req.params.id;
    try{
        const user = await userModel.findById(userId);
        if(!user) responseUtils.setUserNotFound(res);
        const friends = await friendModel.find({ recipient: user._id }, 'requester -_id').populate({
            path: 'requester' ,
            select: 'name nickname email imageUrl attributes',
        })
        res.json({ data: friends.map(f => f.requester) });
    } catch (error) {
        catchObjectIdError(error, 
            () => responseUtils.setUerNotFound(res, userId),
            () => responseUtils.setServerError(res, error)
        );
    }
})

router.get('/:id/friends/count', async (req, res) => {
    if(req.params.id == null) return responseUtils.setRequiredParamError(res, 'id');
    const userId = req.params.id;
    try{
        const user = await userModel.findById(userId);
        if(!user) responseUtils.setUerNotFound(res);
        const friendsCount = await friendModel.countDocuments({ recipient: user._id });
        res.json({ data: { count: friendsCount } });
    } catch (error) {
        catchObjectIdError(error, 
            () => responseUtils.setUerNotFound(res,userId),
            () => responseUtils.setServerError(res, error)
        );
    }
})

router.get('/:id/matches/count', async (req, res) => {
    if(req.params.id == null) return responseUtils.setRequiredParamError(res, 'id');
    const userId = req.params.id;
    try {
        const user = await userModel.findById(userId);
        if(!user) responseUtils.setUerNotFound(res);
        const matchCount = await matchModel.countDocuments({ organizer: user._id });
        res.json({ data: { count: matchCount } });
    } catch (error) {
        catchObjectIdError(error, 
            () => responseUtils.setUerNotFound(res, userId),
            () => responseUtils.setServerError(res, error)
        );
    }
})

router.get('/:id/matches', async (req, res) => {
    if(req.params.id == null) return responseUtils.setRequiredParamError(res, 'id');
    const userId = req.params.id
    try {
        const user = await userModel.findById(userId);
        if(!user) responseUtils.setUerNotFound(res);
        const matches = await matchModel
            .find({ organizer: user._id })
            .select({"__v": 0})
            .populate({path: 'organizer', select: 'name nickname imageUrl'});
        res.json({ data: matches });
    } catch (error) {
        catchObjectIdError(error, 
            () => responseUtils.setUerNotFound(res,userId),
            () => responseUtils.setServerError(res, error)
        );
    }
})

module.exports = router;

