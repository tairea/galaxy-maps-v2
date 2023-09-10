import { type _ActionsTree } from "pinia";
import {
  PINIAFIRE_SET_VALUE,
  PINIAFIRE_ARRAY_ADD,
  PINIAFIRE_ARRAY_REMOVE,
} from "./mutations-types";

import { walkSet } from "@posva/vuefire-core";

export const piniafireMutations: _ActionsTree = {
  [PINIAFIRE_SET_VALUE]({ path, target, data }) {
    walkSet(target, path, data);
  },

  [PINIAFIRE_ARRAY_ADD]({ newIndex, data, target }) {
    target.splice(newIndex, 0, data);
  },

  [PINIAFIRE_ARRAY_REMOVE]({ oldIndex, target }) {
    return target.splice(oldIndex, 1)[0];
  },
};
