/// <reference types="vite/client" />
import Vue from "vue";
import VueRouter, { Route, NavigationGuard } from "vue-router";

declare module "vue" {
  interface Vue {
    // vue-router
    $router: VueRouter;
    $route: Route;

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

  interface ComponentOptions<V extends Vue> {
    // vue-router
    router?: VueRouter;
    beforeRouteEnter?: NavigationGuard<V>;
    beforeRouteLeave?: NavigationGuard<V>;
    beforeRouteUpdate?: NavigationGuard<V>;

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
