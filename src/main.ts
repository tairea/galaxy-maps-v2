import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import vuetify from "./plugins/vuetify";
import store from "./store";
import firebase from "firebase";
import './css/main.scss';

Vue.config.productionTip = false;

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    // check if email has been verified

    // email has been verified, go to login

    user?.getIdTokenResult().then(idTokenResult => {
      Object.assign(user, {admin: idTokenResult.claims.admin})
      store.dispatch("setUser", user);
      store.dispatch("getPersonById", user.uid);
    })
  } else {
    store.dispatch("setUser", user);
    store.dispatch("getPersonById", user);
  }
});

new Vue({
  router,
  vuetify,
  store,
  render: (h) => h(App),
}).$mount("#app");
