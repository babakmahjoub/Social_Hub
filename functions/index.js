const functions = require('firebase-functions');
const app = require('express')();

const FBAuth = require('./util/fbAuth')
const { getAllScreams, postOneScream } = require('./handlers/screams')
const { signup, login } = require('./handlers/users')

//screams route
app.get('/screams', getAllScreams)
app.post('/screams', FBAuth, postOneScream);

//users route
app.post('/signup', signup)
app.post('/login', login)


exports.api = functions.region('asia-northeast1').https.onRequest(app)