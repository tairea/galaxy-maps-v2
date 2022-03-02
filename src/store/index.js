import Vue from "vue";
import Vuex from "vuex";
import createPersistedState from "vuex-persistedstate";

import { db } from "./firestoreConfig";
import { vuexfireMutations, firestoreAction } from "vuexfire";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    user: {
      loggedIn: false,
      data: null,
    },
    person: {},
    courses: [],
    topics: [],
    cohorts: [],
    organisations: [],
    people: [],
    currentCourse: {},
    currentTopicId: "",
    currentTaskId: "",
    currentCourseId: {},
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
    personsNodes: [],
    personsNodesForDisplay: [],
    personsAssignedNodes: [],
    personsAssignedNodesForDisplay: [],
    personsEdges: [],
    personsAssignedEdges: [],
    personsTopics: [],
    topicsTasks: [],
    personsTopicsTasks: [],
    requestsForHelp: [],
    teachersSubmissionsToReview: [],
    teachersRequestsForHelp: [],
    teachersStudentsProgress: [],
    peopleInCourse: [],
    cohortsInCourse: [],
    darkMode: true,
    sortedArr: [],
    snackbar: {}
  },
  getters: {
    people: (state) => state.people,
    organisations: (state) => state.organisations,
    user: (state) => state.user,
    person: (state) => state.person,
    courses: (state) => state.courses,
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
    getTaskStatusByTaskId: (state) => (taskId) => {
      if (state.person.accountType != "student") {
        return;
      }
      // get topic status eg. unlocked / inreview / completed / locked
      const task = state.personsTopicsTasks.find(
        (topicTask) => topicTask.id === taskId
      );
      return task.taskStatus;
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
    // getCohortsInThisCourse: (state) => (id) => {
    //   //go to cohorts, and check if they in courses with this id
    //   let cohortsInCourse = state.cohorts.filter((cohort) => {
    //     if (cohort.courses) {
    //       return cohort.courses.some((courseId) => courseId == id);
    //     } else {
    //       return false;
    //     }
    //   });
    //   return cohortsInCourse;
    // },
    // getOrganisationsInThisCourse: (state) => (id) => {
    //   let organisationsInCourse = state.organisations.filter((organisation) => {
    //     if (organisation.courses) {
    //       return organisation.courses.some((courseId) => courseId == id);
    //     } else {
    //       return false;
    //     }
    //   });
    //   return organisationsInCourse;
    // },
    // TODO: people not binded so just gonna do a db call. See bindPeopleInCourse action (@ben thoughts?)
    // getPeopleInThisCourse: (state) => (id) => {
    //   let peopleInCourse = state.people.filter((person) => {
    //     if (person.assignedCourses) {
    //       return person.assignedCourses.some((courseId) => courseId == id);
    //     } else {
    //       return false;
    //     }
    //   });
    //   return peopleInCourse;
    // },
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
    //
    // completedCourses: (state) => {
    //   return state.courses.filter(course => course.status.completed)
    // }
  },
  mutations: {
    ...vuexfireMutations,
    SET_LOGGED_IN(state, value) {
      state.user.loggedIn = value;
    },
    SET_USER(state, data) {
      state.user.data = data;
    },
    SET_PERSON(state, data) {
      state.person = data;
    },
    setCurrentCourseId(state, courseId) {
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
    updatePersonsNodesForDisplay(state, newNodePositions) {
      state.personsNodesForDisplay = newNodePositions;
    },
    updatePersonsAssignedNodesForDisplay(state, newNodePositions) {
      state.personsAssignedNodesForDisplay = newNodePositions;
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
      console.log("arr: ", arr);
      const sortedArr = arr.sort((a, b) =>
        a.topic.topicCreatedTimestamp.seconds >
        b.topic.topicCreatedTimestamp.seconds
          ? 1
          : -1
      );
      console.log("sortedArr: ", sortedArr);
      state.sortedArr = sortedArr;
    },
    setSnackbar(state, snackbar) {
      state.snackbar = snackbar
    }
  },
  actions: {
    setUser({ commit }, user) {
      commit("SET_LOGGED_IN", user !== null);
      if (user) {
        console.log("user: ", user)
        commit("SET_USER", {
          admin: user.admin,
          displayName: user.displayName,
          email: user.email,
          verified: user.emailVerified,
          id: user.uid,
        });
      } else {
        commit("SET_USER", null);
      }
    },
    // ===== Firestore - BIND ALL
    bindAllCourses: firestoreAction(({ bindFirestoreRef }) => {
      return bindFirestoreRef("courses", db.collection("courses"), {
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
        db.collection("courses").doc(id).collection("map-nodes")
      );
    }),
    bindCourseEdges: firestoreAction(({ bindFirestoreRef }, id) => {
      return bindFirestoreRef(
        "currentCourseEdges",
        db.collection("courses").doc(id).collection("map-edges")
      );
    }),
    bindCourseTopics: firestoreAction(({ bindFirestoreRef }, id) => {
      return bindFirestoreRef(
        "topics",
        db.collection("courses").doc(id).collection("topics")
      );
    }),
    async getAllNodes({ state }) {
      const allNodes = [];

      const querySnapshot = await db.collection("courses").get();

      let count = 0;

      // get the topics (nodes) in that course
      for (const doc of querySnapshot.docs) {
        const subQuerySnapshot = await db
          .collection("courses")
          .doc(doc.id)
          .collection("map-nodes")
          .get();

        allNodes.push(
          ...subQuerySnapshot.docs.map((subDoc) => {
            const node = subDoc.data();
            node.courseId = doc.id; // add course id to nodes list for some reason
            //node.group = count; // add group to nodes list for some reason
            return node;
          })
        );
        count++;
      }
      // console.log("all nodes from Firestore: ", allNodes);
      state.allNodes = allNodes; // source of truth
      state.allNodesForDisplay = allNodes; // store all nodes
    },
    async getAllEdges({ state }) {
      const allEdges = [];
      const querySnapshot = await db.collection("courses").get();

      for (const doc of querySnapshot.docs) {
        // doc.data() is never undefined for query doc snapshots
        const subQuerySnapshot = await db
          .collection("courses")
          .doc(doc.id)
          .collection("map-edges")
          .get();

        allEdges.push(...subQuerySnapshot.docs.map((subDoc) => subDoc.data()));
      }

      state.allEdges = allEdges;
    },
    async getCourseFromFirestoreById({ state }, id) {
      await db
        .collection("courses")
        .doc(id)
        .get()
        .then((doc) => {
          state.courses.push({ ...doc.data(), id: doc.id });
        });
    },
    // ===== Firestore - BIND by USER
    async getPersonById({ commit }, id) {
      if (id) {
        await db
          .collection("people")
          .doc(id)
          .get()
          .then((doc) => {
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
    async getNodesByPersonId({ state }, personId) {
      const personsNodes = [];

      const querySnapshot = await db
        .collection("courses")
        .where("mappedBy.personId", "==", personId)
        .get();
      // let count = 0; // if counting groups
      // get the topics (nodes) in that course
      for (const doc of querySnapshot.docs) {
        const subQuerySnapshot = await db
          .collection("courses")
          .doc(doc.id)
          .collection("map-nodes")
          .get();

        personsNodes.push(
          ...subQuerySnapshot.docs.map((subDoc) => {
            const node = subDoc.data();
            node.courseId = doc.id; // add course id to nodes list for some reason
            //node.group = count; // add group to nodes list for some reason
            // node.color = stringToColour(node.label)
            return node;
          })
        );

        // count++;
      }
      state.personsNodes = personsNodes; // source of truth
      state.personsNodesForDisplay = personsNodes; // store all nodes
    },
    async getAssignedNodesByPersonId({ state }, personId) {
      const personsAssignedNodes = [];

      state.courses = [];
      // get the courseId from assignedCourses
      const doc = await db.collection("people").doc(personId).get();
      // loop array of assigned courses
      if (doc.data()?.assignedCourses) {
        for (const courseId of doc.data()?.assignedCourses) {
          // this action pushes assigned courses data into state.courses
          this.dispatch("getCourseFromFirestoreById", courseId);

          const subQuerySnapshot = await db
            .collection("courses")
            .doc(courseId)
            .collection("map-nodes")
            .get();

          //TODO: this only pushes nodes. not the course info

          personsAssignedNodes.push(
            ...subQuerySnapshot.docs.map((subDoc) => {
              const node = subDoc.data();
              node.courseId = courseId; // add course id to nodes list for some reason
              //node.group = count; // add group to nodes list for some reason
              // node.color = stringToColour(node.label)
              return node;
            })
          );
        }
      }
      state.personsAssignedNodes = personsAssignedNodes; // source of truth
      state.personsAssignedNodesForDisplay = personsAssignedNodes; // store all nodes
    },
    async getEdgesByPersonId({ state }, personId) {
      const personsEdges = [];

      const querySnapshot = await db
        .collection("courses")
        .where("mappedBy.personId", "==", personId)
        .get();

      for (const doc of querySnapshot.docs) {
        // doc.data() is never undefined for query doc snapshots
        const subQuerySnapshot = await db
          .collection("courses")
          .doc(doc.id)
          .collection("map-edges")
          .get();

        personsEdges.push(
          ...subQuerySnapshot.docs.map((subDoc) => {
            const edge = subDoc.data();
            // edge.color = '#848484'
            return edge;
          })
        );
      }

      state.personsEdges = personsEdges;
    },
    async getAllSubmittedWorkForTeacher({ state }) {
      const myCourses = this.getters.getCoursesByWhoMadeThem(state.person.id);
      const allWorkForReview = [];
      for (const course of myCourses) {
        // get all work for review
        const querySnapshot = await db
          .collection("courses")
          .doc(course.id)
          .collection("submissionsForReview")
          .where("taskSubmissionStatus", "==", "inreview")
          .orderBy("taskSubmittedForReviewTimestamp")
          .get();

        for (const doc of querySnapshot.docs) {
          allWorkForReview.push(doc.data());
        }
      }
      state.teachersSubmissionsToReview = allWorkForReview;
    },
    //TODO: WIP
    async getEachStudentsProgressForTeacher({ state, commit }) {
      // this method does...
      // 1 - get teachers courses
      // 2 - make an array of teachers course ids
      // 3 - go to database and get students assigned to any of those teachers courseIds
      // 4 - loop each student and for each student assigned courses that match a teachers course get all the topic and task data

      // get teachers courses. (returns array of course objects eg. id, title, description, image, mappedBy, contentBy)
      const myCourses = this.getters.getCoursesByWhoMadeThem(state.person.id);
      // make an array of course.id's
      let teachersCourseIds = myCourses.map((course) => course.id);
      // console.log("teachersCourseIds : ", teachersCourseIds);

      // search people database where assignedCourses arrayContains
      const studentsInTeachersCourses = [];
      for (const course of myCourses) {
        // get all work for review
        const querySnapshot = await db
          .collection("people")
          .where("assignedCourses", "array-contains-any", teachersCourseIds)
          .get();

        for (const doc of querySnapshot.docs) {
          studentsInTeachersCourses.push(doc.data());
        }
      }
      console.log("studentsInTeachersCourses : ", studentsInTeachersCourses);

      //TODO: there are duplicates of students in studentsInTeachersCourses, even though array-contains-any is supposed to be de-duped (https://firebase.google.com/docs/firestore/query-data/queries#array-contains-any)
      // flatten array to remove duplicate students
      // const flatStudents = getUniqueListBy(studentsInTeachersCourses, "email");
      const ids = studentsInTeachersCourses.map((o) => o.id);
      const flatStudents = studentsInTeachersCourses.filter(
        ({ id }, index) => !ids.includes(id, index + 1)
      );
      console.log("flat students", flatStudents);

      // allStudentProgress
      let allStudentProgress = [];

      // for each of the students, check if their assignedCourses matches teachers courses
      for (const student of flatStudents) {
        // new student. reset array
        let currentStudentProgress = [];

        for (var x = 0; x < student.assignedCourses.length; x++) {
          // check which assignedCourse matches with teacher
          for (var y = 0; y < teachersCourseIds.length; y++) {
            const teachersCourseId = teachersCourseIds[y];
            if (student.assignedCourses[x] == teachersCourseId) {
              // there is a match! get these tasks from db

              // new course. reset array
              let currentCourseProgress = [];
              // reset task count (task count is Y axes of chart. ie. line increments as you complete tasks)
              let taskCount = 0;

              const studentTaskQuerySnapshot = await db
                .collection("people")
                .doc(student.id)
                .collection(teachersCourseId)
                .get();

              // sort topics by topic.topicCreatedTimestamp (so that y axes: taskCount is close to being in order)
              let sortedTopics = studentTaskQuerySnapshot.docs.sort((a, b) =>
                a.data().topicCreatedTimestamp > b.data().topicCreatedTimestamp
                  ? 1
                  : -1
              );
              // console.log("sortedTopics: ", sortedTopics.data());

              for (const topic of sortedTopics) {
                // console.log("sorted topic: ", topic.data());
                // new topic. reset array
                let currentTopicProgress = [];

                // get task data for each topic
                const topicQuerySnapshot = await db
                  .collection("people")
                  .doc(student.id)
                  .collection(teachersCourseId)
                  .doc(topic.id)
                  .collection("tasks")
                  // only get tasks with completed OR inreview status
                  .where("taskStatus", "in", [
                    "completed",
                    "inreview",
                    "active",
                  ])
                  .orderBy("taskStartedTimestamp")
                  .get();

                for (const task of topicQuerySnapshot.docs) {
                  taskCount++;
                  // topicData.push(task.data());
                  currentTopicProgress.push({
                    x: task.data().taskStartedTimestamp,
                    y: taskCount,
                    courseId: teachersCourseId,
                    topicId: topic.id,
                    taskTitle: task.data().title,
                    taskStatus: "started",
                    task: task.data(),
                  });
                  currentTopicProgress.push({
                    x: task.data().taskCompletedTimestamp
                      ? task.data().taskCompletedTimestamp
                      : task.data().taskSubmittedForReviewTimestamp,
                    y: taskCount,
                    courseId: teachersCourseId,
                    topicId: topic.id,
                    taskTitle: task.data().title,
                    taskStatus: task.data().taskStatus,
                    task: task.data(),
                  });
                }
                currentCourseProgress.push({
                  topicId: topic.id,
                  topic: topic.data(),
                  topicTitle: topic.data().label,
                  topicTaskData: currentTopicProgress,
                });
              }

              currentStudentProgress.push({
                courseId: teachersCourseId,
                courseTopicData: currentCourseProgress,
              });
            }
          }
        }
        allStudentProgress.push({
          studentId: student.id,
          student: student,
          studentCoursesData: currentStudentProgress,
        });
      }

      //test did it work?
      console.log("FINISHED allStudentProgress ===> ", allStudentProgress);

      state.teachersStudentsProgress = allStudentProgress;
    },
    async getCourseProgressionDataForTeacher({ state, commit }) {
      // this method does...
      // 1 - get teachers courses
      // 2 - make an array of teachers course ids
      // 3 - go to database and get students that have course id as a collection
      // 4 - loop each student and for each student assigned courses that match a teachers course get all the topic and task data

      // get teachers courses. (returns array of course objects eg. id, title, description, image, mappedBy, contentBy)
      const myCourses = this.getters.getCoursesByWhoMadeThem(state.person.id);
      // make an array of course.id's
      let teachersCourseIds = myCourses.map((course) => course.id);
      // console.log("teachersCourseIds : ", teachersCourseIds);

      // search people database where assignedCourses arrayContains
      const studentsInTeachersCourses = [];
      for (const course of myCourses) {
        // get all work for review
        const querySnapshot = await db
          .collection("people")
          .where("assignedCourses", "array-contains-any", teachersCourseIds)
          .get();

        for (const doc of querySnapshot.docs) {
          studentsInTeachersCourses.push(doc.data());
        }
      }
      console.log("studentsInTeachersCourses : ", studentsInTeachersCourses);

      //TODO: there are duplicates of students in studentsInTeachersCourses, even though array-contains-any is supposed to be de-duped (https://firebase.google.com/docs/firestore/query-data/queries#array-contains-any)
      // flatten array to remove duplicate students
      // const flatStudents = getUniqueListBy(studentsInTeachersCourses, "email");
      const ids = studentsInTeachersCourses.map((o) => o.id);
      const flatStudents = studentsInTeachersCourses.filter(
        ({ id }, index) => !ids.includes(id, index + 1)
      );
      console.log("flat students", flatStudents);

      // allStudentProgress
      let allStudentProgress = [];

      // for each of the students, check if their assignedCourses matches teachers courses
      for (const student of flatStudents) {
        // new student. reset array
        let currentStudentProgress = [];

        for (var x = 0; x < student.assignedCourses.length; x++) {
          // check which assignedCourse matches with teacher
          for (var y = 0; y < teachersCourseIds.length; y++) {
            const teachersCourseId = teachersCourseIds[y];
            if (student.assignedCourses[x] == teachersCourseId) {
              // there is a match! get these tasks from db

              // new course. reset array
              let currentCourseProgress = [];
              // reset task count (task count is Y axes of chart. ie. line increments as you complete tasks)
              let taskCount = 0;

              const studentTaskQuerySnapshot = await db
                .collection("people")
                .doc(student.id)
                .collection(teachersCourseId)
                .get();

              // sort topics by topic.topicCreatedTimestamp (so that y axes: taskCount is close to being in order)
              let sortedTopics = studentTaskQuerySnapshot.docs.sort((a, b) =>
                a.data().topicCreatedTimestamp > b.data().topicCreatedTimestamp
                  ? 1
                  : -1
              );
              // console.log("sortedTopics: ", sortedTopics.data());

              for (const topic of sortedTopics) {
                // console.log("sorted topic: ", topic.data());
                // new topic. reset array
                let currentTopicProgress = [];

                // get task data for each topic
                const topicQuerySnapshot = await db
                  .collection("people")
                  .doc(student.id)
                  .collection(teachersCourseId)
                  .doc(topic.id)
                  .collection("tasks")
                  // only get tasks with completed OR inreview status
                  .where("taskStatus", "in", [
                    "completed",
                    "inreview",
                    "active",
                  ])
                  .orderBy("taskStartedTimestamp")
                  .get();

                for (const task of topicQuerySnapshot.docs) {
                  taskCount++;
                  // topicData.push(task.data());
                  currentTopicProgress.push({
                    x: task.data().taskStartedTimestamp,
                    y: taskCount,
                    courseId: teachersCourseId,
                    topicId: topic.id,
                    taskTitle: task.data().title,
                    taskStatus: "started",
                    task: task.data(),
                  });
                  currentTopicProgress.push({
                    x: task.data().taskCompletedTimestamp
                      ? task.data().taskCompletedTimestamp
                      : task.data().taskSubmittedForReviewTimestamp,
                    y: taskCount,
                    courseId: teachersCourseId,
                    topicId: topic.id,
                    taskTitle: task.data().title,
                    taskStatus: task.data().taskStatus,
                    task: task.data(),
                  });
                }
                currentCourseProgress.push({
                  topicId: topic.id,
                  topic: topic.data(),
                  topicTitle: topic.data().label,
                  topicTaskData: currentTopicProgress,
                });
              }

              currentStudentProgress.push({
                courseId: teachersCourseId,
                courseTopicData: currentCourseProgress,
              });
            }
          }
        }
        allStudentProgress.push({
          studentId: student.id,
          student: student,
          studentCoursesData: currentStudentProgress,
        });
      }

      //test did it work?
      console.log("FINISHED allStudentProgress ===> ", allStudentProgress);

      state.teachersStudentsProgress = allStudentProgress;
    },

    async getAssignedEdgesByPersonId({ state }, personId) {
      const personsAssignedEdges = [];
      // get the courseId from assignedCourses
      const doc = await db.collection("people").doc(personId).get();
      // loop array of assigned courses
      if (doc.data().assignedCourses) {
        for (const courseId of doc.data().assignedCourses) {
          const subQuerySnapshot = await db
            .collection("courses")
            .doc(courseId)
            .collection("map-edges")
            .get();

          personsAssignedEdges.push(
            ...subQuerySnapshot.docs.map((subDoc) => {
              const edge = subDoc.data();
              return edge;
            })
          );
        }
      }
      state.personsAssignedEdges = personsAssignedEdges; // source of truth
    },

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
    // bind tasks by topic id
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
    // bind persons tasks by topic id
    bindPersonsTasksByTopicId: firestoreAction(
      ({ bindFirestoreRef }, payload) => {
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
    async getTaskByTaskId({ state }, payload) {
      console.log("payload from getTaskByTaskId", payload);
      await db
        .collection("courses")
        .doc(payload.courseId)
        .collection("topics")
        .doc(payload.topicId)
        .collection("tasks")
        .doc(payload.taskId)
        .get()
        .then((doc) => {
          return doc.data();
        });
    },
    // bind courses requests for help
    bindRequestsForHelp: firestoreAction(({ bindFirestoreRef }, payload) => {
      return bindFirestoreRef(
        "requestsForHelp",
        db
          .collection("courses")
          .doc(payload.courseId)
          // .collection("topics")
          // .doc(payload.topicId)
          // .collection("tasks")
          // .doc(payload.taskId)
          .collection("requestsForHelp")
          .orderBy("requestSubmittedTimestamp")
      );
    }),
    // bind courses requests for help
    bindSpecificTeachersRequestsForHelp: firestoreAction(
      ({ bindFirestoreRef }, personId) => {
        // const myCourses = this.getters.getCoursesByWhoMadeThem(personId);

        return bindFirestoreRef(
          "teachersRequestsForHelp",
          db
            .collection("courses")
            .where("mappedBy.personId", "==", personId)
            .collection("requestsForHelp")
            .where("requestsForHelpStatus", "==", "unanswered")
          // .doc(payload.topicId)
          // .collection("tasks")
          // .doc(payload.taskId)
          // .collection("requestsForHelp")
          // .orderBy("taskCreatedTimestamp")
        );
      }
    ),
    async getRequestsForHelpByTeachersId({ state }, personId) {
      const myCourses = this.getters.getCoursesByWhoMadeThem(personId);

      const allRequestsForHelp = [];
      for (const course of myCourses) {
        // get all work for review
        const querySnapshot = await db
          .collection("courses")
          .doc(course.id)
          .collection("requestsForHelp")
          .where("requestForHelpStatus", "==", "unanswered")
          // .orderBy("requestSubmittedTimestamp")
          .get();

        for (const doc of querySnapshot.docs) {
          allRequestsForHelp.push(doc.data());
        }
      }
      state.teachersRequestsForHelp = allRequestsForHelp;
    },

    async getCohortsByPersonId({ commit, dispatch }, person) {
      await db
        .collection("cohorts")
        .where(person.accountType + "s", "array-contains", person.id)
        .onSnapshot((querySnapShot) => {
          const cohorts = querySnapShot.docs.map((doc) => {
            return {
              id: doc.id,
              ...doc.data(),
            };
          });
          commit("setCohorts", cohorts);
          dispatch("getOrganisationsByCohorts", cohorts);
        });
    },

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

      console.log("orgs: ", orgs);
      commit("setOrganisations", orgs);
    },

    async setCurrentCohort({ commit }, cohort) {
      await db
        .collection("cohorts")
        .doc(cohort.id)
        .onSnapshot((doc) => {
          console.log("setting cohort");
          const cohort = {
            id: doc.id,
            ...doc.data(),
          };
          commit("setCurrentCohort", cohort);
        });
    },
    // bind the PEOPLE that are in a course
    bindPeopleInCourse: firestoreAction(({ bindFirestoreRef }, courseId) => {
      return bindFirestoreRef(
        "peopleInCourse",
        db
          .collection("people")
          .where("assignedCourses", "array-contains", courseId)
      );
    }),
    // bind the COHORTS that are in a course
    bindCohortsInCourse: firestoreAction(({ bindFirestoreRef }, courseId) => {
      return bindFirestoreRef(
        "cohortsInCourse",
        db.collection("cohorts").where("courses", "array-contains", courseId)
      );
    }),
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
