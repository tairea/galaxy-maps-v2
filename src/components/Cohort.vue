<template>
  <v-container>
    <v-row>
      <v-col>
        <v-img :src="cohort.image.url" class="cohort-image"></v-img>
      </v-col>
      <v-col>
        <h3>{{ cohort.name }}</h3>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: "Cohort",
  props: ["cohort"],
  data() {
    return {
     
    };
  },
  mounted() {
  },
  computed: {},
  methods: {
  
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

</style>
