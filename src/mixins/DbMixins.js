// Use this file to store reusable functions that require data from the component

import { db, functions } from "@/store/firestoreConfig";
import { fetchCourseById } from "@/lib/ff";
import useRootStore from "@/store/index";
import firebase from "firebase/compat/app";
import { mapActions, mapState } from "pinia";

export const dbMixins = {
  computed: {
    ...mapState(useRootStore, ["person"]),
  },
  methods: {
    ...mapActions(useRootStore, ["setSnackbar"]),
    async MXaddExistingUserToCohort(person, cohort) {
      console.log("adding existing user to cohort", person, cohort);
      await this.MXaddStudentToCohort(person.id, cohort.id);
      if (person.inviter?.length == 0)
        person.inviter = this.person.firstName + " " + this.person.lastName;
      // this.MXsendNewCohortEmail(person, cohort);  // dunno if email is needed is a bit spammy
      // this.setSnackbar({
      //   show: true,
      //   text: "Student added to Cohort",
      //   color: "baseAccent",
      // });
    },
    async MXaddStudentToCohort(studentId, cohortId) {
      try {
        return await db
          .collection("cohorts")
          .doc(cohortId)
          .update({
            students: firebase.firestore.FieldValue.arrayUnion(studentId),
          });
      } catch (error) {
        console.error("Error writing document: ", error);
      }
    },
    MXaddTeacherToCohort(teacher, currentCohort) {
      console.log("adding teacher to cohort", teacher, currentCohort);
      let cohort = currentCohort ? currentCohort : this.currentCohort;
      return db
        .collection("cohorts")
        .doc(cohort.id)
        .update({
          teachers: firebase.firestore.FieldValue.arrayUnion(teacher.id),
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
    },
    async MXsendNewCohortEmail(profile, cohort) {
      if (!profile.email) {
        profile = await this.MXgetPersonByIdFromDB(profile.id);
      }
      const person = {
        ...profile,
        cohort: cohort ? cohort.name : this.currentCohort.name,
      };
      const sendNewCohortEmail = functions.httpsCallable("sendNewCohortEmail");
      return sendNewCohortEmail(person);
    },
    async MXgetPersonByEmail(email) {
      const query = await db.collection("people").where("email", "==", email).get();
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
    async MXcreateUser(person) {
      // create user
      const createUser = functions.httpsCallable("createUser");
      const result = await createUser(person);
      console.log("user created", result.data.uid); // undefined?!
      person.id = result.data.uid;
      await this.MXaddAccount(person);
      const link = await this.MXgenerateLink(person);
      person.link = link.data;
      this.MXsendEmailInvite(person);
      return person.id;
    },
    async MXaddAccount(person) {
      const profile = {
        ...person,
      };
      if (person.accountType === "teacher") {
        delete profile.nsn;
        delete profile.parentEmail;
      }
      delete profile.inviter;
      try {
        return await db.collection("people").doc(person.id).set(profile);
      } catch (error) {
        console.error("Error writing document: ", error);
      }
    },
    async MXgenerateLink(person) {
      // generate magic email link
      const data = {
        ...person,
        host: window.location.origin,
      };

      const generateEmailLink = functions.httpsCallable("generateEmailLink");
      try {
        const link = await generateEmailLink(data);
        return link;
      } catch (error) {
        console.error("Error writing document: ", error);
      }
    },
    async MXsendEmailInvite(person) {
      const sendInviteEmail = functions.httpsCallable("sendInviteEmail");
      try {
        return await sendInviteEmail(person);
      } catch (error) {
        console.error(error);
      }
    },
    async MXassignCourseToStudent(person, course) {
      await db
        .collection("people")
        .doc(person.id)
        .update({
          assignedCourses: firebase.firestore.FieldValue.arrayUnion(course.id),
        });
      // await this.sendNewCourseEmail(person, course);  // dont know if this email is needed, a bit spammy
      this.setSnackbar({
        show: true,
        text: `${person.firstName} added to ${course.title} galaxy`,
        color: "baseAccent",
      });
    },
    async sendNewCourseEmail(person, course) {
      const data = {
        name: person.firstName || "",
        email: person.email,
        course: course.title,
      };
      const sendNewCourseEmail = functions.httpsCallable("sendNewCourseEmail");
      try {
        return await sendNewCourseEmail(data);
      } catch (error) {
        console.error(error);
      }
    },
    async MXgetPersonByIdFromDB(personId) {
      const personDoc = await db.collection("people").doc(personId).get();
      const person = {
        ...personDoc.data(),
        id: personDoc.id,
      };
      return person;
    },
    async MXsaveProfile(profile) {
      console.log("updating profile", profile);
      return await db
        .collection("people")
        .doc(profile.id)
        .update(profile)
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
    },
    // async MXbindRequestsForHelp() {
    //   await this.getRequestsForHelpByTeachersId(
    //     this.user.data.id
    //   );
    // },
    // async MXbindSubmissions() {
    //   await this.getAllSubmittedWorkForTeacher(
    //     this.user.data.id
    //   );
    // },
  },
};
