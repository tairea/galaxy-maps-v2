import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import vuetify from "./plugins/vuetify";
import store from "./store";
import firebase from "firebase";
import './css/main.scss';
import { startPresenceSystem } from './presence'

Vue.config.productionTip = false;

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    user?.getIdTokenResult().then(idTokenResult => {
      Object.assign(user, {admin: idTokenResult.claims.admin})
      store.dispatch("setUser", user);
      store.dispatch("getPersonById", user.uid);
    })
    if (user.emailVerified) {
      startPresenceSystem(user.uid)
    }
  } else {
    store.commit("RESET_STATE")
  }
});

new Vue({
  router,
  vuetify,
  store,
  render: (h) => h(App),
}).$mount("#app");
