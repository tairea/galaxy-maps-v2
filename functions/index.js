const admin = require("firebase-admin");
const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
require("dotenv").config();

const {
  studentOnlineXAPIStatement,
  studentOfflineXAPIStatement,
  startGalaxyXAPIStatement,
} = require("./veracityLRS");

admin.initializeApp();

const firestore = admin.firestore();

// upgrade someones account to admin
exports.addAdminRole = functions.https.onCall((uid, context) => {
  // check request is made by an admin
  if (context.auth.token.admin !== true) {
    return { error: "Only admins can add other admins" };
  }
  // get user and add admin custom claim
  return admin
    .auth()
    .getUser(uid)
    .then((user) => {
      return admin.auth().setCustomUserClaims(user.uid, {
        admin: true,
      });
    })
    .then((data) => {
      return {
        message: `Success! ${data} has been made an admin.`,
      };
    })
    .catch((err) => {
      return {
        error: `something went wrong ${err}`,
      };
    });
});

// Create new user
exports.createUser = functions.https.onCall((data, context) => {
  // check request is made by an admin

  return admin
    .auth()
    .createUser(data)
    .then((data) => {
      return data;
    })
    .catch((err) => {
      return err;
    });
});

// Generate a magic email link
exports.generateEmailLink = functions.https.onCall((data, context) => {
  // set magic link parameters
  const actionCodeSettings = {
    url: data.host + "/email_signin",
    handleCodeInApp: true,
  };

  return admin
    .auth()
    .generateSignInWithEmailLink(data.email, actionCodeSettings)
    .then((link) => {
      functions.logger.log("link successfully created:", link);
      return link;
    })
    .catch((error) => {
      functions.logger.log("error creating link:", error);
      return error;
    });
});

// CUSTOM INVITE EMAIL
// Configure the email transport using the default SMTP transport and a GMail account.
// For Gmail, enable these:
// 1. https://www.google.com/settings/security/lesssecureapps
// 2. https://accounts.google.com/DisplayUnlockCaptcha
// For other types of transports such as Sendgrid see https://nodemailer.com/transports/

// TODO: Configure the `gmail.email` and `gmail.password` Google Cloud environment variables.
// Set the gmail.email and gmail.password Google Cloud environment variables to match the email and password of the Gmail account used to send emails (or the app password if your account has 2-step verification enabled).
// For this use: `firebase functions:config:set gmail.email="myusername@gmail.com" gmail.password="secretpassword"`

const APP_NAME = "Galaxy Maps";
const gmailEmail = functions.config().gmail.email;
const gmailPassword = functions.config().gmail.password;
const mailTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

//====== GM APP INVITE EMAIL ==================
exports.sendInviteEmail = functions.https.onCall((data, context) => {
  const { email, displayName, link, inviter, accountType } = data;

  if (accountType == "teacher") {
    return sendTeacherInviteEmail(email, displayName, link);
  } else return sendStudentInviteEmail(email, displayName, link, inviter);
});

// Sends an invite email to a new teacher.
async function sendTeacherInviteEmail(email, displayName, link) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@galaxymaps.io>`,
    to: email,
  };

  // The user subscribed to the newsletter.
  mailOptions.subject = `Account created for ${APP_NAME}!`;
  mailOptions.text = `Hi ${displayName || ""}

Your teacher account has been created for ${APP_NAME}. 
Please click this link to sign into your account and setup your profile

${link}
  
If you have any issues please contact base@galaxymaps.io
  
Galaxy Maps Team`;
  await mailTransport.sendMail(mailOptions);
  functions.logger.log("New teacher invite email sent to: ", email);
  return null;
}

// ========== NEW STUDENT ACCOUNT CREATED EMAIL ===========
async function sendStudentInviteEmail(email, displayName, link, inviter) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@galaxymaps.io>`,
    to: email,
  };

  // The user subscribed to the newsletter.
  mailOptions.subject = `Account created for ${APP_NAME}!`;
  mailOptions.text = `Hi ${displayName || ""}

Your teacher ${inviter}, has created you an account for ${APP_NAME}. 

Please click this link to sign into your account and setup your profile

${link}

If you have any issues please contact base@galaxymaps.io
  
Galaxy Maps Team`;
  await mailTransport.sendMail(mailOptions);
  functions.logger.log("New student invite email sent to: ", email);
  return null;
}

//======COHORT REGISTRATION NOTIFICATION==================
exports.sendNewCohortEmail = functions.https.onCall((data, context) => {
  const { email, displayName, firstName, inviter, cohort } = data;
  return sendNewCohortEmail(
    email,
    displayName,
    firstName,
    inviter,
    cohort
  );
});

// Sends an invite email to a new teacher.
async function sendNewCohortEmail(
  email,
  displayName,
  firstName,
  inviter,
  cohort
) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@galaxymaps.io>`,
    to: email,
  };

  // The user subscribed to the newsletter.
  mailOptions.subject = `New cohort registration`;
  mailOptions.text = `Hi ${displayName || firstName || ""}

You have been added to cohort: ${cohort} ${inviter ? "by " + inviter : ""} 

Sign into your Galaxy Maps account to view your new cohort.

https://galaxymaps.io
  
If you have any issues please contact base@galaxymaps.io
  
Galaxy Maps Team`;
  await mailTransport.sendMail(mailOptions);
  functions.logger.log("New cohort invite email sent to: ", email);
  return null;
}

//======COURSE REGISTRATION NOTIFICATION==================
exports.sendNewCourseEmail = functions.https.onCall((data, context) => {
  const { email, name, course } = data;
  sendNewCourseEmail(email, name, course);
});

// Sends a invite email to a new student.
async function sendNewCourseEmail(email, name, course) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@galaxymaps.io>`,
    to: email,
  };

  // The user subscribed to the newsletter.
  mailOptions.subject = `New Galaxy Assignment`;
  mailOptions.text = `Greetings Explorer

You have been assigned to ${course} Galaxy Map. 

Sign into your Galaxy Maps account to view your new course.

https://galaxymaps.io
  
If you have any issues please contact base@galaxymaps.io
  
Galaxy Maps Team`;
  await mailTransport.sendMail(mailOptions);
  functions.logger.log("New assignment email sent to: ", email);
  return null;
}

//======COURSE SUBMISSION NOTIFICATION==================
exports.sendNewSubmissionEmail = functions.https.onCall((data, context) => {
  const { author, title } = data;
  sendNewSubmissionEmail(author, title);
});

// Sends a invite email to a new student.
async function sendNewSubmissionEmail(author, title) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@galaxymaps.io>`,
    to: `[jamin.tairea@gmail.com, ian@tairea.io]`,
  };

  // The user subscribed to the newsletter.
  mailOptions.subject = `New Galaxy Submission`;
  mailOptions.text = `Hi Team, 

${author} has submitted an new course called ${title}

Navigate to https://galaxymaps.io to approve the submission
  
Galaxy Maps Team`;
  await mailTransport.sendMail(mailOptions);
  functions.logger.log("New course submission email sent to admin");
  return null;
}

//======COURSE PUBLISHED NOTIFICATION==================
exports.sendCoursePublishedEmail = functions.https.onCall((data, context) => {
  const { email, name, course } = data;
  sendCoursePublishedEmail(email, name, course);
});

// Sends a invite email to a new student.
async function sendCoursePublishedEmail(email, name, course) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@galaxymaps.io>`,
    to: email
  };

  // The user subscribed to the newsletter.
  mailOptions.subject = `Galaxy Published`;
  mailOptions.text = `Greetings ${name}, 

Your course ${course} has now been successfully published and a learning cohort has been created.

Navigate to https://galaxymaps.io to manage your course content and student cohort.
  
Galaxy Maps Team`;
  await mailTransport.sendMail(mailOptions);
  functions.logger.log("Course published email sent to ", email);
  return null;
}

//  ============ PRESENCE SYSTEM SYNC ============
// Watch realtime DB for changes and trigger function on change
exports.onUserStatusChanged = functions.database
  .ref("/status/{uid}")
  .onUpdate(async (change, context) => {

    // Get the data written to Realtime Database
    const eventStatus = change.after.val();
    functions.logger.log("=====eventStatus=====: ", eventStatus)

    // get the doc from the firestore DB
    const userStatusFirestoreRef = firestore.doc(
      `status/${context.params.uid}`
    );

    // It is likely that the Realtime Database change that triggered
    // this event has already been overwritten by a fast change in
    // online / offline status, so we'll re-read the current data
    // and compare the timestamps.
    const statusSnapshot = await change.after.ref.once("value");
    const status = statusSnapshot.val();
    // If the current timestamp for this data is newer than
    // the data that triggered this event, we exit this function.
    if (status.last_changed > eventStatus.last_changed) {
      return null;
    }

    // Otherwise, we convert the last_changed field to a Date
    eventStatus.last_changed = new Date(eventStatus.last_changed);
    let person = await firestore
      .collection("people")
      .doc(context.params.uid)
      .get();
    person = {
      id: person.id,
      ...person.data(),
    };

    if (eventStatus.state === "online") studentOnlineXAPIStatement(person);
    if (eventStatus.state === "offline") studentOfflineXAPIStatement(person);

    // push XAPI statement here
    // ... and write it to Firestore.
    return userStatusFirestoreRef.set(eventStatus);
  });

//======REQUEST FOR HELP SENT ==================
exports.sendRequestForHelp = functions.https.onCall((data, context) => {
  const { email, teacher, course, task, student, request, topic } = data;
  sendRequestForHelp(email, teacher, course, task, student, request, topic);
});

// Sends a invite email to a new student.
async function sendRequestForHelp(email, teacher, course, task, student, request, topic) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@galaxymaps.io>`,
    to: email
  };

  // The user subscribed to the newsletter.
  mailOptions.subject = `${course} Request for help`;
  mailOptions.text = `Hi ${teacher}, 

Your student, ${student} has sent a request for help.

Course: ${course}
Topic: ${topic}
Task: ${task}

Request: ${request}

To respond to ${student}, please login to https://galaxymaps.io to view your course
  
Galaxy Maps Team`;

  mailOptions.html = `<p>Hi ${teacher},</p>
  </br> 
<p>Your student ${student} has sent a request for help.</p>
</br> 
<ul>
  <li>Course: ${course}</li>
  <li>Topic: ${topic}</li>
  <li>Task: ${task}</li>
</ul>
</br> 
<p>Request: <strong>${request}</strong> </p>
</br> 
<p>To respond to ${student}, please login to <a href="https://galaxymaps.io" target="_blank">https://galaxymaps.io/login</a> to view your course</p>
</br> 
<p style="color: #69a1e2; font-family: 'Genos', sans-serif; font-size: 20px; letter-spacing: 5px;">Galaxy Maps Team</p>`;
  await mailTransport.sendMail(mailOptions);
  functions.logger.log("Request notification email sent to ", email);
  return null;
}

//====== RESPONSE TO REQUEST ==================
exports.sendResponseToHelp = functions.https.onCall((data, context) => {
  const { email, teacher, course, task, student, response, topic, request } = data;
  sendResponseToHelp(email, teacher, course, task, student, response, topic, request);
});

// Sends a invite email to a new student.
async function sendResponseToHelp(email, teacher, course, task, student, response, topic, request) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@galaxymaps.io>`,
    to: email
  };

  // The user subscribed to the newsletter.
  mailOptions.subject = `${course} Response to your request`;
  mailOptions.text = `Hi ${student}, 

Your instructor ${teacher} has sent a response to your request for help.

Course: ${course}
Topic: ${topic}
Task: ${task}

Your request: ${request}

Instructors response: ${response} 

Login to https://galaxymaps.io to continue your course.
  
Galaxy Maps Team`;

  mailOptions.html = `<p>Hi ${student},</p>
  </br> 
<p>Your instructor ${teacher} has sent a response to your request for help.</p>
</br> 
<ul>
  <li>Course: ${course}</li>
  <li>Topic: ${topic}</li>
  <li>Task: ${task}</li>
</ul>
</br> 
<p>Your request: ${request} </p>
</br> 
<p>Instructors response: <strong>${response}</strong></p>
</br> 
<p>Login to <a href="https://galaxymaps.io" target="_blank">https://galaxymaps.io/login</a> to continue your course.</p>
</br> 
<p style="color: #69a1e2; font-family: 'Genos', sans-serif; font-size: 20px; letter-spacing: 5px;">Galaxy Maps Team</p>`;
  await mailTransport.sendMail(mailOptions);
  functions.logger.log("Instructor response sent to ", email);
  return null;
}

//======SUBMISSION FOR TASK SENT ==================
exports.sendTaskSubmission = functions.https.onCall((data, context) => {
  const { email, teacher, course, task, student, submission, topic, submissionInstructions } = data;
  sendTaskSubmission(email, teacher, course, task, student, submission, topic);
});

// Sends a invite email to a new student.
async function sendTaskSubmission(email, teacher, course, task, student, submission, topic, submissionInstructions) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@galaxymaps.io>`,
    to: email
  };

  // The user subscribed to the newsletter.
  mailOptions.subject = `${task} work submission`;
  mailOptions.text = `Hi ${teacher}, 

Your student, ${student} has submitted work for you review.

Course: ${course}
Topic: ${topic}
Task: ${task}

Your Submission Instructions: ${submissionInstructions}

Student's Submission Response: ${submission}

To respond to ${student}'s submission and unlock the next task from them, please login to https://galaxymaps.io to view your course
  
Galaxy Maps Team`;

  mailOptions.html = `<p>Hi ${teacher},</p>
  </br> 
<p>Your student ${student} has submitted work for you review.</p>
</br> 
<ul>
  <li>Course: ${course}</li>
  <li>Topic: ${topic}</li>
  <li>Task: ${task}</li>
</ul>
</br> 
<p>Submission: <strong>${submission}</strong> </p>
</br> 
<p>To respond to ${student}, please login to <a href="https://galaxymaps.io" target="_blank">https://galaxymaps.io/login</a> to view your course</p>
</br> 
<p style="color: #69a1e2; font-family: 'Genos', sans-serif; font-size: 20px; letter-spacing: 5px;">Galaxy Maps Team</p>`;
  await mailTransport.sendMail(mailOptions);
  functions.logger.log("Task submission notification email sent to ", email);
  return null;
}

//====== RESPONSE TO REQUEST ==================
exports.sendResponseToSubmission = functions.https.onCall((data, context) => {
  const { email, teacher, course, task, student, outcome, topic, message, submission } = data;
  sendResponseToSubmission(email, teacher, course, task, student, outcome, topic, message, submission);
});

// Sends a invite email to a new student.
async function sendResponseToSubmission(email, teacher, course, task, student, outcome, topic, message, submission) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@galaxymaps.io>`,
    to: email
  };

  // The user subscribed to the newsletter.
  mailOptions.subject = `Task submission ${outcome}`;
  mailOptions.text = `Hi ${student}, 

Your instructor ${teacher} has reviewed your submission to ${task}.

Course: ${course}
Topic: ${topic}
Task: ${task}

Your submission: ${submission} 

Submission outcome: ${outcome} 

Instructors message: ${message}

Login to https://galaxymaps.io to continue your course.
  
Galaxy Maps Team`;

  mailOptions.html = `<p><strong>Hi ${student},</strong></p>
<p>Your instructor ${teacher} has reviewed your submission to ${task}.</p>
</br> 
<ul>
  <li>Course: ${course}</li>
  <li>Topic: ${topic}</li>
  <li>Task: ${task}</li>
</ul>
</br> 
<p><strong>Submission outcome: ${outcome} </strong></p>
</br> 
<p>Your Submission: ${submission} </p>
</br> 
<p>Instructors message: ${message} </p>
</br> 
<p>Login to <a href="https://galaxymaps.io" target="_blank">https://galaxymaps.io/login</a> to continue your course.</p>
</br> 
<p style="color: #69a1e2; font-family: 'Genos', sans-serif; font-size: 20px; letter-spacing: 5px;">Galaxy Maps Team</p>`;
  await mailTransport.sendMail(mailOptions);
  functions.logger.log("Submission outcome sent to ", email);
  return null;
}


//====== SCHEDULE CHECK FOR INACTIVITY  ==================
function getPreviousDate(preDays) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - preDays).toDateString();
};

async function getPersonByIdFromDB(personId) {
  let person = await firestore
    .collection("people")
    .doc(personId)
    .get()
    .catch((err) => console.err(err));
  person = {
    id: person.id,
    ...person.data(),
  };
  return person;
};

async function getPersonsTeachers(person) {
  // onSnapshot wasnt working for me. so changed to .get()
  let teachers = await firestore
    .collection("cohorts")
    .where("students", "array-contains", person.id)
    .get()
    .then(async (querySnapshot) => {
      let teachers = [];
      querySnapshot.forEach(async (doc) => {
        doc.data().teachers.forEach(teacher => {
          let profile = {
            id: teacher,
            cohort: doc.data().name
          }
          teachers.push(profile)
        })
      })

      return teachers
    }).catch(err => console.log('err: ', err))

  return teachers
};

exports.scheduledFunction = functions.pubsub.schedule('0 8 * * *').timeZone('Pacific/Auckland').onRun((context) => {
  // exports.scheduledFunction = functions.pubsub.schedule('every 2 minutes').onRun((context) => {
  checkInActvity()
});

async function checkInActvity() {
  functions.logger.log('checking activity')

  const oneWeek = getPreviousDate(7);
  const twoWeeks = getPreviousDate(14);

  const userStatus = {}
  await firestore
    .collection("status")
    .get()
    .then((snapShot) => {
      snapShot.docs.forEach((doc) => {
        var obj = {};
        obj[doc.id] = doc.data();
        Object.assign(userStatus, obj);
      });
    })

  functions.logger.log('1 week ago: ', oneWeek)
  functions.logger.log('2 weeks ago: ', twoWeeks)

  // if user is online push into the array
  if (userStatus) {
    const users = []
    for (const user in userStatus) {
      if (userStatus[user].state == 'offline') users.push(Object.assign(userStatus[user], { id: user }));
    }

    const inActiveOneWeek = []
    const inActiveTwoWeeks = []

    users.forEach(user => {
      const date = user.last_changed.toDate().toDateString()
      if (date === oneWeek) inActiveOneWeek.push(user)
      if (date === twoWeeks) inActiveTwoWeeks.push(user)
    })

    if (inActiveOneWeek.length) {
      inActiveOneWeek.forEach(async user => {
        const person = await getPersonByIdFromDB(user.id)
        const teachers = await getPersonsTeachers(user)

        const student = person.firstName + ' ' + person.lastName
        const studentEmail = person.email
        const duration = 'one week'

        functions.logger.log('send one week in active email to student :', person.email)
        sendStudentInActive(student, studentEmail, duration)

        const teacherProfiles = await Promise.all(teachers.map(async teacher => {
          let fullProfile = await getPersonByIdFromDB(teacher.id)
          return {
            ...fullProfile,
            cohort: teacher.cohort
          }
        }))

        teacherProfiles.forEach(profile => {
          const { email, cohort } = profile
          const teacher = profile.firstName + ' ' + profile.lastName
          sendTeacherStudentInActive(student, studentEmail, duration, email, cohort, teacher)
        })

      })
    }

    if (inActiveTwoWeeks.length) {
      inActiveTwoWeeks.forEach(async user => {
        const person = await getPersonByIdFromDB(user.id)
        const teachers = await getPersonsTeachers(user)

        const student = person.firstName + ' ' + person.lastName
        const studentEmail = person.email
        const duration = 'two weeks'

        functions.logger.log('send two weeks in active email to student :', person.email)
        sendStudentInActive(student, studentEmail, duration)

        const teacherProfiles = await Promise.all(teachers.map(async teacher => {
          let fullProfile = await getPersonByIdFromDB(teacher.id)
          return {
            ...fullProfile,
            cohort: teacher.cohort
          }
        }))
        teacherProfiles.forEach(profile => {
          const { email, cohort } = profile
          const teacher = profile.firstName + ' ' + profile.lastName
          sendTeacherStudentInActive(student, studentEmail, duration, email, cohort, teacher)
        })
      })
    }
  }
};


async function sendStudentInActive(student, studentEmail, duration) {
  // send email to student 
  const mailOptions = {
    from: `${APP_NAME} <noreply@galaxymaps.io>`,
    to: studentEmail
  };

  // The user subscribed to the newsletter.
  mailOptions.subject = `Student Activity Alert`;
  mailOptions.text = `Hi ${student}, 

It has been ${duration} since you last signed into Galaxy Maps. 

Sign in to https://galaxymaps.io now to continue your learning journey.
  
Galaxy Maps Team`;

  mailOptions.html = `<p><strong>Hi ${student},</strong></p>
<p>It has been <strong>${duration}</strong> since you last signed into Galaxy Maps.</p>
</br> 
<p>Sign in to <a href="https://galaxymaps.io" target="_blank">https://galaxymaps.io/login</a> now to continue your learning journey.</p>
</br> 
<p style="color: #69a1e2; font-family: 'Genos', sans-serif; font-size: 20px; letter-spacing: 5px;">Galaxy Maps Team</p>`;
  await mailTransport.sendMail(mailOptions);
  functions.logger.log("student low activity alert sent", email);
  return null;

}

async function sendTeacherStudentInActive(student, studentEmail, duration, email, cohort, teacher) {
  // send email to student 
  const mailOptions = {
    from: `${APP_NAME} <noreply@galaxymaps.io>`,
    to: email
  };

  // The user subscribed to the newsletter.
  mailOptions.subject = `Student Activity Alert`;
  mailOptions.text = `Hi ${teacher}, 
  
  It has been ${duration} since your student: ${student} in cohort: ${cohort} last signed into Galaxy Maps. 
  
  We recommend checking in on them via email ${studentEmail} to encourage and support them on their learning journey.
    
  Galaxy Maps Team`;

  mailOptions.html = `<p><strong>Hi ${teacher},</strong></p>
  <p>It has been <strong>${duration}</strong> since your student: <strong>${student}</strong> in cohort: <strong>${cohort}</strong> last signed into Galaxy Maps.</p>
  </br> 
  <p>  We recommend checking in on them via email <a href="mailto:${studentEmail}">${studentEmail}</a> to encourage and support them on their learning journey.</p>
  </br> 
  <p style="color: #69a1e2; font-family: 'Genos', sans-serif; font-size: 20px; letter-spacing: 5px;">Galaxy Maps Team</p>`;
  await mailTransport.sendMail(mailOptions);
  functions.logger.log("student low activity alert sent to teacher", email);
  return null;
}

//====== ACTIVE COURSE DELETED ==================
exports.sendCourseDeleted = functions.https.onCall((data, context) => {
  const { email, teacher, course, student, teacherEmail } = data;
  sendCourseDeleted(email, teacher, course, student, teacherEmail);
});

// Sends a invite email to a new student.
async function sendCourseDeleted(email, teacher, course, student, teacherEmail) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@galaxymaps.io>`,
    to: email
  };

  // The user subscribed to the newsletter.
  mailOptions.subject = `Galaxy Deleted`;
  mailOptions.text = `Hi ${student || ''}, 

Your instructor ${teacher} has deleted the Galaxy ${course}.

If you have any questions or concerns about this please contact your instructor by email at ${teacherEmail}
  
Galaxy Maps Team`;

  mailOptions.html = `<p><strong>Hi ${student},</strong></p>
<p>Your instructor ${teacher} has deleted the Galaxy ${course}.</p>
</br> 
<p>If you have any questions or concerns about this please contact your instructor by email at <a href="mailto:${teacherEmail}">${teacherEmail}</a></p>
</br> 
<p style="color: #69a1e2; font-family: 'Genos', sans-serif; font-size: 20px; letter-spacing: 5px;">Galaxy Maps Team</p>`;
  await mailTransport.sendMail(mailOptions);
  functions.logger.log("Galaxy deleted email sent to ", email);
  return null;
}

//====== ASSIGN TOPICS AND TASKS ==================
exports.assignTopicsAndTasksToMe = functions.https.onCall((data, context) => {
  if (context.auth == null) {
    return { error: "Must be authenticated to access this endpoint" };
  }
  const { courseId } = data;
  const personId = context.auth.uid;
  return assignTopicsAndTasksToStudent(personId, courseId);
});

exports.assignTopicsAndTasksToStudent = functions.https.onCall((data, context) => {
  if (context.auth == null) {
    return { error: "Must be authenticated to access this endpoint" };
  }
  // TODO: add permissions checks to see if current authenticated user has permission to
  // add topics and tasks to the specified personId
  const { personId, courseId } = data;
  return assignTopicsAndTasksToStudent(personId, courseId);
});

/**
 * Add this galaxy metadata (eg. topics) to this persons course database
 * @param personId {string}
 * @param courseId {string}
 */
async function assignTopicsAndTasksToStudent(personId, courseId) {
  // Load person and course from their IDs
  const [personSnapshot, courseSnapshot] = await Promise.all([
    firestore.collection("people").doc(personId).get(),
    firestore.collection("courses").doc(courseId).get()
  ]);
  const person = personSnapshot.data();
  const course = courseSnapshot.data();

  if (person == null) {
    return { error: `Person not found: ${personId}` };
  }

  if (course == null) {
    return { error: `Course not found: ${courseId}` };
  }

  // 1) get topics in this course
  const querySnapshot = await firestore
    .collection("courses")
    .doc(course.id)
    .collection("topics")
    .orderBy("topicCreatedTimestamp")
    .get();

  // 2) add them to person (this will store their TOPIC progression data for this course )
  for (const [index, doc] of querySnapshot.docs.entries()) {
    await firestore
      .collection("people")
      .doc(person.id)
      .collection(course.id)
      .doc(doc.data().id)
      .set({
        ...doc.data(),
        topicStatus:
          doc.data().group == "introduction" ? "introduction" : "locked", // set the status of topics to locked unless they are introduction nodes
      });

    // 3) check if this topic has tasks
    const subquerySnapshot = await firestore
      .collection("courses")
      .doc(course.id)
      .collection("topics")
      .doc(doc.data().id)
      .collection("tasks")
      // order by timestamp is important otherwise index == 0 (in the next step) wont necessarily be the first mission
      .orderBy("taskCreatedTimestamp")
      .get();

    // 4) if tasks exist. add them to person
    for (const [index, subDoc] of subquerySnapshot.docs.entries()) {
      // cool lil status to show whats happening during loading
      // this.startingGalaxyStatus = "...adding " + subDoc.data().title;

      if (subDoc.exists) {
        await firestore
          .collection("people")
          .doc(person.id)
          .collection(course.id)
          .doc(doc.data().id)
          .collection("tasks")
          .doc(subDoc.id)
          .set({
            ...subDoc.data(),
            // set the status of topics to locked unless they are the first mission (index == 0)
            taskStatus: index == 0 ? "unlocked" : "locked",
          });
      }
    }
  }
  // Send Galaxy Started statment to LRS
  startGalaxyXAPIStatement(person, { galaxy: course });

  return { message: 'Completed' };
}

