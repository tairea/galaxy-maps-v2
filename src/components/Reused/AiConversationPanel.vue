<template>
  <div class="ai-conversation-panel" :class="{ 'panel-open': isOpen }">
    <div class="panel-content">
      <!-- Close Button -->
      <button class="control-button close-button" @click="closePanel">
        <v-icon color="background" size="20">{{ mdiClose }}</v-icon>
      </button>

      <!-- Connection Status -->
      <div v-if="connectionError" class="error-text">
        <v-icon color="error" size="20">mdi-alert-circle</v-icon>
        <span class="error-label">Connection Error</span>
      </div>

      <!-- AI Talking -->
      <div v-else-if="isTalking && isConnected">
        <img :src="aiTalkingImage" alt="AI Talking Gif" height="40" width="40" />
      </div>

      <!-- Listening -->
      <div v-else-if="isListening && isConnected" class="listening-text">
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

      <!-- Connecting -->
      <div v-else-if="!isConnected && !connectionError" class="connecting-container">
        <v-progress-circular indeterminate size="30" color="background" />
      </div>

      <!-- Ready but not listening -->
      <div v-else-if="isConnected && !isListening && !isTalking" class="ready-text">
        <v-icon color="background" size="30">{{ mdiRobotExcitedOutline }}</v-icon>
        <span class="ready-label">Ready to talk</span>
      </div>

      <!-- Stop/Start Button -->
      <button class="control-button stop-button" @click="toggleStop">
        <v-icon color="background" size="20">
          {{ isStopped ? mdiMicrophone : mdiStop }}
        </v-icon>
      </button>
    </div>
  </div>
</template>

<script>
import { mdiClose, mdiMicrophone, mdiStop, mdiRobotExcitedOutline } from "@mdi/js";
import aiTalkingImage from "@/assets/robotTalking.gif";
import { RealtimeAgent, RealtimeSession, OpenAIRealtimeWebRTC } from "@openai/agents-realtime";
import { useAiConversationStore } from "@/store/aiConversation";
import LoadingSpinner from "@/components/Reused/LoadingSpinner.vue";

export default {
  name: "AiConversationPanel",
  components: {
    LoadingSpinner,
  },
  props: {
    isOpen: {
      type: Boolean,
      default: false,
    },
    course: {
      type: Object,
      default: null,
    },
    task: {
      type: Object,
      default: null,
    },
  },
  setup() {
    const aiConversationStore = useAiConversationStore();
    return { aiConversationStore };
  },
  data() {
    return {
      isStopped: false,
      mdiClose,
      mdiMicrophone,
      mdiStop,
      mdiRobotExcitedOutline,
      isTalking: false,
      isListening: false,
      aiTalkingImage,
      agent: null,
      session: null,
      transport: null,
      isConnected: false,
      connectionError: null,
      GmMissionsAssistantInstructions: `
      # 🎙️ Voice Agent System Prompt

**Context & Role:**  
You are a personalised tutor AI inside *Galaxy Maps*, a platform that visualises a learning roadmap as Stars (steps) and Missions (tasks).  
- The **Captain** sets the overall journey (the user’s bigger goal).  
- The **Navigator** (the user) is travelling this journey.  
- You are the **Navigator’s AI companion**, tasked with ensuring they complete the current active Mission.  
- You also serve as an **expert teacher**, ready to explain new concepts clearly whenever needed.  

**Tone & Persona:**  
- Speak in **English only**.  
- Voice must remain **consistent** — clear, calm, and confident.  
- Short, direct, and mission-focused.  
- Supportive and motivating, with a sense of being **in this together**.  
- Occasional **military-style terms** (e.g., “all clear,” “let’s advance,” “mission secured”) are on-theme, but keep them light and natural.  

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
- Do not call yourself “Lieutenant” or use any formal rank/title.  
- Do not change voice style mid-sentence.  
- Stay focused only on the Mission and its learning context.  

---

⚡ **Example Voice Style:**  
“Ok, first step: open your editor and create a new file called 'index.html'. Nice work — that sets up the foundation. Let me know when you’re ready to continue.”

      `,
      ActiveMissionSessionInstructions: `
          #CURRENT ACTIVE MISSION
          ##Mission Title: 
          ${this.task.title},
          ##Mission Instructions:
          ${this.task.description},

          This mission is part of an overarching Galaxy Map called "${this.course.title}" focused on ${this.course.description}.
          `,
    };
  },
  async mounted() {
    console.log("🎬 AiConversationPanel mounted");
  },
  beforeDestroy() {
    this.disconnect();
  },
  methods: {
    async initializeRealtimeAgent() {
      try {
        console.log("🚀 Initializing Realtime Agent...");

        // Create the RealtimeAgent
        this.agent = new RealtimeAgent({
          name: "GM Missions Assistant",
          instructions: this.GmMissionsAssistantInstructions,
        });
        console.log("🤖 RealtimeAgent created:", this.agent.name);

        // Create the WebRTC transport for optimized audio streaming
        this.transport = new OpenAIRealtimeWebRTC();

        // Create the RealtimeSession with WebRTC transport
        this.session = new RealtimeSession(this.agent, {
          model: "gpt-realtime",
          transport: this.transport,
          // Voice options - uncomment one to test different voices
          // voice: "alloy", // Default: Balanced, neutral voice
          //voice: "ash", // Warm, upbeat voice
          voice: "ballad", // Expressive, dramatic voice
          // voice: "coral",      // Deep, authoritative voice
          // voice: "echo",      // Bright, energetic voice
          // voice: "sage",   // Soft, whisper-like voice
          // voice: "shimmer",   // Soft, whisper-like voice
          // voice: "verse",   // Soft, whisper-like voice
          instructions: this.ActiveMissionSessionInstructions,
        });
        console.log("📡 RealtimeSession created with WebRTC transport");

        // Set up event listeners
        this.setupEventListeners();

        // Connect to the session
        await this.connect();
      } catch (error) {
        console.error("💥 Failed to initialize realtime agent:", error);
        this.connectionError = error.message;
      }
    },

    setupEventListeners() {
      if (!this.session) return;

      console.log("🎧 Setting up Realtime session event listeners...");

      // Add debugging to see what events are actually fired
      const originalOn = this.session.on.bind(this.session);
      this.session.on = function (event, callback) {
        console.log(`🔔 Registered listener for event: ${event}`);
        return originalOn(event, function (...args) {
          console.log(`🔥 Event fired: ${event}`, args);
          return callback(...args);
        });
      };

      // Listen for actual server events from the documentation
      this.session.on("session.created", (event) => {
        console.log("✅ Session created:", event);
        this.isConnected = true;
        this.connectionError = null;
        this.isListening = true;
      });

      this.session.on("session.updated", (event) => {
        console.log("🔄 Session updated:", event);
      });

      // Listen for audio buffer events
      this.session.on("input_audio_buffer.speech_started", (event) => {
        console.log("🎙️ User started speaking:", event);
        this.isListening = true;
        this.isTalking = false;
      });

      this.session.on("input_audio_buffer.speech_stopped", (event) => {
        console.log("🔇 User stopped speaking:", event);
        // Keep listening but user stopped speaking
      });

      this.session.on("input_audio_buffer.committed", (event) => {
        console.log("📝 Audio buffer committed:", event);
      });

      // Listen for AI talking events (WebRTC specific)
      this.session.on("output_audio_buffer.started", (event) => {
        console.log("🎙️ AI started talking:", event);
        this.isTalking = true;
        this.isListening = false;
      });

      this.session.on("output_audio_buffer.stopped", (event) => {
        console.log("🔇 AI stopped talking:", event);
        this.isTalking = false;
        // Only set listening if not manually stopped
        if (!this.isStopped) {
          this.isListening = true;
        }
      });

      // Keep the original events as fallback
      this.session.on("response.audio.delta", (event) => {
        console.log("🎵 Audio delta received:", event);
        this.isTalking = true;
        this.isListening = false;
      });

      this.session.on("response.audio.done", (event) => {
        console.log("🔇 Audio response done:", event);
        this.isTalking = false;
        // Only set listening if not manually stopped
        if (!this.isStopped) {
          this.isListening = true;
        }
      });

      this.session.on("response.done", (event) => {
        console.log("🎉 Response completed:", event);
        this.isTalking = false;
        // Only set listening if not manually stopped
        if (!this.isStopped) {
          this.isListening = true;
        }
      });

      // Listen for errors
      this.session.on("error", (error) => {
        console.error("💥 Session error:", error);
        this.connectionError = error.message;
        this.isConnected = false;
        this.isListening = false;
        this.isTalking = false;
      });

      // Log available events for debugging
      console.log("📋 Event listeners set up for realtime session");
    },

    async connect() {
      try {
        console.log("🔗 Attempting to connect to Realtime session...");

        // Get ephemeral client token (cached or new)
        const clientSecret = await this.aiConversationStore.getRealtimeToken();
        console.log("🔑 Token obtained, length:", clientSecret.length);

        // Connect to the session
        console.log("🌐 Connecting to OpenAI Realtime API...");
        const result = await this.session.connect({
          apiKey: clientSecret,
        });
        console.log("✅ Connection request sent successfully, result:", result);

        // Check if connection is immediately established
        console.log("🔍 Session state after connect:", {
          session: !!this.session,
          transport: !!this.transport,
          isConnected: this.isConnected,
        });

        // For WebRTC, connection might be established immediately
        // Let's manually check and set connected state if needed
        setTimeout(() => {
          if (!this.isConnected) {
            console.log("⚠️ No connection event received, manually setting connected state");
            this.isConnected = true;
            this.connectionError = null;
            this.isListening = true;
          }
        }, 2000);
      } catch (error) {
        console.error("💥 Failed to connect:", error);
        this.connectionError = error.message;
      }
    },

    async cleanup() {
      console.log("🧹 Cleaning up session state (keeping token cache)...");

      // Prevent multiple cleanup calls
      if (this.isStopped && !this.isListening && !this.isTalking) {
        console.log("📌 Already cleaned up, skipping...");
        return;
      }

      // Stop listening and mute microphone
      if (this.session && this.transport) {
        try {
          if (typeof this.session.interrupt === "function") {
            this.session.interrupt();
          }
          if (typeof this.transport.mute === "function") {
            this.transport.mute(true);
          }
        } catch (error) {
          console.error("💥 Error during cleanup:", error);
        }
      }

      // Reset UI state but keep session/transport alive
      this.isListening = false;
      this.isTalking = false;
      this.isStopped = true;
      this.connectionError = null;

      console.log("✅ Session state cleaned up (session and token preserved)");
    },

    async disconnect() {
      console.log("🔌 Fully disconnecting Realtime session...");

      // Prevent multiple disconnections
      if (!this.session && !this.transport) {
        console.log("📌 Already disconnected, skipping...");
        return;
      }

      if (this.session) {
        try {
          // Try different disconnect methods that might exist
          if (typeof this.session.disconnect === "function") {
            await this.session.disconnect();
            console.log("✅ Session disconnected");
          } else if (typeof this.session.close === "function") {
            await this.session.close();
            console.log("✅ Session closed");
          } else if (typeof this.session.destroy === "function") {
            await this.session.destroy();
            console.log("✅ Session destroyed");
          } else {
            console.log("⚠️ No disconnect method found");
          }
        } catch (error) {
          console.error("💥 Error disconnecting session:", error);
        }
        this.session = null;
      }

      this.agent = null;
      this.transport = null;
      this.isConnected = false;
      this.isListening = false;
      this.isTalking = false;
      this.connectionError = null;
      this.isStopped = false;

      // Only clear token cache on full disconnect (component destruction)
      this.aiConversationStore.clearTokenCache();
      console.log("🧹 Session fully disconnected and token cache cleared");
    },

    async openPanel() {
      console.log("🎯 Panel opened...");

      if (!this.agent) {
        // First time opening - initialize everything
        console.log("🚀 Initializing agent for first time...");
        try {
          await this.initializeRealtimeAgent();
        } catch (error) {
          console.error("💥 Failed to initialize realtime agent:", error);
          this.connectionError = "Failed to load voice agent. Please refresh the page.";
        }
      } else if (this.session && this.transport && this.isStopped) {
        // Panel was previously closed (muted) - resume listening
        console.log("🔄 Resuming from muted state...");
        try {
          if (typeof this.transport.mute === "function") {
            this.transport.mute(false);
            console.log("🎤 Microphone unmuted - resuming listening");
            this.isListening = true;
            this.isStopped = false;
          }
        } catch (error) {
          console.error("💥 Error resuming session:", error);
        }
      }
    },

    async closePanel() {
      console.log("🎯 Panel close button clicked - cleaning up and minimizing...");

      // Prevent multiple close calls
      if (this._isClosing) {
        console.log("📌 Already closing, skipping...");
        return;
      }

      this._isClosing = true;

      try {
        // Clean up session state but preserve session and token
        await this.cleanup();

        // Just minimize the panel
        this.$emit("close");
      } finally {
        // Reset flag after a short delay
        setTimeout(() => {
          this._isClosing = false;
        }, 100);
      }
    },

    async toggleStop() {
      if (!this.session || !this.transport) {
        console.log("⚠️ Cannot toggle stop - no session or transport available");
        return;
      }

      this.isStopped = !this.isStopped;
      console.log("⏸️ Toggling stop:", this.isStopped ? "STOPPED" : "STARTED");

      try {
        if (this.isStopped) {
          // Stop listening
          console.log("🔇 Stopping listening...");

          // Interrupt any current response
          if (typeof this.session.interrupt === "function") {
            this.session.interrupt();
            console.log("⏹️ Session interrupted");
          }

          // Mute the transport (WebRTC handles microphone directly)
          if (typeof this.transport.mute === "function") {
            this.transport.mute(true);
            console.log("🔇 Transport muted");
          }

          this.isListening = false;
        } else {
          // Start listening
          console.log("🎤 Starting listening...");

          // Unmute the transport
          if (typeof this.transport.mute === "function") {
            this.transport.mute(false);
            console.log("🎤 Transport unmuted");
          }

          this.isListening = true;
        }
      } catch (error) {
        console.error("💥 Error toggling session:", error);
      }

      this.$emit("stop-toggle", this.isStopped);
    },
  },
};
</script>

<style lang="scss" scoped>
.ai-conversation-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;

  background: var(--v-galaxyAccent-base);
  transform: translateY(100%);
  transition: transform 0.3s ease-in-out;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;

  &.panel-open {
    transform: translateY(0);
  }

  .panel-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 400px;
    padding: 0 20px;
  }

  .control-button {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }

    &:active {
      transform: scale(0.95);
    }
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

    &:nth-child(1) {
      animation-delay: 0s;
    }
    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    &:nth-child(3) {
      animation-delay: 0.4s;
    }
    &:nth-child(4) {
      animation-delay: 0.6s;
    }
    &:nth-child(5) {
      animation-delay: 0.8s;
    }
  }

  .listening-label {
    color: var(--v-background-base);
    font-size: 9px;
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
    font-size: 9px;
    font-weight: 500;
    text-align: center;
  }

  .connecting-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 50px;
  }

  .connecting-container .wrap {
    position: relative !important;
    width: 30px !important;
    height: 30px !important;
    background-color: transparent !important;
  }

  .ready-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
  }

  .ready-label {
    color: var(--v-background-base);
    font-size: 9px;
    font-weight: 500;
    text-align: center;
  }
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

/* Mobile adjustments */
@media (max-width: 600px) {
  .ai-conversation-panel {
    height: 70px;

    .panel-content {
      padding: 0 15px;
    }

    .control-button {
      width: 36px;
      height: 36px;
    }

    .listening-label {
      font-size: 12px;
    }
  }
}
</style>
