<template>
  <div class="topCenterBar">
    <div class="inner">
      <!-- Student tabs -->
      <v-tabs
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
      tabs: [
        { id: 1, name: "GALAXIES", route: `/base/galaxies` },
        { id: 2, name: "COHORTS", route: `/base/cohorts` },
        { id: 3, name: "DASHBOARD", route: `/base/dashboard` },
      ],
    };
  },
  methods: {
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
  width: 60%;
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
