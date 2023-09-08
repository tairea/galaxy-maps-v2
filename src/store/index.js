import { dbMixins } from "@/mixins/DbMixins.js";
import { db } from "@/store/firestoreConfig.ts";
import Vue from "vue";
import Vuex from "vuex";
import createPersistedState from "vuex-persistedstate";
import { vuexfireMutations, firestoreAction } from "vuexfire";

Vue.use(Vuex);

const getDefaultState = () => {
  return {
    from: {},
    user: {
      loggedIn: false,
      data: null,
    },
    person: {},
    topics: [],
    cohorts: [],
    courses: [],
    assignedCourses: [],
    organisations: [],
    people: [],
    currentCourse: {},
    currentTopicId: "",
    currentTaskId: "",
    currentCourseId: "",
    currentTopic: {},
    currentTask: {},
    currentCohort: {},
    currentCourseNodes: [],
    currentCourseEdges: [],
    allNodes: [],
    allEdges: [],
    allNodesForDisplay: [],
    allTasks: [],
    personsCourses: [],
    personsTopics: [],
    topicsTasks: [],
    personsTopicsTasks: [],
    requestsForHelp: [],
    courseSubmissions: [],
    teachersRequestsForHelp: [],
    teachersStudentsProgress: [],
    darkMode: true,
    sortedArr: [],
    studentCourseDataFromLRS: [],
    snackbar: {},
    userStatus: {},
    studentsActiveTasks: [],
    studentsActivityLog: [],
    showPanelCard: {},
    studentsSubmissions: [],
    dashboardView: '',
    peopleInCourse: [],
    personsCourseTasks: [],
    courseTasks: []
  };
};

export default new Vuex.Store({
  state: getDefaultState(),
  getters: {
    people: (state) => state.people,
    organisations: (state) => state.organisations,
    user: (state) => state.user,
    person: (state) => state.person,
    assignedCourses: (state) => state.assignedCourses,
    cohorts: (state) => state.cohorts,
    organisations: (state) => state.organisations,
    currentCohort: (state) => state.currentCohort,
    getCourseById: (state) => (id) => {
      return state.courses.find((course) => course.id === id);
    },
    getCoursesByWhoMadeThem: (state) => (personId) => {
      return state.courses.filter(
        (course) => course.mappedBy.personId == personId
      );
    },
    getTopicById: (state) => (id) => {
      const topic = state.topics.find((topic) => topic.id === id);
      return topic;
    },
    getPersonsTopicById: (state) => (id) => {
      const topic = state.personsTopics.find((topic) => topic.id === id);
      return topic;
    },
    getCohortById: (state) => (id) => {
      return state.cohorts.find((cohort) => cohort.id === id);
    },
    getOrganisationById: (state) => (id) => {
      return state.organisations.find((organisation) => organisation.id === id);
    },
    getTasksByTopicId: (state) => (topicId) => {
      const topic = state.topics.find((topic) => topic.id === topicId);
      return topic.tasks;
    },
    getPersonsTasksByTopicId: (state) => (id) => {
      if (state.personsTopics.length) {
        var topic = state.personsTopics.find((topic) => topic.id === id);
      } else
        var topic = {
          tasks: [],
        };
      return topic.tasks;
    },
    getCoursesInThisCohort: (state) => (id) => {
      //go to cohorts, and check if they in courses with this id
      const cohort = state.cohorts.find((cohort) => cohort.id === id);
      const cohortsCoursesArrOfObj = [];
      cohort.courses.forEach((courseId) => {
        const courseObj = state.courses.find((course) => course.id == courseId);
        cohortsCoursesArrOfObj.push(courseObj);
      });
      return cohortsCoursesArrOfObj;
    },
    getStudentsByCohortId: (state) => (id) => {
      //go to cohorts, and check if they in courses with this id
      let peopleInCohort = [];
      state.people.forEach((person) => {
        if (person.assignedCohorts) {
          // if student is assigned in this cohort...
          if (person.assignedCohorts.some((cohortId) => cohortId === id)) {
            // push them into array
            peopleInCohort.push(person);
          }
        }
      });
      return peopleInCohort;
    },
    getUnansweredRequestsForHelp: (state) => {
      return state.teachersRequestsForHelp.filter(
        (request) => request.requestForHelpStatus == "unanswered"
      );
    },
  },
  mutations: {
    ...vuexfireMutations,
    RESET_STATE(state) {
      Object.assign(state, getDefaultState());
    },
    SET_USER(state, data) {
      state.user = data;
    },
    SET_PERSON(state, data) {
      state.person = data;
    },
    set_from(state, data) {
      state.from = data
    },
    resetTeachersSubmissions(state) {
      state.courseSubmissions = [];
    },
    setPanelCard(state, data) {
      state.showPanelCard = data;
    },
    setCurrentCourseId(state, courseId) {
      if (courseId === state.currentCourseId) return
      // new course, so reset tasks
      state.personsCourseTasks = []
      state.courseTasks = []
      state.currentCourseId = courseId;
    },
    setCurrentCourse(state, course) {
      state.currentCourse = course;
    },
    setCurrentTopicId(state, topicId) {
      state.currentTopicId = topicId;
    },
    setCurrentTopic(state, topic) {
      state.currentTopic = topic;
    },
    setCurrentTaskId(state, taskId) {
      state.currentTaskId = taskId;
    },
    setCurrentTask(state, task) {
      state.currentTask = task;
    },
    setCurrentCohort(state, cohort) {
      state.currentCohort = cohort;
    },
    updateAllNodes(state, newNodePositions) {
      state.allNodes = newNodePositions;
    },
    updateAllNodesForDisplay(state, newNodePositions) {
      state.allNodesForDisplay = newNodePositions;
    },

    setCohorts(state, cohorts) {
      state.cohorts = cohorts;
    },
    setOrganisations(state, orgs) {
      state.organisations = orgs;
    },
    setDarkMode(state, dark) {
      state.darkMode = dark;
    },
    sortAsc(state, arr) {
      const sortedArr = arr.sort((a, b) =>
        a.topic.topicCreatedTimestamp.seconds >
          b.topic.topicCreatedTimestamp.seconds
          ? 1
          : -1
      );
      console.log("sortedArr: ", sortedArr);
      state.sortedArr = sortedArr;
    },
    setStudentCourseDataFromLRS(state, courseData) {
      state.studentCourseDataFromLRS = courseData;
    },
    setStudentsActiveTasks(state, activeTasksArr) {
      state.studentsActiveTasks = activeTasksArr;
    },
    setStudentsActivityLog(state, activityStatements) {
      state.studentsActivityLog = activityStatements;
    },
    setSnackbar(state, snackbar) {
      state.snackbar = snackbar;
    },
    setDashboardView(state, view) {
      console.log('setView: ', view)
      state.dashboardView = view
    },
    setPeopleInCourse(state, people) {
      state.peopleInCourse = people
    },
    setUserStatus(state, userStatus) {
      state.userStatus = userStatus
    },
  },
  actions: {
    setUser({ commit }, user) {
      if (user) {
        commit("SET_USER", {
          loggedIn: true,
          data: {
            admin: user.admin,
            displayName: user.displayName,
            email: user.email,
            verified: user.emailVerified,
            id: user.uid,
          }
        });
      } else {
        commit("SET_USER", {
          loggedIn: false,
          data: null
        });
      }
    },
    // ===== Firestore - BIND ALL
    bindCourses: firestoreAction(({ bindFirestoreRef }, payload) => {
      const query = payload.owner != null ? db.collection("courses").where("owner", '==', payload.owner) : db.collection("courses");
      return bindFirestoreRef("courses", query, {
        maxRefDepth: 2,
      });
    }),
    bindAllCohorts: firestoreAction(({ bindFirestoreRef }) => {
      return bindFirestoreRef("cohorts", db.collection("cohorts"));
    }),
    bindAllOrganisations: firestoreAction(({ bindFirestoreRef }) => {
      return bindFirestoreRef("organisations", db.collection("organisations"));
    }),
    bindAllPeople: firestoreAction(({ bindFirestoreRef }) => {
      return bindFirestoreRef("people", db.collection("people"));
    }),
    bindCourseNodes: firestoreAction(({ bindFirestoreRef }, id) => {
      return bindFirestoreRef(
        "currentCourseNodes",
        db.collection("courses").doc(id).collection("map-nodes"),
        {
          reset: false,
        }
      );
    }),
    bindCourseEdges: firestoreAction(({ bindFirestoreRef }, id) => {
      return bindFirestoreRef(
        "currentCourseEdges",
        db.collection("courses").doc(id).collection("map-edges"),
        {
          reset: false,
        }
      );
    }),
    bindCourseTopics: firestoreAction(({ bindFirestoreRef }, id) => {
      return bindFirestoreRef(
        "topics",
        db.collection("courses").doc(id).collection("topics")
      );
    }),
    bindCoursesByPersonId: firestoreAction(({ bindFirestoreRef }, personId) => {
      return bindFirestoreRef(
        "personsCourses",
        db.collection("courses").where("mappedBy.personId", "==", personId)
      );
    }),
    bindThisPersonsCourseTopics: firestoreAction(
      ({ bindFirestoreRef }, payload) => {
        return bindFirestoreRef(
          "personsTopics",
          db
            .collection("people")
            .doc(payload.personId)
            .collection(payload.courseId)
        );
      }
    ),
    // bind persons tasks by topic id
    bindPersonsTasksByTopicId: firestoreAction(
      ({ bindFirestoreRef }, payload) => {
        console.log('getting persons tasks: ', payload)

        return bindFirestoreRef(
          "personsTopicsTasks",
          db
            .collection("people")
            .doc(payload.personId)
            .collection(payload.courseId)
            .doc(payload.topicId)
            .collection("tasks")
            .orderBy("taskCreatedTimestamp")
        );
      }
    ),
    bindTasksByTopicId: firestoreAction(({ bindFirestoreRef }, payload) => {
      return bindFirestoreRef(
        "topicsTasks",
        db
          .collection("courses")
          .doc(payload.courseId)
          .collection("topics")
          .doc(payload.topicId)
          .collection("tasks")
          .orderBy("taskCreatedTimestamp") // this is important to ordering the tasks in MissionList.vue
      );
    }),
    async getPersonsCourseTasks({ state }) {
      const tasksPerTopic = await Promise.all(state.personsTopics.filter((topic) => topic.topicStatus !== "locked").map(async (topic) => {
        const tasks = await db
          .collection("people")
          .doc(state.person.id)
          .collection(state.currentCourseId)
          .doc(topic.id)
          .collection("tasks")
          .get();
        return tasks.docs.map((task) => ({ topicId: topic.id, task: task.data() }));
      }));

      const tasksArr = tasksPerTopic.flat();
      // console.log("tasksArr", tasksArr)
      state.personsCourseTasks = tasksArr
    },
    async getCourseTasks({ state }) {
      const tasksPerTopic = await Promise.all(state.currentCourseNodes.map(async (topic) => {
        const tasks = await db
          .collection("courses")
          .doc(state.currentCourseId)
          .collection("topics")
          .doc(topic.id)
          .collection("tasks")
          .get();
        return tasks.docs.map((task) => ({ topicId: topic.id, task: task.data() }));
      }));

      const tasksArr = tasksPerTopic.flat();
      // console.log("tasksArr", tasksArr)
      state.courseTasks = tasksArr
    },
    async getAllNodes({ state }) {
      const allNodes = [];

      // get the topics (nodes) in that course
      for (const course of state.courses) {

        // if public and not submitted || mapped by user || user is assigned to course
        if ((
          // if public and not submitted
          course.public === true && course.status != 'submitted') ||
          // mapped by user 
          course.mappedBy.personId === state.person.id ||
          // user is assigned to course
          state.person.assignedCourses?.some(assignedCourse => assignedCourse === course.id) ||
          state.user.data?.admin) {
          const subQuerySnapshot = await db
            .collection("courses")
            .doc(course.id)
            .collection("map-nodes")
            .get();

          allNodes.push(
            ...subQuerySnapshot.docs.map((subDoc) => {
              const node = subDoc.data();
              node.courseId = course.id; // add course id to nodes list for some reason
              //node.group = count; // add group to nodes list for some reason
              return node;
            })
          );
        }
      }
      state.allNodes = allNodes; // source of truth
      // console.log("all nodes:",allNodes)
      // state.allNodesForDisplay = allNodes; // store all nodes
    },
    async getAllEdges({ state }) {
      const allEdges = [];

      for (const course of state.courses) {

        if (
          // if public and not submitted
          (course.public === true && course.status != 'submitted') ||
          // mapped by user 
          course.mappedBy.personId === state.person.id ||
          // user is assigned to course
          state.person.assignedCourses?.some(assignedCourse => assignedCourse === course.id) ||
          state.user.data?.admin) {
          // doc.data() is never undefined for query doc snapshots
          const subQuerySnapshot = await db
            .collection("courses")
            .doc(course.id)
            .collection("map-edges")
            .get();

          allEdges.push(...subQuerySnapshot.docs.map((subDoc) => subDoc.data()))
        }
      }

      state.allEdges = allEdges;
      // console.log("all edges:",allEdges)
    },

    // ===== Firestore - BIND by USER
    async getPersonById({ commit }, id) {
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
            commit("SET_PERSON", person);
          });
      } else {
        commit("SET_PERSON", {});
      }
    },
    async getAllSubmittedWorkByCourseId({ state }, courseId) {
      // get all work for review
      const unsubscribe = db
        .collection("courses")
        .doc(courseId)
        .collection("submissionsForReview")
        // .where("taskSubmissionStatus", "==", "inreview")
        .orderBy("taskSubmittedForReviewTimestamp")
        // .orderBy("requestSubmittedTimestamp")
        .onSnapshot((querySnapshot) => {
          const allWorkForReview = [...state.courseSubmissions];

          for (const change of querySnapshot.docChanges()) {
            if (change.type === "added") {
              if (
                allWorkForReview.some(
                  (submission) => submission.id === change.doc.id
                )
              )
                return;
              allWorkForReview.push({
                id: change.doc.id,
                ...change.doc.data(),
              });
            } else if (change.type === "modified") {
              allWorkForReview.splice(
                allWorkForReview.findIndex(
                  (i) => i.id === change.doc.id
                ),
                1,
                {
                  id: change.doc.id,
                  ...change.doc.data(),
                }
              );
            } else if (change.type === "removed") {
              allWorkForReview.splice(
                allWorkForReview.findIndex(
                  (i) => i.id === change.doc.id
                ),
                1
              );
            }
          }
          state.courseSubmissions = allWorkForReview;
        });

      return unsubscribe;
      // state.courseSubmissions = allWorkForReview;
    },

    async getCohortsByPersonId({ commit, dispatch }, person) {
      let teacherCohorts = [];
      let studentCohorts = [];

      // onSnapshot wasnt working for me. so changed to .get()
      const studentQuerySnapShot = await db
        .collection("cohorts")
        .where("students", "array-contains", person.id ?? '')
        .get();
      const teacherQuerySnapShot = await db
        .collection("cohorts")
        .where("teachers", "array-contains", person.id ?? '')
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
      commit("setCohorts", cohorts);
      if (cohorts.length) dispatch("getOrganisationsByCohorts", cohorts);
    },

    // ===== Firestore - Cohorts & Orgs
    async getOrganisationsByCohorts({ commit }, cohorts) {
      const orgs = [];
      const querySnapShot = await db
        .collection("organisations")
        // .doc(cohort)
        .where("cohorts", "array-contains-any", cohorts)
        .get();

      if (querySnapShot.docs.length) {
        for (const doc of querySnapShot.docs) {
          orgs.push(doc.data());
        }
      }
      commit("setOrganisations", orgs);
    },

    async getRequestsForHelpByCourseId({ state }, courseId) {
      // get all work for review
      const unsubscribe = db
        .collection("courses")
        .doc(courseId)
        .collection("requestsForHelp")
        // .where("requestForHelpStatus", "==", "unanswered")
        // .orderBy("requestSubmittedTimestamp")
        .onSnapshot((querySnapshot) => {
          const allRequestsForHelp = [...state.teachersRequestsForHelp];
          // WTF!!!! Why does for each fix this?
          querySnapshot.docChanges().forEach(change => {
            // for (const change of querySnapshot.docChanges()) {
            if (change.type === "added") {
              if (allRequestsForHelp.some((request) => request.id === change.doc.data().id)) return;
              allRequestsForHelp.push({
                id: change.doc.data().id,
                ...change.doc.data(),
              });
            } else if (change.type === "modified") {
              allRequestsForHelp.splice(
                allRequestsForHelp.findIndex((i) => i.id === change.doc.data().id), 1, {
                id: change.doc.data().id,
                ...change.doc.data(),
              }
              );
            } else if (change.type === "removed") {
              allRequestsForHelp.splice(
                allRequestsForHelp.findIndex(
                  (i) => i.id === change.doc.data().id
                ),
                1
              );
            }
          })
          allRequestsForHelp.sort((a, b) => b.requestSubmittedTimestamp.seconds - a.requestSubmittedTimestamp.seconds)
          state.teachersRequestsForHelp = allRequestsForHelp.filter(req => req.contextCourse.id === courseId);
        });

      return unsubscribe;

      // state.teachersRequestsForHelp = allRequestsForHelp;
    },


    async setCurrentCohort({ commit }, cohort) {
      await db
        .collection("cohorts")
        .doc(cohort.id)
        .onSnapshot(async (doc) => {
          console.log('cohort DB watcher triggered');
          const newCohort = {
            id: doc.id,
            ...doc.data(),
          };
          if (cohort.teacher) newCohort.teacher = true
          else if (cohort.student) newCohort.student = true
          commit("setCurrentCohort", newCohort);
        });
    },

    async getAllUsersStatus({ state }) {
      const users = {};
      await db
        .collection("status")
        .get()
        .then((snapShot) => {
          snapShot.docs.forEach((doc) => {
            var obj = {};
            obj[doc.id] = doc.data();
            Object.assign(users, obj);
          });
        })
        .then(() => {
          state.userStatus = users;
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
  plugins: [createPersistedState()],
});

// colour functions to colour nodes
function hashCode(str) {
  let hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

function stringToColour(str) {
  return `hsl(${hashCode(str) % 360}, 100%, 70%)`;
}

function getUniqueListBy(arr, key) {
  return [...new Map(arr.map((item) => [item[key], item])).values()];
}
