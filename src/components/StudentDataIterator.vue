<template>
  <v-container fluid>
    <v-data-iterator
      :items="students"
      :items-per-page="-1"
      :search="search"
      :sort-by="sortBy"
      :sort-desc="sortDesc"
      hide-default-footer
      no-data-text="No Students"
    >
      <!-- HEADER -->
      <template v-slot:header>
        <v-row class="mt-3"> 
          <v-col cols="6">
            <v-text-field
              v-model="search"
              clearable
              flat
              
              hide-details
              prepend-inner-icon="mdi-magnify"
              label="Search"
              dense
              outlined
              color="missionAccent"
            ></v-text-field>
          </v-col>
          <v-col cols="6"  class="d-flex">
            <template v-if="$vuetify.breakpoint.mdAndUp">
              
              <v-spacer></v-spacer>
              <v-select
                v-model="sortBy"
                flat
                
                hide-details
                :items="keys"
                prepend-inner-icon="mdi-sort-alphabetical-variant"
                label="Sort by"
                dense
                color="missionAccent"
                outlined
              ></v-select>
              <!-- <v-spacer></v-spacer> -->
              <v-btn-toggle v-model="sortDesc" mandatory style="background-color: transparent;" tile class="d-flex justify-center align-center ml-2">
                <v-btn depressed color="missionAccent" :value="false" small>
                  <v-icon small>mdi-arrow-up</v-icon>
                </v-btn class="d-flex justify-center align-center">
                <v-btn depressed color="missionAccent" :value="true" small>
                  <v-icon small>mdi-arrow-down</v-icon>
                </v-btn>
              </v-btn-toggle>
            
            </template>
          </v-col>
        </v-row>
      </template>
      <!-- END HEADER -->

      <!-- PROPS -->
      <template v-slot:default="props">
        <StudentCard
          v-for="student in props.items"
          :key="student.id"
          :student="student"
        />
      </template>

      <template v-slot:no-data>
        <p class="ma-10 noStudents">No Students in this Cohort</p>
      </template>
    </v-data-iterator>
  </v-container>
</template>

<script>
import StudentCard from "../components/StudentCard";

export default {
  name: "StudentsDataTable",
  components: {
    // EditStudentButtonDialog,
    StudentCard,
  },
  props: ["students"],
  data() {
    return {
      search: "",
      sortDesc: false,
      sortBy: "firstName",
      keys: ["firstName", "lastName", "nsnNumber", "studentEmail"],
    };
  },
  mounted() {
    console.log("this.students", this.students);
  },
  computed: {
    filteredKeys() {
      return this.keys.filter((key) => key !== "Name");
    },
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

.noStudents {
font-size: 0.8rem;
      letter-spacing: 2px;
      text-align: center;
      color: var(--v-missionAccent-base);
      text-transform: uppercase;
}
</style>
