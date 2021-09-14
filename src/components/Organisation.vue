<template>
  <v-container>
    <v-row>
      <v-col
        class="d-flex justify-center align-center cursor"
        @click="editOrg()"
      >
        <v-img
          v-if="organisation.image.url"
          :src="organisation.image.url"
          max-width="60px"
          max-height="60px"
          class="organisation-image"
        ></v-img>
        <div v-else class="imagePlaceholder">
          {{ first3Letters(organisation.name) }}
        </div>
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
    return {};
  },
  mounted() {
  },
  computed: {},
  methods: {
    editOrg() {
      this.$emit("editOrg", this.organisation.id);
    },
    first3Letters(name) {
      return name.substring(0, 3).toUpperCase();
    },
  },
};
</script>

<style lang="scss" scoped>
.cursor {
  cursor: pointer;
  transition: all 0.3s;
}
.cursor:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

.organisation-image {
  // width: 100px;
  // height: 100px;
  border-radius: 50%;
  // object-fit: cover;
  
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
