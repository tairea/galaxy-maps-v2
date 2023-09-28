<template>
  <div class="importContainer">
    <v-row class="pt-2 pl-2 pb-0">
      <v-col cols="10">
        <div class="d-flex justify-center align-center">
          <v-file-input
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
          ></v-file-input>
        </div>
      </v-col>
      <v-col cols="6" class="pt-0">
        <v-btn text @click="downloadCsv()">
          <span class="downloadCsv">download csv template</span>
        </v-btn>
      </v-col>
    </v-row>

    <div v-if="showTable" class="people-frame">
      <v-simple-table v-if="parse_csv" class="table">
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
          <td v-for="key in parse_header" :key="key.id">
            {{ csv[key] }}
          </td>
        </tr>
      </v-simple-table>
    </div>

    <v-btn
      v-if="parse_csv.length > 0"
      @click="saveStudents"
      color="missionAccent"
      depressed
      class="ml-4 mt-4"
      :loading="loading"
      :disabled="disabled"
      >{{ buttonLabel }}
    </v-btn>
  </div>
</template>

<script>
import { fetchCohortById, fetchCourseById } from "@/lib/ff";
import { db, storage } from "@/store/firestoreConfig";
import useRootStore from "@/store/index";
import firebase from "firebase/compat/app";
import { doc, updateDoc, FieldValue } from "firebase/firestore";
import isEmpty from "lodash";
import { mapState } from "pinia";

// csv import: https://codepen.io/edward1995/pen/QmXdwz?editors=1010
export default {
  name: "ImportCsv",
  components: {},
  data() {
    return {
      channel_name: "",
      channel_fields: [],
      channel_entries: [],
      parse_header: [],
      parse_csv: [],
      sortOrders: {},
      sortKey: "",
      showTable: false,
      buttonLabel: "Add Students to Database",
      loading: false,
      disabled: false,
      csvColumns: ["Nsn Number", "First Name", "Last Name", "Student Email"], // Add "Parent Email later
    };
  },
  filters: {
    capitalize: function (str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    },
  },
  computed: {
    ...mapState(useRootStore, ["currentCohortId"]),
  },
  methods: {
    async saveStudents() {
      this.loading = true;
      // Add a new document in collection "people"
      await Promise.all(
        this.parse_csv.map(async (student) => {
          student.assignedCohorts = [this.currentCohortId];

          // FIXME: why is this using nsnNumber?
          const usersRef = doc(db, "people", student.nsnNumber);

          const userDoc = await usersRef.get();

          // if student exists, update assignedCohorts
          if (userDoc.exists) {
            await updateDoc(usersRef, {
              assignedCohorts: FieldValue.arrayUnion(this.currentCohortId),
            });
          } else {
            await usersRef.set(student);
          }
        }),
      );

      console.log("All students written to database");
      // this.$refs.csvFile.value = null;
      this.buttonLabel = "Students Successfully Added to Database";
      this.loading = false;
      this.showTable = false;
      this.disabled = true;
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
          obj[this.camelize(header)] = currentline[indexHeader];
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
      this.buttonLabel = "Add Students to Database";
    },
    downloadCsv() {
      var csv = this.csvColumns.join(",") + "\n";
      var hiddenElement = document.createElement("a");
      hiddenElement.href = "data:text/csv;charset=utf-8," + encodeURI(csv);
      hiddenElement.target = "_blank";
      hiddenElement.download = "students-list.csv";
      hiddenElement.click();
    },
  },
};
</script>

<style lang="scss" scoped>
.importContainer {
  width: 100%;
  margin: 30px 0px;

  .downloadCsv {
    font-size: 0.8rem;
    font-weight: 400;
    text-transform: uppercase;
    color: var(--v-missionAccent-base);
  }
}

.table {
  font-size: 0.75rem;
  padding: 20px;
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
</style>
