<template>
  <div v-if="topic" class="solarsystem" :style="{ height: height ? height : 'auto' }">
    <!-- @click="routeToTopic(topic)" -->
    <!-- <div class="solarsystem" :style="{height: height ? height : 'auto', top: coords.x + 'px', left: coords.y + 'px'}" @click="routeToTopic(topic)"> -->
    <div class="scene">
      <ul class="system" :style="{ fontSize: size }">
        <li class="orbit top-most-orbit">
          <h2 :style="{ color: stringToColour(topic.label) }" class="sphere">
            {{ topic.label }}
          </h2>
          <ol class="system" :style="{ fontSize: size }">
            <li
              v-for="(task, i) in tasks"
              :key="task.id"
              class="orbit"
              :class="$vuetify.theme.dark ? 'darkOrbit' : 'lightOrbit'"
              :style="{ animationDuration: orbits[i] + 's' }"
            >
              <h3
                style="color: #bdc5c7"
                class="sphere"
                :style="{ animationDuration: orbits[i] + 's' }"
              >
                {{ task.title }}
              </h3>
            </li>
          </ol>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import useRootStore from "@/store/index";
import { mapActions, mapState } from "pinia";

/* ==============
 Solar System inspired by Mustafa Enes (https://codepen.io/pavlovsk/pen/owNqXW)
   ============== */

export default {
  name: "SolarSystem",
  props: ["courseId", "topic", "tasks", "size", "height", "coords"],
  data() {
    let durationRanges = [
      [0, 0],
      [9.6, 12.4],
      [12.4, 21.6],
      [21.6, 38.4],
      [38.4, 60],
      [60, 86.4],
      [86.4, 117.6],
      [117.6, 153.6],
      [153.6, 194.4],
      [194.4, 240],
    ];
    return {
      counterDuration: null,
      orbits: [
        Math.floor(Math.random() * durationRanges[1][1]) + durationRanges[1][0],
        Math.floor(Math.random() * durationRanges[2][1]) + durationRanges[2][0],
        Math.floor(Math.random() * durationRanges[3][1]) + durationRanges[3][0],
        Math.floor(Math.random() * durationRanges[4][1]) + durationRanges[4][0],
        Math.floor(Math.random() * durationRanges[5][1]) + durationRanges[5][0],
        Math.floor(Math.random() * durationRanges[6][1]) + durationRanges[6][0],
        Math.floor(Math.random() * durationRanges[7][1]) + durationRanges[7][0],
        Math.floor(Math.random() * durationRanges[8][1]) + durationRanges[8][0],
        Math.floor(Math.random() * durationRanges[9][1]) + durationRanges[9][0],
      ],
    };
  },
  mounted() {},
  computed: {},
  methods: {
    ...mapActions(useRootStore, ["setCurrentTopicId"]),
    // string to colour, thanks to: https://stackoverflow.com/questions/3426404/create-a-hexadecimal-colour-based-on-a-string-with-javascript
    hashCode(str) {
      let hash = 0;
      for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return hash;
    },
    stringToColour(str) {
      return `hsl(${this.hashCode(str) % 360}, 100%, 70%)`;
    },
    routeToTopic() {
      // if on GalaxyView route ignore router.push
      if (this.$route.name == "SolarSystemView") {
        return;
      }
      // on clicking galaxy, set its courseID to Store state (so not relying on router params)
      this.setCurrentTopicId(this.topic.id);
      // route to Galaxy View (passing params as props)
      this.$router.push({
        name: "SolarSystemView",
        params: {
          courseId: this.courseId,
          topicId: this.topic.id,
        },
      });
    },
    camelize(str) {
      return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
        if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
      });
    },
  },
};
</script>

<style lang="scss" scoped>
::marker {
  color: transparent;
}

.solarsystem {
  // width: 33%;
  width: 100%;
  margin-top: -40px;
  // height: 100%;
}

.galaxy:hover {
  -webkit-animation: orbit 0s linear infinite;
  animation: orbit 0s linear infinite;
  -webkit-animation: counter-rotation 0s linear infinite;
  animation: counter-rotation 0s linear infinite;
}

.scene {
  height: 100%;
  // background: #10151a;
  perspective: 350px;
}
.scene .system {
  position: absolute;
  width: 100%;
  height: 100%;
  // font-size: 0.25em;
  border-radius: 100%;
  // cursor: pointer;
}
.scene .orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  // transform: translate(-10%, -10%);
  // border: 1px solid rgba(127, 255, 255, 0.1);
  // box-shadow: 0 0 75em rgba(0, 255, 255, 0.05);
  border-radius: 100%;
  transform-style: preserve-3d;
}

.scene .orbit .darkOrbit {
  border: 1px solid rgba(127, 255, 255, 0.1);
  box-shadow: 0 0 75em rgba(0, 255, 255, 0.05);
}

.scene .orbit .lightOrbit {
  border: 1px solid rgba(0, 0, 0, 0.2);
  // box-shadow: 0 0 75em rgba(0, 0, 0, 0.05);
}

// orbit 0
.scene .orbit:nth-child(0) {
  width: 0em;
  height: 0em;
  -webkit-animation: orbit 0s linear infinite;
  animation: orbit 0s linear infinite;
}
.scene .orbit:nth-child(0) .sphere {
  -webkit-animation: counter-rotation 0s linear infinite;
  animation: counter-rotation 0s linear infinite;
}
// orbit 1
.scene .orbit:nth-child(1) {
  width: 35em;
  height: 35em;
  -webkit-animation: orbit 12.4s linear infinite;
  animation: orbit 12.4s linear infinite;
}
.scene .orbit:nth-child(1) .sphere {
  -webkit-animation: counter-rotation 12.4s linear infinite;
  animation: counter-rotation 12.4s linear infinite;
}
// orbit 2
.scene .orbit:nth-child(2) {
  width: 70em;
  height: 70em;
  -webkit-animation: orbit 9.6s linear infinite;
  animation: orbit 9.6s linear infinite;
}
.scene .orbit:nth-child(2) .sphere {
  -webkit-animation: counter-rotation 9.6s linear infinite;
  animation: counter-rotation 9.6s linear infinite;
}
// orbit 3
.scene .orbit:nth-child(3) {
  width: 105em;
  height: 105em;
  -webkit-animation: orbit 21.6s linear infinite;
  animation: orbit 21.6s linear infinite;
}
.scene .orbit:nth-child(3) .sphere {
  -webkit-animation: counter-rotation 21.6s linear infinite;
  animation: counter-rotation 21.6s linear infinite;
}
// orbit 4
.scene .orbit:nth-child(4) {
  width: 140em;
  height: 140em;
  -webkit-animation: orbit 38.4s linear infinite;
  animation: orbit 38.4s linear infinite;
}
.scene .orbit:nth-child(4) .sphere {
  -webkit-animation: counter-rotation 38.4s linear infinite;
  animation: counter-rotation 38.4s linear infinite;
}
// orbit 5
.scene .orbit:nth-child(5) {
  width: 175em;
  height: 175em;
  -webkit-animation: orbit 60s linear infinite;
  animation: orbit 60s linear infinite;
}
.scene .orbit:nth-child(5) .sphere {
  -webkit-animation: counter-rotation 60s linear infinite;
  animation: counter-rotation 60s linear infinite;
}
// orbit 6
.scene .orbit:nth-child(6) {
  width: 210em;
  height: 210em;
  -webkit-animation: orbit 86.4s linear infinite;
  animation: orbit 86.4s linear infinite;
}
.scene .orbit:nth-child(6) .sphere {
  -webkit-animation: counter-rotation 86.4s linear infinite;
  animation: counter-rotation 86.4s linear infinite;
}
// orbit 7
.scene .orbit:nth-child(7) {
  width: 245em;
  height: 245em;
  -webkit-animation: orbit 117.6s linear infinite;
  animation: orbit 117.6s linear infinite;
}
.scene .orbit:nth-child(7) .sphere {
  -webkit-animation: counter-rotation 117.6s linear infinite;
  animation: counter-rotation 117.6s linear infinite;
}
// orbit 8
.scene .orbit:nth-child(8) {
  width: 280em;
  height: 280em;
  -webkit-animation: orbit 153.6s linear infinite;
  animation: orbit 153.6s linear infinite;
}
.scene .orbit:nth-child(8) .sphere {
  -webkit-animation: counter-rotation 153.6s linear infinite;
  animation: counter-rotation 153.6s linear infinite;
}
// orbit 9
.scene .orbit:nth-child(9) {
  width: 315em;
  height: 315em;
  -webkit-animation: orbit 194.4s linear infinite;
  animation: orbit 194.4s linear infinite;
}
.scene .orbit:nth-child(9) .sphere {
  -webkit-animation: counter-rotation 194.4s linear infinite;
  animation: counter-rotation 194.4s linear infinite;
}
// orbit 10
.scene .orbit:nth-child(10) {
  width: 350em;
  height: 350em;
  -webkit-animation: orbit 240s linear infinite;
  animation: orbit 240s linear infinite;
}
.scene .orbit:nth-child(10) .sphere {
  -webkit-animation: counter-rotation 240s linear infinite;
  animation: counter-rotation 240s linear infinite;
}
.scene .orbit .orbit {
  left: 0;
}
.scene .sphere {
  position: absolute;
  top: 50%;
  left: 0;
  width: 3em;
  height: 3em;
  transform: translate(-50%, -50%);
  background: currentColor;
  border-radius: 100%;
  text-indent: -99999px;
}
.scene .top-most-orbit {
  width: 0 !important;
  height: 0 !important;
  -webkit-animation: none !important;
  animation: none !important;
}
.scene .top-most-orbit > .sphere {
  -webkit-animation: none !important;
  animation: none !important;
}

@-webkit-keyframes orbit {
  from {
    transform: translate(-50%, -50%) rotate(0deg) rotateX(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(1440deg) rotateX(360deg);
  }
}

@keyframes orbit {
  from {
    transform: translate(-50%, -50%) rotate(0deg) rotateX(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(1440deg) rotateX(360deg);
  }
}
@-webkit-keyframes counter-rotation {
  from {
    transform: translate(-50%, -50%) rotateX(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotateX(-360deg);
  }
}
@keyframes counter-rotation {
  from {
    transform: translate(-50%, -50%) rotateX(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotateX(-360deg);
  }
}
</style>
