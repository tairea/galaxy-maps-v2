<template>
  <div class="ai-conversation-desktop-button my-4" :class="{ open: isOpen }" @click="onRootClick">
    <template v-if="!isOpen">
      <p class="galaxyAccent--text overline ma-0 pa-0 mt-2">ASK</p>
      <v-icon color="galaxyAccent" size="30">{{ mdiRobotExcited }}</v-icon>
      <p class="galaxyAccent--text overline ma-0 pa-0 mt-2">AI</p>
    </template>

    <template v-else>
      <div class="panel-content" @click.stop>
        <!-- Close Button -->
        <button class="control-button close-button" @click.stop="closePanel">
          <v-icon color="background" size="20">{{ mdiClose }}</v-icon>
        </button>

        <!-- Connection/Error/State Area -->
        <div class="state-area">
          <div v-if="connectionError" class="error-text">
            <v-icon color="error" size="20">mdi-alert-circle</v-icon>
            <span class="error-label">Connection Error</span>
          </div>

          <div v-else-if="isTalking && isConnected">
            <img :src="aiTalkingImage" alt="AI Talking Gif" height="40" width="40" />
          </div>

          <div v-else-if="isListening && isConnected && !isTalking" class="listening-text">
            <v-icon color="background" size="30">{{ mdiRobotExcitedOutline }}</v-icon>
            <span class="listening-dots">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </span>
            <span class="listening-label">...Listening...</span>
          </div>

          <div v-else-if="!isConnected && !connectionError" class="connecting-container">
            <v-progress-circular indeterminate size="30" color="background" />
          </div>

          <div v-else-if="isConnected && !isListening && !isTalking" class="ready-text">
            <v-icon color="background" size="30">{{ mdiRobotExcitedOutline }}</v-icon>
            <span class="ready-label">Ready to talk</span>
          </div>
        </div>

        <!-- Stop/Start Button -->
        <button class="control-button stop-button" @click.stop="toggleStop">
          <v-icon color="background" size="20">
            {{ isStopped ? mdiMicrophone : mdiStop }}
          </v-icon>
        </button>
      </div>
    </template>
  </div>
</template>

<script>
import { mdiRobotExcited, mdiRobotExcitedOutline, mdiClose, mdiMicrophone, mdiStop } from "@mdi/js";
import aiTalkingImage from "@/assets/robotTalking.gif";
import { RealtimeAgent, RealtimeSession, OpenAIRealtimeWebRTC } from "@openai/agents-realtime";
import { useAiConversationStore } from "@/store/aiConversation";

export default {
  name: "AiConversationPanelDesktop",
  props: {
    course: { type: Object, default: null },
    topic: { type: Object, default: null },
    topicTasks: { type: Array, default: [] },
    loading: { type: Boolean, default: false },
  },
  setup() {
    const aiConversationStore = useAiConversationStore();
    return { aiConversationStore };
  },
  data() {
    return {
      // Icons
      mdiRobotExcited,
      mdiRobotExcitedOutline,
      mdiClose,
      mdiMicrophone,
      mdiStop,

      // UI state
      isOpen: false,
      isStopped: false,
      isTalking: false,
      isListening: false,
      isConnected: false,
      connectionError: null,
      aiTalkingImage,

      // Realtime
      agent: null,
      session: null,
      transport: null,

      // Instructions
      GmMissionsAssistantInstructions: `
      # 🎙️ Voice Agent System Prompt

**Context & Role:**  
You are a personalised tutor AI inside *Galaxy Maps*, a platform that visualises a learning roadmap as Stars (steps) and Missions (tasks).  
- The **Captain** sets the overall journey (the user’s bigger goal).  
- The **Navigator** (the user) is travelling this journey.  
- You are the **Navigator’s AI companion**, tasked with ensuring they complete the current active Mission.  
- You also serve as an **expert teacher**, ready to explain new concepts clearly whenever needed.  

**Teaching Style:**  
- Break tasks into **small, simple steps**.  
- When introducing new topics, teach in **plain, easy-to-understand language**. Use analogies or examples if needed.  
- If the Navigator seems confused, **pause and go into teaching mode** before continuing.  
- Reinforce progress with encouragement:  
  - “Ok, the first thing we’re going to do is…”  
  - “You got this.”  
  - “Nice work, let’s keep moving.”  

**Conversation Flow:**  
- Keep responses **short and actionable**.  
- After one or two steps, **pause and check in**:  
  - “Let me know when you’re ready to continue.”  
  - “Does that make sense, or should I explain it another way?”  
  - “Want an example before we push on?”  
- Always confirm before advancing — avoid giving too much at once.  

**Restrictions:**  
- Stay focused only on the Mission and its learning context.  

---

⚡ **Example Voice Style:**  
“Ok, first step: open your editor and create a new file called 'index.html'. Nice work — that sets up the foundation. Let me know when you’re ready to continue.”
 
      `,
    };
  },
  computed: {
    contextInstructions() {
      //   if (!this.course || !this.topic || !this.topicTasks) return "";

      const activeMission = this.topicTasks.find((task) => task.taskStatus === "active");
      console.log("active mission", activeMission);

      return `
      The overarching Galaxy Map this Navigator is currently on is called "${this.course.title}" its focus is on ${this.course.description}.
      
      The Star System (within the Galaxy Map) they are currently in is called "${this.topic.label}" 

      There are ${this.topicTasks.length} missions in this Star System. For context they are: ${this.topicTasks} 

      #CURRENT ACTIVE MISSION\n\n
      
      ##Mission Title:\n${activeMission.title}\n\n
      
      ##Mission Instructions:\n${activeMission.description}\n\n

      Please focus on helping the navigator complete the missions in this Star System, so they can progress on to the next Star System and complete the entire Galaxy Map.
      `;
    },
    combinedInstructions() {
      return this.GmMissionsAssistantInstructions + "\n\n" + this.contextInstructions;
    },
  },
  beforeDestroy() {
    this.disconnect();
  },
  methods: {
    async onRootClick() {
      if (!this.isOpen) {
        await this.openPanel();
      } else {
        await this.closePanel();
      }
    },
    async openPanel() {
      this.isOpen = true;
      if (!this.agent || !this.session || !this.transport) {
        try {
          await this.initializeRealtimeAgent();
        } catch (e) {
          this.connectionError = "Failed to load voice agent. Please refresh the page.";
        }
      } else if (this.isStopped) {
        try {
          if (typeof this.transport.mute === "function") {
            this.transport.mute(false);
            this.isListening = true;
            this.isStopped = false;
          }
        } catch (e) {
          try {
            await this.initializeRealtimeAgent();
          } catch (re) {
            this.connectionError = "Failed to restart voice agent. Please refresh the page.";
          }
        }
      }
    },
    async closePanel() {
      // fully disconnect and reset UI
      if (this.session && this.transport) {
        try {
          if (this.isConnected && typeof this.session.interrupt === "function") {
            this.session.interrupt();
          }
        } catch {}
        try {
          if (typeof this.transport.close === "function") {
            this.transport.close();
          }
        } catch {}
      }
      this.session = null;
      this.transport = null;
      this.agent = null;
      this.isConnected = false;
      this.isListening = false;
      this.isTalking = false;
      this.isStopped = true;
      this.connectionError = null;
      this.isOpen = false;
      this.aiConversationStore.clearTokenCache();
    },
    async initializeRealtimeAgent() {
      try {
        this.agent = new RealtimeAgent({
          name: "GM Missions Assistant",
          instructions: this.GmMissionsAssistantInstructions,
          voice: "coral",
        });
        this.transport = new OpenAIRealtimeWebRTC();
        const sessionConfig = {
          model: "gpt-realtime",
          transport: this.transport,
          turnDetection: {
            type: "semantic_vad",
            eagerness: "low",
            createResponse: true,
            interruptResponse: false,
          },
        };
        this.session = new RealtimeSession(this.agent, sessionConfig);
        this.setupEventListeners();
        await this.connect();
      } catch (error) {
        this.connectionError = error?.message || "Failed to initialize";
      }
    },
    setupEventListeners() {
      if (!this.session) return;
      const s = this.session;

      // connection lifecycle
      s.on &&
        s.on("session.created", () => {
          this.isConnected = true;
          this.connectionError = null;
          this.isListening = true;
          this.isTalking = false;
          setTimeout(() => this.sendMissionContext(), 800);
        });
      s.on &&
        s.on("disconnected", () => {
          this.isConnected = false;
          this.isListening = false;
          this.isTalking = false;
        });

      // user speaking
      s.on &&
        s.on("input_audio_buffer.speech_started", () => {
          this.isListening = true;
          this.isTalking = false;
        });

      // ai response
      s.on &&
        s.on("response.created", () => {
          this.isTalking = true;
          this.isListening = false;
        });
      s.on &&
        s.on("response.done", () => {
          this.isTalking = false;
          if (!this.isStopped) this.isListening = true;
        });
      s.on &&
        s.on("output_audio_buffer.started", () => {
          this.isTalking = true;
          this.isListening = false;
        });
      s.on &&
        s.on("output_audio_buffer.stopped", () => {
          this.isTalking = false;
          if (!this.isStopped) this.isListening = true;
        });

      // errors
      s.on &&
        s.on("error", (err) => {
          this.connectionError = err?.message || "Session error";
          this.isConnected = false;
          this.isListening = false;
          this.isTalking = false;
        });

      // Transport-level events (important for WebRTC)
      if (this.transport && typeof this.transport.on === "function") {
        const t = this.transport;
        // connection/session events
        t.on("session.created", () => {
          this.isConnected = true;
          this.connectionError = null;
          this.isListening = true;
          this.isTalking = false;
          setTimeout(() => {
            this.sendMissionContext();
          }, 1000);
        });
        t.on("disconnected", () => {
          this.isConnected = false;
          this.isListening = false;
          this.isTalking = false;
        });

        // user speaking
        t.on("input_audio_buffer.speech_started", () => {
          this.isListening = true;
          this.isTalking = false;
        });

        // ai audio/response
        t.on("response.created", () => {
          this.isTalking = true;
          this.isListening = false;
        });
        t.on("output_audio_buffer.started", () => {
          this.isTalking = true;
          this.isListening = false;
        });
        t.on("output_audio_buffer.stopped", () => {
          this.isTalking = false;
          if (!this.isStopped) this.isListening = true;
        });
        // Do not change UI on response.done at transport level; wait for output_audio_buffer.stopped
        t.on("response.done", () => {});

        // errors
        t.on("error", (err) => {
          this.connectionError = err?.message || "Transport error";
          this.isConnected = false;
          this.isListening = false;
          this.isTalking = false;
        });
      }
    },
    async connect() {
      try {
        const clientSecret = await this.aiConversationStore.getRealtimeToken();
        const connectOptions = { apiKey: clientSecret };
        await this.session.connect(connectOptions);
        // Fallback in case event is delayed
        setTimeout(() => {
          if (!this.isConnected) {
            this.isConnected = true;
            this.connectionError = null;
            this.isListening = true;
          }
        }, 2000);
      } catch (error) {
        this.connectionError = error?.message || "Failed to connect";
      }
    },
    async disconnect() {
      if (!this.session && !this.transport) return;
      try {
        if (this.session) {
          if (typeof this.session.disconnect === "function") await this.session.disconnect();
          else if (typeof this.session.close === "function") await this.session.close();
          else if (typeof this.session.destroy === "function") await this.session.destroy();
        }
      } catch {}
      this.session = null;
      this.agent = null;
      this.transport = null;
      this.isConnected = false;
      this.isListening = false;
      this.isTalking = false;
      this.connectionError = null;
      this.isStopped = false;
      this.aiConversationStore.clearTokenCache();
    },
    async toggleStop() {
      if (!this.session || !this.transport) return;
      this.isStopped = !this.isStopped;
      try {
        if (this.isStopped) {
          if (this.isConnected && typeof this.session.interrupt === "function") {
            try {
              this.session.interrupt();
            } catch {}
          }
          if (typeof this.transport.mute === "function") this.transport.mute(true);
          this.isTalking = false;
          this.isListening = false;
        } else {
          if (typeof this.transport.mute === "function") this.transport.mute(false);
          this.isTalking = false;
          this.isListening = true;
        }
      } catch {}
      this.$emit && this.$emit("stop-toggle", this.isStopped);
    },
    async sendMissionContext() {
      if (!this.session || !this.isConnected) return;
      const missionMessage = `Here's the current mission context:\n\n${this.contextInstructions}\n\nLet me know when you're ready to help me with this mission.`;
      try {
        this.session.sendMessage(missionMessage);
      } catch {}
    },
  },
};
</script>

<style scoped>
.ai-conversation-desktop-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: auto;
  width: 100%;
  border: 1px solid var(--v-galaxyAccent-base);
  padding: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.ai-conversation-desktop-button.open {
  background: var(--v-galaxyAccent-base);
  border-color: var(--v-galaxyAccent-base);
  cursor: default;
  padding: 30px 0px;
}

.panel-content {
  display: flex;
  align-items: center;
  justify-content: space-around;
  width: 100%;
  max-width: 560px;
}

.control-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.08);
}

.control-button:active {
  transform: scale(0.96);
}

.state-area {
  display: flex;
  align-items: center;
  justify-content: center;
}

.listening-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.listening-dots {
  display: flex;
  gap: 4px;
}

.dot {
  width: 6px;
  height: 6px;
  background: var(--v-background-base);
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

.dot:nth-child(1) {
  animation-delay: 0s;
}
.dot:nth-child(2) {
  animation-delay: 0.2s;
}
.dot:nth-child(3) {
  animation-delay: 0.4s;
}
.dot:nth-child(4) {
  animation-delay: 0.6s;
}
.dot:nth-child(5) {
  animation-delay: 0.8s;
}

.listening-label {
  color: var(--v-background-base);
  font-size: 10px;
  font-weight: 500;
  text-align: center;
}

.error-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}
.error-label {
  color: var(--v-error-base);
  font-size: 10px;
  font-weight: 500;
  text-align: center;
}

.connecting-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
}

.ready-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}
.ready-label {
  color: var(--v-background-base);
  font-size: 10px;
  font-weight: 500;
  text-align: center;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}
</style>
