// Use this script for any firebase functions (ff) that are completely independant of components
import { db } from "../store/firestoreConfig";

export const getCourseById = async (id) => {
  const course = await db
    .collection("courses")
    .doc(id)
    .get()
    .then((doc) => {
      return {
        id,
        ...doc.data(),
      };
    });
  return course;
};
export const getStudentByEmail = async (email) => {
  const people = await db
    .collection("people")
    .where("email", "==", email)
    .get();

  for (const person of people.docs) {
    return person.data();
  }
};
