<template>
  <section class="student-xp-section">
    <div class="pointsContainer">
      <div class="top" :class="studentOverview ? 'text-center' : ''">
        <p class="label">XP Points</p>
      </div>
      <div class="points">
        <!-- <p class="xpPoints">
          {{ student.xpPointsTotal }}
        </p> -->
        <XpPointsDialog
          :person="student"
          :xpPoints="student.xpPointsTotal ? student.xpPointsTotal : 0"
          :canManageXpPoints="true"
          :plain="!studentOverview"
          :studentOverview="studentOverview"
        />
      </div>
    </div>
    <!-- <div class="noPointsContainer">
      <p class="overline missionAccent--text text-center ma-0">no xp points</p>
    </div> -->
  </section>
</template>

<script>
import XpPointsDialog from "@/components/Dialogs/XpPointsDialog.vue";

export default {
  name: "StudentXpPoints",
  components: { XpPointsDialog },
  props: ["student", "studentOverview"],
  computed: {},
};
</script>

<style scoped>
.student-xp-section {
  max-width: 10%;
  min-width: 10%;
  padding: 2.5px;
  display: flex;
  height: 100%;

  .pointsContainer {
    display: flex;
    flex-direction: column;
    width: 100%;

    .top {
      height: auto;
      .label {
        color: var(--v-missionAccent-base);
        font-size: 0.6rem;
        text-transform: uppercase;
        margin: 1px;
        font-weight: bold;
      }
    }

    .points {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .xpPoints {
      font-size: 1.5rem;
      font-weight: 500;
      color: var(--v-baseAccent-base);
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      margin: 0;
    }
  }

  .noPointsContainer {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
  }
}
</style>
