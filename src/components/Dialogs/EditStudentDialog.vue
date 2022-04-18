<template>
  <div>
    <v-dialog v-model="dialog" width="35%" :light="dark" :dark="!dark">
      <!-- DIALOG (TODO: make as a component)-->
      <div class="create-dialog">
        <!-- HEADER -->
        <div class="dialog-header">
          <p class="mb-0">Edit Student</p>
        </div>
        <CreateAccountForm 
          accountType="student" 
          :student="student" 
          :edit="true"
          @updateStudentProfile="$emit('updateStudentProfile', $event)"
          @close="$emit('cancel')" 
        />
      </div>
    </v-dialog>
  </div>
</template>

<script>
import CreateAccountForm from "../CreateAccountForm"

export default {
  name: "EditStudentDialog",
  components: {
    CreateAccountForm
  },
  props: {
    student: { type: Object },
    dialog: { type: Boolean, default: false}
  },
   computed: {
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
}  
</script>

<style lang="scss" scoped>
// new dialog ui
.create-dialog {
  color: var(--v-missionAccent-base);
  background-color: var(--v-background-base);
  border: 1px solid var(--v-missionAccent-base);
  display: flex;
  flex-wrap: wrap;
  overflow-x: hidden;

  .dialog-header {
    width: 100%;
    padding: 20px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--v-missionAccent-base);
  }
}

</style>
