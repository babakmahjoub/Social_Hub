const functions = require('firebase-functions');
const app = require('express')();

const FBAuth = require('./util/fbAuth')
const { getAllScreams, postOneScream, getOneScream, commentOnScream, likeScream, unlikeScream, deleteScream } = require('./handlers/screams')
const { signup, login, uploadImage, addUserDetails, getUserDetails } = require('./handlers/users');

//screams route
app.get('/screams', getAllScreams)
app.post('/screams', FBAuth, postOneScream);

app.get('/screams/:screamId', getOneScream);
app.delete('/screams/:screamId', FBAuth, deleteScream)

app.post('/screams/:screamId/comment', FBAuth, commentOnScream)
app.get('/screams/:screamId/like', FBAuth, likeScream)
app.get('/screams/:screamId/unlike', FBAuth, unlikeScream)

//users route
app.post('/signup', signup)
app.post('/login', login)

app.post('/user/image', FBAuth, uploadImage)
app.post('/user', FBAuth, addUserDetails)
app.get('/user', FBAuth, getUserDetails)


exports.api = functions.region('asia-northeast1').https.onRequest(app)