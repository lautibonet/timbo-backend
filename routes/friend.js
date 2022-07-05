const router = require('express').Router();
const userModel = require('../models/User');
const friendModel = require('../models/Friend');
const responseUtils = require('../utils/response-utils');
const validations = require('../utils/validations');
const catchObjectIdError = require('../utils/catchObjectIdError');

///////// APIS /////////

router.post('/', getRequesterAndRecipient, async (req, res) => {
    const requester = req.requester;
    const recipient = req.recipient;
    try{
        const docA = await friendModel.findOneAndUpdate(
            { requester: requester._id, recipient: recipient._id },
            { $set: { status: 1 }},
            { upsert: true, new: true }
        )
        const docB = await friendModel.findOneAndUpdate(
            { recipient: requester._id, requester: recipient._id },
            { $set: { status: 2 }},
            { upsert: true, new: true }
        )
        const updateRequester = await userModel.findOneAndUpdate(
            { _id: requester._id },
            { $push: { friends: docA._id }}
        )
        const updateRecipient = await userModel.findOneAndUpdate(
            { _id: recipient._id },
            { $push: { friends: docB._id }}
        )
        res.json({ data: docA })
    } catch (error) {
        responseUtils.setServerError(res, error);
    }
})

router.post('/accept', getRequesterAndRecipient, async (req, res) => {
    const requester = req.requester;
    const recipient = req.recipient;
    try{
        await friendModel.findOneAndUpdate(
            { requester: requester._id, recipient: recipient._id },
            { $set: { status: 3 }}
        )
        await friendModel.findOneAndUpdate(
            { recipient: requester._id, requester: recipient._id },
            { $set: { status: 3 }}
        )
        res.json({ data: requester })
    } catch (error) {
        responseUtils.setServerError(res, error);
    }
})

router.post('/reject', getRequesterAndRecipient, async (req, res) => {
    const requester = req.requester;
    const recipient = req.recipient;
    try{
        const docA = await friendModel.findOneAndDelete(
            { requester: requester._id, recipient: recipient._id },
            { useFindAndModify: false }
        )
        const docB = await friendModel.findOneAndDelete(
            { recipient: requester._id, requester: recipient._id },
            { useFindAndModify: false }
        )
        const updateUserA = await userModel.findOneAndUpdate(
            { _id: requester._id },
            { $pull: { friends: docA._id }, useFindAndModify: false}
        )
        const updateUserB = await userModel.findOneAndUpdate(
            { _id: recipient._id },
            { $pull: { friends: docB._id }, useFindAndModify: false}
        )
        res.sendStatus(200);
    } catch (error) {
        console.log(error);
        responseUtils.setServerError(res, error);
    }
})

///////// FUNCTIONS /////////

async function getRequesterAndRecipient(req, res, next) {
    const { error } = validations.friendRequest.validate(req.body);
    if(error) return responseUtils.setJoiValidationError(req, error);
    const requesterId = req.body.requesterId;
    const recipientId = req.body.recipientId;
    let requester, recipient;
    
    try{
        requester = await userModel.findById(requesterId);
        if(requester == null) return responseUtils.setRequesterNotFound(res, requesterId);
    } catch (error) {
        catchObjectIdError(error, 
            () => responseUtils.setUserNotFound(res, requesterId), 
            () => responseUtils.setServerError(res)
        );
    }

    try {
        recipient = await userModel.findById(recipientId);
        if(recipient == null) return responseUtils.setRecipientNotFound(res, recipientId);
    } catch (error) {
        catchObjectIdError(error, 
            () => responseUtils.setUserNotFound(res, recipientId), 
            () => responseUtils.setServerError(res)
        );
    }

    req.requester = requester;
    req.recipient = recipient;
    next();
}

module.exports = router;