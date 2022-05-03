<template>
  <div>
    <v-tooltip v-if="profileData" bottom color="subBackground">
      <template v-slot:activator="{ on, attrs }">
        <div
          class="d-flex justify-center align-center"
          v-bind="attrs"
          v-on="on"
        >
          <v-avatar :size="size">
            <img
              v-if="profileData.image"
              :src="profileData.image.url"
              :alt="profileData.firstName"
              style="object-fit: cover"
              :style="border"
            />
            <div
              v-else
              class="imagePlaceholder"
              :style="colouredBorder"
            >
              {{ first3Letters(profileData.firstName) }}
            </div>
          </v-avatar>
        </div>
      </template>
      <div>
        <p
          class="ma-0 person-tooltip"
          style="font-size: 0.8rem; font-weight: 800"
        >
          {{ profileData.firstName + " " + profileData.lastName }}
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
  props: ["personId", "size", "colourBorder", "profile"],
  data() {
    return {
      profileData: {},
    };
  },
  async mounted() {
    if (this.profile) { 
      this.profileData = this.profile
    } else {
      await db
        .collection("people")
        .doc(this.personId)
        .get()
        .then((doc) => {
          this.profileData = doc.data();
        });
    }
  },
  computed: {
    ...mapState(['userStatus']),
    online() {
      if (this.profileData.id) return this.userStatus[this.profileData.id]?.state === 'online'
    },
    border() {
      return this.colourBorder && this.online ? 'border: 1px solid var(--v-baseAccent-base)':''
    },
    colouredBorder () {
      return this.colourBorder ? {
        width: this.size + 'px',
        height: this.size + 'px',
        backgroundColor: this.stringToColour(
          this.profileData.firstName + this.profileData.lastName
        ),
        border: this.online ? '1px solid var(--v-baseAccent-base)' : ''
      }
      : { width: this.size + 'px', height: this.size + 'px' }
    }
  },
  methods: {
    first3Letters(name) {
      if (!name) return;
      return name.substring(0, 3).toUpperCase();
    },
    stringToColour(str) {
      return `hsl(${this.hashCode(str) % 360}, 100%, 35%)`;
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
