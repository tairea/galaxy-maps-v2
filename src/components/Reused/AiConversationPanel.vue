<template>
  <div>
    <!-- Mobile AI Assistant Ribbon Button -->
    <div v-if="shouldShowRibbon" class="ai-assistant-ribbon" @click="handleRibbonClick">
      <div class="ribbon-content">
        <v-icon color="background" size="24" id="ai-assistant-icon">{{
          mdiRobotExcitedOutline
        }}</v-icon>
      </div>
    </div>

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

        <!-- Listening (only when not talking) -->
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
  </div>
</template>

<script>
import { mdiClose, mdiMicrophone, mdiStop, mdiRobotExcitedOutline } from "@mdi/js";
import aiTalkingImage from "@/assets/robotTalking.gif";
// Import from the OpenAI agents realtime package (the one you actually have installed)
import { RealtimeAgent, RealtimeSession, OpenAIRealtimeWebRTC } from "@openai/agents-realtime";
import { useAiConversationStore } from "@/store/aiConversation";
import { aiConversationCompletedXAPIStatement } from "@/lib/veracityLRS";
import useRootStore from "@/store/index";
import { mapState } from "pinia";
import LoadingSpinner from "@/components/Reused/LoadingSpinner.vue";
import { db } from "@/store/firestoreConfig";
import firebase from "firebase/compat/app";

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
    isMobile: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const aiConversationStore = useAiConversationStore();
    return { aiConversationStore };
  },
  computed: {
    ...mapState(useRootStore, ["person"]),
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

      // Conversation tracking for xAPI
      conversationStartTime: null,
      conversationModel: "gpt-realtime-mini",

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
      ActiveMissionSessionInstructions: null, // Will be set in computed/methods
    };

    /*

    **Initialisation:**  
- When first activated, **always greet the Navigator** so they know you are ready.  
- Greeting should be **warm, focused, and ready to help**, e.g.:  
  - “Welcome back, Navigator. I'm ready to assist you, what do you need help with?”  
  - “Good to see you to see you Navigator. What are you stuck on?”  
  - “Systems online. Navigator, how can I help?”

    **Tone & Persona:**  
- Speak in **English only**.  
- Voice must remain **consistent** — clear, calm, and confident.  
- Short, direct, and mission-focused.  
- Supportive and motivating, with a sense of being **in this together**.  
- Occasional **military-style terms** (e.g., “all clear,” “let’s advance,” “mission secured”) are on-theme, but keep them light and natural.  

    */
  },
  async mounted() {
    console.log("🎬 AiConversationPanel mounted");
  },
  computed: {
    activeMissionInstructions() {
      if (!this.task || !this.course) {
        return "";
      }

      const missionInstructionsHtml =
        this.task.missionInstructionsHtmlString || this.task.description || "";

      return `
        #CURRENT ACTIVE MISSION
        ##Mission Title: 
        ${this.task.title}

        ##Mission Instructions:
        ${missionInstructionsHtml}

        This mission is part of an overarching Galaxy Map called "${this.course.title}" focused on ${this.course.description}.
              `;
    },

    combinedInstructions() {
      return this.GmMissionsAssistantInstructions + "\n\n" + this.activeMissionInstructions;
    },

    shouldShowRibbon() {
      const shouldShow =
        this.isMobile &&
        !this.loading &&
        !this.isOpen &&
        this.task &&
        this.task.taskStatus === "active";
      console.log("🎯 Ribbon visibility check:", {
        isMobile: this.isMobile,
        loading: this.loading,
        isOpen: this.isOpen,
        hasTask: !!this.task,
        taskStatus: this.task?.taskStatus,
        shouldShow,
      });
      return shouldShow;
    },
  },

  watch: {
    task: {
      handler(newTask, oldTask) {
        console.log("🎯 AiConversationPanel task changed:", {
          old: oldTask ? { id: oldTask.id, status: oldTask.taskStatus } : null,
          new: newTask ? { id: newTask.id, status: newTask.taskStatus } : null,
          isActive: newTask && newTask.taskStatus === "active",
        });
      },
      deep: true,
      immediate: true,
    },
    isTalking(newVal, oldVal) {
      console.log(`👁️ isTalking changed: ${oldVal} → ${newVal}`);
    },
    isListening(newVal, oldVal) {
      console.log(`👂 isListening changed: ${oldVal} → ${newVal}`);
    },
  },

  beforeDestroy() {
    this.disconnect();
  },
  methods: {
    handleRibbonClick() {
      console.log("🎯 Ribbon button clicked - emitting open event...");
      // Only emit the open event, let parent handle the rest
      this.$emit("open");
    },

    async initializeRealtimeAgent() {
      try {
        console.log("🚀 Initializing Realtime Agent...");

        // Debug: Check what we're actually using
        console.log("🔍 RealtimeAgent constructor:", RealtimeAgent.name);
        console.log("🔍 RealtimeSession constructor:", RealtimeSession.name);
        console.log("🔍 OpenAIRealtimeWebRTC constructor:", OpenAIRealtimeWebRTC.name);

        // Create the RealtimeAgent with base instructions only
        this.agent = new RealtimeAgent({
          name: "GM Missions Assistant",
          instructions: this.GmMissionsAssistantInstructions,
          voice: "coral",
        });
        console.log("🤖 RealtimeAgent created:", this.agent.name);
        console.log("🔍 Agent constructor:", this.agent.constructor.name);

        // Create the WebRTC transport for optimized audio streaming
        this.transport = new OpenAIRealtimeWebRTC();
        console.log("🚀 Transport created:", this.transport.constructor.name);

        // Create the RealtimeSession with WebRTC transport
        const sessionConfig = {
          model: this.conversationModel,
          transport: this.transport,
          turnDetection: {
            type: "semantic_vad",
            eagerness: "low",
            createResponse: true,
            interruptResponse: false,
          },
          //voice: "verse", // setting voice here doesnt work. only seems to work on RealtimeAgent
        };

        console.log("🔧 Session config:", sessionConfig);
        console.log("🎤 Voice selected:", sessionConfig.voice);
        this.session = new RealtimeSession(this.agent, sessionConfig);
        console.log("📡 RealtimeSession created");
        console.log("🔍 Session constructor:", this.session.constructor.name);

        // Set up event listeners BEFORE connecting
        this.setupEventListeners();

        // Connect to the session
        await this.connect();
      } catch (error) {
        console.error("💥 Failed to initialize realtime agent:", error);
        this.connectionError = error.message;
      }
    },

    setupEventListeners() {
      if (!this.session) {
        console.error("❌ No session available for event listeners!");
        return;
      }

      console.log("🎧 Setting up Realtime session event listeners...");
      console.log("🔍 Session instance:", this.session);
      console.log("🔍 Session constructor:", this.session.constructor.name);
      console.log("🔍 Session methods:", Object.getOwnPropertyNames(this.session));
      console.log(
        "🔍 Session prototype methods:",
        Object.getOwnPropertyNames(Object.getPrototypeOf(this.session)),
      );

      // Check if session has 'on' method
      if (typeof this.session.on !== "function") {
        console.error("❌ Session does not have 'on' method!");
        console.log("🔍 Available methods:", Object.keys(this.session));

        // Try alternative event methods
        if (typeof this.session.addEventListener !== "undefined") {
          console.log("🔍 Found addEventListener method");
        }
        if (typeof this.session.addListener !== "undefined") {
          console.log("🔍 Found addListener method");
        }
        return;
      }

      // Try to understand what the session object actually is
      console.log("🔍 Session has 'on' method - investigating further...");
      console.log("🔍 Session.transport:", this.session.transport);
      console.log("🔍 Session.currentAgent:", this.session.currentAgent);
      console.log("🔍 Session.context:", this.session.context);
      console.log("🔍 Session.muted:", this.session.muted);

      // Check if the transport has events instead
      if (this.transport) {
        console.log("🔍 Transport methods:", Object.getOwnPropertyNames(this.transport));
        console.log(
          "🔍 Transport prototype methods:",
          Object.getOwnPropertyNames(Object.getPrototypeOf(this.transport)),
        );

        if (typeof this.transport.on === "function") {
          console.log("✅ Transport has 'on' method!");
        }
        if (typeof this.transport.addEventListener === "function") {
          console.log("✅ Transport has 'addEventListener' method!");
        }

        // Try to inspect the transport's event emitter
        if (this.transport.eventEmitter) {
          console.log("🔍 Transport eventEmitter:", this.transport.eventEmitter);
          console.log(
            "🔍 Transport eventEmitter methods:",
            Object.getOwnPropertyNames(this.transport.eventEmitter),
          );

          // Check if eventEmitter has _events (common in Node.js EventEmitter)
          if (this.transport.eventEmitter._events) {
            console.log(
              "🔍 Transport eventEmitter._events:",
              Object.keys(this.transport.eventEmitter._events),
            );
          }
        }
      }

      // Add debugging to see what events are actually fired
      const originalOn = this.session.on.bind(this.session);
      this.session.on = function (event, callback) {
        console.log(`🔔 Registered listener for event: ${event}`);
        return originalOn(event, function (...args) {
          console.log(`🔥 Event fired: ${event}`, {
            event,
            argsLength: args.length,
            firstArg: args[0] ? JSON.stringify(args[0], null, 2) : "undefined",
            timestamp: new Date().toISOString(),
          });
          return callback(...args);
        });
      };

      // Listen for session events - try different event patterns

      // Connection/session events
      this.session.on("session.created", (event) => {
        console.log("✅ SESSION: Session created and ready:", event);
        this.isConnected = true;
        this.connectionError = null;
        this.isListening = true;
        this.isTalking = false;
        // Track conversation start time
        this.conversationStartTime = new Date().toISOString();
        console.log("🎬 [xAPI] AI Conversation STARTED", {
          timestamp: this.conversationStartTime,
          model: this.conversationModel,
          personId: this.person?.id,
          personName: this.person ? `${this.person.firstName} ${this.person.lastName}` : "N/A",
          courseId: this.course?.id || "N/A",
          taskId: this.task?.id || "N/A",
        });

        // Log current voice configuration
        console.log("🎤 SESSION: Session ready with voice configuration");

        //  ================= Conversation Starter =================
        setTimeout(() => {
          this.sendMissionContext();
        }, 1000); // Wait 1 second to ensure session is fully ready
      });

      this.session.on("disconnected", (event) => {
        console.log("🔌 Session disconnected:", event);
        this.isConnected = false;
        // Record xAPI statement when conversation ends
        console.log(
          "🔌 [xAPI] Session disconnected - attempting to record conversation completion",
        );
        this.recordConversationCompletion();
      });

      // User speaking events
      this.session.on("input_audio_buffer.speech_started", (event) => {
        console.log("🎙️ User started speaking:", event);
        this.isListening = true;
        this.isTalking = false;
      });

      this.session.on("input_audio_buffer.speech_stopped", (event) => {
        console.log("🔇 User stopped speaking:", event);
      });

      this.session.on("input_audio_buffer.committed", (event) => {
        console.log("📝 Audio buffer committed:", event);
      });

      // AI response events
      this.session.on("response.created", (event) => {
        console.log("🤖 AI response creation started:", event);
        console.log("🎯 SETTING isTalking = true, isListening = false");
        this.isTalking = true;
        this.isListening = false;
      });

      this.session.on("response.output_item.added", (event) => {
        console.log("📤 AI output item added:", event);
        this.isTalking = true;
        this.isListening = false;
      });

      this.session.on("response.output_item.done", (event) => {
        console.log("✅ AI output item done:", event);
      });

      // AI audio events
      this.session.on("response.audio.delta", (event) => {
        console.log("🎵 Audio delta received:", event);
        this.isTalking = true;
        this.isListening = false;
      });

      this.session.on("response.audio.done", (event) => {
        console.log("🔇 Audio response done:", event);
      });

      // Main completion event
      this.session.on("response.done", (event) => {
        console.log("🎉 AI response completely finished:", event);
        console.log("🎯 SETTING isTalking = false, isListening = true (if not stopped)");
        this.isTalking = false;
        if (!this.isStopped) {
          this.isListening = true;
        }
      });

      // Error handling
      this.session.on("error", (error) => {
        console.error("💥 Session error:", error);
        this.connectionError = error.message;
        this.isConnected = false;
        this.isListening = false;
        this.isTalking = false;
      });

      // Try to listen for ALL possible events to see what's actually available
      const possibleEvents = [
        // Connection events
        "session.created",
        "session.updated",
        "session.connected",

        // Input events (user speaking)
        "input_audio_buffer.speech_started",
        "input_audio_buffer.speech_stopped",
        "input_audio_buffer.committed",
        "input_audio_buffer.cleared",

        // Response events (AI responding)
        "response.created",
        "response.done",
        "response.cancelled",
        "response.output_item.added",
        "response.output_item.done",

        // Audio events (AI talking)
        "response.audio.started",
        "response.audio.done",
        "response.audio.delta",
        "response.audio_transcript.delta",
        "response.audio_transcript.done",

        // Output buffer events
        "output_audio_buffer.started",
        "output_audio_buffer.stopped",
        "output_audio_buffer.audio_started",
        "output_audio_buffer.audio_stopped",

        // Conversation events
        "conversation.item.created",
        "conversation.item.truncated",
        "conversation.item.deleted",
        "conversation.item.input_audio_transcription.completed",
        "conversation.item.input_audio_transcription.failed",

        // Rate limit and error events
        "rate_limits.updated",
        "error",
      ];

      console.log("🔍 Attempting to register listeners for all possible events...");
      possibleEvents.forEach((eventName) => {
        try {
          this.session.on(eventName, (event) => {
            console.log(`🎯 CAUGHT EVENT: ${eventName}`, event);

            // Handle AI talking events
            if (
              eventName.includes("response.audio.started") ||
              eventName.includes("output_audio_buffer.started") ||
              eventName.includes("response.created")
            ) {
              console.log("🗣️ AI STARTED TALKING - Setting isTalking = true");
              this.isTalking = true;
              this.isListening = false;
            }

            // Handle AI stopped talking events
            if (
              eventName.includes("response.audio.done") ||
              eventName.includes("output_audio_buffer.stopped") ||
              eventName.includes("response.done")
            ) {
              console.log("🤐 AI STOPPED TALKING - Setting isTalking = false");
              this.isTalking = false;
              if (!this.isStopped) {
                this.isListening = true;
              }
            }
          });
        } catch (error) {
          console.log(`⚠️ Could not register listener for ${eventName}:`, error.message);
        }
      });

      // ALSO try listening to transport events
      if (this.transport && typeof this.transport.on === "function") {
        console.log("🚀 Setting up Transport event listeners...");

        // Try common WebRTC events on transport - expanded list
        const transportEvents = [
          "open",
          "close",
          "connected",
          "disconnected",
          "audio",
          "speaking",
          "not_speaking",
          "audiostart",
          "audioend",
          "data",
          "message",
          "response",
          "event",
          "session.created",
          "session.updated",
          "input_audio_buffer.speech_started",
          "input_audio_buffer.speech_stopped",
          "response.created",
          "response.done",
          "response.audio.delta",
          "response.audio.done",
          "output_audio_buffer.started",
          "output_audio_buffer.stopped",
          "conversation.item.created",
          "conversation.item.added",
          "realtime.event",
          "server.event",
          "client.event",
          "error",
        ];

        transportEvents.forEach((eventName) => {
          try {
            this.transport.on(eventName, (event) => {
              console.log(`🚀 TRANSPORT EVENT: ${eventName}`, event);

              // Handle transport events for AI talking - USING REAL EVENTS NOW!
              if (eventName === "output_audio_buffer.started" || eventName === "response.created") {
                console.log("🗣️ TRANSPORT: AI started talking");
                this.isTalking = true;
                this.isListening = false;
              }

              // AI stops talking when audio buffer stops (this is when audio actually ends)
              if (eventName === "output_audio_buffer.stopped") {
                console.log("🤐 TRANSPORT: AI stopped talking - ready to listen");
                this.isTalking = false;
                if (!this.isStopped) {
                  this.isListening = true;
                }
              }

              // response.done is just completion notification - don't change UI state
              if (eventName === "response.done") {
                console.log("✅ TRANSPORT: AI response completed (but may still be speaking)");
                // Don't change isTalking here - wait for output_audio_buffer.stopped
              }

              // Handle user speaking events
              if (eventName === "input_audio_buffer.speech_started") {
                console.log("🎙️ TRANSPORT: User started speaking");
                this.isListening = true;
                this.isTalking = false;
              }

              // Handle session creation - send mission context
              if (eventName === "session.created") {
                console.log("✅ TRANSPORT: Session created - setting up connection state");
                this.isConnected = true;
                this.connectionError = null;
                this.isListening = true;
                this.isTalking = false;

                // ================= Conversation Starter =================
                setTimeout(() => {
                  console.log("🎯 TRANSPORT: Sending mission context after session created");
                  this.sendMissionContext();
                }, 1500); // Wait a bit longer for transport events
              }
            });
            console.log(`🔔 Registered TRANSPORT listener for: ${eventName}`);
          } catch (error) {
            console.log(`⚠️ Could not register transport listener for ${eventName}`);
          }
        });
      }

      // Log available events for debugging
      console.log("📋 Event listeners set up for realtime session AND transport");
    },

    async connect() {
      try {
        console.log("🔗 Attempting to connect to OpenAI Realtime API...");
        console.log("🔍 Session instance before connect:", this.session);
        console.log("🔍 Session constructor name:", this.session.constructor.name);

        // Get ephemeral client token
        const clientSecret = await this.aiConversationStore.getRealtimeToken();
        console.log("🔑 Token obtained, length:", clientSecret.length);

        // Connect to the OpenAI Realtime API
        console.log("🌐 Connecting to OpenAI Realtime API...");
        const connectOptions = { apiKey: clientSecret };
        console.log("🔧 Connect options:", connectOptions);

        const result = await this.session.connect(connectOptions);
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

        // Events are now working via transport - no need for polling
      } catch (error) {
        console.error("💥 Failed to connect:", error);
        this.connectionError = error.message;
      }
    },

    async cleanup() {
      console.log(
        "🧹 Temporarily pausing session (muting microphone, keeping connection alive)...",
      );

      // Prevent multiple cleanup calls
      if (this.isStopped && !this.isListening && !this.isTalking) {
        console.log("📌 Already paused, skipping...");
        return;
      }

      // Stop listening and mute microphone (but keep connection alive)
      if (this.session && this.transport) {
        try {
          if (typeof this.session.interrupt === "function") {
            this.session.interrupt();
            console.log("⏹️ Session interrupted");
          }
          if (typeof this.transport.mute === "function") {
            this.transport.mute(true);
            console.log("🔇 Microphone muted (connection still alive)");
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

      console.log("✅ Session temporarily paused (session and token preserved)");
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

      if (!this.agent || !this.session || !this.transport) {
        // Need to initialize (first time or after close)
        console.log("🚀 Initializing agent (first time or after close)...");
        try {
          await this.initializeRealtimeAgent();
        } catch (error) {
          console.error("💥 Failed to initialize realtime agent:", error);
          this.connectionError = "Failed to load voice agent. Please refresh the page.";
        }
      } else if (this.isStopped) {
        // Panel was previously paused (muted) - resume listening
        console.log("🔄 Resuming from paused state...");
        try {
          if (typeof this.transport.mute === "function") {
            this.transport.mute(false);
            console.log("🎤 Microphone unmuted - resuming listening");
            this.isListening = true;
            this.isStopped = false;
          }
        } catch (error) {
          console.error("💥 Error resuming session:", error);
          // If resume fails, reinitialize
          console.log("🔄 Resume failed, reinitializing...");
          try {
            await this.initializeRealtimeAgent();
          } catch (reinitError) {
            console.error("💥 Failed to reinitialize:", reinitError);
            this.connectionError = "Failed to restart voice agent. Please refresh the page.";
          }
        }
      } else {
        console.log("✅ Session already active and connected");
      }
    },

    async closePanel() {
      console.log("🎯 Panel close button clicked - fully disconnecting session...");

      // Record xAPI statement before closing
      console.log("🚪 [xAPI] Panel closing - attempting to record conversation completion");
      this.recordConversationCompletion();

      // Prevent multiple close calls
      if (this._isClosing) {
        console.log("📌 Already closing, skipping...");
        return;
      }

      this._isClosing = true;

      try {
        // Fully disconnect the session and turn off microphone
        if (this.session && this.transport) {
          console.log("🔌 Closing transport connection and turning off microphone...");

          // Only interrupt if we're actually connected
          if (this.isConnected && typeof this.session.interrupt === "function") {
            try {
              this.session.interrupt();
              console.log("⏹️ Session interrupted");
            } catch (error) {
              console.log(
                "⚠️ Could not interrupt session (likely already disconnected):",
                error.message,
              );
            }
          }

          // Close the transport connection (this also turns off the microphone)
          if (typeof this.transport.close === "function") {
            try {
              this.transport.close();
              console.log("🔇 Transport connection closed and microphone turned off");
            } catch (error) {
              console.log("⚠️ Could not close transport (likely already closed):", error.message);
            }
          }
        }

        // Clear references to force reinitialization on next open
        this.session = null;
        this.transport = null;
        this.agent = null;

        // Reset UI state
        this.isConnected = false;
        this.isListening = false;
        this.isTalking = false;
        this.isStopped = true;
        this.connectionError = null;

        console.log("✅ Session fully closed and cleared for reinitialization");

        // Close the panel
        this.$emit("close");
      } finally {
        // Reset conversation tracking
        this.conversationStartTime = null;

        // Reset flag after a short delay
        setTimeout(() => {
          this._isClosing = false;
        }, 100);
      }
    },
    recordConversationCompletion() {
      // Try to get person from store directly if not available via computed
      const rootStore = useRootStore();
      const person = this.person?.id ? this.person : rootStore.person;

      console.log("📝 [xAPI] recordConversationCompletion called", {
        hasStartTime: !!this.conversationStartTime,
        startTime: this.conversationStartTime,
        hasPerson: !!person,
        personId: person?.id,
        personFromComputed: !!this.person?.id,
        personFromStore: !!rootStore.person?.id,
        hasCourse: !!this.course,
        hasTask: !!this.task,
      });

      // Calculate duration even if we can't record, so user can see it
      const endedTimestamp = new Date().toISOString();
      let durationSeconds = 0;
      if (this.conversationStartTime) {
        const startTime = new Date(this.conversationStartTime);
        const endTime = new Date(endedTimestamp);
        durationSeconds = Math.max(0, Math.floor((endTime - startTime) / 1000));
      }

      console.log("⏱️ [xAPI] Conversation duration calculated", {
        started: this.conversationStartTime || "N/A",
        ended: endedTimestamp,
        durationSeconds: durationSeconds,
        durationFormatted: `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`,
      });

      // Only record if conversation was started
      if (!this.conversationStartTime) {
        console.warn("⚠️ [xAPI] Cannot record - no conversation start time");
        return;
      }
      if (!person || !person.id) {
        console.warn("⚠️ [xAPI] Cannot record - no person data", {
          hasPerson: !!person,
          personId: person?.id,
          personObject: person,
        });
        return;
      }

      // Get topic from store if available (rootStore already defined above)
      const topicId = rootStore.currentTopicId;
      const topic = topicId ? rootStore.personsTopics.find((t) => t.id === topicId) : null;
      console.log("🎯 [xAPI] Topic lookup from store", {
        topicId: topicId || "N/A",
        topicFound: !!topic,
        topicLabel: topic?.label || topic?.title || "N/A",
      });

      // Prepare context for xAPI statement
      const context = {
        galaxy: this.course
          ? {
              id: this.course.id,
              title: this.course.title,
            }
          : null,
        system: topic
          ? {
              id: topic.id,
              label: topic.label || topic.title,
            }
          : null,
        activeMission: this.task
          ? {
              id: this.task.id || this.task.missionId,
              missionId: this.task.missionId || this.task.id,
              title: this.task.title,
            }
          : null,
        startedTimestamp: this.conversationStartTime,
        endedTimestamp: endedTimestamp,
        durationSeconds: durationSeconds,
        model: this.conversationModel,
      };

      console.log("📤 [xAPI] Sending xAPI statement with context:", {
        student: `${person.firstName} ${person.lastName}`,
        course: context.galaxy?.title || "N/A",
        topic: context.system?.label || "N/A",
        task: context.activeMission?.title || "N/A",
        duration: durationSeconds,
        model: this.conversationModel,
      });

      // Send xAPI statement
      aiConversationCompletedXAPIStatement(person, context);

      // Save conversation transcript to Firestore
      this.saveConversationTranscript(context, person);

      // Reset conversation start time
      this.conversationStartTime = null;
      console.log("✅ [xAPI] Conversation completion recorded and start time reset");
    },

    async saveConversationTranscript(context, person) {
      // Only save if we have a course ID
      if (!context.galaxy?.id) {
        console.warn("⚠️ [Firestore] Cannot save transcript - no course ID");
        return;
      }

      // Get the conversation transcript from session history
      let transcript = null;
      if (this.session && this.session.history) {
        transcript = this.session.history;
        console.log("📝 [Firestore] Retrieved conversation transcript:", {
          transcriptLength: Array.isArray(transcript) ? transcript.length : "not an array",
          transcriptType: typeof transcript,
        });
      } else {
        console.warn("⚠️ [Firestore] No session history available for transcript");
      }

      // Prepare the document data with context and transcript
      const conversationData = {
        ...context,
        person: person
          ? {
              id: person.id,
              firstName: person.firstName,
              lastName: person.lastName,
              email: person.email,
            }
          : null,
        transcript: transcript,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      try {
        // Save to Firestore: courses/{courseId}/ai-conversations/{conversationId}
        const conversationRef = db
          .collection("courses")
          .doc(context.galaxy.id)
          .collection("ai-conversations")
          .doc();

        await conversationRef.set(conversationData);

        console.log("✅ [Firestore] Conversation transcript saved successfully", {
          courseId: context.galaxy.id,
          conversationId: conversationRef.id,
          hasTranscript: !!transcript,
        });
      } catch (error) {
        console.error("💥 [Firestore] Failed to save conversation transcript:", error);
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
          // Stop listening and talking
          console.log("🔇 Stopping session - going to ready state...");

          // Interrupt any current response
          if (this.isConnected && typeof this.session.interrupt === "function") {
            try {
              this.session.interrupt();
              console.log("⏹️ Session interrupted");
            } catch (error) {
              console.log("⚠️ Could not interrupt session:", error.message);
            }
          }

          // Mute the transport (WebRTC handles microphone directly)
          if (typeof this.transport.mute === "function") {
            this.transport.mute(true);
            console.log("🔇 Transport muted");
          }

          // Clear both talking and listening states -> shows "Ready to talk"
          this.isTalking = false;
          this.isListening = false;
          console.log("✅ UI state: Ready to talk");
        } else {
          // Start listening
          console.log("🎤 Starting listening...");

          // Unmute the transport
          if (typeof this.transport.mute === "function") {
            this.transport.mute(false);
            console.log("🎤 Transport unmuted");
          }

          // Set listening state (not talking)
          this.isTalking = false;
          this.isListening = true;
          console.log("✅ UI state: Listening");
        }
      } catch (error) {
        console.error("💥 Error toggling session:", error);
      }

      this.$emit("stop-toggle", this.isStopped);
    },

    async sendMissionContext() {
      if (!this.session || !this.isConnected) {
        console.log("⚠️ Cannot send mission context - session not connected");
        return;
      }

      try {
        const missionMessage = `Here's the current mission context:

${this.activeMissionInstructions}

Let me know when you're ready to help me with this mission.`;

        console.log("📤 Sending mission context to AI...");
        console.log("Mission context:", missionMessage);

        // Send the mission context as a user message to start the conversation
        this.session.sendMessage(missionMessage);

        console.log("✅ Mission context sent - AI should respond with greeting");
      } catch (error) {
        console.error("💥 Error sending mission context:", error);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
/* AI Assistant Ribbon Button */
.ai-assistant-ribbon {
  position: fixed;
  bottom: 0px;
  right: 0px;
  width: 60px;
  height: 60px;
  background-color: var(--v-galaxyAccent-base);
  clip-path: polygon(20% 0, 100% 0, 100% 100%, 0% 100%);
  cursor: pointer;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background-color: var(--v-galaxyAccent-lighten1);
    transform: scale(1.05);
  }

  .ribbon-content {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  #ai-assistant-icon {
    margin-right: -10px;
    color: var(--v-background-base) !important;
    fill: var(--v-background-base) !important;
  }
}

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
