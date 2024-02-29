import { fetchCohortByCohortId } from "@/lib/ff";
import { defineStore } from "pinia";
import type { Cohort } from "./_shared";

export const useCohortViewStore = defineStore({
  id: "cohortView",
  state: () => ({
    studentsView: true,
    isLoadingCohort: false,
    cohort: null as Cohort | null,
  }),
  actions: {
    setStudentsView(view: boolean) {
      this.studentsView = view;
    },
    async loadCohort(cohortId: string) {
      this.isLoadingCohort = true;
      try {
        this.cohort = await fetchCohortByCohortId(cohortId);
      } finally {
        this.isLoadingCohort = false;
      }
    },
    async refreshCohort() {
      if (this.cohort) {
        this.isLoadingCohort = true;
        try {
          this.cohort = await fetchCohortByCohortId(this.cohort.id);
        } finally {
          this.isLoadingCohort = false;
        }
      }
    },
  },
  persist: false,
});

export default useCohortViewStore;
