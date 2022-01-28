const auth = "Basic " + btoa(process.env.VUE_APP_VERACITY_LRS_SECRET);

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

  const statement = {
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

export const sendTeacherXAPIStatement = (actorMbox, verbId, context) => {
  console.log("sending teacher xAPI statement...");
  let verbDisplay = "";
  switch (verbId) {
    // teacher cases
    case "https://w3id.org/xapi/dod-isd/verbs/assisted":
      verbDisplay = "assisted";
      break;
    case "https://w3id.org/xapi/dod-isd/verbs/reviewed":
      verbDisplay = "reviewed";
      break;
    default:
  }

  const statement = {
    actor: {
      mbox: "mailto:" + actorMbox,
    },
    verb: {
      id: verbId,
      display: { "en-nz": verbDisplay },
    },
    object: {
      objectType: "Agent",
      mbox: "mailto:" + context.student.email,
    },
    context: {
      contextActivities: {
        parent: [
          {
            id:
              "https://www.galaxymaps.io/" +
              context.galaxyName +
              "/" +
              context.systemName +
              "/" +
              context.missionName,
          },
        ],
        grouping: [
          {
            id: "https://www.galaxymaps.io/student/" + context.student.email,
          },
        ],
        extensions: {
          "https://www.galaxymaps.io/extensions/studentName":
            context.student.firstName + "-" + context.student.lastName,
        },
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
