import Vue from "vue";
import Vuex from "vuex";

import { courses } from "../mocks/courses";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    count: 0,
    courses: courses,
  },
  getters: {
    courses: (state) => state.courses,
  },
  mutations: {
    addCourse (state, payload) {
        console.log("from store payload", payload)
        state.courses.push(payload)
      }
  },
//   actions: {
//     addCourse (context) {
//       context.commit('addCourse')
//     }
//   }
});
