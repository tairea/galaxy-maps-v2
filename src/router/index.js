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
import Register from "../views/Register.vue";

import firebase from "firebase";
import store from '../store'

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
    children: [
      {
        path: "galaxy", //selected tab by default
        component: GalaxyList,
        meta: {
          authRequired: true,
        },
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
    props: true
  },
  {
    path: "/solarsystem/:topicId",
    name: "SolarSystemView",
    component: SolarSystemView,
    props: true
  },
  {
    path: "/cohort/:cohortId/:cohortName",
    name: "CohortView",
    component: CohortView,
    props: true
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.authRequired)) {
    console.log("store.getters.user.loggedIn",store.getters.user.loggedIn)
    if (store.getters.user.loggedIn) {
      next();
    } else {
      alert('You must be logged in to see this page');
      next({
        path: '/login',
      });
    }
  } else {
    next();
  }
});

export default router;
