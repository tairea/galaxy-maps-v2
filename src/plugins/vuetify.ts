import Vue from "vue";
import Vuetify from "vuetify";

Vue.use(Vuetify);

export default new Vuetify({
  icons: {
    iconfont: "mdiSvg", // 'mdi' || 'mdiSvg' || 'md' || 'fa' || 'fa4' || 'faSvg'
  },
  theme: {
    dark: true,
    options: {
      customProperties: true,
    },
    themes: {
      light: {
        primary: "#212121", //colors.grey.darken4
        // secondary: colors.red.lighten4, // #FFCDD2
        // accent: colors.indigo.base, // #3F51B5
        background: "#f7f7ff",
        subBackground: "#DDE0E4",
        baseAccent: "#495867",
        galaxyAccent: "#fe5f55",
        missionAccent: "#577399",
        cohortAccent: "#fe5f55",
      },
      dark: {
        primary: "#f7f7f7", //
        background: "#141E30", //colors.grey.darken3
        subBackground: "#000",
        baseAccent: "#00E676", //colors.green.accent3
        galaxyAccent: "#E269CF",
        missionAccent: "#69A1E2",
        cohortAccent: "#FAF200",
      },
    },
  },
});
