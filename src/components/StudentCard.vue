<template>
  <div class="student-card">
    <div class="student-section student-image-section text-center">
      <v-avatar
        color="secondary"
        @mouseenter="onhover = true"
        @mouseleave="onhover = false"
        size="70"
      >
        <img
          v-if="student.image"
          :src="student.image.url"
          :alt="student.firstName"
          style="object-fit: cover"
        />
        <!-- <v-icon v-if="hover">mdi-pencil</v-icon> -->
        <v-icon v-else>mdi-account</v-icon>
      </v-avatar>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <p v-on="on" class="text-uppercase studentName text-truncate pt-2">{{student.firstName}}</p>
        </template>
        <span>{{student.firstName + ' ' + student.lastName}}</span>
      </v-tooltip>
      <p class="login pt-2">{{lastLoggedIn}}</p>
    </div>
    <div class="student-section student-main-section">
        <div>
          <v-row>
            <span class="caption pt-2">Current Mission</span>
          </v-row>
          <v-row>
            <h3 :class="topic ? 'active-title':'inactive-title'">{{topic || 'No active Planet'}} </h3>
          </v-row>
        </div>
        <div class="mt-6 mission-section">
          <v-row>
            <span class="caption">Current Task</span>
          </v-row>
          <v-row>
            <h3 :class="task ? 'active-title':'inactive-title'">{{task || 'No active mission'}} </h3>
          </v-row>
        </div>
    </div>
    <div class="student-section student-minor-section">
      <v-row class="justify-center">
        <span class="caption pt-2">Completed Missions</span>
      </v-row>
      <v-row class="justify-center">
        <span :class="missions ? 'active-number' : 'inactive-number'">{{missions || '0'}}</span>
      </v-row>
    </div>
    <div class="student-section student-minor-section">
      <v-row class="justify-center">
        <span class="caption pt-2">Completed hours</span>
      </v-row>
      <v-row class="justify-center">
        <span :class="hours ? 'active-number' : 'inactive-number'">{{hours || '0'}}</span>
      </v-row>
    </div>
    <div class="student-section student-section-overUnder">
      <div class="section-overUnder">
        <v-row class="justify-center">
          <v-icon  :class="work.length ? 'active-icon' : 'inactive-icon'" large>mdi-attachment</v-icon>
        </v-row>
      </div>
      <div class="section-overUnder">
        <v-row class="justify-center">
          <v-icon :class="help.length ? 'active-icon' : 'inactive-icon'" large>mdi-message</v-icon>
        </v-row>
      </div>
    </div>
  </div>
</template>

<script>
import { min } from 'moment';
// import EditStudentButtonDialog from "../components/EditStudentButtonDialog";

export default {
  name: "StudentsCard",
  components: {
    // EditStudentButtonDialog,
  },
  props: ["student"],
  data() {
    return {
      editing: false,
      course: "", 
      topic: "", 
      task: "",
      missions: "",
      hours: "",
      work: [],
      help: []
    };
  },
  computed: {
    lastLoggedIn () {
      if (!this.student.lastLoggedIn) return ''
      return this.timePassed()
    },
  },
  methods: {
    first3Letters(name) {
      return name.substring(0, 3).toUpperCase();
    },
    timePassed () {
      console.log(Date.now)
      // get total seconds between the times
      var delta = Math.abs(this.student.lastLoggedIn - Date.now) / 1000;

      // calculate (and subtract) whole days
      var days = Math.floor(delta / 86400);
      delta -= days * 86400;

      // calculate (and subtract) whole hours
      var hours = Math.floor(delta / 3600) % 24;
      delta -= hours * 3600;

      // calculate (and subtract) whole minutes
      var minutes = Math.floor(delta / 60) % 60;
      delta -= minutes * 60;

      if (minutes < 60) return minutes
      if (hours < 24) return hours
      return days 
    }
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

.login {
  font-size: 0.7rem;
  letter-spacing: 2px;
}

.student-card {
  border: 1px dashed var(--v-missionAccent-base);
  margin: 20px 10px;
  display: flex;

  .student-section {
    // margin: 0px;
    color: var(--v-missionAccent-base);
    font-size: 0.9rem;
    border-left: 1px dashed var(--v-missionAccent-base);
    padding: 10px 0px;
    flex-grow: 1;
  }

  .student-main-section {
    // flex-grow: 2 !important;
    padding-left: 20px;
    padding-right: 20px;
    width: 30%;
    // position: relative;

    .student-edit-button {
      // position: absolute;
      // bottom: 10px;
      // left: 10px;
      font-size: 0.7rem;
    }
  }

  .student-minor-section {
    max-width:18%;
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
      font-size: 0.9rem;
      letter-spacing: 2px;
      text-align: center;
    }
  }

  .student-section-overUnder {
    display: flex;
    flex-direction: column;
    justify-content: center;
    max-width: 20%;

    .section-overUnder {
      display: flex;
      justify-content: center;
      width: 100%;
      height: 100%;
    }

    .section-overUnder:first-child {
      border-bottom: 1px dashed var(--v-missionAccent-base);
    }
  }
  	
  .active-title {
    text-transform: uppercase;
    font-weight: 500;
    color: var(--v-baseAccent-base);
  }

  .inactive-title {
    text-transform: uppercase;
    font-weight: 500;
    color: var(--v-galaxyAccent-base);
    opacity: 50%;
  }

  .inactive-number {
    font-size: 4rem;
    color: var(--v-galaxyAccent-base);
    opacity: 50%;
  }
  
  .active-number {
    font-size: 4rem;
    color: var(--v-baseAccent-base);
  }
  
  .inactive-icon {
    color: var(--v-galaxyAccent-base);
    opacity: 50%;
  }

  .active-icon {
    color: var(--v-cohortAccent-base);
  }
}
</style>
