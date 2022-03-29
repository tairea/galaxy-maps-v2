<template>
  <div class="selected-mission-card">
    <v-row>
      <div class="mission-card">
        <div
          class="mission-section mission-section-overUnder"
          style="width: 50%"
        >
          <!-- VIDEO -->
          <div class="section-overUnder">
            <a
              v-if="task.video"
              :href="task.video"
              target="_blank"
              class="text-overline text-uppercase"
              >Video</a
            >
            <p
              v-else
              class="text-overline text-uppercase"
              style="color: #707070"
            >
              Video
            </p>
          </div>
          <!-- SLIDES -->
          <div class="section-overUnder">
            <a
              v-if="task.slides"
              :href="task.slides"
              target="_blank"
              class="text-overline text-uppercase"
              >Slides</a
            >
            <p
              v-else
              class="text-overline text-uppercase"
              style="color: #707070"
            >
              Slides
            </p>
          </div>
        </div>

        <!-- SUBMIT WORK -->
        <!-- <div
          class="mission-section d-flex align-center justify-center flex-column"
        > -->
        <div
          class="mission-section mission-section-overUnder"
          style="width: 50%"
        >
          <!-- COMPLETED -->
          <div v-if="task.submissionLink">
            <div class="section-overUnder flex-column">
              <p class="text-overline text-uppercase text-center">
                MISSION COMPLETED: {{ task.taskCompletedTimestamp }}
              </p>
            </div>
            <!-- MARK AS COMPLETED -->
            <div class="section-overUnder flex-column">
              <!-- View submission button -->
              <a
                style="text-decoration: none"
                :href="task.submissionLink"
                target="_blank"
              >
                <v-btn outlined color="cohortAccent" class="ma-2" small>
                  <v-icon left> mdi-text-box-search-outline </v-icon>
                  VIEW SUBMISSION
                </v-btn>
              </a>
            </div>
          </div>
          <div v-else>
            <div class="flex-column">
              <p class="text-overline text-uppercase text-center">
                MISSION COMPLETED: {{ task.taskCompletedTimestamp }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </v-row>
    <v-row> </v-row>
  </div>
</template>

<script>
import { db } from "../store/firestoreConfig";
import { mapState, mapGetters } from "vuex";

export default {
  name: "SelectedMissionsCard",
  components: {},
  props: ["task"],
  mounted() {},
  computed: {},
  data() {
    return {};
  },
};
</script>

<style lang="scss" scoped>
p {
  margin: 0px !important;
}

a {
  color: var(--v-missionAccent-base) !important;
}

.selected-mission-card {
  border: 1px solid var(--v-missionAccent-base);
  margin: -21px 10px 0px 10px;
  display: flex;
  flex-direction: column;
  min-height: 300px;
  z-index: 200;
  background-color: var(--v-background-base);
}

.mission-card {
  border: 1px solid var(--v-missionAccent-base);
  margin: 50px;
  display: flex;
  width: 100%;
  height: auto;

  .mission-section {
    margin: 0px;
    color: var(--v-missionAccent-base);
    font-size: 0.9rem;
    border-left: 1px solid var(--v-missionAccent-base);
    padding: 10px;
    flex-grow: 1;
  }
  .mission-section:first-child {
    margin: 0px;
    color: var(--v-missionAccent-base);
    font-size: 0.9rem;
    border-left: none;
    padding: 20px;
    flex-grow: 1;
  }

  .mission-section-overUnder {
    padding: 0px !important;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .section-overUnder {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      padding: 10px;
    }

    .section-overUnder:first-child {
      border-bottom: 1px solid var(--v-missionAccent-base);
    }
  }
}
</style>
