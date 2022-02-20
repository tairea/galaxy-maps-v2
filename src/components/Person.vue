<template>
  <div
    class="d-flex justify-start cohort"
    :cols="cols"
    @click="routeToPerson(person)"
  >
    <v-tooltip bottom>
      <template v-slot:activator="{ on, attrs }">
        <div v-bind="attrs" v-on="on">
          <v-avatar color="secondary">
            <img v-if="person.image"
              :src="person.image.url"
              :alt="person.firstName"
              style="object-fit: cover;"
            >
            <!-- <v-icon v-if="hover">mdi-pencil</v-icon> -->
            <v-icon v-else>mdi-account</v-icon>
          </v-avatar>
        </div>
      </template>
      <span>{{ person.firstName + " " + person.lastName }}</span>
    </v-tooltip>
  </div>
</template>

<script>
export default {
  name: "Person",
  props: ["person", "cols"],
  data() {
    return {};
  },
  mounted() {
    console.log('person mounted')
  },
  computed: {},
  methods: {
    first3Letters(name) {
      return name.substring(0, 3).toUpperCase();
    },
    routeToPerson(id) {
      console.log("TODO: route to persons page:", id);
    },
  },
};
</script>

<style lang="scss" scoped>
.cohort {
  padding: 0px 10px;
  cursor: pointer;

  .cohort-image {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
  }

  .imagePlaceholder {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: rgba(200, 200, 200, 0.3);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 0.8rem;
  }
}
</style>
