import fetch from "node-fetch";

const btoa = (text: string) => {
  return Buffer.from(text, "binary").toString("base64");
};

const auth = "Basic " + btoa(`${process.env.VERACITY_LRS_SECRET}`);

// ========== Students goes online
export const studentOnlineXAPIStatement = (actor: { [field: string]: any }) => {
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
      "Authorization": auth,
    },
    body: JSON.stringify(statement),
  }).catch((error) => console.error(error.message));
};

// ========== Students goes offline
export const studentOfflineXAPIStatement = (actor: { [field: string]: any }) => {
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
      "Authorization": auth,
    },
    body: JSON.stringify(statement),
  }).catch((error) => console.error(error.message));
};

// ========== Start Task (make task active)
export const startGalaxyXAPIStatement = (actor: { [field: string]: any }, context: { galaxy: { [field: string]: any } }) => {
  console.log("sending student xAPI statement... galaxy started...");
  const statement = {
    actor: {
      name: actor.firstName + " " + actor.lastName,
      mbox: "mailto:" + actor.email,
    },
    verb: {
      id: "https://w3id.org/xapi/dod-isd/verbs/started",
      display: { "en-nz": "started" },
    },
    object: {
      id: "https://www.galaxymaps.io/course/" + context.galaxy.id,
      definition: {
        name: {
          "en-nz": "Course: " + context.galaxy.title,
        },
        description: {
          "en-nz": "Started Course: " + context.galaxy.title,
        },
        extensions: {
          "https://www.galaxymaps.io/course/id/": context.galaxy.id,
          "https://www.galaxymaps.io/person/id/": actor.id,
        },
      },
    },
    context: {
      contextActivities: {
        parent: [
          {
            id: "https://www.galaxymaps.io/course/" + context.galaxy.id,
            objectType: "Activity",
          },
        ],
        grouping: [
          {
            id: "https://www.galaxymaps.io/course/" + context.galaxy.id,
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
      "Authorization": auth,
    },
    body: JSON.stringify(statement),
  }).catch((error) => console.error(error.message));
};
