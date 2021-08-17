<template>
  <v-container>
    <v-row>
      <v-col class="d-flex justify-start align-center">
        <v-img :src="organisation.image.url" max-width="60px" max-height="60px" class="organisation-image"></v-img>
        <h3 class="ml-6 overline">{{ organisation.name }}</h3>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: "Organisation",
  props: ["organisation"],
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

.organisation-image {
  // width: 100px;
  // height: 100px;
  border-radius: 50%;
  // object-fit: cover;
}

</style>
