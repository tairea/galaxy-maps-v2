<template>
  <div class="topCenterBar">
    <div class="inner">
      <!-- Student tabs -->
      <v-tabs
        v-if="userType === 'student'"
        fixed-tabs
        background-color="transparent"
        dark
        slider-color="baseAccent"
        v-model="activeTab"
        height=""
      >
        <v-tab v-for="tab in tabsStudent" :key="tab.id" :to="tab.route">
          <div class="baseAccent--text tab">{{ tab.name }}</div>
        </v-tab>
      </v-tabs>
      <!-- Teacher tabs (user tabs + students) -->
      <v-tabs
        v-else-if="userType === 'teacher'"
        fixed-tabs
        background-color="transparent"
        dark
        slider-color="baseAccent"
        v-model="activeTab"
        height=""
      >
        <v-tab v-for="tab in tabsTeacher" :key="tab.id" :to="tab.route">
          <div class="baseAccent--text tab">{{ tab.name }}</div>
        </v-tab>
      </v-tabs>
      <!-- Admin tabs (user tabs + students + cohorts) -->
      <v-tabs
        v-else-if="userType === 'admin'"
        fixed-tabs
        background-color="transparent"
        dark
        slider-color="baseAccent"
        v-model="activeTab"
        height=""
      >
        <v-tab v-for="tab in tabsAdmin" :key="tab.id" :to="tab.route">
          <div class="baseAccent--text tab">{{ tab.name }}</div>
        </v-tab>
      </v-tabs>
      <!-- Admin tabs (user tabs + students + cohorts) -->
      <!-- <v-tabs
        v-else-if="userType === 'admin'"
        fixed-tabs
        background-color="transparent"
        dark
        slider-color="baseAccent"
        v-model="activeTab"
        height=""
      >
        <v-tab v-for="tab in tabsAdmin" :key="tab.id" :to="tab.route">
          <div class="baseAccent--text tab">{{ tab.name }}</div>
        </v-tab>
      </v-tabs> -->
      <!-- Normal user tabs -->
      <v-tabs
        v-else
        fixed-tabs
        background-color="transparent"
        dark
        slider-color="baseAccent"
        v-model="activeTab"
        height=""
      >
        <v-tab v-for="tab in tabs" :key="tab.id" :to="tab.route">
          <div class="baseAccent--text tab">{{ tab.name }}</div>
        </v-tab>
      </v-tabs>
    </div>
  </div>
</template>

<script>
export default {
  name: "NavBar",
  props: ["userType"],
  data() {
    return {
      activeTab: null,
      // studentActiveTab: `/base/assigned-galaxies`,
      tabsStudent: [
        { id: 3, name: "ASSIGNED GALAXIES", route: `/base/galaxies/assigned` },
        { id: 6, name: "COHORTS", route: `/base/cohorts` },
        { id: 5, name: "MY DASHBOARD", route: `/base/dashboard` },
        // { id: 4, name: "ALL GALAXIES", route: `/base/galaxies/all` },
      ],
      tabsTeacher: [
        { id: 1, name: "MY GALAXIES", route: `/base/galaxies/my` },
        { id: 7, name: "ALL GALAXIES", route: `/base/galaxies/all` },
        { id: 6, name: "COHORTS", route: `/base/cohorts` },
        { id: 9, name: "DASHBOARD", route: `/base/students` },
      ],
      tabsAdmin: [
        { id: 2, name: "ALL GALAXIES", route: `/base/galaxies/all` },
        { id: 8, name: "ALL COHORTS", route: `/base/cohorts` },
        { id: 9, name: "ALL STUDENTS", route: `/base/students` },
      ],
    };
  },
  methods: {
    // routeTo(path) {
    //   let assignedOrOwned = "";
    //   if (path == "/base/my-galaxies") {
    //     assignedOrOwned = "owned";
    //   } else if (path == "/base/assigned-galaxies") {
    //     assignedOrOwned = "assigned";
    //   }
    //   this.$router.push({
    //     name: "GalaxyList",
    //     params: {
    //       assignedOrOwned: assignedOrOwned,
    //     },
    //   });
    // },
  },
};
</script>

<style lang="scss">
.topCenterBar {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, 0%);

  background: var(--v-background-darken1);
  width: 50%;
  padding: 10px;
  clip-path: polygon(0 0, 100% 0, 90% 100%, 10% 100%);

  display: flex;
  justify-content: center;
  color: white;
  z-index: 200;

  .inner {
    width: 80%;
    display: flex;
    justify-content: space-around;
    align-items: center;
    // border: solid 5px yellow;
  }
}

.neon {
  color: var(--v-baseAccent-base);
}

.profilePic {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 50%;
}

.username {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 10px;
}

.tab {
  // font-size: 0.8rem;
}
</style>
