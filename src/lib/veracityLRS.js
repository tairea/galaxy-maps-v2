const auth = "Basic " + btoa(import.meta.env.VITE_VERACITY_LRS_SECRET);

/* ----------------------
  SEND xAPI STATEMENTS
------------------------- */

// ========== Start Galaxy
export const startGalaxyXAPIStatement = (actor, context) => {
  // console.log("sending student xAPI statement... galaxy started...");
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

  return fetch("https://galaxymaps.lrs.io/xapi/statements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify(statement),
  });
};

// ========== Start Topic =========
export const startTopicXAPIStatement = (actor, context) => {
  // console.log("sending student xAPI statement... topic started...");
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
          "en-nz": "Course: " + context.galaxy.title + " > Topic: " + context.system.label,
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

  return fetch("https://galaxymaps.lrs.io/xapi/statements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify(statement),
  });
};

// ========== Start Task (make task active)
export const startTaskXAPIStatement = (actor, taskId, context) => {
  // console.log("sending student xAPI statement... task started...");
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

  return fetch("https://galaxymaps.lrs.io/xapi/statements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify(statement),
  });
};

// ========== Submit work for review (by student)
export const submitWorkForReviewXAPIStatement = (actor, taskId, context) => {
  // console.log("sending student xAPI statement... submitted work for review...");
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
          "en-nz": "Work submitted for Task: " + context.mission.title,
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

  return fetch("https://galaxymaps.lrs.io/xapi/statements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify(statement),
  });
};
export const reSubmitWorkForReviewXAPIStatement = (actor, taskId, context) => {
  // console.log("sending student xAPI statement... re-submitted work for review...");
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

  return fetch("https://galaxymaps.lrs.io/xapi/statements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify(statement),
  });
};

// ========== Task Marked as Completed (by student)
export const taskMarkedAsCompletedXAPIStatement = (actor, taskId, context) => {
  // console.log("sending student xAPI statement... task marked as completed...");
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

  return fetch("https://galaxymaps.lrs.io/xapi/statements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify(statement),
  });
};

// ========== Topic Completed (by student)
export const topicCompletedXAPIStatement = (actor, topicId, context) => {
  // console.log("sending student xAPI statement... topic completed...");
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
          "en-nz": "Course: " + context.galaxy.title + " > Topic: " + context.system.label,
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

  return fetch("https://galaxymaps.lrs.io/xapi/statements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify(statement),
  });
};

// ========== Student work marked completed (by teacher)
export const studentWorkMarkedCompletedXAPIStatement = (actor, taskId, context) => {
  // console.log("sending student xAPI statement... work marked as completed...");
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

  return fetch("https://galaxymaps.lrs.io/xapi/statements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify(statement),
  });
};

// ========== Teacher reviewed student work (by teacher)
export const teacherReviewedStudentWorkXAPIStatement = (actor, taskId, context) => {
  // console.log("sending student xAPI statement... work marked as completed...");
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
          "en-nz":
            "Teacher marked: " +
            context.mission.title +
            "for " +
            context.student.firstName +
            " " +
            context.student.lastName,
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

  return fetch("https://galaxymaps.lrs.io/xapi/statements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify(statement),
  });
};

// ========== Teacher responed to request for help (by teacher)
export const teacherRespondedToRequestForHelpXAPIStatement = (actor, taskId, context) => {
  // console.log("sending student xAPI statement... teacher responsed to request for help...");
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
          "en-nz": "Teacher responded to help for Task: " + context.mission.title,
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

  return fetch("https://galaxymaps.lrs.io/xapi/statements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify(statement),
  });
};

// ========== Request for help (by student)
export const studentRequestForHelpXAPIStatement = (actor, taskId, context) => {
  // console.log("sending student xAPI statement... student requesting help...");
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

  return fetch("https://galaxymaps.lrs.io/xapi/statements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify(statement),
  });
};
export const teacherRespondedSubmissionDeclinedXAPIStatement = (actor, taskId, context) => {
  // console.log("sending student xAPI statement... teacher declined submission...");
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
          "en-nz":
            "Work declined for: " +
            context.mission.title +
            "for: " +
            context.student.firstName +
            " " +
            context.student.lastName,
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

  return fetch("https://galaxymaps.lrs.io/xapi/statements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify(statement),
  });
};

// ========== Students goes online
export const studentOnlineXAPIStatement = (actor) => {
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

  return fetch("https://galaxymaps.lrs.io/xapi/statements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify(statement),
  });
};

// ========== Students goes offline
export const studentOfflineXAPIStatement = (actor) => {
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

  return fetch("https://galaxymaps.lrs.io/xapi/statements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify(statement),
  });
};

// loggedIntoGalaxyXAPIStatement
// ========== Students opens galaxy
export const loggedIntoGalaxyXAPIStatement = (payload) => {
  // if no data, dont bother
  if (!payload.galaxyId || !payload.actor) return;

  // console.log("sending student xAPI statement... student signed into galaxy: " + payload.galaxyId);
  const statement = {
    actor: {
      name: payload.actor.firstName + " " + payload.actor.lastName,
      mbox: "mailto:" + payload.actor.email,
    },
    verb: {
      id: "https://brindlewaye.com/xAPITerms/verbs/loggedin/",
      display: { "en-nz": "logged in to Galaxy" },
    },
    object: {
      id: "https://www.galaxymaps.io/isonGalaxy/" + payload.galaxyId + "/" + new Date(),
      definition: {
        description: {
          "en-nz": "Logged in",
        },
        extensions: {
          "https://www.galaxymaps.io/course/id/": payload.galaxyId,
          "https://www.galaxymaps.io/person/id/": payload.actor.id,
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

  return fetch("https://galaxymaps.lrs.io/xapi/statements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify(statement),
  });
};

// ========== AI Conversation Completed
export const aiConversationCompletedXAPIStatement = (actor, context) => {
  // console.log("sending student xAPI statement... AI conversation completed...");
  if (!actor || !context) return;

  const activeMission = context.activeMission || null;
  const missionId = activeMission?.id || activeMission?.missionId || null;
  const missionTitle = activeMission?.title || "No active mission";

  // Log context data for verification
  console.log("📊 AI Conversation xAPI Statement - Context Data:", {
    student: {
      id: actor.id,
      name: actor.firstName + " " + actor.lastName,
      email: actor.email,
    },
    startedTimestamp: context.startedTimestamp,
    endedTimestamp: context.endedTimestamp,
    durationSeconds: context.durationSeconds,
    durationFormatted: `${Math.floor(context.durationSeconds / 60)}m ${context.durationSeconds % 60}s`,
    model: context.model || "gpt-realtime",
    course: context.galaxy
      ? {
          id: context.galaxy.id,
          title: context.galaxy.title,
        }
      : null,
    topic: context.system
      ? {
          id: context.system.id,
          label: context.system.label,
        }
      : null,
    task: activeMission
      ? {
          id: missionId,
          title: missionTitle,
        }
      : null,
  });

  const statement = {
    actor: {
      name: actor.firstName + " " + actor.lastName,
      mbox: "mailto:" + actor.email,
    },
    verb: {
      id: "http://adlnet.gov/expapi/verbs/interacted",
      display: { "en-nz": "interacted" },
    },
    object: {
      id: "https://www.galaxymaps.io/ai-conversation/" + new Date().toISOString(),
      definition: {
        name: {
          "en-nz": "AI Conversation: " + (context.model || "gpt-realtime"),
        },
        description: {
          "en-nz": `Completed AI conversation using ${context.model || "gpt-realtime"} model`,
        },
        extensions: {
          "https://www.galaxymaps.io/course/id/": context.galaxy?.id || "",
          "https://www.galaxymaps.io/topic/id/": context.system?.id || "",
          "https://www.galaxymaps.io/task/id/": missionId || "",
          "https://www.galaxymaps.io/person/id/": actor.id,
          "https://www.galaxymaps.io/ai-conversation/started/": context.startedTimestamp || "",
          "https://www.galaxymaps.io/ai-conversation/duration/": context.durationSeconds || 0,
          "https://www.galaxymaps.io/ai-conversation/model/": context.model || "gpt-realtime",
        },
      },
    },
    context: {
      contextActivities: {
        parent: missionId
          ? [
              {
                id: "https://www.galaxymaps.io/task/" + missionId,
                objectType: "Activity",
              },
            ]
          : [],
        grouping: [
          {
            id: "https://www.galaxymaps.io/topic/" + (context.system?.id || ""),
            objectType: "Activity",
          },
          {
            id: "https://www.galaxymaps.io/course/" + (context.galaxy?.id || ""),
            objectType: "Activity",
          },
        ],
      },
    },
    timestamp: context.endedTimestamp || new Date().toISOString(),
  };

  return fetch("https://galaxymaps.lrs.io/xapi/statements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify(statement),
  })
    .then((response) => {
      if (response.ok) {
        console.log("✅ AI Conversation xAPI Statement sent successfully", {
          duration: context.durationSeconds,
          durationFormatted: `${Math.floor(context.durationSeconds / 60)}m ${context.durationSeconds % 60}s`,
          model: context.model || "gpt-realtime",
          courseId: context.galaxy?.id || "N/A",
          topicId: context.system?.id || "N/A",
          taskId: missionId || "N/A",
        });
      } else {
        console.error(
          "❌ Failed to send AI conversation xAPI statement:",
          response.status,
          response.statusText,
        );
      }
      return response;
    })
    .catch((error) => {
      console.error("❌ Error sending AI conversation xAPI statement:", error);
      throw error;
    });
};

// ========== Delete student's statements from LRS by email and courseId
export const deleteStudentsCourseXAPIStatements = (email, courseId) => {
  const query = `
  DELETE FROM statements
  WHERE actor.id = 'mailto:${email}'
  AND object.definition.extensions['https://www.galaxymaps.io/course/id/'] LIKE '${courseId}'
`;

  // const query2 = `
  //   DELETE FROM statements
  //   WHERE actor.id = "mailto:${email}"
  //   AND object.definition.extensions[https://www.galaxymaps.io/course/id/] LIKE "https://www.galaxymaps.io/course/${courseId}"
  // `;

  fetch("https://galaxymaps.lrs.io/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth, // The auth token you've set up
    },
    body: JSON.stringify({ query }),
  });
};
