<template>
  <div id="container" class="bg">
    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content" style="width: 100%">
        <!-- LOADING INDICATOR -->
        <RobotLoadingSpinner
          v-if="(!isSavingToDB && isGeneratingMissions) || (!isSavingToDB && isRefining)"
        />

        <p v-if="isRefining" class="loading-message overline">
          {{ currentLoadingMessage }}
        </p>

        <!-- PROGRESS BAR FOR MISSION GENERATION -->
        <div v-if="isGeneratingMissions" class="mission-generation-progress-container">
          <p
            class="loading-message overline"
            :class="{
              'baseAccent--text': isSavingToDB,
              'missionAccent--text': isGeneratingMissions,
            }"
          >
            {{ currentLoadingMessage }}
          </p>

          <v-progress-linear
            :value="missionGenerationProgress"
            color="galaxyAccent"
            height="4"
            rounded
            class="mb-2"
            width="100px"
          ></v-progress-linear>
          <p class="mission-generation-progress-text galaxyAccent--text">
            Generating {{ completedMissions }}/{{ totalMissions }} missions ({{
              Math.round(missionGenerationProgress)
            }}% Complete)
          </p>
        </div>

        <!-- Is saving to DB -->
        <div v-if="isSavingToDB" class="saving-to-db-container">
          <RobotLoadingSpinner v-if="isSavingToDB" color="baseAccent" />
          <p class="loading-message overline baseAccent--text">
            {{ currentLoadingMessage }}
          </p>
        </div>

        <!-- CREATION STATUS v-treeview of stars > planets > missions -->
        <div
          v-if="transformedStarDetails.length > 0 && isGeneratingMissions"
          class="loading-galaxy-treeview-container"
          :class="{ mobile: isMobile }"
        >
          <div class="loading-galaxy-treeview-wrapper">
            <div
              v-for="(star, starIndex) in transformedStarDetails"
              :key="`star-${starIndex}`"
              class="loading-star-treeview-item"
            >
              <v-treeview
                :items="[star]"
                item-key="id"
                class="loading-galaxy-treeview"
                dense
                open-all
              >
                <template v-slot:label="{ item }">
                  <div class="treeview-label">
                    <div class="item-header">
                      <span class="loading-treeview-label">
                        <span v-if="item.type === 'star'" class="star-emoji">⭐</span>
                        <span v-else-if="item.type === 'planet'" class="planet-emoji">🪐</span>
                        <!-- <span v-else-if="item.type === 'mission'" class="mission-emoji">🎯</span>-->
                        <span v-else-if="item.type === 'instructions'" class="instructions-emoji"
                          >🎯</span
                        >
                        {{ item.name }}
                      </span>
                    </div>
                    <div class="loading-treeview-description">
                      <span v-if="item.type === 'instructions'" v-html="renderToHTML(item)"></span>
                      <span v-else>{{ item.description }}</span>
                    </div>
                  </div>
                </template>
              </v-treeview>
            </div>
          </div>
        </div>

        <!-- TOKEN USAGE -->
        <div class="token-usage-container pa-6" v-if="!isSavingToDB">
          <p class="token-usage overline mt-2">
            Total AI Tokens:
            {{
              aiGeneratedGalaxyMap.tokens
                ? aiGeneratedGalaxyMap.tokens.totalTokens.toLocaleString()
                : "0"
            }}
          </p>
          <p class="token-breakdown overline mt-2" v-if="!isSavingToDB">
            Input:
            {{
              aiGeneratedGalaxyMap.tokens
                ? aiGeneratedGalaxyMap.tokens.totalInputTokens.toLocaleString()
                : "0"
            }}
            | Output:
            {{
              aiGeneratedGalaxyMap.tokens
                ? aiGeneratedGalaxyMap.tokens.totalOutputTokens.toLocaleString()
                : "0"
            }}
          </p>
          <!-- <p class="token-breakdown overline mt-2" v-if="!isSavingToDB">
            Est. cost: ${{
              aiGeneratedGalaxyMap.tokens
                ? aiGeneratedGalaxyMap.tokens.combinedEstimatedCost
                  ? aiGeneratedGalaxyMap.tokens.combinedEstimatedCost.toFixed(5)
                  : (
                      (this.aiGeneratedGalaxyMap.tokens.totalInputTokens / 1000000) * 2 +
                      (this.aiGeneratedGalaxyMap.tokens.totalOutputTokens / 1000000) * 8
                    ).toFixed(5)
                : "0.00000"
            }}
          </p> -->
          <!-- Model breakdown -->
          <!-- <div
            v-if="
              aiGeneratedGalaxyMap.tokens &&
              aiGeneratedGalaxyMap.tokens.modelsUsed &&
              aiGeneratedGalaxyMap.tokens.modelsUsed.length > 0
            "
            class="model-breakdown mt-2"
          >
            <p class="model-breakdown-title overline">Models Used:</p>
            <div
              v-for="model in aiGeneratedGalaxyMap.tokens.modelsUsed"
              :key="model.model"
              class="model-item"
            >
              <span class="model-name">{{ model.model }}</span>
              <span class="model-tokens"> {{ model.totalTokens.toLocaleString() }} tokens </span>
              <span class="model-cost">${{ model.estimatedCost.toFixed(5) }}</span>
            </div>
          </div> -->
        </div>

        <!-- LONG LOADING TIME MESSAGE -->
        <div class="mt-4" v-if="!isSavingToDB">
          <p class="long-loading-time-message">
            <em
              >It typically takes around 3-5 minutes for the AI to generate a Galaxy Map.<br />
              Grab a drink or some fresh air and check back shortly.</em
            >
          </p>
        </div>
      </div>
    </div>

    <!-- <div class="left-section" :class="{ hide: hideLeftPanelsFlag }"> -->
    <div
      v-if="!isMobile"
      id="left-section"
      data-v-step="1"
      :class="{ minimized: isGalaxyInfoMinimized, mobile: isMobile }"
    >
      <!-- Galaxy Info -->
      <div
        class="galaxy-info-wrapper"
        :class="{ minimized: isGalaxyInfoMinimized, mobile: isMobile }"
      >
        <!-- Desktop Galaxy Info -->
        <GalaxyInfo
          v-if="!isMobile"
          ref="galaxyInfo"
          :course="boundCourse"
          :teacher="teacher"
          :draft="draft"
          :is-planets-collapsed="isPlanetsCollapsed"
          :ai-generated-galaxy-map="aiGeneratedGalaxyMap"
          :expand-all-planets="expandAllPlanets"
          :get-star-index="getStarIndex"
          :transformed-star-details="transformedStarDetails"
          :network-ref="$refs.network"
          @minimised="minimised"
          @preSaveUpdate="applyPreSaveUpdate"
          @togglePlanetsCollapse="togglePlanetsCollapse"
        />
      </div>

      <!-- Back button -->
      <BackButton v-if="!isGalaxyInfoMinimized" :toPath="'/'" :dynamicPath="backButtonPath" />
    </div>

    <!--==== Main section ====-->
    <div id="main-section" :class="{ minimized: isGalaxyInfoMinimized, mobile: isMobile }">
      <!-- Mobile Galaxy Info Panel -->
      <MobileGalaxyInfoPanel
        v-if="isMobile"
        :course="boundCourse"
        :teacher="teacher"
        :draft="draft"
        :minimized="isGalaxyInfoMinimized"
        :is-planets-collapsed="isPlanetsCollapsed"
        :ai-generated-galaxy-map="aiGeneratedGalaxyMap"
        :bound-course="boundCourse"
        :is-galaxy-info-minimized="isGalaxyInfoMinimized"
        :expand-all-planets="expandAllPlanets"
        :get-star-index="getStarIndex"
        :transformed-star-details="transformedStarDetails"
        :network-ref="$refs.network"
        @preSaveUpdate="applyPreSaveUpdate"
        @minimised="minimised"
        @togglePlanetsCollapse="togglePlanetsCollapse"
      />

      <!-- v-treeview of stars > planets > missions -->
      <div
        v-if="transformedStarDetails.length > 0"
        class="galaxy-treeview-container"
        :class="{ mobile: isMobile }"
      >
        <!-- =========== Generated Map Preview Container =========== -->
        <div
          class="galaxy-preview-container"
          :class="{ 'task-editing': taskEditing, mobile: isMobile }"
        >
          <!-- =========== Network Preview =========== -->
          <network
            v-if="nodesToDisplay"
            ref="network"
            class="network-graph"
            :class="{ 'task-editing': taskEditing }"
            :nodes="nodesToDisplay"
            :edges="edgesToDisplay"
            :options="network.options"
            @hook:updated="networkUpdated"
            @before-drawing="beforeDrawing"
            @after-drawing="afterDrawing"
          ></network>

          <!-- =========== Treeview =========== -->
          <div class="galaxy-treeview-wrapper" :class="{ 'task-editing': taskEditing }">
            <div
              v-for="(star, starIndex) in transformedStarDetails"
              :key="`star-${taskEditing ? 'selected' : starIndex}`"
              class="star-treeview-item"
            >
              <div>
                <!-- <h4 class="star-title">{{ star.name }}</h4> -->
                <v-treeview
                  :items="[star]"
                  :value="expandedNodes"
                  :open="expandedNodes"
                  :active="treeviewActiveItems[starIndex] || []"
                  item-key="id"
                  class="galaxy-treeview"
                  dense
                  @update:value="updateExpandedNodes"
                  @update:active="(newValue) => itemMadeActive(newValue, starIndex)"
                  hoverable
                  activatable
                  :item-disabled="'disabled'"
                  :multiple-active="!taskEditing"
                  open-all
                  color="missionAccent"
                  active-color="missionAccent"
                  :expand-icon="taskEditing ? '' : '$treeview.expand'"
                >
                  <template v-slot:label="{ item }">
                    <div
                      v-if="!(taskEditing && item.type === 'instructions')"
                      class="treeview-label"
                      :class="{
                        'ui-active': uiActiveItemId === item.id,
                        'ui-dimmed':
                          taskEditing &&
                          uiActiveItemId &&
                          uiActiveItemId !== item.id &&
                          item.type === 'planet',
                        'star-item-editing': taskEditing && item.type === 'star',
                      }"
                    >
                      <div class="item-header">
                        <span v-if="item.type === 'star'" class="star-emoji">⭐</span>
                        <span v-else-if="item.type === 'planet'" class="planet-emoji">🪐</span>
                        <span v-else-if="item.type === 'mission'" class="mission-emoji">📍</span>
                        <span v-else-if="item.type === 'instructions'" class="instructions-emoji"
                          >📍</span
                        >

                        <!-- Show input when editing, otherwise show name -->
                        <span v-if="editingItem && editingItem.id === item.id" class="item-name">
                          <v-text-field
                            v-model="editingValue"
                            dense
                            hide-details
                            class="edit-input"
                            :placeholder="getEditPlaceholder(item)"
                            @keyup.enter="saveEdit"
                            @keyup.esc="cancelEdit"
                            @blur="saveEdit"
                            ref="editInput"
                          />
                        </span>
                        <span v-else class="item-name">{{ item.name }}</span>

                        <v-icon
                          v-if="item.type !== 'instructions'"
                          class="edit-icon"
                          small
                          :color="
                            editingItem && editingItem.id === item.id
                              ? 'baseAccent'
                              : 'missionAccent'
                          "
                          @click.stop="
                            editingItem && editingItem.id === item.id
                              ? updateDescriptionWithAI(item)
                              : editItem(item)
                          "
                          :class="{
                            'updating-description': isGeneratingDescriptionForItem(item),
                          }"
                        >
                          {{ editingItem && editingItem.id === item.id ? mdiCheck : mdiPencil }}
                        </v-icon>
                        <v-icon
                          v-if="item.type !== 'instructions'"
                          class="delete-icon"
                          small
                          color="error"
                          @click.stop="deleteItem(item)"
                        >
                          {{ mdiDelete }}
                        </v-icon>
                      </div>
                      <div
                        v-if="item.description || isGeneratingDescriptionForItem(item)"
                        class="treeview-description"
                      >
                        <RobotLoadingSpinner
                          v-if="isGeneratingDescriptionForItem(item)"
                          size="30"
                          color="galaxyAccent"
                          iconSize="15"
                        />
                        <div v-else>
                          <!-- Only allow clicking instructions to open the panel; stars/planets clicks should activate chips -->
                          <div
                            v-if="item.type === 'instructions'"
                            class="treeview-markdown"
                            @click.stop="ViewMissionPanel(item, starIndex)"
                          >
                            <span v-html="renderToHTML(item)"></span>
                          </div>
                          <div v-else class="treeview-markdown">
                            <span v-html="renderToHTML(item)"></span>
                          </div>
                        </div>
                      </div>

                      <!-- ========================================
                       Generate Tasks button ((HIDE FOR NOW. CREATE TASKS IN GALAXY VIEW INSTEAD FOR NOW))
                        ======================================== -->
                      <!-- <v-btn
                        v-if="item.type === 'planet' && !taskEditing"
                        outlined
                        color="galaxyAccent"
                        class="mt-1 mx-16 generate-tasks-btn"
                        small
                        @click.stop="ViewMissionPanel(item, starIndex)"
                      >
                        <v-icon small class="mr-2">{{ mdiRobotExcited }}</v-icon> Generate Tasks
                      </v-btn> -->
                    </div>
                  </template>
                </v-treeview>

                <!-- Add planet on hover -->
                <v-btn
                  class="add-button mt-10"
                  outlined
                  color="missionAccent"
                  small
                  @click="addPlanetToStar(starIndex)"
                  title="Add new Mission to this Star"
                  v-if="!taskEditing"
                >
                  <v-icon class="pa-0" small>{{ mdiPlus }}</v-icon>
                </v-btn>
              </div>

              <!-- Add star button -->
              <div class="add-star-button">
                <v-btn
                  outlined
                  color="missionAccent"
                  small
                  class="star-button pa-0"
                  @click="addStar(starIndex)"
                  title="Add new Star"
                  v-if="!taskEditing"
                >
                  <v-icon class="pa-0" small>{{ mdiPlus }}</v-icon>
                </v-btn>
              </div>
            </div>
            <!-- end of star-treeview-item -->
          </div>
          <!-- end of galaxy-treeview-container -->
        </div>
        <!-- end of galaxy-preview-container -->

        <div class="lower-main-section" :class="{ mobile: isMobile }">
          <!-- =========== History =========== -->
          <div class="history-container" v-if="!taskEditing" :class="{ mobile: isMobile }">
            <p
              class="history-title overline missionAccent--text ma-0"
              v-if="aiGeneratedGalaxyMap.history"
            >
              checkpoints
            </p>
            <div class="history-items-container" :class="{ mobile: isMobile }">
              <div
                class="history-item"
                v-for="(checkpoint, index) in aiGeneratedGalaxyMap.history"
                :key="checkpoint.id"
              >
                <v-tooltip right color="var(--v-background-base)" content-class="history-tooltip">
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn
                      outlined
                      class="history-item-button"
                      color="missionAccent"
                      small
                      v-bind="attrs"
                      v-on="on"
                      @click="restoreHistory(checkpoint, index)"
                      >{{ index }}</v-btn
                    >
                  </template>
                  <div class="history-item-tooltip-container">
                    <p class="history-item-tooltip" v-if="checkpoint.atThisRefineUserPrompt">
                      <strong>Checkpoint saved at this prompt:</strong>
                    </p>
                    <p
                      class="history-item-tooltip pt-1"
                      style="color: white"
                      v-if="checkpoint.atThisRefineUserPrompt"
                    >
                      <em>"{{ checkpoint.atThisRefineUserPrompt }}"</em>
                    </p>
                    <p class="history-item-tooltip" v-else>
                      The original A.I. generated Galaxy Map
                    </p>
                  </div>
                </v-tooltip>
              </div>
            </div>
          </div>

          <!-- =========== Prompt =========== -->
          <RefineWithAiPrompter
            v-if="!taskEditing"
            :is-mobile="isMobile"
            :dark="dark"
            :loading="loading"
            :disabled="disabled"
            :active-galaxy-items="activeGalaxyItems"
            :active-mission-items="activeMissionItems"
            :chip-display-names="chipDisplayNames"
            :mission-chip-display-names="missionChipDisplayNames"
            :course-id="courseId"
            :has-unsaved-changes="hasUnsavedChanges"
            :value="galaxyRefineUserInput"
            @input="galaxyRefineUserInput = $event"
            @remove-chip="removeChip"
            @remove-mission-chip="removeMissionChip"
            @generate-again="generateGalaxyMapAgain()"
            @refine="refineGalaxyMap()"
            @save-new="saveGalaxyToDB"
            @open-layout-dialog="showLayoutDialog = true"
          />
        </div>
      </div>
    </div>

    <!--==== Right section ====-->
    <transition name="slide-right-panel">
      <MissionOverviewEdit
        :show="missionOverviewEditShow"
        :selected-planet-data="selectedPlanetData"
        :mission-path="activeMissionPath"
        :is-mobile="isMobile"
        @close="handleMissionPanelClose"
        @cancel-edit="handleMissionEditCanceled"
        @mission-editing-state-change="missionEditingStateChanged"
        @update-mission="handleMissionUpdate"
      >
        <template #right-panel>
          <RefineWithAiPrompter
            :is-mobile="isMobile"
            :dark="dark"
            :loading="loading"
            :disabled="disabled"
            :active-galaxy-items="activeGalaxyItems"
            :active-mission-items="activeMissionItems"
            :chip-display-names="chipDisplayNames"
            :mission-chip-display-names="missionChipDisplayNames"
            :course-id="courseId"
            :has-unsaved-changes="hasUnsavedChanges"
            :value="galaxyRefineUserInput"
            @input="galaxyRefineUserInput = $event"
            @remove-chip="removeChip"
            @remove-mission-chip="removeMissionChip"
            @generate-again="generateGalaxyMapAgain()"
            @refine="refineGalaxyMap()"
            @save-new="saveGalaxyToDB"
            @open-layout-dialog="showLayoutDialog = true"
          />
        </template>
      </MissionOverviewEdit>
    </transition>

    <!-- Total Tokens -->
    <div class="token-container" v-if="!isMobile">
      <p class="ma-0 overline token-title">
        AI Tokens Used<br />Input:
        {{
          aiGeneratedGalaxyMap.tokens
            ? aiGeneratedGalaxyMap.tokens.totalInputTokens.toLocaleString()
            : "0"
        }}
        <br />Output:
        {{
          aiGeneratedGalaxyMap.tokens
            ? aiGeneratedGalaxyMap.tokens.totalOutputTokens.toLocaleString()
            : "0"
        }}
        <br />Total:
        {{
          aiGeneratedGalaxyMap.tokens
            ? aiGeneratedGalaxyMap.tokens.totalTokens.toLocaleString()
            : "0"
        }}
        <!-- <br />Est. Cost: ${{
          aiGeneratedGalaxyMap.tokens
            ? aiGeneratedGalaxyMap.tokens.combinedEstimatedCost
              ? aiGeneratedGalaxyMap.tokens.combinedEstimatedCost.toFixed(5)
              : (
                  (aiGeneratedGalaxyMap.tokens.totalInputTokens / 1000000) * 2 +
                  (aiGeneratedGalaxyMap.tokens.totalOutputTokens / 1000000) * 8
                ).toFixed(5)
            : "0.00000"
        }} -->
      </p>
    </div>

    <!-- Layout Selection Dialog -->
    <LayoutSelectionDialog
      :show-dialog="showLayoutDialog"
      :loading="loading"
      @cancel="cancelLayoutSelection"
      @confirm="confirmLayoutSelection"
    />

    <!-- Save Galaxy Dialog (disabled for unified flow) -->
    <!--
    <SaveGalaxyDialog
      :show-dialog="showSaveGalaxyDialog"
      :loading="loading"
      @generate-tasks-then-save="handleGenerateTasksThenSave"
      @save-now-generate-later="handleSaveNowGenerateLater"
      @cancel="cancelSaveGalaxyDialog"
    />
    -->

    <!-- Prompt Dialog -->
    <!-- <PromptDialog v-if="promptDialog" :context="promptContext" /> -->

    <!-- Clarification Dialog for Galaxy Refinement -->
    <v-dialog
      v-model="showClarificationDialog"
      :width="$vuetify.breakpoint.mdAndUp ? '50%' : '95%'"
      :max-width="$vuetify.breakpoint.mdAndUp ? '800px' : '95vw'"
      light
      style="z-index: 1000"
    >
      <div class="create-dialog" :class="{ 'mobile-layout': $vuetify.breakpoint.smAndDown }">
        <!-- HEADER -->
        <div class="dialog-header">
          <p class="dialog-title">
            Galaxy Refinement Clarification
            <span class="galaxyAccent--text"
              >with A.I. <v-icon color="galaxyAccent" small>{{ mdiRobotExcited }}</v-icon></span
            >
          </p>
          <div class="d-flex align-center">
            <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
            <div>
              <p class="dialog-description">
                I need a bit more information to refine your Galaxy Map exactly as you want.
              </p>
              <p class="dialog-description mt-2">
                Please answer the following questions to help me understand your requirements
                better.
              </p>
            </div>
          </div>
        </div>
        <!-- DIALOG CONTENT -->
        <div
          class="create-dialog-content"
          :class="{ 'mobile-layout': $vuetify.breakpoint.smAndDown }"
        >
          <div v-for="(question, index) in clarificationQuestions" :key="question">
            <p class="dialog-description">
              Clarifying question {{ index + 1 }} of {{ clarificationQuestions.length }}
            </p>
            <p class="dialog-description galaxyAccent--text mt-2">
              "{{ question }}" >
              <v-icon color="galaxyAccent" x-small>{{ mdiRobotExcited }}</v-icon>
            </p>
            <v-textarea
              :dark="dark"
              :light="!dark"
              class="input-field mt-2"
              outlined
              color="missionAccent"
              auto-grow
              clearable
              rows="5"
              v-model="clarificationAnswers[index]"
              :disabled="loading"
              :autofocus="index === 0 && !isMobile"
              :dense="$vuetify.breakpoint.smAndDown"
              hide-details
            ></v-textarea>
          </div>

          <!-- ACTION BUTTONS -->
          <div
            class="action-buttons flex-row justify-center"
            :class="{ 'mobile-layout': $vuetify.breakpoint.smAndDown }"
          >
            <!-- CONTINUE -->
            <v-btn
              outlined
              :color="'galaxyAccent'"
              @click="continueWithClarification()"
              class="mx-2"
              :loading="loading"
              :disabled="disabled"
              :dark="dark"
              :light="!dark"
            >
              <v-icon left> {{ mdiRobotExcited }} </v-icon>
              Continue Refinement
            </v-btn>

            <v-btn
              outlined
              :color="$vuetify.theme.dark ? 'white' : 'f7f7ff'"
              @click="cancelClarification"
              :disabled="loading"
              :dark="dark"
              :light="!dark"
            >
              <v-icon left> {{ mdiClose }} </v-icon>
              Cancel
            </v-btn>
          </div>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<script>
import {
  mdiPencil,
  mdiPlus,
  mdiDelete,
  mdiCheck,
  mdiRobotExcited,
  mdiArrowRightBold,
  mdiArrowLeftBold,
  mdiContentSave,
  mdiInformationVariant,
  mdiClose,
  mdiChevronUp,
  mdiChevronDown,
} from "@mdi/js";
import LoadingSpinner from "@/components/Reused/LoadingSpinner.vue";
import RobotLoadingSpinner from "@/components/Reused/RobotLoadingSpinner.vue";
import GalaxyInfo from "@/components/GalaxyView/GalaxyInfo.vue";
import MobileGalaxyInfoPanel from "@/components/GalaxyView/MobileGalaxyInfoPanel.vue";
import PublishGalaxy from "@/components/GalaxyView/PublishGalaxy.vue";
import BackButton from "@/components/Reused/BackButton.vue";
import LayoutSelectionDialog from "@/components/Dialogs/LayoutSelectionDialog.vue";
import SaveGalaxyDialog from "@/components/Dialogs/SaveGalaxyDialog.vue";
import PdfDownloader from "@/components/Reused/PdfDownloader.vue";
import MissionOverviewEdit from "@/components/Reused/MissionOverviewEdit.vue";
import useRootStore from "@/store/index";
import { mapActions, mapState } from "pinia";
import Network from "@/vue2vis/Network.vue";
import "vis-network/styles/vis-network.css";
import { Planet } from "@/lib/planet";
import { zodTextFormat } from "openai/helpers/zod";
import { StarsAndPlanetsResponseSchema, UnifiedGalaxyMapResponseSchema } from "@/lib/schemas";
import {
  saveGalaxyMap,
  generateInstructionsForMission,
  generateGalaxyMapAgain,
  getGalaxyMapObjectFromCourse,
  refineGalaxyMap,
  refineGalaxyMapWithClarification,
} from "@/lib/ff";
import * as smd from "streaming-markdown";
import { getFriendlyErrorMessage } from "@/lib/utils";
import { db } from "@/store/firestoreConfig";

// import PromptDialog from "@/components/Dialogs/PromptDialog.vue";

export default {
  name: "AiGalaxyEdit",
  components: {
    LoadingSpinner,
    RobotLoadingSpinner,
    GalaxyInfo,
    MobileGalaxyInfoPanel,
    BackButton,
    PublishGalaxy,
    LayoutSelectionDialog,
    SaveGalaxyDialog,
    PdfDownloader,
    // PromptDialog,
    RefineWithAiPrompter: () => import("@/components/Reused/RefineWithAiPrompter.vue"),
    Network,
    MissionOverviewEdit,
  },
  props: ["parsedResponse", "courseId"],
  data() {
    return {
      loading: false,
      promptDialog: false,
      promptContext: null,
      courseTasks: [],
      mdiPencil,
      mdiPlus,
      mdiDelete,
      mdiCheck,
      mdiRobotExcited,
      mdiArrowRightBold,
      mdiArrowLeftBold,
      mdiContentSave,
      mdiInformationVariant,
      mdiClose,
      mdiChevronUp,
      mdiChevronDown,

      // Loading tracking
      isSavingToDB: false,
      isGeneratingMissions: false,
      isRefining: false,
      currentLoadingMessage: "",
      loadingMessageInterval: null,
      missionGenerationProgress: 0,
      completedMissions: 0,
      totalMissions: 0,
      shouldGenerateMissions: false, // Flag to track if we should generate missions after layout selection

      // Token usage tracking
      totalTokens: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,

      // Galaxy treeview data
      transformedStarDetails: [],
      expandedNodes: [],
      activeGalaxyItems: [],
      activeMissionItems: [],
      treeviewActiveItems: {}, // Track active items for each treeview
      updateTimeout: null, // Debounce updates to prevent rapid toggling
      isPlanetsCollapsed: false, // Track if planets are collapsed

      // Inline editing
      editingItem: null, // Track which item is being edited
      editingValue: "", // Store the current editing value

      // Network data
      nodesToDisplay: [],
      edgesToDisplay: [],

      // AI Generated Galaxy Map
      aiGeneratedGalaxyMap: {},
      originalGalaxyMapSnapshot: null,

      // GalaxyInfo minimized state
      isGalaxyInfoMinimized: false,

      // Task editing state
      missionOverviewEditShow: false,
      taskEditing: false,
      activeTaskItem: null,
      selectedTasksStarData: null, // Store the selected star data for task editing
      uiActiveItemId: null, // Track the UI active item for visual highlighting
      activeMissionPath: null, // Track the mission currently being edited
      taskEditingStarIndex: null,
      taskEditingPlanetIndex: null,

      // Planet animation properties
      planets: [],
      time: null,
      intervalid1: null,

      // Planet highlight state
      highlightedPlanetTopicId: null,
      highlightedPlanetIndex: null,

      // Loading messages
      loadingMessages: [
        "Exploring the cosmos for knowledge...",
        "Charting new learning pathways...",
        "Mapping distant galaxies of consciousness...",
        "Calculating interstellar alignments...",
        "Assembling galactic sources of creation...",
        "Searching the stars for enlightenment...",
        "Gathering cosmic learning resources...",
        "Preparing your journey through the stars...",
        "Creating your learning universe...",
        "Calibrating educational coordinates...",
      ],
      savingMessages: [
        "Beaming data to the cosmic database...",
        "Transmitting knowledge to the stars...",
        "Uploading wisdom to the galactic cloud...",
        "Storing secrets in the nebula network...",
        "Saving discoveries to the void...",
        "Archiving adventures in space-time...",
        "Backing up brilliance to the cosmos...",
        "Securing stories in the stellar vault...",
        "Preserving pathways in the quantum realm...",
        "Caching creativity in the cosmic cache...",
        "Stashing strategies in the space station...",
        "Hoarding hopes in the heavenly hard drive...",
        "Depositing dreams in the deep space drive...",
        "Storing solutions in the solar system...",
        "Saving sagas in the stellar sanctuary...",
      ],

      network: {
        options: {
          // layout: {
          //   hierarchical: {
          //     enabled: true,
          //     sortMethod: "directed",
          //     shakeTowards: "leaves",
          //     direction: "LR",
          //     nodeSpacing: 100,
          //   },
          // },
          physics: {
            enabled: false, // Keep physics disabled to maintain fixed positions
          },
          edges: {
            length: 50, // Longer edges between nodes.
            smooth: false,
            color: {
              inherit: "to",
            },
          },
          nodes: {
            shape: "dot",
            size: 7,
            fixed: {
              x: true,
              y: true,
            },
            color: {
              border: "grey",
              highlight: {
                border: "black",
                background: "white",
              },
              hover: {
                border: "orange",
                background: "grey",
              },
            },
            font: {
              color: "white",
              align: "left",
              face: "Arial",
              size: 16,
            },
            // Disable vis-network labels since we'll draw them manually
            label: "",
          },
          groups: {
            default: {
              shape: "dot",
            },
            completed: {
              shape: "dot",
              color: "#00E676",
            },
            locked: {
              color: "rgba(132,132,132,0.4)", // opaque styling to appear locked
              shape: "dot",
              font: {
                color: "rgba(132,132,132,0.4)", // opaque styling to appear locked
              },
              // opacity: 0.1,
            },
            // unlocked: {
            //   shape: "dot",
            //   color: "#69A1E2",
            // },
            // current: { color: "rgb(0,255,140)" },
            // node status
            // inreview: {
            //   shape: "dot",
            //   color: "#FAF200",
            // },
            // node types
            introduction: {
              shape: "dot",
              color: "#00E676", // baseAccent
            },
            // tasks: {
            //   // color: { background: "yellow", border: "white" },
            //   // shape: "diamond",
            //   shape: "dot",
            //   color: "#69A1E2",
            // },
            // project: {
            //   shape: "dot",
            //   color: "#E269CF",
            // },
            inactive: {
              shape: "dot",
              color: "#696969",
              font: {
                color: "#696969",
              },
            },
          },
          interaction: {
            hover: false,
            hoverConnectedEdges: false,
            dragNodes: false,
            dragView: false,
            multiselect: false,
            zoomView: false,
          },
        },
      },

      // Galaxy Refine Prompt
      galaxyRefineUserInput: "",

      // Resize handling
      resizeTimeout: null,

      // Treeview observer
      treeviewObserver: null,

      // Layout selection dialog
      showLayoutDialog: false,

      // Save galaxy dialog
      showSaveGalaxyDialog: false,

      // AI description update
      descriptionGenerating: false,
      itemsGeneratingDescription: new Set(), // Track items currently generating descriptions

      showClarificationDialog: false,
      clarificationQuestions: [
        "What specific areas of the Galaxy Map do you want to change?",
        "Are there any specific mission instructions you want to update?",
        "Do you want to add any new missions or modify existing ones?",
        "Are there any specific goals or milestones you want to achieve?",
        "Do you want to add any new stars or modify existing ones?",
        "Are there any specific themes or concepts you want to highlight?",
        "Do you want to add any new planets or modify existing ones?",
        "Are there any specific tasks or activities you want to include?",
        "Do you want to add any new mission instructions or modify existing ones?",
        "Are there any specific checkpoints or milestones you want to set?",
      ],
      clarificationAnswers: [],
      previousRefinementResponseId: null,
    };
  },
  watch: {
    courseId: {
      immediate: true,
      async handler(newVal) {
        if (newVal) {
          await this.bindCourseByCourseId(newVal);
          this.setCurrentCourseId(newVal);
        }
      },
    },
    loading(newValue) {
      if (newValue) {
        this.startLoadingMessages();
      } else {
        this.stopLoadingMessages();
      }
    },
    dark(newValue) {
      // Update planet colors when theme changes
      this.updatePlanetColors();
    },
    aiGeneratedGalaxyMap: {
      handler(newVal, oldVal) {
        this.updateTransformedStarDetails();
        // Set up planets when galaxy map changes
        this.$nextTick(() => {
          this.setupPlanets();
        });
      },
      deep: true,
      immediate: true,
    },
    transformedStarDetails: {
      handler(newVal, oldVal) {
        // Update open nodes when new data is added
        if (newVal && newVal.length > 0) {
          this.$nextTick(() => {
            // Use setTimeout to ensure DOM is fully updated
            setTimeout(() => {
              // Get all current node IDs
              const allNodeIds = this.getAllNodeIds(newVal);

              // Get previously existing node IDs (if oldVal exists)
              const existingNodeIds = oldVal ? this.getAllNodeIds(oldVal) : [];

              // Find newly added node IDs
              const newlyAddedNodeIds = allNodeIds.filter((id) => !existingNodeIds.includes(id));

              // If planets are collapsed, only expand stars and newly added nodes
              if (this.isPlanetsCollapsed) {
                const starNodeIds = this.getStarNodeIds(newVal);
                this.expandedNodes = [...new Set([...starNodeIds, ...newlyAddedNodeIds])];
              } else {
                // Preserve existing expanded state and add newly added nodes
                this.expandedNodes = [...new Set([...this.expandedNodes, ...newlyAddedNodeIds])];
              }

              // Update network positions based on treeview item widths
              this.updateNetworkPositionsFromTreeview();
            }, 100);
          });
        }
      },
      deep: true,
    },
    taskEditing(newValue, oldValue) {
      // When task editing is turned off, restore the full data
      if (oldValue === true && newValue === false) {
        this.restoreFullData();
        // Clear any planet highlight and reset colors
        this.clearPlanetHighlight();
        this.updatePlanetColors();
        this.activeMissionItems = [];
        this.activeMissionPath = null;
        this.taskEditingStarIndex = null;
        this.taskEditingPlanetIndex = null;
      }
    },
  },
  beforeDestroy() {
    // Stop planet animation
    this.stopNodeAnimation();
    // Remove resize listener
    window.removeEventListener("resize", this.handleResize);
    // Disconnect mutation observer
    if (this.treeviewObserver) {
      this.treeviewObserver.disconnect();
    }
    // Clear any pending update timeout
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = null;
    }
  },
  async mounted() {
    // Check if we have courseId from route params
    if (this.courseId) {
      // Set the current course ID in the store
      this.setCurrentCourseId(this.courseId);
      // Bind to store-managed course (reactive like GalaxyView)
      await this.bindCourseByCourseId(this.courseId);

      // Load course data from store if available
      if (this.aiGalaxyEditData) {
        this.aiGeneratedGalaxyMap = this.aiGalaxyEditData;
      } else {
        // If no data in store, initialize with empty structure
        this.aiGeneratedGalaxyMap = {
          title: "Untitled Galaxy",
          description: "No description available",
          tokens: {
            totalInputTokens: 0,
            totalOutputTokens: 0,
            totalTokens: 0,
          },
        };
      }
    } else if (this.parsedResponse) {
      // Check if we have parsedResponse from props or need to restore from store (Cursor changed AICreatedGalaxyDialog to pass the paresedResponse through the store instead of router params FYI)
      this.aiGeneratedGalaxyMap = this.parsedResponse;
      if (!this.aiGeneratedGalaxyMap.tokens) {
        // Try to restore from store if available
        if (this.aiGalaxyEditData && this.aiGalaxyEditData.tokens) {
          this.aiGeneratedGalaxyMap.tokens = { ...this.aiGalaxyEditData.tokens };
        } else {
          this.aiGeneratedGalaxyMap.tokens = {
            totalInputTokens: 0,
            totalOutputTokens: 0,
            totalTokens: 0,
          };
        }
      }
      // Save to store for persistence
      this.setAiGalaxyEditData(this.aiGeneratedGalaxyMap);
    } else {
      // Try to restore from store
      this.aiGeneratedGalaxyMap = this.aiGalaxyEditData;
      if (this.aiGeneratedGalaxyMap && !this.aiGeneratedGalaxyMap.tokens) {
        this.aiGeneratedGalaxyMap.tokens = {
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalTokens: 0,
        };
      }
    }

    // Wait for treeview items to render, then set up nodes and edges based on their positions
    this.setupInitialNetworkNodes();

    // Initialize expandedNodes to show all nodes by default
    this.$nextTick(() => {
      if (this.transformedStarDetails.length > 0) {
        this.expandedNodes = this.getAllNodeIds(this.transformedStarDetails);
      }
    });

    // Add resize listener
    window.addEventListener("resize", this.handleResize);

    // Set up MutationObserver to watch for treeview content changes
    this.setupTreeviewObserver();

    // Capture initial snapshot for change detection
    this.originalGalaxyMapSnapshot = this.getSanitizedGalaxyMap(this.aiGeneratedGalaxyMap);
  },
  computed: {
    ...mapState(useRootStore, {
      aiGalaxyEditData: "aiGalaxyEditData",
      storeBoundCourse: "boundCourse",
    }),
    boundCourse() {
      // When routed with an id, prefer the store-bound course (same behavior as GalaxyView)
      if (this.courseId && this.storeBoundCourse) return this.storeBoundCourse;

      // Fallback to AI-generated data prior to save
      const responseData = this.parsedResponse || this.aiGalaxyEditData || {};
      return {
        id: this.courseId || responseData.idInDatabase || responseData.id || null,
        title: responseData.title || "Untitled Galaxy",
        description: responseData.description || "No description available",
        status: "drafting",
        image: responseData.image || null,
      };
    },
    teacher() {
      return true; // For AI editing, assume teacher permissions
    },
    draft() {
      return this.boundCourse.status === "drafting";
    },
    showPublish() {
      return true; // For AI editing, show publish option
    },
    dark() {
      return this.$vuetify.theme.isDark;
    },
    disabled() {
      return this.loading || !(this.galaxyRefineUserInput && this.galaxyRefineUserInput.trim());
    },
    // Computed property to get chip display names without causing reactivity loops
    chipDisplayNames() {
      const names = {};
      this.activeGalaxyItems.forEach((item) => {
        names[item] = this.getChipDisplayName(item);
      });
      return names;
    },
    missionChipDisplayNames() {
      const names = {};
      this.activeMissionItems.forEach((item) => {
        names[item] = this.getMissionChipDisplayName(item);
      });
      return names;
    },
    // Computed property to get selected planet data for right section
    selectedPlanetData() {
      if (!this.taskEditing || !this.activeMissionPath) {
        return null;
      }

      const { starIndex, planetIndex } = this.parseGalaxyPath(this.activeMissionPath);
      if (starIndex == null || planetIndex == null) return null;

      const star = this.aiGeneratedGalaxyMap?.stars?.[starIndex];
      const planet = star?.planets?.[planetIndex];
      if (!planet) return null;

      return {
        id: `star[${starIndex}].planet[${planetIndex}]`,
        title: planet.title,
        description: planet.description,
        missionInstructions: planet.missionInstructions || {
          intro: "",
          outro: "",
          steps: [],
        },
        starTitle: star?.title || "",
      };
    },

    /**
     * Computed property that returns a function to render content for any item
     * This handles structured mission instructions, markdown content, and HTML content
     */
    renderToHTML() {
      return (item) => {
        if (!item || !item.description) return "";

        // console.log("🔄 Rendering html for item:", item);

        try {
          // If the item already has renderedDescription, use it
          if (item.renderedDescription) {
            return item.renderedDescription;
          }

          // Check if content is structured mission instructions (JSON object)
          if (this.isStructuredMissionInstructions(item.description)) {
            return this.formatMissionInstructionsToHtml(item.description);
          }

          // Check if content is already HTML
          if (this.isHtmlContent(item.description)) {
            return item.description;
          }

          // Check if content contains markdown syntax
          if (this.containsMarkdown(item.description)) {
            return this.renderMarkdownWithStreaming(item.description);
          }

          // For plain text content, escape HTML and return
          return this.escapeHtml(item.description);
        } catch (error) {
          console.error("Error rendering content:", error);
          // Fallback to plain text with HTML escaping
          return this.escapeHtml(item.description);
        }
      };
    },
    /**
     * Computed property to determine the back button path
     * If courseId is available, route back to GalaxyView, otherwise go to home
     */
    backButtonPath() {
      return this.courseId ? `/galaxy/${this.courseId}` : null;
    },
    hasUnsavedChanges() {
      try {
        const current = this.getSanitizedGalaxyMap(this.aiGeneratedGalaxyMap);
        const baseline = this.originalGalaxyMapSnapshot;
        if (!baseline) return false;
        return JSON.stringify(current) !== JSON.stringify(baseline);
      } catch (e) {
        return false;
      }
    },
    isMobile() {
      return this.$vuetify.breakpoint.smAndDown;
    },
  },
  methods: {
    // Estimate content height based on text length and structure
    estimateContentHeight(content) {
      if (!content) return 0;

      // Ensure content is a string
      let contentStr = "";
      if (typeof content === "string") {
        contentStr = content;
      } else if (typeof content === "object" && content !== null) {
        // If it's an object, try to extract text from common properties
        if (content.intro) contentStr += content.intro + " ";
        if (content.description) contentStr += content.description + " ";
        if (content.title) contentStr += content.title + " ";
        // Convert to string if it's still an object
        if (typeof contentStr === "object") {
          contentStr = JSON.stringify(contentStr);
        }
      } else {
        // For any other type, convert to string
        contentStr = String(content);
      }

      // Convert HTML to plain text for length calculation
      const plainText = contentStr.replace(/<[^>]*>/g, "").trim();

      // Base height for title/header
      let height = 40;

      // Add height for text content
      if (plainText) {
        // Rough estimate: ~50 characters per line at 13px font size
        const charsPerLine = 50;
        const lines = Math.ceil(plainText.length / charsPerLine);
        height += lines * 18; // 18px per line
      }

      // Add height for HTML elements (headings, lists, etc.)
      const headingCount = (contentStr.match(/<h[1-6][^>]*>/g) || []).length;
      const listCount = (contentStr.match(/<[uo]l[^>]*>/g) || []).length;
      const paragraphCount = (contentStr.match(/<p[^>]*>/g) || []).length;

      height += headingCount * 25; // 25px per heading
      height += listCount * 15; // 15px per list
      height += paragraphCount * 10; // 10px per paragraph

      return Math.max(height, 80); // Minimum height
    },

    getSanitizedGalaxyMap(map) {
      if (!map) return null;
      const clone = JSON.parse(JSON.stringify(map));
      delete clone.history;
      delete clone.tokens;
      return clone;
    },

    async saveChangesToExistingGalaxy() {
      try {
        if (!this.courseId && !this.aiGeneratedGalaxyMap.idInDatabase) {
          this.setSnackbar({ show: true, text: "Missing course ID to save.", color: "error" });
          return;
        }

        this.isSavingToDB = true;
        this.loading = true;
        this.stopLoadingMessages();
        this.startLoadingMessages();

        const courseId = this.aiGeneratedGalaxyMap.idInDatabase || this.courseId;
        this.aiGeneratedGalaxyMap.idInDatabase = courseId;

        // Merge existing DB mission instructions first to prevent loss
        if (courseId) {
          try {
            const dbMap = await getGalaxyMapObjectFromCourse(courseId);
            if (dbMap && dbMap.stars && this.aiGeneratedGalaxyMap?.stars) {
              for (let si = 0; si < this.aiGeneratedGalaxyMap.stars.length; si++) {
                const star = this.aiGeneratedGalaxyMap.stars[si];
                const dbStar = dbMap.stars[si];
                if (!star?.planets || !dbStar?.planets) continue;
                for (let pi = 0; pi < star.planets.length; pi++) {
                  const planet = star.planets[pi];
                  const dbPlanet = dbStar.planets[pi];
                  // If AI map lacks missionInstructions/instructions but DB has description, carry it over
                  const hasLegacyInstructions = planet && planet.instructions;
                  if (
                    planet &&
                    !planet.missionInstructions &&
                    !hasLegacyInstructions &&
                    dbPlanet &&
                    typeof dbPlanet.description === "string" &&
                    dbPlanet.description.trim()
                  ) {
                    planet.missionInstructions = dbPlanet.description;
                  }
                }
              }
            }
          } catch (e) {
            console.warn("Failed to merge DB mission instructions; proceeding without merge", e);
          }
        }

        // Convert mission instructions only if they are structured (object/JSON), keep plain HTML strings as-is
        if (this.aiGeneratedGalaxyMap && this.aiGeneratedGalaxyMap.stars) {
          for (let starIndex = 0; starIndex < this.aiGeneratedGalaxyMap.stars.length; starIndex++) {
            const star = this.aiGeneratedGalaxyMap.stars[starIndex];
            if (star.planets) {
              for (let planetIndex = 0; planetIndex < star.planets.length; planetIndex++) {
                const planet = star.planets[planetIndex];
                if (planet && planet.missionInstructions) {
                  const mi = planet.missionInstructions;
                  const shouldConvert =
                    typeof mi === "object" ||
                    (typeof mi === "string" && this.isStructuredMissionInstructions(mi));
                  if (shouldConvert) {
                    planet.missionInstructions = this.formatMissionInstructionsToHtml(mi);
                  }
                }
              }
            }
          }
        }

        // Merge top-level fields from bound DB course to avoid overwriting recent UI edits
        const payloadGalaxyMap = { ...this.aiGeneratedGalaxyMap, idInDatabase: courseId };
        if (this.courseId && this.boundCourse) {
          payloadGalaxyMap.title = this.boundCourse.title ?? payloadGalaxyMap.title;
          payloadGalaxyMap.description =
            this.boundCourse.description ?? payloadGalaxyMap.description;
          if (this.boundCourse.image) {
            payloadGalaxyMap.image = { ...this.boundCourse.image };
          }
        }

        // Call backend save function; it will update existing course if idInDatabase is set
        await saveGalaxyMap(
          payloadGalaxyMap,
          // layout value is irrelevant for updates but must be passed; reuse zigzag
          "zigzag",
        );

        this.originalGalaxyMapSnapshot = this.getSanitizedGalaxyMap(this.aiGeneratedGalaxyMap);

        this.setSnackbar({ show: true, text: "Galaxy changes saved.", color: "baseAccent" });

        // route back to galaxy view
        this.$router.push({ name: "GalaxyView", params: { courseId: courseId } });
      } catch (error) {
        console.error("Error saving galaxy changes:", error);
        this.setSnackbar({
          show: true,
          text: "Error saving changes: " + (error.message || "Unknown error"),
          color: "error",
        });
      } finally {
        this.isSavingToDB = false;
        this.loading = false;
      }
    },
    ...mapActions(useRootStore, [
      "setAiGalaxyEditData",
      "clearAiGalaxyEditData",
      "setSnackbar",
      "setCurrentCourseId",
      "bindCourseByCourseId",
    ]),

    /**
     * Detects if content is structured mission instructions (JSON object)
     * @param content - The content to analyze
     * @returns boolean - true if structured mission instructions
     */
    isStructuredMissionInstructions(content) {
      if (!content) return false;

      try {
        // Check if it's a JSON object with the expected structure
        if (typeof content === "object" && content !== null) {
          return (
            (content.instructions && Array.isArray(content.instructions)) ||
            (content.steps && Array.isArray(content.steps))
          );
        }

        // Check if it's a JSON string that can be parsed to the expected structure
        if (typeof content === "string") {
          const parsed = JSON.parse(content);
          return (
            (parsed.instructions && Array.isArray(parsed.instructions)) ||
            (parsed.steps && Array.isArray(parsed.steps))
          );
        }

        return false;
      } catch (error) {
        // If parsing fails, it's not structured mission instructions
        return false;
      }
    },

    /**
     * Formats structured mission instructions into HTML
     * @param missionInstructions - The structured mission instructions object
     * @returns HTML string
     */
    formatMissionInstructionsToHtml(missionInstructions) {
      if (!missionInstructions) return "";

      try {
        // Handle both object and string formats
        let instructions = missionInstructions;
        if (typeof missionInstructions === "string") {
          instructions = JSON.parse(missionInstructions);
        }

        let html = "";

        // Add description
        if (instructions.description && !this.isGeneratingMissions) {
          html += `<p>${instructions.description}</p>`;
        }

        if (instructions.intro) {
          html += `<p class="intro">${instructions.intro}</p>`;
        }

        // Add instructions section (supports unified "steps" or legacy "instructions")
        const stepsArray = instructions.instructions || instructions.steps || [];
        if (stepsArray.length > 0) {
          if (!this.isGeneratingMissions) {
            html += `<h2>Instructions</h2>`;
          }

          // Loop through each step
          stepsArray.forEach((step) => {
            if (step.title) {
              html += `<h3>${step.title}</h3>`;
            }

            // Add tasks, avoiding nested <ul><li> when task content already contains lists
            if (step.tasks && step.tasks.length > 0) {
              let listOpen = false;
              step.tasks.forEach((task) => {
                if (!task || !task.taskContent) return;
                const parsedTaskContent = this.renderMarkdownWithStreaming(task.taskContent);
                const hasOwnList =
                  /<(ul|ol)[\s>]/i.test(parsedTaskContent) || /<li[\s>]/i.test(parsedTaskContent);
                if (hasOwnList) {
                  if (listOpen) {
                    html += `</ul>`;
                    listOpen = false;
                  }
                  html += parsedTaskContent;
                } else {
                  if (!listOpen) {
                    html += `<ul>`;
                    listOpen = true;
                  }
                  html += `<li>${parsedTaskContent}</li>`;
                }
              });
              if (listOpen) {
                html += `</ul>`;
                listOpen = false;
              }
            }

            // Optional checkpoint
            if (step.checkpoint) {
              html += `<p><em>Checkpoint: ${step.checkpoint}</em></p>`;
            }
          });
        }

        if (instructions.outro) {
          html += `<p class="outro">${instructions.outro}</p>`;
        }

        // console.log("🔄 Formatted mission instructions to HTML:", html);
        return html;
      } catch (error) {
        console.error("❌ Error formatting mission instructions to HTML:", error);
        return ""; // Fallback to empty string
      }
    },

    /**
     * Renders markdown using streaming-markdown library
     * @param markdown - The markdown text to convert
     * @returns HTML string
     */
    renderMarkdownWithStreaming(markdown) {
      if (!markdown) return "";

      try {
        // Check if streaming-markdown is available
        if (typeof smd !== "undefined" && smd.default_renderer && smd.parser) {
          // Create a temporary div element to render into
          const tempDiv = document.createElement("div");

          // Create renderer and parser
          const renderer = smd.default_renderer(tempDiv);
          const parser = smd.parser(renderer);

          // Write the markdown content
          smd.parser_write(parser, markdown);

          // End the stream
          smd.parser_end(parser);

          // Get the HTML content
          const html = tempDiv.innerHTML;

          return html;
        } else {
          // Fallback to plain text if streaming-markdown is not available
          console.warn("streaming-markdown not available, returning plain text");
          return markdown;
        }
      } catch (error) {
        console.error("Error rendering markdown:", error);
        return markdown; // Fallback to plain text
      }
    },
    removeChip(item) {
      this.activeGalaxyItems = this.activeGalaxyItems.filter((i) => i !== item);

      // Also remove from the correct treeview active array to update the visual state
      const starMatch = item.match(/^star\[(\d+)\]/);
      if (starMatch) {
        const starIndex = starMatch[1];
        if (this.treeviewActiveItems[starIndex]) {
          const updatedActiveItems = this.treeviewActiveItems[starIndex].filter((i) => i !== item);
          this.$set(this.treeviewActiveItems, starIndex, updatedActiveItems);
        }
      }
    },
    addActiveMissionItem(item) {
      if (!item) return;
      if (!this.activeMissionItems.includes(item)) {
        this.activeMissionItems = [...this.activeMissionItems, item];
      }
    },
    removeMissionChip(item) {
      this.activeMissionItems = this.activeMissionItems.filter((i) => i !== item);
    },
    getMissionChipDisplayName(item) {
      const { starIndex, planetIndex } = this.parseGalaxyPath(item);
      const star = this.aiGeneratedGalaxyMap?.stars?.[starIndex];
      const planet = star?.planets?.[planetIndex];
      if (planet && star) {
        return `🎯 ${star.title} › ${planet.title}`;
      }
      if (planet) {
        return `🎯 ${planet.title}`;
      }
      return item;
    },
    parseGalaxyPath(path) {
      if (!path || typeof path !== "string") {
        return { starIndex: null, planetIndex: null, missionIndex: null };
      }
      const starMatch = path.match(/star\[(\d+)\]/);
      const planetMatch = path.match(/planet\[(\d+)\]/);
      const missionMatch = path.match(/mission\[(\d+)\]/);
      return {
        starIndex: starMatch ? parseInt(starMatch[1], 10) : null,
        planetIndex: planetMatch ? parseInt(planetMatch[1], 10) : null,
        missionIndex: missionMatch ? parseInt(missionMatch[1], 10) : null,
      };
    },
    getChipDisplayName(item) {
      // Parse the item ID to extract the actual name from aiGeneratedGalaxyMap
      // Handle different item ID patterns using object notation
      if (item.startsWith("star[")) {
        // Pattern: star[2] -> get star name
        const starMatch = item.match(/^star\[(\d+)\]$/);
        if (starMatch) {
          const starIndex = parseInt(starMatch[1]);
          const star =
            this.aiGeneratedGalaxyMap.stars && this.aiGeneratedGalaxyMap.stars[starIndex];
          if (star && star.title) return "⭐" + star.title;
          return item;
        }

        // Pattern: star[2].planet[0] -> get planet name
        const planetMatch = item.match(/^star\[(\d+)\]\.planet\[(\d+)\]$/);
        if (planetMatch) {
          const starIndex = parseInt(planetMatch[1]);
          const planetIndex = parseInt(planetMatch[2]);
          const star =
            this.aiGeneratedGalaxyMap.stars && this.aiGeneratedGalaxyMap.stars[starIndex];
          const planet = star && star.planets && star.planets[planetIndex];
          if (planet && planet.title) return "🪐" + planet.title;
          return item;
        }

        // Pattern: star[2].planet[0].mission[0] -> get mission name
        const missionMatch = item.match(/^star\[(\d+)\]\.planet\[(\d+)\]\.mission\[(\d+)\]$/);
        if (missionMatch) {
          const starIndex = parseInt(missionMatch[1]);
          const planetIndex = parseInt(missionMatch[2]);
          const missionIndex = parseInt(missionMatch[3]);
          const star =
            this.aiGeneratedGalaxyMap.stars && this.aiGeneratedGalaxyMap.stars[starIndex];
          const planet = star && star.planets && star.planets[planetIndex];
          const mission = planet && planet.missions && planet.missions[missionIndex];
          if (mission && mission.title) return "🎯" + mission.title;
          return item;
        }
      }
      // Fallback: return the original item if parsing fails
      return item;
    },

    // Set up initial network nodes and edges based on treeview positions
    setupInitialNetworkNodes() {
      // Use a more robust approach that waits for DOM to be ready
      const waitForTreeview = () => {
        const treeviewItems = document.querySelectorAll(".star-treeview-item");
        const treeviewWrapper = document.querySelector(".galaxy-treeview-wrapper");

        // Check if treeview items are properly rendered with dimensions
        if (treeviewItems.length === 0 || !treeviewWrapper) {
          setTimeout(waitForTreeview, 100);
          return;
        }

        // Check if items have proper dimensions
        const firstItem = treeviewItems[0];
        const firstItemRect = firstItem.getBoundingClientRect();
        if (firstItemRect.width === 0 || firstItemRect.height === 0) {
          setTimeout(waitForTreeview, 100);
          return;
        }

        this.updateNetworkPositionsFromTreeview();
      };

      // Start the waiting process with a longer initial delay to ensure network is ready
      this.$nextTick(() => {
        setTimeout(waitForTreeview, 500);
      });
    },

    // Calculate treeview item widths and update network positions
    updateNetworkPositionsFromTreeview() {
      this.$nextTick(() => {
        // Check if network is ready
        if (!this.$refs.network || !this.$refs.network.network) {
          setTimeout(() => {
            this.updateNetworkPositionsFromTreeview();
          }, 200);
          return;
        }

        // Additional check to ensure network is fully initialized
        try {
          this.$refs.network.network.getPositions();
        } catch (error) {
          setTimeout(() => {
            this.updateNetworkPositionsFromTreeview();
          }, 200);
          return;
        }

        // Get all star-treeview-item elements
        const treeviewItems = document.querySelectorAll(".star-treeview-item");

        if (treeviewItems.length === 0) {
          return;
        }

        // Calculate total width of all treeview items plus gaps
        let totalWidth = 0;
        const gapSize = 20; // 20px gap from flexbox

        treeviewItems.forEach((item, index) => {
          const itemRect = item.getBoundingClientRect();
          const itemWidth = itemRect.width;
          totalWidth += itemWidth;

          // Add gap between items (except for the last item)
          if (index < treeviewItems.length - 1) {
            totalWidth += gapSize;
          }
        });

        // Update network graph width to match treeview total width
        const networkGraph = document.querySelector(".network-graph");
        const treeviewWrapper = document.querySelector(".galaxy-treeview-wrapper");

        if (networkGraph) {
          networkGraph.style.width = `${totalWidth + 100}px`;
        }

        if (treeviewWrapper) {
          treeviewWrapper.style.width = `${totalWidth + 100}px`;
        }

        // Calculate positions for each star using actual treeview item positions
        const updatedNodes = [];
        const yPosition = this.taskEditing ? 250 : 100; // Fixed Y position for all nodes (above treeview items)

        treeviewItems.forEach((item, index) => {
          const itemRect = item.getBoundingClientRect();
          const treeviewWrapperRect = treeviewWrapper
            ? treeviewWrapper.getBoundingClientRect()
            : null;

          // Calculate position relative to the treeview wrapper
          let relativeX = 0;
          if (treeviewWrapperRect) {
            relativeX = itemRect.left - treeviewWrapperRect.left + itemRect.width / 2;
          } else {
            // Fallback to sequential positioning
            relativeX = index * 300 + 150;
          }

          // Position nodes in the network's coordinate system
          // Since the network width matches the treeview width, we can use relative positioning
          const canvasX = relativeX;
          const canvasY = yPosition;

          // Update the corresponding network node
          updatedNodes.push({
            id: `star-${index}`,
            label: "", // Do not show star label on the network node
            x: this.$refs.network.network.DOMtoCanvas({ x: canvasX, y: canvasY }).x,
            y: this.$refs.network.network.DOMtoCanvas({ x: canvasX, y: canvasY }).y,
          });
        });

        // Update the network nodes
        this.nodesToDisplay = updatedNodes;

        // Update edges to connect the repositioned nodes
        this.edgesToDisplay = [];
        for (let i = 0; i < updatedNodes.length - 1; i++) {
          this.edgesToDisplay.push({
            from: `star-${i}`,
            to: `star-${i + 1}`,
          });
        }

        // Force network to redraw with new positions
        if (this.$refs.network) {
          this.$refs.network.redraw();

          // Set zoom level to 1 and center the view
          if (this.$refs.network.network) {
            this.$refs.network.network.moveTo({
              // scale: 1,
              scale: this.taskEditing ? 3 : 1,
              animation: false,
            });
          }

          // Set up planets after nodes are positioned correctly
          this.$nextTick(() => {
            this.setupPlanets();
            this.startNodeAnimation();
          });
        }
      });
    },

    // Handle window resize to recalculate positions
    handleResize() {
      // Debounce resize events
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.updateNetworkPositionsFromTreeview();
      }, 250);
    },

    // Set up MutationObserver to watch for treeview content changes
    setupTreeviewObserver() {
      const treeviewWrapper = document.querySelector(".galaxy-treeview-wrapper");
      if (treeviewWrapper) {
        this.treeviewObserver = new MutationObserver((mutations) => {
          // Check if any mutations affect the treeview items
          const hasRelevantChanges = mutations.some((mutation) => {
            return (
              mutation.type === "childList" ||
              (mutation.type === "attributes" && mutation.attributeName === "style")
            );
          });

          if (hasRelevantChanges) {
            // Debounce the update to avoid excessive recalculations
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
              this.updateNetworkPositionsFromTreeview();
            }, 100);
          }
        });

        // Observe changes to child elements and attributes
        this.treeviewObserver.observe(treeviewWrapper, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["style", "class"],
        });
      }
    },

    // Loading message management
    startLoadingMessages() {
      let messages;
      if (this.isSavingToDB) {
        messages = this.savingMessages;
      } else if (this.isGeneratingMissions || this.isRefining) {
        messages = this.loadingMessages;
      } else {
        messages = this.loadingMessages;
      }

      this.currentLoadingMessage = messages[0];
      this.loadingMessageInterval = setInterval(() => {
        const currentIndex = messages.indexOf(this.currentLoadingMessage);
        const nextIndex = (currentIndex + 1) % messages.length;
        this.currentLoadingMessage = messages[nextIndex];
      }, 3000);
    },
    stopLoadingMessages() {
      if (this.loadingMessageInterval) {
        clearInterval(this.loadingMessageInterval);
        this.loadingMessageInterval = null;
      }
      this.currentLoadingMessage = "";
    },

    // Treeview management
    updateExpandedNodes(newValue) {
      this.expandedNodes = newValue;
      // Recalculate network positions when treeview expands/collapses
      this.$nextTick(() => {
        setTimeout(() => {
          this.updateNetworkPositionsFromTreeview();
        }, 200);
      });
    },
    getAllNodeIds(items) {
      const ids = [];
      const collectIds = (nodes) => {
        nodes.forEach((node) => {
          ids.push(node.id);
          if (node.children && node.children.length > 0) {
            collectIds(node.children);
          }
        });
      };
      collectIds(items);
      return ids;
    },

    // Get only star node IDs (top level)
    getStarNodeIds(items) {
      const ids = [];
      items.forEach((node) => {
        if (node.type === "star") {
          ids.push(node.id);
        }
      });
      return ids;
    },

    // Toggle between collapsed (stars only) and expanded (all nodes) states
    togglePlanetsCollapse() {
      if (this.isPlanetsCollapsed) {
        // Expand all - show everything
        this.expandAllPlanets();
      } else {
        // Collapse planets - show only stars
        this.collapsePlanets();
      }
    },

    // Collapse planets - show only stars
    collapsePlanets() {
      this.isPlanetsCollapsed = true;
      this.expandedNodes = this.getStarNodeIds(this.transformedStarDetails);
    },

    // Expand all planets - show everything
    expandAllPlanets() {
      this.isPlanetsCollapsed = false;
      this.expandedNodes = this.getAllNodeIds(this.transformedStarDetails);
    },

    // Helper method to accumulate tokens from multiple API calls
    accumulateTokens(newTokenUsage) {
      if (!newTokenUsage) return this.aiGeneratedGalaxyMap.tokens || {};

      const currentTokens = this.aiGeneratedGalaxyMap.tokens || {};

      // Initialize accumulated tokens structure
      const accumulatedTokens = {
        totalTokens: (currentTokens.totalTokens || 0) + (newTokenUsage.totalTokens || 0),
        totalInputTokens:
          (currentTokens.totalInputTokens || 0) + (newTokenUsage.totalInputTokens || 0),
        totalOutputTokens:
          (currentTokens.totalOutputTokens || 0) + (newTokenUsage.totalOutputTokens || 0),
        combinedEstimatedCost:
          (currentTokens.combinedEstimatedCost || 0) + (newTokenUsage.combinedEstimatedCost || 0),
        modelsUsed: [],
      };

      // Merge models used from both current and new token usage
      const allModels = new Map();

      // Add current models
      if (currentTokens.modelsUsed) {
        currentTokens.modelsUsed.forEach((model) => {
          allModels.set(model.model, {
            model: model.model,
            totalTokens: model.totalTokens || 0,
            estimatedCost: model.estimatedCost || 0,
          });
        });
      }

      // Add new models (accumulate if same model exists)
      if (newTokenUsage.modelsUsed) {
        newTokenUsage.modelsUsed.forEach((model) => {
          const existing = allModels.get(model.model);
          if (existing) {
            existing.totalTokens += model.totalTokens || 0;
            existing.estimatedCost += model.estimatedCost || 0;
          } else {
            allModels.set(model.model, {
              model: model.model,
              totalTokens: model.totalTokens || 0,
              estimatedCost: model.estimatedCost || 0,
            });
          }
        });
      }

      accumulatedTokens.modelsUsed = Array.from(allModels.values());

      return accumulatedTokens;
    },

    // Token usage tracking
    trackTokenUsage(response) {
      try {
        if (response.tokenUsage) {
          // Use the accumulateTokens method for consistent token accumulation
          this.aiGeneratedGalaxyMap.tokens = this.accumulateTokens(response.tokenUsage);
          this.setAiGalaxyEditData(this.aiGeneratedGalaxyMap);
        }
      } catch (error) {
        console.warn("Error tracking token usage:", error);
      }
    },

    // Placeholder for createGalaxy method
    createGalaxy() {
      // TODO: Implement galaxy creation logic
    },
    // Clear store data when component is destroyed
    clearStoredData() {
      this.clearAiGalaxyEditData();
    },

    // Planet animation methods
    networkUpdated() {
      // Network is ready, but wait for proper positioning before setting up planets
    },

    async setupPlanets() {
      // Reset planets
      this.planets = [];

      // Get node positions from the network
      if (!this.$refs.network || !this.$refs.network.network) {
        return;
      }

      // Get the current positions of all nodes
      const nodeIds = this.nodesToDisplay.map((node) => node.id);
      const nodePositionMap = this.$refs.network.network.getPositions(nodeIds);

      // Create planets for each star (node)
      for (const [starId, starPosition] of Object.entries(nodePositionMap)) {
        let star;

        if (this.taskEditing && this.selectedTasksStarData) {
          // In task editing mode, use the selected star data
          star = this.selectedTasksStarData;
        } else {
          // In normal mode, use the full galaxy data
          const starIndex = parseInt(starId.replace("star-", ""));
          star = this.aiGeneratedGalaxyMap.stars[starIndex];
        }

        if (star) {
          let planets = [];

          if (this.taskEditing && this.selectedTasksStarData) {
            // In task editing mode, use the transformed star data structure
            planets = star.children ? star.children.filter((child) => child.type === "planet") : [];
          } else {
            // In normal mode, use the original galaxy data structure
            planets = star.planets || [];
          }

          // Create planets for each planet in this star
          for (let i = 0; i < planets.length; i++) {
            const planet = planets[i];

            this.planets.push(
              new Planet(
                starPosition.x,
                starPosition.y,
                2, // planet size
                this.dark ? "white" : this.$vuetify.theme.themes.light.missionAccent, // planet colour
                6.28 / (10 * (i + 1)), // planet speed
                20 * (i + 1), // planet orbit size
                starId, // topicId (using starId)

                "", // planet name
                i, // planet index
              ),
            );
          }
        }
      }
    },

    beforeDrawing(ctx) {
      // get delta
      const oldTime = this.time;
      this.time = new Date();
      let delta;
      if (oldTime == null) {
        delta = 1;
      } else {
        delta = (this.time.getTime() - oldTime.getTime()) / 1000;
      }

      // update planets orbits
      // Detect whether we're effectively in a single-star view (all planets share one topicId)
      const uniqueTopicIds = Array.from(new Set(this.planets.map((p) => p.topicId)));
      const isSingleStarView = uniqueTopicIds.length === 1;

      for (const planet of this.planets) {
        const hasHighlightedIndex = this.highlightedPlanetIndex != null;
        let isHighlighted = false;
        if (isSingleStarView) {
          // In mission view, topicId may be normalized; match by planet index only
          isHighlighted = hasHighlightedIndex && planet.taskIndex === this.highlightedPlanetIndex;
        } else {
          isHighlighted =
            this.highlightedPlanetTopicId != null &&
            hasHighlightedIndex &&
            planet.topicId === this.highlightedPlanetTopicId &&
            planet.taskIndex === this.highlightedPlanetIndex;
        }

        const defaultStroke = this.dark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)";
        const highlightStroke = this.dark
          ? this.$vuetify.theme.themes.dark.baseAccent
          : this.$vuetify.theme.themes.light.baseAccent;

        const strokeColor = isHighlighted ? highlightStroke : defaultStroke;

        // Keep fill color in sync with highlight state so initial frame shows correctly
        const defaultFill = this.dark ? "grey" : this.$vuetify.theme.themes.light.missionAccent;
        const highlightFill = this.dark
          ? this.$vuetify.theme.themes.dark.baseAccent
          : this.$vuetify.theme.themes.light.baseAccent;
        planet.color = isHighlighted ? highlightFill : defaultFill;

        planet.update(ctx, delta, strokeColor);
      }
    },

    afterDrawing(ctx) {
      // Draw planet labels
      const labelColor = this.dark ? "#ffffff" : this.$vuetify.theme.themes.light.baseAccent;
      for (const planet of this.planets) {
        planet.drawLabel(ctx, labelColor);
      }
    },

    updateFrameTimer() {
      if (this.$refs.network) {
        this.$refs.network.redraw();
      }
    },

    startNodeAnimation() {
      // start interval
      this.updateFrameVar();
    },

    stopNodeAnimation() {
      clearInterval(this.intervalid1);
    },

    updateFrameVar() {
      this.intervalid1 = setInterval(() => {
        this.updateFrameTimer();
      }, 33);
    },

    updatePlanetColors() {
      const newColor = this.dark ? "white" : this.$vuetify.theme.themes.light.missionAccent;
      for (const planet of this.planets) {
        planet.color = newColor;
      }
    },

    clearPlanetHighlight() {
      this.highlightedPlanetTopicId = null;
      this.highlightedPlanetIndex = null;
    },

    setPlanetHighlightByIds(topicId, planetIndex) {
      this.highlightedPlanetTopicId = topicId;
      this.highlightedPlanetIndex = planetIndex;

      const highlightFill = this.dark
        ? this.$vuetify.theme.themes.dark.baseAccent
        : this.$vuetify.theme.themes.light.baseAccent;

      console.log("Looking for planet with topicId:", topicId, "planetIndex:", planetIndex);
      console.log(
        "Available planets:",
        this.planets.map((p) => ({ topicId: p.topicId, taskIndex: p.taskIndex })),
      );

      // Reset all planet colors first
      this.updatePlanetColors();

      // Then apply highlight color to the selected planet
      const target = this.planets.find(
        (p) =>
          p.topicId === this.highlightedPlanetTopicId &&
          p.taskIndex === this.highlightedPlanetIndex,
      );
      if (target) {
        console.log("Found target planet, setting color to:", highlightFill);
        target.color = highlightFill;
        // Force a redraw to show the color change
        this.$nextTick(() => {
          this.updateFrameTimer();
        });
      } else {
        console.log("No target planet found!");
      }
    },

    // Get the star index from the treeview item
    getStarIndex(item) {
      const starItems = this.$el.querySelectorAll(".star-treeview-item");
      for (let i = 0; i < starItems.length; i++) {
        if (starItems[i] === item) {
          return i;
        }
      }
      return 0;
    },

    // Format mission instructions to HTML (following the same pattern as AICreateGalaxyDialog)
    formatMissionInstructionsToHtml(missionInstructions) {
      if (!missionInstructions) return "";

      try {
        // Handle both object and string formats
        let instructions = missionInstructions;
        if (typeof missionInstructions === "string") {
          instructions = JSON.parse(instructions);
        }

        let html = "";

        // Add description
        if (instructions.description && !this.isGeneratingMissions) {
          html += `<p>${instructions.description}</p>`;
        }

        if (instructions.intro) {
          html += `<p class="intro">${instructions.intro}</p>`;
        }

        // Add instructions section (supports unified "steps" or legacy "instructions")
        const stepsArray = instructions.instructions || instructions.steps || [];
        if (stepsArray.length > 0) {
          if (!this.isGeneratingMissions) {
            html += `<h2>Instructions</h2>`;
          }

          // Loop through each step
          stepsArray.forEach((step) => {
            if (step.title) {
              html += `<h3>${step.title}</h3>`;
            }

            // Add tasks, avoiding nested <ul><li> when task content already contains lists
            if (step.tasks && step.tasks.length > 0) {
              let listOpen = false;
              step.tasks.forEach((task) => {
                if (!task || !task.taskContent) return;
                const parsedTaskContent = this.renderMarkdownWithStreaming(task.taskContent);
                const hasOwnList =
                  /<(ul|ol)[\s>]/i.test(parsedTaskContent) || /<li[\s>]/i.test(parsedTaskContent);
                if (hasOwnList) {
                  if (listOpen) {
                    html += `</ul>`;
                    listOpen = false;
                  }
                  html += parsedTaskContent;
                } else {
                  if (!listOpen) {
                    html += `<ul>`;
                    listOpen = true;
                  }
                  html += `<li>${parsedTaskContent}</li>`;
                }
              });
              if (listOpen) {
                html += `</ul>`;
                listOpen = false;
              }
            }

            // Optional checkpoint
            if (step.checkpoint) {
              html += `<p><em>Checkpoint: ${step.checkpoint}</em></p>`;
            }
          });
        }

        if (instructions.outro) {
          html += `<p class="outro">${instructions.outro}</p>`;
        }

        // console.log("🔄 Formatted mission instructions to HTML:", html);
        return html;
      } catch (error) {
        console.error("❌ Error formatting mission instructions to HTML:", error);
        return ""; // Fallback to empty string
      }
    },

    // Transform aiGeneratedGalaxyMap into treeview format
    updateTransformedStarDetails() {
      if (
        !this.aiGeneratedGalaxyMap ||
        !this.aiGeneratedGalaxyMap.stars ||
        !this.aiGeneratedGalaxyMap.stars.length
      ) {
        this.transformedStarDetails = [];
        return;
      }

      this.transformedStarDetails = this.aiGeneratedGalaxyMap.stars.map((star, starIndex) => {
        const starNode = {
          id: `star[${starIndex}]`,
          name: star.title,
          description: star.description,
          type: "star",
          // star nodes are activatable
          children: [],
        };

        if (star.planets && star.planets.length > 0) {
          starNode.children = star.planets.map((planet, planetIndex) => {
            const planetNode = {
              id: `star[${starIndex}].planet[${planetIndex}]`,
              name: planet.title,
              description: planet.description,
              type: "planet",
              children: [],
            };

            // Unified: missionInstructions
            if (planet.missionInstructions) {
              planetNode.children.push({
                id: `star[${starIndex}].planet[${planetIndex}].instructions`,
                name: "Mission Instructions",
                description: planet.missionInstructions,
                type: "instructions",
                disabled: true, // instructions should not be activatable
              });
            }

            // Legacy (commented out but kept for quick revert)
            // if (planet.instructions) {
            //   planetNode.children.push({
            //     id: `star[${starIndex}].planet[${planetIndex}].instructions`,
            //     name: "Mission Instructions",
            //     description: planet.instructions,
            //     type: "instructions",
            //   });
            // }

            // Add existing missions if they exist
            if (planet.missions && planet.missions.length > 0) {
              planetNode.children.push(
                ...planet.missions.map((mission, missionIndex) => ({
                  id: `star[${starIndex}].planet[${planetIndex}].mission[${missionIndex}]`,
                  name: mission.title,
                  description: mission.description,
                  type: "mission",
                  disabled: true, // missions should not be activatable per requirement
                })),
              );
            }
            return planetNode;
          });
        }
        return starNode;
      });

      // Update network positions after treeview data changes
      this.$nextTick(() => {
        setTimeout(() => {
          this.updateNetworkPositionsFromTreeview();
        }, 300);
      });
    },
    updateActiveGalaxyItems(newValue, treeviewIndex) {
      // Clear any existing timeout
      if (this.updateTimeout) {
        clearTimeout(this.updateTimeout);
      }

      // Debounce the update to prevent rapid toggling
      this.updateTimeout = setTimeout(() => {
        // Update the treeview's active state to match what the user selected
        this.$set(this.treeviewActiveItems, treeviewIndex, newValue);

        // Merge new active items with existing ones instead of overwriting
        // Remove any items that belong to the current treeview (to avoid duplicates)
        const currentTreeviewPrefix = `star[${treeviewIndex}]`;
        const filteredExistingItems = this.activeGalaxyItems.filter(
          (item) => !item.startsWith(currentTreeviewPrefix),
        );

        // Add the new active items from this treeview
        this.activeGalaxyItems = [...filteredExistingItems, ...newValue];

        this.updateTimeout = null;
      }, 100);
    },
    async refineGalaxyMap() {
      this.loading = true;
      this.isRefining = true;

      // Start timing
      const startTime = Date.now();
      console.log("🚀 Starting Galaxy refinement process...");

      const refinementSystemPrompt = `

      You are a Galaxy Map refiner assistant. Your task is to update specific parts of an existing Galaxy Map JSON object based on the user's request.

The Galaxy Map is a structured learning roadmap with the hierarchy:
- **Stars** → major milestones
- **Planets** → small, focused wins (15–60 min) within a Star
- **Mission Instructions** → intro, steps (with tasks and checkpoints), outro; include just-in-time micro-teach when new concepts appear.

### Galaxy Map Format (JSON):
{
  "status": "journey_ready",
  "title": "Journey Title",
  "description": "Brief description of the overall journey",
  "stars": [
    {
      "title": "1: Title (Star Name)",
      "description": "Brief description of this star",
      "planets": [
        {
          "title": "1.1: Title (Planet Name)",
          "description": "Brief description of this win",
          "missionInstructions": {
            "intro": "Motivating intro explaining what they will do, why it matters, and how it connects to the journey",
            "steps": [
              {
                "title": "Step 1: Step Name",
                "tasks": [
                  { "taskContent": "Detailed task instruction in markdown (may include short concept teaching if introducing a new idea)" }
                ],
                "checkpoint": "Motivating progress sentence after this step"
              }
            ],
            "outro": "Motivating recap of what was achieved and what's next"
          }
        }
      ]
    }
  ]
}

### Your Responsibilities:
1. Understand the user's request — they may want to change the content, structure, or sequence of Stars, Missions, Mission Instructions, Steps, or Tasks.
2. You will be provided:
   - **galaxy_map**: the full current Galaxy Map object.
   - **items_user_wants_changed**: an array of **zero-indexed paths** to the exact elements in the Galaxy Map that should be modified.
     - Example paths:
       - "star[0]" → stars[0]
       - "star[0].planet[1]" → stars[0].planets[1]
3. Only modify the items at the specified paths. Preserve everything else in the Galaxy Map exactly as-is.
4. Always insert the updates into the correct location in the nested structure.
5. After making changes, maintain correct numbering in titles (Stars are 1-indexed like "1:", Missions are "1.1:").
6. Return the **entire** updated Galaxy Map object, not just the modified parts.

**Planet scope + motivation rules (must enforce)**
   - Each Planet is an **atomic win (15–60 min)**. If a planet is overloaded, **split it into additional planets** (in the same Star) and **renumber that Star's planets** accordingly.
   - Mission Instructions must include:
     - **Intro** (what/why/how it connects),
     - **Steps** with **tasks** (each task is one discrete action),
     - **Checkpoint** after each step,
     - **Outro** (celebrate win + what's next).
   - **Micro-teach**: When a new concept/term/tool appears for the first time in the journey, add a 1–3 sentence explanation *in the task where it's first used*. Keep it practical and just-in-time. If it was taught earlier, only add a brief reminder.

 **Quality constraints**
   - Keep changes **minimal and surgical** unless the user asks for broader restructuring.
   - Ensure every edited Mission remains scope-matched (15–60 min), motivating, and necessary for its Star.
   - If the user's request would cause scope creep, **split missions** rather than bloating instructions.
   - Prefer clear, concise phrasing and remove redundancy.

### 🧾 Input Structure:
{
  "galaxy_map": { ... },
  "items_user_wants_changed": ["star[0]", "star[0].planet[1]"],
  "user_request": "User's instruction for the changes"
}

### Output Requirements:
- A complete Galaxy Map JSON object with only the targeted items changed.
- Preserve the rest of the map exactly.
- Updates must be consistent with the Galaxy Map format above.


`;

      // 1.refine system prompt
      const inputMessages = [{ role: "system", content: refinementSystemPrompt }];

      // 2. galaxy map json - create a copy without history to avoid circular reference
      const galaxyMapForAI = {
        ...this.aiGeneratedGalaxyMap,
        history: undefined, // Remove history for AI processing
      };

      // ----- trying different formarts for the galaxymap object
      const galaxyMapJson = JSON.stringify(galaxyMapForAI);
      // const galaxyMapMarkdown = this.convertGalaxyMapToMarkdown(galaxyMapForAI);

      inputMessages.push({ role: "user", content: "galaxy_map: " + galaxyMapJson });

      // 3. selected items
      const activeItems = [...new Set([...this.activeGalaxyItems, ...this.activeMissionItems])];
      const activeItemsString = activeItems.join("\n");
      if (activeItems.length > 0) {
        inputMessages.push({
          role: "user",
          content: "items_user_wants_changed: " + activeItemsString,
        });
      }

      inputMessages.push({ role: "user", content: "user_request: " + this.galaxyRefineUserInput });

      console.log("refine inputMessages", inputMessages);

      // Call the cloud function for galaxy refinement
      const refineGalaxyWithAiResponse = await refineGalaxyMap(
        galaxyMapForAI,
        activeItems,
        this.galaxyRefineUserInput,
        this.aiGeneratedGalaxyMap.aiResponseId,
      );

      // Calculate and log execution time even on error
      const endTime = Date.now();
      const timeString = this.formatExecutionTime(startTime, endTime);
      console.log(
        `🔍 Galaxy refinement process completed after ${timeString} (${endTime - startTime}ms total)`,
      );

      console.log("🔍 Galaxy refinement response:", refineGalaxyWithAiResponse);

      // Check if clarification is needed
      if (refineGalaxyWithAiResponse.galaxyMap.status === "clarification_needed") {
        console.log("Clarification needed, showing questions UI");

        // Store the clarification questions and response ID for the follow-up call
        this.clarificationQuestions = refineGalaxyWithAiResponse.galaxyMap.questions || [];
        this.clarificationAnswers = new Array(this.clarificationQuestions.length).fill("");
        this.previousRefinementResponseId = refineGalaxyWithAiResponse.responseId;

        // Show the clarification dialog
        this.showClarificationDialog = true;

        // Reset loading state since we're waiting for user input
        this.isRefining = false;
        this.loading = false;

        // Track token usage from this clarification request
        this.trackTokenUsage(refineGalaxyWithAiResponse);

        return; // Exit early, don't proceed with normal refinement flow
      }

      // Preserve existing properties that should not be overwritten
      const existingHistory = this.aiGeneratedGalaxyMap.history || [];
      const existingTokens = this.aiGeneratedGalaxyMap.tokens || {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalTokens: 0,
        modelsUsed: [],
        combinedEstimatedCost: 0,
      };
      const existingAiResponseId = this.aiGeneratedGalaxyMap.aiResponseId;
      const existingOriginResponseId = this.aiGeneratedGalaxyMap.originResponseId;

      // CRITICAL: Preserve both response IDs for tracking AI call history
      // - originResponseId: tracks the very first AI call that created the galaxy map
      // - aiResponseId: tracks the most recent AI call (refinement, regeneration, etc.)
      console.log("🔍 Preserving response IDs:", {
        existingOriginResponseId,
        existingAiResponseId,
        newResponseId: refineGalaxyWithAiResponse.responseId,
      });

      // Merge the new AI response with existing properties instead of overwriting
      this.aiGeneratedGalaxyMap = {
        ...this.aiGeneratedGalaxyMap, // Keep all existing properties (including originResponseId)
        ...refineGalaxyWithAiResponse.galaxyMap, // Override with new AI response data
        aiResponseId: refineGalaxyWithAiResponse.responseId, // Update with new response ID
      };

      // Verify both IDs are preserved
      console.log("✅ After refinement, response IDs:", {
        originResponseId: this.aiGeneratedGalaxyMap.originResponseId,
        aiResponseId: this.aiGeneratedGalaxyMap.aiResponseId,
      });

      // Create a deep copy of the NEW galaxy map data without the history property to avoid circular reference
      const newGalaxyMapCopy = JSON.parse(
        JSON.stringify({
          ...this.aiGeneratedGalaxyMap,
          history: undefined, // Remove history from the copy
        }),
      );

      // Add the NEW state to history (this becomes the current state)
      this.aiGeneratedGalaxyMap.history.push({
        galaxyMapData: newGalaxyMapCopy,
        atThisRefineUserPrompt: this.galaxyRefineUserInput,
      });

      // Track token usage (accumulate with existing tokens)
      this.trackTokenUsage(refineGalaxyWithAiResponse);

      // update store
      this.setAiGalaxyEditData(this.aiGeneratedGalaxyMap);

      // reset prompt input and selected items
      this.galaxyRefineUserInput = "";
      this.activeGalaxyItems = [];
      this.treeviewActiveItems = {};

      this.isRefining = false;
      this.loading = false;
    },
    async generateGalaxyMapAgain() {
      this.loading = true;
      this.isRefining = true;

      this.stopLoadingMessages();
      this.startLoadingMessages();

      // Start timing
      const startTime = Date.now();
      console.log("🚀 Starting Galaxy regeneration process...");

      try {
        // Call the Firebase function to generate galaxy map again
        const result = await generateGalaxyMapAgain(this.aiGeneratedGalaxyMap.originResponseId);

        // Calculate and log execution time
        const endTime = Date.now();
        const timeString = this.formatExecutionTime(startTime, endTime);
        console.log(
          `🔄 Galaxy regeneration process completed after ${timeString} (${endTime - startTime}ms total)`,
        );

        console.log("🔄 Galaxy regeneration response:", result);

        if (result.success) {
          // Preserve existing properties that should not be overwritten
          const existingOriginResponseId = this.aiGeneratedGalaxyMap.originResponseId;
          const existingAiResponseId = this.aiGeneratedGalaxyMap.aiResponseId;

          // CRITICAL: Preserve both response IDs for tracking AI call history
          // - originResponseId: tracks the very first AI call that created the galaxy map
          // - aiResponseId: tracks the most recent AI call (refinement, regeneration, etc.)
          console.log("🔄 Preserving response IDs for regeneration:", {
            existingOriginResponseId,
            existingAiResponseId,
            newResponseId: result.responseId,
          });

          // Merge the new AI response with existing properties instead of overwriting
          this.aiGeneratedGalaxyMap = {
            ...this.aiGeneratedGalaxyMap, // Keep all existing properties (including originResponseId)
            ...result.galaxyMap, // Override with new AI response data
            aiResponseId: result.responseId, // Update with new response ID
          };

          // Verify both IDs are preserved
          console.log("✅ After regeneration, response IDs:", {
            originResponseId: this.aiGeneratedGalaxyMap.originResponseId,
            aiResponseId: this.aiGeneratedGalaxyMap.aiResponseId,
          });

          // Create a deep copy of the NEW galaxy map data without the history property to avoid circular reference
          const newGalaxyMapCopy = JSON.parse(
            JSON.stringify({
              ...this.aiGeneratedGalaxyMap,
              history: undefined, // Remove history from the copy
            }),
          );

          // Add the NEW state to history (this becomes the current state)
          this.aiGeneratedGalaxyMap.history.push({
            galaxyMapData: newGalaxyMapCopy,
            atThisRefineUserPrompt: "generate again",
          });

          // Track token usage (accumulate with existing tokens)
          if (result.tokenUsage) {
            this.trackTokenUsage(result);
          }

          // update store
          this.setAiGalaxyEditData(this.aiGeneratedGalaxyMap);

          // reset prompt input and selected items
          this.galaxyRefineUserInput = "";
          this.activeGalaxyItems = [];
          this.treeviewActiveItems = {};

          this.setSnackbar({
            show: true,
            text: "Galaxy map regenerated successfully!",
            color: "baseAccent",
          });
        } else {
          throw new Error("Failed to regenerate galaxy map");
        }
      } catch (error) {
        // Calculate and log execution time even on error
        const endTime = Date.now();
        const timeString = this.formatExecutionTime(startTime, endTime);
        console.log(
          `❌ Galaxy regeneration failed after ${timeString} (${endTime - startTime}ms total)`,
        );

        console.error("Error regenerating galaxy map:", error);
        this.setSnackbar({
          show: true,
          text: "Error regenerating galaxy map: " + (error.message || "Unknown error"),
          color: "error",
        });
      } finally {
        this.isRefining = false;
        this.loading = false;
      }
    },
    formatExecutionTime(startTime, endTime) {
      const totalTimeMs = endTime - startTime;
      const minutes = Math.floor(totalTimeMs / 60000);
      const seconds = Math.floor((totalTimeMs % 60000) / 1000);
      return `${minutes}m${seconds}s`;
    },
    saveGalaxyToDB() {
      // Unified flow: skip SaveGalaxyDialog and go straight to layout selection
      // this.showSaveGalaxyDialog = true;
      this.showLayoutDialog = true;
    },

    // Layout dialog methods
    cancelLayoutSelection() {
      this.showLayoutDialog = false;
    },

    // Save galaxy dialog methods (unused in unified flow)
    // cancelSaveGalaxyDialog() {
    //   this.showSaveGalaxyDialog = false;
    // },

    // async handleGenerateTasksThenSave() {
    //   console.log("Generate all tasks and then save");
    //   this.showSaveGalaxyDialog = false;
    //   // Set flag to generate missions after layout selection
    //   this.shouldGenerateMissions = true;
    //   // Show layout dialog first to get the layout before generating missions
    //   this.showLayoutDialog = true;
    // },

    async generateMissionsThenSave(selectedLayout) {
      // Calculate total missions
      this.totalMissions = 0;
      for (const star of this.aiGeneratedGalaxyMap.stars) {
        this.totalMissions += star.planets.length;
      }

      // Start mission generation
      this.loading = true;
      this.isGeneratingMissions = true;
      this.completedMissions = 0;
      this.missionGenerationProgress = 0;

      // Start loading messages with mission generation messages
      this.stopLoadingMessages();
      this.startLoadingMessages();

      // Start timing
      const startTime = Date.now();
      console.log("🚀 Starting mission generation process...");

      try {
        // generate instructions for each mission
        for (const [starIndex, star] of this.aiGeneratedGalaxyMap.stars.entries()) {
          for (const [planetIndex, planet] of star.planets.entries()) {
            // Create a copy of the galaxy map without history to avoid circular reference
            const galaxyMapForAI = {
              ...this.aiGeneratedGalaxyMap,
              history: undefined, // Remove history for AI processing
            };

            const missionInstructions = await generateInstructionsForMission(
              planet.description,
              galaxyMapForAI,
              this.aiGeneratedGalaxyMap.originResponseId,
            );
            // console.log("missionInstructions", missionInstructions);
            // console.log(
            //   "missionInstructions.missionInstructions",
            //   missionInstructions.missionInstructions,
            // );

            // Update token usage from mission instructions generation
            if (missionInstructions.tokenUsage) {
              this.aiGeneratedGalaxyMap.tokens = this.accumulateTokens(
                missionInstructions.tokenUsage,
              );
            }

            // Update the planet with mission instructions
            // The new format returns structured data, so we store it as-is
            const instructionsData =
              missionInstructions.missionInstructions || missionInstructions || "";

            // update this.aiGeneratedGalaxyMap with mission instructions
            this.aiGeneratedGalaxyMap.stars[starIndex].planets[planetIndex].instructions =
              instructionsData;

            console.log(
              "does this.aiGeneratedGalaxyMap.stars[" +
                starIndex +
                "].planets[" +
                planetIndex +
                "] have instructions: ",
              this.aiGeneratedGalaxyMap.stars[starIndex].planets[planetIndex],
            );
            // Update progress
            this.completedMissions++;
            this.missionGenerationProgress = (this.completedMissions / this.totalMissions) * 100;

            // Update treeview to show progress
            this.updateTransformedStarDetails();
          }
        }

        // Create a deep copy of the NEW galaxy map data without the history property to avoid circular reference
        const newGalaxyMapCopy = JSON.parse(
          JSON.stringify({
            ...this.aiGeneratedGalaxyMap,
            history: undefined, // Remove history from the copy
          }),
        );

        // Add the NEW state to history (this becomes the current state)
        this.aiGeneratedGalaxyMap.history.push({
          galaxyMapData: newGalaxyMapCopy,
          atThisRefineUserPrompt: "all mission instructions generated",
        });

        // Calculate and log execution time
        const endTime = Date.now();
        const timeString = this.formatExecutionTime(startTime, endTime);
        console.log(
          `✅ Mission generation completed in ${timeString} (${endTime - startTime}ms total)`,
        );

        this.setSnackbar({
          show: true,
          text: `Mission instructions generated successfully!`,
          color: "missionAccent",
        });

        this.isGeneratingMissions = false;

        // Now save to database with the selected layout
        await this.saveGalaxyMapToDatabase(selectedLayout);
      } catch (error) {
        // Calculate and log execution time even on error
        const endTime = Date.now();
        const timeString = this.formatExecutionTime(startTime, endTime);
        console.log(
          `❌ Mission generation failed after ${timeString} (${endTime - startTime}ms total)`,
        );

        console.error("Error generating mission instructions:", error);
        this.setSnackbar({
          show: true,
          text: "Error generating mission instructions: " + getFriendlyErrorMessage(error.code),
          color: "pink",
        });
      } finally {
        // Reset mission generation state
        this.loading = false;
      }
    },

    async saveGalaxyMapToDatabase(selectedLayout) {
      this.isSavingToDB = true;
      this.loading = true; // Show the loading overlay

      // Restart loading messages with saving messages
      this.stopLoadingMessages();
      this.startLoadingMessages();

      // Start timing
      const startTime = Date.now();
      console.log("🚀 Starting Galaxy saving to database process...");

      let result = null;

      // convert mission instructions to html for db
      if (this.aiGeneratedGalaxyMap && this.aiGeneratedGalaxyMap.stars) {
        for (let starIndex = 0; starIndex < this.aiGeneratedGalaxyMap.stars.length; starIndex++) {
          const star = this.aiGeneratedGalaxyMap.stars[starIndex];
          if (star.planets) {
            for (let planetIndex = 0; planetIndex < star.planets.length; planetIndex++) {
              const planet = star.planets[planetIndex];
              // Unified: planet.missionInstructions
              if (planet.missionInstructions) {
                planet.missionInstructions = this.formatMissionInstructionsToHtml(
                  planet.missionInstructions,
                );
              }
              // Legacy fallback (commented out)
              // else if (planet.instructions) {
              //   planet.instructions = this.formatMissionInstructionsToHtml(planet.instructions);
              // }
            }
          }
        }
      }

      try {
        // Call the Firebase function to save the galaxy map with selected layout
        // If editing an existing galaxy, first preserve existing mission instructions and top level fields
        if (this.courseId) {
          await this.saveChangesToExistingGalaxyWithLayout(selectedLayout);
          return;
        }

        result = await saveGalaxyMap(this.aiGeneratedGalaxyMap, selectedLayout);

        // Calculate and log execution time
        const endTime = Date.now();
        const timeString = this.formatExecutionTime(startTime, endTime);
        console.log(
          `✅ Galaxy saving to DB completed in ${timeString} (${endTime - startTime}ms total)`,
        );

        this.setSnackbar({
          show: true,
          text: `Galaxy saved successfully! Map ID: ${result.courseId}`,
          color: "baseAccent",
        });

        // Set the currentCourseId in store before navigating to ensure GalaxyMap has access to it
        this.setCurrentCourseId(result.courseId);

        // Navigate to the created galaxy
        this.$router.push({ name: "GalaxyView", params: { courseId: result.courseId } });
      } catch (error) {
        // Calculate and log execution time even on error
        const endTime = Date.now();
        const timeString = this.formatExecutionTime(startTime, endTime);
        console.log(`❌ Galaxy saving failed after ${timeString} (${endTime - startTime}ms total)`);

        console.error("Error saving galaxy:", error);
        this.setSnackbar({
          show: true,
          text: "Error saving galaxy: " + getFriendlyErrorMessage(error.code),
          color: "pink",
        });
      } finally {
        // Reset saving state
        this.isSavingToDB = false;
        this.loading = false;
      }
    },

    // handleSaveNowGenerateLater() {
    //   this.showSaveGalaxyDialog = false;
    //   // Set flag to save immediately without generating missions
    //   this.shouldGenerateMissions = false;
    //   // Proceed with the original save to DB method
    //   this.showLayoutDialog = true;
    // },

    async confirmLayoutSelection(selectedLayout) {
      this.showLayoutDialog = false;

      // Unified flow
      await this.saveGalaxyMapToDatabase(selectedLayout);
    },

    // Update top-level fields pre-save when GalaxyInfo emits changes without a DB id yet
    applyPreSaveUpdate({ title, description, image }) {
      if (!this.aiGeneratedGalaxyMap) this.aiGeneratedGalaxyMap = {};
      if (typeof title === "string") this.aiGeneratedGalaxyMap.title = title;
      if (typeof description === "string") this.aiGeneratedGalaxyMap.description = description;
      if (image) this.aiGeneratedGalaxyMap.image = image;
      this.setAiGalaxyEditData(this.aiGeneratedGalaxyMap);
    },

    // Existing-galaxy save with chosen layout preserved
    async saveChangesToExistingGalaxyWithLayout(selectedLayout) {
      // Ensure id
      if (!this.courseId && !this.aiGeneratedGalaxyMap.idInDatabase) {
        this.setSnackbar({ show: true, text: "Missing course ID to save.", color: "error" });
        return;
      }
      // Reuse the mission-instructions preservation and top-level merge, but pass through
      // the chosen layout by delegating to saveGalaxyMap (backend uses layout for node positions)
      try {
        this.isSavingToDB = true;
        this.loading = true;
        this.stopLoadingMessages();
        this.startLoadingMessages();

        const courseId = this.aiGeneratedGalaxyMap.idInDatabase || this.courseId;
        this.aiGeneratedGalaxyMap.idInDatabase = courseId;

        // Merge DB mission instructions to avoid loss
        if (courseId) {
          try {
            const dbMap = await getGalaxyMapObjectFromCourse(courseId);
            if (dbMap && dbMap.stars && this.aiGeneratedGalaxyMap?.stars) {
              for (let si = 0; si < this.aiGeneratedGalaxyMap.stars.length; si++) {
                const star = this.aiGeneratedGalaxyMap.stars[si];
                const dbStar = dbMap.stars[si];
                if (!star?.planets || !dbStar?.planets) continue;
                for (let pi = 0; pi < star.planets.length; pi++) {
                  const planet = star.planets[pi];
                  const dbPlanet = dbStar.planets[pi];
                  const hasLegacyInstructions = planet && planet.instructions;
                  if (
                    planet &&
                    !planet.missionInstructions &&
                    !hasLegacyInstructions &&
                    dbPlanet &&
                    typeof dbPlanet.description === "string" &&
                    dbPlanet.description.trim()
                  ) {
                    planet.missionInstructions = dbPlanet.description;
                  }
                }
              }
            }
          } catch (_) {}
        }

        // Convert structured mission instructions only
        if (this.aiGeneratedGalaxyMap && this.aiGeneratedGalaxyMap.stars) {
          for (let starIndex = 0; starIndex < this.aiGeneratedGalaxyMap.stars.length; starIndex++) {
            const star = this.aiGeneratedGalaxyMap.stars[starIndex];
            if (star.planets) {
              for (let planetIndex = 0; planetIndex < star.planets.length; planetIndex++) {
                const planet = star.planets[planetIndex];
                if (planet && planet.missionInstructions) {
                  const mi = planet.missionInstructions;
                  const shouldConvert =
                    typeof mi === "object" ||
                    (typeof mi === "string" && this.isStructuredMissionInstructions(mi));
                  if (shouldConvert) {
                    planet.missionInstructions = this.formatMissionInstructionsToHtml(mi);
                  }
                }
              }
            }
          }
        }

        const payloadGalaxyMap = { ...this.aiGeneratedGalaxyMap, idInDatabase: courseId };
        if (this.courseId && this.boundCourse) {
          payloadGalaxyMap.title = this.boundCourse.title ?? payloadGalaxyMap.title;
          payloadGalaxyMap.description =
            this.boundCourse.description ?? payloadGalaxyMap.description;
          if (this.boundCourse.image) {
            payloadGalaxyMap.image = { ...this.boundCourse.image };
          }
        }

        await saveGalaxyMap(payloadGalaxyMap, selectedLayout);

        this.originalGalaxyMapSnapshot = this.getSanitizedGalaxyMap(this.aiGeneratedGalaxyMap);
        this.setSnackbar({ show: true, text: "Galaxy changes saved.", color: "baseAccent" });
        this.$router.push({ name: "GalaxyView", params: { courseId: courseId } });
      } catch (error) {
        console.error("Error saving galaxy changes (layout)", error);
        this.setSnackbar({
          show: true,
          text: "Error saving changes: " + (error.message || "Unknown error"),
          color: "error",
        });
      } finally {
        this.isSavingToDB = false;
        this.loading = false;
      }
    },

    // Edit an item
    editItem(item) {
      console.log("edit", item);
      this.editingItem = item;

      // Extract the title without numbering for easier editing
      let titleWithoutNumbering = item.name;
      if (item.type === "star") {
        titleWithoutNumbering = item.name.replace(/^0?\d+:\s*/, "");
      } else if (item.type === "planet") {
        titleWithoutNumbering = item.name.replace(/^0?\d+\.\d+:\s*/, "");
      } else if (item.type === "mission") {
        titleWithoutNumbering = item.name.replace(/^0?\d+\.\d+\.\d+:\s*/, "");
      }

      this.editingValue = titleWithoutNumbering;
      console.log("editingItem", this.editingItem);

      // Focus the input field after it's rendered
      this.$nextTick(() => {
        if (this.$refs.editInput && this.$refs.editInput[0]) {
          this.$refs.editInput[0].focus();
          // Select all text for easy replacement
          this.$refs.editInput[0].$el.querySelector("input").select();
        }
      });
    },

    // Update description with AI based on new title
    async updateDescriptionWithAI(item) {
      if (!this.editingValue.trim()) {
        this.setSnackbar({
          show: true,
          text: "Please enter a title",
          color: "error",
        });
        return;
      }

      try {
        // Add item to the set of items currently generating descriptions
        this.itemsGeneratingDescription.add(item.id);

        // Generate new description using AI
        const newDescription = await this.generateDescriptionWithAI(item, this.editingValue);

        // Update the description in the original data structure
        this.updateDescriptionInOriginalData(item, newDescription);

        // Update the store
        this.setAiGalaxyEditData(this.aiGeneratedGalaxyMap);

        this.setSnackbar({
          show: true,
          text: "Description updated successfully with AI!",
          color: "baseAccent",
        });
      } catch (error) {
        console.error("Error updating description with AI:", error);
        this.setSnackbar({
          show: true,
          text: "Error updating description: " + (error.message || "Unknown error"),
          color: "error",
        });
      } finally {
        // Remove item from the set of items currently generating descriptions
        this.itemsGeneratingDescription.delete(item.id);
      }
    },

    // Placeholder method for AI description generation
    async generateDescriptionWithAI(item, newTitle) {
      this.descriptionGenerating = true;

      console.log("generateDescriptionWithAI", item, newTitle);

      // convert galaxymap to markdown for ai prompt
      //const galaxyMapAsMarkdown = this.convertGalaxyMapToMarkdown(this.aiGeneratedGalaxyMap);

      const descriptionSystemPrompt = `
      You are a helpful assistant that generates descriptions for individual learning step items within learning roadmap called a Galaxy Map.
      You are given the entire learning journey as a **galaxy-map-object** with a title a description and an array of Stars (aka Topics) with nested Planets (aka Missions).
      This is to give you context of the wider objective for which them item you are generating a description for should contribute towards.
      You are also given the **item-id** that helps to indentify the context in which the item sits in relation to the wider galaxy map, and the learning steps that came before and come after it.
      You are also given the **item-title** that is the title for the description and the best indicator as to what the description should be about, given the wider galaxy map context.
      The Description should be action focused and only one sentence long.
      Your response will be used to update the description of the item, so please provide only the description text without any explanations or discussions.
      `;

      try {
        const getDescriptionResponse = await this.$openai.responses.create({
          model: "gpt-4o-mini",
          previous_response_id: this.aiGeneratedGalaxyMap.aiResponseId,
          input: [
            { role: "system", content: descriptionSystemPrompt },
            {
              role: "user",
              content: "galaxy-map-object:" + JSON.stringify(this.aiGeneratedGalaxyMap),
            },
            { role: "user", content: "item-id:" + item.id },
            { role: "user", content: "item-title:" + newTitle },
          ],
        });

        console.log("getDescriptionResponse", getDescriptionResponse);
        console.log("getDescriptionResponse.output_text", getDescriptionResponse.output_text);

        // Track token usage
        this.updateTokensFromUsage(getDescriptionResponse.usage);
        console.log("updated token usage", this.aiGeneratedGalaxyMap.tokens);

        this.descriptionGenerating = false;
        return getDescriptionResponse.output_text;
      } catch (error) {
        console.error("Error generating description with AI:", error);
        this.descriptionGenerating = false;
        throw error;
      }
    },

    // Update description in the original data structure
    updateDescriptionInOriginalData(item, newDescription) {
      // Parse the item ID to find and update the original data
      const idMatch = item.id.match(/^star\[(\d+)\]\.planet\[(\d+)\]\.mission\[(\d+)\]$/);
      if (idMatch) {
        // Mission
        const [_, starIndex, planetIndex, missionIndex] = idMatch;
        this.aiGeneratedGalaxyMap.stars[starIndex].planets[planetIndex].missions[
          missionIndex
        ].description = newDescription;
      } else {
        const planetMatch = item.id.match(/^star\[(\d+)\]\.planet\[(\d+)\]$/);
        if (planetMatch) {
          // Planet
          const [_, starIndex, planetIndex] = planetMatch;
          this.aiGeneratedGalaxyMap.stars[starIndex].planets[planetIndex].description =
            newDescription;
        } else {
          const starMatch = item.id.match(/^star\[(\d+)\]$/);
          if (starMatch) {
            // Star
            const [_, starIndex] = starMatch;
            this.aiGeneratedGalaxyMap.stars[starIndex].description = newDescription;
          }
        }
      }
    },
    saveEdit() {
      if (this.editingItem && this.editingValue.trim()) {
        // Check if the edited value has numbering, if not add it automatically
        let finalValue = this.editingValue.trim();

        // Determine the correct numbering based on item type and position
        if (this.editingItem.type === "star") {
          const starMatch = this.editingItem.id.match(/^star\[(\d+)\]$/);
          if (starMatch) {
            const starIndex = parseInt(starMatch[1]);
            const starNumber = starIndex + 1;

            // Check if the title already has numbering
            if (!finalValue.match(/^0?\d+:\s*/)) {
              finalValue = `${starNumber}: ${finalValue}`;
            }
          }
        } else if (this.editingItem.type === "planet") {
          const planetMatch = this.editingItem.id.match(/^star\[(\d+)\]\.planet\[(\d+)\]$/);
          if (planetMatch) {
            const starIndex = parseInt(planetMatch[1]);
            const planetIndex = parseInt(planetMatch[2]);
            const starNumber = starIndex + 1;
            const planetNumber = planetIndex + 1;

            // Check if the title already has numbering
            if (!finalValue.match(/^0?\d+\.\d+:\s*/)) {
              finalValue = `${starNumber}.${planetNumber}: ${finalValue}`;
            }
          }
        } else if (this.editingItem.type === "mission") {
          const missionMatch = this.editingItem.id.match(
            /^star\[(\d+)\]\.planet\[(\d+)\]\.mission\[(\d+)\]$/,
          );
          if (missionMatch) {
            const starIndex = parseInt(missionMatch[1]);
            const planetIndex = parseInt(missionMatch[2]);
            const missionIndex = parseInt(missionMatch[3]);
            const starNumber = starIndex + 1;
            const planetNumber = planetIndex + 1;
            const missionNumber = missionIndex + 1;

            // Check if the title already has numbering
            if (!finalValue.match(/^0?\d+\.\d+\.\d+:\s*/)) {
              finalValue = `${starNumber}.${planetNumber}.${missionNumber}: ${finalValue}`;
            }
          }
        }

        // Update the item name with the final value (with numbering if needed)
        this.editingItem.name = finalValue;

        // Update the original data structure
        this.updateOriginalData(this.editingItem);

        // Only generate description if the user has entered a meaningful title (not placeholder)
        const isPlaceholderTitle =
          finalValue.match(/^\d+:\s*New Star$/) ||
          finalValue.match(/^\d+\.\d+:\s*New Planet$/) ||
          finalValue.match(/^\d+\.\d+\.\d+:\s*New Mission$/);
        if (!isPlaceholderTitle) {
          this.autoGenerateDescription(this.editingItem, finalValue);
        }

        // Refresh the transformed star details to reflect the changes
        this.updateTransformedStarDetails();

        // Exit editing mode
        this.cancelEdit();
      }
    },
    cancelEdit() {
      this.editingItem = null;
      this.editingValue = "";
    },
    updateOriginalData(editedItem) {
      // Parse the item ID to find and update the original data
      const idMatch = editedItem.id.match(/^star\[(\d+)\]\.planet\[(\d+)\]\.mission\[(\d+)\]$/);
      if (idMatch) {
        // Mission
        const [_, starIndex, planetIndex, missionIndex] = idMatch;
        this.aiGeneratedGalaxyMap.stars[starIndex].planets[planetIndex].missions[
          missionIndex
        ].title = editedItem.name;
      } else {
        const planetMatch = editedItem.id.match(/^star\[(\d+)\]\.planet\[(\d+)\]$/);
        if (planetMatch) {
          // Planet
          const [_, starIndex, planetIndex] = planetMatch;
          this.aiGeneratedGalaxyMap.stars[starIndex].planets[planetIndex].title = editedItem.name;
        } else {
          const starMatch = editedItem.id.match(/^star\[(\d+)\]$/);
          if (starMatch) {
            // Star
            const [_, starIndex] = starMatch;
            this.aiGeneratedGalaxyMap.stars[starIndex].title = editedItem.name;
          }
        }
      }

      // Update the store
      this.setAiGalaxyEditData(this.aiGeneratedGalaxyMap);
    },

    // Helper method to find an item by ID in the transformed star details
    findItemById(itemId) {
      const findInItems = (items) => {
        for (const item of items) {
          if (item.id === itemId) {
            return item;
          }
          if (item.children && item.children.length > 0) {
            const found = findInItems(item.children);
            if (found) return found;
          }
        }
        return null;
      };

      return findInItems(this.transformedStarDetails);
    },

    // Get placeholder text for edit input based on item type
    getEditPlaceholder(item) {
      if (item.type === "star") {
        const starMatch = item.id.match(/^star\[(\d+)\]$/);
        if (starMatch) {
          const starNumber = parseInt(starMatch[1]) + 1;
          return `e.g., ${starNumber}: Your New Star Title`;
        }
      } else if (item.type === "planet") {
        const planetMatch = item.id.match(/^star\[(\d+)\]\.planet\[(\d+)\]$/);
        if (planetMatch) {
          const starNumber = parseInt(planetMatch[1]) + 1;
          const planetNumber = parseInt(planetMatch[2]) + 1;
          return `e.g., ${starNumber}.${planetNumber}: Your New Planet Title`;
        }
      } else if (item.type === "mission") {
        const missionMatch = item.id.match(/^star\[(\d+)\]\.planet\[(\d+)\]\.mission\[(\d+)\]$/);
        if (missionMatch) {
          const starNumber = parseInt(missionMatch[1]) + 1;
          const planetNumber = parseInt(missionMatch[2]) + 1;
          const missionNumber = parseInt(missionMatch[3]) + 1;
          return `e.g., ${starNumber}.${planetNumber}.${missionNumber}: Your New Mission Title`;
        }
      }
      return "Enter title";
    },

    // Check if a description is being generated for a specific item
    isGeneratingDescriptionForItem(item) {
      return this.itemsGeneratingDescription.has(item.id);
    },

    // Automatically generate description for an item
    async autoGenerateDescription(item, title) {
      try {
        console.log(`Auto-generating description for ${item.type}: ${title}`);

        // Add item to the set of items currently generating descriptions
        this.itemsGeneratingDescription.add(item.id);

        // Generate description using AI
        const newDescription = await this.generateDescriptionWithAI(item, title);

        // Update the description in the original data structure
        this.updateDescriptionInOriginalData(item, newDescription);

        // Update the store
        this.setAiGalaxyEditData(this.aiGeneratedGalaxyMap);

        console.log(`Successfully generated description for ${item.type}: ${title}`);
      } catch (error) {
        console.error(`Error auto-generating description for ${item.type}: ${title}`, error);
        // Don't show error to user for auto-generation, just log it
      } finally {
        // Remove item from the set of items currently generating descriptions
        this.itemsGeneratingDescription.delete(item.id);
      }
    },

    // Add new item to a star
    addPlanetToStar(starIndex) {
      console.log(`Adding new planet to Star ${starIndex + 1}`);

      // Add new planet to the star
      this.aiGeneratedGalaxyMap.stars[starIndex].planets.push({
        title: "New Planet", // We'll set the proper numbering after adding
        description: "New Planet Description",
        missions: [],
      });

      // Renumber planets in this star to ensure proper numbering
      this.renumberPlanetsInStar(starIndex);

      // Get the index of the newly added planet
      const newPlanetIndex = this.aiGeneratedGalaxyMap.stars[starIndex].planets.length - 1;

      // Update the transformed star details to reflect the new planet
      this.updateTransformedStarDetails();

      // Set the new planet to editing mode
      this.$nextTick(() => {
        const newPlanetId = `star[${starIndex}].planet[${newPlanetIndex}]`;
        const newPlanetItem = this.findItemById(newPlanetId);

        if (newPlanetItem) {
          this.editItem(newPlanetItem);
        }
      });

      // Update the store
      this.setAiGalaxyEditData(this.aiGeneratedGalaxyMap);
    },

    // Add new star
    addStar(index) {
      console.log(`Adding new star after index ${index}`);

      // Add new star after the current star (index + 1)
      const newStarIndex = index + 1;
      this.aiGeneratedGalaxyMap.stars.splice(newStarIndex, 0, {
        title: "New Star", // We'll set the proper numbering after adding
        description: "New Star Description",
        planets: [],
      });

      // Renumber all stars and planets
      this.renumberStarsAndPlanets();

      // Update the transformed star details to reflect the new star
      this.updateTransformedStarDetails();

      // Set the new star to editing mode
      this.$nextTick(() => {
        const newStarId = `star[${newStarIndex}]`;
        const newStarItem = this.findItemById(newStarId);

        if (newStarItem) {
          this.editItem(newStarItem);
        }
      });

      // Update the store
      this.setAiGalaxyEditData(this.aiGeneratedGalaxyMap);
    },

    // Delete an item (stars or planets)
    deleteItem(item) {
      console.log("delete", item);

      if (item.type === "star") {
        // Parse the star ID to get star index
        const starMatch = item.id.match(/^star\[(\d+)\]$/);
        if (starMatch) {
          const [_, starIndex] = starMatch;

          // Remove the star from the original data structure
          this.aiGeneratedGalaxyMap.stars.splice(starIndex, 1);

          // Renumber all stars and planets
          this.renumberStarsAndPlanets();

          // Clean up activeGalaxyItems and treeviewActiveItems
          this.activeGalaxyItems = this.activeGalaxyItems.filter((id) => {
            // Remove any items that reference this star or its children
            return !id.startsWith(`star[${starIndex}]`);
          });
          Object.keys(this.treeviewActiveItems).forEach((key) => {
            if (parseInt(key) === parseInt(starIndex)) {
              this.$delete(this.treeviewActiveItems, key);
            } else {
              this.treeviewActiveItems[key] = this.treeviewActiveItems[key].filter(
                (id) => !id.startsWith(`star[${starIndex}]`),
              );
            }
          });

          // Update the transformed star details to reflect the deletion
          this.updateTransformedStarDetails();

          // Update the store
          this.setAiGalaxyEditData(this.aiGeneratedGalaxyMap);

          console.log(`Deleted star ${starIndex}`);
        }
      } else if (item.type === "planet") {
        // Parse the planet ID to get star and planet indices
        const planetMatch = item.id.match(/^star\[(\d+)\]\.planet\[(\d+)\]$/);
        if (planetMatch) {
          const [_, starIndex, planetIndex] = planetMatch;

          // Remove the planet from the original data structure
          this.aiGeneratedGalaxyMap.stars[starIndex].planets.splice(planetIndex, 1);

          // Renumber planets in this star
          this.renumberPlanetsInStar(starIndex);

          // Clean up activeGalaxyItems and treeviewActiveItems
          this.activeGalaxyItems = this.activeGalaxyItems.filter((id) => {
            // Remove any items that reference this planet or its children
            return !(id.startsWith(`star[${starIndex}].planet[${planetIndex}]`) || id === item.id);
          });
          if (this.treeviewActiveItems[starIndex]) {
            this.treeviewActiveItems[starIndex] = this.treeviewActiveItems[starIndex].filter(
              (id) => {
                return !(
                  id.startsWith(`star[${starIndex}].planet[${planetIndex}]`) || id === item.id
                );
              },
            );
          }

          // Update the transformed star details to reflect the deletion
          this.updateTransformedStarDetails();

          // Update the store
          this.setAiGalaxyEditData(this.aiGeneratedGalaxyMap);

          console.log(`Deleted planet ${planetIndex} from star ${starIndex}`);
        }
      }
    },

    // Renumber all stars and planets after adding/deleting stars
    renumberStarsAndPlanets() {
      console.log(
        `Renumbering all stars and planets, found ${this.aiGeneratedGalaxyMap.stars.length} stars`,
      );
      this.aiGeneratedGalaxyMap.stars.forEach((star, starIndex) => {
        // Renumber star title
        const starNumber = starIndex + 1;
        const oldTitle = star.title;

        // Extract the title part after the numbering (handle various formats)
        // This regex matches: "1:", "01:", "1: ", "01: ", etc.
        const titleMatch = star.title.match(/^0?\d+:\s*(.+)$/);
        if (titleMatch) {
          star.title = `${starNumber}: ${titleMatch[1]}`;
        } else {
          // Fallback: remove any existing numbering pattern and add new numbering
          const titleWithoutNumbering = star.title.replace(/^0?\d+:\s*/, "").trim();
          star.title = `${starNumber}: ${titleWithoutNumbering}`;
        }

        console.log(`Star ${starIndex + 1}: "${oldTitle}" -> "${star.title}"`);

        // Renumber planets in this star
        this.renumberPlanetsInStar(starIndex);
      });
    },

    // Renumber planets in a specific star
    renumberPlanetsInStar(starIndex) {
      starIndex = parseInt(starIndex, 10); // Ensure starIndex is a number
      console.log(`Renumbering planets in star ${starIndex + 1}`);
      const star = this.aiGeneratedGalaxyMap.stars[starIndex];
      if (star && star.planets) {
        star.planets.forEach((planet, planetIndex) => {
          planetIndex = parseInt(planetIndex, 10); // Ensure planetIndex is a number
          // Always generate numbering from the true index
          const starNumber = starIndex + 1;
          const planetNumber = planetIndex + 1;

          console.log("starNumber", starNumber);
          console.log("planetNumber", planetNumber);

          // Remove any previous numbering prefix (if present)
          let titleBody = planet.title;
          const colonIdx = titleBody.indexOf(":");
          if (colonIdx !== -1) {
            titleBody = titleBody.slice(colonIdx + 1).trim();
          }
          planet.title = `${starNumber}.${planetNumber}: ${titleBody}`;

          // Renumber missions in this planet
          if (planet.missions) {
            planet.missions.forEach((mission, missionIndex) => {
              missionIndex = parseInt(missionIndex, 10); // Ensure missionIndex is a number
              const missionNumber = missionIndex + 1;
              // Remove any previous numbering prefix (if present)
              let missionTitleBody = mission.title;
              const missionColonIdx = missionTitleBody.indexOf(":");
              if (missionColonIdx !== -1) {
                missionTitleBody = missionTitleBody.slice(missionColonIdx + 1).trim();
              }
              mission.title = `${starNumber}.${planetNumber}.${missionNumber}: ${missionTitleBody}`;
            });
          }
        });
      }
    },
    /**
     * Accumulate token usage from an AI response usage object into aiGeneratedGalaxyMap.tokens
     * @param {Object} usage - The usage object from the AI response (input_tokens, output_tokens, total_tokens)
     */
    updateTokensFromUsage(usage) {
      if (!usage) return;

      // Convert old format to new format for consistency
      const newTokenUsage = {
        totalInputTokens: usage.input_tokens || 0,
        totalOutputTokens: usage.output_tokens || 0,
        totalTokens: usage.total_tokens || 0,
        combinedEstimatedCost: 0, // Not available in old format
        modelsUsed: [], // Not available in old format
      };

      // Use the accumulateTokens method for consistent token accumulation
      this.aiGeneratedGalaxyMap.tokens = this.accumulateTokens(newTokenUsage);
    },

    /**
     * Restore galaxy map data from a historical checkpoint
     * @param {Object} checkpoint - The checkpoint object containing galaxyMapData and atThisRefineUserPrompt
     * @param {number} index - The index of the checkpoint in the history array
     */
    restoreHistory(checkpoint, index) {
      if (!checkpoint || !checkpoint.galaxyMapData) {
        console.warn("Invalid checkpoint data for restoration");
        this.setSnackbar({
          show: true,
          text: "Invalid checkpoint data for restoration",
          color: "error",
        });
        return;
      }

      try {
        console.log("🔄 Restoring galaxy map from checkpoint:", checkpoint);

        // Create a deep copy of the checkpoint data to avoid reference issues
        const restoredGalaxyMap = JSON.parse(JSON.stringify(checkpoint.galaxyMapData));

        // Preserve the current history and tokens
        const currentHistory = this.aiGeneratedGalaxyMap.history;
        const currentTokens = this.aiGeneratedGalaxyMap.tokens;

        // Update the galaxy map with the restored data
        this.aiGeneratedGalaxyMap = {
          ...restoredGalaxyMap,
          history: currentHistory, // Preserve the full history
          tokens: currentTokens, // Preserve token usage
        };

        // Clear any active selections and editing state
        this.activeGalaxyItems = [];
        this.treeviewActiveItems = {};
        this.editingItem = null;
        this.editingValue = "";
        this.galaxyRefineUserInput = "";

        // Update the store with the restored data
        this.setAiGalaxyEditData(this.aiGeneratedGalaxyMap);

        // Show success message
        this.setSnackbar({
          show: true,
          text: `Galaxy map restored to Checkpoint ${index}`,
          color: "baseAccent",
        });

        console.log("✅ Galaxy map restored successfully");
      } catch (error) {
        console.error("❌ Error restoring galaxy map from checkpoint:", error);
        this.setSnackbar({
          show: true,
          text: "Error restoring galaxy map: " + (error.message || "Unknown error"),
          color: "error",
        });
      }
    },
    minimised(minimised) {
      console.log("minimised", minimised);
      this.isGalaxyInfoMinimized = minimised;
    },
    handleMobilePanelClose() {
      // Handle mobile panel close event
      // For now, we can just log it or implement any specific behavior needed
      console.log("Mobile panel closed");
    },
    handleMissionPanelClose() {
      this.missionOverviewEditShow = false;
      this.taskEditing = false;
      this.activeMissionItems = [];
      this.activeMissionPath = null;
      this.taskEditingStarIndex = null;
      this.taskEditingPlanetIndex = null;
    },
    handleMissionEditCanceled() {
      // MissionOverviewEdit collapses itself; we keep the chip and context intact
    },
    missionEditingStateChanged(isEditing) {
      // Reserved for future layout tweaks when mission edit panel expands/collapses
      void isEditing;
    },
    handleMissionUpdate({ missionPath, planet }) {
      if (!missionPath || !planet) return;

      const { starIndex, planetIndex } = this.parseGalaxyPath(missionPath);
      if (starIndex == null || planetIndex == null) return;

      const stars = this.aiGeneratedGalaxyMap?.stars;
      if (!stars || !stars[starIndex] || !Array.isArray(stars[starIndex].planets)) return;

      const existingPlanet = stars[starIndex].planets[planetIndex] || {};
      const updatedPlanet = {
        ...existingPlanet,
        title: planet.title,
        description: planet.description,
        missionInstructions: {
          intro: planet.missionInstructions?.intro || "",
          outro: planet.missionInstructions?.outro || "",
          steps: (planet.missionInstructions?.steps || []).map((step) => ({
            title: step.title || "",
            checkpoint: step.checkpoint || "",
            tasks: (step.tasks || []).map((task) => ({
              taskContent: task.taskContent || "",
            })),
          })),
        },
      };

      this.$set(this.aiGeneratedGalaxyMap.stars[starIndex].planets, planetIndex, updatedPlanet);

      // Keep the store copy in sync so other consumers reflect the update immediately
      this.setAiGalaxyEditData(this.aiGeneratedGalaxyMap);

      // Refresh the treeview data so the updated mission content is visible
      this.updateTransformedStarDetails();
      this.$nextTick(() => {
        this.restoreTaskEditingView();
      });

      this.setSnackbar({
        show: true,
        text: "Mission updated",
        color: "baseAccent",
      });
    },
    restoreTaskEditingView() {
      if (!this.taskEditing) return;
      if (this.taskEditingStarIndex == null) return;

      const starNode = this.transformedStarDetails[this.taskEditingStarIndex];
      if (!starNode) return;

      this.selectedTasksStarData = starNode;
      this.transformedStarDetails = [starNode];

      const missionPath = this.activeMissionPath;
      if (!missionPath) return;

      const planetNode = starNode.children?.find(
        (child) => this.normalizeToPlanetId(child.id) === missionPath,
      );
      const planetId = planetNode
        ? this.normalizeToPlanetId(planetNode.id) || planetNode.id
        : missionPath;

      this.uiActiveItemId = planetId || null;
      this.treeviewActiveItems = {
        0: planetId ? [planetId] : [],
      };

      if (planetId) {
        this.$nextTick(() => {
          this.highlightPlanetAndOrbitRing(planetId);
        });
      }
    },
    ViewMissionPanel(item, starIndex) {
      console.log("ViewMissionPanel for item: ", item, "starIndex: ", starIndex);

      // Set task editing state
      this.missionOverviewEditShow = true;
      this.taskEditing = true;
      this.activeTaskItem = item;
      this.uiActiveItemId = item.id; // Set UI active item for visual highlighting

      // minimise galaxy info (only on desktop)
      if (!this.isGalaxyInfoMinimized && !this.isMobile && this.$refs.galaxyInfo) {
        this.$refs.galaxyInfo.toggleMinimize();
      }

      // Get the width of the starIndex treeview before filtering
      const treeviewWidth = this.getTreeviewWidth(starIndex);
      console.log(`Treeview width for starIndex ${starIndex}:`, treeviewWidth);

      // Set the selected star data for task editing
      this.selectedTasksStarData = this.transformedStarDetails[starIndex];

      // Update the display data to show only the selected star
      this.updateDisplayDataForTaskEditing(treeviewWidth);

      // Set the clicked planet as the initial active planet in task editing mode
      const planetId = this.normalizeToPlanetId(item.id) || item.id;
      this.uiActiveItemId = planetId;
      const { starIndex: parsedStarIndex, planetIndex: parsedPlanetIndex } =
        this.parseGalaxyPath(planetId);
      this.taskEditingStarIndex =
        parsedStarIndex != null
          ? parsedStarIndex
          : typeof starIndex === "number"
            ? starIndex
            : null;
      this.taskEditingPlanetIndex = parsedPlanetIndex != null ? parsedPlanetIndex : null;
      this.activeMissionPath = planetId;
      this.addActiveMissionItem(planetId);

      // Update treeview active items to show the selected planet
      this.treeviewActiveItems = {
        0: [planetId],
      };

      // Highlight the planet after all data updates are complete
      this.$nextTick(() => {
        console.log("making active item.id: ", item.id);
        this.highlightPlanetAndOrbitRing(planetId);
      });
    },

    updateDisplayDataForTaskEditing(treeviewWidth) {
      if (this.taskEditing && this.selectedTasksStarData) {
        // Update transformedStarDetails to show only the selected star
        this.transformedStarDetails = [this.selectedTasksStarData];

        // Update treeview active items to only show the selected star
        this.treeviewActiveItems = {
          0: this.treeviewActiveItems[this.getOriginalStarIndex()] || [],
        };

        // Resize galaxy-preview-container to the treeview width
        this.resizeContainer(treeviewWidth);
      }
    },

    getTreeviewWidth(starIndex) {
      // Get the treeview item element for the given starIndex
      const treeviewItems = document.querySelectorAll(".star-treeview-item");
      if (treeviewItems[starIndex]) {
        return treeviewItems[starIndex].offsetWidth;
      }
      return 300; // Default width if element not found
    },

    resizeContainer(treeviewWidth) {
      const galaxyPreviewContainer = document.querySelector(".galaxy-preview-container");
      if (galaxyPreviewContainer) {
        // Add some padding to the width for better visual appearance
        const newWidth = treeviewWidth + 40; // 20px padding on each side
        galaxyPreviewContainer.style.width = `${newWidth}px`;
        galaxyPreviewContainer.style.alignItems = "center";
        galaxyPreviewContainer.style.overflow = "hidden";
        console.log(`Resized galaxy-preview-container to width: ${newWidth}px`);
      }
    },

    getOriginalStarIndex() {
      if (!this.selectedTasksStarData) return 0;

      // Find the original star index in the full data
      return this.aiGeneratedGalaxyMap.stars.findIndex(
        (star) => star.title === this.selectedTasksStarData.name,
      );
    },

    updateNetworkDataForSelectedStar() {
      if (!this.selectedTasksStarData) return;

      // Update nodes and edges to show only the selected star
      this.$nextTick(() => {
        // Force a re-render of the network with the new container dimensions
        this.updateNetworkPositionsFromTreeview();

        // Additional check to ensure network is properly positioned
        setTimeout(() => {
          this.ensureNetworkPositioning();
        }, 200);
      });
    },

    ensureNetworkPositioning() {
      // Double-check that the network is positioned correctly above the treeview
      if (this.$refs.network && this.$refs.network.network) {
        const networkElement = document.querySelector(".network-graph");
        const treeviewWrapper = document.querySelector(".galaxy-treeview-wrapper");

        if (networkElement && treeviewWrapper) {
          console.log("Network positioning check:", {
            networkWidth: networkElement.offsetWidth,
            treeviewWidth: treeviewWrapper.offsetWidth,
            containerWidth: document.querySelector(".galaxy-preview-container")?.offsetWidth,
          });
        }
      }
    },

    restoreFullData() {
      // Restore the full transformed star details
      this.updateTransformedStarDetails();

      // Clear the selected star data
      this.selectedTasksStarData = null;
      this.uiActiveItemId = null; // Clear UI active item

      // Restore treeview active items to their original state
      // The treeviewActiveItems will be restored when updateTransformedStarDetails is called

      // Reset container width to default
      this.resetContainerWidth();

      // Update network positions for all stars with proper timing
      this.$nextTick(() => {
        // Additional delay to ensure container reset is complete
        setTimeout(() => {
          this.updateNetworkPositionsFromTreeview();
        }, 100);
      });
    },

    resetContainerWidth() {
      const galaxyPreviewContainer = document.querySelector(".galaxy-preview-container");
      if (galaxyPreviewContainer) {
        galaxyPreviewContainer.style.width = "";
        galaxyPreviewContainer.style.alignItems = "";
        galaxyPreviewContainer.style.overflow = "";
        console.log("Reset galaxy-preview-container width to default");
      }
    },
    itemMadeActive(newValue, starIndex) {
      const firstId = newValue && newValue[0];
      const planetId = this.normalizeToPlanetId(firstId) || firstId;
      this.highlightPlanetAndOrbitRing(planetId);

      // logic if not task editing
      if (!this.taskEditing) {
        // Filter to only allow star and planet types to be made active
        const filtered = (newValue || []).filter((id) => {
          // Quick type deduction from id pattern
          if (/^star\[\d+\]/.test(id)) return true; // star (allow trailing segments)
          if (/^star\[\d+\]\.planet\[\d+\]/.test(id)) return true; // planet (allow trailing)
          return false; // missions/instructions not activatable
        });

        this.updateActiveGalaxyItems(filtered, starIndex);
      }
      // logic if task editing
      else {
        // Set the active item ID for UI highlighting
        // In task editing, also ensure only planet becomes active
        const firstValidRaw = (newValue || []).find((id) => /^star\[\d+\]\.planet\[\d+\]/.test(id));
        const firstValid = this.normalizeToPlanetId(firstValidRaw) || firstValidRaw;
        this.uiActiveItemId = firstValid || null; // Take the first valid planet id

        if (firstValid) {
          const { starIndex, planetIndex } = this.parseGalaxyPath(firstValid);
          this.taskEditingStarIndex = starIndex;
          this.taskEditingPlanetIndex = planetIndex;
          this.activeMissionPath = firstValid;
          this.addActiveMissionItem(firstValid);
        } else {
          this.activeMissionPath = null;
        }

        // Update treeview active items to only show the selected item
        this.treeviewActiveItems = {
          0: firstValid ? [firstValid] : [],
        };
      }
    },
    normalizeToPlanetId(id) {
      if (!id || typeof id !== "string") return null;
      const match = id.match(/^(star\[\d+\]\.planet\[\d+\])/);
      return match ? match[1] : null;
    },
    highlightPlanetAndOrbitRing(itemId) {
      console.log("highlightPlanetAndOrbitRing", itemId);
      // Allow trailing segments like .instructions
      const starMatch = itemId && itemId.match(/star\[(\d+)\]/);
      const starIndex = starMatch ? parseInt(starMatch[1]) : null;
      console.log("starIndex", starIndex);
      const planetMatch = itemId && itemId.match(/planet\[(\d+)\]/);
      const planetIndex = planetMatch ? parseInt(planetMatch[1]) : null;
      console.log("planetIndex", planetIndex);

      // Clear any previous highlight first
      this.clearPlanetHighlight();

      // If a planet is selected, highlight it (fill and orbit stroke)
      if (planetIndex != null) {
        // Resolve topicId. In taskEditing view, starIndex is 0 while topicIds come from the original nodes.
        // Prefer matching by current planets list to get the right topicId for this planet index.
        let topicId = null;
        // Try exact match by current starIndex and planetIndex first
        const candidate = this.planets.find(
          (p) =>
            p.taskIndex === planetIndex &&
            (starIndex == null || p.topicId.endsWith(`-${starIndex}`)),
        );
        if (candidate) {
          topicId = candidate.topicId;
        } else {
          // Fallback: if multiple stars reduced to one (taskEditing), pick the sole star's topicId
          const uniqueTopicIds = Array.from(new Set(this.planets.map((p) => p.topicId)));
          topicId =
            uniqueTopicIds.length === 1
              ? uniqueTopicIds[0]
              : starIndex != null
                ? `star-${starIndex}`
                : null;
        }

        if (topicId) {
          this.setPlanetHighlightByIds(topicId, planetIndex);
        } else {
          this.updatePlanetColors();
        }
      } else {
        // No planet selected -> reset colors
        this.updatePlanetColors();
      }
    },
    convertGalaxyMapToMarkdown(galaxyMap) {
      if (!galaxyMap || !galaxyMap.stars) {
        return "";
      }

      let markdown = `# ${galaxyMap.title || "Learning Journey"}\n\n`;
      markdown += `${galaxyMap.description || ""}\n\n`;

      markdown += "## Learning Journey Structure\n\n";

      for (let i = 0; i < galaxyMap.stars.length; i++) {
        const star = galaxyMap.stars[i];
        markdown += `### ${star.title} (star[${i}])\n`;
        markdown += `${star.description}\n\n`;

        if (star.planets && star.planets.length > 0) {
          markdown += "**Missions in this Star:**\n";
          for (let j = 0; j < star.planets.length; j++) {
            const planet = star.planets[j];
            markdown += `- ${planet.title} (planet[${j}]): ${planet.description}\n`;

            // Add mission instructions if they exist
            // if (planet.instructions) {
            //   markdown += `  - Instructions: ${planet.instructions}\n`;
            // }
          }
          markdown += "\n";
        }
      }

      return markdown;
    },

    /**
     * Detects if content is already HTML
     * @param {string} content - The content to analyze
     * @returns {boolean} - true if content contains HTML tags
     */
    isHtmlContent(content) {
      if (!content || typeof content !== "string") return false;

      // Check for common HTML tags
      const htmlTagRegex = /<[^>]*>/;
      const isHtml = htmlTagRegex.test(content);
      return isHtml;
    },

    /**
     * Detects if content contains markdown syntax
     * @param {string} content - The content to analyze
     * @returns {boolean} - true if content contains markdown syntax
     */
    containsMarkdown(content) {
      if (!content || typeof content !== "string") return false;

      // Check for common markdown patterns
      const markdownPatterns = [
        /^#{1,6}\s/, // Headers
        /\*\*.*?\*\*/, // Bold
        /\*.*?\*/, // Italic
        /\[.*?\]\(.*?\)/, // Links
        /!\[.*?\]\(.*?\)/, // Images
        /^[-*+]\s/, // Unordered lists
        /^\d+\.\s/, // Ordered lists
        /`.*?`/, // Inline code
        /```[\s\S]*?```/, // Code blocks
        /^>\s/, // Blockquotes
        /~~.*?~~/, // Strikethrough
        /^---$/, // Horizontal rules
      ];

      return markdownPatterns.some((pattern) => pattern.test(content));
    },

    /**
     * Escapes HTML characters to prevent XSS
     * @param {string} text - The text to escape
     * @returns {string} - The escaped text
     */
    escapeHtml(text) {
      if (!text || typeof text !== "string") return "";

      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    },

    async continueWithClarification() {
      this.showClarificationDialog = false;
      this.loading = true;
      this.isRefining = true;

      console.log("Clarification answered, proceeding with refinement");

      try {
        // Start timing
        const startTime = Date.now();
        console.log("🚀 Starting Galaxy refinement with clarification...");

        // Format answers similar to AICreateGalaxyDialog
        const prefixedAnswers = this.clarificationAnswers.map(
          (answer, index) => `${index + 1}) ${answer}`,
        );
        const clarificationAnswersString = prefixedAnswers.join("\n");

        // Call the clarification refinement function
        const clarificationResponse = await refineGalaxyMapWithClarification(
          clarificationAnswersString,
          this.previousRefinementResponseId,
        );

        console.log("Clarification refinement response:", clarificationResponse);

        // Check if we still need clarification
        if (clarificationResponse.galaxyMap.status === "clarification_needed") {
          console.log("Still need clarification, showing new questions");

          // Update questions and show dialog again
          this.clarificationQuestions = clarificationResponse.galaxyMap.questions || [];
          this.clarificationAnswers = new Array(this.clarificationQuestions.length).fill("");
          this.previousRefinementResponseId = clarificationResponse.responseId;

          this.showClarificationDialog = true;
          this.isRefining = false;
          this.loading = false;

          // Track token usage
          this.trackTokenUsage(clarificationResponse);

          return;
        }

        // If we have a journey_ready response, proceed with normal refinement flow
        if (clarificationResponse.galaxyMap.status === "journey_ready") {
          console.log("Journey ready after clarification, updating galaxy map");

          // Preserve existing properties that should not be overwritten
          const existingHistory = this.aiGeneratedGalaxyMap.history || [];
          const existingTokens = this.aiGeneratedGalaxyMap.tokens || {
            totalInputTokens: 0,
            totalOutputTokens: 0,
            totalTokens: 0,
            modelsUsed: [],
            combinedEstimatedCost: 0,
          };
          const existingAiResponseId = this.aiGeneratedGalaxyMap.aiResponseId;
          const existingOriginResponseId = this.aiGeneratedGalaxyMap.originResponseId;

          // Merge the new AI response with existing properties
          this.aiGeneratedGalaxyMap = {
            ...this.aiGeneratedGalaxyMap,
            ...clarificationResponse.galaxyMap,
          };

          // Create a deep copy for history
          const newGalaxyMapCopy = JSON.parse(
            JSON.stringify({
              ...this.aiGeneratedGalaxyMap,
              history: undefined,
            }),
          );

          // Add to history
          this.aiGeneratedGalaxyMap.history.push({
            galaxyMapData: newGalaxyMapCopy,
            atThisRefineUserPrompt: this.galaxyRefineUserInput,
          });

          // Track token usage
          this.trackTokenUsage(clarificationResponse);

          // Update store
          this.setAiGalaxyEditData(this.aiGeneratedGalaxyMap);

          // Reset form
          this.galaxyRefineUserInput = "";
          this.activeGalaxyItems = [];
          this.treeviewActiveItems = {};

          // Calculate and log execution time
          const endTime = Date.now();
          const timeString = this.formatExecutionTime(startTime, endTime);
          console.log(
            `✅ Galaxy refinement with clarification completed in ${timeString} (${endTime - startTime}ms total)`,
          );
        }
      } catch (error) {
        console.error("Error during clarification refinement:", error);
        this.setSnackbar({
          show: true,
          text: "Error during refinement: " + error.message,
          color: "pink",
        });
      } finally {
        // Reset state
        this.isRefining = false;
        this.loading = false;
        this.clarificationAnswers = [];
        this.previousRefinementResponseId = null;
      }
    },

    cancelClarification() {
      this.showClarificationDialog = false;
      // Add any additional logic you want to execute when clarification is canceled
      console.log("Clarification canceled");
    },
  },
};
</script>

<style lang="scss" scoped>
.bg {
  background: var(--v-background-base);
}

#container {
  height: 100vh;
  width: 100%;
  display: flex;
  overflow: hidden;
  margin: 0 !important;

  // Mobile height
  @media (max-width: 960px) {
    height: calc(var(--vh, 1vh) * 100);
  }
}

#left-section {
  width: 200px;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  // border: 1px solid yellow;
  overflow-y: auto;
  padding: 0px 0px 50px 20px;
  // z-index: 3;
  // transition: all 0.3s;
  position: absolute;
  left: 0px;
  top: 0px;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }

  &.minimized {
    margin-left: 0px;
  }

  &.mobile {
    padding: 0px;
    margin: 10px;
  }

  .galaxy-info-wrapper {
    &.minimized {
      position: fixed;
      top: -31px;
      left: 0;
      z-index: 10;
      width: 100%;

      &.mobile {
        width: 50%;
      }
    }
  }

  .ai-edit-feature-buttons {
    position: absolute;
    bottom: 150px;
    left: 20px;
    z-index: 10;
  }

  .legend-item-text {
    color: #808080;
    font-size: 0.98em;
    opacity: 0.85;
  }
}

#main-section {
  position: absolute;
  width: calc(100vw - 200px);
  margin: 0px 0px 0px 210px;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  z-index: 1;
  transition: all 0.3s;

  &.minimized {
    width: 100vw;
    margin: 0px;
  }

  &.mobile {
    width: 100vw !important;
    margin: 0px !important;
  }

  // Galaxy treeview styles
  .galaxy-treeview-container {
    width: 100%;
    height: 100%;
    margin: 0 auto;
    padding: 0 1rem;
    overflow: hidden;
    overflow-y: auto;
    // border: 1px solid blue;
    flex-direction: column;

    &.mobile {
      padding: 0px;
    }

    .galaxy-preview-container {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: flex-start;
      height: auto;
      overflow-y: auto;
      // margin-bottom: 100px;
      transition: all 0.3s ease;

      // border: 1px dashed var(--v-missionAccent-base);

      // Create a mask that fades out at left and right edges using linear gradients
      mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
      -webkit-mask-image: linear-gradient(
        to right,
        transparent 0%,
        black 5%,
        black 95%,
        transparent 100%
      );

      // Remove mask on mobile devices
      &.mobile {
        mask-image: none;
        -webkit-mask-image: none;
      }

      &.task-editing {
        width: 300px; // Shrink to roughly one treeview column width
        align-items: center;
        margin-left: 50px;
      }

      .network-graph {
        height: 250px;
        // min-height: 300px;
        // border: 1px solid yellow;
        &.task-editing {
          height: 500px;
        }
      }

      .galaxy-treeview-wrapper {
        display: flex;
        flex-direction: row;
        gap: 20px;
        min-height: 80%;
        padding: 10px;
        overflow-y: auto;
        overflow-x: auto;
        margin-top: -100px;
        // border: 1px solid green;
        // Prevent touchpad two-finger swipe gestures
        transition: all 0.3s ease;
        backdrop-filter: blur(2px);

        &.task-editing {
          justify-content: center;
          gap: 0;

          .v-treeview-node__root {
            display: none !important;
          }
        }

        .star-treeview-item {
          flex: 0 0 auto;
          width: auto;
          // padding: 15px;
          background-color: rgba(var(--v-background-base), 0.9);
          border-radius: 8px;
          height: auto;
          // border: 1px solid pink;
          position: relative;
          display: flex;

          .star-title {
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--v-galaxyAccent-base);
            text-transform: uppercase;
            margin-bottom: 10px;
            text-align: center;
            padding: 8px;
            background-color: rgba(var(--v-galaxyAccent-base), 0.1);
            border-radius: 4px;
            border: 1px solid rgba(var(--v-galaxyAccent-base), 0.3);
          }

          .galaxy-treeview {
            width: 100%;

            .v-treeview-node {
              margin-bottom: 0.25rem;
            }

            .v-treeview-node__root {
              padding: 0.25rem 0;
            }

            .v-treeview-node__children {
              margin-left: 1rem;
            }

            // Hide the root star node since we're showing it as a title
            .v-treeview-node:first-child > .v-treeview-node__root {
              display: none;
            }

            // Adjust spacing for better readability
            .v-treeview-node__content {
              padding: 0.25rem 0;
              cursor: pointer; // Add pointer cursor to treeview content
            }
          }

          .treeview-label {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            font-size: 0.85rem;
            color: var(--v-missionAccent-base);
            font-weight: 500;
            line-height: 1.3;
            word-wrap: break-word;
            cursor: pointer; // Add pointer cursor to indicate clickable items
            position: relative;
            width: 100%;
            padding: 7px 0px;
            transition: all 0.3s ease;

            &.ui-active {
              background-color: rgba(var(--v-galaxyAccent-base), 0.2);
              border: 1px solid var(--v-missionAccent-base);
              border-radius: 8px;
              padding: 5px 8px;
              // margin: 5px;
              pointer-events: auto;
            }

            &.ui-dimmed {
              opacity: 0.3;
              filter: grayscale(0.5);
              pointer-events: auto;
            }

            &.star-item-editing {
              margin-bottom: 25px;
            }
          }

          .item-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            max-width: calc(
              300px + 50px
            ); // 280px is the max-width of the treeview-description + 5px for the treeview-description margin-left
            justify-content: space-between;
          }

          .item-name {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            white-space: normal;
            width: 100%;
            text-indent: -2.5em; /* Negative indent to pull wrapped lines left */
            padding-left: 2.5em; /* Positive padding to push content right */
            box-sizing: border-box;
          }

          .edit-icon,
          .delete-icon {
            opacity: 0;
            transition: opacity 0.2s ease;
            margin-left: 4px;
            flex-shrink: 0;
          }

          .generate-tasks-btn {
            display: none;
            margin-left: 4px;
            flex-shrink: 0;
          }

          .treeview-label:hover .edit-icon,
          .treeview-label:hover .delete-icon {
            opacity: 1;
          }

          .treeview-label:hover .generate-tasks-btn {
            display: inline-flex;
          }

          .edit-input {
            width: 210px;
            min-width: 210px;
            font-size: 0.72rem;

            .v-input__control {
              min-height: auto;
            }

            .v-input__slot {
              min-height: auto;
              padding: 0;
            }

            .v-text-field__slot {
              input {
                font-size: 0.75rem;
                color: var(--v-missionAccent-base);
                font-weight: 500;
                padding: 2px 8px;
              }
            }
          }

          .star-emoji {
            font-size: 1rem;
            filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.6));
          }

          .planet-emoji {
            font-size: 0.9rem;
            filter: drop-shadow(0 0 3px rgba(138, 43, 226, 0.6));
          }

          .mission-emoji {
            font-size: 0.8rem;
            filter: drop-shadow(0 0 2px rgba(255, 69, 0, 0.6));
          }

          .treeview-content {
            display: flex;
            flex-direction: column;
            width: 100%;
          }

          .treeview-description {
            font-size: 0.8rem;
            color: var(--v-missionAccent-base);
            opacity: 0.7;
            font-weight: 400;
            line-height: 1.3;
            margin-left: 50px;
            margin-top: -3px;
            word-wrap: break-word;
            white-space: normal;
            overflow-wrap: break-word;
            max-width: 280px;
            width: 100%;

            .treeview-markdown {
              font-size: 0.65rem;
              color: var(--v-missionAccent-base);
              font-weight: 400;
              line-height: 1.3;
            }
          }

          .add-button {
            position: relative;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            opacity: 0;
            transition:
              opacity 0.3s ease,
              transform 0.3s ease;
            z-index: 10;
            text-transform: lowercase;
            // font-size: 0.75rem;
            font-weight: 500;
            letter-spacing: 0.5px;
            width: 70px;

            &:hover {
              transform: translateX(-50%) translateY(-2px);
            }
          }

          &:hover .add-button {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }

          .add-star-button {
            width: 30px;
            // border: 1px solid red;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            margin-left: 20px;
            opacity: 0;
            transition:
              opacity 0.3s ease,
              transform 0.3s ease;

            .star-button {
              min-width: 30px !important;
              height: 70px;
              transition:
                opacity 0.3s ease,
                transform 0.3s ease;

              &:hover {
                transform: translateY(-2px);
              }
            }
          }

          &:hover .add-star-button {
            opacity: 1;
            transform: translateY(0);
          }
        }
      }
    }

    .lower-main-section {
      display: flex;

      &.mobile {
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        gap: 10px;
      }

      .history-container {
        height: 100px;
        padding-top: 10px;
        width: 20%;
        // border: 1px solid red;

        &.mobile {
          width: 80%;
          margin: 0px 10px;
        }

        .history-items-container {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;

          .history-item {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            // border: 1px solid var(--v-missionAccent-base);
            border-radius: 4px;
            padding: 5px;
            color: var(--v-missionAccent-base);
            font-size: 0.8rem;
            font-weight: 400;
            width: 50px;
            height: 50px;

            .history-item-button {
              width: 50px;
              height: 50px;
              border-radius: 4px;
              color: var(--v-missionAccent-base);
              padding: 0px;
            }
          }
        }
      }

      .galaxy-prompt-container {
        width: 60%;
        height: 30%;
        // border: 1px solid yellow;
        display: flex;
        justify-content: center;
        align-items: flex-start;

        margin-bottom: 100px;

        &.mobile {
          width: 100%;
        }

        .prompt-textarea-container {
          width: 80%;

          &.mobile {
            width: 100%;
          }

          .legend-container {
            // position: absolute;
            // bottom: 10%;
            // left: 20px;
            // width: calc(100% - 20px);
            display: flex;
            flex-direction: row;
            align-items: flex-start;
            gap: 6px;
            //background: rgba(128, 128, 128, 0.07); // very subtle background
            border-radius: 8px 8px 0 0;
            color: #808080;
            font-size: 0.92rem;
            box-shadow: none;
            z-index: 2;
            pointer-events: auto;
          }
          .legend-item {
            display: flex;
            align-items: center;
            gap: 7px;
            color: #808080;
            font-size: 0.95em;
            font-weight: 400;
            letter-spacing: 0.01em;
            opacity: 0.85;
          }
          .legend-item-icon {
            font-size: 1.1em;
            margin-right: 2px;
            opacity: 0.7;
          }

          .input-field {
            width: 100%;
            text-align: center;
            flex: none;
            font-size: 1rem;
            color: var(--v-missionAccent-base);
          }

          .action-buttons {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            margin-top: -10px;
            gap: 20px;

            &.mobile {
              flex-direction: column;
              gap: 10px;

              .v-btn {
                width: 100%;
              }
            }
          }

          .theme-chip {
            border: 1px solid var(--v-missionAccent-base) !important;
            color: var(--v-missionAccent-base) !important;
            background-color: transparent !important;
            font-weight: 500;
            transition: all 0.3s ease;

            &:hover {
              background-color: rgba(var(--v-missionAccent-base), 0.1) !important;
              transform: translateY(-1px);
              box-shadow: 0 2px 8px rgba(var(--v-missionAccent-base), 0.3);
            }

            .v-chip__close {
              color: var(--v-missionAccent-base) !important;

              &:hover {
                background-color: rgba(var(--v-missionAccent-base), 0.2) !important;
              }
            }
          }
        }
      }
    }
  }
}

.task-editing {
  ::v-deep .v-treeview-node__root {
    // display: none !important;
  }
}

.token-container {
  position: absolute;
  bottom: 50px;
  left: 10px;
  // width: calc(100% - 20px);
  // display: flex;
  // flex-direction: column;
  // align-items: flex-start;
  // gap: 6px;
  // padding: 12px 10px 8px 10px;
  //background: rgba(128, 128, 128, 0.07); // very subtle background
  // border-radius: 8px 8px 0 0;
  color: #808080;
  font-size: 0.6rem !important;
  box-shadow: none;
  z-index: 2;
  // pointer-events: auto;

  .token-title {
    font-size: 0.6rem !important;
    line-height: 1.4;
  }
}

// History tooltip specific styles
.history-item-tooltip-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 300px;
  margin-left: -20px;
  height: 50px;
}

.history-item-tooltip {
  color: var(--v-missionAccent-base);
  font-size: 0.85rem;
  font-weight: 400;
  line-height: 1.4;
  margin: 0;
  word-wrap: break-word;
  white-space: normal;
  opacity: 0.9;
  text-align: center;
}

#right-section {
  // width: 50%;
  // height: 100%;
  // z-index: 3;
  // margin-left: auto;
  // margin-right: 20px;
  // border-left: 1px solid var(--v-missionAccent-base);
  // padding: 20px;
  // overflow-y: auto;
  // background-color: var(--v-background-base);
  // display: flex;

  // &.mobile {
  //   width: 100%;
  //   border-left: none;
  //   padding: 0;
  // }

  // .right-section-header {
  //   margin-bottom: 20px;
  //   padding-bottom: 15px;
  //   border-bottom: 1px solid rgba(var(--v-missionAccent-base), 0.2);
  // }

  // .selected-planet-info {
  //   display: flex;
  //   flex-direction: column;
  //   gap: 14px;

  //   .mission-section {
  //     // border: 1px solid var(--v-missionAccent-base);
  //     border-radius: 10px;
  //     // padding: 14px 16px;
  //     padding: 25px;
  //     margin: 10px 10px;
  //     // box-shadow: 0 4px 14px var(--v-missionAccent-base);
  //     box-shadow: 0 4px 14px color-mix(in srgb, var(--v-missionAccent-base) 80%, transparent);
  //   }

  //   .mission-section:hover {
  //     transform: scale(1.02);
  //     transition: transform 0.2s ease;
  //     border-right: 10px solid var(--v-galaxyAccent-base);
  //     position: relative;
  //   }

  //   .mission-section:hover::after {
  //     content: "E\A D\A I\A T";
  //     white-space: pre;
  //     position: absolute;
  //     right: 5px;
  //     top: 50%;
  //     transform: translateY(-50%);
  //     color: var(--v-galaxyAccent-base);
  //     font-weight: bold;
  //     font-size: 0.8rem;
  //     line-height: 1.2;
  //     text-align: center;
  //     // writing-mode: vertical-rl;
  //     text-orientation: mixed;
  //   }

  //   .planet-header {
  //     display: flex;
  //     align-items: start;
  //     gap: 10px;

  //     .planet-emoji {
  //       font-size: 1.5rem;
  //     }

  //     .planet-title {
  //       margin: 0;
  //       color: var(--v-missionAccent-base);
  //       font-size: 1.5rem;
  //       font-weight: 600;
  //     }
  //   }

  //   .section-card {
  //     // background: linear-gradient(
  //     //   180deg,
  //     //   rgba(var(--v-missionAccent-base), 0.6),
  //     //   rgba(var(--v-missionAccent-base), 0.2)
  //     // );
  //     // border: 1px solid rgba(var(--v-missionAccent-base), 0.25);
  //     // border-radius: 10px;
  //     // padding: 14px 16px;
  //     // box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  //   }

  //   .section-title {
  //     color: var(--v-missionAccent-base);
  //     // margin: 0 0 8px 20px;
  //     // font-size: 1rem;
  //     // font-weight: 700;
  //     // letter-spacing: 0.2px;
  //   }

  //   .section-text {
  //     // color: var(--v-missionAccent-base);
  //     line-height: 1.65;
  //     // margin: 0 0 0 20px;
  //     font-size: 0.92rem;
  //   }

  //   .planet-missions {
  //     h4 {
  //       color: var(--v-galaxyAccent-base);
  //       margin-bottom: 15px;
  //       font-size: 1rem;
  //       font-weight: 600;
  //     }

  //     .missions-list {
  //       .mission-item {
  //         display: flex;
  //         align-items: center;
  //         gap: 8px;
  //         padding: 8px 12px;
  //         margin-bottom: 8px;
  //         background-color: rgba(var(--v-missionAccent-base), 0.05);
  //         border-radius: 6px;
  //         border-left: 3px solid var(--v-missionAccent-base);

  //         .mission-emoji {
  //           font-size: 0.9rem;
  //         }

  //         .mission-name {
  //           color: var(--v-missionAccent-base);
  //           font-size: 0.9rem;
  //           font-weight: 500;
  //         }
  //       }
  //     }
  //   }

  //   .step-card {
  //     // position: relative;
  //     // // border-radius: 12px;
  //     // margin: 0 0 0 20px;
  //     // padding: 14px 16px 12px 16px;
  //     // // border: 1px dashed rgba(var(--v-galaxyAccent-base), 0.35);
  //     // border: 1px solid var(--v-missionAccent-base);
  //     // background: linear-gradient(
  //     //   180deg,
  //     //   rgba(var(--v-galaxyAccent-base), 0.06),
  //     //   rgba(var(--v-galaxyAccent-base), 0.02)
  //     // );
  //   }

  //   .step-header {
  //     display: flex;
  //     align-items: center;
  //     gap: 8px;
  //     margin-bottom: 8px;
  //   }

  //   .step-title {
  //     margin: 0;
  //     // font-size: 0.98rem;
  //     // font-weight: 700;
  //     color: var(--v-missionAccent-base);
  //   }

  //   .task-list {
  //     display: flex;
  //     flex-direction: column;
  //     gap: 8px;
  //   }

  //   .task-item {
  //     display: grid;
  //     grid-template-columns: 14px 1fr;
  //     align-items: start;
  //     gap: 10px;
  //     padding: 8px 10px;
  //     border-radius: 8px;
  //     background-color: rgba(var(--v-missionAccent-base), 0.05);
  //     // border-left: 3px solid var(--v-missionAccent-base);
  //   }

  //   .task-bullet {
  //     width: 8px;
  //     height: 8px;
  //     margin-top: 6px;
  //     border-radius: 50%;
  //     background: var(--v-missionAccent-base);
  //     display: inline-block;
  //   }

  //   .task-text {
  //     margin: 0;
  //     font-size: 0.92rem;
  //     line-height: 1.6;
  //     // color: var(--v-missionAccent-base);
  //   }

  //   .checkpoint-row {
  //     display: grid;
  //     grid-template-columns: 18px 1fr;
  //     align-items: start;
  //     gap: 10px;
  //     padding: 10px 12px;
  //     border-radius: 10px;
  //     margin-top: 10px;
  //     background: rgba(var(--v-galaxyAccent-base), 0.06);
  //     border: 1px solid rgba(var(--v-galaxyAccent-base), 0.25);
  //   }

  //   .checkpoint-flag {
  //     font-size: 0.95rem;
  //     margin-top: 2px;
  //   }

  //   .checkpoint-text {
  //     margin: 0;
  //     font-size: 0.9rem;
  //     color: var(--v-missionAccent-base);
  //     line-height: 1.6;
  //     // font-weight: 600;
  //   }
  // }

  // .no-planet-selected {
  //   display: flex;
  //   justify-content: center;
  //   align-items: center;
  //   height: 200px;
  //   color: var(--v-missionAccent-base);
  //   opacity: 0.7;
  //   font-style: italic;
  // }
}

// Loading overlay styles
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--v-background-base);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0.95;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem;
}

.long-loading-time-message {
  font-size: 0.8rem;
  color: var(--v-missionAccent-base);
  opacity: 0.8;
  line-height: 1.4;
}

.saving-to-db-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 0;
  width: 100%;
  height: 100%;
}

.loading-message {
  color: var(--v-missionAccent-base);
  margin-top: 1rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  animation: fadeInOut 3s ease-in-out infinite;
}

.token-usage {
  color: var(--v-galaxyAccent-base);
  margin-top: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
  line-height: normal !important;
  margin: 5px !important;
}

.token-breakdown {
  color: var(--v-missionAccent-base);
  margin-top: 0.25rem;
  font-size: 0.7rem;
  opacity: 0.8;
  line-height: normal !important;
  margin: 5px !important;
}

.model-breakdown {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: rgba(var(--v-background-base), 0.1);
  border-radius: 4px;
  border: 1px solid rgba(var(--v-missionAccent-base), 0.2);
}

.model-breakdown-title {
  color: var(--v-galaxyAccent-base);
  font-size: 0.7rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.model-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0.125rem 0;
  font-size: 0.65rem;
  color: var(--v-missionAccent-base);
  opacity: 0.9;
}

.model-name {
  font-weight: 600;
  color: var(--v-galaxyAccent-base);
}

.model-tokens {
  opacity: 0.7;
}

.model-cost {
  font-weight: 600;
  color: var(--v-missionAccent-base);
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.saving-progress-container {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.saving-progress-text {
  color: var(--v-missionAccent-base);
  font-size: 0.9rem;
  font-weight: 600;
  margin-top: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.mission-generation-progress-container {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.mission-generation-progress-text {
  color: var(--v-missionAccent-base);
  font-size: 0.75rem;
  font-weight: 600;
  margin-top: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.mission-status {
  margin-left: 8px;
  color: var(--v-missionAccent-base);
  font-weight: bold;
}

// Loading overlay treeview styles (matching main treeview)
.loading-galaxy-treeview-container {
  width: 100%;
  max-height: 65vh;
  margin: 0 auto;
  padding: 1rem;
  overflow-y: auto;
  flex-direction: column;
  background-color: rgba(var(--v-background-base), 0.8);
  border-radius: 8px;
  position: relative;
  padding-bottom: 100px;

  // Create a mask that fades out at all edges using radial gradient
  mask-image: radial-gradient(
    ellipse at center,
    black 60%,
    rgba(0, 0, 0, 0.9) 75%,
    rgba(0, 0, 0, 0.7) 85%,
    transparent 95%
  );
  -webkit-mask-image: radial-gradient(
    ellipse at center,
    black 60%,
    rgba(0, 0, 0, 0.9) 75%,
    rgba(0, 0, 0, 0.7) 85%,
    transparent 95%
  );

  // Remove mask on mobile devices
  &.mobile {
    mask-image: none;
    -webkit-mask-image: none;
  }
}

.loading-galaxy-treeview-wrapper {
  display: flex;
  flex-direction: row;
  gap: 20px;
  min-height: auto;
  padding: 10px;
  overflow-y: visible;
  overflow-x: auto;
  margin-top: 0;
  transition: all 0.3s ease;
  backdrop-filter: blur(2px);
  padding-bottom: 50px;
  margin-bottom: 50px;

  // Custom scrollbar styling
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(var(--v-missionAccent-base), 0.1);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(var(--v-missionAccent-base), 0.5);
    border-radius: 4px;

    &:hover {
      background: rgba(var(--v-missionAccent-base), 0.7);
    }
  }
}

.loading-star-treeview-item {
  flex: 0 0 auto;
  width: auto;
  background-color: rgba(var(--v-background-base), 0.9);
  border-radius: 8px;
  height: auto;
  position: relative;
  display: flex;
  overflow-y: visible;
}

.loading-galaxy-treeview {
  width: 100%;
  overflow-y: visible;

  .v-treeview-node {
    margin-bottom: 0.25rem;
  }

  .v-treeview-node__root {
    padding: 0.25rem 0;
  }

  .v-treeview-node__children {
    margin-left: 1rem;
  }

  // Hide the root star node since we're showing it as a title
  .v-treeview-node:first-child > .v-treeview-node__root {
    display: none;
  }

  // Adjust spacing for better readability
  .v-treeview-node__content {
    padding: 0.25rem 0;
  }
}

.loading-treeview-label {
  display: flex;
  flex-direction: row;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: var(--v-missionAccent-base);
  font-weight: 500;
  line-height: 1.3;
  word-wrap: break-word;
  position: relative;
  width: 100%;
  padding: 7px 0px;
  transition: all 0.3s ease;
  text-align: left;

  .treeview-description {
    font-size: 0.8rem;
    color: var(--v-missionAccent-base);
    opacity: 0.7;
    font-weight: 400;
    line-height: 1.3;
    margin-left: 50px;
    margin-top: -3px;
    word-wrap: break-word;
    white-space: normal;
    overflow-wrap: break-word;
    max-width: 280px;
    width: 100%;

    .treeview-markdown {
      font-size: 0.65rem;
      color: var(--v-missionAccent-base);
      font-weight: 400;
      line-height: 1.3;
    }
  }
}

.loading-treeview-description {
  font-size: 0.8rem;
  color: var(--v-missionAccent-base);
  opacity: 0.7;
  font-weight: 400;
  line-height: 1.3;
  margin-left: 50px;
  margin-top: -3px;
  word-wrap: break-word;
  white-space: normal;
  overflow-wrap: break-word;
  max-width: 280px;
  width: 100%;
  text-align: left;

  .treeview-markdown {
    font-size: 0.65rem;
    color: var(--v-missionAccent-base);
    font-weight: 400;
    line-height: 1.3;
  }

  // Override global markdown styles for loading treeview
  ::v-deep h1,
  ::v-deep h2,
  ::v-deep h3,
  ::v-deep h4,
  ::v-deep h5,
  ::v-deep h6 {
    margin: 0.25rem 0 0.125rem 0;
    color: var(--v-missionAccent-base);
    font-weight: 600;
  }

  ::v-deep h1 {
    font-size: 0.9rem;
  }

  ::v-deep h2 {
    font-size: 0.85rem;
  }

  ::v-deep h3 {
    font-size: 0.8rem;
  }

  ::v-deep h4 {
    font-size: 0.75rem;
  }

  ::v-deep h5 {
    font-size: 0.7rem;
  }

  ::v-deep h6 {
    font-size: 0.65rem;
  }

  ::v-deep p {
    margin: 0.125rem 0;
    line-height: 1.2;
    font-size: 0.75rem;
  }

  ::v-deep ul,
  ::v-deep ol {
    margin: 0.125rem 0;
    padding-left: 1rem;
  }

  ::v-deep li {
    margin: 0.0625rem 0;
    line-height: 1.2;
    font-size: 0.75rem;
  }
}

.updating-description {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// Markdown content styling
.treeview-description {
  // Markdown content styles
  ::v-deep h1,
  ::v-deep h2,
  ::v-deep h3,
  ::v-deep h4,
  ::v-deep h5,
  ::v-deep h6 {
    margin: 0.5rem 0 0.25rem 0;
    color: var(--v-missionAccent-base);
    font-weight: 600;
  }

  ::v-deep h1 {
    font-size: 1.1rem;
  }

  ::v-deep h2 {
    font-size: 1rem;
  }

  ::v-deep h3 {
    font-size: 0.9rem;
  }

  ::v-deep h4 {
    font-size: 0.85rem;
  }

  ::v-deep h5 {
    font-size: 0.8rem;
  }

  ::v-deep h6 {
    font-size: 0.75rem;
  }

  ::v-deep p {
    margin: 0.25rem 0;
    line-height: 1.4;
  }

  ::v-deep p.intro {
    font-size: 0.7rem;
    font-weight: 500;
    border-bottom: 1px solid var(--v-missionAccent-base);
    padding-bottom: 5px;
  }
  ::v-deep p.outro {
    font-size: 0.7rem;
    font-weight: 500;
    border-top: 1px solid var(--v-missionAccent-base);
    padding-top: 5px;
  }

  ::v-deep hr {
    border: none;
    border-top: 1px solid rgba(var(--v-missionAccent-base), 0.3);
    margin: 0.75rem 0;
    height: 1px;
  }

  ::v-deep strong {
    font-weight: 600;
    color: var(--v-missionAccent-base);
  }

  ::v-deep em {
    font-style: italic;
  }

  ::v-deep code {
    background-color: rgba(var(--v-missionAccent-base), 0.1);
    padding: 0.125rem 0.25rem;
    border-radius: 3px;
    font-family: "Courier New", monospace;
    font-size: 0.85em;
  }

  ::v-deep pre {
    background-color: rgba(var(--v-missionAccent-base), 0.05);
    padding: 0.5rem;
    border-radius: 4px;
    margin: 0.5rem 0;
    overflow-x: auto;

    code {
      background: none;
      padding: 0;
    }
  }

  ::v-deep ul,
  ::v-deep ol {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }

  ::v-deep li {
    margin: 0.25rem 0;
    line-height: 1.4;
  }

  ::v-deep ol li {
    list-style-type: decimal;
  }

  ::v-deep ul li {
    list-style-type: disc;
  }

  ::v-deep blockquote {
    border-left: 3px solid var(--v-missionAccent-base);
    padding-left: 0.75rem;
    margin: 0.5rem 0;
    font-style: italic;
    color: rgba(var(--v-missionAccent-base), 0.8);
  }

  ::v-deep a {
    color: var(--v-missionAccent-base);
    text-decoration: underline;

    &:hover {
      text-decoration: none;
    }
  }

  // Additional styles for streaming-markdown specific elements
  ::v-deep table {
    border-collapse: collapse;
    margin: 0.5rem 0;
    width: 100%;
  }

  ::v-deep th,
  ::v-deep td {
    border: 1px solid rgba(var(--v-missionAccent-base), 0.3);
    padding: 0.25rem 0.5rem;
    text-align: left;
  }

  ::v-deep th {
    background-color: rgba(var(--v-missionAccent-base), 0.1);
    font-weight: 600;
  }
}

// new dialog ui
.create-dialog {
  color: var(--v-missionAccent-base);
  background-color: var(--v-background-base);
  border: 1px solid var(--v-missionAccent-base);
  // background: lightGrey;
  display: flex;
  // flex-direction: column;
  flex-wrap: wrap;
  overflow-x: hidden;

  .dialog-header {
    width: 100%;
    padding: 20px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--v-missionAccent-base);
  }

  .action-buttons {
    width: auto;
    padding: 20px;
    margin: 0 100px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
}

.create-dialog-content {
  display: flex;
  justify-content: space-around;
  align-items: space-around;
  flex-direction: column;
  color: var(--v-missionAccent-base);
  padding: 20px;
  width: 100%;

  .dialog-title {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
  }

  .input-field {
    width: 100%;
    text-align: center;
    flex: none;
    font-size: 1rem;
    color: var(--v-missionAccent-base);
  }
}

.dialog-description {
  color: var(--v-missionAccent-base);
  text-transform: uppercase;
  font-size: 0.7rem;
  margin: 0;

  .galaxy-text {
    color: var(--v-galaxyAccent-base);
    text-transform: uppercase;
    font-weight: 700;
  }

  .mission-text {
    color: var(--v-missionAccent-base);
    text-transform: uppercase;
    font-weight: 700;
  }
}

.v-btn:not(.v-btn--round).v-size--default {
  background-color: var(--v-background-base) !important;
}

.mobile-layout {
  .create-dialog {
    flex-direction: column;
    min-height: auto;
    padding: 0;

    .dialog-header {
      padding: 15px;

      .dialog-title {
        font-size: 1.1rem;
        margin-bottom: 10px;
      }

      .dialog-description {
        font-size: 0.65rem;
        line-height: 1.4;
      }
    }

    .create-dialog-content {
      padding: 15px;
      min-height: auto;

      .input-field {
        font-size: 0.9rem;
        margin-bottom: 15px;
      }
    }

    .action-buttons {
      padding: 15px;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 15px;
      align-items: center;
      width: 100%;

      .v-btn {
        width: 100%;
        max-width: 280px;
        margin: 0 !important;
      }
    }
  }
}

// Fix scrolling issues with textareas
.input-field {
  .v-text-field__slot {
    textarea {
      scroll-behavior: smooth;
      overflow-y: auto;
    }
  }
}

// Ensure smooth scrolling for the entire dialog content
.create-dialog-content {
  scroll-behavior: smooth;
}

// Touch-friendly improvements for mobile
@media (max-width: 768px) {
  .action-buttons {
    &.flex-row {
      flex-direction: column !important;
      gap: 15px;

      .v-btn {
        margin: 0 !important;
        width: 100%;
        max-width: 280px;
      }
    }
  }
  .input-field {
    .v-input__control {
      min-height: 44px; // Minimum touch target size
    }
  }

  .v-btn {
    min-height: 44px; // Minimum touch target size
    font-size: 0.9rem;
  }
}

// Extra small mobile devices
@media (max-width: 480px) {
  .create-dialog {
    .dialog-header {
      padding: 12px;

      .dialog-title {
        font-size: 1rem;
      }

      .dialog-description {
        font-size: 0.6rem;
      }
    }

    .create-dialog-content {
      padding: 12px;
    }

    .action-buttons {
      padding: 12px;
      margin: 0;
      align-items: center;
      width: 100%;

      .v-btn {
        max-width: 260px;
      }
    }
  }
}
#app .slide-right-panel-enter-active,
#app .slide-right-panel-leave-active {
  transition:
    transform 0.25s ease,
    opacity 0.25s ease;
}
#app .slide-right-panel-enter,
#app .slide-right-panel-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
