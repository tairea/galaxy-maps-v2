<template>
  <div class="create-dialog-content">
    <p v-if="!teacher" class="caption mb-0">
      Adding this student will send a registration link to their email
    </p>
    <!-- TODO: info description for adding a teacher? -->
    <v-form ref="form" v-model="valid" lazy-validation>
      <v-text-field
        :dark="dark"
        :light="!dark"
        type="text"
        v-model="account.firstName"
        label="First Name"
        outlined
        class="mt-6"
        color="missionAccent"
      ></v-text-field>
      <v-text-field
        :dark="dark"
        :light="!dark"
        type="text"
        v-model="account.lastName"
        label="Last Name"
        outlined
        color="missionAccent"
      ></v-text-field>
      <v-text-field
        :dark="dark"
        :light="!dark"
        type="email"
        v-model="account.email"
        label="E-mail"
        :rules="emailRules"
        required
        outlined
        color="missionAccent"
      ></v-text-field>
      <v-text-field
        v-if="!teacher"
        :dark="dark"
        :light="!dark"
        type="email"
        v-model="account.parentEmail"
        label="Parent E-mail"
        outlined
        color="missionAccent"
        :rules="account.parentEmail.length ? parentEmailRules : []"
      ></v-text-field>
      <v-text-field
        v-if="!teacher"
        :dark="dark"
        :light="!dark"
        type="text"
        v-model="account.nsn"
        label="Student NSN"
        required
        outlined
        color="missionAccent"
      ></v-text-field>
      <v-text-field
        v-if="!teacher"
        :dark="dark"
        :light="!dark"
        type="text"
        v-model="account.inviter"
        label="Added by"
        required
        outlined
        color="missionAccent"
        :value="person.firstName + ' ' + person.lastName"
      ></v-text-field>
    </v-form>
    <v-row>
      <v-btn
        v-if="edit"
        :disabled="!valid || addingAccount"
        :loading="addingAccount"
        @click="update()"
        width="30%"
        class="ma-4 disabledButton"
        color="missionAccent"
        outlined
        :dark="dark"
        :light="!dark"
      >
        Update
      </v-btn>
      <v-btn
        v-else
        :disabled="!valid || addingAccount"
        :loading="addingAccount"
        @click="create()"
        width="30%"
        class="ma-4 disabledButton"
        color="missionAccent"
        outlined
        :dark="dark"
        :light="!dark"
      >
        Create
      </v-btn>
      <v-btn
        :disabled="addingAccount"
        @click="close()"
        outlined
        :dark="dark"
        :light="!dark"
        class="ma-4"
        width="30%"
      >
        cancel
      </v-btn>
    </v-row>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { dbMixins } from "../mixins/DbMixins";
import { getCourseById } from "../lib/ff";
import { db } from "../store/firestoreConfig";
import { startGalaxyXAPIStatement } from "../lib/veracityLRS";

export default {
  name: "CreateAccountForm",
  mixins: [dbMixins],
  props: {
    accountType: { type: String },
    student: { type: Object },
    edit: { type: Boolean, default: false },
  },
  mounted() {
    if (this.edit)
      this.account = {
        ...this.account,
        ...this.student,
      };
  },
  data: () => ({
    addingAccount: false,
    valid: true,
    account: {
      id: "",
      firstName: "",
      lastName: "",
      email: "",
      displayName: "",
      nsn: "",
      inviter: "",
      parentEmail: "",
    },
    emailRules: [
      (v) => !!v || "E-mail is required",
      (v) => /.+@.+\..+/.test(v) || "E-mail must be valid",
    ],
    parentEmailRules: [(v) => /.+@.+\..+/.test(v) || "E-mail must be valid"],
  }),
  computed: {
    ...mapGetters(["person", "currentCohort"]),
    teacher() {
      return this.accountType === "teacher";
    },
    dark() {
      return this.$vuetify.theme.isDark;
    },
  },
  methods: {
    close() {
      this.account = {
        firstName: "",
        lastName: "",
        email: "",
        displayName: "",
        nsn: "",
        inviter: "",
        parentEmail: "",
      };
      this.$emit("close");
    },
    async update() {
      let obj = Object.fromEntries(
        Object.entries(this.account).filter(([_, v]) => v.length)
      );

      db.collection("people")
        .doc(obj.id)
        .update(obj)
        .then(() => {
          this.$emit("updateStudentProfile", obj);
          this.$store.commit("setSnackbar", {
            show: true,
            text: "Student successfully updated",
            color: "baseAccent",
          });
          this.close();
        })
        .catch((error) => {
          console.error("Error updating document: ", error);
        });
    },
    async create() {
      this.$refs.form.validate();
      if (!this.account.email) return;
      this.addingAccount = true;
      const personExists = await this.MXgetPersonByEmail(this.account.email);
      if (personExists) {
        const profile = {
          ...this.account,
          ...personExists,
        };
        console.log("output profile: ", profile);
        // this.account = profile
        this.MXsaveProfile(profile)
          .then(() => {
            this.MXaddExistingUserToCohort(personExists);
          })
          .then(() => {
            if (this.currentCohort.courses.length) {
              this.currentCohort.courses.forEach(async (courseId) => {
                let course = await getCourseById(courseId);
                this.MXassignCourseToStudent(personExists, course).then(() => {
                  this.assignTopicsAndTasksToStudent(personExists, course).then(
                    () => {
                      this.$store.commit("setSnackbar", {
                        show: true,
                        text: "Student assigned to first mission",
                        color: "baseAccent",
                      });
                    }
                  );
                });
              });
            }
          })
          .then(() => {
            this.addingAccount = false;
            this.close();
          })
          .catch((err) => {
            this.addingAccount = false;
            console.error("something went wrong adding existing person: ", err);
          });
      } else {
        const person = {
          ...this.account,
          displayName: this.account.firstName + " " + this.account.lastName,
        };
        this.MXcreateUser(person)
          .then(() => {
            this.$store.commit("setSnackbar", {
              show: true,
              text: "Account created",
              color: "baseAccent",
            });
            if (!this.teacher) {
              this.MXaddStudentToCohort(person)
                .then(() => {
                  this.$store.commit("setSnackbar", {
                    show: true,
                    text: "Student added to Cohort",
                    color: "baseAccent",
                  });
                  if (this.currentCohort.courses.length) {
                    this.currentCohort.courses.forEach(async (courseId) => {
                      let course = await getCourseById(courseId);
                      this.MXassignCourseToStudent(person, course).then(() => {
                        this.assignTopicsAndTasksToStudent(person, course).then(
                          () => {
                            this.$store.commit("setSnackbar", {
                              show: true,
                              text: "Student assigned to first mission",
                              color: "baseAccent",
                            });
                          }
                        );
                      });
                    });
                  }
                })
                .then(() => {
                  this.$store.commit("setSnackbar", {
                    show: true,
                    text: "Student assigned to first mission. Email sent",
                    color: "baseAccent",
                  });
                  this.addingAccount = false;
                  this.close();
                });
            } else {
              this.$store.commit("setSnackbar", {
                show: true,
                text: "Teacher added to Galaxy Map",
                color: "baseAccent",
              });
              this.addingAccount = false;
              this.close();
            }
          })
          .catch((error) => {
            console.error(error);
          });
      }
    },
    // add this galaxy metadata (eg. topics) to this persons course database
    async assignTopicsAndTasksToStudent(person, course) {
      console.log("person: ", person);
      console.log("course: ", course);

      // 1) get topics in this course
      const querySnapshot = await db
        .collection("courses")
        .doc(course.id)
        .collection("topics")
        .orderBy("topicCreatedTimestamp")
        .get();

      // 2) add them to person (this will store their TOPIC progression data for this course )
      for (const [index, doc] of querySnapshot.docs.entries()) {
        await db
          .collection("people")
          .doc(person.id)
          .collection(course.id)
          .doc(doc.data().id)
          .set({
            ...doc.data(),
            topicStatus:
              doc.data().group == "introduction" ? "introduction" : "locked", // set the status of topics to locked unless they are introduction nodes
          });

        // 3) check if this topic has tasks
        const subquerySnapshot = await db
          .collection("courses")
          .doc(course.id)
          .collection("topics")
          .doc(doc.data().id)
          .collection("tasks")
          // order by timestamp is important otherwise index == 0 (in the next step) wont necessarily be the first mission
          .orderBy("taskCreatedTimestamp")
          .get();

        // 4) if tasks exist. add them to person
        for (const [index, subDoc] of subquerySnapshot.docs.entries()) {
          // cool lil status to show whats happening during loading
          // this.startingGalaxyStatus = "...adding " + subDoc.data().title;

          if (subDoc.exists) {
            await db
              .collection("people")
              .doc(person.id)
              .collection(course.id)
              .doc(doc.data().id)
              .collection("tasks")
              .doc(subDoc.id)
              .set({
                ...subDoc.data(),
                // set the status of topics to locked unless they are the first mission (index == 0)
                taskStatus: index == 0 ? "unlocked" : "locked",
              });
          }
        }
      }
      // Send Galaxy Started statment to LRS
      startGalaxyXAPIStatement(person, { galaxy: course });
    },
  },
};
</script>

<style lang="scss" scoped>
// new dialog ui
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
  background-color: var(--v-background-base);

  .custom-input {
    color: var(--v-missionAccent-base);
  }
}

.cohort-btn {
  font-weight: 400;
}
</style>
