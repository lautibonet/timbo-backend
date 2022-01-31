const router = require('express').Router();
const joi = require('joi');
const userModel = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const TokenModel = require('../models/Token');
const Token = require('../models/Token');

const schemaRegister = joi.object({
    name: joi.string().min(6).max(255).required(),
    nickname: joi.string().required(),
    email: joi.string().min(6).max(255).required().email(),
    password: joi.string().min(8).max(1024).required(),
    enabled: joi.boolean(),
    phoneNumber: joi.string().allow(null).allow(''),
    googleId: joi.string().allow(null),
    imageUrl: joi.string().allow(null),
    birthday: joi.string().isoDate().allow(null)
})

const schemaLogin = joi.object({
    email: joi.string().min(6).max(255).required().email(),
    password: joi.string().min(8).max(1024).required()
})

const buildUser = (body) => {
    return {
        name: body.name,
        nickname: body.nickname,
        email: body.email,
        password: body.password,
        enabled: true,
        phoneNumber: body.phoneNumber,
        googleId: body.googleId,
        imageUrl: body.imageUrl,
        birthday: body.birthday
    }
}

const buildAccessToken = (user) => {
    return jwt.sign({
        _id: user._id,
        name: user.name
    }, process.env.ACCESS_TOKEN_SECRET, {expiresIn: 60});
}

const buildRefreshToken = (user) => {
    return jwt.sign({
        _id: user._id,
        name: user.name
    }, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '6h'});
}

router.post('/register', async (req, res) => {
    const { error } = schemaRegister.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message })
    try{
        const emailExists = await userModel.findOne({ email: req.body.email });
        if (emailExists) return res.status(400).json({ error: 'email_registered' })
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
        const user = new userModel(buildUser(req.body));
        const savedUser = await user.save();
        const accessToken = buildAccessToken(user);
        const refreshToken = buildRefreshToken(user);
        const token = await TokenModel.findOneAndUpdate({ user: savedUser._id }, { refreshToken }, { new: true, upsert: true, setDefaultsOnInsert: true, useFindAndModify: false  });
        res.json({ data: {user:savedUser, accessToken, refreshToken} });
    } catch(error) {
        res.status(400).json({error});
    }
})

router.post('/login', async (req, res) => {
    const { error } = schemaLogin.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message })

    try{
        const credentialsErrorMsg = 'wrong_user_or_password';
        const user = await userModel.findOne({ email: req.body.email });
        if (!user) return res.status(400).json({ error: credentialsErrorMsg });

        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) return res.status(400).json({ error: credentialsErrorMsg })
        const accessToken = buildAccessToken(user);
        const refreshToken = buildRefreshToken(user);
        const token = await TokenModel.findOneAndUpdate({ user: user._id }, { refreshToken }, { new: true, upsert: true, setDefaultsOnInsert: true, useFindAndModify: false  });
        res.header('auth-token', accessToken).json({
            data: { userId: user._id, accessToken, refreshToken }
        })
    } catch(error) {
        res.status(400).json({error});
    }
})

router.post('/token', async (req, res) => {
    const refreshToken = req.body.refreshToken;
    if(refreshToken == null) return res.status(401).json({ error: "unauthorized" })
    const refreshTokenDb = await TokenModel.findOne({ refreshToken });
    if(refreshTokenDb == null) return res.status(403).json({ error: "forbidden" })
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, user) => {
        if(err) return res.status(403).json({ error: "forbidden" })
        const accessToken = buildAccessToken(user);
        const refreshToken = buildRefreshToken(user);
        const token = await TokenModel.findOneAndUpdate({ user: user._id }, { refreshToken }, { new: true, upsert: true, setDefaultsOnInsert: true, useFindAndModify: false  });
        res.header('auth-token', accessToken).json({
            data: { userId: user._id, accessToken, refreshToken }
        })
    })
})

router.post('/login/google', async (req, res) => {
    const googleId = req.body.id;
    const email = req.body.email;
    if(googleId == null) return res.status(400).json({ error: "google_id_required" })
    if(email == null) return res.status(400).json({ error: "email_required" })
    const user = await userModel.findOne({ googleId, email });
    if(user == null) return res.status(400).json({ error: "user_not_found" })
    const accessToken = buildAccessToken(user);
    const refreshToken = buildRefreshToken(user);
    const token = await TokenModel.findOneAndUpdate({ user: user._id }, { refreshToken }, { new: true, upsert: true, setDefaultsOnInsert: true, useFindAndModify: false  });
    res.header('auth-token', accessToken).json({
        data: { userId: user._id, accessToken, refreshToken }
    })
})

module.exports = router;