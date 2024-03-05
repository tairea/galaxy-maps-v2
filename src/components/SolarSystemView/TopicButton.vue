<template>
    <div class="topicButtonDiv">
        <v-btn :to="toPath" class="topicButton" text>
            <v-icon left v-if="type == 'from'"> {{ mdiArrowLeft }} </v-icon>
            To {{ getTopicById(topicId)["label"] }}
            <v-icon right v-if="type == 'to'"> {{ mdiArrowRight }} </v-icon>
        </v-btn>
    </div>
</template>

<script>
import useRootStore from "@/store/index";
import { mapActions, mapState } from "pinia";
import { mdiArrowLeft, mdiArrowRight } from "@mdi/js"

export default {
    name: "TopicButton",
    props: ["toPath", "topicName", "type", "topicId"],
    computed: {
        ...mapState(useRootStore, [
            "getTopicById"
        ])
    },
    data() {
        return {
            mdiArrowLeft,
            mdiArrowRight
        }
    }
}

</script>

<style scoped>
.topicButtonDiv {
  margin-top: 10px;
  width: calc(100% - 30px);
  z-index: 999;
}

.topicButton {
  border-radius: 0px;
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  text-align: center;
  flex-wrap: wrap;
}

</style>