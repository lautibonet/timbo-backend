const router = require('express').Router();
const footballTeamModel = require('../models/FootballTeam');
const validations = require('../utils/validations');

router.get('/', async (req, res) => {
    try{
        const footballTeams = await footballTeamModel.find();
        res.json({ data: footballTeams });
    } catch (error) {
        res.status(500).json({ error });
    }
})

router.post('/', async (req, res) => {
    const { error } = validations.footballTeam.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message })
    try{
        const name = req.body.name;

        const found = await footballTeamModel.findOne({ name });
        if(found != null) return res.status(400).json({ error: 'team_already_created' })
        const footballTeam = new footballTeamModel({ name });
        footballTeam.save();
        res.json({ data: footballTeam });
    } catch (error) {
        res.status(500).json({ error });
    }
})

module.exports = router;