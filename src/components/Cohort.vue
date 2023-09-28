<template>
  <v-col
    :cols="cols"
    @click="!studentView ? routeToCohort(cohort) : null"
    class="d-flex flex-column justify-start align-center cohort"
    :style="!studentView ? 'cursor: pointer;' : ''"
    :class="studentCardView ? 'pa-0' : ''"
  >
    <div v-if="!tooltip" class="d-flex flex-column justify-start align-center cohort">
      <v-img
        v-if="cohort.image.url"
        :src="cohort.image.url"
        :max-width="size ? size + 'px' : '60px'"
        :max-height="size ? size + 'px' : '60px'"
        class="cohort-image"
      ></v-img>
      <div
        v-else
        class="imagePlaceholder"
        :style="
          size
            ? 'max-width:' + size + 'px; max-height:' + size + 'px'
            : 'max-width: 60px;max-height:60px'
        "
      >
        {{ first3Letters(cohort.name) }}
      </div>
      <h3 class="overline cohort-name">{{ cohort.name }}</h3>
    </div>
    <v-tooltip v-else bottom class="grow-lg" contentClass="toolTip">
      <template v-slot:activator="{ on, attrs }">
        <v-avatar :class="avatarClass" v-bind="attrs" v-on="on" :size="size">
          <v-img v-if="cohort.image.url" :src="cohort.image.url"></v-img>
          <span v-else>
            {{ first3Letters(cohort.name) }}
          </span>
        </v-avatar>
      </template>
      <h3 class="overline">{{ cohort.name }}</h3>
    </v-tooltip>

    <!-- <v-avatar v-else :class="avatarClass" :size="cohortSize">
        <v-img
          v-if="cohort.image.url"
          :src="cohort.image.url"
        ></v-img>
        <span v-else>
          {{ first3Letters(cohort.name) }}
        </span>
      </v-avatar>
      <h3 class="avatar-label">{{ cohort.name }}</h3> -->
  </v-col>
</template>

<script>
import useRootStore from "@/store/index";
import { mapActions, mapStores } from "pinia";

export default {
  name: "Cohort",
  props: ["cohort", "cols", "tooltip", "studentView", "studentCardView", "size"],
  computed: {
    ...mapStores(useRootStore),
    avatarClass() {
      return this.studentCardView ? "avatar" : "galaxy-view";
    },
  },
  methods: {
    ...mapActions(useRootStore, ["setCurrentCohort"]),
    first3Letters(name) {
      return name.substring(0, 3).toUpperCase();
    },
    routeToCohort() {
      this.rootStore.currentCohort = this.cohort;
      this.setCurrentCohort(this.cohort);
      this.$router.push({
        name: "CohortView",
        params: {
          cohortName: this.camelize(this.cohort.name),
          cohortId: this.cohort.id,
        },
      });
    },
    camelize(str) {
      return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
        if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.cohort-image {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
}

.imagePlaceholder {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: rgba(200, 200, 200, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
}

.cohort-name {
  text-align: center;
  font-size: 0.65rem !important;
  line-height: 1rem;
  padding-top: 10px;
}

.avatar {
  padding: 0px;
  margin: 0px 5px;
  transition: all 0.2s ease-in-out;
  background-color: rgb(51, 49, 49);
}

.avatar-label {
  display: none;
}

.avatar:hover {
  transform: scale(2);
  box-shadow: 0 0 30px var(--v-missionAccent-base);
}

.avatar:hover + .avatar-label {
  display: flex;
  text-shadow: 0 0 30px var(--v-missionAccent-base);
  width: 100px;
  justify-content: center;
  align-items: center;
}

.toolTip {
  border: 1px solid var(--v-missionAccent-base);
}

.galaxy-view {
  background-color: var(--v-background-lighten2);
}
</style>
