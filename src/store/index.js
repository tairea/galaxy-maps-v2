import Vue from "vue";
import Vuex from "vuex";

import { db } from "./firestoreConfig";
import { vuexfireMutations, firestoreAction } from "vuexfire";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    count: 0,
    courses: [],
    topics: [],
    cohorts: [],
    organisations: [],
    students: [],
    currentCourseId: "",
    currentTopicId: "",
    currentCohortId: "",
    currentCourseNodes: [],
    currentCourseEdges: [],
    allNodes: [],
    allNodesLength: 0,
    allEdges: [],
    allNodesForDisplay: [],
  },
  getters: {
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
    getCohortsInThisCourse: (state) => (id) => {
      //go to cohorts, and check if they in courses with this id
      let cohortsInCourse = state.cohorts.filter((cohort) =>
        cohort.courses.some((courseId) => courseId == id)
      );
      return cohortsInCourse;
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
      let studentsInCohort = [];
      state.students.forEach((student) => {
        // if student is enrolled in this cohort...
        if (student.enrolledCohorts.some((cohortId) => cohortId === id)) {
          // push them into array
          studentsInCohort.push(student);
        }
      });
      return studentsInCohort;
    },
    //
    // completedCourses: (state) => {
    //   return state.courses.filter(course => course.status.completed)
    // }
  },
  mutations: {
    ...vuexfireMutations,
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
      state.allNodes = newNodePositions
    },
    updateAllNodesForDisplay(state, newNodePositions) {
      state.allNodesForDisplay = newNodePositions
    },
    clearAllNodes(state) {
      console.log(" ======== clear all nodes before bind ======== ")
      state.allNodes = []
    }
  },
  actions: {
    bindCourses: firestoreAction(({ bindFirestoreRef }) => {
      return bindFirestoreRef("courses", db.collection("courses"), {
        maxRefDepth: 2,
      });
    }),
    bindCohorts: firestoreAction(({ bindFirestoreRef }) => {
      return bindFirestoreRef("cohorts", db.collection("cohorts"));
    }),
    bindOrganisations: firestoreAction(({ bindFirestoreRef }) => {
      return bindFirestoreRef("organisations", db.collection("organisations"));
    }),
    bindStudents: firestoreAction(({ bindFirestoreRef }) => {
      return bindFirestoreRef("students", db.collection("people"));
    }),
    bindNodes: firestoreAction(({ bindFirestoreRef }, id) => {
      return bindFirestoreRef(
        "currentCourseNodes",
        db
          .collection("courses")
          .doc(id)
          .collection("map-nodes")
      );
    }),
    bindEdges: firestoreAction(({ bindFirestoreRef }, id) => {
      return bindFirestoreRef(
        "currentCourseEdges",
        db
          .collection("courses")
          .doc(id)
          .collection("map-edges")
      );
    }),
    bindTopics: firestoreAction(({ bindFirestoreRef }, id) => {
      return bindFirestoreRef(
        "topics",
        db
          .collection("courses")
          .doc(id)
          .collection("topics")
      );
    }),
    async getAllNodes({state}) {
      const allNodes = [];
  
      const querySnapshot = await db.collection("courses").get()
      
      // get the topics (nodes) in that course
      for (const doc of querySnapshot.docs) {
        const subQuerySnapshot = await db.collection("courses")
          .doc(doc.id)
          .collection("map-nodes")
          .get();

        allNodes.push(...subQuerySnapshot.docs.map((subDoc) => {
          const node = subDoc.data();
          node.courseId = doc.id; // add course id to nodes list for some reason
          return node;
        }));
      }

      // console.log("all nodes from Firestore: ", allNodes);
      state.allNodes = allNodes // source of truth
      state.allNodesForDisplay = allNodes // store all nodes
    },
    async getAllEdges({state}) {
      const allEdges = [];
      const querySnapshot = await db.collection("courses").get();

      for (const doc of querySnapshot.docs) {
        // doc.data() is never undefined for query doc snapshots
        const subQuerySnapshot = await db.collection("courses")
        .doc(doc.id)
        .collection("map-edges")
        .get();


        allEdges.push(...subQuerySnapshot.docs.map((subDoc) => subDoc.data()))
      }

      state.allEdges = allEdges
    },
  },
});
