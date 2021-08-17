import Vue from "vue";
import Vuetify from "vuetify/lib/framework";

import colors from "vuetify/lib/util/colors";

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    dark: true,
    options: {
        customProperties: true
    },
    themes: {
      light: {
        primary: colors.grey.darken4, // #E53935
        // secondary: colors.red.lighten4, // #FFCDD2
        // accent: colors.indigo.base, // #3F51B5
        background: "#f7f7ff",
        subBackground: "#DDE0E4",
        baseAccent: "#495867",
        galaxyAccent: "#fe5f55",
        missionAccent: "#577399",
      },
      dark: {
        primary: colors.grey.darken4,
        // primary: colors.green.accent3,
        background: colors.grey.darken3,
        subBackground: "#000",
        baseAccent: colors.green.accent3,
        galaxyAccent: "#E269CF",
        missionAccent: "#69A1E2",
      },
    },
  },
});
