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
      //get courses
      let count = 0
      await db.collection("courses")
        .get()
        .then((querySnapshot) => {
          
          
          // get the topics (nodes) in that course
          querySnapshot.forEach((doc) => {
            
            db.collection("courses")
              .doc(doc.id)
              .collection("map-nodes")
              .get()
              .then((subQuerySnapshot) => {
                
                subQuerySnapshot.forEach((subDoc) => {
                  // push each subDoc aka map-node into allNodes
                  const topicNodeFromDb = subDoc.data()
                  // console.log("topicNodeFromDb",topicNodeFromDb)
                  // modify x y coords offset by 200px to for a grid of galaxies
                  // console.log("count",count)
                  // if (count !== 0) {                    
                  //   topicNodeFromDb.x = topicNodeFromDb.x + (count * 1000) 
                  // }
                  // topicNodeFromDb.group = count
                  topicNodeFromDb.courseId = doc.id
                  allNodes.push(topicNodeFromDb);
                });
                count++
              })
              .catch((error) => {
                console.log("Error getting documents: ", error);
              });
              
          });
        });
        // console.log("all nodes from Firestore: ", allNodes);
        state.allNodes = allNodes
    },
     getAllEdges({state}) {
      const allEdges = [];
      db.collection("courses")
        .get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            // doc.data() is never undefined for query doc snapshots
             db.collection("courses")
              .doc(doc.id)
              .collection("map-edges")
              .get()
              .then((subQuerySnapshot) => {
                subQuerySnapshot.forEach((subDoc) => {
                  // push each subDoc aka map-node into allNodes
                  allEdges.push(subDoc.data());
                });
              })
              .catch((error) => {
                console.log("Error getting documents: ", error);
              });
          });
          state.allEdges = allEdges
        });
    },
  },
});
