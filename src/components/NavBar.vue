<template>
  <div class="topCenterBar">
      <div class="inner">
        <v-tabs
          fixed-tabs
          background-color="transparent"
          dark
          slider-color="neon"
          v-model="activeTab"
          height=""
        >
          <v-tab v-for="tab in tabs" :key="tab.id" :to="tab.route" exact>
            <div class="neon--text tab">{{ tab.name }}</div>
          </v-tab>

        </v-tabs>
      </div>
    </div>
</template>

<script>
export default {
  name: "NavBar",

 data() {
    return {
      activeTab: `/home/galaxy`,
      tabs: [
        { id: 1, name: "GALAXIES", route: `/galaxy` },
        { id: 2, name: "SCHOOLS", route: `/schools` },
        { id: 3, name: "ALL STUDENTS", route: `/students` },
      ],
    };
  },
};
</script>

<style lang="scss">

.topCenterBar {
  position: absolute;
  top:0;
  left: 50%;
  transform: translate(-50%, 0%);

  background: var(--v-background-darken1);
  width: 50%;
  padding: 10px;
  clip-path: polygon(0 0, 100% 0, 90% 100%, 10% 100%);

  display: flex;
  justify-content: center;
  color: white;
  z-index: 100;

  .inner {
    width: 80%;
    display: flex;
    justify-content: space-around;
    align-items: center;
    // border: solid 5px yellow;
  }
}

.neon {
  color: var(--v-neon);
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
