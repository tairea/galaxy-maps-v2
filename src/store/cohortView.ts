import { fetchCohortByCohortId } from "@/lib/ff";
import { defineStore } from "pinia";
import type { ICohort } from "./_types";

export const useCohortViewStore = defineStore({
  id: "cohortView",
  state: () => ({
    studentsView: true,
    activeTab: "navigators" as "status" | "navigators" | "overview",
    isLoadingCohort: false,
    cohort: null as ICohort | null,
  }),
  actions: {
    setStudentsView(view: boolean) {
      this.studentsView = view;
      this.activeTab = view ? "navigators" : "overview";
    },
    setActiveTab(tab: "status" | "navigators" | "overview") {
      this.activeTab = tab;
      // keep legacy boolean in sync for existing views
      if (tab === "navigators") this.studentsView = true;
      if (tab === "overview") this.studentsView = false;
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
