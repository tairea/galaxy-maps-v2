/// <reference types="vite/client" />

declare module "vue/types/vue" {
  import type { Framework } from "vuetify";
  import type { Pinia, Store } from "pinia";

  interface Vue {
    // vuetify
    $vuetify: Framework;

    // pinia
    /**
     * Currently installed pinia instance.
     */
    $pinia: Pinia;

    /**
     * Cache of stores instantiated by the current instance. Used by map
     * helpers. Used internally by Pinia.
     *
     * @internal
     */
    _pStores?: Record<string, Store>;
  }
}

declare module "vue/types/options" {
  import type Vuetify from "vuetify/types/services/vuetify";
  import type { Pinia } from "pinia";

  interface ComponentOptions<V extends Vue> {
    // vuetify
    vuetify?: Vuetify;

    // pinia
    /**
     * Pinia instance to install in your application. Should be passed to the
     * root Vue.
     */
    pinia?: Pinia;
  }
}

interface ImportMetaEnv {
  readonly BASE_URL: string;
  readonly VITE_USE_EMULATOR?: string;
  readonly VITE_FIREBASE_AUTH_EMULATOR?: string;
  readonly VITE_FIRESTORE_EMULATOR_HOST?: string;
  readonly VITE_FUNCTIONS_EMULATOR_HOST?: string;
  readonly VITE_STORAGE_EMULATOR_HOST?: string;
  readonly VITE_DATABASE_EMULATOR_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
