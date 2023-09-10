import App from "@/App.vue";
import router from "@/router";
import vuetify from "@/plugins/vuetify";
import { startPresenceSystem } from "@/presence/index";
import useRootStore from "@/store/index";
import firebase from "firebase/compat/app";
import { createPinia, PiniaVuePlugin } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import Vue from "vue";
import VueRouter from "vue-router";
import "vue-router/types/vue.d.ts";
import VueTour from "vue-tour";

import "@/css/main.scss";
import "vue-tour/dist/vue-tour.css";

Vue.use(PiniaVuePlugin);
Vue.use(VueRouter);
Vue.use(VueTour);

Vue.config.productionTip = false;

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

firebase.auth().onAuthStateChanged((user) => {
  const rootStore = useRootStore();
  console.log("auth state changed");
  if (user) {
    user?.getIdTokenResult().then((idTokenResult) => {
      Object.assign(user, { admin: idTokenResult.claims.admin });
      rootStore.setUser(user);
      return rootStore.getPersonById(user.uid);
    });
    if (user.emailVerified) {
      startPresenceSystem(user.uid);
    }
  } else {
    rootStore.$reset();
  }
});

new Vue({
  router,
  vuetify,
  pinia,
  render: (h) => h(App),
}).$mount("#app");
