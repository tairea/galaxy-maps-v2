import Vue from "vue";
import Vuex from "vuex";

import { db } from './firestoreConfig';
import { vuexfireMutations, firestoreAction } from 'vuexfire'


// import { courses } from "../mocks/courses";
import { mercury, venus, earth, mars, jupiter, saturn, uranus, neptune, pluto} from "../mocks/galaxies";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    count: 0,
    courses: [],
    currentCourseId: ""
    // galaxies: [mercury, venus, earth]
  },
  getters: {
    courses: (state) => state.courses,
    getCourseById: (state) => (id) => {
      console.log("IN STORE: Getting course by id: " + id)
      return state.courses.find(course => course.id === id)
    },
    getTasksByCourseId: (state) => (id) => {
      console.log("IN STORE: Getting tasks by course id: " + id)
      const course = state.courses.find(course => course.id === id)
      return course.tasks
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
    setCurrentCourseId (state, courseId) {
      state.currentCourseId = courseId
    }
  },
  actions: {
    bindCourses: firestoreAction(({ bindFirestoreRef }) => {
      return bindFirestoreRef("courses", db.collection("courses"));
    }),
  }
});
