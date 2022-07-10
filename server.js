const express = require('express');
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const server = express();

// capture body
server.use(bodyparser.urlencoded({ extended: false }));
server.use(bodyparser.json());

// db conection
const uri = `mongodb+srv://${process.env.DBUSER}:${process.env.DBPASSWORD}@devcluster.hnpzt.mongodb.net/${process.env.DBNAME}?retryWrites=true&w=majority`;
mongoose.connect(uri,
    { useNewUrlParser: true, useUnifiedTopology: true }
)
.then(() => console.log('Base de datos conectada'))
.catch(e => console.log('error db:', e))

// routes import
const verifyToken = require('./routes/validate-token');
const authCheckRoutes = require('./routes/auth-check');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const matchRoutes = require('./routes/match');
const friendRoutes = require('./routes/friend');
const footballTeamRoutes = require('./routes/football-team');

//route middlewares
server.use('/static/uploads', express.static('static/uploads'));
server.use('/api/auth', authRoutes);
server.use('/api/auth-check', verifyToken, authCheckRoutes);
server.use('/api/user', userRoutes);
server.use('/api/match', matchRoutes);
server.use('/api/friend', friendRoutes);
server.use('/api/static/football-team', footballTeamRoutes);
server.get('/', (req, res) => {
    res.json({
        data: 'It works!'
    })
})

// server init
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})