import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import vuetify from "./plugins/vuetify";
import store from "./store";
import firebase from "firebase";

Vue.config.productionTip = false;

firebase.auth().onAuthStateChanged((user) => {
  store.dispatch("setUser", user);
  store.dispatch("getPersonById", user.uid);
});

new Vue({
  router,
  vuetify,
  store,
  render: (h) => h(App),
}).$mount("#app");
