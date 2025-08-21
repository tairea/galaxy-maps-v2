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
    <v-row class="ma-2 mt-5">
      <div class="d-flex flex-column col-5">
        <v-btn
          v-if="parse_csv.length > 0"
          @click="saveStudents"
          color="missionAccent"
          outlined
          class="mr-4"
          :loading="loading"
          :disabled="disabled"
          width="100%"
          >{{ buttonLabel }}
        </v-btn>
        <span
          v-if="statusMessage"
          class="status-message"
          :class="{
            'missionAccent--text':
              !statusMessage.includes('Error') && !statusMessage.includes('failed'),
            'error--text': statusMessage.includes('Error') || statusMessage.includes('failed'),
          }"
        >
          <v-icon v-if="loading" small class="mr-1">{{ mdiLoading }}</v-icon>
          {{ statusMessage }}
        </span>
      </div>
      <div class="d-flex flex-column col-5">
        <v-btn @click="close" outlined width="40%">cancel </v-btn>
      </div>
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
import { mdiDownload, mdiLoading } from "@mdi/js";
import { mapState } from "pinia";

export default {
  name: "StudentImportCsv",
  components: {},
  data() {
    return {
      mdiDownload,
      mdiLoading,
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
      statusMessage: "", // Add status message for tracking import progress
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
      this.statusMessage = "";
      this.$emit("close");
    },
    async saveStudents() {
      this.loading = true;
      this.statusMessage = "";

      try {
        // Show initial status
        this.statusMessage = `Starting import of ${this.parse_csv.length} students...`;

        // Use the bulk import cloud function for better performance and reliability
        const result = await bulkImportStudents(
          this.parse_csv,
          this.currentCohortId,
          this.person.firstName + " " + this.person.lastName,
        );

        // Show completion status with detailed information
        if (result.summary.errors > 0) {
          this.statusMessage = `Import completed: ${result.summary.success} students imported successfully, ${result.summary.errors} errors encountered.`;
          console.warn(`Import completed with ${result.summary.errors} errors`);
          // You could show a more detailed error report here
        } else {
          this.statusMessage = `Successfully imported all ${result.summary.success} students!`;
        }

        // Keep the status message visible for a moment before closing
        setTimeout(() => {
          this.statusMessage = "";
        }, 3000);
      } catch (error) {
        console.error("Error during bulk import:", error);
        this.statusMessage = `Import failed: ${error.message || "Unknown error occurred"}`;
        // Keep error message visible longer
        setTimeout(() => {
          this.statusMessage = "";
        }, 5000);
        // You could show an error message to the user here
      }

      // this.$refs.csvFile.value = null;
      this.loading = false;
      this.showTable = false;
      this.disabled = true;
      this.dialog = false;
      this.$emit("close");
    },

    sortBy(key) {
      const vm = this;
      vm.sortKey = key;
      vm.sortOrders[key] = vm.sortOrders[key] * -1;
    },
    csvJSON(csv) {
      const vm = this;
      const lines = csv.split("\n");
      const result = [];
      const headers = lines[0].split(",");
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

        const obj = {};
        const currentline = line.split(",");
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

      const students = result.filter((student) => student.firstName);

      return students; // JavaScript object
    },
    loadCSV(e) {
      this.resetButton();
      this.showTable = true;
      this.statusMessage = "Processing CSV file...";
      console.log("loaded", e);
      const vm = this;
      if (window.FileReader) {
        const reader = new FileReader();
        reader.readAsText(e);
        // Handle errors load
        reader.onload = function (event) {
          event.target.result;
          const csv = event.target.result;
          vm.parse_csv = vm.csvJSON(csv);
          vm.statusMessage = `CSV processed: ${vm.parse_csv.length} students ready for import`;
          // Clear status message after a moment
          setTimeout(() => {
            vm.statusMessage = "";
          }, 2000);
        };
        reader.onerror = function (evt) {
          if (evt.target.error.name == "NotReadableError") {
            vm.statusMessage = "Error: Cannot read file!";
            alert("Cannot read file !");
          }
        };
      } else {
        this.statusMessage = "Error: FileReader not supported in this browser.";
        alert("FileReader are not supported in this browser.");
      }
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
      this.statusMessage = "";
    },
    downloadCsv() {
      const csv = this.csvColumns.join(",") + "\n";
      const hiddenElement = document.createElement("a");
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

.status-message {
  font-size: 0.8rem;
  font-style: italic;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.error--text {
    color: #f44336 !important; // Red color for errors
    font-weight: 500;
  }
}
</style>
