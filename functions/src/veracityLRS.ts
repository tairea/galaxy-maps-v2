import { DocumentReference } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";
import { DateTime } from "luxon";
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

// ========== Start Galaxy
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

// ========== Stop Galaxy
export const stopGalaxyXAPIStatement = (
  actor: { id: string; firstName: string; lastName: string; email: string },
  context: { galaxy: { id: string; title: string } },
) => {
  console.log("sending student xAPI statement... galaxy stopped...");
  const statement = {
    actor: {
      name: actor.firstName + " " + actor.lastName,
      mbox: "mailto:" + actor.email,
    },
    verb: {
      id: "https://w3id.org/xapi/dod-isd/verbs/stopped",
      display: { "en-nz": "stopped" },
    },
    object: {
      id: "https://www.galaxymaps.io/course/" + context.galaxy.id,
      definition: {
        name: {
          "en-nz": "Course: " + context.galaxy.title,
        },
        description: {
          "en-nz": "Stopped Course: " + context.galaxy.title,
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

export const getStudentActivityLogXAPIQuery = async (personId: string) => {
  const personDoc = await db.collection("people").doc(personId).get();
  const personData = personDoc.data();

  if (!personData) {
    throw new Error("Person not found");
  }

  // console.log("querying LRS for students active tasks...");
  const aggregationQuery = [
    // only for this person
    {
      $match: {
        "statement.actor.mbox": `mailto:${personData.email}`,
      },
    },
    // sort by ascending
    {
      $sort: {
        "statement.timestamp": -1,
      },
    },
    // group by actor. pushing statements
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
            topic: "$statement.object.definition.extensions.https://www.galaxymaps.io/topic/id/",
            course: "$statement.object.definition.extensions.https://www.galaxymaps.io/course/id/",
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
    _id: {
      actor: string;
    };
    statements: {
      verb: string;
      timestamp: string;
      description: string;
      task: string;
      topic: string;
      course: string;
    }[];
  }[];

  return resultBody[0]?.statements ?? [];
};

// Get students course time data from LRS
export const getStudentCoursesTimeDataXAPIQuery = async (
  personId: string,
  startAt: string,
  endAt: string,
) => {
  const personDoc = await db.collection("people").doc(personId).get();
  const personData = personDoc.data();

  if (!personData) {
    throw new Error("Person not found");
  }

  const aggregationQuery = [
    {
      $match: {
        "statement.actor.mbox": `mailto:${personData.email}`,
        // match a persons statements with verbs "logged in to Galaxy" or "logged out"
        "statement.verb.display.en-nz": { $in: ["logged in to Galaxy", "logged out"] },
        $and: [
          { "statement.timestamp": { $gte: { $parseDate: { date: startAt } } } },
          { "statement.timestamp": { $lte: { $parseDate: { date: endAt } } } },
        ],
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
            course: "$statement.object.definition.extensions.https://www.galaxymaps.io/course/id/",
            person: "$statement.object.definition.extensions.https://www.galaxymaps.io/person/id/",
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
    _id: {
      actor: string;
    };
    activity: {
      verb: string;
      timestamp: string;
      course?: string;
      person: string;
    }[];
  }[];

  const startAtDateTime = DateTime.fromISO(startAt);
  const endAtDateTime = DateTime.fromISO(endAt);

  const courseTimes = new Map<string, number>();
  let currentData: { courseId: string; loginTimestamp: DateTime } | null = null;

  if (resultBody.length === 0) {
    return [];
  }

  for (const statement of resultBody[0].activity) {
    const timestamp = DateTime.fromISO(statement.timestamp);

    // Check if the statement outside timeframe. if it is. skip/continue
    if (timestamp < startAtDateTime || timestamp > endAtDateTime) {
      continue;
    }

    // think code calcs the time spent on each galaxy/course (thanks copilot)
    if (statement.verb === "logged in to Galaxy") {
      const courseId = statement.course!;

      if (currentData != null) {
        const timeSpent = timestamp.diff(currentData.loginTimestamp, "hours").hours;
        courseTimes.set(
          currentData.courseId,
          (courseTimes.get(currentData.courseId) ?? 0) + timeSpent,
        );
      }
      currentData = { courseId, loginTimestamp: timestamp };
    } else if (statement.verb === "logged out" && currentData != null) {
      const timeSpent = timestamp.diff(currentData.loginTimestamp, "hours").hours;
      courseTimes.set(
        currentData.courseId,
        (courseTimes.get(currentData.courseId) ?? 0) + timeSpent,
      );
      currentData = null;
    }
  }

  const courseHours = [];
  for (const [courseId, hours] of courseTimes) {
    // get course
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

    courseHours.push({
      course,
      hours,
    });
  }

  return courseHours;
};

export const getStudentCoursesDataXAPIQuery = async (personId: string) => {
  const personDoc = await db.collection("people").doc(personId).get();
  const personData = personDoc.data();

  if (!personData) {
    throw new Error("Person not found");
  }

  const aggregationQuery = [
    {
      $match: {
        "statement.actor.mbox": `mailto:${personData.email}`,
        "statement.context.contextActivities.grouping.id": {
          $parseRegex: { regex: "course" },
        },
      },
    },
    {
      $group: {
        _id: {
          actor: "$statement.actor.mbox",
          course: "$statement.object.definition.extensions.https://www.galaxymaps.io/course/id/",
        },
        statements: {
          $push: {
            verb: "$statement.verb",
            timestamp: "$statement.timestamp",
            context: "$statement.object.definition.name.en-nz",
            description: "$statement.object.definition.description.en-nz",
            topic: "$statement.object.definition.extensions.https://www.galaxymaps.io/topic/id/",
            task: "$statement.object.definition.extensions.https://www.galaxymaps.io/task/id/",
            course: "$statement.object.definition.extensions.https://www.galaxymaps.io/course/id/",
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
    _id: {
      actor: string;
      course: string;
    };
    statements: {
      verb: string;
      timestamp: string;
      context: string;
      description: string;
      topic: string;
      task: string;
      course: string;
    }[];
  }[];

  const sanitisedCourses = [];

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

    let taskCompletedCount = 0;
    let topicCompletedCount = 0;

    // sanitise statements data
    const activities = group.statements.map((statement, index) => {
      const [action, title] = statement.description.split(": ");
      const [status, type] = action.split(" ");

      console.log("Statement:", statement);

      const newStatement = {
        timeStamp: statement.timestamp,
        index,
        status,
        type,
        title,
        id: "",
        // id: statement.task,
        // id: statement.topic,
        context: statement.context,
      };

      if (statement.description.includes("Completed Task:")) {
        taskCompletedCount++;
        newStatement.id = statement.task;
      }
      if (statement.description.includes("Completed Topic:")) {
        topicCompletedCount++;
        newStatement.id = statement.topic;
      }
      // check if description includes "task", "topic" or "course" then assign id accordingly
      if (statement.description.includes("Task")) {
        newStatement.id = statement.task;
      } else if (statement.description.includes("Topic")) {
        newStatement.id = statement.topic;
      } else if (statement.description.includes("Course")) {
        newStatement.id = statement.course;
      }

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
};

export const getCohortCoursesDataXAPIQuery = async (cohortId: string) => {
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

  const courseDocs = await Promise.all(
    (cohortData.courses as string[]).map((courseId: string) =>
      db.collection("courses").doc(courseId).get(),
    ),
  );

  const courses = courseDocs
    .filter((courseDoc) => courseDoc.exists)
    .map((courseDoc) => {
      const courseData = courseDoc.data()!;
      return {
        ...courseData,
        owner:
          courseData.owner instanceof DocumentReference ? courseData.owner.path : courseData.owner,
        id: courseDoc.id,
      };
    });

  const aggregationQuery = [
    // match with cohorts courses. and only started & completed statements
    {
      $match: {
        "statement.object.definition.extensions.https://www.galaxymaps.io/course/id/": {
          $in: courses.map((course) => course.id),
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
  for (const course of courses) {
    const foundCourseData = resultBody.find((data) => data._id.course === course.id);

    // array for many students course data
    const students = [];

    // statements are nested under actors
    for (const [email, person] of personMapByEmail) {
      const foundCourseStudentData = foundCourseData?.actors.find(
        (actor) => actor.actor === `mailto:${email}`,
      );

      if (foundCourseStudentData == null) {
        students.push({
          activities: [],
          taskCompletedCount: 0,
          topicCompletedCount: 0,
          person,
        });
        continue;
      }

      let taskCompletedCount = 0;
      let topicCompletedCount = 0;

      const activities = foundCourseStudentData.statements.map((statement, index) => {
        if (statement.description.includes("Completed Task:")) taskCompletedCount++;
        if (statement.description.includes("Completed Topic:")) topicCompletedCount++;

        const [action, title] = statement.description.split(": ");
        // Todo: this split works for "Started Topic" but NOT "Work declined"
        // maybe only query topic and task statements ?
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

export const getCohortStudentsTimeDataXAPIQuery = async (cohortId: string) => {
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

  const aggregationQuery = [
    // match with cohorts courses. and only started & completed statements
    {
      $match: {
        "statement.actor.mbox": { $in: personEmails.map((email) => `mailto:${email}`) },
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

  const res = await fetch("https://galaxymaps.lrs.io/xapi/statements/aggregate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: generateAuthHeader(),
    },
    body: JSON.stringify(aggregationQuery),
  });
  const resultBody = (await res.json()) as {
    _id: {
      actor: string;
    };
    activity: {
      verb: string;
      timestamp: string;
    }[];
  }[];

  const santisedActivity = [];

  for (const [email, person] of personMapByEmail) {
    const foundStudentData = resultBody.find((data) => data._id.actor === `mailto:${email}`);

    if (foundStudentData == null) {
      const studentActivity = {
        person: person,
        activity: [],
      };
      santisedActivity.push(studentActivity);
      continue;
    }

    const personDaysActivity = [];
    let day = 0;
    let minutesActiveTotal = 0;
    // loop activities
    for (const [index, statement] of foundStudentData.activity.entries()) {
      if (!statement.timestamp || !statement.verb) {
        continue;
      }
      // get date to compare
      const dayISOTimestamp = statement.timestamp.split("T")[0];
      const newTimestamp = DateTime.fromISO(statement.timestamp);
      const newDay = newTimestamp.get("day");
      // same day
      if (day == newDay) {
        const prevStatement = foundStudentData.activity[index - 1];
        // if (!prevStatement) continue
        // console.log("prevStatement", prevStatement);
        // console.log("statement", statement);
        if (statement.verb == "logged out" && prevStatement.verb == "logged in") {
          // calc off - on
          const timeLoggedOff = DateTime.fromISO(statement.timestamp);
          const timeLoggedOn = DateTime.fromISO(prevStatement.timestamp);
          const diff = timeLoggedOff.diff(timeLoggedOn).as("minutes");
          // add to days totals
          minutesActiveTotal += diff;
        }
      }
      // set new day
      if (day !== newDay) {
        day = newDay;
      }
      // check if last activity for that day. if it is save time totals for the day.
      let nextDay = 0;
      const nextStatement = foundStudentData.activity[index + 1];
      if (!nextStatement) {
        // if there is no nextStatement... just increment to save last days statements
        nextDay = day + 1;
      } else {
        nextDay = DateTime.fromISO(nextStatement.timestamp).get("day");
      }
      if (nextDay > day) {
        // save previous day totals
        personDaysActivity.push({ dayISOTimestamp, minutesActiveTotal });

        // reset minutesActiveTotal
        minutesActiveTotal = 0;
      }
    } // end persons statments
    const studentActivity = {
      person: person,
      activity: personDaysActivity,
    };
    santisedActivity.push(studentActivity);
  } // end person

  return santisedActivity;
};
