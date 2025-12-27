# Feature: AI Credit/Token Balance System

## Feature Description

Implement a credit-based usage system for AI API calls where users have a credit balance that depletes with each AI operation. The system converts OpenAI token usage to credits (1 credit = 100 tokens) and enforces limits through the existing paywall infrastructure. Free users receive 300 credits that reset every 24 hours on login, while premium subscribers receive 10,000 credits that reset every 30 days on login. When users exhaust their credits, they are presented with the PaywallSnackbar to upgrade to premium.

This feature adds transparent usage tracking, prevents API abuse, creates a clear value proposition for premium subscriptions, and provides users with visibility into their AI usage costs.

## User Story

As a Galaxy Maps user
I want to see my AI credit balance and understand how much AI generation costs
So that I can manage my usage effectively and decide when to upgrade to premium

## Problem Statement

Currently, Galaxy Maps has no metering system for AI API calls. This creates several issues:

1. **No usage transparency**: Users don't know how much AI generation "costs" or how close they are to any limits
2. **Potential for abuse**: Free users could make unlimited expensive AI calls, creating unsustainable API costs
3. **Weak upgrade incentive**: No clear differentiation between free and premium AI usage
4. **No cost control**: Platform operators can't predict or control OpenAI API costs per user
5. **Poor UX for limits**: The existing galaxy creation limit (3 galaxies max) is too rigid and doesn't account for actual resource usage

The platform already captures token usage data from OpenAI API responses but doesn't use it to gate access or provide feedback to users.

## Solution Statement

Implement a credit-based metering system that:

1. **Tracks AI usage in credits**: Convert OpenAI token usage to user-friendly credits (1 credit = 100 tokens, so 1000 credits = 100k tokens)
2. **Stores credit balance in Firestore**: Add `credits`, `lastCreditReset`, and `creditsLifetimeUsed` fields to the `people/{personId}` collection
3. **Resets credits event-driven**: On user login (via presence system), check if reset period has elapsed and replenish credits
   - Free tier: 300 credits, resets every 24 hours (hard reset)
   - Premium tier: 10,000 credits, resets every 30 days (hard reset)
4. **Deducts credits on backend**: After each successful AI API call, backend calculates credits used and deducts from user's Firestore balance
5. **Enforces limits on frontend**: Before allowing AI operations, frontend checks if user has credits remaining; if zero, shows PaywallSnackbar
6. **Displays balance prominently**: Show credit balance in UserBar (settings menu) and in AI input dialogs with cost estimates
7. **Integrates with existing paywall**: Reuses PaywallSnackbar component with credit-specific messaging

This approach is secure (backend-enforced), transparent (visible to users), fair (resets based on actual login patterns), and scalable (event-driven, not scheduled).

## Relevant Files

### Backend Files (Cloud Functions)

**New Files:**
- `functions/src/creditManagement.ts` - Core credit system logic: reset checking, deduction, initialization

**Modified Files:**
- `functions/src/openAIActions.ts` - Add credit deduction to `generateUnifiedGalaxyMapHttpsEndpoint`, `generateInstructionsForMissionHttpsEndpoint`, `generateSquadReportHttpsEndpoint`
- `functions/src/refiners/refine-structure.ts` - Add credit deduction to `refineStructureHttpsEndpoint`
- `functions/src/lib/utils.ts` - Already has token usage utilities (`createModelTokenUsage`, `createCombinedTokenUsage`), may need credit conversion helpers
- `functions/src/presence.ts` - Hook credit reset check into presence system (online event)

### Frontend Files (Vue.js)

**New Files:**
- `src/utils/creditGuard.ts` - Credit checking utility similar to `paywallGuard.ts`
- `src/components/Home/UserBar/CreditDisplay.vue` - Optional: Extracted credit display component

**Modified Files:**
- `src/store/index.ts` - Add credit state to user object, add actions for `getUserCredits`, `setUserCredits`, `watchCreditChanges`
- `src/main.ts` - Initialize credit watchers on auth state change
- `src/components/Home/UserBar.vue` - Add credit balance display after "Colour Theme" section
- `src/components/Dialogs/AICreateGalaxyDialog.vue` - Add credit guard, display balance/cost estimate, update balance after generation
- `src/views/AiGalaxyEdit.vue` - Add credit guard for structure refinement and mission generation
- `src/components/Reused/PaywallSnackbar.vue` - Enhance messaging for credit-specific scenarios (show time until reset, current balance)

### Data Schema

**Modified Collections:**
- `people/{personId}` - Add fields:
  - `credits: number` - Current credit balance (default: 300 for free, 10000 for premium)
  - `lastCreditReset: timestamp` - Last time credits were reset
  - `creditsLifetimeUsed: number` - Total credits spent (optional analytics)

### Testing Files

**New Files:**
- `functions/src/creditManagement.test.ts` - Unit tests for credit management functions
- `src/utils/creditGuard.test.ts` - Unit tests for credit guard
- `tests/e2e/ai-credit-system.spec.ts` - E2E tests for credit system flow

## Implementation Plan

### Phase 1: Foundation
1. **Backend credit management infrastructure**
   - Create `creditManagement.ts` with core utilities
   - Add Firestore schema fields to `people` collection
   - Implement credit conversion constants and formulas
   - Write unit tests for credit calculation logic

2. **Frontend state management**
   - Add credit fields to Pinia store user state
   - Create actions for fetching and updating credits
   - Add credit watcher (real-time Firestore listener)
   - Initialize credit fetching on login

### Phase 2: Core Implementation
1. **Backend credit deduction**
   - Modify AI Cloud Functions to deduct credits after successful calls
   - Use Firestore transactions to prevent race conditions
   - Return updated credit balance in API responses
   - Handle errors gracefully (don't deduct if AI call fails)

2. **Frontend credit enforcement**
   - Create `creditGuard.ts` utility for pre-call validation
   - Integrate guard into AI dialog components
   - Update credit balance from backend responses
   - Show PaywallSnackbar when credits exhausted

3. **Credit reset logic**
   - Hook into presence system to detect user login
   - Check if reset period elapsed (24h for free, 30d for premium)
   - Hard reset credits to tier allowance if needed
   - Update `lastCreditReset` timestamp

### Phase 3: Integration
1. **UI/UX implementation**
   - Add credit display to UserBar component
   - Add credit balance/estimate to AI dialogs
   - Enhance PaywallSnackbar with credit messaging
   - Add visual feedback (colors, warnings for low credits)

2. **Testing and validation**
   - Write comprehensive unit tests
   - Create E2E tests for full credit flow
   - Test edge cases (race conditions, errors, legacy users)
   - Validate reset logic with different timezones/schedules

3. **Documentation and deployment**
   - Update Firestore security rules for credit fields
   - Document credit system in README_SUBSCRIPTIONS.md
   - Create migration plan for existing users
   - Deploy to staging and test end-to-end

## Step by Step Tasks

### 1. Create Backend Credit Management Module

- Create `functions/src/creditManagement.ts`
- Define credit conversion constants:
  - `TOKENS_PER_CREDIT = 100`
  - `FREE_TIER_CREDITS = 300`
  - `PREMIUM_TIER_CREDITS = 10000`
  - `FREE_RESET_HOURS = 24`
  - `PREMIUM_RESET_DAYS = 30`
- Implement `getUserCredits(userId: string): Promise<number>`
  - Read from `people/{userId}` document
  - Return `credits` field or 0 if missing
- Implement `initializeUserCredits(userId: string, isPremium: boolean): Promise<void>`
  - Set initial credit balance based on tier
  - Set `lastCreditReset` to current timestamp
  - Set `creditsLifetimeUsed` to 0
- Implement `checkAndResetCredits(userId: string): Promise<void>`
  - Get user document with `credits`, `lastCreditReset`, and subscription status
  - Calculate time since last reset
  - If free user and >24 hours: reset to 300, update timestamp
  - If premium user and >30 days: reset to 10,000, update timestamp
  - Use Firestore transaction for atomicity
- Implement `deductCredits(userId: string, tokensUsed: number): Promise<{ success: boolean; newBalance: number }>`
  - Convert tokens to credits: `Math.ceil(tokensUsed / TOKENS_PER_CREDIT)`
  - Use Firestore transaction to read current balance and deduct
  - Update `creditsLifetimeUsed` counter
  - Allow balance to go negative (user can finish current operation)
  - Return new balance
- Write unit tests in `functions/src/creditManagement.test.ts`
  - Test credit reset logic (free 24h, premium 30d)
  - Test deduction calculations and rounding
  - Test transaction handling for concurrent deductions
  - Test initialization for new users

### 2. Integrate Credit Deduction into AI Cloud Functions

- Modify `functions/src/openAIActions.ts`
  - Import `deductCredits` from `creditManagement.ts`
  - In `generateUnifiedGalaxyMapHttpsEndpoint`:
    - Extract `userId` from `context.auth.uid`
    - After successful AI response, get `totalTokens` from `combinedTokenUsage`
    - Call `await deductCredits(userId, totalTokens)`
    - Add `creditsDeducted` and `newCreditBalance` to return object
  - In `generateInstructionsForMissionHttpsEndpoint`:
    - Same pattern: deduct credits after successful generation
    - Return updated balance
  - In `generateSquadReportHttpsEndpoint`:
    - Same pattern for squad report generation
- Modify `functions/src/refiners/refine-structure.ts`
  - In `refineStructureHttpsEndpoint`:
    - Deduct credits after successful structure refinement
    - Return updated balance
- Add error handling:
  - Wrap credit deduction in try-catch
  - If deduction fails, log error but don't fail AI response
  - Return `creditsDeducted: 0, newCreditBalance: null` if error
- Write integration tests:
  - Test AI function calls deduct credits correctly
  - Test AI failures don't deduct credits
  - Test response includes credit information

### 3. Hook Credit Reset into Presence System

- Modify `functions/src/presence.ts`
  - In the presence trigger that detects user going online (`state: "online"`)
  - Import `checkAndResetCredits` from `creditManagement.ts`
  - Call `await checkAndResetCredits(uid)` when user comes online
  - Log reset events for debugging
- Test reset trigger:
  - Simulate user login after 24+ hours
  - Verify credits reset to tier allowance
  - Verify `lastCreditReset` updated

### 4. Add Credit State to Pinia Store

- Modify `src/store/index.ts`
  - Add to `getDefaultState()`:
    ```typescript
    user: {
      loggedIn: false,
      data: {
        // ... existing fields
        credits: null,
        lastCreditReset: null,
        creditsChecked: false,
        creditsLifetimeUsed: 0
      }
    }
    ```
  - Add action `setUserCredits(credits: number)`:
    ```typescript
    setUserCredits(credits: number) {
      if (!this.user.data) return;
      this.user.data.credits = credits;
    }
    ```
  - Add action `async getUserCredits(uid: string)`:
    ```typescript
    async getUserCredits(uid: string | null) {
      if (!uid || !this.user.loggedIn) return;

      try {
        const personDoc = await db.collection('people').doc(uid).get();
        const data = personDoc.data();

        if (!this.user.data) return;

        this.user.data.credits = data?.credits ?? 300; // Default to free tier
        this.user.data.lastCreditReset = data?.lastCreditReset ?? null;
        this.user.data.creditsLifetimeUsed = data?.creditsLifetimeUsed ?? 0;
        this.user.data.creditsChecked = true;
      } catch (error) {
        console.error('Failed to load user credits', error);
        this.user.data.creditsChecked = true;
      }
    }
    ```
  - Add action `watchCreditChanges(uid: string)`:
    ```typescript
    watchCreditChanges(uid: string | null) {
      if (!uid || !this.user.loggedIn) return;

      db.collection('people').doc(uid).onSnapshot((doc) => {
        const data = doc.data();
        if (!this.user.data) return;

        this.user.data.credits = data?.credits ?? 300;
        this.user.data.lastCreditReset = data?.lastCreditReset ?? null;
        this.user.data.creditsLifetimeUsed = data?.creditsLifetimeUsed ?? 0;
      });
    }
    ```
- Write unit tests for store actions

### 5. Initialize Credit Loading on App Start

- Modify `src/main.ts`
  - In `firebase.auth().onAuthStateChanged()` callback:
    ```typescript
    if (user) {
      // ... existing initialization
      void rootStore.getUserSubscriptions(user.uid);
      void rootStore.watchSubscriptionChanges(user.uid);

      // NEW: Initialize credit tracking
      void rootStore.getUserCredits(user.uid);
      void rootStore.watchCreditChanges(user.uid);
    }
    ```
- Test that credits load on login

### 6. Create Credit Guard Utility

- Create `src/utils/creditGuard.ts`
  ```typescript
  import useRootStore from "@/store/index";

  export async function guardAIActionOrPaywall(): Promise<boolean> {
    const store = useRootStore();
    const userData = store.user?.data || {};

    // Wait for credits to be checked
    if (!userData.creditsChecked) {
      store.setSnackbar({
        show: true,
        text: "Checking your AI credit balance...",
        color: "baseAccent",
      });
      return false;
    }

    const currentCredits = userData.credits || 0;

    // If credits depleted, show paywall
    if (currentCredits <= 0) {
      store.setPaywall({
        show: true,
        text: "You've run out of AI credits. Upgrade for more credits or wait for your daily reset.",
      });
      return false;
    }

    return true; // Proceed with AI call
  }
  ```
- Write unit tests in `src/utils/creditGuard.test.ts`
  - Test allows call when credits > 0
  - Test blocks call when credits = 0
  - Test blocks call when credits < 0
  - Test shows loading state when creditsChecked = false

### 7. Add Credit Display to UserBar

- Modify `src/components/Home/UserBar.vue`
  - Import credit state from store:
    ```typescript
    computed: {
      ...mapState(useRootStore, ['user']),
      userCredits() {
        if (!this.user?.data?.creditsChecked) return '...';
        return this.user?.data?.credits ?? 0;
      },
      hasActiveSubscription() {
        return Boolean(this.user?.data?.hasActiveSubscription);
      },
      creditColor() {
        const credits = this.userCredits;
        if (credits === '...') return 'grey';
        if (credits <= 0) return 'error';
        if (credits < 50) return 'warning';
        return 'success';
      },
      timeUntilReset() {
        // Calculate time until next reset based on lastCreditReset
        // Free: 24 hours, Premium: 30 days
        // Return formatted string like "8h 23m" or "5 days"
        const lastReset = this.user?.data?.lastCreditReset;
        if (!lastReset) return 'Soon';

        const resetPeriodMs = this.hasActiveSubscription
          ? 30 * 24 * 60 * 60 * 1000  // 30 days
          : 24 * 60 * 60 * 1000;      // 24 hours

        const nextReset = lastReset.toMillis() + resetPeriodMs;
        const msUntilReset = nextReset - Date.now();

        if (msUntilReset <= 0) return 'On next login';

        const hours = Math.floor(msUntilReset / (60 * 60 * 1000));
        const minutes = Math.floor((msUntilReset % (60 * 60 * 1000)) / (60 * 1000));

        if (hours >= 24) {
          const days = Math.floor(hours / 24);
          return `${days} day${days > 1 ? 's' : ''}`;
        }

        return `${hours}h ${minutes}m`;
      }
    }
    ```
  - Add credit display section after the Colour Theme row (after line ~93):
    ```vue
    <!-- AI Credit Balance Display -->
    <v-row class="pt-3">
      <v-col class="pa-0 d-flex justify-center">
        <p class="text-overline missionAccent--text ma-0">AI Credits</p>
      </v-col>
      <v-col class="pa-0 d-flex justify-center align-center">
        <v-chip
          small
          :color="creditColor"
          text-color="white"
        >
          {{ userCredits }} {{ userCredits === '...' ? '' : 'credits' }}
        </v-chip>
      </v-col>
    </v-row>
    <v-row>
      <v-col class="pa-0 px-4">
        <p class="caption text-center ma-0" style="font-size: 0.7rem !important; color: var(--v-missionAccent-base);">
          Resets {{ hasActiveSubscription ? 'monthly' : 'daily' }} • {{ timeUntilReset }}
        </p>
      </v-col>
    </v-row>
    ```
- Test credit display:
  - Shows loading state while credits loading
  - Shows correct balance
  - Shows correct color based on balance
  - Shows correct reset message for free vs premium

### 8. Integrate Credit Guard into AI Galaxy Creation Dialog

- Modify `src/components/Dialogs/AICreateGalaxyDialog.vue`
  - Import `guardAIActionOrPaywall` from `@/utils/creditGuard`
  - Import credit state:
    ```typescript
    computed: {
      ...mapState(useRootStore, ['user']),
      userCredits() {
        return this.user?.data?.credits ?? 0;
      },
      creditColor() {
        if (this.userCredits <= 0) return 'error';
        if (this.userCredits < 50) return 'warning';
        return 'info';
      }
    }
    ```
  - Add credit display before generate button (around the input area):
    ```vue
    <v-alert
      dense
      text
      :color="creditColor"
      icon="mdi-information"
      class="mb-4"
    >
      <span class="text-caption">
        You have <strong>{{ userCredits }} credits</strong> remaining
        <span class="text-caption grey--text"> (1 credit = 100 tokens)</span>
      </span>
    </v-alert>
    ```
  - Modify `handleGenerateGalaxyMap()` method:
    ```typescript
    async handleGenerateGalaxyMap() {
      // NEW: Check credits before proceeding
      const allowed = await guardAIActionOrPaywall();
      if (!allowed) return;

      // Existing generation logic...
      this.loading = true;

      try {
        const aiResponse = await generateGalaxyMap(...);

        // ... existing response handling

        // NEW: Update credits from backend response
        if (aiResponse.newCreditBalance !== undefined) {
          this.setUserCredits(aiResponse.newCreditBalance);

          // If depleted after call, show paywall
          if (aiResponse.newCreditBalance <= 0) {
            this.setPaywall({
              show: true,
              text: `You've used all your AI credits. ${
                this.user?.data?.hasActiveSubscription
                  ? 'Your credits will reset in ' + this.timeUntilReset + '.'
                  : 'Upgrade to premium for 10,000 monthly credits or wait for your daily reset.'
              }`
            });
          }
        }
      } catch (error) {
        // Existing error handling
      } finally {
        this.loading = false;
      }
    }
    ```
  - Add same pattern to clarification answer submission
  - Test:
    - Credit guard blocks generation when balance = 0
    - Credit balance updates after generation
    - Paywall shows if depleted after generation

### 9. Integrate Credit Guard into AI Galaxy Edit View

- Modify `src/views/AiGalaxyEdit.vue`
  - Import `guardAIActionOrPaywall`
  - Add credit display similar to creation dialog
  - Add credit guard to structure refinement function
  - Add credit guard to mission instruction generation
  - Update credits from backend responses
  - Show paywall if credits depleted

### 10. Enhance PaywallSnackbar for Credit Messaging

- Modify `src/components/Reused/PaywallSnackbar.vue`
  - Import credit state:
    ```typescript
    computed: {
      ...mapState(useRootStore, ['paywall', 'user']),
      userCredits() {
        return this.user?.data?.credits ?? 0;
      },
      hasActiveSubscription() {
        return Boolean(this.user?.data?.hasActiveSubscription);
      },
      showCreditInfo() {
        // Show credit info if paywall triggered by credit depletion
        return this.paywall.text?.includes('credit');
      },
      timeUntilReset() {
        // Same calculation as UserBar
      }
    }
    ```
  - Enhance dialog header to show credit context:
    ```vue
    <div class="dialog-header">
      <div class="d-flex flex-column">
        <div class="d-flex justify-space-between align-center">
          <div class="d-flex align-center">
            <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
            <p class="dialog-title ma-0 overline">{{ paywall.text }}</p>
          </div>
          <v-btn icon @click="setPaywall({ show: false, text: '' })">
            <v-icon color="missionAccent">{{ mdiClose }}</v-icon>
          </v-btn>
        </div>
        <p v-if="showCreditInfo" class="caption ma-0 mt-2 ml-8" style="color: var(--v-missionAccent-base);">
          Current balance: <strong>{{ userCredits }} credits</strong>
          <span v-if="!hasActiveSubscription">
            • Resets in {{ timeUntilReset }}
          </span>
        </p>
      </div>
    </div>
    ```
  - Test paywall shows credit information

### 11. Update Firestore Security Rules

- Modify `rules/firestore.rules`
  - Ensure users can read their own credit balance:
    ```
    match /people/{personId} {
      allow read: if request.auth != null && request.auth.uid == personId;

      // Users should NOT be able to write their own credits
      // Only backend Cloud Functions can update credits
      allow write: if false; // Handled by admin/functions only
    }
    ```
  - Test security rules in `rules/test-rules.js`

### 12. Write Comprehensive Tests

- Write backend unit tests (`functions/src/creditManagement.test.ts`)
  - Test all credit management functions
  - Test edge cases (negative balance, concurrent calls, legacy users)
- Write frontend unit tests (`src/utils/creditGuard.test.ts`)
  - Test credit guard logic
  - Test paywall triggering
- Write component tests
  - Test UserBar credit display
  - Test AI dialog credit integration
- Write E2E tests (`tests/e2e/ai-credit-system.spec.ts`)
  - Test complete flow: login → check credits → generate AI → verify deduction
  - Test credit reset on login after 24 hours
  - Test paywall when credits exhausted
  - Test premium user monthly allowance
- Run all tests: `npm run test:unit && npx playwright test`

### 13. Migration Plan for Existing Users

- Create one-time migration script or Cloud Function
  - Query all users in `people` collection without `credits` field
  - Initialize based on subscription status:
    - Free users: 300 credits
    - Premium users: 10,000 credits
  - Set `lastCreditReset` to current timestamp
  - Set `creditsLifetimeUsed` to 0
- Or handle lazily: Initialize credits on first AI call if missing

### 14. Update Documentation

- Update `README_SUBSCRIPTIONS.md`
  - Add section on AI Credit System
  - Explain credit conversion (1 credit = 100 tokens)
  - Document free vs premium allowances
  - Explain reset behavior
  - Add troubleshooting for credit issues
- Update Firestore schema documentation in `docs/firestore-schema.json`
  - Add credit fields to `people` collection

### 15. Run Validation Commands

- `npm run build` - Ensure no compilation errors
- `npm run lint` - Validate code quality
- `npm run test:unit` - Run unit tests
- `npx playwright test` - Run E2E tests
- `npm run dev` - Start dev server and manually test:
  - Login and verify credits displayed in UserBar
  - Generate AI galaxy and verify credits deduct
  - Exhaust credits and verify paywall appears
  - Login after 24 hours and verify reset (free user)
  - Test as premium user with 10,000 credits

## Testing Strategy

### Unit Tests

**Backend Tests (functions/src/creditManagement.test.ts):**
- `checkAndResetCredits()`:
  - Should reset free user credits after 24 hours
  - Should NOT reset if less than 24 hours passed
  - Should reset premium user credits after 30 days
  - Should hard reset regardless of remaining balance
- `deductCredits()`:
  - Should deduct correct credits for token usage
  - Should round up fractional credits
  - Should allow balance to go negative
  - Should update creditsLifetimeUsed
  - Should handle concurrent deductions with transactions
- `getUserCredits()`:
  - Should return 0 for users without credit field
- `initializeUserCredits()`:
  - Should initialize free user with 300 credits
  - Should initialize premium user with 10,000 credits
- AI Endpoint Integration:
  - Should deduct credits after generateUnifiedGalaxyMap
  - Should return newCreditBalance in response
  - Should not deduct credits if AI call fails

**Frontend Tests (src/utils/creditGuard.test.ts):**
- `guardAIActionOrPaywall()`:
  - Should allow AI call when credits > 0
  - Should block AI call when credits = 0
  - Should block AI call when credits < 0
  - Should wait if creditsChecked = false
  - Should block premium users when credits depleted
  - Should allow premium users with remaining balance

**Component Tests:**
- UserBar.vue:
  - Should display current credit balance
  - Should show warning color when credits < 50
  - Should show "Resets daily" for free users
  - Should show "Resets monthly" for premium users
  - Should show loading state while credits loading
- AICreateGalaxyDialog.vue:
  - Should check credits before generating galaxy
  - Should update credits after successful generation
  - Should show paywall if credits depleted after call
  - Should disable generate button when credits = 0

### Integration Tests

**Credit Flow End-to-End:**
- Should complete full AI generation flow with credit deduction
- Should reset credits on login after 24 hours
- Should not reset credits on login before 24 hours
- Should handle premium user monthly reset
- Should prevent AI calls when credits exhausted
- Should handle multiple AI calls depleting balance

### Edge Cases

- Should handle user with no credit field (legacy users)
- Should handle concurrent AI calls from same user (race conditions)
- Should handle AI call timeout without deducting credits
- Should handle fractional credit calculations correctly (ceiling)
- Should handle subscription status changing mid-session
- Should display time until reset accurately

## Acceptance Criteria

1. ✅ **Credit Tracking**: System accurately tracks and stores credit balance in Firestore `people/{personId}` collection
2. ✅ **Credit Deduction**: Every successful AI API call deducts credits based on token usage (1 credit = 100 tokens, rounded up)
3. ✅ **Free Tier Reset**: Free users' credits reset to 300 every 24 hours on login
4. ✅ **Premium Tier Reset**: Premium users' credits reset to 10,000 every 30 days on login
5. ✅ **Frontend Enforcement**: AI operations are blocked when credits ≤ 0, showing PaywallSnackbar
6. ✅ **Backend Security**: Credit deduction happens server-side in Cloud Functions, cannot be bypassed
7. ✅ **UserBar Display**: Credit balance is visible in UserBar settings menu with color coding (green/yellow/red)
8. ✅ **AI Dialog Display**: Credit balance and reset info shown in AI creation/editing dialogs
9. ✅ **Paywall Integration**: PaywallSnackbar shows credit-specific messaging with time until reset
10. ✅ **Real-time Updates**: Credit balance updates in real-time via Firestore listener
11. ✅ **Error Handling**: Failed AI calls do not deduct credits
12. ✅ **Race Condition Safety**: Concurrent AI calls use Firestore transactions to prevent incorrect deductions
13. ✅ **Legacy User Support**: Existing users without credit fields are initialized on first AI call or login
14. ✅ **Documentation**: README_SUBSCRIPTIONS.md updated with credit system documentation
15. ✅ **All Tests Pass**: Unit, integration, and E2E tests pass with 100% success rate

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions:

```bash
# 1. Build and type-check
npm run build

# 2. Lint frontend code
npm run lint

# 3. Build Cloud Functions
npm run build --workspace functions

# 4. Lint Cloud Functions
npm run lint --workspace functions

# 5. Run frontend unit tests
npm run test:unit

# 6. Run backend unit tests (if configured)
npm run test --workspace functions

# 7. Run E2E tests
npx playwright test tests/e2e/ai-credit-system.spec.ts

# 8. Manual testing in dev environment
npm run dev
# - Login as free user
# - Verify 300 credits shown in UserBar
# - Generate AI galaxy, verify credits deduct
# - Generate multiple times until depleted
# - Verify paywall appears at 0 credits
# - Logout, change system time +25 hours, login
# - Verify credits reset to 300
# - Login as premium user
# - Verify 10,000 credits shown
# - Verify "Resets monthly" message

# 9. Test with Firebase emulators (optional)
npm run dev:emulator
# - Repeat manual tests against emulator

# 10. Deploy to staging and smoke test
firebase deploy --only functions --project staging
# - Test end-to-end in staging environment
```

## Notes

### Implementation Considerations

1. **Event-Driven Reset vs Scheduled**: We chose event-driven (on login) over scheduled cron jobs to minimize database reads. This is more efficient but means users must login to receive their reset. This is acceptable since users must login to use AI features anyway.

2. **Hard Reset vs Top-Up**: We chose hard reset (always set to 300/10,000) over top-up (add credits up to cap) for simplicity and predictability. Users get a fresh allowance every period regardless of previous usage.

3. **Post-Deduction vs Pre-Authorization**: We chose post-deduction for simpler implementation. Credits deduct after AI call completes. Frontend pre-checks provide good UX, but backend doesn't block if balance would go slightly negative during execution.

4. **Credit Conversion Rate**: 1 credit = 100 tokens is a clean conversion that makes 100k tokens = 1000 credits (easy mental math). This can be adjusted if needed.

5. **Premium Allowance**: 10,000 credits = 1M tokens per month. At typical GPT-5 usage (~50k tokens per galaxy), this allows ~20 full galaxy generations per month, which should be generous for most premium users.

6. **Firestore Security**: Credit fields in `people` collection should be read-only for users. Only Cloud Functions should write to these fields to prevent manipulation.

7. **Real-time Updates**: Using Firestore listener ensures credit balance updates immediately after deduction without requiring page refresh.

8. **Backwards Compatibility**: Existing users without credit fields will be initialized to 300 credits (free tier default) on first AI call or login. Migration script optional.

### Future Enhancements

- **Usage Analytics Dashboard**: Show credit usage history, spending trends, cost per galaxy
- **Credit Purchase**: Allow users to buy additional credits (one-time purchase model)
- **Enterprise Plans**: Custom credit allowances for organizations
- **Credit Expiry**: Add expiration dates to unused credits
- **Referral Bonuses**: Award bonus credits for referrals
- **Rollover Credits**: Allow unused credits to rollover (up to cap)
- **Email Notifications**: Alert users when credits running low or when reset occurs
- **Detailed Cost Estimates**: Show estimated cost before AI generation based on input complexity
- **Credit Gifting**: Allow premium users to gift credits to students

### Cost Analysis

**Estimated OpenAI costs per user tier:**
- Free tier: 300 credits/day = 30k tokens/day = ~$0.0375/day at GPT-5 rates (assuming 50/50 input/output)
- Premium tier: 10,000 credits/month = 1M tokens/month = ~$1.25/month at GPT-5 rates
- Monthly cost for 1000 free users (if all max out daily): ~$1,125/month
- Monthly cost for 100 premium users (if all max out): ~$125/month

This creates sustainable API costs with clear upgrade incentive.

### Dependencies

No new NPM packages required. Uses existing:
- Firebase Admin SDK (already installed)
- Firestore (already installed)
- Pinia (already installed)
- All token usage utilities already exist in `functions/src/lib/utils.ts`

### Deployment Checklist

Before deploying to production:
- [ ] Run all validation commands with zero failures
- [ ] Test credit system end-to-end in staging environment
- [ ] Update Firestore security rules
- [ ] Document credit system in README_SUBSCRIPTIONS.md
- [ ] Create migration plan for existing users (or handle lazily)
- [ ] Set up monitoring/alerts for credit system errors
- [ ] Communicate credit system rollout to users (email, in-app announcement)
- [ ] Have rollback plan ready in case of issues
