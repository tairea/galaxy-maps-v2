<template>
  <div class="userMenu">
    <!-- USER MENU TOPBAR -->
    <div class="blackBar ">
      <div class="d-flex justify-center align-center">
        <v-img :src="`http://tutoa.co.nz/portal/img/ian.23cb54e5.jpg`" class="profilePic"></v-img>
      </div>
      <div class="username" style="">
        {{person.firstName}} {{person.lastName}}
      </div>
    </div>
    <!-- USER MENU HIDDEN-->
    <div class="userMenuHidden">
      <p class="text-overline" color="primary">Colour Theme</p>
      <!-- LIGHT/DARK MODE SWITCH -->
      <v-switch
        v-model="darkSwitch"
        :label="`${darkSwitch ? 'Dark' : 'Light'}`"
        @change="changeTheme()"
      ></v-switch>
      <!-- <ThemeColourPicker/> -->
      <v-btn @click="logout">Logout</v-btn>
    </div>
  </div>
</template>

<script>
import firebase from "firebase";

import { mapState } from "vuex";

import ThemeColourPicker from "../components/ThemeColourPicker";

export default {
  name: "UserBar",
  components: {
    ThemeColourPicker,
  },
  data: () => ({
    darkSwitch: true,
  }),
  computed: {
  ...mapState([
        "person"
      ]),
  },
  methods: {
    changeTheme() {
      this.$vuetify.theme.dark = this.darkSwitch;
    },
    logout() {
      firebase
        .auth()
        .signOut()
        .then(() => {
          alert("Successfully logged out");
          this.$router.push("/login");
        })
        .catch((error) => {
          alert(error.message);
          this.$router.push("/");
        });
    },
  },
};
</script>

<style lang="scss" scoped>
.userMenu {
  background: var(--v-subBackground-base);
  width: 25%;
  height: 400px;
  position: absolute;
  // bottom: 0px;
  bottom: -400px;
  right: 0;
  transition: all 0.3s ease-out;

  .blackBar {
    position: absolute;
    height: 70px;
    top: -70px;
    right: 0px;
    background: var(--v-subBackground-base);
    width: 100%;
    padding: 10px;
    clip-path: polygon(20% 0, 100% 0, 100% 100%, 0 100%);
    text-align: right;
    display: flex;
    justify-content: flex-end;
    z-index: 200;
    // border: 1px yellow solid;

    .profilePic {
      width: 50px;
      height: 50px;
      object-fit: cover;
      border-radius: 50%;
    }

    .username {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0 10px;
    }
  }

  .userMenuHidden {
    padding: 20px 50px;
  }
}

.userMenu:hover {
  bottom: 0px;
}
</style>
