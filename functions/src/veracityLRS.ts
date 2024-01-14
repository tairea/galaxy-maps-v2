import { DocumentReference } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";
import fetch from "node-fetch";
import { db } from "./_shared.js";

export const VERACITY_LRS_SECRET = defineSecret("veracity_lrs_secret");

const btoa = (text: string) => {
  return Buffer.from(text, "binary").toString("base64");
};

const generateAuthHeader = () => "Basic " + btoa(`${VERACITY_LRS_SECRET.value()}`);

// ========== Students goes online
export const studentOnlineXAPIStatement = (actor: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}) => {
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
      Authorization: generateAuthHeader(),
    },
    body: JSON.stringify(statement),
  }).catch((error) => console.error(error.message));
};

// ========== Students goes offline
export const studentOfflineXAPIStatement = (actor: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}) => {
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
      Authorization: generateAuthHeader(),
    },
    body: JSON.stringify(statement),
  }).catch((error) => console.error(error.message));
};

// ========== Start Task (make task active)
export const startGalaxyXAPIStatement = (
  actor: { id: string; firstName: string; lastName: string; email: string },
  context: { galaxy: { id: string; title: string } },
) => {
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
      Authorization: generateAuthHeader(),
    },
    body: JSON.stringify(statement),
  }).catch((error) => console.error(error.message));
};

/* ----------------------
  QUERY xAPI STATEMENTS
------------------------- */

export const getCohortsCourseDataXAPIQuery = async (cohortId: string) => {
  const cohortDoc = await db.collection("cohorts").doc(cohortId).get();
  const cohortData = cohortDoc.data();

  if (!cohortData) {
    throw new Error("Cohort not found");
  }

  // Used for caching person data
  const personMapByEmail = new Map<
    string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Record<string, any> & {
      id: string;
    }
  >();

  // convert studentIds to mailto:email string
  const personDocs = await Promise.all(
    cohortData.students.map((studentId: string) => db.collection("people").doc(studentId).get()),
  );
  for (const personDoc of personDocs) {
    const personData = personDoc.data();
    if (personData == null) {
      continue;
    }
    personMapByEmail.set(personData.email, { ...personData, id: personDoc.id });
  }
  const personEmails = Array.from(personMapByEmail.keys());

  // convert courseIds to courseId strings
  const courseIds = cohortData.courses as string[];

  const aggregationQuery = [
    // match with cohorts courses. and only started & completed statements
    {
      $match: {
        "statement.object.definition.extensions.https://www.galaxymaps.io/course/id/": {
          $in: courseIds,
        },
        "statement.verb.display.en-nz": { $in: ["started", "completed"] },
      },
    },
    // group by actor & course
    {
      $group: {
        _id: {
          actor: "$statement.actor.mbox",
          course: "$statement.object.definition.extensions.https://www.galaxymaps.io/course/id/",
        },
        statements: {
          $push: {
            verb: "$statement.verb.display.en-nz",
            timestamp: "$statement.timestamp",
            description: "$statement.object.definition.description.en-nz",
            task: "$statement.object.definition.extensions.https://www.galaxymaps.io/task/id/",
            topic: "$statement.object.definition.extensions.https://www.galaxymaps.io/topic/id/",
          },
        },
      },
    },
    // filter these by cohorts students
    {
      $match: {
        "_id.actor": { $in: personEmails.map((email) => `mailto:${email}`) },
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

  const res = await fetch("https://galaxymaps.lrs.io/xapi/statements/aggregate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: generateAuthHeader(),
    },
    body: JSON.stringify(aggregationQuery),
  });
  const resultBody = (await res.json()) as {
    _id: { course: string };
    actors: {
      actor: string;
      statements: {
        verb: string;
        timestamp: string;
        description: string;
        topic?: string;
        task?: string;
      }[];
    }[];
  }[];

  const sanitisedCourses = [];
  // group = course
  for (const group of resultBody) {
    // get course
    const courseId = group._id.course;
    const courseDoc = await db.collection("courses").doc(courseId).get();
    const courseData = courseDoc.data();

    if (courseData == null) {
      // TODO: if the course doesn't exist, should we skip or should we return dummy data?
      continue;
    }

    const course = {
      ...courseData,
      owner:
        courseData.owner instanceof DocumentReference ? courseData.owner.path : courseData.owner,
      id: courseDoc.id,
    };

    // array for many students course data
    const students = [];

    // (for getCohortsCourseDataXAPIQuery) statements are nested under actors
    for (const student of group.actors) {
      const email = student.actor.replace("mailto:", "");
      const person = personMapByEmail.get(email)!;
      if (person == null) {
        // TODO: if the person is missing, should we skip or use dummy data?
        continue;
      }

      let taskCompletedCount = 0;
      let topicCompletedCount = 0;

      const activities = student.statements.map((statement, index) => {
        if (statement.description.includes("Completed Task:")) taskCompletedCount++;
        if (statement.description.includes("Completed Topic:")) topicCompletedCount++;

        const [action, title] = statement.description.split(": ");
        const [status, type] = action.split(" ");
        const id = statement.task;

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
        topicCompletedCount,
        person,
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
};
