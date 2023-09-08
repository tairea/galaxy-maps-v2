import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";
import GalaxyList from "../views/GalaxyList.vue";
import GalaxyView from "../views/GalaxyView.vue";
import SolarSystemView from "../views/SolarSystemView.vue";
import CohortView from "../views/CohortView.vue";
import CohortList from "../views/CohortList.vue";
import CohortListV2 from "../views/CohortListV2.vue";
import AllStudentsView from "../views/AllStudentsView.vue";
import UserDashboard from "../views/UserDashboard.vue";
// import Login from "../components/Login.vue";
// import VerifyEmail from "../views/VerifyEmail.vue";
// import ResetPassword from "../views/ResetPassword.vue";
// import Register from "../views/Register.vue";
// import EmailSignIn from "../components/EmailSignIn.vue";
import LandingPage from "../views/LandingPage.vue";

import firebase from "firebase";
import store from "../store";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
    children: [
      {
        path: "", 
        name: "GalaxyList",
        component: GalaxyList,
        props: true,
      },
      {
        path: "login",
        name: "Login",
        component: LandingPage,
      },
      {
        path: "verify",
        name: "Verify",
        component: LandingPage,
      },
      {
        path: "reset",
        name: "Reset",
        component: LandingPage,
      },
      {
        path: "register",
        name: "Register",
        component: LandingPage,
      },
      {
        path: "cohorts",
        name: "CohortsList",
        // component: CohortList,
        component: CohortListV2,
        meta: {
          authRequired: true,
        },
      },
      {
        path: "students",
        name: "Students",
        component: AllStudentsView,
        meta: {
          authRequired: true,
        },
      },
      {
        path: "cohort/:cohortId/:cohortName",
        name: "CohortView",
        component: CohortView,
        meta: {
          authRequired: true,
        },
        props: true,
      },
      {
        path: "dashboard",
        name: "Dashboard",
        component: UserDashboard,
        meta: {
          authRequired: true,
        },
      },
      {
        path: "galaxy/:courseId",
        name: "GalaxyView",
        component: GalaxyView,
        meta: {
          authRequired: true,
        },
        props: true,
      },
      {
        path: "system/:topicId",
        name: "SolarSystemView",
        component: SolarSystemView,
        meta: {
          authRequired: true,
        },
        props: true,
      },
      {
        path: ":slug", 
        name: "GalaxyList",
        component: GalaxyList,
        props: true,
      },
    ],
  },

  // {
  //   path: "/email_signin",
  //   name: "EmailSignIn",
  //   component: EmailSignIn,
  // },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

// 
const initialAuth = new Promise((resolve, reject) => {
  const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
    unsubscribe();
    resolve(user);
  }, reject);
});

router.beforeEach(async (to, from, next) => {
  await initialAuth;
  if (from.path !== '/') store.commit('set_from', from.path);
  if (to.matched.some((record) => record.meta.authRequired)) {
    if (store.getters.user.loggedIn) {
      next();
    } else {
      alert("You must be logged in to see this page");
      next({
        path: "/login",
      });
    }
  } else {
    next();
  }
});

export default router;
