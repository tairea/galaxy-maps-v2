// var TinCan = require("tincanjs");
import TinCan from "tincanjs";

var lrs;

try {
  lrs = new TinCan.LRS({
    endpoint: "https://galaxymaps.lrs.io/xapi/statements",
    username: process.env.VUE_APP_VERACITY_LRS_USER,
    password: process.env.VUE_APP_VERACITY_LRS_PASS,
    allowFail: false,
  });
} catch (ex) {
  console.log("Failed to setup LRS object: ", ex);
  // TODO: do something with error, can't communicate with LRS
}

export const sendStudentXAPIStatement = (actorMbox, verbId, context) => {
  console.log("sending student xAPI statement...");
  let verbDisplay = "";
  switch (verbId) {
    // student cases
    case "https://w3id.org/xapi/dod-isd/verbs/started":
      verbDisplay = "started";
      break;
    case "http://adlnet.gov/expapi/verbs/completed":
      verbDisplay = "completed";
      break;
    case "http://id.tincanapi.com/verb/requested-attention":
      verbDisplay = "requested help";
      break;
    case "https://w3id.org/xapi/dod-isd/verbs/submitted":
      verbDisplay = "submitted";
      break;
    default:
  }

  const statement = new TinCan.Statement({
    actor: {
      mbox: "mailto:" + actorMbox,
    },
    verb: {
      id: verbId,
      display: { "en-nz": verbDisplay },
    },
    object: {
      //   id: "https://www.galaxymaps.io/" + context,
      id:
        "https://www.galaxymaps.io/" +
        context.galaxyName +
        "/" +
        context.systemName +
        "/" +
        context.missionName,
      definition: {
        name: {
          "en-nz":
            "Galaxy: " +
            context.galaxyName +
            " > System: " +
            context.systemName +
            " > Mission: " +
            context.missionName,
        },
      },
    },
    context: {
      contextActivities: {
        parent: [
          {
            id:
              "https://www.galaxymaps.io/" +
              context.galaxyName +
              "/" +
              context.systemName,
          },
        ],
        grouping: [
          {
            id: "https://www.galaxymaps.io/" + context.galaxyName,
          },
        ],
      },
    },
  });

  // fetch("https://galaxymaps.lrs.io/xapi/statements", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization: auth,
  //   },
  //   body: JSON.stringify(statement),
  // }).catch((error) => console.error(error.message));

  lrs.saveStatement(statement, {
    callback: function (err, xhr) {
      if (err !== null) {
        if (xhr !== null) {
          console.log(
            "Failed to save statement: " +
              xhr.responseText +
              " (" +
              xhr.status +
              ")"
          );
          // TODO: do something with error, didn't save statement
          return;
        }

        console.log("Failed to save statement: " + err);
        // TODO: do something with error, didn't save statement
        return;
      }

      console.log("Statement saved");
      // TOOO: do something with success (possibly ignore)
    },
  });
};
