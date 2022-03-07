const auth = "Basic " + btoa(process.env.VUE_APP_VERACITY_LRS_SECRET);

/* ----------------------
  SEND xAPI STATEMENTS
------------------------- */

// ========== Start Task (make task active)
export const startGalaxyXAPIStatement = (actor, context) => {
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
      //   id: "https://www.galaxymaps.io/" + context,
      id: context.galaxy.id,
      definition: {
        name: {
          "en-nz": "Course: " + context.galaxy.title,
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
      Authorization: auth,
    },
    body: JSON.stringify(statement),
  }).catch((error) => console.error(error.message));
};
// ========== Start Task (make task active)
export const startTaskXAPIStatement = (actor, taskId, context) => {
  console.log("sending student xAPI statement... task started...");
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
      //   id: "https://www.galaxymaps.io/" + context,
      id: taskId,
      definition: {
        name: {
          "en-nz":
            "Course: " +
            context.galaxy.title +
            " > Topic: " +
            context.system.label +
            " > Task: " +
            context.mission.title,
        },
      },
    },
    context: {
      contextActivities: {
        parent: [
          {
            id: "https://www.galaxymaps.io/topic/" + context.system.id,
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
      Authorization: auth,
    },
    body: JSON.stringify(statement),
  }).catch((error) => console.error(error.message));
};
// ========== Submit work for review (by student)
export const submitWorkForReviewXAPIStatement = (actor, taskId, context) => {
  console.log("sending student xAPI statement... submitted work for review...");
  const statement = {
    actor: {
      name: actor.firstName + " " + actor.lastName,
      mbox: "mailto:" + actor.email,
    },
    verb: {
      id: "https://w3id.org/xapi/dod-isd/verbs/submitted",
      display: { "en-nz": "submitted" },
    },
    object: {
      //   id: "https://www.galaxymaps.io/" + context,
      id: taskId,
      definition: {
        name: {
          "en-nz":
            "Course: " +
            context.galaxy.title +
            " > Topic: " +
            context.system.label +
            " > Task: " +
            context.mission.title,
        },
      },
    },
    context: {
      contextActivities: {
        parent: [
          {
            id: "https://www.galaxymaps.io/topic/" + context.system.id,
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
      Authorization: auth,
    },
    body: JSON.stringify(statement),
  }).catch((error) => console.error(error.message));
};

// ========== Task Marked as Completed (by student)
export const taskMarkedAsCompletedXAPIStatement = (actor, taskId, context) => {
  console.log("sending student xAPI statement... task marked as completed...");
  const statement = {
    actor: {
      name: actor.firstName + " " + actor.lastName,
      mbox: "mailto:" + actor.email,
    },
    verb: {
      id: "http://adlnet.gov/expapi/verbs/completed",
      display: { "en-nz": "completed" },
    },
    object: {
      //   id: "https://www.galaxymaps.io/" + context,
      id: taskId,
      definition: {
        name: {
          "en-nz":
            "Course: " +
            context.galaxy.title +
            " > Topic: " +
            context.system.label +
            " > Task: " +
            context.mission.title,
        },
      },
    },
    context: {
      contextActivities: {
        parent: [
          {
            id: "https://www.galaxymaps.io/topic/" + context.system.id,
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
      Authorization: auth,
    },
    body: JSON.stringify(statement),
  }).catch((error) => console.error(error.message));
};

// ========== Topic Completed (by student)
export const topicCompletedXAPIStatement = (actor, topicId, context) => {
  console.log("sending student xAPI statement... topic completed...");
  const statement = {
    actor: {
      name: actor.firstName + " " + actor.lastName,
      mbox: "mailto:" + actor.email,
    },
    verb: {
      id: "http://adlnet.gov/expapi/verbs/completed",
      display: { "en-nz": "completed" },
    },
    object: {
      //   id: "https://www.galaxymaps.io/" + context,
      id: topicId,
      definition: {
        name: {
          "en-nz":
            "Course: " +
            context.galaxy.title +
            " > Topic: " +
            context.system.label,
        },
      },
    },
    context: {
      contextActivities: {
        parent: [
          {
            id: "https://www.galaxymaps.io/topic/" + context.system.id,
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
      Authorization: auth,
    },
    body: JSON.stringify(statement),
  }).catch((error) => console.error(error.message));
};

// ========== Student work marked completed (by teacher)
export const studentWorkMarkedCompletedXAPIStatement = (
  actor,
  taskId,
  context
) => {
  console.log("sending student xAPI statement... work marked as completed...");
  const statement = {
    actor: {
      name: actor.firstName + " " + actor.lastName,
      mbox: "mailto:" + actor.email,
    },
    verb: {
      id: "http://adlnet.gov/expapi/verbs/completed",
      display: { "en-nz": "completed" },
    },
    object: {
      //   id: "https://www.galaxymaps.io/" + context,
      id: taskId,
      definition: {
        name: {
          "en-nz":
            "Course: " +
            context.galaxy.title +
            " > Topic: " +
            context.system.label +
            " > Task: " +
            context.mission.title,
        },
      },
    },
    context: {
      contextActivities: {
        parent: [
          {
            id: "https://www.galaxymaps.io/topic/" + context.system.id,
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
      Authorization: auth,
    },
    body: JSON.stringify(statement),
  }).catch((error) => console.error(error.message));
};

// ========== Teacher reviewed student work (by teacher)
export const teacherReviewedStudentWorkXAPIStatement = (
  actor,
  taskId,
  context
) => {
  console.log("sending student xAPI statement... work marked as completed...");
  const statement = {
    actor: {
      name: actor.firstName + " " + actor.lastName,
      mbox: "mailto:" + actor.email,
    },
    verb: {
      id: "https://w3id.org/xapi/dod-isd/verbs/reviewed",
      display: { "en-nz": "reviewed" },
    },
    object: {
      //   id: "https://www.galaxymaps.io/" + context,
      id: taskId,
      definition: {
        name: {
          "en-nz":
            "Course: " +
            context.galaxy.title +
            " > Topic: " +
            context.system.label +
            " > Task: " +
            context.mission.title,
        },
      },
    },
    context: {
      contextActivities: {
        parent: [
          {
            id: "https://www.galaxymaps.io/topic/" + context.system.id,
            objectType: "Activity",
          },
        ],
        grouping: [
          {
            id: "https://www.galaxymaps.io/student/" + context.student.email,
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

// ========== Teacher responed to request for help (by teacher)
export const teacherRespondedToRequestForHelpXAPIStatement = (
  actor,
  taskId,
  context
) => {
  console.log(
    "sending student xAPI statement... teacher responsed to request for help..."
  );
  const statement = {
    actor: {
      name: actor.firstName + " " + actor.lastName,
      mbox: "mailto:" + actor.email,
    },
    verb: {
      id: "https://w3id.org/xapi/dod-isd/verbs/assisted",
      display: { "en-nz": "assisted" },
    },
    object: {
      //   id: "https://www.galaxymaps.io/" + context,
      id: taskId,
      definition: {
        name: {
          "en-nz":
            "Course: " +
            context.galaxy.title +
            " > Topic: " +
            context.system.label +
            " > Task: " +
            context.mission.title,
        },
      },
    },
    context: {
      contextActivities: {
        parent: [
          {
            id: "https://www.galaxymaps.io/topic/" + context.system.id,
            objectType: "Activity",
          },
        ],
        grouping: [
          {
            id: "https://www.galaxymaps.io/student/" + context.student.email,
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

// ========== Request for help (by student)
export const studentRequestForHelpXAPIStatement = (actor, taskId, context) => {
  console.log("sending student xAPI statement... student requesting help...");
  const statement = {
    actor: {
      name: actor.firstName + " " + actor.lastName,
      mbox: "mailto:" + actor.email,
    },
    verb: {
      id: "http://id.tincanapi.com/verb/requested-attention",
      display: { "en-nz": "requested help" },
    },
    object: {
      //   id: "https://www.galaxymaps.io/" + context,
      id: taskId,
      definition: {
        name: {
          "en-nz":
            "Course: " +
            context.galaxy.title +
            " > Topic: " +
            context.system.label +
            " > Task: " +
            context.mission.title,
        },
      },
    },
    context: {
      contextActivities: {
        parent: [
          {
            id: "https://www.galaxymaps.io/topic/" + context.system.id,
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
      Authorization: auth,
    },
    body: JSON.stringify(statement),
  }).catch((error) => console.error(error.message));
};

// ========== Students goes online
export const studentOnlineXAPIStatement = (actor) => {
  console.log("sending student xAPI statement... student is online");
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
export const studentOfflineXAPIStatement = (actor) => {
  console.log("sending student xAPI statement... student is offline");
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

/* ----------------------
  QUERY xAPI STATEMENTS
------------------------- */

export const queryXAPIStatement = (payloadObj) => {
  const url = new URL("https://galaxymaps.lrs.io/xapi/statements/search");
  const parameters = url.searchParams;
  // use veracist LRS v2 mode
  parameters.set("mode", "v2");
  // add search params as json
  url.searchParams.set("query", JSON.stringify(payloadObj));
  // get query from LRS
  return fetch(url, {
    method: "GET",
    headers: {
      Authorization: auth,
    },
  }).then((result) => result.json());
};
