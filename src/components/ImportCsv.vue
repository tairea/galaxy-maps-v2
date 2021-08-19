<template>
  <div class="importContainer">
    <div class="people-frame mb-5">
      <h2 class="people-label">IMPORT STUDENTS</h2>
      <v-row class="pt-9 pl-2">
        <v-col cols="6">
          <div class="d-flex justify-center align-center">
            <!-- <input
              label="Upload CSV File"
              type="file"
              id="csv_file"
              name="csv_file"
              class="form-control"
              @change="loadCSV($event)"
            > -->
            <v-file-input
              label="Upload CSV File"
              outlined
              dense
              color="missionAccent"
              id="csv_file"
              name="csv_file"
              class="form-control"
              @change="loadCSV"
            ></v-file-input>
          </div>
        </v-col>
      </v-row>
    </div>

    <!-- <div class="col-sm-offset-3 col-sm-9">
              <div class="checkbox-inline">
                <label for="header_rows"
                  ><input type="checkbox" id="header_rows" /> File contains
                  header row?</label
                >
              </div>
            </div>

            <div class="col-sm-offset-3 col-sm-9">
              <a href="#" class="btn btn-primary">Parse CSV</a>
            </div> -->
    <div v-if="showTable" class="people-frame">
      <h2 class="people-label">IMPORTED</h2>
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
  </div>
</template>

<script>
// csv import: https://codepen.io/edward1995/pen/QmXdwz?editors=1010
export default {
  name: "ImportCsv",
  components: {},
  props: [],
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
    };
  },
  filters: {
    capitalize: function(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    },
  },
  methods: {
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
      vm.parse_header = lines[0].split(",");
      lines[0].split(",").forEach(function(key) {
        vm.sortOrders[key] = 1;
      });

      lines.map(function(line, indexLine) {
        if (indexLine < 1) return; // Jump header line

        var obj = {};
        var currentline = line.split(",");

        headers.map(function(header, indexHeader) {
          obj[header] = currentline[indexHeader];
        });

        result.push(obj);
      });

      result.pop(); // remove the last item because undefined values

      return result; // JavaScript object
    },
    loadCSV(e) {
      this.showTable = true;
      console.log("loaded", e);
      var vm = this;
      if (window.FileReader) {
        var reader = new FileReader();
        reader.readAsText(e);
        // Handle errors load
        reader.onload = function(event) {
          event.target.result
          var csv = event.target.result;
          vm.parse_csv = vm.csvJSON(csv);
        };
        reader.onerror = function(evt) {
          if (evt.target.error.name == "NotReadableError") {
            alert("Canno't read file !");
          }
        };
      } else {
        alert("FileReader are not supported in this browser.");
      }
      console.log("this.parse_csv",this.parse_csv)
    },
  },
};
</script>

<style lang="scss" scoped>
.importContainer {
  width: 100%;
  margin: 30px 0px;
}

.people-frame {
  position: relative;
  width: 100%;
  // margin: 30px 20px;
  border: 1px solid var(--v-missionAccent-base);

  .people-label {
    font-size: 0.8rem;
    font-weight: 400;
    text-transform: uppercase;
    // ribbon label
    position: absolute;
    top: -1px;
    left: -1px;
    background-color: var(--v-missionAccent-base);
    color: var(--v-background-base);
    padding: 0px 30px 0px 5px;
    clip-path: polygon(0 0, 100% 0, 90% 100%, 0% 100%);
  }
}


.table {
  font-size: 0.75rem;
  padding: 20px;
}
</style>
