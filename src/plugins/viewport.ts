export default {
  install(Vue: any) {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      const vw = window.innerWidth * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
      document.documentElement.style.setProperty("--vw", `${vw}px`);
    };

    // Set initial value
    setVH();

    // Add event listeners
    window.addEventListener("resize", setVH);
    window.addEventListener("orientationchange", setVH);

    // Prevent mobile keyboard from changing viewport
    let initialViewportHeight = window.innerHeight;
    let initialViewportWidth = window.innerWidth;

    const preventViewportChange = () => {
      // Store initial dimensions
      initialViewportHeight = window.innerHeight;
      initialViewportWidth = window.innerWidth;
    };

    const restoreViewport = () => {
      // Force viewport to maintain dimensions
      if (
        window.innerHeight !== initialViewportHeight ||
        window.innerWidth !== initialViewportWidth
      ) {
        // Reset to initial dimensions
        document.documentElement.style.setProperty("--vh", `${initialViewportHeight * 0.01}px`);
        document.documentElement.style.setProperty("--vw", `${initialViewportWidth * 0.01}px`);
      }
    };

    // Listen for focus events on input fields (mobile keyboard appearing)
    document.addEventListener("focusin", preventViewportChange);
    document.addEventListener("focusout", restoreViewport);

    // Also listen for visual viewport changes
    if ("visualViewport" in window) {
      (window as any).visualViewport.addEventListener("resize", () => {
        // Prevent viewport changes from mobile keyboard
        setVH();
      });
    }

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
