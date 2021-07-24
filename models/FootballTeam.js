const mongoose = require('mongoose');

const footballTeamSchema = mongoose.Schema({
    name: String
})

module.exports = mongoose.model('FootballTeam', footballTeamSchema);