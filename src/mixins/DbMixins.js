// Use this file to store reusable functions that require data from the component

import firebase from "firebase";
import { db, functions } from "../store/firestoreConfig";
import { getCourseById } from "../lib/ff"
import { mapGetters } from 'vuex'

export const dbMixins = {
  computed: {
    ...mapGetters(['person'])
  },
  methods: {
    MXaddExistingUserToCohort(person, cohort) {
      return this.MXaddStudentToCohort(person, cohort)
        .then(() => {
          if (person.inviter?.length == 0) person.inviter = this.person.firstName + ' ' + this.person.lastName;
          this.MXsendNewCohortEmail(person, cohort);
        }).then(() => {
          this.$store.commit("setSnackbar", {
            show: true,
            text: "Student added to Cohort",
            color: "baseAccent",
          });
        })
    },
    MXaddStudentToCohort(student, currentCohort) {
      let cohort = currentCohort ? currentCohort : this.currentCohort
      return db
        .collection("cohorts")
        .doc(cohort.id)
        .update({
          students: firebase.firestore.FieldValue.arrayUnion(student.id),
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
    },
    async MXsendNewCohortEmail(profile, cohort) {
      if (!profile.email) {
        profile = await this.MXgetPersonByIdFromDB(profile.id)
      }
      const person = {
        ...profile,
        cohort: cohort ? cohort.name : this.currentCohort.name,
      };
      const sendNewCohortEmail = functions.httpsCallable("sendNewCohortEmail");
      return sendNewCohortEmail(person);
    },
    async MXgetPersonByEmail(email) {
      const query = await db
        .collection("people")
        .where("email", "==", email)
        .get();
      for (const doc of query.docs) {
        if (doc) {
          const person = {
            id: doc.id,
            ...doc.data(),
          };
          return person;
        }
      }
    },
    MXcreateUser(person) {
      // create user
      const createUser = functions.httpsCallable("createUser");
      return createUser(person)
        .then((result) => {
          person.id = result.data.uid;
          return this.MXaddAccount(person);
        })
        .then(() => {
          return this.MXgenerateLink(person);
        })
        .then((link) => {
          person.link = link.data;
          this.MXsendEmailInvite(person);
          return person.id;
        });
    },
    MXaddAccount(person) {
      const profile = {
        ...person,
      };
      if (person.accountType === "teacher") {
        delete profile.nsn;
        delete profile.parentEmail;
      }
      delete profile.inviter;
      return db
        .collection("people")
        .doc(person.id)
        .set(profile)
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
    },
    MXgenerateLink(person) {
      // generate magic email link
      const data = {
        ...person,
        host: window.location.origin,
      };

      const generateEmailLink = functions.httpsCallable("generateEmailLink");
      return generateEmailLink(data)
        .then((link) => {
          return link;
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
    },
    MXsendEmailInvite(person) {
      const sendInviteEmail = functions.httpsCallable("sendInviteEmail");
      sendInviteEmail(person).catch((error) => {
        console.error(error);
      });
    },
    MXassignCourseToStudent(person, course) {
      return db
        .collection("people")
        .doc(person.id)
        .update({
          assignedCourses: firebase.firestore.FieldValue.arrayUnion(course.id),
        })
        .then(() => this.sendNewCourseEmail(person, course))
        .then(() => {
          this.$store.commit("setSnackbar", {
            show: true,
            text: `Student assigned to ${course.title} galaxy`,
            color: "baseAccent",
          });
        })
    },
    sendNewCourseEmail(person, course) {
      const data = {
        name: person.firstName || '',
        email: person.email,
        course: course.title,
      };
      const sendNewCourseEmail = functions.httpsCallable("sendNewCourseEmail");
      return sendNewCourseEmail(data).catch((error) => {
        console.error(error);
      });
    },
    async MXgetPersonByIdFromDB(personId) {
      if (personId) {
        let person = await db
          .collection("people")
          .doc(personId)
          .get()
          .catch((err) => console.err(err));
        person = {
          id: person.id,
          ...person.data(),
        };
        return person;
      }
    },
    async MXsaveProfile(profile) {
      return await db
        .collection("people")
        .doc(profile.id)
        .update(profile)
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
    },
    // async MXbindRequestsForHelp() {
    //   await this.$store.dispatch(
    //     "getRequestsForHelpByTeachersId",
    //     this.user.data.id
    //   );
    // },
    // async MXbindSubmissions() {
    //   await this.$store.dispatch(
    //     "getAllSubmittedWorkForTeacher",
    //     this.user.data.id
    //   );
    // },
  },
};
