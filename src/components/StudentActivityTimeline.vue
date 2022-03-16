<template>
  <div :class="activityClass">
    <p :class="activityLabel">ACTIVITY</p>
    <div :class="statementClass">
      <p
        v-for="(activity, i) in courseAcivities"
        :key="i"
        class="ma-0"
        style="background-color: #141e30;"
      >
         - <span v-if="!studentCard">{{activity.timeStamp.time}} </span>
         <span>{{activity.timeStamp.date}} </span>
         <span :style="statusClass(activity)">{{activity.status}} {{activity.type}}: </span>
         <span>{{activity.title}}</span>
      </p>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { getActivityLogXAPIQuery } from "@/lib/veracityLRS";
import { DateTime } from "luxon";
export default {
  name: "StudentActivityTimeline",
  props: {
    studentCard: {type: Boolean, default: false},
    student: {type: Object}
  },
  data () {
    return {
      studentsActivityLog: []
    }
  },
  async mounted() {
    this.studentsActivityLog = await getActivityLogXAPIQuery(this.student);

  },
  computed: {
    ...mapGetters(["person"]),
    activityClass () {
      return this.studentCard ? "student-card-log" : "activity-log"
    },
    activityLabel () {
      return this.studentCard ? "student-card-label" : "label"
    },
    statementClass () {
      return this.studentCard ? "student-card-statement" : "statements"
    },
    courseAcivities() {
      const filtered = this.studentsActivityLog.filter(activity => activity.course)
      const sanitised = filtered.map((statement, index) => {
        let [action, title] = statement.description.split(": ");
        let [status, type] = action.split(" ");
        let id = statement.task

        let isoTime = this.formatTime(statement.timestamp);
        let [time, date] = isoTime.split(/(?<=^\S+)\s/)

        const newStatement = {
          timeStamp: {time, date},
          index,
          status,
          type,
          title,
          id,
          context: statement.context,
        };
        return newStatement;
      });
      return sanitised
    },
  },
  methods: {
    formatTime(time) {
      return DateTime.fromISO(time).toFormat("tt ccc dd LLL   ");
    },
    statusClass(activity) {
      switch (activity.status) {
        case 'Started': return 'color: var(--v-baseAccent-base);'
        case 'Completed': return 'color:var(--v-galaxyAccent-base)';
        case 'in-review': return 'color:var(--v-cohortAccent-base)';
      }
    }
  },
};
</script>

<style lang="scss" scoped>
.activity-log {
  color: var(--v-missionAccent-base);
  border: 1px solid var(--v-missionAccent-base);
  font-size: 0.6rem;
  max-height: 150px;
  width: 80%;
  margin-left: 5%;
  margin-right: auto;
  margin-bottom: 30px;
  overflow-y: scroll;
  overflow-x: hidden;
}

.label {
  color: var(--v-missionAccent-base);
  font-size: 0.7rem;
  margin: 10px;
}

.student-card-label {
  color: var(--v-missionAccent-base);
  font-size: 0.6rem;
  margin: 0px;
}

.student-card-statement {
  color: var(--v-missionAccent-base);
  max-height: 37px;
  width: 250px;
  overflow: hidden;
}

.student-card-log {
  font-size: 0.6rem;
  max-height: 100%;
  padding:2px;
  transition: all .2s ease-in-out; 
}

.student-card-log:hover {
  margin: 0px;
  width: 100%;
  transform: scale(1.2);
  font-size: 0.6rem;
  background-color: #141e30;  
  min-height: 100px;
  
  .student-card-statement{
    border: 1px solid var(--v-missionAccent-base);
    box-shadow: 0 0 30px var(--v-missionAccent-base);
    padding: 5px;
    background-color: #141e30;  
    max-height: 100px;
    width: 320px;
    overflow: scroll;
    overflow-x: hidden
  }
  /* width */
::-webkit-scrollbar {
  width: 2px;
}

}
</style>
