<template>
  <div class="importContainer">
      <v-row class="pt-2 pl-2">
        <v-col cols="6">
          <div class="d-flex justify-center align-center">
            <v-file-input
              label="Upload CSV File"
              outlined
              dense
              color="missionAccent"
              id="csv_file"
              name="csv_file"
              class="form-control"
              @change="loadCSV"
              ref="csvFile"
            ></v-file-input>
          </div>
        </v-col>
        <v-col cols="6">
          <p class="downloadCsv" >download csv template</p>
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
              <span class="arrow" :class="sortOrders[key] > 0 ? 'asc' : 'dsc'">
              </span>
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
      >{{buttonLabel}}
      </v-btn
    >
  </div>
</template>

<script>
import { db, storage } from "../store/firestoreConfig";

// csv import: https://codepen.io/edward1995/pen/QmXdwz?editors=1010
export default {
  name: "ImportCsv",
  components: {},
  props: ["currentCohortId"],
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
    };
  },
  filters: {
    capitalize: function(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    },
  },
  methods: {
    saveStudents() {
      this.loading = true;
      let counter = 0;
      // Add a new document in collection "people"
      this.parse_csv.forEach((student, index, array) => {
        student.enrolledCohorts = [this.currentCohortId]
        db.collection("people")
          .doc(student.nsnNumber)
          .set(student)
          .then((docRef) => {
            counter++
            // check all students are saved to DB
            if(counter === array.length) {
              this.saveStudentsCompleted()
            }
          })
          .catch((error) => {
            console.error("Error writing document: ", error);
          });
      });
    },
    saveStudentsCompleted() {
      console.log("All students written to database");
      // this.$refs.csvFile.value = null;
      this.buttonLabel = "Students Successfully Added to Database"
      this.loading = false
      this.showTable = false
      this.disabled = true
    },
    sortBy: function(key) {
      var vm = this;
      vm.sortKey = key;
      vm.sortOrders[key] = vm.sortOrders[key] * -1;
    },
    csvJSON(csv) {
      var vm = this;
      var lines = csv.split("\n");
      var result = [];
      var headers = lines[0].split(",");
      console.log("headers",headers)
      vm.parse_header = lines[0].split(",");
      // camelize headers
      vm.parse_header = vm.parse_header.map(header => {
        return vm.camelize(header)
      })
      lines[0].split(",").forEach(function(key) {
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

      //result.pop(); // remove the last item because undefined values
      console.log("result = ", result);
      return result; // JavaScript object
    },
    loadCSV(e) {
      this.resetButton()
      this.showTable = true;
      console.log("loaded", e);
      var vm = this;
      if (window.FileReader) {
        var reader = new FileReader();
        reader.readAsText(e);
        // Handle errors load
        reader.onload = function(event) {
          event.target.result;
          var csv = event.target.result;
          vm.parse_csv = vm.csvJSON(csv);
          console.log("csv = ", vm.parse_csv);
        };
        reader.onerror = function(evt) {
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
      return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
        if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
      });
    },
    resetButton() {
      this.disabled = false
      this.buttonLabel = "Add Students to Database"
    }
  },
};
</script>

<style lang="scss" scoped>
.importContainer {
  width: 100%;
  margin: 30px 0px;

  .downloadCsv {
    font-size: 0.8rem;
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
