const router = require('express').Router();
const userModel = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const TokenModel = require('../models/Token');
const Token = require('../models/Token');
const validations = require('../utils/validations');
const responseUtils = require('../utils/response-utils');

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
    }, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '30m'});
}

const buildRefreshToken = (user) => {
    return jwt.sign({
        _id: user._id,
        name: user.name
    }, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '24h'});
}

router.post('/register', async (req, res) => {
    const { error } = validations.userRegistration.validate(req.body);
    if (error) return responseUtils.setJoiValidationError(res, error);
    try{
        const emailExists = await userModel.findOne({ email: req.body.email });
        if (emailExists) return responseUtils.setExistingEmailError(res);
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
        const user = new userModel(buildUser(req.body));
        const savedUser = await user.save();
        const accessToken = buildAccessToken(user);
        const refreshToken = buildRefreshToken(user);
        const token = await TokenModel.findOneAndUpdate({ user: savedUser._id }, { refreshToken }, { new: true, upsert: true, setDefaultsOnInsert: true, useFindAndModify: false  });
        res.json({ data: {user:savedUser, accessToken, refreshToken} });
    } catch(error) {
        return responseUtils.setServerError(res, error);
    }
})

router.post('/login', async (req, res) => {
    const { error } = validations.userLogin.validate(req.body);
    if (error) return responseUtils.setJoiValidationError(res, error);

    try{
        const user = await userModel.findOne({ email: req.body.email });
        if (!user) return responseUtils.setUserOrPasswordError(res);
        bcrypt.compare(req.body.password, user.password, async (err, same) =>  {
            if(!same) return responseUtils.setUserOrPasswordError(res);

            const accessToken = buildAccessToken(user);
            const refreshToken = buildRefreshToken(user);
            const token = await TokenModel.findOneAndUpdate(
                { user: user._id }, 
                { refreshToken }, 
                { new: true, upsert: true, setDefaultsOnInsert: true, useFindAndModify: false  }
            );
            res.header('auth-token', accessToken).json({
                data: { userId: user._id, accessToken, refreshToken }
            });
        });
    } catch(error) {
        return responseUtils.setServerError(res, error);
    }
})

router.post('/token', async (req, res) => {
    const refreshToken = req.body.refreshToken;
    if(refreshToken == null) return responseUtils.setUnauthorizedError(res);
    const refreshTokenDb = await TokenModel.findOne({ refreshToken });
    if(refreshTokenDb == null) return responseUtils.setForbiddenError(res);
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, user) => {
        if(err) return responseUtils.setForbiddenError(res);
        const accessToken = buildAccessToken(user);
        const refreshToken = buildRefreshToken(user);
        const token = await TokenModel.findOneAndUpdate({ user: user._id }, { refreshToken }, { new: true, upsert: true, setDefaultsOnInsert: true, useFindAndModify: false  });
        res.header('auth-token', accessToken).json({
            data: { userId: user._id, accessToken, refreshToken }
        })
    })
})

router.post('/login/social', async (req, res) => {
    const { error } = validations.userSocialLogin.validate(req.body);
    if(error) return responseUtils.setJoiValidationError(res, error);
    try {
        const socialCriteria = {
            type: req.body.type,
            id: req.body.id
        }
        const user = await userModel.findOne({ 'socials': {$elemMatch: {type: req.body.type, id: req.body.id}}, email: req.body.email});
        if(!user) return responseUtils.setUserBySocialNotFound(res, req.body.id);
        const accessToken = buildAccessToken(user);
        const refreshToken = buildRefreshToken(user);
        const token = await TokenModel.findOneAndUpdate({ user: user._id }, { refreshToken }, { new: true, upsert: true, setDefaultsOnInsert: true, useFindAndModify: false  });
        res.header('auth-token', accessToken).json({
            data: { userId: user._id, accessToken, refreshToken }
        })
    } catch (error) {
        console.log(error);
        return responseUtils.setServerError(res, error);
    }
})

module.exports = router;