import { fetchCourses, fetchCourseMapEdgesAndNodesByCourseId } from "@/lib/ff";
import { defineStore } from "pinia";
import { SerializableMap } from "./_helpers";
import type { ICourse, IMapEdge, IMapNode } from "./_types";

export const useGalaxyListViewStore = defineStore({
  id: "galaxyListView",
  state: () => ({
    isLoadingCourses: false,
    courses: [] as ICourse[],
    courseNodesMap: new SerializableMap<string, IMapNode[]>(),
    courseEdgesMap: new SerializableMap<string, IMapEdge[]>(),
    slug: null as string | null,
    selectedCourseId: null as string | null,
  }),
  actions: {
    async loadCourses(slug: string | null = null) {
      this.isLoadingCourses = true;
      try {
        const courses = await fetchCourses(slug);
        const courseMapEdgesAndNodes = await Promise.all(
          courses.map((course) =>
            fetchCourseMapEdgesAndNodesByCourseId(course.id).then((res) => ({
              courseId: course.id,
              ...res,
            })),
          ),
        );
        const courseNodesMap = new SerializableMap<string, IMapNode[]>();
        const courseEdgesMap = new SerializableMap<string, IMapEdge[]>();
        for (const { courseId, nodes, edges } of courseMapEdgesAndNodes) {
          courseNodesMap.set(courseId, nodes);
          courseEdgesMap.set(courseId, edges);
        }
        this.slug = slug;
        this.courses = courses;
        this.courseEdgesMap = courseEdgesMap;
        this.courseNodesMap = courseNodesMap;
      } finally {
        this.isLoadingCourses = false;
      }
    },
    async refreshCourses() {
      this.isLoadingCourses = true;
      try {
        const courses = await fetchCourses(this.slug);
        const courseMapEdgesAndNodes = await Promise.all(
          courses.map((course) =>
            fetchCourseMapEdgesAndNodesByCourseId(course.id).then((res) => ({
              courseId: course.id,
              ...res,
            })),
          ),
        );
        const courseNodesMap = new SerializableMap<string, IMapNode[]>();
        const courseEdgesMap = new SerializableMap<string, IMapEdge[]>();
        for (const { courseId, nodes, edges } of courseMapEdgesAndNodes) {
          courseNodesMap.set(courseId, nodes);
          courseEdgesMap.set(courseId, edges);
        }
        this.courses = courses;
        this.courseEdgesMap = courseEdgesMap;
        this.courseNodesMap = courseNodesMap;
      } finally {
        this.isLoadingCourses = false;
      }
    },
    async setSelectedCourseId(courseId: string | null) {
      if (this.selectedCourseId === courseId) {
        return;
      }

      if (courseId == null) {
        this.selectedCourseId = null;
        return;
      }

      const course = this.courses.find((c) => c.id === courseId) ?? null;
      if (course == null) {
        throw new Error(`Course not found: ${courseId}`);
      }
      this.selectedCourseId = courseId;
    },
  },
  persist: {
    afterRestore: (ctx) => {
      // Serializable Maps are serialized to plain objects so we need to convert them back to Maps
      ctx.store.$state.courseNodesMap = new SerializableMap(
        Object.entries(ctx.store.$state.courseNodesMap),
      );
      ctx.store.$state.courseEdgesMap = new SerializableMap(
        Object.entries(ctx.store.$state.courseEdgesMap),
      );
    },
  },
});

export default useGalaxyListViewStore;
