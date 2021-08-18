<template>
      <v-col class="d-flex flex-column justify-start align-center" :cols="cols">
        <v-img v-if="cohort.image.url" :src="cohort.image.url" max-width="60px" max-height="60px" class="cohort-image"></v-img>
        <div v-else class="imagePlaceholder">{{ first3Letters(cohort.name)}}</div>
        <h3 class="overline">{{ cohort.name }}</h3>
      </v-col>
</template>

<script>
export default {
  name: "Cohort",
  props: ["cohort", "cols"],
  data() {
    return {
     
    };
  },
  mounted() {
  },
  computed: {},
  methods: {
    first3Letters(name) {
      return name.substring(0, 4)
    }
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

</style>
