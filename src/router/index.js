import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";
import GalaxyList from "../views/GalaxyList.vue";
import GalaxyView from "../views/GalaxyView.vue";
import SolarSystemView from "../views/SolarSystemView.vue";
import CohortView from "../views/CohortView.vue";
import CohortList from "../views/CohortList.vue";
import StudentList from "../views/StudentList.vue";

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
    path: "/galaxyList",
    name: "GalaxyList",
    component: GalaxyList,
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
  // {
  //   path: "/about",
  //   name: "About",
  //   // route level code-splitting
  //   // this generates a separate chunk (about.[hash].js) for this route
  //   // which is lazy-loaded when the route is visited.
  //   component: () =>
  //     import(/* webpackChunkName: "about" */ "../views/About.vue"),
  // },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

export default router;
