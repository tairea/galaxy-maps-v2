const auth = "Basic " + btoa(process.env.VUE_APP_VERACITY_LRS_SECRET);

/* ----------------------
  SEND xAPI STATEMENTS
------------------------- */

// ========== Start Task (make task active)
export const startTaskXAPIStatement = (actorMbox, taskId, context) => {
  console.log("sending student xAPI statement... task started...");
  const statement = {
    actor: {
      mbox: "mailto:" + actorMbox,
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
            id: context.system.id,
            objectType: "Activity",
          },
        ],
        grouping: [
          {
            id: context.galaxy.id,
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
export const submitWorkForReviewXAPIStatement = (
  actorMbox,
  taskId,
  context
) => {
  console.log("sending student xAPI statement... submitted work for review...");
  const statement = {
    actor: {
      mbox: "mailto:" + actorMbox,
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
            id: context.system.id,
            objectType: "Activity",
          },
        ],
        grouping: [
          {
            id: context.galaxy.id,
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
export const taskMarkedAsCompletedXAPIStatement = (
  actorMbox,
  taskId,
  context
) => {
  console.log("sending student xAPI statement... task marked as completed...");
  const statement = {
    actor: {
      mbox: "mailto:" + actorMbox,
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
            id: context.system.id,
            objectType: "Activity",
          },
        ],
        grouping: [
          {
            id: context.galaxy.id,
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
export const topicCompletedXAPIStatement = (actorMbox, topicId, context) => {
  console.log("sending student xAPI statement... topic completed...");
  const statement = {
    actor: {
      mbox: "mailto:" + actorMbox,
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
            id: context.galaxy.id,
            objectType: "Activity",
          },
        ],
        grouping: [
          {
            id: context.galaxy.id,
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
  actorMbox,
  taskId,
  context
) => {
  console.log("sending student xAPI statement... work marked as completed...");
  const statement = {
    actor: {
      mbox: "mailto:" + actorMbox,
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
            id: context.system.id,
            objectType: "Activity",
          },
        ],
        grouping: [
          {
            id: context.galaxy.id,
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
  actorMbox,
  taskId,
  context
) => {
  console.log("sending student xAPI statement... work marked as completed...");
  const statement = {
    actor: {
      mbox: "mailto:" + actorMbox,
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
  actorMbox,
  taskId,
  context
) => {
  console.log(
    "sending student xAPI statement... teacher responsed to request for help..."
  );
  const statement = {
    actor: {
      mbox: "mailto:" + actorMbox,
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
export const studentRequestForHelpXAPIStatement = (
  actorMbox,
  taskId,
  context
) => {
  console.log("sending student xAPI statement... student requesting help...");
  const statement = {
    actor: {
      mbox: "mailto:" + actorMbox,
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

/* ----------------------
  QUERY xAPI STATEMENTS
------------------------- */

export const queryXAPIStatement = (payloadObj) => {
  const url = new URL("https://galaxymaps.lrs.io/xapi/statements");
  const parameters = url.searchParams;

  if (payloadObj.verb) {
    parameters.set("verb", payloadObj.verb);
  }
  if (payloadObj.email) {
    parameters.set("agent", '{"mbox": "mailto:' + payloadObj.email + '"}');
  }

  return fetch(url, {
    method: "GET",
    headers: {
      Authorization: auth,
    },
  }).then((result) => result.json());
};
