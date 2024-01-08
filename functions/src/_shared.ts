import * as adminApp from "firebase-admin/app";
import * as adminFirestore from "firebase-admin/firestore";

export const app = adminApp.initializeApp();
export const db = adminFirestore.getFirestore(app);
