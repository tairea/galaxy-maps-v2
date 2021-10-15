import Vue from "vue";
import Vuex from "vuex";

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
    currentCourseId: "",
    currentTopicId: "",
    currentCohortId: "",
    currentCourseNodes: [],
    currentCourseEdges: [],
    allNodes: [],
    allEdges: [],
    allNodesForDisplay: [],
    personsNodes: [],
    personsNodesForDisplay: [],
    personsEdges: [],
  },
  getters: {
    user: (state) => state.user,
    person: (state) => state.person,
    courses: (state) => state.courses,
    getCourseById: (state) => (id) => {
      return state.courses.find((course) => course.id === id);
    },
    getTopicById: (state) => (id) => {
      return state.topics.find((topic) => topic.id === id);
    },
    getCohortById: (state) => (id) => {
      return state.cohorts.find((cohort) => cohort.id === id);
    },
    getOrganisationById: (state) => (id) => {
      return state.organisations.find((organisation) => organisation.id === id);
    },
    getTasksByTopicId: (state) => (id) => {
      const topic = state.topics.find((topic) => topic.id === id);
      return topic.tasks;
    },
    getCohortsByOrganisationId: (state) => (id) => {
      // TODO:
      if (id) {
        return state.cohorts.filter((cohort) => cohort.organisation === id);
      } else {
        return state.cohorts.filter((cohort) => cohort.organisation == "");
      }
    },
    getCoursesByCohortId: (state) => (id) => {
      //TODO: not complete
      state.cohorts.filter((cohort) => cohort.id === id);
    },
    getPersonById: (state) => (id) => {
      state.people.filter((person) => person.id === id);
    },
    getCohortsInThisCourse: (state) => (id) => {
      //go to cohorts, and check if they in courses with this id
      let cohortsInCourse = state.cohorts.filter((cohort) => {
        if (cohort.courses) {
          cohort.courses.some((courseId) => courseId == id);
        }
      });
      return cohortsInCourse;
    },
    getOrganisationsInThisCourse: (state) => (id) => {
      console.log("state.organisations", state.organisations);
      let organisationsInCourse = state.organisations.filter((organisation) => {
        if (organisation.courses) {
          organisation.courses.some((courseId) => courseId == id);
        }
      });
      return organisationsInCourse;
    },
    getPeopleInThisCourse: (state) => (id) => {
      console.log("state.people", state.people);
      let peopleInCourse = state.people.filter((person) => {
        if (person.assignedCourses) {
          person.assignedCourses.some((courseId) => courseId == id);
        }
      });
      return peopleInCourse;
    },
    getCoursesInThisCohort: (state) => (id) => {
      //go to cohorts, and check if they in courses with this id
      const cohort = state.cohorts.find((cohort) => cohort.id === id);
      const cohortsCoursesArrOfObj = [];
      console.log("cohort = ", cohort);
      cohort.courses.forEach((courseId) => {
        // console.log("courseId = ", courseId);
        const courseObj = state.courses.find((course) => course.id == courseId);
        // console.log("courses obj = ", courseObj);
        cohortsCoursesArrOfObj.push(courseObj);
      });
      // console.log("cohort courses = ", cohortsCoursesArrOfObj);
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
    setCurrentCourseId(state, courseId) {
      state.currentCourseId = courseId;
    },
    setCurrentTopicId(state, topicId) {
      state.currentTopicId = topicId;
    },
    setCurrentCohortId(state, cohortId) {
      state.currentCohortId = cohortId;
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
    clearAllNodes(state) {
      // console.log(" ======== clear all nodes before bind ======== ")
      state.allNodes = [];
    },
  },
  actions: {
    setUser({ commit }, user) {
      commit("SET_LOGGED_IN", user !== null);
      if (user) {
        console.log("SETTING USER",user.uid)
        commit("SET_USER", {
          displayName: user.displayName,
          email: user.email,
          id: user.uid
        });
      } else {
        commit("SET_USER", null);
      }
      console.log("signed in user:", user.email);
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
    bindAllCourseNodes: firestoreAction(({ bindFirestoreRef }, id) => {
      return bindFirestoreRef(
        "currentCourseNodes",
        db
          .collection("courses")
          .doc(id)
          .collection("map-nodes")
      );
    }),
    bindAllCourseEdges: firestoreAction(({ bindFirestoreRef }, id) => {
      return bindFirestoreRef(
        "currentCourseEdges",
        db
          .collection("courses")
          .doc(id)
          .collection("map-edges")
      );
    }),
    bindAllCourseTopics: firestoreAction(({ bindFirestoreRef }, id) => {
      return bindFirestoreRef(
        "topics",
        db
          .collection("courses")
          .doc(id)
          .collection("topics")
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
    // ===== Firestore - BIND by USER
    async getPersonById({ state }, id) {
      console.log("user id:",id)
      await db.collection("people").doc(id).get().then((doc) => {
        state.person = doc.data()
      })
    },
    async getNodesByPersonId({ state }, personId) {
      const personsNodes = [];

      const querySnapshot = await db.collection("courses").where("mappedBy.personId", "==", personId).get()

      let count = 0;

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
            return node;
          })
        );
        count++;
      }
      console.log("personsNodes from Firestore: ", personsNodes);
      state.personsNodes = personsNodes; // source of truth
      state.personsNodesForDisplay = personsNodes; // store all nodes
    },
    async getEdgesByPersonId({ state }, personId) {
      const personsEdges = [];

      const querySnapshot = await db.collection("courses").where("mappedBy.personId", "==", personId).get();

      for (const doc of querySnapshot.docs) {
        // doc.data() is never undefined for query doc snapshots
        const subQuerySnapshot = await db
          .collection("courses")
          .doc(doc.id)
          .collection("map-edges")
          .get();

          personsEdges.push(...subQuerySnapshot.docs.map((subDoc) => subDoc.data()));
      }

      state.personsEdges = personsEdges;
    },
    bindCoursesByPersonId: firestoreAction(({ bindFirestoreRef }, personId) => {
      return bindFirestoreRef(
        "courses",
        db
          .collection("courses")
          .where("mappedBy.personId", "==", personId)
      );
    }),
  },
});
