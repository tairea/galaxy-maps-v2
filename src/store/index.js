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
    // galaxies: []
  },
  getters: {
    courses: (state) => state.courses,
    galaxies: (state) => state.galaxies,
  },
  mutations: {
    ...vuexfireMutations,
    addCourse (state, payload) {
        console.log("from store payload", payload)
        state.courses.push(payload)
      }
  },
  actions: {
    bindCourses: firestoreAction(({ bindFirestoreRef }) => {
      return bindFirestoreRef("courses", db.collection("courses"));
    }),
  }
});
