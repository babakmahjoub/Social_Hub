const functions = require('firebase-functions');
const app = require('express')();
const cors = require('cors')

const { db } = require('./util/admin')
const FBAuth = require('./util/fbAuth')
const { getAllScreams, postOneScream, getOneScream, commentOnScream, likeScream, unlikeScream, deleteScream } = require('./handlers/screams')
const { signup, login, uploadImage, addUserDetails, getAuthUser, getUserDetails, markNotifications } = require('./handlers/users');

app.use(cors())
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
app.get('/user', FBAuth, getAuthUser)
app.get('/user/:handle', getUserDetails)
app.post('/notifications', FBAuth, markNotifications)


exports.api = functions.region('asia-northeast1').https.onRequest(app)

exports.createNotificationOnLike = functions
    .region('asia-northeast1')
    .firestore.document('likes/{id}')
    .onCreate((snapshot) => {
        return db
            .doc(`/screams/${snapshot.data().screamId}`)
            .get()
            .then((doc) => {
                if (
                    doc.exists &&
                    doc.data().userHandle !== snapshot.data().userHandle
                ) {
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        createdAt: new Date().toISOString(),
                        recipient: doc.data().userHandle,
                        sender: snapshot.data().userHandle,
                        type: 'like',
                        read: false,
                        screamId: doc.id
                    });
                }
            })
            .catch((err) => console.error(err));
    });

exports.deleteNotificationOnUnLike = functions
    .region('asia-northeast1')
    .firestore.document('likes/{id}')
    .onDelete((snapshot) => {
        return db
            .doc(`/notifications/${snapshot.id}`)
            .delete()
            .catch((err) => {
                console.error(err);
                return;
            });
    });

exports.createNotificationOnComment = functions
    .region('asia-northeast1')
    .firestore.document('comments/{id}')
    .onCreate((snapshot) => {
        return db
            .doc(`/screams/${snapshot.data().screamId}`)
            .get()
            .then((doc) => {
                if (
                    doc.exists &&
                    doc.data().userHandle !== snapshot.data().userHandle
                ) {
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        createdAt: new Date().toISOString(),
                        recipient: doc.data().userHandle,
                        sender: snapshot.data().userHandle,
                        type: 'comment',
                        read: false,
                        screamId: doc.id
                    });
                }
            })
            .catch((err) => {
                console.error(err);
                return;
            });
    });

exports.onUserImageChange = functions
    .region('asia-northeast1')
    .firestore.document('/users/{userId}')
    .onUpdate((change) => {
        console.log(change.before.data());
        console.log(change.after.data());
        if (change.before.data().imageUrl !== change.after.data().imageUrl) {
            console.log('image has changed');
            const batch = db.batch();
            return db
                .collection('screams')
                .where('userHandle', '==', change.before.data().handle)
                .get()
                .then((data) => {
                    data.forEach((doc) => {
                        const scream = db.doc(`/screams/${doc.id}`);
                        batch.update(scream, { userImage: change.after.data().imageUrl });
                    });
                    return batch.commit();
                });
        } else return true;
    });

exports.onScreamDelete = functions
    .region('asia-northeast1')
    .firestore.document('/screams/{screamId}')
    .onDelete((snapshot, context) => {
        const screamId = context.params.screamId;
        const batch = db.batch();
        return db
            .collection('comments')
            .where('screamId', '==', screamId)
            .get()
            .then((data) => {
                data.forEach((doc) => {
                    batch.delete(db.doc(`/comments/${doc.id}`));
                });
                return db
                    .collection('likes')
                    .where('screamId', '==', screamId)
                    .get();
            })
            .then((data) => {
                data.forEach((doc) => {
                    batch.delete(db.doc(`/likes/${doc.id}`));
                });
                return db
                    .collection('notifications')
                    .where('screamId', '==', screamId)
                    .get();
            })
            .then((data) => {
                data.forEach((doc) => {
                    batch.delete(db.doc(`/notifications/${doc.id}`));
                });
                return batch.commit();
            })
            .catch((err) => console.error(err));
    });
