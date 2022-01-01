import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";
import GalaxyList from "../views/GalaxyList.vue";
import GalaxyView from "../views/GalaxyView.vue";
import SolarSystemView from "../views/SolarSystemView.vue";
import CohortView from "../views/CohortView.vue";
import CohortList from "../views/CohortList.vue";
import StudentList from "../views/StudentList.vue";
import Login from "../views/Login.vue";
import ResetPassword from "../views/ResetPassword.vue";
import Register from "../views/Register.vue";
import LandingPage from "../views/LandingPage.vue";

import firebase from "firebase";
import store from "../store";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Landing",
    component: LandingPage,
  },
  {
    path: "/base",
    name: "Home",
    meta: {
      authRequired: true,
    },
    component: Home,
    children: [
      {
        path: "galaxies/:mineOrAssignedOrAll", 
        name: "GalaxyList",
        component: GalaxyList,
        props: true,
      },
      {
        path: "cohorts",
        component: CohortList,
      },
      {
        path: "students",
        component: StudentList,
      },
    ],
  },
  {
    path: "/login",
    name: "Login",
    component: Login,
  },
  {
    path: "/reset",
    name: "Reset",
    component: ResetPassword,
  },
  {
    path: "/register",
    name: "Register",
    component: Register,
  },
  {
    path: "/galaxyList",
    name: "GalaxyList",
    component: GalaxyList,
    meta: {
      authRequired: true,
    },
  },
  {
    path: "/galaxy/:courseId",
    name: "GalaxyView",
    component: GalaxyView,
    props: true,
  },
  {
    path: "/system/:topicId",
    name: "SolarSystemView",
    component: SolarSystemView,
    props: true,
  },
  {
    path: "/cohort/:cohortId/:cohortName",
    name: "CohortView",
    component: CohortView,
    props: true,
  },
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
  if (to.matched.some((record) => record.meta.authRequired)) {
    await initialAuth;

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
