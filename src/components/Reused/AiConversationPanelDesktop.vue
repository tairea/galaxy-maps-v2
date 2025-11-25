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
import { aiConversationCompletedXAPIStatement } from "@/lib/veracityLRS";
import useRootStore from "@/store/index";
import { mapState } from "pinia";
import { db } from "@/store/firestoreConfig";
import firebase from "firebase/compat/app";

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
  computed: {
    ...mapState(useRootStore, ["person"]),
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
      youtubeAgent: null,

      // MCP (Model Context Protocol) integrations
      youtubeMcpServer: null,
      youtubeMcpServerInitPromise: null,
      youtubeMcpServerError: null,

      // Conversation tracking for xAPI
      conversationStartTime: null,
      conversationModel: "gpt-realtime-mini",

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

**Mission Resources:**  
- When a mission references external content (videos, articles, docs), quietly gather the relevant details first so your guidance stays precise and timely.  
- Distill only the actionable insights and weave them into the next coaching step so the Navigator experiences a seamless flow.  

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
      if (activeMission) {
        console.log("active mission", activeMission);
      } else {
        console.log("no active mission");
      }

      // Format topicTasks into readable string format for AI
      const formattedTasks = this.topicTasks
        .map((task, index) => {
          const status = task.taskStatus || "unknown";
          const title = task.title || "Untitled Mission";
          const description = task.missionInstructionsHtmlString
            ? task.missionInstructionsHtmlString
            : task.description || "No description";
          return `Mission ${index + 1}: "${title}" (Status: ${status}) - ${description}`;
        })
        .join("\n      ");

      let contextMsg = `The overarching Galaxy Map this Navigator is currently on is called "${this.course.title}" this map covers: ${this.course.description}.
      
      The Star System (within the Galaxy Map) they are currently in is called "${this.topic.label}" 

      There are ${this.topicTasks.length} missions in this Star System. For context they are:
      ${formattedTasks}`;

      if (activeMission) {
        contextMsg += `\n\n#CURRENT ACTIVE MISSION is: "${
          activeMission.title
        }" and its instructions are: ${
          activeMission?.missionInstructionsHtmlString || activeMission?.description || ""
        }
        \n\n
        Please focus on helping the navigator complete the missions in this Star System, so they can progress on to the next Star System and complete the entire Galaxy Map.`;
      }

      const youtubeReferences = this.getYoutubeReferences();
      if (youtubeReferences.length) {
        const formattedYoutube = youtubeReferences
          .map((ref, index) => {
            const urlDetail = ref.url ? `, url: ${ref.url}` : "";
            return `YouTube ${index + 1}: videoId ${ref.videoId} (mission: "${
              ref.missionTitle
            }"${urlDetail})`;
          })
          .join("\n      ");
        contextMsg += `\n\nMission materials include the following videos:\n      ${formattedYoutube}\n      Review any useful insights from these before guiding the Navigator through video-dependent steps.`;
      }

      console.log("giving ai agent context with msg: ", contextMsg);
      return contextMsg;
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
      // Record xAPI statement before closing
      console.log("🚪 [xAPI] Panel closing - attempting to record conversation completion");
      this.recordConversationCompletion();

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
      this.youtubeAgent = null;
      await this.teardownYoutubeMcpServer();
      this.aiConversationStore.clearTokenCache();
      // Reset conversation tracking
      this.conversationStartTime = null;
    },
    async initializeRealtimeAgent() {
      try {
        this.youtubeAgent = null;
        const youtubeServer = await this.ensureYoutubeMcpServer();
        if (youtubeServer) {
          console.log("[AI Panel][Agents] Creating YouTube Transcript Specialist handoff agent");
          this.youtubeAgent = new RealtimeAgent({
            name: "YouTube Transcript Specialist",
            handoffDescription:
              "Fetches YouTube transcripts, captions, and related metadata before summarising key learning steps.",
            instructions:
              "You specialise in retrieving and summarising YouTube video transcripts. When asked, identify the video ID, call the YouTube MCP tools to obtain the transcript, and respond with a concise teaching-ready summary plus any critical timestamps. If a transcript cannot be retrieved, explain the issue and suggest alternatives.",
            mcpServers: [youtubeServer],
          });
          console.log("[AI Panel][Agents] YouTube Transcript Specialist ready");
        } else {
          console.log(
            "[AI Panel][Agents] YouTube MCP server unavailable; specialist handoff will be skipped",
          );
        }

        const agentConfig = {
          name: "GM Missions Assistant",
          instructions: this.GmMissionsAssistantInstructions,
          voice: "coral",
        };

        if (this.youtubeAgent) {
          console.log("[AI Panel][Agents] Adding YouTube specialist as handoff agent");
          agentConfig.handoffs = [this.youtubeAgent];
        }

        console.log("[AI Panel][Agents] Creating main GM Missions Assistant agent");
        this.agent = new RealtimeAgent(agentConfig);
        console.log("[AI Panel][Agents] Main agent ready");
        this.transport = new OpenAIRealtimeWebRTC();
        const sessionConfig = {
          model: this.conversationModel,
          transport: this.transport,
          turnDetection: {
            type: "semantic_vad",
            eagerness: "low",
            createResponse: true,
            interruptResponse: false,
          },
        };
        this.session = new RealtimeSession(this.agent, sessionConfig);
        console.log("[AI Panel][Session] Realtime session created", {
          hasHandoff: !!this.youtubeAgent,
        });
        this.setupEventListeners();
        await this.connect();
      } catch (error) {
        this.connectionError = error?.message || "Failed to initialize";
      }
    },
    setupEventListeners() {
      if (!this.session) return;
      const s = this.session;
      console.log("[AI Panel][Session] Setting up event listeners");

      // connection lifecycle
      s.on &&
        s.on("session.created", () => {
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
            topicId: this.topic?.id || "N/A",
          });
          setTimeout(() => this.sendMissionContext(), 800);
        });
      s.on &&
        s.on("disconnected", () => {
          this.isConnected = false;
          this.isListening = false;
          this.isTalking = false;
          // Record xAPI statement when conversation ends
          console.log(
            "🔌 [xAPI] Session disconnected - attempting to record conversation completion",
          );
          this.recordConversationCompletion();
        });

      s.on &&
        s.on("agent_handoff", (_context, previousAgent, nextAgent) => {
          console.log("[AI Panel][Agents] Handoff triggered", {
            from: previousAgent?.name,
            to: nextAgent?.name,
          });
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
          // Track conversation start time
          if (!this.conversationStartTime) {
            this.conversationStartTime = new Date().toISOString();
            console.log("🎬 [xAPI] AI Conversation STARTED (transport level)", {
              timestamp: this.conversationStartTime,
              model: this.conversationModel,
              personId: this.person?.id,
            });
          }
          setTimeout(() => {
            this.sendMissionContext();
          }, 1000);
        });
        t.on("disconnected", () => {
          this.isConnected = false;
          this.isListening = false;
          this.isTalking = false;
          // Record xAPI statement when conversation ends
          console.log(
            "🔌 [xAPI] Transport disconnected - attempting to record conversation completion",
          );
          this.recordConversationCompletion();
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

        t.on("mcp_tools_listed", (event) => {
          console.log("[AI Panel][MCP] Tools listed", event);
        });

        t.on("mcp_tool_call_completed", (toolCall) => {
          console.log("[AI Panel][MCP] Tool call completed", {
            tool: toolCall?.name,
            status: toolCall?.status,
            argsPreview: toolCall?.arguments?.slice?.(0, 160),
            outputPreview: toolCall?.output?.slice?.(0, 160),
          });
        });

        t.on("function_call", (event) => {
          console.log("[AI Panel][Transport] Function call event", {
            name: event?.name,
            callId: event?.callId,
            argumentsPreview: event?.arguments?.slice?.(0, 160),
          });
        });
      }
    },
    async connect() {
      try {
        const clientSecret = await this.aiConversationStore.getRealtimeToken();
        const connectOptions = { apiKey: clientSecret };
        console.log("[AI Panel][Session] Connecting with realtime token", {
          tokenPreview: clientSecret?.slice?.(0, 8),
        });
        await this.session.connect(connectOptions);
        // Fallback in case event is delayed
        setTimeout(() => {
          if (!this.isConnected) {
            this.isConnected = true;
            this.connectionError = null;
            this.isListening = true;
            console.log("[AI Panel][Session] Connection fallback triggered");
          }
        }, 2000);
      } catch (error) {
        console.error("[AI Panel][Session] Failed to connect", error);
        this.connectionError = error?.message || "Failed to connect";
      }
    },
    async disconnect() {
      if (!this.session && !this.transport) return;
      console.log("[AI Panel][Session] Disconnect invoked", {
        hadSession: !!this.session,
        hadTransport: !!this.transport,
      });
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
      this.youtubeAgent = null;
      this.isConnected = false;
      this.isListening = false;
      this.isTalking = false;
      this.connectionError = null;
      this.isStopped = false;
      console.log("[AI Panel][Session] Session references cleared");
      this.aiConversationStore.clearTokenCache();
      await this.teardownYoutubeMcpServer();
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
      console.log("[AI Panel][Session] Sending mission context", {
        preview: missionMessage.slice(0, 200),
      });
      try {
        this.session.sendMessage(missionMessage);
      } catch {}
    },

    async ensureYoutubeMcpServer() {
      console.log("[AI Panel][MCP] ensureYoutubeMcpServer invoked", {
        hasServer: !!this.youtubeMcpServer,
        inflight: !!this.youtubeMcpServerInitPromise,
      });
      if (this.youtubeMcpServer) {
        console.log("[AI Panel][MCP] Reusing existing YouTube MCP server instance");
        return this.youtubeMcpServer;
      }
      if (this.youtubeMcpServerInitPromise) {
        console.log("[AI Panel][MCP] Awaiting in-flight YouTube MCP server initialisation");
        return this.youtubeMcpServerInitPromise;
      }

      const serverUrl = this.getYoutubeMcpServerUrl();
      const apiKey = this.getYoutubeApiKey();

      if (!serverUrl && !apiKey) {
        console.warn(
          "[AI Panel][MCP] No YouTube MCP server configured (missing VITE_YOUTUBE_MCP_SERVER_URL or YOUTUBE_API_KEY)",
        );
        return null;
      }

      if (!serverUrl && !this.hasNodeForMcp()) {
        console.warn(
          "[AI Panel][MCP] Cannot spawn stdio YouTube MCP server: Node environment unavailable (requires Electron/desktop)",
        );
        return null;
      }

      const initPromise = (async () => {
        try {
          console.log("[AI Panel][MCP] Loading @openai/agents for MCP server wiring");
          const agentsModule = await import("@openai/agents");
          const { MCPServerStdio, MCPServerStreamableHttp } = agentsModule;

          if (serverUrl && MCPServerStreamableHttp) {
            console.log("[AI Panel][MCP] Connecting to remote Streamable HTTP MCP server", {
              serverUrl,
            });
            const server = new MCPServerStreamableHttp({
              url: serverUrl,
              name: "youtube-mcp-server",
              cacheToolsList: true,
            });
            await server.connect();
            this.youtubeMcpServer = server;
            this.youtubeMcpServerError = null;
            console.log("[AI Panel][MCP] Remote MCP server connected successfully");
            return server;
          }

          if (!MCPServerStdio) {
            throw new Error("MCPServerStdio is unavailable in @openai/agents import");
          }

          if (!apiKey) {
            throw new Error("YOUTUBE_API_KEY is required to start the youtube MCP stdio server");
          }

          const command = this.getYoutubeMcpCommand();
          const env = this.buildYoutubeMcpEnv(apiKey);
          console.log("[AI Panel][MCP] Launching stdio YouTube MCP server", {
            command,
            envHasKey: !!env.YOUTUBE_API_KEY,
            transcriptLang: env.YOUTUBE_TRANSCRIPT_LANG || "default",
          });
          const server = new MCPServerStdio({
            name: "youtube-mcp-server",
            fullCommand: command,
            env,
            cacheToolsList: true,
          });
          await server.connect();
          this.youtubeMcpServer = server;
          this.youtubeMcpServerError = null;
          console.log("[AI Panel][MCP] stdio YouTube MCP server launched successfully");
          return server;
        } catch (error) {
          console.error("[AI Panel][MCP] Failed to initialize YouTube MCP server", error);
          this.youtubeMcpServer = null;
          this.youtubeMcpServerError = error;
          return null;
        } finally {
          this.youtubeMcpServerInitPromise = null;
        }
      })();

      this.youtubeMcpServerInitPromise = initPromise;
      const server = await initPromise;
      return server;
    },

    async teardownYoutubeMcpServer() {
      if (!this.youtubeMcpServer) return;
      console.log("[AI Panel][MCP] Tearing down YouTube MCP server");
      try {
        if (typeof this.youtubeMcpServer.close === "function") {
          await this.youtubeMcpServer.close();
        }
      } catch (error) {
        console.warn("[AI Panel][MCP] Failed to close YouTube MCP server", error);
      }
      this.youtubeMcpServer = null;
      this.youtubeMcpServerError = null;
      console.log("[AI Panel][MCP] YouTube MCP server torn down");
    },

    getYoutubeReferences() {
      if (!Array.isArray(this.topicTasks)) return [];
      const regex =
        /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/gi;
      const deduped = new Map();

      this.topicTasks.forEach((task) => {
        const missionTitle = task?.title || "Untitled Mission";
        const sources = [task?.missionInstructionsHtmlString, task?.description];
        sources.forEach((source) => {
          if (!source || typeof source !== "string") return;
          let match;
          while ((match = regex.exec(source))) {
            const videoId = match[1];
            const url = match[0];
            if (!videoId) continue;
            if (!deduped.has(videoId)) {
              deduped.set(videoId, { videoId, url, missionTitle });
            } else {
              const existing = deduped.get(videoId);
              if (!existing.url && url) existing.url = url;
              if (
                existing.missionTitle === "Untitled Mission" &&
                missionTitle !== "Untitled Mission"
              ) {
                existing.missionTitle = missionTitle;
              }
            }
          }
        });
      });

      return Array.from(deduped.values());
    },

    // Resolve the API key for the youtube-mcp-server from either Vite client env or Node env.
    getYoutubeApiKey() {
      const viteValue = import.meta?.env?.VITE_YOUTUBE_API_KEY;
      const nodeValue = typeof process !== "undefined" ? process.env?.YOUTUBE_API_KEY : undefined;
      const apiKey = (viteValue || nodeValue || "").trim();
      return apiKey || null;
    },

    // Optional: allow pointing to a remotely hosted Streamable HTTP MCP server.
    getYoutubeMcpServerUrl() {
      const viteValue = import.meta?.env?.VITE_YOUTUBE_MCP_SERVER_URL;
      const nodeValue =
        typeof process !== "undefined" ? process.env?.YOUTUBE_MCP_SERVER_URL : undefined;
      const url = (viteValue || nodeValue || "").trim();
      return url || null;
    },

    // Optional: override the CLI command used to spawn the stdio-based MCP server locally.
    getYoutubeMcpCommand() {
      const viteValue = import.meta?.env?.VITE_YOUTUBE_MCP_COMMAND;
      const nodeValue =
        typeof process !== "undefined" ? process.env?.YOUTUBE_MCP_COMMAND : undefined;
      return (viteValue || nodeValue || "npx -y zubeid-youtube-mcp-server").trim();
    },

    buildYoutubeMcpEnv(apiKey) {
      const env = { YOUTUBE_API_KEY: apiKey };
      const transcriptLang = this.getYoutubeTranscriptLang();
      if (transcriptLang) env.YOUTUBE_TRANSCRIPT_LANG = transcriptLang;
      return env;
    },

    getYoutubeTranscriptLang() {
      const viteValue = import.meta?.env?.VITE_YOUTUBE_TRANSCRIPT_LANG;
      const nodeValue =
        typeof process !== "undefined" ? process.env?.YOUTUBE_TRANSCRIPT_LANG : undefined;
      const lang = (viteValue || nodeValue || "").trim();
      return lang || null;
    },

    hasNodeForMcp() {
      return (
        typeof process !== "undefined" &&
        !!process.versions &&
        typeof process.versions.node !== "undefined"
      );
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
        hasTopic: !!this.topic,
        topicTasksLength: this.topicTasks?.length || 0,
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

      // Get active mission
      const activeMission = this.topicTasks.find((task) => task.taskStatus === "active");
      console.log("🎯 [xAPI] Active mission lookup", {
        topicTasksLength: this.topicTasks?.length || 0,
        activeMissionFound: !!activeMission,
        activeMissionId: activeMission?.id || activeMission?.missionId || "N/A",
        activeMissionTitle: activeMission?.title || "N/A",
      });

      // Prepare context for xAPI statement
      const context = {
        galaxy: this.course
          ? {
              id: this.course.id,
              title: this.course.title,
            }
          : null,
        system: this.topic
          ? {
              id: this.topic.id,
              label: this.topic.label,
            }
          : null,
        activeMission: activeMission
          ? {
              id: activeMission.id || activeMission.missionId,
              missionId: activeMission.missionId || activeMission.id,
              title: activeMission.title,
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
          .collection("aiConversations")
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
