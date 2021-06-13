import Vue from "vue";
import Vuex from "vuex";

import { courses } from "../mocks/courses";
import { mercury, venus, earth, mars, jupiter, saturn, uranus, neptune, pluto} from "../mocks/galaxies";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    count: 0,
    courses: courses,
    galaxies: [mercury, venus, earth, mars, jupiter, saturn ]
  },
  getters: {
    courses: (state) => state.courses,
    galaxies: (state) => state.galaxies,
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
