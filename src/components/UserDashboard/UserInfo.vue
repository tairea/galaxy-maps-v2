<template>
  <div class="d-flex flex-column">
    <!-- Student photo -->
    <StudentAvatar :size="200" />
    <!-- Student xp points -->
    <XpPointsDialog
      :person="person"
      :xpPoints="person.xpPointsTotal ? person.xpPointsTotal : 0"
      :canManageXpPoints="isAdmin"
      :studentOverview="true"
    />
    <div class="student-info">
      <!-- Student name -->
      <div>
        <p class="student-info-label mt-4">name:</p>
        <p class="student-info-value-main">
          {{ person.firstName + " " + person.lastName }}
        </p>
      </div>
      <!-- Student NSN -->
      <div v-if="person.nsnNumber">
        <p class="student-info-label mt-4">nsn:</p>
        <p class="student-info-value-sub">
          {{ person.nsnNumber }}
        </p>
      </div>
      <!-- Student Email -->
      <div>
        <p class="student-info-label mt-4">email:</p>
        <p class="student-info-value-sub">
          {{ person.email }}
        </p>
      </div>
      <!-- Edit button -->
      <div style="text-align: right">
        <StudentEditDialog :isDashboardView="true" />
      </div>
      <!-- Cohorts -->
      <div style="margin: 50px -20px 0px -20px; margin-top: 50px">
        <p class="student-info-label">cohorts:</p>
        <div class="d-flex flex-wrap overflow-y-auto" style="padding-right: 10px; height: 350px">
          <Cohort
            v-for="cohort in cohorts"
            :isTeacher="isTeacher(cohort)"
            :cohort="cohort"
            :key="cohort.id"
            :size="60"
            :cols="4"
            :tooltip="true"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import StudentAvatar from "@/components/UserDashboard/UserInfo/StudentAvatar.vue";
import XpPointsDialog from "@/components/Dialogs/XpPointsDialog.vue";
import StudentEditDialog from "@/components/Dialogs/StudentEditDialog.vue";
import Cohort from "@/components/Reused/Cohort.vue";
import { db, storage } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import firebase from "firebase/compat/app";
import { mapActions, mapState } from "pinia";

export default {
  name: "UserInfo",
  props: [],
  components: {
    StudentAvatar,
    StudentEditDialog,
    Cohort,
    XpPointsDialog,
  },
  async mounted() {
    if (!this.user.data.admin) {
      await this.getCohortsByPersonId(this.person);
    }
  },
  computed: {
    ...mapState(useRootStore, ["person", "cohorts", "user"]),
    isAdmin() {
      return this.user?.data?.admin;
    },
  },
  data() {
    return {};
  },
  methods: {
    ...mapActions(useRootStore, ["getCohortsByPersonId"]),
    isTeacher(cohort) {
      // return true if this.person.id is in the list of teachers
      return cohort.teachers?.includes(this.person.id);
    },
  },
};
</script>

<style lang="scss" scoped>
.student-info {
  .student-info-label {
    margin: 0px;
    text-transform: uppercase;
    color: var(--v-baseAccent-base);
    font-size: 0.7rem;
  }

  .student-info-value-main {
    margin: 0px;
    text-transform: uppercase;
    color: var(--v-baseAccent-base);
    font-size: 1.5rem;
  }

  .student-info-value-sub {
    margin: 0px;
    text-transform: uppercase;
    color: var(--v-baseAccent-base);
    font-size: 0.8rem;
  }

  .mission-edit-button {
    // position: absolute;
    // top: 10px;
    // right: 20px;
    // font-size: 0.5rem;
  }
}
</style>
