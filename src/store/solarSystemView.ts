import { fetchCourseByCourseId, fetchTopicByCourseIdTopicId } from "@/lib/ff";
import { defineStore } from "pinia";
import type { ICourse, ITopic } from "./_types";

export const useSolarSystemViewStore = defineStore({
  id: "solarSystemView",
  state: () => ({
    studentsView: true,
    isLoadingTopic: false,
    course: null as ICourse | null,
    topic: null as ITopic | null,
  }),
  actions: {
    setStudentsView(view: boolean) {
      this.studentsView = view;
    },
    async loadTopic(courseId: string, topicId: string) {
      this.isLoadingTopic = true;
      try {
        const [course, topic] = await Promise.all([
          fetchCourseByCourseId(courseId),
          fetchTopicByCourseIdTopicId(courseId, topicId),
        ]);
        this.course = course;
        this.topic = topic;
      } finally {
        this.isLoadingTopic = false;
      }
    },
    async refreshTopic() {
      if (this.course && this.topic) {
        this.isLoadingTopic = true;
        try {
          const [course, topic] = await Promise.all([
            fetchCourseByCourseId(this.course.id),
            fetchTopicByCourseIdTopicId(this.course.id, this.topic.id),
          ]);
          this.course = course;
          this.topic = topic;
        } finally {
          this.isLoadingTopic = false;
        }
      }
    },
  },
  persist: false,
});

export default useSolarSystemViewStore;
