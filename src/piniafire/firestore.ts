import {
  PINIAFIRE_SET_VALUE,
  PINIAFIRE_ARRAY_ADD,
  PINIAFIRE_ARRAY_REMOVE,
} from "./mutations-types";
import {
  bindCollection,
  bindDocument,
  type OperationsType,
  type FirestoreOptions,
  firestoreOptions,
} from "@posva/vuefire-core";
import firebase from "firebase/compat/app";

export { firestoreOptions };

// Firebase binding
const subscriptions = new WeakMap();

function bind(
  store: Record<string, any>,
  key: string,
  ref: firebase.firestore.Query | firebase.firestore.CollectionReference,
  ops: OperationsType,
  options: FirestoreOptions,
): Promise<firebase.firestore.DocumentData[]>;
function bind(
  store: Record<string, any>,
  key: string,
  ref: firebase.firestore.DocumentReference,
  ops: OperationsType,
  options: FirestoreOptions,
): Promise<firebase.firestore.DocumentData>;
function bind(
  store: Record<string, any>,
  key: string,
  ref:
    | firebase.firestore.DocumentReference
    | firebase.firestore.Query
    | firebase.firestore.CollectionReference,
  ops: OperationsType,
  options: FirestoreOptions,
): Promise<firebase.firestore.DocumentData> | Promise<firebase.firestore.DocumentData[]> {
  // TODO: check ref is valid warning
  // TODO: check defined in state warning
  let sub = subscriptions.get(store);
  if (!sub) {
    sub = Object.create(null);
    subscriptions.set(store, sub);
  }

  // unbind if ref is already bound
  if (key in sub) {
    unbind(
      store,
      key,
      options.wait ? (typeof options.reset === "function" ? options.reset : false) : options.reset,
    );
  }

  return new Promise((resolve, reject) => {
    sub[key] =
      "where" in ref
        ? bindCollection(
            {
              vm: store,
              key,
              collection: ref,
              ops,
              resolve,
              reject,
            },
            options,
          )
        : bindDocument(
            {
              vm: store,
              key,
              document: ref,
              ops,
              resolve,
              reject,
            },
            options,
          );
  });
}

function unbind(store: Record<string, any>, key: string, reset?: FirestoreOptions["reset"]) {
  const sub = subscriptions.get(store);
  if (!sub || !sub[key]) return;
  // TODO dev check before
  sub[key](reset);
  delete sub[key];
}

interface FirestoreActionContext {
  bindFirestoreRef(
    key: string,
    ref: firebase.firestore.Query | firebase.firestore.CollectionReference,
    options?: FirestoreOptions,
  ): Promise<firebase.firestore.DocumentData[]>;
  bindFirestoreRef(
    key: string,
    ref: firebase.firestore.DocumentReference,
    options?: FirestoreOptions,
  ): Promise<firebase.firestore.DocumentData>;
  unbindFirestoreRef(key: string, reset?: FirestoreOptions["reset"]): void;
}

export function firestoreAction<P = any, R = any>(
  action: (context: FirestoreActionContext, payload: P) => R,
): (this: Record<string, any>, payload: P) => R {
  return function firestoreEnhancedActionFn(payload) {
    const ops: OperationsType = {
      set: (target, path, data) => {
        this[PINIAFIRE_SET_VALUE]({
          path,
          target,
          data,
        });
        return data;
      },
      add: (target, newIndex, data) => this[PINIAFIRE_ARRAY_ADD]({ target, newIndex, data }),
      remove: (target, oldIndex) => {
        const data = target[oldIndex];
        this[PINIAFIRE_ARRAY_REMOVE]({ target, oldIndex });
        return [data];
      },
    };

    return action.call(
      this,
      {
        bindFirestoreRef: (
          key: string,
          ref:
            | firebase.firestore.DocumentReference
            | firebase.firestore.Query
            | firebase.firestore.CollectionReference,
          options?: FirestoreOptions,
        ) =>
          bind(
            this,
            key,
            // @ts-ignore
            ref,
            ops,
            Object.assign({}, firestoreOptions, options),
          ),
        unbindFirestoreRef: (key: string, reset?: FirestoreOptions["reset"]) =>
          unbind(this, key, reset),
      },
      payload,
    );
  };
}
