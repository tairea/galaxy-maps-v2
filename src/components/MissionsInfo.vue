<template>
  <div id="missions-info">
    <h2 class="missions-label">Missions</h2>
    <p v-if="missions.length > 0" class="missions-status">Missions: {{ missions.length }}</p>
    <p v-else class="missions-status">No Missions</p>
  </div>
</template>

<script>
export default {
  name: "MissionsInfo",
  props: ["missions"],
  data() {
    return {};
  },
};
</script>

<style lang="scss">
#missions-info {
  width: 90%;
  // height: 400px;
  border: 1px solid var(--v-missionAccent-base);
  margin-top: 10%;
  padding: 20px;
  position: relative;
}

h1 {
  color: white;
}

.missions-label {
  font-size: 0.8rem;
  font-weight: 400;
  text-transform: uppercase;
  // ribbon label
  position: absolute;
  top: -1px;
  left: -1px;
  background-color: var(--v-missionAccent-base);
  color: var(--v-background-base);
  padding: 0px 15px 0px 5px;
  clip-path: polygon(0 0, 100% 0, 80% 100%, 0% 100%);
}

.missions-status {
  margin-top: 10px;
  color: var(--v-missionAccent-base);
  text-transform: uppercase;
  font-size: 0.8rem;
  text-align: center;
  margin: 20px 0px;
}
</style>
