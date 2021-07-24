const router = require('express').Router();
const userModel = require('../models/User');
const friendModel = require('../models/Friend');
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
        res.staus(500).json({ error })
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
        res.status(500).json({ error })
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
        res.status(500).json({ error })
    }
})

///////// FUNCTIONS /////////

async function getRequesterAndRecipient(req, res, next) {
    const requesterId = req.body.requesterId;
    if(requesterId == null) return res.status(400).json({ error: 'requesterId_required' })
    const recipientId = req.body.recipientId;
    if(recipientId == null) return res.status(400).json({ error: 'recipientId_required' })
    try{
        const requester = await userModel.findById(requesterId);
        if(requester == null) return res.status(400).json({ error: 'requester_not_found' })
        const recipient = await userModel.findById(recipientId);
        if(recipient == null) return res.status(400).json({ error: 'recipient_not_found' })
        req.requester = requester;
        req.recipient = recipient;
        next();
    } catch (error) {
        catchObjectIdError(error, 
            () => res.status(404).json({ message: 'user_not_found' }) , 
            () => res.status(500).json({ error })
        );
    }
}

module.exports = router;