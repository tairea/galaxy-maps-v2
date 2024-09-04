import { db } from "@/store/firestoreConfig";
import { defineStore } from "pinia";
import { piniafireMutations, firestoreAction } from "@/piniafire/index";
import firebase from "firebase/compat/app";
import { collection, query, where } from "firebase/firestore";

const getDefaultState = () => {
  return {
    from: "",
    user: {
      loggedIn: false,
      data: null as Record<string, any> | null,
    },
    person: {} as Record<string, any>,
    cohorts: [] as Record<string, any>[],
    assignedCourses: [] as Record<string, any>[],
    organisations: [] as Record<string, any>[],
    people: [] as Record<string, any>[],
    currentTopicId: "",
    currentTaskId: "",
    currentCohortId: "",
    currentCourseId: "",
    boundCourse: {} as Record<string, any>,
    currentCourseNodes: [] as Record<string, any>[],
    currentCourseEdges: [] as Record<string, any>[],
    personsCourses: [] as Record<string, any>[],
    personsTopics: [] as Record<string, any>[],
    requestsForHelp: [] as Record<string, any>[],
    courseSubmissions: [] as Record<string, any>[],
    teachersRequestsForHelp: [] as Record<string, any>[],
    teachersStudentsProgress: [] as Record<string, any>[],
    darkMode: true,
    studentCourseDataFromLRS: [] as Record<string, any>[],
    snackbar: {} as Record<string, any>,
    userStatus: {} as Record<string, any>,
    studentsActiveTasks: [] as Record<string, any>[],
    studentsActivityLog: [] as Record<string, any>[],
    showPanelCard: {} as Record<string, any>,
    studentsSubmissions: [] as Record<string, any>[],
    peopleInCourse: [] as Record<string, any>[],
    personsCourseTasks: [] as Record<string, any>[],
    courseTasks: [] as Record<string, any>[],
    topicCompleted: {} as Record<string, any>,
    nextTopicUnlockedFlag: false,
    startMissionLoading: false,
  };
};

export default defineStore({
  id: "root",
  state: getDefaultState,
  getters: {
    getPersonsTopicById: (state) => (id: string) => {
      const topic = state.personsTopics.find((topic) => topic.id === id);
      return topic;
    },
    getOrganisationById: (state) => (id: string) => {
      return state.organisations.find((organisation) => organisation.id === id);
    },
    getStudentsByCohortId: (state) => (id: string) => {
      //go to cohorts, and check if they in courses with this id
      const peopleInCohort: Record<string, any>[] = [];
      state.people.forEach((person) => {
        if (person.assignedCohorts) {
          // if student is assigned in this cohort...
          if (person.assignedCohorts.some((cohortId: string) => cohortId === id)) {
            // push them into array
            peopleInCohort.push(person);
          }
        }
      });
      return peopleInCohort;
    },
    getUnansweredRequestsForHelp: (state) => {
      return state.teachersRequestsForHelp.filter(
        (request) => request.requestForHelpStatus == "unanswered",
      );
    },
  },
  actions: {
    ...piniafireMutations,
    SET_USER(data: { loggedIn: boolean; data: Record<string, any> | null }) {
      this.user = data;
    },
    SET_PERSON(data: Record<string, any>) {
      this.person = data;
    },
    setStartMissionLoading(loading: boolean) {
      this.startMissionLoading = loading;
    },
    set_from(data: string) {
      this.from = data;
    },
    resetTeachersSubmissions() {
      this.courseSubmissions = [];
    },
    setPanelCard(data: Record<string, any>) {
      this.showPanelCard = data;
    },
    setCurrentCourseId(courseId: string) {
      if (courseId === this.currentCourseId) return;
      // new course, so reset tasks
      this.personsCourseTasks = [];
      this.courseTasks = [];
      this.currentCourseId = courseId;
    },
    setCurrentTopicId(topicId: string) {
      this.currentTopicId = topicId;
    },
    setCurrentTaskId(taskId: string) {
      this.currentTaskId = taskId;
    },
    setCurrentCohortId(cohortId: string) {
      this.currentCohortId = cohortId;
    },
    setCohorts(cohorts: Record<string, any>[]) {
      this.cohorts = cohorts;
    },
    setOrganisations(orgs: Record<string, any>[]) {
      this.organisations = orgs;
    },
    setDarkMode(dark: boolean) {
      this.darkMode = dark;
    },
    setStudentCourseDataFromLRS(courseData: Record<string, any>[]) {
      this.studentCourseDataFromLRS = courseData;
    },
    setStudentsActiveTasks(activeTasksArr: Record<string, any>[]) {
      this.studentsActiveTasks = activeTasksArr;
    },
    setStudentsActivityLog(activityStatements: Record<string, any>[]) {
      this.studentsActivityLog = activityStatements;
    },
    setSnackbar(snackbar: { show: boolean; text: string; color?: string }) {
      this.snackbar = snackbar;
    },
    setPeopleInCourse(people: Record<string, any>[]) {
      this.peopleInCourse = people;
    },
    setUserStatus(userStatus: Record<string, any>) {
      this.userStatus = userStatus;
    },
    setUser(user: Record<string, any>) {
      if (user) {
        this.SET_USER({
          loggedIn: true,
          data: {
            admin: user.admin,
            displayName: user.displayName,
            email: user.email,
            verified: user.emailVerified,
            id: user.uid,
          },
        });
      } else {
        this.SET_USER({
          loggedIn: false,
          data: null,
        });
      }
    },
    setTopicCompleted(topic: { completed: boolean; topicId: Record<string, any> | null }) {
      this.topicCompleted = topic;
    },
    setNextTopicUnlocked(flag: boolean) {
      console.log("next topic unlocked - flag triggered: ", flag);
      this.nextTopicUnlockedFlag = flag;
    },
    // ===== Firestore - BIND ALL
    bindAllPeople: firestoreAction(({ bindFirestoreRef }) => {
      return bindFirestoreRef("people", db.collection("people"));
    }),
    bindCourseNodes: firestoreAction(({ bindFirestoreRef }, id: string) => {
      return bindFirestoreRef(
        "currentCourseNodes",
        db.collection("courses").doc(id).collection("map-nodes"),
        {
          reset: false,
        },
      );
    }),
    bindCourseEdges: firestoreAction(({ bindFirestoreRef }, id: string) => {
      return bindFirestoreRef(
        "currentCourseEdges",
        db.collection("courses").doc(id).collection("map-edges"),
        {
          reset: false,
        },
      );
    }),
    bindCoursesByPersonId: firestoreAction(({ bindFirestoreRef }, personId: string) => {
      return bindFirestoreRef(
        "personsCourses",
        db.collection("courses").where("mappedBy.personId", "==", personId),
      );
    }),
    bindCourseByCourseId: firestoreAction(({ bindFirestoreRef }, courseId: string) => {
      return bindFirestoreRef("boundCourse", db.collection("courses").doc(courseId));
    }),
    bindThisPersonsCourseTopics: firestoreAction(
      ({ bindFirestoreRef }, payload: { personId: string; courseId: string }) => {
        return bindFirestoreRef(
          "personsTopics",
          db.collection("people").doc(payload.personId).collection(payload.courseId),
        );
      },
    ),
    async getPersonsCourseTasks() {
      const tasksPerTopic = await Promise.all(
        this.personsTopics
          .filter((topic: Record<string, any>) => topic.topicStatus !== "locked")
          .map(async (topic: Record<string, any>) => {
            const tasks = await db
              .collection("people")
              .doc(this.person.id)
              .collection(this.currentCourseId)
              .doc(topic.id)
              .collection("tasks")
              .get();
            return tasks.docs.map((task) => ({
              topicId: topic.id,
              task: task.data(),
            }));
          }),
      );

      const tasksArr = tasksPerTopic.flat();
      // console.log("tasksArr", tasksArr)
      this.personsCourseTasks = tasksArr;
    },
    async getCourseTasks(courseId: string) {
      const tasksPerTopic = await Promise.all(
        this.currentCourseNodes.map(async (topic: Record<string, any>) => {
          const tasks = await db
            .collection("courses")
            .doc(courseId)
            .collection("topics")
            .doc(topic.id)
            .collection("tasks")
            .get();
          return tasks.docs.map((task) => ({
            topicId: topic.id,
            task: task.data(),
          }));
        }),
      );

      const tasksArr = tasksPerTopic.flat();
      // console.log("tasksArr", tasksArr)
      this.courseTasks = tasksArr;
    },

    // ===== Firestore - BIND by USER
    async getPersonById(id: string) {
      if (id) {
        await db
          .collection("people")
          .doc(id)
          .onSnapshot((doc) => {
            // console.log("person updated");
            const person = {
              ...doc.data(),
              id,
            };
            this.SET_PERSON(person);
          });
      } else {
        this.SET_PERSON({});
      }
    },
    async getAllSubmittedWorkByCourseId(courseId: string) {
      // get all work for review
      const unsubscribe = db
        .collection("courses")
        .doc(courseId)
        .collection("submissionsForReview")
        // .where("taskSubmissionStatus", "==", "inreview")
        .orderBy("taskSubmittedForReviewTimestamp")
        // .orderBy("requestSubmittedTimestamp")
        .onSnapshot((querySnapshot) => {
          const allWorkForReview = [...this.courseSubmissions];

          for (const change of querySnapshot.docChanges()) {
            if (change.type === "added") {
              if (allWorkForReview.some((submission) => submission.id === change.doc.id)) return;
              allWorkForReview.push({
                id: change.doc.id,
                ...change.doc.data(),
              });
            } else if (change.type === "modified") {
              allWorkForReview.splice(
                allWorkForReview.findIndex((i) => i.id === change.doc.id),
                1,
                {
                  id: change.doc.id,
                  ...change.doc.data(),
                },
              );
            } else if (change.type === "removed") {
              allWorkForReview.splice(
                allWorkForReview.findIndex((i) => i.id === change.doc.id),
                1,
              );
            }
          }
          this.courseSubmissions = allWorkForReview;
        });

      return unsubscribe;
      // this.courseSubmissions = allWorkForReview;
    },

    async getCohortsByPersonId(person: { id?: string }) {
      const teacherCohorts = [];
      const studentCohorts = [];

      // onSnapshot wasnt working for me. so changed to .get()
      const studentQuerySnapShot = await db
        .collection("cohorts")
        .where("students", "array-contains", person.id ?? "")
        .get();
      const teacherQuerySnapShot = await db
        .collection("cohorts")
        .where("teachers", "array-contains", person.id ?? "")
        .get();

      for (const cohort of studentQuerySnapShot.docs) {
        studentCohorts.push({
          id: cohort.id,
          student: true,
          ...cohort.data(),
        });
      }
      for (const cohort of teacherQuerySnapShot.docs) {
        teacherCohorts.push({
          id: cohort.id,
          teacher: true,
          ...cohort.data(),
        });
      }

      const cohorts = [...studentCohorts, ...teacherCohorts];
      this.setCohorts(cohorts);
      if (cohorts.length) {
        await this.getOrganisationsByCohorts(cohorts);
      }
    },

    // ===== Firestore - Cohorts & Orgs
    async getOrganisationsByCohorts(cohorts: any) {
      const orgs = [];
      const querySnapShot = await db
        .collection("organisations")
        // .doc(cohort)
        .where(
          "cohorts",
          "array-contains-any",
          cohorts.map((cohort: any) => cohort.id),
        )
        .get();

      if (querySnapShot.docs.length) {
        for (const doc of querySnapShot.docs) {
          orgs.push(doc.data());
        }
      }
      this.setOrganisations(orgs);
    },

    async getRequestsForHelpByCourseId(courseId: string) {
      // get all work for review
      const unsubscribe = db
        .collection("courses")
        .doc(courseId)
        .collection("requestsForHelp")
        // .where("requestForHelpStatus", "==", "unanswered")
        // .orderBy("requestSubmittedTimestamp")
        .onSnapshot((querySnapshot) => {
          const allRequestsForHelp = [...this.teachersRequestsForHelp];
          // WTF!!!! Why does for each fix this?
          querySnapshot.docChanges().forEach((change) => {
            // for (const change of querySnapshot.docChanges()) {
            if (change.type === "added") {
              if (allRequestsForHelp.some((request) => request.id === change.doc.data().id)) return;
              allRequestsForHelp.push({
                id: change.doc.data().id,
                ...change.doc.data(),
              });
            } else if (change.type === "modified") {
              allRequestsForHelp.splice(
                allRequestsForHelp.findIndex((i) => i.id === change.doc.data().id),
                1,
                {
                  id: change.doc.data().id,
                  ...change.doc.data(),
                },
              );
            } else if (change.type === "removed") {
              allRequestsForHelp.splice(
                allRequestsForHelp.findIndex((i) => i.id === change.doc.data().id),
                1,
              );
            }
          });
          allRequestsForHelp.sort(
            (a, b) => b.requestSubmittedTimestamp.seconds - a.requestSubmittedTimestamp.seconds,
          );

          // console.log("ALL REQUESTS FOR HELP:", allRequestsForHelp);

          this.teachersRequestsForHelp = allRequestsForHelp.filter(
            (req) => req.contextCourse.id === courseId && req.id, // because there is a bug that dupliactes requests (these duplicates dont have id's)
          );

          // console.log("this.teachersRequestsForHelp:", this.teachersRequestsForHelp);
        });

      return unsubscribe;

      // this.teachersRequestsForHelp = allRequestsForHelp;
    },

    async getAllUsersStatus() {
      const users = {};
      await db
        .collection("status")
        .get()
        .then((snapShot) => {
          snapShot.docs.forEach((doc) => {
            const obj = {} as Record<string, any>;
            obj[doc.id] = doc.data();
            Object.assign(users, obj);
          });
        })
        .then(() => {
          this.userStatus = users;
        });
    },
  },
  persist: true,
});
