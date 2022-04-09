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
              :style="border"
            />
            <div
              v-else
              class="imagePlaceholder"
              :style="[
                colourBorder
                  ? {
                      width: size + 'px',
                      height: size + 'px',
                      border,
                      backgroundColor: stringToColour(
                        personData.firstName + personData.lastName
                      ),
                    }
                  : { width: size + 'px', height: size + 'px' },
              ]"
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
import { mapState } from "vuex";

export default {
  name: "Avatar",
  props: ["personId", "size", "colourBorder"],
  async mounted() {
    await db
      .collection("people")
      .doc(this.personId)
      .get()
      .then((doc) => {
        this.personData = doc.data();
      });
  },
  computed: {
    ...mapState(['userStatus']),
    online() {
      return this.userStatus[this.personId].state === 'online'
    },
    border() {
      return this.colourBorder && this.online ? 'border: 1px solid var(--v-baseAccent-base)':''
    }
  },
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
    stringToColour(str) {
      return `hsl(${this.hashCode(str) % 360}, 100%, 70%)`;
    },
    hashCode(str) {
      let hash = 0;
      for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return hash;
    }
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
  font-size: 0.6rem;
}

.person-tooltip {
  color: var(--v-missionAccent-base);
  font-size: 0.6rem;
  text-transform: uppercase;
}
</style>
