// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

const functions = require('firebase-functions')
const { Expo } = require('expo-server-sdk')

const admin = require('firebase-admin')
admin.initializeApp()

exports.useWildcard = functions.firestore
  .document('notifications/{docId}')
  .onCreate(async (snap, context) => {
    // Create a new Expo SDK client
    let expo = new Expo()

    //Get expo push notifications token
    const tokens = []
    const token = await admin
      .firestore()
      .collection('users')
      .doc(snap.data().ownerEmail)
      .get()
      .then((doc) => {
        return doc.data().pushToken
      })
    tokens.push(token)

    // Create the messages that you want to send to clients
    let messages = []
    for (let pushToken of tokens) {
      // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]

      // Check that all your push tokens appear to be valid Expo push tokens
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Push token ${pushToken} is not a valid Expo push token`)
        continue
      }

      // Construct a message (see https://docs.expo.io/versions/latest/guides/push-notifications)
      messages.push({
        to: pushToken,
        sound: 'default',
        body: 'This is a test notification',
        data: { withSome: 'data' },
      })
    }

    // The Expo push notification service accepts batches of notifications so
    // that you don't need to send 1000 requests to send 1000 notifications. We
    // recommend you batch your notifications to reduce the number of requests
    // and to compress them (notifications with similar content will get
    // compressed).
    let chunks = expo.chunkPushNotifications(messages)
    let tickets = []
    ;(async () => {
      // Send the chunks to the Expo push notification service. There are
      // different strategies you could use. A simple one is to send one chunk at a
      // time, which nicely spreads the load out over time:
      for (let chunk of chunks) {
        try {
          let ticketChunk = expo.sendPushNotificationsAsync(chunk)

          // NOTE: If a ticket contains an error code in ticket.details.error, you
          // must handle it appropriately. The error codes are listed in the Expo
          // documentation:
          // https://docs.expo.io/versions/latest/guides/push-notifications#response-format
        } catch (error) {
          console.error(error)
        }
      }
    })()
  })
