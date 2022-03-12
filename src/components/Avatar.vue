<template>
  <div>
    <v-tooltip v-if="personData" bottom color="subBackground">
      <template v-slot:activator="{ on, attrs }">
        <div
          class="d-flex justify-center align-center"
          v-bind="attrs"
          v-on="on"
        >
          <v-avatar :size="size">
            <img
              v-if="personData.image"
              :src="personData.image.url"
              :alt="personData.firstName"
              style="object-fit: cover"
            />
            <div
              v-else
              class="imagePlaceholder"
              :style="{ width: size + 'px', height: size + 'px' }"
            >
              {{ first3Letters(personData.firstName) }}
            </div>
          </v-avatar>
        </div>
      </template>
      <div>
        <p
          class="ma-0 person-tooltip"
          style="font-size: 0.8rem; font-weight: 800"
        >
          {{ personData.firstName + " " + personData.lastName }}
        </p>
      </div>
    </v-tooltip>
  </div>
</template>

<script>
import { db } from "../store/firestoreConfig";

export default {
  name: "Avatar",
  props: ["personId", "size"],
  async mounted() {
    await db
      .collection("people")
      .doc(this.personId)
      .get()
      .then((doc) => {
        this.personData = doc.data();
      });
  },
  computed: {},
  data() {
    return {
      personData: {},
    };
  },
  methods: {
    first3Letters(name) {
      if (!name) return;
      return name.substring(0, 3).toUpperCase();
    },
  },
};
</script>

<style lang="scss" scoped>
.imagePlaceholder {
  border-radius: 50%;
  background-color: rgba(200, 200, 200, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
}

.person-tooltip {
  color: var(--v-missionAccent-base);
  font-size: 0.6rem;
  text-transform: uppercase;
}
</style>
