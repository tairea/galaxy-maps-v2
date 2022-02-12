<template>
  <div>
     <v-dialog v-model="dialog" width="35%" :light="dark" :dark="!dark">
      <!-- CREATE BUTTON -->
      <template v-slot:activator="{ on, attrs }">
        <v-btn :light="dark" :dark="!dark" style="font-weight:400" color="missionAccent" v-bind="attrs" v-on="on">
          <v-icon left>
            mdi-attachment
          </v-icon>
          Upload csv
        </v-btn>
      </template>

      <!-- DIALOG (TODO: make as a component)-->
      <div class="create-dialog">
        <!-- HEADER -->
        <div class="dialog-header">
          <p class="mb-0">
            Add Students
          </p>
        </div>
        <div class="create-dialog-content">
          <v-row class="pt-2 pl-2 pb-0">
            <v-col cols="6" class="pa-0">
              <v-btn 
                :dark="dark"
                :light="!dark"
                text 
                @click="downloadCsv()"
              >
                <span class="downloadCsv">download csv template</span>
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
                ></v-file-input>
              </div>
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
            width="40%"
            >{{ buttonLabel }}
          </v-btn>
          <v-btn
            @click="close"
            color="baseAccent"
            depressed
            class="ml-4 mt-4"
            width="40%"
            >cancel
          </v-btn>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<script>
import firebase from "firebase/app";
import { db, storage } from "../store/firestoreConfig";
import isEmpty from "lodash"

// csv import: https://codepen.io/edward1995/pen/QmXdwz?editors=1010
export default {
  name: "ImportCsvDialog",
  components: {},
  props: ["currentCohortId"],
  data() {
    return {
      dialog: false,
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
      csvColumns: ["Nsn Number","First Name","Last Name","Student Email","Parent Email"]
    };
  },
  filters: {
    capitalize: function(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    },
  },
  computed: {
    dark () {
      return this.$vuetify.theme.isDark
    }
  },
  methods: {
    close() {
      this.dialog = false
      this.channel_name = ""
      this.channel_fields = []
      this.channel_entries = []
      this.parse_header = []
      this.parse_csv = []
      this.sortOrders = {}
      this.sortKey = ""
      this.showTable = false
    },
    saveStudents() {
      this.loading = true;
      let counter = 0;
      // Add a new document in collection "people"
      this.parse_csv.forEach((student, index, array) => {
        student.assignedCohorts = [this.currentCohortId];

        
        const usersRef = db.collection("people").doc(student.nsnNumber);

        usersRef.get().then((docSnapshot) => {
          // if student exists, update assignedCohorts
          if (docSnapshot.exists) {
            usersRef.update({
              assignedCohorts: firebase.firestore.FieldValue.arrayUnion(
                this.currentCohortId
              ),
            }).then(() => {
              counter++;
                // check all students are saved to DB
                if (counter === array.length) {
                  this.saveStudentsCompleted();
                }
            });
          } else {
            usersRef
              .set(student)
              .then((docRef) => {
                counter++;
                // check all students are saved to DB
                if (counter === array.length) {
                  this.saveStudentsCompleted();
                }
              })
              .catch((error) => {
                console.error("Error writing document: ", error);
              });
          }
        });
      });
    },
    saveStudentsCompleted() {
      console.log("All students written to database");
      // this.$refs.csvFile.value = null;
      this.buttonLabel = "Students Successfully Added to Database";
      this.loading = false;
      this.showTable = false;
      this.disabled = true;
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
      console.log("headers", headers);
      vm.parse_header = lines[0].split(",");
      // camelize headers
      vm.parse_header = vm.parse_header.map((header) => {
        return vm.camelize(header);
      });
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

      var students = result.filter(student => (student.firstName))

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
      this.disabled = false;
      this.buttonLabel = "Add Students to Database";
    },
    downloadCsv () {
      var csv = this.csvColumns.join(',') + '\n'
      var hiddenElement = document.createElement('a')
      hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv)
      hiddenElement.target = '_blank'
      hiddenElement.download = 'students-list.csv'
      hiddenElement.click()
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
    font-weight:400;
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

.create-dialog-content {
  display: flex;
  justify-content: space-around;
  align-items: space-around;
  flex-direction: column;
  color: var(--v-missionAccent-base);
  padding: 20px;
  width: 100%;

  .custom-input {
    color: var(--v-missionAccent-base);
  }
}
</style>
