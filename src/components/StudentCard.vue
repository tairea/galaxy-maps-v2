<template>
  <div class="student-card">
    <div class="student-section student-image-section text-center">
      <v-avatar
        color="secondary"
        @mouseenter="onhover = true"
        @mouseleave="onhover = false"
        size="50"
      >
        <img
          v-if="student.image"
          :src="student.image.url"
          :alt="student.firstName"
          style="object-fit: cover"
        />
        <v-icon v-else>mdi-account</v-icon>
      </v-avatar>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <p v-on="on" class="text-uppercase studentName text-truncate pt-2">{{student.firstName}}</p>
        </template>
        <span>{{student.firstName + ' ' + student.lastName}}</span>
      </v-tooltip>
      <p :class="online" class="status">{{loggedIn}}</p>
    </div>
    <div class="student-section student-main-section">
      <div v-if="topic">
        <v-row>
          <span class="caption pt-2">Current Mission</span>
        </v-row>
        <v-row>
          <h4 class="titles">{{ topic }} </h4>
        </v-row>
      </div>
      <div v-else-if="assignedCourse">
        <v-row>
          <span class="caption pt-2">Assigned Course</span>
        </v-row>
        <v-row>
          <h4 class="titles">{{ assignedCourse.title }} </h4>
        </v-row>
      </div>
      <div v-if="task" class="mt-4 mission-section">
        <v-row>
          <span class="caption">Current Task</span>
        </v-row>
        <v-row>
          <h4 class="titles">{{ task }} </h4>
        </v-row>
      </div>
      <h4 v-if="!topic && !assignedCourse" class="inactive-title">No active galaxies</h4>
    </div>
    <div v-if="missions.length" class="student-section student-minor-section">
      <v-row class="justify-center">
        <span class="caption pt-2">Completed Missions</span>
      </v-row>
      <v-row class="justify-center">
        <span class="numbers'">{{missions || '0'}}</span>
      </v-row>
    </div>
    <div v-if="hours" class="student-section student-minor-section">
      <v-row class="justify-center">
        <span class="caption pt-2">Completed hours</span>
      </v-row>
      <v-row class="justify-center">
        <span class="numbers">{{hours || '0'}}</span>
      </v-row>
    </div>
    <!--======= if requests and submissions =========-->
    <div v-if="work.length || help.length" class="student-section student-section-overUnder">
      <div v-if="work" class="section-overUnder">
        <v-row class="justify-center">
          <v-icon  :class="work.length ? 'active-icon' : 'inactive-icon'" large>mdi-attachment</v-icon>
        </v-row>
      </div>
      <div v-if="help" class="section-overUnder">
        <v-row class="justify-center">
          <v-icon :class="help.length ? 'active-icon' : 'inactive-icon'" large>mdi-message</v-icon>
        </v-row>
      </div>
    </div>
  </div>
</template>

<script>
import { min } from 'moment';
import { getStudentsCoursesXAPIQuery, queryXAPIStatement } from "../lib/veracityLRS";

// import EditStudentButtonDialog from "../components/EditStudentButtonDialog";
import { mapState, mapGetters } from 'vuex'
import { dbMixins } from "../mixins/DbMixins"
import { getCourseById } from "../lib/ff"

export default {
  name: "StudentCard",
  mixins: [dbMixins],
  components: {
    // EditStudentButtonDialog,
  },
  props: ["student"],
  data() {
    return {
      editing: false,
      topic: "", 
      task: "",
      missions: [],
      hours: "",
      work: [],
      help: [],
      assignedCourse: null,
      studetProfile: [],
      courseActivity: []
    };
  },
  async mounted () {
    if (this.currentCohort.courses?.length) {
      this.getAssignedCourse()
    }
    const studentCourses = await getStudentsCoursesXAPIQuery(this.student)
    console.log("studentCourses: ", studentCourses)
    // this.courseActivity = studentCourses.filter(course => this.assignedCourse.id === course.courseContext.id).reverse()
  },
  computed: {
    ...mapState(['currentCohort', 'userStatus']),
    ...mapGetters(['getCourseById']),
    status () {
      return this.userStatus[this.student.id]
    },
    loggedIn () {
      if (!this.status) return 'inactive'
      if (this.status.state === 'online') {
        return 'online'
      }
      else return this.timePassed() 
    },
    online () {
      if (this.loggedIn === 'online') return 'online'
    },
    // topic () {
    //   const topic = this.courseActivity.courseData.find(course => course.topic.length)
    //   return {
    //     status: 
    //   }
    // }
  },
  methods: {
    async getAssignedCourse () {
      const courseId = this.student.assignedCourses?.find(course => this.currentCohort.courses.includes(course))
      const course = await getCourseById(courseId)
      this.assignedCourse = course
    },
    first3Letters(name) {
      return name.substring(0, 3).toUpperCase();
    },
    timePassed () {
      var date = Math.round(Date.now() / 1000)
      var delta =  date - this.status.last_changed.seconds;

      // calculate (and subtract) whole days
      var days = Math.floor(delta / 86400);

      // calculate (and subtract) whole hours
      var hours = Math.floor(delta / 3600);

      // calculate (and subtract) whole minutes
      var minutes = Math.floor(delta / 60);
      
      if (minutes < 1) return `just now` 
      if (minutes < 60) return `${minutes}mins` 
      if (hours < 24) return `${hours}hrs`
      return `${days}days`
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

.status {
  font-size: 0.6rem;
  letter-spacing: 1px;
}

.student-card {
  border: 1px dashed var(--v-missionAccent-base);
  margin: 20px 10px;
  display: flex;

  .student-section {
    color: var(--v-missionAccent-base);
    font-size: 0.9rem;
    border-left: 1px dashed var(--v-missionAccent-base);
    padding: 10px 0px;
    flex-grow: 1;
  }

  .student-main-section {
    padding-left: 20px;
    padding-right: 20px;
    width: 30%;

    .student-edit-button {
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
    max-width: 18%;
    padding-bottom: 2px !important;

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
      font-size: 0.7rem;
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
  	
  .titles {
    text-transform: uppercase;
    font-weight: 500;
    color: var(--v-baseAccent-base);
  }
  
  .numbers {
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

  .inactive-title {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
    font-weight: 500;
    display: flex;
    justify-content: center;
    padding: 30px
  }
  
  .online {
    color: var(--v-baseAccent-base);
  }
}
</style>
