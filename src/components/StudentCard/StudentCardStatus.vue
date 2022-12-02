<template>
  <!-- Avatar Section -->
  <div
    class="student-section text-center"
    :class="size ? '' : 'student-image-section'"
  >
    <v-avatar
      color="secondary"
      @mouseenter="onhover = true"
      @mouseleave="onhover = false"
      :size="size ? size + 'px' : '60px'"
      :style="borderColour"
    >
      <img
        v-if="student.image"
        :src="student.image.url"
        :alt="student.firstName"
        style="object-fit: cover"
      />
      <v-icon v-else>{{ mdiAccount }}</v-icon>
    </v-avatar>
    <div
      class="d-flex justify-center align-center flex-column"
      style="width: 100%"
    >
      <p
        class="text-uppercase studentName pt-2"
        :class="size ? '' : 'text-truncate'"
      >
        {{ student.firstName || student.email }}
      </p>

      <p :class="online" class="status">{{ loggedIn }}</p>
    </div>
  </div>
</template>

<script>
import { mdiAccount } from "@mdi/js";

export default {
  name: "StudentCardStatus",
  props: ["student", "date", "status", "size"],
  computed: {
    online() {
      if (this.loggedIn === "online") return "online";
    },
    loggedIn() {
      if (!this.status) return "inactive";
      if (this.status.state === "online") {
        return "online";
      } else return this.timePassed(this.date);
    },
    borderColour() {
      return this.loggedIn === "online"
        ? "border: 1px solid var(--v-baseAccent-base) !important"
        : "";
    },
  },
  data() {
    return {
      mdiAccount,
    };
  },
  methods: {
    timePassed(now) {
      var date = Math.round(now / 1000);
      var delta = date - this.status?.last_changed?.seconds;

      // calculate (and subtract) whole days
      var days = Math.floor(delta / 86400);

      // calculate (and subtract) whole hours
      var hours = Math.floor(delta / 3600);

      // calculate (and subtract) whole minutes
      var minutes = Math.floor(delta / 60);

      if (minutes < 1) return `just now`;
      if (minutes < 60) return `${minutes} mins ago`;
      if (hours < 24) return `${hours} hrs ago`;
      return `${days} days ago`;
    },
  },
};
</script>

<style lang="scss" scoped>
.student-section {
  color: var(--v-missionAccent-base);
  font-size: 0.9rem;
  padding: 10px 0px;
  flex-grow: 1;
}

.student-image-section {
  min-width: 13%;
  max-width: 13%;
  padding-bottom: 2px !important;

  .imagePlaceholder {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: rgba(200, 200, 200, 0.3);
    display: flex;
    justify-content: center;
    align-items: center;
    margin: auto;
  }

  .studentName {
    font-size: 0.7rem;
    letter-spacing: 2px;
    text-align: center;
    margin-bottom: 1px;
  }
}

.online {
  color: var(--v-baseAccent-base);
}

.status {
  font-size: 0.5rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 1px;
}
</style>
