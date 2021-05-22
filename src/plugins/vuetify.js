import Vue from "vue";
import Vuetify from "vuetify/lib/framework";

import colors from "vuetify/lib/util/colors";

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    options: {
        customProperties: true
    },
    themes: {
      light: {
        primary: colors.grey.darken4, // #E53935
        secondary: colors.red.lighten4, // #FFCDD2
        accent: colors.indigo.base, // #3F,51B5
        neon: colors.green.accent3,
        background: colors.grey.darken3,
      },
    },
  },
});
