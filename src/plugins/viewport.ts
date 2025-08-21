export default {
  install(Vue: any) {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    // Set initial value
    setVH();

    // Add event listeners
    window.addEventListener("resize", setVH);
    window.addEventListener("orientationchange", setVH);

    // Make setVH available globally for Vue 2
    Vue.prototype.$setVH = setVH;

    // Also add it to the global Vue instance
    Vue.mixin({
      mounted() {
        // Each component can access this.$setVH if needed
      },
    });
  },
};
