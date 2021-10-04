<template>
  <div class="ma-4">
    <v-text-field
      class="my-4 searchInput"
      color="missionAccent"
      v-model="search"
      append-icon="mdi-magnify"
      label="Search"
      single-line
      hide-details
    ></v-text-field>
    <v-data-table
      :headers="headers"
      :items="students"
      :items-per-page="-1"
      :search="search"
      loading
    ></v-data-table>
  </div>
</template>

<script>
// import EditStudentButtonDialog from "../components/EditStudentButtonDialog";

export default {
  name: "StudentsDataTable",
  components: {
    // EditStudentButtonDialog,
  },
  props: ["students"],
  data() {
    return {
       search: "",
      headers: [
        {
          text: "First Name",
          align: "start",
          value: "firstName",
        },
        { text: "Last Name", value: "lastName" },
        { text: "NSN #", value: "nsnNumber" },
        { text: "Email", value: "studentEmail" },
      ],
    };
  },
  methods: {
    first3Letters(name) {
      return name.substring(0, 3).toUpperCase();
    },
  },
};
</script>

<style lang="scss" scoped>
p {
  margin: 0px !important;
}

a {
  color: var(--v-missionAccent-base) !important;
}

.student-card {
  border: 1px dashed var(--v-missionAccent-base);
  margin: 20px 10px;
  display: flex;

  .student-section {
    margin: 0px;
    color: var(--v-missionAccent-base);
    font-size: 0.9rem;
    border-left: 1px dashed var(--v-missionAccent-base);
    padding: 20px 0px;
    flex-grow: 1;
  }

  .student-main-section {
    // flex-grow: 2 !important;
    width: 30%;
    position: relative;

    .student-edit-button {
      // position: absolute;
      // bottom: 10px;
      // left: 10px;
      font-size: 0.7rem;
    }
  }

  .student-title {
    font-size: 1.2rem;
    color: var(--v-missionAccent-base);
    font-weight: 600;
    text-transform: uppercase;
    margin: 5px 0px;
  }

  .student-image-section {
    // flex-grow: 0 !important;
    // flex-shrink: 1 !important;
    width: 30px;

    .imagePlaceholder {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: rgba(200, 200, 200, 0.3);
      display: flex;
      justify-content: center;
      align-items: center;
      margin: auto;
    }

    .studentName {
      font-size: 0.6rem;
      letter-spacing: 2px;
      text-align: center;
    }
  }

  .student-section-overUnder {
    padding: 0px !important;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .section-overUnder {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
    }

    .section-overUnder:first-child {
      border-bottom: 1px dashed var(--v-missionAccent-base);
    }
  }
}
</style>
