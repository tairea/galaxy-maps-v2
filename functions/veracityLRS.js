const fetch = require("node-fetch");
require("dotenv").config();

// const btoa = (text) => {
//   return Buffer.from(text, "binary").toString("base64");
// };

const auth = "Basic " + btoa(process.env.VERACITY_LRS_SECRET);

// ========== Students goes online
const studentOnlineXAPIStatement = (actor) => {
  // console.log("sending student xAPI statement... student is online");
  const statement = {
    actor: {
      name: actor.firstName + " " + actor.lastName,
      mbox: "mailto:" + actor.email,
    },
    verb: {
      id: "https://brindlewaye.com/xAPITerms/verbs/loggedin/",
      display: { "en-nz": "logged in" },
    },
    object: {
      id: "https://www.galaxymaps.io/isonline/" + actor.id + "/" + new Date(),
      definition: {
        description: {
          "en-nz": actor.firstName + " " + actor.lastName + " has loggedIn",
        },
      },
    },
    context: {
      contextActivities: {
        grouping: [
          {
            id: "https://www.galaxymaps.io/userStatus/",
            objectType: "Activity",
          },
        ],
      },
    },
  };

  fetch("https://galaxymaps.lrs.io/xapi/statements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify(statement),
  }).catch((error) => console.error(error.message));
};

// ========== Students goes offline
const studentOfflineXAPIStatement = (actor) => {
  // console.log("sending student xAPI statement... student is offline");
  const statement = {
    actor: {
      name: actor.firstName + " " + actor.lastName,
      mbox: "mailto:" + actor.email,
    },
    verb: {
      id: "https://brindlewaye.com/xAPITerms/verbs/loggedout/",
      display: { "en-nz": "logged out" },
    },
    object: {
      id: "https://www.galaxymaps.io/isOffline/" + actor.id + "/" + new Date(),
      definition: {
        description: {
          "en-nz": actor.firstName + " " + actor.lastName + " has loggedOut",
        },
      },
    },
    context: {
      contextActivities: {
        grouping: [
          {
            id: "https://www.galaxymaps.io/userStatus/",
            objectType: "Activity",
          },
        ],
      },
    },
  };

  fetch("https://galaxymaps.lrs.io/xapi/statements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify(statement),
  }).catch((error) => console.error(error.message));
};

module.exports = {
  studentOnlineXAPIStatement,
  studentOfflineXAPIStatement,
};
