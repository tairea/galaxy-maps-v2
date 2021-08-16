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
        // primary: colors.grey.darken4, // #E53935
        // secondary: colors.red.lighten4, // #FFCDD2
        // accent: colors.indigo.base, // #3F51B5
        background: "#f7f7ff",
        subBackground: "#DDE0E4",
        baseAccent: "#495867",
        galaxyAccent: "#fe5f55",
        missionAccent: "#577399",
        // orbitBorder: "rgba(127, 255, 255, 0.1)",
        // orbitShadow: "#00000007"
      },
      dark: {
        background: colors.grey.darken3,
        subBackground: "#000",
        baseAccent: colors.green.accent3,
        galaxyAccent: "#E269CF",
        missionAccent: "#69A1E2",
        orbitBorder: "rgba(127, 255, 255, 0.1)",
        orbitShadow: "rgba(0, 255, 255, 0.05)",
      },
    },
  },
});
