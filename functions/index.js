const admin = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp();

exports.addAdminRole = functions.https.onCall((uid, context) => {
  // check request is made by an admin
  if ( context.auth.token.admin !== true ) {
    return {error: "Only admins can add other admins"};
  }
  // get user and add admin custom claim
  return admin.auth().getUser(uid).then((user) => {

    return admin.auth().setCustomUserClaims(user.uid, {
      admin: true,
    });
  }).then((data) => {
    return {
      message: `Success! ${data} has been made an admin.`,
    };
  }).catch((err) => {
    return {
      error: `something went wrong ${err}`,
    }
  });
});

// exports.createUser = functions.https.onCall((data, context) => {
//   // check request is made by an admin
//   if ( context.auth.token.admin !== true ) {
//     return {error: "Only admins can add other admins"};
//   }

//   return admin.auth().createUser(data)
//     .then((data) => {
//       return data
//     })
//   .catch(console.error);
// });

