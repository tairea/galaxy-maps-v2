<template>
  <div class="course-frame">
    <div class="d-flex justify-space-between pa-0">
      <div class="d-flex">
        <img v-if="student.image?.url" class="galaxy-image" :src="student.image.url" />
        <div
          v-else
          class="imagePlaceholder"
          :style="{
            width: '40px',
            height: '40px',
            backgroundColor: stringToColour(student.firstName),
          }"
        >
          {{ first3Letters(student.firstName) }}
        </div>
        <h1 class="galaxy-title pt-2 pl-2">{{ student.firstName }}'s progress.</h1>
        <h1 class="galaxy-title pt-2 pl-2">
          <span style="font-weight: 400; text-transform: none; font-style: italic">
            (Each line represents a Galaxy Map)</span
          >
        </h1>
      </div>
    </div>
    <v-row>
      <v-col cols="12" class="center-col pa-0">
        <Chart
          ref="chart"
          class="chart"
          :chartType="chartType"
          :chartData="formatStudentsChartData(courseData)"
          :chartOptions="chartOptions"
          :style="{ width: '100%', height: '350px', padding: '0px 20px' }"
          :toolTipEnable="true"
          :timeframe="timeframe"
        />
      </v-col>
      <!-- <v-col cols="4" class="pa-0">
        <div class="top-row">
          <p class="label">MOST ACTIVE:</p>
        </div>
        <div class="bottom-row my-3">
          <p class="label">LEAST ACTIVE:</p>
        </div>
      </v-col> -->
    </v-row>
  </div>
</template>

<script>
import Chart from "@/components/Reused/Chart.vue";

export default {
  name: "ProgressionLineChartStudentCourses",
  props: ["courseData", "timeframe", "student"],
  components: {
    Chart,
  },

  data() {
    return {
      value: 80,
      previousTickTitle: "",
      chartType: "line",
      chartOptions: {
        layout: {
          padding: {
            // left: 5,
            // right: 20,
            // top: 15,
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: false,
          },
        },
        scales: {
          x: {
            type: "time",
            min: this.timeframe.min,
            max: this.timeframe.max,
            time: {
              unit: "day",
              displayFormats: {
                day: "EEE d MMM",
              },
            },
          },
          y: {
            ticks: {
              precision: 0,
            },
          },
        },
        maintainAspectRatio: false,
        animation: {
          duration: 1000,
          easing: "easeInOutQuart",
        },
      },
    };
  },
  async mounted() {},
  computed: {},
  methods: {
    formatStudentsChartData(courseData) {
      const datasets = [];
      const labels = [];

      // ======= test data - 30 students =======
      // for (var x = 0; x < 30; x++) {
      //   const studentColour = colours[x];
      //   const label = colours[x];
      //   const activities = [];
      //   // --- 10 statements ---
      //   for (var i = 0; i < 10; i++) {
      //     activities.push({
      //       x: DateTime.local(2022, 3, Math.floor(Math.random(0, 30) * 100)),
      //       y: Math.random(1, 100) * 100,
      //     });
      //   }

      // more than one course per student
      for (const course of courseData) {
        const courseColour = this.stringToColour(course.course.title);
        const label = course.course.title;

        const activities = course.activities
          // .filter((activity) => activity.status === "Completed" || activity.status === "Started")  // "Started" data points look wrong
          .filter((activity) => activity.status === "Completed")
          .sort((a, b) => new Date(a.timeStamp) - new Date(b.timeStamp)) // sort by lowest timestamp so the line is going the right way
          .map((activity, index) => {
            const sanitisedActivity = {
              ...activity,
              x: activity.timeStamp,
              y: index, // this is the new index based on the filtered array
            };
            return sanitisedActivity;
          });

        let courseData = {
          type: "line",
          backgroundColor: courseColour,
          borderColor: courseColour,
          borderRadius: 2,
          pointRadius: 2,
          borderWidth: 1,
          data: activities,
          label: label,
        };
        labels.push(label);
        datasets.push(courseData);
      }

      const datasetsObj = {
        labels,
        datasets,
      };

      return datasetsObj;
    },
    stringToColour(str) {
      return `hsl(${this.hashCode(str) % 360}, 100%, 70%)`;
    },
    hashCode(str) {
      let hash = 0;
      for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return hash;
    },
    first3Letters(name) {
      if (!name) return;
      return name.substring(0, 3).toUpperCase();
    },
  },
};
</script>

<style lang="scss" scoped>
.course-frame {
  border: 1px solid var(--v-galaxyAccent-base);
  margin-left: auto;
  margin-right: auto;
  padding: 10px;
  border-radius: 5px;
  // margin-bottom: 20px;

  .left-col {
    padding: 20px;
  }
}

.galaxy-title {
  font-size: 0.8rem;
  color: var(--v-galaxyAccent-base) !important;
  font-weight: 600;
  text-transform: uppercase;
  // margin: 20px 0px 5px 0px;
  color: white;
}

.galaxy-image {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.galaxy-description {
  margin-top: 10px;
  color: var(--v-galaxyAccent-base);
  font-size: 0.9rem;
}

.top-row {
  width: 100%;
  border-bottom: 1px solid var(--v-galaxyAccent-base);
  height: 50%;
}

.bottom-row {
  height: 50%;
}

.label {
  color: var(--v-galaxyAccent-base);
  font-size: 0.7rem;
  margin: 10px;
}

.imagePlaceholder {
  border-radius: 50%;
  background-color: rgba(200, 200, 200, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.6rem;
}
</style>
