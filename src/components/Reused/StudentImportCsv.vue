<template>
  <div class="tab-content">
    <v-row class="pl-2 pb-0 mt-4">
      <v-col cols="6" class="pa-0">
        <v-btn :dark="dark" :light="!dark" text @click="downloadCsv()">
          <v-icon small color="missionAccent">{{ mdiDownload }}</v-icon>
          <span class="downloadCsv ml-2">download csv template</span>
        </v-btn>
      </v-col>
      <v-col cols="10">
        <div class="d-flex justify-center align-center">
          <v-file-input
            :dark="dark"
            :light="!dark"
            label="Upload CSV File"
            outlined
            dense
            hide-details
            color="missionAccent"
            id="csv_file"
            name="csv_file"
            class="form-control"
            @change="loadCSV"
            ref="csvFile"
          >
          </v-file-input>
        </div>
      </v-col>
    </v-row>

    <div v-if="showTable">
      <v-simple-table :dark="dark" :light="!dark" v-if="parse_csv" class="table">
        <thead>
          <tr>
            <th
              v-for="key in parse_header"
              @click="sortBy(key)"
              :class="{ active: sortKey == key }"
              :key="key.id"
            >
              {{ key | capitalize }}
              <span class="arrow" :class="sortOrders[key] > 0 ? 'asc' : 'dsc'"> </span>
            </th>
          </tr>
        </thead>
        <tr v-for="csv in parse_csv" :key="csv.id">
          <td class="pl-4" v-for="key in parse_header" :key="key.id">
            {{ csv[key] }}
          </td>
        </tr>
      </v-simple-table>
    </div>
    <v-row class="ma-2 mt-10">
      <v-btn
        v-if="parse_csv.length > 0"
        @click="saveStudents"
        color="missionAccent"
        outlined
        class="mr-4"
        :loading="loading"
        :disabled="disabled"
        width="40%"
        >{{ buttonLabel }}
      </v-btn>
      <v-btn @click="close" outlined width="40%">cancel </v-btn>
    </v-row>
  </div>
</template>

<script>
import {
  fetchCohortByCohortId,
  fetchPersonByEmail,
  createPerson,
  addPersonToCohort,
  assignCourseToPerson,
  bulkImportStudents,
} from "@/lib/ff";
import useRootStore from "@/store/index";
import { mdiDownload } from "@mdi/js";
import { mapState } from "pinia";

export default {
  name: "StudentImportCsv",
  components: {},
  data() {
    return {
      mdiDownload,
      dialog: false,
      channel_name: "",
      channel_fields: [],
      channel_entries: [],
      parse_header: [],
      parse_csv: [],
      sortOrders: {},
      sortKey: "",
      showTable: false,
      buttonLabel: "Add Navigators",
      loading: false,
      disabled: false,
      csvColumns: [
        "First Name",
        "Last Name",
        "Email",
        // "Parent Email",
      ],
      cohort: null,
    };
  },
  filters: {
    capitalize: function (str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    },
  },
  computed: {
    ...mapState(useRootStore, ["currentCohortId", "person"]),
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  async mounted() {
    this.cohort = await fetchCohortByCohortId(this.currentCohortId);
  },
  methods: {
    close() {
      this.dialog = false;
      this.channel_name = "";
      this.channel_fields = [];
      this.channel_entries = [];
      this.parse_header = [];
      this.parse_csv = [];
      this.sortOrders = {};
      this.sortKey = "";
      this.showTable = false;
      this.$emit("close");
    },
    async saveStudents() {
      this.loading = true;
      console.log("saving students");

      try {
        // Use the bulk import cloud function for better performance and reliability
        const result = await bulkImportStudents(
          this.parse_csv,
          this.currentCohortId,
          this.person.firstName + " " + this.person.lastName,
        );

        console.log("Bulk import completed:", result);

        // Show results to user
        if (result.summary.errors > 0) {
          console.warn(`Import completed with ${result.summary.errors} errors`);
          // You could show a more detailed error report here
        }

        console.log(
          `Successfully processed ${result.summary.success}/${result.summary.total} students`,
        );
      } catch (error) {
        console.error("Error during bulk import:", error);
        // You could show an error message to the user here
      }

      console.log("All students written to database");
      // this.$refs.csvFile.value = null;
      this.loading = false;
      this.showTable = false;
      this.disabled = true;
      this.dialog = false;
      this.$emit("close");
    },

    sortBy(key) {
      var vm = this;
      vm.sortKey = key;
      vm.sortOrders[key] = vm.sortOrders[key] * -1;
    },
    csvJSON(csv) {
      var vm = this;
      var lines = csv.split("\n");
      var result = [];
      var headers = lines[0].split(",");
      console.log("headers", headers);
      vm.parse_header = lines[0].split(",");
      // camelize headers
      vm.parse_header = vm.parse_header.map((header) => {
        return vm.camelize(header);
      });
      lines[0].split(",").forEach(function (key) {
        vm.sortOrders[key] = 1;
      });

      lines.map((line, indexLine) => {
        if (indexLine < 1) return; // Jump header line

        var obj = {};
        var currentline = line.split(",");
        // currentline[currentline.length - 1] = currentline[currentline.length - 1].trim()

        headers.map((header, indexHeader) => {
          // camelize headers
          let value = currentline[indexHeader];

          // Clean email addresses - remove carriage returns, line breaks, and trim whitespace
          if (this.camelize(header) === "email") {
            value = value.replace(/[\r\n]/g, "").trim();
          }

          obj[this.camelize(header)] = value;
        });

        result.push(obj);
      });

      var students = result.filter((student) => student.firstName);

      return students; // JavaScript object
    },
    loadCSV(e) {
      this.resetButton();
      this.showTable = true;
      console.log("loaded", e);
      var vm = this;
      if (window.FileReader) {
        var reader = new FileReader();
        reader.readAsText(e);
        // Handle errors load
        reader.onload = function (event) {
          event.target.result;
          var csv = event.target.result;
          vm.parse_csv = vm.csvJSON(csv);
          console.log("csv = ", vm.parse_csv);
        };
        reader.onerror = function (evt) {
          if (evt.target.error.name == "NotReadableError") {
            alert("Cannot read file !");
          }
        };
      } else {
        alert("FileReader are not supported in this browser.");
      }
      console.log("this.parse_csv", this.parse_csv);
    },
    camelize(str) {
      return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
        if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
      });
    },
    resetButton() {
      this.disabled = false;
      this.buttonLabel = "Add Students";
    },
    downloadCsv() {
      var csv = this.csvColumns.join(",") + "\n";
      var hiddenElement = document.createElement("a");
      hiddenElement.href = "data:text/csv;charset=utf-8," + encodeURI(csv);
      hiddenElement.target = "_blank";
      hiddenElement.download = "navigators-list-template.csv";
      hiddenElement.click();
    },
  },
};
</script>

<style lang="scss" scoped>
.downloadCsv {
  font-size: 0.8rem;
  font-weight: 400;
  text-transform: uppercase;
  color: var(--v-missionAccent-base);
}

.table {
  font-size: 0.8rem;
  margin: 20px;
  border: 1px solid var(--v-missionAccent-base);
  border-radius: 0px;
  padding: 5px;
}

.theme--dark.v-data-table {
  background: #141e30;
}

// ---- SCROLLBAR STYLES ----
/* width */
.table .v-data-table__wrapper::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

/* Track */
.table .v-data-table__wrapper::-webkit-scrollbar-track {
  background: var(--v-background-base);
}

/* Handle */
.table .v-data-table__wrapper::-webkit-scrollbar-thumb:horizontal {
  background: var(--v-missionAccent-base);
}

/* Handle on hover */
.table .v-data-table__wrapper::-webkit-scrollbar-thumb:hover {
  background: var(--v-missionAccent-base);
}

.tab-content {
  display: flex;
  justify-content: space-around;
  align-items: space-around;
  flex-direction: column;
  color: var(--v-missionAccent-base);
  padding: 20px;
  width: 100%;
  background-color: var(--v-background-base);

  .custom-input {
    color: var(--v-missionAccent-base);
  }
}
</style>
