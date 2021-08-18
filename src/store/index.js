import Vue from "vue";
import Vuex from "vuex";

import { db } from "./firestoreConfig";
import { vuexfireMutations, firestoreAction } from "vuexfire";

// import { courses } from "../mocks/courses";
import {
  mercury,
  venus,
  earth,
  mars,
  jupiter,
  saturn,
  uranus,
  neptune,
  pluto,
} from "../mocks/galaxies";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    count: 0,
    courses: [],
    cohorts: [],
    organisations: [],
    students: [],
    currentCourseId: "",
    currentCohortId: "",
    // galaxies: [mercury, venus, earth]
  },
  getters: {
    courses: (state) => state.courses,
    getCourseById: (state) => (id) => {
      return state.courses.find((course) => course.id === id);
    },
    getCohortById: (state) => (id) => {
      return state.cohorts.find((cohort) => cohort.id === id);
    },
    getTasksByCourseId: (state) => (id) => {
      const course = state.courses.find((course) => course.id === id);
      return course.tasks;
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
      cohort.courses.forEach(courseId => {
        // console.log("courseId = ", courseId);
        const courseObj = state.courses.find(course => course.id == courseId)
        // console.log("courses obj = ", courseObj);
        cohortsCoursesArrOfObj.push(courseObj) 
      });
      // console.log("cohort courses = ", cohortsCoursesArrOfObj);
      return cohortsCoursesArrOfObj
    },

    // completedCourses: (state) => {
    //   return state.courses.filter(course => course.status.completed)
    // }
    // completedCoursesCount: (state, getters) => {
    //   return getters.doneTodos.length
    // }

    // galaxies: (state) => state.galaxies,
  },
  mutations: {
    ...vuexfireMutations,
    setCurrentCourseId(state, courseId) {
      state.currentCourseId = courseId;
    },
    setCurrentCohortId(state, cohortId) {
      state.currentCohortId = cohortId;
    },
  },
  actions: {
    bindCourses: firestoreAction(({ bindFirestoreRef }) => {
      return bindFirestoreRef("courses", db.collection("courses"));
    }),
    bindCohorts: firestoreAction(({ bindFirestoreRef }) => {
      return bindFirestoreRef("cohorts", db.collection("cohorts"));
    }),
    bindOrganisations: firestoreAction(({ bindFirestoreRef }) => {
      return bindFirestoreRef("organisations", db.collection("organisations"));
    }),
    // bindStudents: firestoreAction(({ bindFirestoreRef }) => {
    //   return bindFirestoreRef("students", db.collection("students"));
    // }),
  },
});
