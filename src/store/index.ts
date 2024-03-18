import { db } from "@/store/firestoreConfig";
import { defineStore } from "pinia";
import { piniafireMutations, firestoreAction } from "@/piniafire/index";
import firebase from "firebase/compat/app";
import { collection, query, where } from "firebase/firestore";

const getDefaultState = () => {
  return {
    from: "",
    user: {
      loggedIn: false,
      data: null as Record<string, any> | null,
    },
    person: {} as Record<string, any>,
    topics: [] as Record<string, any>[],
    cohorts: [] as Record<string, any>[],
    courses: [] as Record<string, any>[],
    assignedCourses: [] as Record<string, any>[],
    organisations: [] as Record<string, any>[],
    people: [] as Record<string, any>[],
    currentTopicId: "",
    currentTaskId: "",
    currentCohortId: "",
    currentCourseId: "",
    currentCourseNodes: [] as Record<string, any>[],
    currentCourseEdges: [] as Record<string, any>[],
    allTasks: [] as Record<string, any>[],
    personsCourses: [] as Record<string, any>[],
    personsTopics: [] as Record<string, any>[],
    topicsTasks: [] as Record<string, any>[],
    personsTopicsTasks: [] as Record<string, any>[],
    requestsForHelp: [] as Record<string, any>[],
    courseSubmissions: [] as Record<string, any>[],
    teachersRequestsForHelp: [] as Record<string, any>[],
    teachersStudentsProgress: [] as Record<string, any>[],
    darkMode: true,
    studentCourseDataFromLRS: [] as Record<string, any>[],
    snackbar: {} as Record<string, any>,
    userStatus: {} as Record<string, any>,
    studentsActiveTasks: [] as Record<string, any>[],
    studentsActivityLog: [] as Record<string, any>[],
    showPanelCard: {} as Record<string, any>,
    studentsSubmissions: [] as Record<string, any>[],
    peopleInCourse: [] as Record<string, any>[],
    personsCourseTasks: [] as Record<string, any>[],
    courseTasks: [] as Record<string, any>[],
    topicCompleted: {} as Record<string, any>,
    nextTopicUnlockedFlag: false,
  };
};

export default defineStore({
  id: "root",
  state: getDefaultState,
  getters: {
    getCoursesByWhoMadeThem: (state) => (personId: string) => {
      return state.courses.filter((course) => course.mappedBy.personId == personId);
    },
    getTopicById: (state) => (id: string) => {
      const topic = state.topics.find((topic) => topic.id === id);
      return topic;
    },
    getPersonsTopicById: (state) => (id: string) => {
      const topic = state.personsTopics.find((topic) => topic.id === id);
      return topic;
    },
    getOrganisationById: (state) => (id: string) => {
      return state.organisations.find((organisation) => organisation.id === id);
    },
    getTasksByTopicId: (state) => (topicId: string) => {
      const topic = state.topics.find((topic) => topic.id === topicId);
      return topic?.tasks ?? [];
    },
    getPersonsTasksByTopicId: (state) => (id: string) => {
      const topic = state.personsTopics.find((topic) => topic.id === id);
      return topic?.tasks ?? [];
    },
    getStudentsByCohortId: (state) => (id: string) => {
      //go to cohorts, and check if they in courses with this id
      const peopleInCohort: Record<string, any>[] = [];
      state.people.forEach((person) => {
        if (person.assignedCohorts) {
          // if student is assigned in this cohort...
          if (person.assignedCohorts.some((cohortId: string) => cohortId === id)) {
            // push them into array
            peopleInCohort.push(person);
          }
        }
      });
      return peopleInCohort;
    },
    getUnansweredRequestsForHelp: (state) => {
      return state.teachersRequestsForHelp.filter(
        (request) => request.requestForHelpStatus == "unanswered",
      );
    },
  },
  actions: {
    ...piniafireMutations,
    SET_USER(data: { loggedIn: boolean; data: Record<string, any> | null }) {
      this.user = data;
    },
    SET_PERSON(data: Record<string, any>) {
      this.person = data;
    },
    set_from(data: string) {
      this.from = data;
    },
    resetTeachersSubmissions() {
      this.courseSubmissions = [];
    },
    setPanelCard(data: Record<string, any>) {
      this.showPanelCard = data;
    },
    setCurrentCourseId(courseId: string) {
      if (courseId === this.currentCourseId) return;
      // new course, so reset tasks
      this.personsCourseTasks = [];
      this.courseTasks = [];
      this.currentCourseId = courseId;
    },
    setCurrentTopicId(topicId: string) {
      this.currentTopicId = topicId;
    },
    setCurrentTaskId(taskId: string) {
      this.currentTaskId = taskId;
    },
    setCurrentCohortId(cohortId: string) {
      this.currentCohortId = cohortId;
    },

    setCohorts(cohorts: Record<string, any>[]) {
      this.cohorts = cohorts;
    },
    setOrganisations(orgs: Record<string, any>[]) {
      this.organisations = orgs;
    },
    setDarkMode(dark: boolean) {
      this.darkMode = dark;
    },
    setStudentCourseDataFromLRS(courseData: Record<string, any>[]) {
      this.studentCourseDataFromLRS = courseData;
    },
    setStudentsActiveTasks(activeTasksArr: Record<string, any>[]) {
      this.studentsActiveTasks = activeTasksArr;
    },
    setStudentsActivityLog(activityStatements: Record<string, any>[]) {
      this.studentsActivityLog = activityStatements;
    },
    setSnackbar(snackbar: { show: boolean; text: string; color?: string }) {
      this.snackbar = snackbar;
    },
    setPeopleInCourse(people: Record<string, any>[]) {
      this.peopleInCourse = people;
    },
    setUserStatus(userStatus: Record<string, any>) {
      this.userStatus = userStatus;
    },
    setUser(user: Record<string, any>) {
      if (user) {
        this.SET_USER({
          loggedIn: true,
          data: {
            admin: user.admin,
            displayName: user.displayName,
            email: user.email,
            verified: user.emailVerified,
            id: user.uid,
          },
        });
      } else {
        this.SET_USER({
          loggedIn: false,
          data: null,
        });
      }
    },
    setTopicCompleted(topic: { completed: boolean; topicId: Record<string, any> | null }) {
      this.topicCompleted = topic;
    },
    setNextTopicUnlocked(flag: boolean) {
      console.log("next topic unlocked - flag triggered: ", flag);
      this.nextTopicUnlockedFlag = flag;
    },
    // ===== Firestore - BIND ALL
    bindCourses: firestoreAction(
      (
        { bindFirestoreRef },
        payload: { owner: firebase.firestore.DocumentReference | string | null },
      ) => {
        const firebaseQuery =
          payload.owner != null
            ? db.collection("courses").where("mappedBy.personId", "==", payload.owner)
            : db.collection("courses").where("status", "==", "published");

        // web modular api query test: (where(status==published) OR (where(owner==person) AND where(status==private)))
        // firebase docs says can use 'and' and 'or' but it seems to not work
        // const coursesRef = collection(db, "courses");
        // const q = query(
        //   coursesRef,
        //   and(
        //     where("status", "==", "published"),
        //     or(where("mappedBy.personId", "==", payload.owner), where("status", "==", "private")),
        //   ),
        // );

        return bindFirestoreRef("courses", firebaseQuery, {
          maxRefDepth: 0,
          reset: false,
        });
      },
    ),
    bindAllPeople: firestoreAction(({ bindFirestoreRef }) => {
      return bindFirestoreRef("people", db.collection("people"));
    }),
    bindCourseNodes: firestoreAction(({ bindFirestoreRef }, id: string) => {
      return bindFirestoreRef(
        "currentCourseNodes",
        db.collection("courses").doc(id).collection("map-nodes"),
        {
          reset: false,
        },
      );
    }),
    bindCourseEdges: firestoreAction(({ bindFirestoreRef }, id: string) => {
      return bindFirestoreRef(
        "currentCourseEdges",
        db.collection("courses").doc(id).collection("map-edges"),
        {
          reset: false,
        },
      );
    }),
    bindCourseTopics: firestoreAction(({ bindFirestoreRef }, id: string) => {
      return bindFirestoreRef("topics", db.collection("courses").doc(id).collection("topics"));
    }),
    bindCoursesByPersonId: firestoreAction(({ bindFirestoreRef }, personId: string) => {
      return bindFirestoreRef(
        "personsCourses",
        db.collection("courses").where("mappedBy.personId", "==", personId),
      );
    }),
    bindThisPersonsCourseTopics: firestoreAction(
      ({ bindFirestoreRef }, payload: { personId: string; courseId: string }) => {
        return bindFirestoreRef(
          "personsTopics",
          db.collection("people").doc(payload.personId).collection(payload.courseId),
        );
      },
    ),
    // bind persons tasks by topic id
    bindPersonsTasksByTopicId: firestoreAction(
      ({ bindFirestoreRef }, payload: { personId: string; courseId: string; topicId: string }) => {
        console.log("getting persons tasks: ", payload);

        return bindFirestoreRef(
          "personsTopicsTasks",
          db
            .collection("people")
            .doc(payload.personId)
            .collection(payload.courseId)
            .doc(payload.topicId)
            .collection("tasks")
            .orderBy("taskCreatedTimestamp"),
        );
      },
    ),
    bindTasksByTopicId: firestoreAction(
      ({ bindFirestoreRef }, payload: { courseId: string; topicId: string }) => {
        return bindFirestoreRef(
          "topicsTasks",
          db
            .collection("courses")
            .doc(payload.courseId)
            .collection("topics")
            .doc(payload.topicId)
            .collection("tasks")
            .orderBy("taskCreatedTimestamp"), // this is important to ordering the tasks in MissionList.vue
        );
      },
    ),
    async getPersonsCourseTasks() {
      const tasksPerTopic = await Promise.all(
        this.personsTopics
          .filter((topic: Record<string, any>) => topic.topicStatus !== "locked")
          .map(async (topic: Record<string, any>) => {
            const tasks = await db
              .collection("people")
              .doc(this.person.id)
              .collection(this.currentCourseId)
              .doc(topic.id)
              .collection("tasks")
              .get();
            return tasks.docs.map((task) => ({
              topicId: topic.id,
              task: task.data(),
            }));
          }),
      );

      const tasksArr = tasksPerTopic.flat();
      // console.log("tasksArr", tasksArr)
      this.personsCourseTasks = tasksArr;
    },
    async getCourseTasks() {
      const tasksPerTopic = await Promise.all(
        this.currentCourseNodes.map(async (topic: Record<string, any>) => {
          const tasks = await db
            .collection("courses")
            .doc(this.currentCourseId)
            .collection("topics")
            .doc(topic.id)
            .collection("tasks")
            .get();
          return tasks.docs.map((task) => ({
            topicId: topic.id,
            task: task.data(),
          }));
        }),
      );

      const tasksArr = tasksPerTopic.flat();
      // console.log("tasksArr", tasksArr)
      this.courseTasks = tasksArr;
    },

    async deleteCourseFromPerson(personId: string, courseId: string) {
      // delete course from persons assignedCourses
      const person = db.collection("people").doc(personId);
      await person.update({
        assignedCourses: firebase.firestore.FieldValue.arrayRemove(courseId),
      });
    },

    // ===== Firestore - BIND by USER
    async getPersonById(id: string) {
      if (id) {
        await db
          .collection("people")
          .doc(id)
          .onSnapshot((doc) => {
            // console.log("person updated");
            const person = {
              id,
              ...doc.data(),
            };
            this.SET_PERSON(person);
          });
      } else {
        this.SET_PERSON({});
      }
    },
    async getAllSubmittedWorkByCourseId(courseId: string) {
      // get all work for review
      const unsubscribe = db
        .collection("courses")
        .doc(courseId)
        .collection("submissionsForReview")
        // .where("taskSubmissionStatus", "==", "inreview")
        .orderBy("taskSubmittedForReviewTimestamp")
        // .orderBy("requestSubmittedTimestamp")
        .onSnapshot((querySnapshot) => {
          const allWorkForReview = [...this.courseSubmissions];

          for (const change of querySnapshot.docChanges()) {
            if (change.type === "added") {
              if (allWorkForReview.some((submission) => submission.id === change.doc.id)) return;
              allWorkForReview.push({
                id: change.doc.id,
                ...change.doc.data(),
              });
            } else if (change.type === "modified") {
              allWorkForReview.splice(
                allWorkForReview.findIndex((i) => i.id === change.doc.id),
                1,
                {
                  id: change.doc.id,
                  ...change.doc.data(),
                },
              );
            } else if (change.type === "removed") {
              allWorkForReview.splice(
                allWorkForReview.findIndex((i) => i.id === change.doc.id),
                1,
              );
            }
          }
          this.courseSubmissions = allWorkForReview;
        });

      return unsubscribe;
      // this.courseSubmissions = allWorkForReview;
    },

    async getCohortsByPersonId(person: { id?: string }) {
      const teacherCohorts = [];
      const studentCohorts = [];

      // onSnapshot wasnt working for me. so changed to .get()
      const studentQuerySnapShot = await db
        .collection("cohorts")
        .where("students", "array-contains", person.id ?? "")
        .get();
      const teacherQuerySnapShot = await db
        .collection("cohorts")
        .where("teachers", "array-contains", person.id ?? "")
        .get();

      for (const cohort of studentQuerySnapShot.docs) {
        studentCohorts.push({
          id: cohort.id,
          student: true,
          ...cohort.data(),
        });
      }
      for (const cohort of teacherQuerySnapShot.docs) {
        teacherCohorts.push({
          id: cohort.id,
          teacher: true,
          ...cohort.data(),
        });
      }

      const cohorts = [...studentCohorts, ...teacherCohorts];
      this.setCohorts(cohorts);
      if (cohorts.length) {
        await this.getOrganisationsByCohorts(cohorts);
      }
    },

    // ===== Firestore - Cohorts & Orgs
    async getOrganisationsByCohorts(cohorts: any) {
      const orgs = [];
      const querySnapShot = await db
        .collection("organisations")
        // .doc(cohort)
        .where(
          "cohorts",
          "array-contains-any",
          cohorts.map((cohort: any) => cohort.id),
        )
        .get();

      if (querySnapShot.docs.length) {
        for (const doc of querySnapShot.docs) {
          orgs.push(doc.data());
        }
      }
      this.setOrganisations(orgs);
    },

    async getRequestsForHelpByCourseId(courseId: string) {
      // get all work for review
      const unsubscribe = db
        .collection("courses")
        .doc(courseId)
        .collection("requestsForHelp")
        // .where("requestForHelpStatus", "==", "unanswered")
        // .orderBy("requestSubmittedTimestamp")
        .onSnapshot((querySnapshot) => {
          const allRequestsForHelp = [...this.teachersRequestsForHelp];
          // WTF!!!! Why does for each fix this?
          querySnapshot.docChanges().forEach((change) => {
            // for (const change of querySnapshot.docChanges()) {
            if (change.type === "added") {
              if (allRequestsForHelp.some((request) => request.id === change.doc.data().id)) return;
              allRequestsForHelp.push({
                id: change.doc.data().id,
                ...change.doc.data(),
              });
            } else if (change.type === "modified") {
              allRequestsForHelp.splice(
                allRequestsForHelp.findIndex((i) => i.id === change.doc.data().id),
                1,
                {
                  id: change.doc.data().id,
                  ...change.doc.data(),
                },
              );
            } else if (change.type === "removed") {
              allRequestsForHelp.splice(
                allRequestsForHelp.findIndex((i) => i.id === change.doc.data().id),
                1,
              );
            }
          });
          allRequestsForHelp.sort(
            (a, b) => b.requestSubmittedTimestamp.seconds - a.requestSubmittedTimestamp.seconds,
          );

          // console.log("ALL REQUESTS FOR HELP:", allRequestsForHelp);

          this.teachersRequestsForHelp = allRequestsForHelp.filter(
            (req) => req.contextCourse.id === courseId,
          );

          // console.log("this.teachersRequestsForHelp:", this.teachersRequestsForHelp);
        });

      return unsubscribe;

      // this.teachersRequestsForHelp = allRequestsForHelp;
    },

    async getAllUsersStatus() {
      const users = {};
      await db
        .collection("status")
        .get()
        .then((snapShot) => {
          snapShot.docs.forEach((doc) => {
            const obj = {} as Record<string, any>;
            obj[doc.id] = doc.data();
            Object.assign(users, obj);
          });
        })
        .then(() => {
          this.userStatus = users;
        });
    },
    // async getEachStudentsProgressForTeacher({ state, commit }) {
    //   // this method does...
    //   // 1 - get teachers courses
    //   // 2 - make an array of teachers course ids
    //   // 3 - go to database and get students assigned to any of those teachers courseIds
    //   // 4 - loop each student and for each student assigned courses that match a teachers course get all the topic and task data

    //   // get teachers courses. (returns array of course objects eg. id, title, description, image, mappedBy, contentBy)
    //   const myCourses = this.getters.getCoursesByWhoMadeThem(state.person.id);
    //   // make an array of course.id's
    //   let teachersCourseIds = myCourses.map((course) => course.id);
    //   // console.log("teachersCourseIds : ", teachersCourseIds);

    //   // search people database where assignedCourses arrayContains
    //   const studentsInTeachersCourses = [];
    //   for (const course of myCourses) {
    //     // get all work for review
    //     const querySnapshot = await db
    //       .collection("people")
    //       .where("assignedCourses", "array-contains-any", teachersCourseIds)
    //       .get();

    //     for (const doc of querySnapshot.docs) {
    //       studentsInTeachersCourses.push(doc.data());
    //     }
    //   }
    //   console.log("studentsInTeachersCourses : ", studentsInTeachersCourses);

    //   //TODO: there are duplicates of students in studentsInTeachersCourses, even though array-contains-any is supposed to be de-duped (https://firebase.google.com/docs/firestore/query-data/queries#array-contains-any)
    //   // flatten array to remove duplicate students
    //   // const flatStudents = getUniqueListBy(studentsInTeachersCourses, "email");
    //   const ids = studentsInTeachersCourses.map((o) => o.id);
    //   const flatStudents = studentsInTeachersCourses.filter(
    //     ({ id }, index) => !ids.includes(id, index + 1)
    //   );
    //   console.log("flat students", flatStudents);

    //   // allStudentProgress
    //   let allStudentProgress = [];

    //   // for each of the students, check if their assignedCourses matches teachers courses
    //   for (const student of flatStudents) {
    //     // new student. reset array
    //     let currentStudentProgress = [];

    //     for (var x = 0; x < student.assignedCourses.length; x++) {
    //       // check which assignedCourse matches with teacher
    //       for (var y = 0; y < teachersCourseIds.length; y++) {
    //         const teachersCourseId = teachersCourseIds[y];
    //         if (student.assignedCourses[x] == teachersCourseId) {
    //           // there is a match! get these tasks from db

    //           // new course. reset array
    //           let currentCourseProgress = [];
    //           // reset task count (task count is Y axes of chart. ie. line increments as you complete tasks)
    //           let taskCount = 0;

    //           const studentTaskQuerySnapshot = await db
    //             .collection("people")
    //             .doc(student.id)
    //             .collection(teachersCourseId)
    //             .get();

    //           // sort topics by topic.topicCreatedTimestamp (so that y axes: taskCount is close to being in order)
    //           let sortedTopics = studentTaskQuerySnapshot.docs.sort((a, b) =>
    //             a.data().topicCreatedTimestamp > b.data().topicCreatedTimestamp
    //               ? 1
    //               : -1
    //           );
    //           // console.log("sortedTopics: ", sortedTopics.data());

    //           for (const topic of sortedTopics) {
    //             // console.log("sorted topic: ", topic.data());
    //             // new topic. reset array
    //             let currentTopicProgress = [];

    //             // get task data for each topic
    //             const topicQuerySnapshot = await db
    //               .collection("people")
    //               .doc(student.id)
    //               .collection(teachersCourseId)
    //               .doc(topic.id)
    //               .collection("tasks")
    //               // only get tasks with completed OR inreview status
    //               .where("taskStatus", "in", [
    //                 "completed",
    //                 "inreview",
    //                 "active",
    //               ])
    //               .orderBy("taskStartedTimestamp")
    //               .get();

    //             for (const task of topicQuerySnapshot.docs) {
    //               taskCount++;
    //               // topicData.push(task.data());
    //               currentTopicProgress.push({
    //                 x: task.data().taskStartedTimestamp,
    //                 y: taskCount,
    //                 courseId: teachersCourseId,
    //                 topicId: topic.id,
    //                 taskTitle: task.data().title,
    //                 taskStatus: "started",
    //                 task: task.data(),
    //               });
    //               currentTopicProgress.push({
    //                 x: task.data().taskCompletedTimestamp
    //                   ? task.data().taskCompletedTimestamp
    //                   : task.data().taskSubmittedForReviewTimestamp,
    //                 y: taskCount,
    //                 courseId: teachersCourseId,
    //                 topicId: topic.id,
    //                 taskTitle: task.data().title,
    //                 taskStatus: task.data().taskStatus,
    //                 task: task.data(),
    //               });
    //             }
    //             currentCourseProgress.push({
    //               topicId: topic.id,
    //               topic: topic.data(),
    //               topicTitle: topic.data().label,
    //               topicTaskData: currentTopicProgress,
    //             });
    //           }

    //           currentStudentProgress.push({
    //             courseId: teachersCourseId,
    //             courseTopicData: currentCourseProgress,
    //           });
    //         }
    //       }
    //     }
    //     allStudentProgress.push({
    //       studentId: student.id,
    //       student: student,
    //       studentCoursesData: currentStudentProgress,
    //     });
    //   }

    //   //test did it work?
    //   console.log("FINISHED allStudentProgress ===> ", allStudentProgress);

    //   state.teachersStudentsProgress = allStudentProgress;
    // },
    // async getCourseProgressionDataForTeacher({ state, commit }) {
    //   // this method does...
    //   // 1 - get teachers courses
    //   // 2 - make an array of teachers course ids
    //   // 3 - go to database and get students that have course id as a collection
    //   // 4 - loop each student and for each student assigned courses that match a teachers course get all the topic and task data

    //   // get teachers courses. (returns array of course objects eg. id, title, description, image, mappedBy, contentBy)
    //   const myCourses = this.getters.getCoursesByWhoMadeThem(state.person.id);
    //   // make an array of course.id's
    //   let teachersCourseIds = myCourses.map((course) => course.id);
    //   // console.log("teachersCourseIds : ", teachersCourseIds);

    //   // search people database where assignedCourses arrayContains
    //   const studentsInTeachersCourses = [];
    //   for (const course of myCourses) {
    //     // get all work for review
    //     const querySnapshot = await db
    //       .collection("people")
    //       .where("assignedCourses", "array-contains-any", teachersCourseIds)
    //       .get();

    //     for (const doc of querySnapshot.docs) {
    //       studentsInTeachersCourses.push(doc.data());
    //     }
    //   }
    //   console.log("studentsInTeachersCourses : ", studentsInTeachersCourses);

    //   //TODO: there are duplicates of students in studentsInTeachersCourses, even though array-contains-any is supposed to be de-duped (https://firebase.google.com/docs/firestore/query-data/queries#array-contains-any)
    //   // flatten array to remove duplicate students
    //   // const flatStudents = getUniqueListBy(studentsInTeachersCourses, "email");
    //   const ids = studentsInTeachersCourses.map((o) => o.id);
    //   const flatStudents = studentsInTeachersCourses.filter(
    //     ({ id }, index) => !ids.includes(id, index + 1)
    //   );
    //   console.log("flat students", flatStudents);

    //   // allStudentProgress
    //   let allStudentProgress = [];

    //   // for each of the students, check if their assignedCourses matches teachers courses
    //   for (const student of flatStudents) {
    //     // new student. reset array
    //     let currentStudentProgress = [];

    //     for (var x = 0; x < student.assignedCourses.length; x++) {
    //       // check which assignedCourse matches with teacher
    //       for (var y = 0; y < teachersCourseIds.length; y++) {
    //         const teachersCourseId = teachersCourseIds[y];
    //         if (student.assignedCourses[x] == teachersCourseId) {
    //           // there is a match! get these tasks from db

    //           // new course. reset array
    //           let currentCourseProgress = [];
    //           // reset task count (task count is Y axes of chart. ie. line increments as you complete tasks)
    //           let taskCount = 0;

    //           const studentTaskQuerySnapshot = await db
    //             .collection("people")
    //             .doc(student.id)
    //             .collection(teachersCourseId)
    //             .get();

    //           // sort topics by topic.topicCreatedTimestamp (so that y axes: taskCount is close to being in order)
    //           let sortedTopics = studentTaskQuerySnapshot.docs.sort((a, b) =>
    //             a.data().topicCreatedTimestamp > b.data().topicCreatedTimestamp
    //               ? 1
    //               : -1
    //           );
    //           // console.log("sortedTopics: ", sortedTopics.data());

    //           for (const topic of sortedTopics) {
    //             // console.log("sorted topic: ", topic.data());
    //             // new topic. reset array
    //             let currentTopicProgress = [];

    //             // get task data for each topic
    //             const topicQuerySnapshot = await db
    //               .collection("people")
    //               .doc(student.id)
    //               .collection(teachersCourseId)
    //               .doc(topic.id)
    //               .collection("tasks")
    //               // only get tasks with completed OR inreview status
    //               .where("taskStatus", "in", [
    //                 "completed",
    //                 "inreview",
    //                 "active",
    //               ])
    //               .orderBy("taskStartedTimestamp")
    //               .get();

    //             for (const task of topicQuerySnapshot.docs) {
    //               taskCount++;
    //               // topicData.push(task.data());
    //               currentTopicProgress.push({
    //                 x: task.data().taskStartedTimestamp,
    //                 y: taskCount,
    //                 courseId: teachersCourseId,
    //                 topicId: topic.id,
    //                 taskTitle: task.data().title,
    //                 taskStatus: "started",
    //                 task: task.data(),
    //               });
    //               currentTopicProgress.push({
    //                 x: task.data().taskCompletedTimestamp
    //                   ? task.data().taskCompletedTimestamp
    //                   : task.data().taskSubmittedForReviewTimestamp,
    //                 y: taskCount,
    //                 courseId: teachersCourseId,
    //                 topicId: topic.id,
    //                 taskTitle: task.data().title,
    //                 taskStatus: task.data().taskStatus,
    //                 task: task.data(),
    //               });
    //             }
    //             currentCourseProgress.push({
    //               topicId: topic.id,
    //               topic: topic.data(),
    //               topicTitle: topic.data().label,
    //               topicTaskData: currentTopicProgress,
    //             });
    //           }

    //           currentStudentProgress.push({
    //             courseId: teachersCourseId,
    //             courseTopicData: currentCourseProgress,
    //           });
    //         }
    //       }
    //     }
    //     allStudentProgress.push({
    //       studentId: student.id,
    //       student: student,
    //       studentCoursesData: currentStudentProgress,
    //     });
    //   }

    //   //test did it work?
    //   console.log("FINISHED allStudentProgress ===> ", allStudentProgress);

    //   state.teachersStudentsProgress = allStudentProgress;
    // },
  },
  persist: true,
});

// colour functions to colour nodes
function hashCode(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

function stringToColour(str: string) {
  return `hsl(${hashCode(str) % 360}, 100%, 70%)`;
}

function getUniqueListBy<T extends object>(arr: T[], key: keyof T) {
  return Array.from(new Map(arr.map((item) => [item[key], item])).values());
}
