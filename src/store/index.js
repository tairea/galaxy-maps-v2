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
    personsAssignedNodes: [],
    personsAssignedNodesForDisplay: [],
    personsEdges: [],
    personsAssignedEdges: [],
    personsTopics: [],
    topicsTasks: [],
  },
  getters: {
    user: (state) => state.user,
    person: (state) => state.person,
    courses: (state) => state.courses,
    getCourseById: (state) => (id) => {
      return state.courses.find((course) => course.id === id);
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
    getTasksByTopicId: (state) => (id) => {
      const topic = state.topics.find((topic) => topic.id === id);
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
          return cohort.courses.some((courseId) => courseId == id);
        } else {
          return false;
        }
      });
      return cohortsInCourse;
    },
    getOrganisationsInThisCourse: (state) => (id) => {
      let organisationsInCourse = state.organisations.filter((organisation) => {
        if (organisation.courses) {
          return organisation.courses.some((courseId) => courseId == id);
        } else {
          return false;
        }
      });
      return organisationsInCourse;
    },
    getPeopleInThisCourse: (state) => (id) => {
      let peopleInCourse = state.people.filter((person) => {
        if (person.assignedCourses) {
          return person.assignedCourses.some((courseId) => courseId == id);
        } else {
          return false;
        }
      });
      return peopleInCourse;
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
    updatePersonsAssignedNodesForDisplay(state, newNodePositions) {
      state.personsAssignedNodesForDisplay = newNodePositions;
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
        console.log("authenticated user id: ", user.uid);
        console.log("authenticated user email:", user?.email);
        commit("SET_USER", {
          displayName: user.displayName,
          email: user.email,
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
    async getPersonById({ state }, id) {
      await db
        .collection("people")
        .doc(id)
        .get()
        .then((doc) => {
          state.person = doc.data();
          console.log("user data stored in state.person", doc.data());
        });
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
    // TODO: WIP (get assigned courses)
    async getAssignedNodesByPersonId({ state }, personId) {
      const personsAssignedNodes = [];
      // get the courseId from assignedCourses
      const doc = await db.collection("people").doc(personId).get();
      // loop array of assigned courses
      if (doc.data()?.assignedCourses) {
        for (const courseId of doc.data()?.assignedCourses) {
          // add assigned course to state.courses
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
        "courses",
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
          .orderBy("timestamp") // this is important to ordering the tasks in MissionList.vue
      );
    }),
    // bind persons tasks by topic id
    // bindPersonsTasksByTopicId: firestoreAction(
    //   ({ bindFirestoreRef }, payload) => {
    //     return bindFirestoreRef(
    //       "personsTopics",
    //       db
    //         .collection("people")
    //         .doc(payload.personId)
    //         .collection(payload.courseId)

    //     );
    //   }
    // ),
  },
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
