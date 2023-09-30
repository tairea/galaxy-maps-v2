<template>
  <div>
    <!-- with tooltip -->
    <v-tooltip v-if="profileData && !hideTooltips" bottom color="subBackground">
      <template v-slot:activator="{ on, attrs }">
        <div class="d-flex justify-center align-center" v-bind="attrs" v-on="on">
          <v-avatar :size="size">
            <img
              v-if="profileData.image"
              :src="profileData.image.url"
              :alt="profileData.firstName"
              style="object-fit: cover"
              :style="border"
            />
            <div v-else-if="profileData.firstName" class="imagePlaceholder" :style="colouredBorder">
              {{ first3Letters(profileData.firstName) }}
            </div>
            <div v-else class="imagePlaceholder" :style="colouredBorder">
              <v-icon>{{ mdiAccount }}</v-icon>
            </div>
          </v-avatar>
        </div>
      </template>
      <div>
        <p class="ma-0 person-tooltip" style="font-size: 0.8rem; font-weight: 800">
          {{
            profileData.firstName
              ? profileData.firstName + " " + profileData.lastName
              : profileData.email
          }}
        </p>
      </div>
    </v-tooltip>
    <!-- without tooltip -->
    <div v-else-if="profileData" class="d-flex justify-center align-center">
      <v-avatar :size="size">
        <img
          v-if="profileData.image"
          :src="profileData.image.url"
          :alt="profileData.firstName"
          style="object-fit: cover"
          :style="border"
        />
        <div v-else-if="profileData.firstName" class="imagePlaceholder" :style="colouredBorder">
          {{ first3Letters(profileData.firstName) }}
        </div>
        <div v-else class="imagePlaceholder" :style="colouredBorder">
          <v-icon>{{ mdiAccount }}</v-icon>
        </div>
      </v-avatar>
    </div>

    <v-tooltip v-if="organisationData" bottom color="subBackground">
      <template v-slot:activator="{ on, attrs }">
        <div class="d-flex justify-center align-center" v-bind="attrs" v-on="on">
          <v-avatar :size="size">
            <img
              v-if="organisationData.image"
              :src="organisationData.image.url"
              :alt="organisationData.name"
              style="object-fit: cover"
              :style="border"
            />
            <div v-else class="imagePlaceholder" :style="colouredBorder">
              {{ first3Letters(organisationData.name) }}
            </div>
          </v-avatar>
        </div>
      </template>
      <div>
        <p class="ma-0 person-tooltip" style="font-size: 0.8rem; font-weight: 800">
          {{ organisationData.name }}
        </p>
      </div>
    </v-tooltip>
  </div>
</template>

<script>
import { db } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import { mdiAccount } from "@mdi/js";
import { mapState } from "pinia";

export default {
  name: "Avatar",
  props: [
    "personId",
    "size",
    "colourBorder",
    "profile",
    "owner",
    "organisationData",
    "hideTooltips",
  ],
  data() {
    return {
      mdiAccount,
      profileData: null,
    };
  },
  async mounted() {
    if (this.profile) {
      this.profileData = this.profile;
    } else if (this.owner) {
      const doc = await this.owner.get();
      if (this.owner.path.startsWith("organisations")) {
        this.organisationData = doc;
      } else {
        this.profileData = doc;
      }
    } else if (this.personId) {
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
    ...mapState(useRootStore, ["userStatus"]),
    online() {
      if (this.profileData) {
        return this.userStatus[this.profileData.id]?.state === "online";
      } else {
        return false;
      }
    },
    border() {
      return this.colourBorder && this.online ? "border: 1px solid var(--v-baseAccent-base)" : "";
    },
    colouredBorder() {
      return this.colourBorder
        ? {
            width: this.size + "px",
            height: this.size + "px",
            backgroundColor: this.stringToColour(),
            border: this.online ? "1px solid var(--v-baseAccent-base)" : "",
          }
        : { width: this.size + "px", height: this.size + "px" };
    },
  },
  methods: {
    first3Letters(name) {
      if (!name) return;
      return name.substring(0, 3).toUpperCase();
    },
    stringToColour() {
      // profile or owner
      let str = "";
      if (this.profileData) str = this.profileData.firstName + this.profileData.lastName;
      else if (this.organisationData) str = this.organisationData.name;
      return `hsl(${this.hashCode(str) % 360}, 100%, 35%)`;
    },
    hashCode(str) {
      let hash = 0;
      for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return hash;
    },
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
