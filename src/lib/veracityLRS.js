import store from "../store";
import { getCourseById, getStudentByEmail } from "../lib/ff";
import { db } from "../store/firestoreConfig";
import { DateTime } from "luxon";
import { _ } from "core-js";

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
      Authorization: auth,
    },
    body: JSON.stringify(statement),
  }).catch((error) => console.error(error.message));
};

// ========== Start Topic =========
export const startTopicXAPIStatement = (actor, context) => {
  console.log("sending student xAPI statement... topic started...");
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
      id: "https://www.galaxymaps.io/topic/" + context.system.id,
      definition: {
        name: {
          "en-nz":
            "Course: " +
            context.galaxy.title +
            " > Topic: " +
            context.system.label,
        },
        description: {
          "en-nz": "Started Topic: " + context.system.label,
        },
        extensions: {
          "https://www.galaxymaps.io/course/id/": context.galaxy.id,
          "https://www.galaxymaps.io/topic/id/": context.system.id,
          "https://www.galaxymaps.io/person/id/": actor.id,
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
      id: "https://www.galaxymaps.io/task/" + taskId,
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
        description: {
          "en-nz": "Started Task: " + context.mission.title,
        },
        extensions: {
          "https://www.galaxymaps.io/course/id/": context.galaxy.id,
          "https://www.galaxymaps.io/topic/id/": context.system.id,
          "https://www.galaxymaps.io/task/id/": context.mission.id,
          "https://www.galaxymaps.io/person/id/": actor.id,
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
      id: "https://www.galaxymaps.io/task/" + taskId,
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
        description: {
          "en-nz": "Submitted work for Task: " + context.mission.title,
        },
        extensions: {
          "https://www.galaxymaps.io/course/id/": context.galaxy.id,
          "https://www.galaxymaps.io/topic/id/": context.system.id,
          "https://www.galaxymaps.io/task/id/": context.mission.id,
          "https://www.galaxymaps.io/person/id/": actor.id,
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
export const reSubmitWorkForReviewXAPIStatement = (actor, taskId, context) => {
  console.log(
    "sending student xAPI statement... re-submitted work for review..."
  );
  const statement = {
    actor: {
      name: actor.firstName + " " + actor.lastName,
      mbox: "mailto:" + actor.email,
    },
    verb: {
      id: "https://w3id.org/xapi/dod-isd/verbs/submitted",
      display: { "en-nz": "re-submitted" },
    },
    object: {
      id: "https://www.galaxymaps.io/task/" + taskId,
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
        description: {
          "en-nz": "Submitted work for Task: " + context.mission.title,
        },
        extensions: {
          "https://www.galaxymaps.io/course/id/": context.galaxy.id,
          "https://www.galaxymaps.io/topic/id/": context.system.id,
          "https://www.galaxymaps.io/task/id/": context.mission.id,
          "https://www.galaxymaps.io/person/id/": actor.id,
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
      id: "https://www.galaxymaps.io/task/" + taskId,
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
        description: {
          "en-nz": "Completed Task: " + context.mission.title,
        },
        extensions: {
          "https://www.galaxymaps.io/course/id/": context.galaxy.id,
          "https://www.galaxymaps.io/topic/id/": context.system.id,
          "https://www.galaxymaps.io/task/id/": context.mission.id,
          "https://www.galaxymaps.io/person/id/": actor.id,
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
      id: "https://www.galaxymaps.io/topic/" + topicId,
      definition: {
        name: {
          "en-nz":
            "Course: " +
            context.galaxy.title +
            " > Topic: " +
            context.system.label,
        },
        description: {
          "en-nz": "Completed Topic: " + context.system.label,
        },
        extensions: {
          "https://www.galaxymaps.io/course/id/": context.galaxy.id,
          "https://www.galaxymaps.io/topic/id/": context.system.id,
          "https://www.galaxymaps.io/person/id/": actor.id,
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
      id: "https://www.galaxymaps.io/task/" + taskId,
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
        description: {
          "en-nz": "Work completed for Task: " + context.mission.title,
        },
        extensions: {
          "https://www.galaxymaps.io/course/id/": context.galaxy.id,
          "https://www.galaxymaps.io/topic/id/": context.system.id,
          "https://www.galaxymaps.io/task/id/": context.mission.id,
          "https://www.galaxymaps.io/person/id/": actor.id,
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
      id: "https://www.galaxymaps.io/task/" + taskId,
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
        description: {
          "en-nz": "Teacher marked work for Task: " + context.mission.title,
        },
        extensions: {
          "https://www.galaxymaps.io/course/id/": context.galaxy.id,
          "https://www.galaxymaps.io/topic/id/": context.system.id,
          "https://www.galaxymaps.io/task/id/": context.mission.id,
          "https://www.galaxymaps.io/person/id/": actor.id,
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
      id: "https://www.galaxymaps.io/task/" + taskId,
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
        description: {
          "en-nz":
            "Teacher responded to help for Task: " + context.mission.title,
        },
        extensions: {
          "https://www.galaxymaps.io/course/id/": context.galaxy.id,
          "https://www.galaxymaps.io/topic/id/": context.system.id,
          "https://www.galaxymaps.io/task/id/": context.mission.id,
          "https://www.galaxymaps.io/person/id/": actor.id,
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
      id: "https://www.galaxymaps.io/task/" + taskId,
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
        description: {
          "en-nz": "Student requested help for Task: " + context.mission.title,
        },
        extensions: {
          "https://www.galaxymaps.io/course/id/": context.galaxy.id,
          "https://www.galaxymaps.io/topic/id/": context.system.id,
          "https://www.galaxymaps.io/task/id/": context.mission.id,
          "https://www.galaxymaps.io/person/id/": actor.id,
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
export const teacherRespondedSubmissionDeclinedXAPIStatement = (
  actor,
  taskId,
  context
) => {
  console.log(
    "sending student xAPI statement... teacher declined submission..."
  );
  const statement = {
    actor: {
      name: actor.firstName + " " + actor.lastName,
      mbox: "mailto:" + actor.email,
    },
    verb: {
      id: "http://activitystrea.ms/schema/1.0/deny",
      display: { "en-nz": "denied submission" },
    },
    object: {
      id: "https://www.galaxymaps.io/task/" + taskId,
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
        description: {
          "en-nz": "Student requested help for Task: " + context.mission.title,
        },
        extensions: {
          "https://www.galaxymaps.io/course/id/": context.galaxy.id,
          "https://www.galaxymaps.io/topic/id/": context.system.id,
          "https://www.galaxymaps.io/task/id/": context.mission.id,
          "https://www.galaxymaps.io/person/id/": actor.id,
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
      definition: {
        description: {
          "en-nz": "Logged in",
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
      description: {
        "en-nz": "Logged off",
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

/* ----------------------
  QUERY xAPI STATEMENTS
------------------------- */

export const queryXAPIStatement = (payloadObj) => {
  console.log("sending search xAPI query...");
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

export const advancedQueryXAPIStatement = (payloadObj) => {
  console.log("sending advanced xAPI query...");
  // post advanced query
  fetch("https://galaxymaps.lrs.io/xapi/statements/aggregate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify(payloadObj),
  })
    .then((result) => result.json())
    .catch((error) => console.error(error.message))
    .then((res) => console.log("res:", res));
};

export const getStudentsCoursesXAPIQuery = async (person) => {
  // console.log("querying students course records from LRS...");
  const aggregationQuery = [
    {
      $match: {
        "statement.context.contextActivities.grouping.id": {
          $parseRegex: { regex: "course" },
        },
        "statement.actor.mbox": {
          $parseRegex: { regex: person.email },
        },
      },
    },
    {
      $group: {
        _id: {
          course: "$statement.context.contextActivities.grouping.id",
          actor: "$statement.actor.mbox",
        },
        statements: {
          $push: {
            verb: "$statement.verb",
            timestamp: "$statement.timestamp",
            context: "$statement.object.definition.name.en-nz",
            description: "$statement.object.definition.description.en-nz",
            topic: "$statement.context.contextActivities.parent.id",
            task: "$statement.object.id",
          },
        },
      },
    },
  ];

  return await fetch("https://galaxymaps.lrs.io/xapi/statements/aggregate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify(aggregationQuery),
  })
    .then((res) => res.json())
    .catch((error) => console.error(error.message))
    .then((res) => {
      const courses = sanitiseCourseDataFromLRS(res);
      return courses;
    });
};

export const getActiveTaskXAPIQuery = async (person) => {
  // console.log("querying LRS for students active tasks...");
  const aggregationQuery = [
    // only for this person
    {
      $match: {
        "statement.actor.mbox": {
          $parseRegex: { regex: person.email },
        },
      },
    },
    // sort by ascending
    {
      $sort: {
        "statement.timestamp": 1,
      },
    },
    // group by actor, course and task. pushing statements
    {
      $group: {
        _id: {
          actor: "$statement.actor.mbox",
          course:
            "$statement.object.definition.extensions.https://www.galaxymaps.io/course/id/",
          task: "$statement.object.definition.extensions.https://www.galaxymaps.io/task/id/",
        },
        lastStatement: {
          $last: {
            verb: "$statement.verb.display.en-nz",
            timestamp: "$statement.timestamp",
            description: "$statement.object.definition.description.en-nz",
            task: "$statement.object.definition.extensions.https://www.galaxymaps.io/task/id/",
            topic:
              "$statement.object.definition.extensions.https://www.galaxymaps.io/topic/id/",
          },
        },
      },
    },
    //filter started
    {
      $match: {
        "lastStatement.verb": "started",
      },
    },
    // group just by course
    {
      $group: {
        _id: {
          actor: "$_id.actor",
          course: "$_id.course",
        },
        lastStatement: {
          $last: {
            verb: "$lastStatement.verb",
            timestamp: "$lastStatement.timestamp",
            description: "$lastStatement.description",
            task: "$lastStatement.task",
            topic: "$lastStatement.topic",
          },
        },
      },
    },
  ];

  return await fetch("https://galaxymaps.lrs.io/xapi/statements/aggregate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify(aggregationQuery),
  })
    .then((res) => res.json())
    .catch((error) => console.error(error.message))
    .then((res) => {
      // console.log("getActiveTaskXAPIQuery: res => ", res);
      return res;
      // return sanitiseCourseDataFromLRS(res)
    });
};

export const getActivityLogXAPIQuery = async (person) => {
  // console.log("querying LRS for students active tasks...");
  const aggregationQuery = [
    // only for this person
    {
      $match: {
        "statement.actor.mbox": {
          $parseRegex: { regex: person.email },
        },
      },
    },
    // sort by ascending
    {
      $sort: {
        "statement.timestamp": -1,
      },
    },
    // group by actor, course and task. pushing statements
    {
      $group: {
        _id: {
          actor: "$statement.actor.mbox",
        },
        statements: {
          $push: {
            verb: "$statement.verb.display.en-nz",
            timestamp: "$statement.timestamp",
            description: "$statement.object.definition.description.en-nz",
            task: "$statement.object.definition.extensions.https://www.galaxymaps.io/task/id/",
            topic:
              "$statement.object.definition.extensions.https://www.galaxymaps.io/topic/id/",
            course:
              "$statement.object.definition.extensions.https://www.galaxymaps.io/course/id/",
          },
        },
      },
    },
  ];

  return await fetch("https://galaxymaps.lrs.io/xapi/statements/aggregate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify(aggregationQuery),
  })
    .then((res) => res.json())
    .catch((error) => console.error(error.message))
    .then((res) => {
      // console.log("getActivityLogXAPIQuery: res => ", res[0].statements);
      return res[0].statements;
    });
};

export const getCohortsCourseDataXAPIQuery = async (payload) => {
  // if no data, dont bother
  if (!payload.studentsArr || !payload.coursesArr) return;

  // convert studentIds to mailto:email string
  const personIdsArrToEmailsArr = [];
  for (const studentId of payload.studentsArr) {
    const studentSnapshot = await db.collection("people").doc(studentId).get();
    personIdsArrToEmailsArr.push("mailto:" + studentSnapshot.data().email);
  }

  // convert courseIds to courseId strings
  const courseIdsAsStrings = [];
  for (const courseId of payload.coursesArr) {
    courseIdsAsStrings.push(String(courseId));
  }

  const aggregationQuery = [
    // match with cohorts courses. and only started & completed statements
    {
      $match: {
        "statement.object.definition.extensions.https://www.galaxymaps.io/course/id/":
          { $in: courseIdsAsStrings },
        "statement.verb.display.en-nz": { $in: ["started", "completed"] },
      },
    },
    // group by actor & course
    {
      $group: {
        _id: {
          actor: "$statement.actor.mbox",
          course:
            "$statement.object.definition.extensions.https://www.galaxymaps.io/course/id/",
        },
        statements: {
          $push: {
            verb: "$statement.verb.display.en-nz",
            timestamp: "$statement.timestamp",
            description: "$statement.object.definition.description.en-nz",
            task: "$statement.object.definition.extensions.https://www.galaxymaps.io/task/id/",
            topic:
              "$statement.object.definition.extensions.https://www.galaxymaps.io/topic/id/",
          },
        },
      },
    },
    // filter these by cohorts students
    {
      $match: {
        "_id.actor": { $in: personIdsArrToEmailsArr },
      },
    },
    // group by course. nesting actor and their statements
    {
      $group: {
        _id: {
          course: "$_id.course",
        },
        actors: {
          $push: {
            actor: "$_id.actor",
            statements: "$statements",
          },
        },
      },
    },
  ];

  return await fetch("https://galaxymaps.lrs.io/xapi/statements/aggregate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify(aggregationQuery),
  })
    .then((res) => res.json())
    .catch((error) => console.error(error.message))
    .then((res) => {
      return sanitiseCohortsCourseDataFromLRS(res);
    });
};

export const getStudentsTimeDataXAPIQuery = async (payload) => {
  // if no data, dont bother
  if (!payload.studentsArr) return;

  // convert studentIds to mailto:email string
  const personIdsArrToEmailsArr = [];
  for (const studentId of payload.studentsArr) {
    const studentSnapshot = await db.collection("people").doc(studentId).get();
    personIdsArrToEmailsArr.push("mailto:" + studentSnapshot.data().email);
  }

  const aggregationQuery = [
    // match with cohorts courses. and only started & completed statements
    {
      $match: {
        "statement.actor.mbox": { $in: personIdsArrToEmailsArr },
        // "statement.verb.display.en-nz": "logged in" ,
        "statement.verb.display.en-nz": { $in: ["logged in", "logged out"] },
      },
    },
    // group by actor & course
    {
      $group: {
        _id: {
          actor: "$statement.actor.mbox",
        },
        activity: {
          $push: {
            verb: "$statement.verb.display.en-nz",
            timestamp: "$statement.timestamp",
          },
        },
      },
    },
  ];

  return await fetch("https://galaxymaps.lrs.io/xapi/statements/aggregate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify(aggregationQuery),
  })
    .then((res) => res.json())
    .catch((error) => console.error(error.message))
    .then((res) => {
      // console.log("Activity status for Students in Cohort:", res);
      return sanitiseCohortsActivityDataFromLRS(res);
    });
};

// export const VQLXAPIQuery = async () => {
//   const VQLQuery = [
//     {
//       filter: {
//         "actor.id": "mailto:waipuna@gmail.com",
//       },
//       process: [{}],
//     },
//   ];

//   return await fetch("https://galaxymaps.lrs.io/xapi/statements/analyze", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: auth,
//     },
//     body: JSON.stringify(VQLQuery),
//   })
//     .then((res) => res.json())
//     .catch((error) => console.error(error.message))
//     .then((res) => {
//       console.log("res:", res);
//     });
// };

//============ SANITISE FUNCTIONS

async function sanitiseCourseDataFromLRS(res) {
  const sanitisedCourses = [];

  let taskCompletedCount = 0;
  let topicCompletedCount = 0;

  for (const group of res) {
    const course = await courseIRIToCourseId(group);

    // sanitise statements data
    const activities = group.statements.map((statement, index) => {
      if (statement.description.includes("Completed Task:"))
        taskCompletedCount++;
      if (statement.description.includes("Completed Topic:"))
        topicCompletedCount++;

      let [action, title] = statement.description.split(": ");
      let [status, type] = action.split(" ");
      let id = statement.task.split("/").pop();

      const newStatement = {
        timeStamp: statement.timestamp,
        index,
        status,
        type,
        title,
        id,
        context: statement.context,
      };
      return newStatement;
    });

    const courseObj = {
      course,
      activities: activities.reverse(),
      taskCompletedCount,
      topicCompletedCount,
    };

    sanitisedCourses.push(courseObj);
  }
  return sanitisedCourses;
}
async function sanitiseCohortsCourseDataFromLRS(res) {
  const sanitisedCourses = [];

  // group = course
  for (const group of res) {
    // get course
    const courseId = group._id.course;
    const course = await getCourseById(courseId);

    // array for many students course data
    const students = [];
    // (for getCohortsCourseDataXAPIQuery) statements are nested under actors
    for (const student of group.actors) {
      // get person from db
      const email = student.actor.split(":")[1];
      const person = await getStudentByEmail(email);

      let taskCompletedCount = 0;
      let topicCompletedCount = 0;

      const activities = student.statements.map((statement, index) => {
        if (statement.description.includes("Completed Task:"))
          taskCompletedCount++;
        if (statement.description.includes("Completed Topic:"))
          topicCompletedCount++;

        let [action, title] = statement.description.split(": ");
        let [status, type] = action.split(" ");
        let id = statement.task;

        const newStatement = {
          timeStamp: statement.timestamp,
          index,
          status,
          type,
          title,
          id,
        };
        return newStatement;
      });

      // individual student course data (in loop)
      const studentObj = {
        activities: activities.reverse(),
        taskCompletedCount,

        person: person,
      };
      // push individual student data to students array
      students.push(studentObj);
    }
    // courses have many students data (of the cohort)
    const courseObj = {
      course,
      students: students,
    };
    sanitisedCourses.push(courseObj);
  }

  return sanitisedCourses;
}

async function sanitiseCohortsActivityDataFromLRS(res) {
  const santisedActivity = [];

  for (const student of res) {
    // get person from db
    const email = student._id.actor.split(":")[1];
    const person = await getStudentByEmail(email);

    const personDaysActivity = [];
    const day = 0;
    const newStatement = {
      dayISOTimestamp: "",
      minutesActiveTotal: 0,
    };
    // loop activities
    for (const [index, statement] of student.activity.entries()) {
      if (!statement.timestamp || !statement.verb) continue;
      // get date to compare
      const dayISOTimestamp = statement.timestamp.split("T")[0];
      const newTimestamp = DateTime.fromISO(statement.timestamp);
      const newDay = newTimestamp.get("day");
      //same day
      if (day == newDay) {
        const prevStatement = student.activity[index - 1];
        // if (!prevStatement) continue
        // console.log("prevStatement", prevStatement);
        // console.log("statement", statement);
        if (
          statement.verb == "logged out" &&
          prevStatement.verb == "logged in"
        ) {
          // calc off - on
          const timeLoggedOff = DateTime.fromISO(statement.timestamp);
          const timeLoggedOn = DateTime.fromISO(prevStatement.timestamp);
          const diff = timeLoggedOff.diff(timeLoggedOn).as("minutes");
          // add to days totals
          newStatement.minutesActiveTotal += diff;
        }
      }
      // set new day
      if (day !== newDay) {
        day = newDay;
      }
      // check if last activity for that day. if it is save time totals for the day.
      const nextDay = 0;
      const nextStatement = student.activity[index + 1];
      if (!nextStatement) {
        nextDay = day + 1; // if there is no nextStatement... just increment to save last days statements
      } else {
        nextDay = DateTime.fromISO(nextStatement.timestamp).get("day");
      }
      if (nextDay > day) {
        // save previous day totals
        newStatement.dayISOTimestamp = dayISOTimestamp;
        personDaysActivity.push(newStatement);
        // reset newStatement object
        newStatement = {
          dayISOTimestamp: "",
          minutesActiveTotal: 0,
        };
      }
    } // end persons statments
    const studentActivity = {
      person: person,
      activity: personDaysActivity,
    };
    santisedActivity.push(studentActivity);
  } // end person
  return santisedActivity;
}

async function courseIRIToCourseId(course) {
  // get course id from iri
  const courseIRI = course._id.course[0];
  const courseId = courseIRI.split("/course/")[1];
  // get course name
  const courseContext = await getCourseById(courseId);
  return courseContext;
}
