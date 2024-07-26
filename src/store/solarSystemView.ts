import {
  fetchCourseByCourseId,
  fetchTasksByCourseIdTopicId,
  fetchTopicByCourseIdTopicId,
  fetchPersonsTopicsByPersonIdCourseId,
  fetchPersonsTasksByPersonIdCourseIdTopicId,
  updateTaskOrderIndexesByCourseIdTopicId,
} from "@/lib/ff";
import { defineStore } from "pinia";
import type { ICourse, IPersonTask, IPersonTopic, ITask, ITopic } from "./_types";

export const useSolarSystemViewStore = defineStore({
  id: "solarSystemView",
  state: () => ({
    studentsView: true,
    isLoadingTopic: false,
    course: null as ICourse | null,
    topic: null as ITopic | null,
    topicTasks: [] as ITask[],
    personTopics: [] as IPersonTopic[],
    personTasks: [] as IPersonTask[],
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
    async refreshTasks() {
      if (this.course == null || this.topic == null) {
        return;
      }
      this.topicTasks = await fetchTasksByCourseIdTopicId(this.course.id, this.topic.id);
    },
    async updateTaskOrderIndexes(orderIndexes: { taskId: string; orderIndex: number }[]) {
      if (this.course == null || this.topic == null) {
        return;
      }
      const topicTasks = await updateTaskOrderIndexesByCourseIdTopicId(
        this.course.id,
        this.topic.id,
        orderIndexes,
      );
      this.topicTasks = topicTasks;
    },
    async refreshPersonTopicsAndTasks(personId: string) {
      if (this.course == null || this.topic == null) {
        return;
      }
      const [personTopics, personTasks] = await Promise.all([
        fetchPersonsTopicsByPersonIdCourseId(personId, this.course.id),
        fetchPersonsTasksByPersonIdCourseIdTopicId(personId, this.course.id, this.topic.id),
      ]);

      this.personTopics = personTopics;
      this.personTasks = personTasks;
    },
  },
  persist: false,
});

export default useSolarSystemViewStore;
