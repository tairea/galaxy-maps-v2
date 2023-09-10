import {
  PINIAFIRE_SET_VALUE,
  PINIAFIRE_ARRAY_ADD,
  PINIAFIRE_ARRAY_REMOVE,
} from "./mutations-types";
import {
  rtdbBindAsArray,
  rtdbBindAsObject,
  type OperationsType,
  type RTDBOptions,
  rtdbOptions,
} from "@posva/vuefire-core";
import firebase from "firebase/compat/app";

export { rtdbOptions };

// Firebase binding
const subscriptions = new WeakMap();

interface FirebaseActionContext {
  bindFirebaseRef(
    key: string,
    reference: firebase.database.Reference | firebase.database.Query,
    options?: RTDBOptions,
  ): Promise<firebase.database.DataSnapshot>;
  unbindFirebaseRef(key: string, reset?: RTDBOptions["reset"]): void;
}

function bind(
  store: Record<string, any>,
  key: string,
  ref: firebase.database.Reference | firebase.database.Query,
  ops: OperationsType,
  options: RTDBOptions,
): Promise<firebase.database.DataSnapshot> {
  // TODO check ref is valid
  // TODO check defined in state
  let sub = subscriptions.get(store);
  if (!sub) {
    sub = Object.create(null);
    subscriptions.set(store, sub);
  }

  // unbind if ref is already bound
  if (key in sub) {
    unbind(store, key, options && options.reset);
  }

  return new Promise((resolve, reject) => {
    sub[key] = Array.isArray(store[key])
      ? rtdbBindAsArray(
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
      : rtdbBindAsObject(
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

function unbind(store: Record<string, any>, key: string, reset?: RTDBOptions["reset"]) {
  const sub = subscriptions.get(store);
  if (!sub || !sub[key]) return;
  // TODO dev check before
  sub[key](reset);
  delete sub[key];
}

export function firebaseAction<P, R>(
  action: (context: FirebaseActionContext, payload: P) => R,
): (this: Record<string, any>, payload: P) => R {
  return function firebaseEnhancedActionFn(payload) {
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
        bindFirebaseRef: (
          key: string,
          ref: firebase.database.Reference | firebase.database.Query,
          options?: RTDBOptions,
        ) => bind(this, key, ref, ops, Object.assign({}, rtdbOptions, options)),
        unbindFirebaseRef: (key: string, reset?: RTDBOptions["reset"]) => unbind(this, key, reset),
      },
      payload,
    );
  };
}
