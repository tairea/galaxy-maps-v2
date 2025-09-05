<template>
  <div class="ai-conversation-desktop-button" :class="{ open: isOpen }" @click="onRootClick">
    <template v-if="!isOpen">
      <p class="galaxyAccent--text overline ma-0 pa-0 mt-2">ASK</p>
      <v-icon color="galaxyAccent" size="20">{{ mdiRobotExcited }}</v-icon>
      <p class="galaxyAccent--text overline ma-0 pa-0 mt-2">AI</p>
    </template>

    <template v-else>
      <div class="panel-content" @click.stop>
        <button class="control-button close-button" @click.stop="closePanel">
          <v-icon color="background" size="20">{{ mdiClose }}</v-icon>
        </button>

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

        <button
          class="control-button stop-button"
          @click.stop="toggleStop"
          :disabled="!isConnected"
        >
          <v-icon color="background" size="20">{{ isStopped ? mdiMicrophone : mdiStop }}</v-icon>
        </button>
      </div>
    </template>
  </div>
</template>

<script>
import { mdiClose, mdiMicrophone, mdiStop, mdiRobotExcitedOutline, mdiRobotExcited } from "@mdi/js";
import aiTalkingImage from "@/assets/robotTalking.gif";
import {
  RealtimeAgent,
  RealtimeSession,
  OpenAIRealtimeWebRTC,
  tool,
} from "@openai/agents-realtime";
import { useAiConversationStore } from "@/store/aiConversation";
import useRootStore from "@/store/index";
import {
  generateUnifiedGalaxyMap,
  fetchTeachersCohortsByPersonId,
  fetchCohortCoursesActivityByCohortId,
  generateSquadReport,
  sendGenericEmail,
} from "@/lib/ff";
import { buildSquadPacket } from "@/lib/squadPacketBuilder";
import z from "zod";

export default {
  name: "AiGalaxyMapAgent",
  props: {
    description: { type: String, default: "" },
  },
  setup() {
    const aiConversationStore = useAiConversationStore();
    const rootStore = useRootStore();
    return { aiConversationStore, rootStore };
  },
  data() {
    return {
      // Icons
      mdiRobotExcited,
      mdiRobotExcitedOutline,
      mdiClose,
      mdiMicrophone,
      mdiStop,

      // UI
      isOpen: false,
      aiTalkingImage,
      isConnected: false,
      isTalking: false,
      isListening: false,
      isStopped: false,
      connectionError: null,

      // Realtime
      agent: null,
      session: null,
      transport: null,

      // System instructions
      instructions:
        `
       # Role & Objective  
You are the **Galaxy Maps AI**. You are an assistant to the Captains of the Galaxy Maps system. You help Captains create Galaxy Maps which are learning roadmaps for Navigators to explore and progress through. You also help captains manage their Squads which are groups of Navigators on shared journeys.
Your objectives are:  
- Help Captains generate new Galaxy Maps with the 'generateGalaxyMap' tool.  
- Help Captains manage their Squads with the 'getMySquads' and 'generateSquadStatusReport' tools.
- Assist with navigation routing inside the app with the 'takeMeTo' tool.
- Send emails when you want to send data to the Captain for reference.  
Success means Captains feel supported. 

# Personality & Tone  
- Warm, confident, and slightly theatrical, like a trusted starship captain.  
- Speak with clarity, patience, and just a touch of cosmic wonder.  
- Sprinkle in navigational metaphors (“charting a course,” “adjusting trajectory,” “full speed ahead”) without overdoing it.  
- Encourage learners like a mentor who believes in their potential.  
- Maintain professionalism, but allow moments of levity or wisdom to shine through.  

# Context  
- Galaxy Maps is a learning platform where courses are broken up into a learning roadmap of Stars, and Missions.  
- Students are called Navigators who complete the mission to progress through the galaxy map.  
- Teachers are Captains that create the galaxy maps and monitor Squads.
- Squads are groups of Navigators progressing through the same galaxy maps.
` +
        // # Reference Pronunciations
        // - “Galaxy Maps” → **GAL-uhk-see Maps**
        // - “Navigator” → **NAV-ih-gay-ter**
        // - “Squad” → **Sk-wahd** (normal)
        // - “Captain” → **CAP-tin**
        `
# Tools 
- *generateGalaxyMap* - Builds new learning maps. Tends to respond with clarification questions before generating the map. If you get clarifiying questions, let the Captain know how many questions in total and then proceed to ask one questions at a time.
- *getMySquads* - Gets the Captain's squads (a requirement to generate a squad status report, as well as routing to a squad page)
- *generateSquadStatusReport* - Generates a status report for the named squad and emails the results to the Captain. (get squads first so you can compare names and find the correct squad. ask the Captain to spell out the name if you can't find a match)
- *sendGenericEmail* - Sends an email to the Captain with the subject and body. (use this to send data to the Captain to refer to later)
- *takeMeToSquadTool* - Navigates to a specific squad page using the squad's ID and name. (use this to navigate to squads)
- *terminateSession* - Terminates the current AI agent session and closes the connection. (use this to end the session)

# Instructions / Rules  
- Always greet the Captain warmly at session start.  
- Always give a preamble message while triggering tools
- If context is missing, ask clarifying questions rather than guessing.  
`,
      // # Conversation Flow
      // **States:**
      // - **Greeting:** "Welcome back Captain, waiting for instructions."
      // - **Exploration:** Help with generating maps, routing, or monitoring squads.
      // - **Decision:** Confirm intent before using tools.
      // - **Action:** Trigger tool and report results.
      // - **Encouragement:** Motivate Navigator to continue their journey.
      // - **Closure:** Summarize session and wish them well on their voyage.
    };
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
      await this.ensureSession();
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

    async ensureSession() {
      if (this.session && this.isConnected) return;
      try {
        console.log("🚀 Initializing Realtime Agent...");

        const mapParameters = z.object({ description: z.string().min(10) });

        // Generate Galaxy Map AGENT TOOL
        const unifiedMapTool = tool({
          name: "generateGalaxyMap",
          description: "Generate a galaxy map (stars, missions) from a description.",
          parameters: mapParameters,
          execute: async ({ description }) => {
            const result = await generateUnifiedGalaxyMap(description);
            return JSON.stringify(result);
          },
        });

        // Get My Squads AGENT TOOL
        const getSquadsTool = tool({
          name: "getMySquads",
          description: "Fetch your squads (teacher cohorts) using your account.",
          parameters: z.object({}),
          execute: async () => {
            const personId = this.rootStore?.user?.data?.id || this.rootStore?.person?.id;
            if (!personId) throw new Error("Missing personId; please sign in.");
            const squads = await fetchTeachersCohortsByPersonId(personId);
            return JSON.stringify({ squads });
          },
        });

        // Generate Squad Status Report AGENT TOOL
        const squadReportTool = tool({
          name: "generateSquadStatusReport",
          description:
            "Generate a status report for the named squad and email the results to you. lastNumberOfDays specifies how many days back of activity data to look report back.",
          parameters: z.object({
            squadName: z.string(),
            lastNumberOfDays: z.number(),
          }),
          execute: async ({ squadName, lastNumberOfDays }) => {
            const personId = this.rootStore?.user?.data?.id || this.rootStore?.person?.id;
            const toEmail = this.rootStore?.user?.data?.email;
            if (!personId) throw new Error("Missing personId; please sign in.");
            if (!toEmail) throw new Error("Missing email; cannot send report.");

            const squads = await fetchTeachersCohortsByPersonId(personId);
            const normalizedTarget = String(squadName).toLowerCase();
            const match = squads.find((c) => {
              const name = (c?.name || c?.title || c?.cohortName || "").toLowerCase();
              return name === normalizedTarget || name.includes(normalizedTarget);
            });
            if (!match) {
              const available = squads
                .map((c) => c?.name || c?.title || c?.cohortName)
                .filter(Boolean)
                .slice(0, 10);
              throw new Error(
                `Could not find squad named "${squadName}". Available include: ${available.join(", ")}`,
              );
              console.error("Error finding squad:", squadName, squads);
            }

            const cohortId = match.id || match.cohortId || match?.cohort?.id;
            if (!cohortId) {
              console.error("Error finding squad:", squadName, squads);
              throw new Error("Selected squad is missing an id.");
            }

            const activityData = await fetchCohortCoursesActivityByCohortId(cohortId);

            // Build standardized packet for backend
            const squadPacket = buildSquadPacket(activityData, {
              squadName: match?.name || match?.title || match?.cohortName || String(squadName),
              nowISO: new Date().toISOString(),
              windowDays: lastNumberOfDays,
            });

            console.log("agent generating squad report for:", cohortId, squadPacket);
            const { report } = await generateSquadReport(squadPacket, cohortId);

            const subject = `Squad Status Report: ${match?.name || match?.title || squadName}`;
            const body = JSON.stringify(report, null, 2);
            await sendGenericEmail(toEmail, subject, body, false);

            return JSON.stringify({ emailed: true, to: toEmail, cohortId, subject });
          },
        });

        const emailTool = tool({
          name: "sendGenericEmail",
          description: "Send an email with a subject and body to you (or a specified address).",
          parameters: z.object({
            to: z.string().email().nullable().optional(),
            subject: z.string().min(3),
            body: z.string().min(1),
            isHtml: z.boolean().nullable().optional(),
          }),
          execute: async ({ to, subject, body, isHtml }) => {
            const toEmail = to || this.rootStore?.user?.data?.email;
            if (!toEmail) throw new Error("No email available to send to.");
            await sendGenericEmail(toEmail, subject, body, Boolean(isHtml));
            return JSON.stringify({ success: true, to: toEmail });
          },
        });

        // Squad Navigation Tool
        const takeMeToSquadTool = tool({
          name: "takeMeToSquad",
          description: "Navigate to a specific squad page using the squad's ID and name.",
          parameters: z.object({
            cohortId: z.string().min(1),
            cohortName: z.string().min(1),
          }),
          execute: async ({ cohortId, cohortName }) => {
            // Convert cohortName to URL-safe format (remove spaces, preserve camelCase, numbers, and special chars)
            const urlSafeName = cohortName
              .replace(/\s+/g, "") // Remove all spaces
              .replace(/^[A-Z]/, (match) => match.toLowerCase()); // Make first letter lowercase

            console.log("agent taking me to squad:", cohortId, cohortName, "->", urlSafeName);

            const path = `/squad/${cohortId}/${urlSafeName}`;

            // Use Vue Router to navigate
            console.log("Navigating to squad:", path);
            this.$router.push(path);
            return JSON.stringify({
              success: true,
              message: `Navigating to squad: ${cohortName}`,
              path: path,
              cohortId: cohortId,
              cohortName: cohortName,
            });
          },
        });

        // Terminate Session Tool
        const terminateSessionTool = tool({
          name: "terminateSession",
          description: "Terminate the current AI agent session and close the connection.",
          parameters: z.object({
            reason: z.string().nullable().optional(),
          }),
          execute: async ({ reason }) => {
            console.log("🤖 Agent terminating session:", reason || "User requested");
            this.stopSession();
            this.disconnect();
            return JSON.stringify({
              success: true,
              message: "Session terminated successfully",
              reason: reason || "User requested termination",
            });
          },
        });

        console.log("🤖 Creating RealtimeAgent...");
        this.agent = new RealtimeAgent({
          name: "Galaxy Map Builder",
          instructions: this.instructions,
          voice: "coral",
          tools: [
            unifiedMapTool,
            getSquadsTool,
            squadReportTool,
            emailTool,
            takeMeToSquadTool,
            terminateSessionTool,
          ],
        });
        console.log("✅ RealtimeAgent created:", this.agent.name);

        console.log("🚀 Creating WebRTC transport...");
        this.transport = new OpenAIRealtimeWebRTC();
        console.log("✅ Transport created:", this.transport.constructor.name);

        console.log("📡 Creating RealtimeSession...");
        this.session = new RealtimeSession(this.agent, {
          model: "gpt-realtime",
          transport: this.transport,
          config: {
            turnDetection: {
              type: "semantic_vad",
              eagerness: "medium",
              createResponse: true,
              interruptResponse: true,
            },
          },
        });
        console.log("✅ RealtimeSession created");

        this.setupEvents();
        await this.connect();
      } catch (e) {
        console.error("💥 Failed to start agent:", e);
        this.connectionError = e?.message || "Failed to start agent";
      }
    },

    setupEvents() {
      if (!this.session) return;
      this.transport.on("session.created", () => {
        this.isConnected = true;
        this.connectionError = null;
        this.isListening = true;
        this.isTalking = false;

        if (this.description && this.description.trim().length > 0) {
          console.log(
            "i have a description. starting a sendMessage to ai with description:",
            this.description,
          );
          this.session.sendMessage(
            `Please generate a galaxy map for: ${this.description}. Use your tool if needed.`,
          );
        } else {
          this.session.sendMessage(
            // "Hi! Tell me the subject and goal for your Galaxy Map, and I'll generate it.",
            "greet me by saying 'Welcome back Navigator, how can I help?'",
          );
        }
      });

      this.session.on("response.created", () => {
        this.isTalking = true;
        this.isListening = false;
      });

      this.session.on("response.done", () => {
        this.isTalking = false;
        if (!this.isStopped) this.isListening = true;
      });

      this.session.on("error", (err) => {
        this.connectionError = err?.message || "Session error";
        this.isConnected = false;
        this.isListening = false;
        this.isTalking = false;
      });

      // Helpful for talking state when audio actually starts/stops
      this.session.on &&
        this.session.on("output_audio_buffer.started", () => {
          this.isTalking = true;
          this.isListening = false;
        });
      this.session.on &&
        this.session.on("output_audio_buffer.stopped", () => {
          this.isTalking = false;
          if (!this.isStopped) this.isListening = true;
        });
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

    async toggleStop() {
      if (!this.session || !this.transport) return;
      this.isStopped = !this.isStopped;
      if (this.isStopped) {
        try {
          if (this.isConnected && typeof this.session.interrupt === "function")
            this.session.interrupt();
        } catch {}
        if (typeof this.transport.mute === "function") this.transport.mute(true);
        this.isTalking = false;
        this.isListening = false;
      } else {
        if (typeof this.transport.mute === "function") this.transport.mute(false);
        this.isTalking = false;
        this.isListening = true;
      }
      this.$emit && this.$emit("stop-toggle", this.isStopped);
    },

    async disconnect() {
      try {
        if (this.session && typeof this.session.disconnect === "function") {
          await this.session.disconnect();
        }
      } catch (_) {}
      this.session = null;
      this.transport = null;
      this.agent = null;
      this.isConnected = false;
      this.isListening = false;
      this.isTalking = false;
      this.isStopped = false;
      this.aiConversationStore.clearTokenCache();
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
  /* padding: 10px; */
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
  color: white;
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
