<template>
  <!-- Avatar Section -->
  <div class="student-section student-image-section text-center">
    <v-avatar
      color="secondary"
      @mouseenter="onhover = true"
      @mouseleave="onhover = false"
      size="60"
    >
      <img
        v-if="student.image"
        :src="student.image.url"
        :alt="student.firstName"
        style="object-fit: cover"
      />
      <v-icon v-else>mdi-account</v-icon>
    </v-avatar>
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <p v-on="on" class="text-uppercase studentName text-truncate pt-2">
          {{ student.firstName }}
        </p>
      </template>
      <span>{{ student.firstName + " " + student.lastName }}</span>
    </v-tooltip>
    <p :class="online" class="status">{{ loggedIn }}</p>
  </div>
</template>

<script>
export default {
  name: "StudentCardStatus",
  props: ["student", "loggedIn"],
  computed: {
    online() {
      if (this.loggedIn === "online") return "online";
    },
  }
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
  min-width: 20%;
  max-width: 20%;
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
    margin-bottom: 1px
  }
}

.online {
  color: var(--v-baseAccent-base);
}

.status {
  font-size: 0.5rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 1px
}

</style>
