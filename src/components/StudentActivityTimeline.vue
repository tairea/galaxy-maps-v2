<template>
  <div class="activity-log">
    <p class="label">ACTIVITY LOG:</p>
    <div class="px-3">
      <p
        v-for="activity in studentsActivityLog"
        :key="activity.id"
        class="ma-0"
      >
        {{ formatTime(activity.timestamp) + ": " + activity.description }}
      </p>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import { getActivityLogXAPIQuery } from "../store/veracityLRS";
import { DateTime } from "luxon";
export default {
  name: "StudentActivityTimeline",
  props: [],
  components: {},
  mounted() {
    getActivityLogXAPIQuery(this.person);
  },
  computed: {
    ...mapState(["studentsActivityLog"]),
    ...mapGetters(["person"]),
  },
  data() {
    return {};
  },
  methods: {
    formatTime(time) {
      return DateTime.fromISO(time).toFormat("tt ccc dd LLL   ");
    },
  },
};
</script>

<style lang="scss" scoped>
.activity-log {
  color: var(--v-missionAccent-base);
  border: 1px solid var(--v-missionAccent-base);
  font-size: 0.6rem;
  max-height: 150px;
  width: 80%;
  margin-left: 5%;
  margin-right: auto;
  margin-bottom: 30px;
  overflow-y: scroll;
  overflow-x: hidden;
}

.label {
  color: var(--v-missionAccent-base);
  font-size: 0.7rem;
  margin: 10px;
}
</style>
