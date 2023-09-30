// Use this file to store reusable functions that require data from the component

import { db, functions } from "@/store/firestoreConfig";
import {
  _getDocumentHelper,
  fetchCourseByCourseId,
  fetchCohortByCohortId,
  fetchPersonByPersonId,
} from "@/lib/ff";
import useRootStore from "@/store/index";
import firebase from "firebase/compat/app";
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { mapActions, mapState } from "pinia";
import {} from "vue";

export const dbMixins = {
  computed: {
    ...mapState(useRootStore, ["person"]),
  },
  methods: {
    ...mapActions(useRootStore, ["setSnackbar"]),
    async MXaddExistingUserToCohort(person: Record<string, any>, cohort: Record<string, any>) {
      await this.MXaddStudentToCohort(person.id, cohort.id);
      if (person.inviter?.length == 0) {
        const rootStore = useRootStore();
        person.inviter = rootStore.person.firstName + " " + rootStore.person.lastName;
      }
      await this.MXsendNewCohortEmail(person, cohort);
    },
    async MXaddStudentToCohort(studentId: string, cohortId: string) {
      return await updateDoc(doc(db, "cohorts", cohortId), {
        students: firebase.firestore.FieldValue.arrayUnion(studentId),
      });
    },
    async MXsendNewCohortEmail(profile: Record<string, any>, cohort: Record<string, any>) {
      if (!profile.email) {
        profile = await fetchPersonByPersonId(profile.id);
      }
      const person = {
        ...profile,
        cohort: cohort.name,
      };
      const sendNewCohortEmail = functions.httpsCallable("sendNewCohortEmail");
      return sendNewCohortEmail(person);
    },
    async MXcreateUser(person: Record<string, any>) {
      // create user
      const createUser = functions.httpsCallable("createUser");
      const result = await createUser(person);
      person.id = result.data.uid;
      await this.MXaddAccount(person);
      const link = await this.MXgenerateLink(person);
      person.link = link.data;
      this.MXsendEmailInvite(person);
      return person.id;
    },
    async MXaddAccount(person: Record<string, any>) {
      const profile = {
        ...person,
      };
      if (person.accountType === "teacher") {
        delete profile.nsn;
        delete profile.parentEmail;
      }
      delete profile.inviter;
      return await setDoc(doc(db, "people", person.id), profile);
    },
    async MXgenerateLink(person: Record<string, any>) {
      // generate magic email link
      const data = {
        ...person,
        host: window.location.origin,
      };

      const generateEmailLink = functions.httpsCallable("generateEmailLink");
      return await generateEmailLink(data);
    },
    async MXsendEmailInvite(person: Record<string, any>) {
      const sendInviteEmail = functions.httpsCallable("sendInviteEmail");
      return await sendInviteEmail(person);
    },
    async MXassignCourseToStudent(personId: string, courseId: string) {
      await updateDoc(doc(db, "people", personId), {
        assignedCourses: firebase.firestore.FieldValue.arrayUnion(courseId),
      });
      await this.MXsendNewCourseEmail(personId, courseId);
    },
    async MXsendNewCourseEmail(personId: string, courseId: string) {
      const person = await fetchPersonByPersonId(personId);
      const course = await fetchCourseByCourseId(courseId);
      const data = {
        name: person.firstName || "",
        email: person.email,
        course: course.title,
      };
      const sendNewCourseEmail = functions.httpsCallable("sendNewCourseEmail");
      return await sendNewCourseEmail(data);
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
