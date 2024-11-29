<template>
  <div>
    <div
      class="teacherCard"
      :class="{ 'selected-teacher': active }"
      @click="$emit('teacherSelected', teacher)"
    >
      <div class="imagePlaceholder ma-1">
        <img
          v-if="teacherImage?.url"
          :src="teacherImage.url"
          :alt="teacher.teacherName"
          class="teacher-avatar"
        />
        <template v-else>
          {{ first3Letters(teacher.teacherName) }}
        </template>
      </div>
      <p class="teacherListPanelContent text-left ma-1" :class="{ 'selected-teacher': active }">
        Cpt. {{ teacher.teacherName }}
      </p>
    </div>
  </div>
</template>

<script>
import { fetchPersonByPersonId } from "@/lib/ff";

export default {
  name: "TeacherListPanelCard",
  props: {
    teacher: {
      type: Object,
      required: true,
    },
    active: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      teacherImage: null,
    };
  },
  methods: {
    first3Letters(name) {
      return name.substring(0, 3).toUpperCase();
    },
    async fetchTeacherImage() {
      try {
        const profile = await fetchPersonByPersonId(this.teacher.teacherId, "");
        if (profile) {
          this.teacherImage = profile.image;
        }
      } catch (error) {
        console.error(`Error fetching teacher profile for ${this.teacher.teacherId}:`, error);
      }
    },
  },
  created() {
    this.fetchTeacherImage();
  },
};
</script>

<style lang="scss" scoped>
.selected-teacher {
  position: relative;
  background-color: var(--v-baseAccent-base);
  color: var(--v-background-base) !important;
  font-weight: 900;
  text-transform: uppercase;
}

.teacherCard {
  position: relative;
  margin: 10px;
  border: 1px solid var(--v-baseAccent-base);
  display: flex;
  cursor: pointer;
  align-items: center;

  .imagePlaceholder {
    width: 30px;
    height: 30px;
    background-color: rgba(200, 200, 200, 0.3);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 0.6rem;

    .teacher-avatar {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .teacherListPanelContent {
    color: var(--v-baseAccent-base);
    position: relative;
    font-size: 0.6rem;
    letter-spacing: 1px;
  }
}
</style>
