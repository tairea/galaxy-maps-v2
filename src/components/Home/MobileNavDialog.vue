<template>
  <v-dialog
    v-model="dialogVisible"
    fullscreen
    transition="dialog-bottom-transition"
    style="z-index: 9999"
  >
    <v-card color="var(--v-background-darken1)">
      <v-btn icon @click="closeDialog" class="close-btn">
        <v-icon color="baseAccent">{{ mdiClose }}</v-icon>
      </v-btn>

      <v-card-text class="pa-0 menu-container">
        <v-list color="transparent" class="menu-list">
          <v-list-item
            v-for="tab in tabs"
            :key="tab.id"
            :to="tab.route"
            @click="closeDialog"
            link
            class="menu-item"
          >
            <v-list-item-content class="text-center">
              <v-list-item-title class="overline baseAccent--text menu-title">
                {{ tab.name }}
                <template v-if="tab.name === 'DASHBOARD'">
                  <v-chip
                    v-if="unansweredRequestsForHelp.length"
                    small
                    color="galaxyAccent"
                    text-color="white"
                    class="ml-2"
                  >
                    {{ unansweredRequestsForHelp.length }}
                  </v-chip>
                  <v-chip
                    v-if="inReviewSubmissionsCount"
                    small
                    color="cohortAccent"
                    text-color="white"
                    class="ml-2"
                  >
                    {{ inReviewSubmissionsCount }}
                  </v-chip>
                </template>
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import { mdiClose, mdiChevronRight } from "@mdi/js";

export default {
  name: "MobileNavDialog",
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    tabs: {
      type: Array,
      default: () => [],
    },
    unansweredRequestsForHelp: {
      type: Array,
      default: () => [],
    },
    inReviewSubmissionsCount: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      mdiClose,
      mdiChevronRight,
    };
  },
  computed: {
    dialogVisible: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit("input", val);
      },
    },
  },
  methods: {
    closeDialog() {
      this.$emit("input", false);
    },
  },
};
</script>

<style lang="scss" scoped>
.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
}

.menu-container {
  height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 400px;
}

.menu-item {
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;

  .v-list-item__content {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.menu-title {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 1rem;
  letter-spacing: 1px;
}

.v-chip {
  height: 24px;
}
</style>
