<template>
  <div id="assigned-info">
    <h2 class="assigned-label">Assigned</h2>
    <p class="assigned-status">No students assigned to this Galaxy</p>
  </div>
</template>

<script>
export default {
  name: "AssignedInfo",

  data() {
    return {
      assigned: {
        schools: {
          taiWananga: {
            classes: {
              l2DigitalTechnology: {
                studentNSNs: [123,456,789]
              }
            }
          }
        }
        
      },
    };
  },
};
</script>

<style lang="scss">

#assigned-info {
  width: calc(100% - 30px);
  // height: 400px;
  border: 1px solid var(--v-baseAccent-base);
  margin-top: 10%;
  padding: 20px;
  // background: var(--v-baseAccent-base);
  position: relative;
}

h1 {
  color: white;
}

.assigned-label {
  font-size: 0.8rem;
  color: var(--v-baseAccent-base);
  font-weight: 400;
  text-transform: uppercase;
  // ribbon label
  position: absolute;
  top: -1px;
  left: -1px;
  background-color: var(--v-baseAccent-base);
  color: var(--v-background-base);
  padding: 0px 15px 0px 5px;
  clip-path: polygon(0 0, 100% 0, 80% 100%, 0% 100%);
}

.assigned-status {
  margin-top: 10px;
  color: var(--v-baseAccent-base);
  text-transform: uppercase;
  font-size: 0.8rem;
  text-align: center;
  margin: 20px 0px;
}
</style>
