<template>
  <div class="set-password">
    <div id="set-password-info">
      <h2 class="set-password-label">Set Your Password</h2>
      <p class="set-password-description mt-4">
        Welcome to Galaxy Maps! Please set your password to complete your account setup.
      </p>

      <SetInitialPasswordDialog
        :dialog="showDialog"
        :userEmail="userEmail"
        :userId="userId"
        @passwordSet="onPasswordSet"
      />
    </div>
  </div>
</template>

<script>
import SetInitialPasswordDialog from "@/components/Dialogs/SetInitialPasswordDialog.vue";
import useRootStore from "@/store/index";
import { mapActions } from "pinia";

export default {
  name: "SetInitialPassword",
  components: {
    SetInitialPasswordDialog,
  },
  data: () => ({
    showDialog: false,
    userEmail: "",
    userId: "",
  }),
  mounted() {
    // Get email and userId from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    this.userEmail = urlParams.get("email") || "";
    this.userId = urlParams.get("userId") || "";

    if (this.userEmail && this.userId) {
      // Show the dialog automatically
      this.showDialog = true;
    } else {
      // Redirect to login if no valid parameters
      this.$router.push("/login");
    }
  },
  methods: {
    ...mapActions(useRootStore, ["setSnackbar"]),
    onPasswordSet() {
      this.setSnackbar({
        show: true,
        text: "Password set successfully! You can now log in.",
        color: "baseAccent",
      });

      // Redirect to login page
      setTimeout(() => {
        this.$router.push("/login");
      }, 2000);
    },
  },
};
</script>

<style lang="scss" scoped>
.set-password {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background-color: #393e46;
  background-size: cover;
  box-shadow: inset 0 0 0 2000px rgba(20, 30, 48, 0.9);

  .set-password-label {
    color: var(--v-baseAccent-base);
    text-transform: uppercase;
    text-align: center;
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  .set-password-description {
    color: var(--v-missionAccent-base);
    text-align: center;
    font-size: 1rem;
    max-width: 400px;
  }
}
</style>
