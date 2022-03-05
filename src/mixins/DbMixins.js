// Use this file to store reusable functions

import firebase from 'firebase';
import { db, functions } from "../store/firestoreConfig";
import { mapGetters } from "vuex"

export const dbMixins = {
  methods : {
    MXaddExistingUserToCohort (person) {
      return this.MXaddStudentToCohort(person).then(() => {
        this.MXsendNewCohortEmail(person)
      })
    },
    MXaddStudentToCohort (student) {
      return db.collection("cohorts")
        .doc(this.currentCohort.id)
        .update({
          students: firebase.firestore.FieldValue.arrayUnion(
            student.id
          ),
        })
        .then(() => {
          if (this.currentCohort.courses.length) {
            this.currentCohort.courses.forEach(async courseId => {
              let course = await this.MXgetCourseById(courseId)
              this.MXassignCourseToStudent(student, course)
            })
          }
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
      });
    },
    MXsendNewCohortEmail(profile) {
      if (profile.inviter?.length == 0) profile.inviter = 'GalaxyMaps Admin'
      const person = {
        ...profile,
        cohort: this.currentCohort.name
      }
      const sendNewCohortEmail = functions.httpsCallable('sendNewCohortEmail')
      return sendNewCohortEmail(person)
    },
    async MXgetPersonByEmail (email) {
      const query = await db.collection("people")
        .where('email', '==', email)
        .get()  
      for (const doc of query.docs) {
        if (doc) {
          const person = {
            id: doc.id,
            ...doc.data()
          }
          return person
        }
      }
    },
    MXcreateUser (person) {
      // create user
      const createUser = functions.httpsCallable('createUser')
      return createUser(person)
        .then(result => {
          person.id = result.data.uid
          return this.MXaddAccount(person)
        }).then(() => {
          return this.MXgenerateLink(person)
        }).then(link => {
          person.link = link.data
          this.MXsendEmailInvite(person)
          return person.id
      })
    },
    MXaddAccount (person) { 
      const profile = {
        ...person,
      }
      if (person.accountType === 'teacher') {
        delete profile.nsn
        delete profile.parentEmail

      }
      delete profile.inviter
      delete profile.id
      return db.collection("people")
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
        host: window.location.origin
      }

      const generateEmailLink = functions.httpsCallable('generateEmailLink')
      return generateEmailLink(data)
        .then((link) => {
          return link
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
      });
    },
    MXsendEmailInvite(person) {
      const sendInviteEmail = functions.httpsCallable('sendInviteEmail')
      sendInviteEmail(person)
      .catch((error) => {
        console.error(error)
      });
    },
    MXassignCourseToStudent(person, course) {
      return db.collection("people")
      .doc(person.id)
      .update({
        assignedCourses: firebase.firestore.FieldValue.arrayUnion(course.id),
      })
      .then(() => {
        console.log('course successfully assigned: ', person, course)
        this.sendNewCourseEmail(person, course)
      })
    },
    sendNewCourseEmail(person, course) {
      const data = {
        name: person.firstName, 
        email: person.email, 
        course: course.title
      }
      console.log("new course email to: ", data)
      const sendNewCourseEmail = functions.httpsCallable('sendNewCourseEmail')
      return sendNewCourseEmail(data)
      .catch((error) => {
        console.error(error)
      });
    },
    async MXgetPersonByIdFromDB(personId) {
      let person = await db.collection("people").doc(personId).get().catch(err => console.err(err));    
      person = {
        id: person.id,
        ...person.data(),
      }
      return person;
    },
    async MXgetCourseById(id) {
      const course = await db.collection('courses').doc(id).get().then(doc => {
        return {
          id,
          ...doc.data()
        }
      })
      return course
    },
    async MXsaveProfile(profile) {
      console.log('profile: ', profile)
      return await db.collection("people")
      .doc(profile.id)
      .update(profile)
      .catch((error) => {
        console.error("Error writing document: ", error);
    });
    }
  }
}