# Galaxy Maps Subscription & Paywall System

This document describes the subscription and paywall implementation in Galaxy Maps, built on Stripe and the Firebase Stripe Payments extension.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup & Configuration](#setup--configuration)
4. [How It Works](#how-it-works)
5. [Implementation Patterns](#implementation-patterns)
6. [Free vs Premium Features](#free-vs-premium-features)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Galaxy Maps uses a freemium model with Stripe for subscription management. The system provides:

- **Free Tier**: Limited galaxy creation (3 galaxies max), basic features
- **Premium Tier**: Unlimited galaxy creation, advanced squad analytics, premium features

The implementation uses:
- **[@invertase/firestore-stripe-payments](https://github.com/invertase/firestore-stripe-payments)** - Official Stripe extension for Firebase
- **Stripe Pricing Tables** - Embedded subscription UI
- **Real-time Subscription Sync** - Automatic updates when subscriptions change

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                     User Authentication                      │
│                    (Firebase Auth)                          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  Subscription Watcher                        │
│            (main.ts - watchSubscriptionChanges)             │
│                                                              │
│  • Initializes on user login                                │
│  • Monitors Firestore customers/{uid}/subscriptions         │
│  • Updates Pinia store on changes                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Root Pinia Store                          │
│                  (src/store/index.ts)                       │
│                                                              │
│  user.data: {                                                │
│    isCustomer: boolean                                       │
│    hasActiveSubscription: boolean                            │
│    activeSubscription: object | null                         │
│    subscriptionChecked: boolean                              │
│  }                                                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Paywall    │ │   Feature    │ │   Premium    │
│   Guards     │ │   Dialogs    │ │   Overlays   │
│              │ │              │ │              │
│ • Galaxy     │ │ • Create     │ │ • Squad      │
│   creation   │ │   Galaxy     │ │   Analytics  │
│ • Feature    │ │ • Assign     │ │ • Help       │
│   access     │ │   Students   │ │   Requests   │
│              │ │              │ │ • Submissions│
└──────────────┘ └──────────────┘ └──────────────┘
        │               │               │
        └───────────────┼───────────────┘
                        ▼
        ┌───────────────────────────────┐
        │   PaywallSnackbar.vue         │
        │                               │
        │  • Stripe Pricing Table       │
        │  • Checkout Flow              │
        │  • Responsive Dialog          │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │      Stripe Checkout          │
        │                               │
        │  • Payment Collection         │
        │  • Subscription Creation      │
        └───────────────┬───────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │  Firestore Collections        │
        │                               │
        │  customers/{uid}/              │
        │    - subscriptions/            │
        │    - checkout_sessions/        │
        │                               │
        │  products/                     │
        │    - prices/                   │
        └───────────────────────────────┘
```

### Data Flow

1. **User Login** → Subscription watcher initialized
2. **Subscription Check** → Firestore query for active subscriptions
3. **Store Update** → User subscription status cached in Pinia
4. **Feature Check** → Components check `hasActiveSubscription`
5. **Paywall Trigger** → Show upgrade dialog if feature restricted
6. **Checkout** → Stripe Pricing Table handles payment
7. **Webhook** → Stripe notifies Firebase extension
8. **Sync** → Subscription watcher detects change, updates store

---

## Setup & Configuration

### 1. Install Stripe Firebase Extension

Install the [Stripe Payments Extension](https://firebase.google.com/products/extensions/firestore-stripe-payments) in your Firebase project:

```bash
firebase ext:install stripe/firestore-stripe-payments
```

During installation, configure:
- **Stripe API keys** (secret key from Stripe dashboard)
- **Products collection**: `products`
- **Customers collection**: `customers`

### 2. Configure Stripe Dashboard

1. Create products and pricing in [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create a [Pricing Table](https://dashboard.stripe.com/pricing-tables)
3. Note your **Pricing Table ID** and **Publishable Key**

### 3. Environment Variables

Add to your `.env` file:

```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_STRIPE_PRICING_TABLE_ID=prctbl_...
```

**Note**: These are **public** keys safe for client-side use. Secret keys should only be used in the Firebase extension configuration.

### 4. Firestore Security Rules

The Stripe extension automatically creates appropriate security rules for the `customers` collection. Verify in `firestore.rules`:

```javascript
// Allow users to read their own customer data
match /customers/{userId} {
  allow read: if request.auth.uid == userId;

  match /checkout_sessions/{id} {
    allow read, write: if request.auth.uid == userId;
  }

  match /subscriptions/{id} {
    allow read: if request.auth.uid == userId;
  }
}
```

### 5. NPM Dependencies

The required package is already in `package.json`:

```json
{
  "dependencies": {
    "@invertase/firestore-stripe-payments": "^0.0.8"
  }
}
```

---

## How It Works

### Initialization (main.ts)

When a user logs in, the subscription system initializes:

```typescript
// src/main.ts:47-48
firebase.auth().onAuthStateChanged(async (user) => {
  if (user) {
    // ... other initialization
    void rootStore.getUserSubscriptions(user.uid);
    void rootStore.watchSubscriptionChanges(user.uid);
  }
});
```

### Subscription State Management (store/index.ts)

#### User Subscription Status

```typescript
user: {
  loggedIn: boolean;
  data: {
    isCustomer: boolean;              // Has any Stripe customer record
    hasActiveSubscription: boolean;   // Has active/trialing subscription
    activeSubscription: object | null; // Full subscription object
    subscriptionChecked: boolean;     // Initial check completed
  }
}
```

#### Get User Subscriptions

```typescript
// src/store/index.ts:189-224
async getUserSubscriptions(uid: string | null) {
  if (!uid || !this.user.loggedIn) return;

  // Reset flags before fetching
  this.setUserSubscriptionStatus({
    isCustomer: false,
    hasActiveSubscription: false,
    activeSubscription: null,
    subscriptionChecked: false,
  });

  try {
    const subscriptions = await getCurrentUserSubscriptions(payments);

    const activeSubscription = subscriptions.find((subscription) =>
      ["trialing", "active"].includes(subscription.status)
    ) ?? null;

    this.setUserSubscriptionStatus({
      isCustomer: subscriptions.length > 0,
      hasActiveSubscription: Boolean(activeSubscription),
      activeSubscription,
      subscriptionChecked: true,
    });
  } catch (error) {
    console.error("Failed to load Stripe subscription", error);
    // Set checked to true even on error to unblock UI
    this.setUserSubscriptionStatus({
      isCustomer: false,
      hasActiveSubscription: false,
      activeSubscription: null,
      subscriptionChecked: true,
    });
  }
}
```

#### Watch Subscription Changes

```typescript
// src/store/index.ts:226-239
async watchSubscriptionChanges(uid: string | null) {
  if (!uid || !this.user.loggedIn) return;

  onCurrentUserSubscriptionUpdate(payments, (snapshot) => {
    for (const change of snapshot.changes) {
      console.log("watch subscription change", change);

      if (change.type === "added") {
        console.log(`New subscription added with ID: ${change.subscription.id}`);
      }

      // Refresh subscription status
      void this.getUserSubscriptions(uid);
    }
  });
}
```

### Paywall Dialog Component (PaywallSnackbar.vue)

The paywall dialog displays when a user hits a premium feature:

**Key Features:**
- Embedded Stripe Pricing Table (no custom checkout flow needed)
- Responsive design (mobile-friendly)
- Dynamically loads Stripe script
- Reads config from environment variables

**Component Structure:**

```vue
<template>
  <v-dialog v-model="paywall.show">
    <div class="create-dialog">
      <div class="dialog-header">
        <p>{{ paywall.text }}</p>
        <v-btn @click="setPaywall({ show: false, text: '' })">Close</v-btn>
      </div>

      <div class="create-dialog-content">
        <stripe-pricing-table
          v-if="stripeScriptLoaded"
          :pricing-table-id="stripePricingTableId"
          :publishable-key="stripePublishableKey"
        />
      </div>
    </div>
  </v-dialog>
</template>
```

**Script Loading:**

```javascript
mounted() {
  this.loadStripeScript();
},
methods: {
  loadStripeScript() {
    // Check if script already loaded
    if (document.querySelector('script[src="https://js.stripe.com/v3/pricing-table.js"]')) {
      this.stripeScriptLoaded = true;
      return;
    }

    // Dynamically inject Stripe pricing table script
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/pricing-table.js";
    script.async = true;
    script.onload = () => { this.stripeScriptLoaded = true; };
    document.head.appendChild(script);
  }
}
```

---

## Implementation Patterns

### Pattern 1: Paywall Guard (Galaxy Creation)

**Use Case**: Prevent action before it happens

**File**: `src/utils/paywallGuard.ts`

```typescript
export async function guardCreateGalaxyOrPaywall(opts?: {
  maxFree?: number;
  message?: string;
  getCreatedCount?: CountFn;
}): Promise<boolean> {
  const store = useRootStore();
  const maxFree = opts?.maxFree ?? 3;

  const userData = store.user?.data || {};
  const hasActiveSubscription = Boolean(userData.hasActiveSubscription);

  // Paid users always allowed
  if (hasActiveSubscription) return true;

  // Check if subscription status is still loading
  if (!userData.subscriptionChecked) {
    store.setSnackbar({
      show: true,
      text: "Hang tight — checking your subscription status.",
      color: "baseAccent",
    });
    return false;
  }

  // Count user's created galaxies
  const createdCount = await getCreatedCount();

  // Allow if under limit
  if (createdCount < maxFree) return true;

  // Show paywall
  const message = `You've created ${createdCount} galaxies. Free plan includes ${maxFree}. Upgrade to create more.`;
  store.setPaywall({ show: true, text: message });
  return false;
}
```

**Usage Example** (CreateEditDeleteGalaxyDialog.vue):

```javascript
async handleCreateButtonClick() {
  const allowed = await guardCreateGalaxyOrPaywall({
    maxFree: 3,
    message: "Free plan includes 3 galaxies. Upgrade to create more.",
  });

  if (!allowed) return; // Stop if paywall triggered

  // Continue with galaxy creation
  this.dialog = true;
}
```

### Pattern 2: Premium Content Overlay

**Use Case**: Blur content and show upgrade overlay

**File**: `src/components/CohortList/CohortPanelV2.vue`

**Computed Properties:**

```javascript
computed: {
  hasActiveSubscription() {
    return Boolean(this.user?.data?.hasActiveSubscription);
  },
  isPremiumFeatureRestricted() {
    return !this.hasActiveSubscription;
  }
}
```

**Template:**

```vue
<div class="main-col" :class="{ 'premium-restricted': isPremiumFeatureRestricted }">
  <!-- Content area (blurred if restricted) -->
  <div :class="{ 'premium-content-blurred': isPremiumFeatureRestricted }">
    <ProgressionLineChart :data="chartData" />
    <ActivityBarChart :data="activityData" />
  </div>

  <!-- Overlay message -->
  <div v-if="isPremiumFeatureRestricted && !paywall.show" class="premium-overlay">
    <div class="premium-message overline">
      <p class="mb-2">Premium feature</p>
      <p class="mb-0">
        Please
        <a href="#" @click.prevent="handleUpgradeClick" class="upgrade-link">upgrade</a>
        to access this feature
      </p>
    </div>
  </div>
</div>
```

**Styles:**

```scss
.main-col {
  position: relative;

  &.premium-restricted {
    .premium-content-blurred {
      filter: blur(4px);
      pointer-events: none;
      user-select: none;
    }

    .premium-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      z-index: 10;
      background-color: rgba(0, 0, 0, 0.6);
      padding: 20px;
      border-radius: 8px;

      .premium-message {
        color: white;
        font-weight: bold;
      }

      .upgrade-link {
        color: var(--v-primary-base);
        text-decoration: underline;
        cursor: pointer;
      }
    }
  }
}
```

**Method:**

```javascript
methods: {
  handleUpgradeClick() {
    this.setPaywall({
      show: true,
      text: "A Galaxy Maps subscription is required to see Squad data.",
    });
  }
}
```

### Pattern 3: Skip Data Fetching (Performance Optimization)

**Use Case**: Prevent unnecessary API calls for restricted features

**File**: `src/components/CohortList/CohortPanelV2.vue:184-190`

```javascript
mounted() {
  // Check if user is cohort teacher
  this.checkIfCohortTeacher();

  // Skip data fetching if premium is restricted
  if (this.isPremiumFeatureRestricted) {
    this.cohortsCoursesData = [];
    this.cohortActivityData = [];
    this.cohortsCoursesDataLoading = false;
    this.cohortActivityDataLoading = false;
    return;
  }

  // Fetch premium data only if allowed
  this.fetchCohortData();
}
```

### Pattern 4: Component Props for Restriction

**Use Case**: Pass restriction status to child components

**Parent** (CohortView.vue):

```javascript
computed: {
  hasActiveSubscription() {
    return Boolean(this.user?.data?.hasActiveSubscription);
  },
  isPremiumRestricted() {
    return !this.hasActiveSubscription;
  }
}
```

```vue
<RequestForHelpTeacherFrame
  :isPremiumRestricted="isPremiumRestricted"
  :courses="courses"
/>
```

**Child** (RequestForHelpTeacherFrame.vue):

```javascript
props: [
  'isPremiumRestricted',
  // ... other props
]
```

```vue
<div :class="{ 'premium-restricted': isPremiumRestricted }">
  <div :class="{ 'premium-content-blurred': isPremiumRestricted }">
    <!-- Content -->
  </div>

  <div v-if="isPremiumRestricted && !paywall.show" class="premium-overlay">
    <!-- Upgrade message -->
  </div>
</div>
```

---

## Free vs Premium Features

### Free Tier

**Included:**
- ✅ Create up to **3 galaxy maps**
- ✅ Browse and discover public galaxies
- ✅ Join cohorts as a student
- ✅ Complete missions and track progress
- ✅ Submit work and request help
- ✅ Basic user dashboard
- ✅ AI galaxy generation (within creation limit)

**Restricted:**
- ❌ Create more than 3 galaxies
- ❌ Squad analytics (charts, graphs)
- ❌ Cohort activity tracking
- ❌ Student progress visualization
- ❌ Detailed submission reviews (blurred)
- ❌ Advanced help request panels (blurred)

### Premium Tier

**Unlocks:**
- ✅ **Unlimited galaxy creation**
- ✅ **Full squad analytics dashboard**
  - Student progression charts
  - Activity bar charts
  - Time tracking
- ✅ **Advanced cohort management**
  - Detailed student cards
  - Activity timelines
  - Performance metrics
- ✅ **Premium teaching tools**
  - Submission review panels
  - Help request management
  - Student data export

---

## Testing

### Manual Testing

#### 1. Test Free User Experience

```bash
# 1. Create new account (no subscription)
# 2. Navigate to galaxy creation
# 3. Create 3 galaxies
# 4. Try to create 4th galaxy → Should trigger paywall
# 5. Navigate to cohort view (as teacher)
# 6. Verify analytics are blurred with upgrade overlay
```

#### 2. Test Subscription Purchase Flow

```bash
# 1. Trigger paywall
# 2. Verify Stripe Pricing Table loads
# 3. Use Stripe test card: 4242 4242 4242 4242
# 4. Complete checkout
# 5. Verify redirect back to app
# 6. Verify subscription status updates (check console logs)
# 7. Verify premium features now accessible
```

#### 3. Test Subscription Sync

```bash
# 1. Subscribe via Stripe Pricing Table
# 2. Check browser console for "watch subscription change" logs
# 3. Refresh page
# 4. Verify subscription persists
# 5. Cancel subscription via Stripe Dashboard
# 6. Verify app detects cancellation
```

### Stripe Test Cards

Use these in test mode:

| Card Number         | Scenario                    |
|---------------------|----------------------------|
| 4242 4242 4242 4242 | Successful payment         |
| 4000 0025 0000 3155 | 3D Secure authentication   |
| 4000 0000 0000 9995 | Declined payment           |

**Test Mode Setup:**
1. Use test API keys in Firebase extension config
2. Set `VITE_STRIPE_PUBLISHABLE_KEY` to test publishable key
3. Payments won't be charged

### Debugging Subscription Issues

**Enable Console Logging:**

```javascript
// Check subscription status in browser console
console.log(rootStore.user.data);

// Expected output:
{
  isCustomer: true,
  hasActiveSubscription: true,
  activeSubscription: { ... },
  subscriptionChecked: true
}
```

**Check Firestore Data:**

```
Firebase Console → Firestore Database
→ customers/{userId}/subscriptions/{subscriptionId}

Document should contain:
- status: "active" or "trialing"
- created: timestamp
- current_period_end: timestamp
- items: [...]
```

**Verify Extension Logs:**

```bash
# Check Firebase Functions logs for Stripe webhooks
firebase functions:log --only ext-firestore-stripe-payments
```

---

## Troubleshooting

### Paywall Shows But User Has Active Subscription

**Cause**: Subscription status not loaded or cached

**Solution**:
1. Check browser console for errors in `getUserSubscriptions()`
2. Verify Firestore security rules allow reading `customers/{uid}/subscriptions`
3. Force refresh: Logout → Login
4. Check `subscriptionChecked` flag in store

### Pricing Table Doesn't Load

**Cause**: Stripe script failed to load or incorrect config

**Solution**:
1. Check browser console for script errors
2. Verify `.env` has correct `VITE_STRIPE_PRICING_TABLE_ID` and `VITE_STRIPE_PUBLISHABLE_KEY`
3. Verify pricing table exists in Stripe Dashboard
4. Check network tab for `https://js.stripe.com/v3/pricing-table.js` load

### Subscription Doesn't Sync After Purchase

**Cause**: Webhook not configured or extension not installed

**Solution**:
1. Verify Stripe Firebase Extension is installed: `firebase ext:list`
2. Check webhook endpoint in Stripe Dashboard → Developers → Webhooks
3. Verify webhook events are enabled:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Check Firebase Functions logs for webhook errors

### Free Limit Not Working

**Cause**: Count function not finding created galaxies

**Solution**:
1. Check `guardCreateGalaxyOrPaywall()` count logic
2. Verify galaxy store is populated: `galaxyListStore.courses`
3. Check filter logic matches course ownership criteria
4. Add debug logging:
   ```javascript
   console.log("Created count:", createdCount);
   console.log("Max free:", maxFree);
   ```

### Premium Features Still Blurred After Subscribe

**Cause**: Store not updated or component not reactive

**Solution**:
1. Check if `hasActiveSubscription` computed property exists
2. Verify component imports `user` from root store
3. Force component re-render: navigate away and back
4. Check if `watchSubscriptionChanges()` is running (console logs)

---

## Commit History

This subscription system was implemented in the following commits on the `merge-main-with-stripe-paywall` branch:

| Commit | Date | Description |
|--------|------|-------------|
| `5036df1` | Sep 19, 2025 | subscription sandbox connected |
| `c84e48e` | - | paywall plugged in |
| `671dd8a` | - | add paywall pricing table ui |
| `af32687` | Dec 26, 2025 | moved public keys to env |
| `cfe9b93` | Dec 26, 2025 | paywalls added to squad view panels |
| `df2ca0c` | Dec 26, 2025 | tweak to paywall messages |
| `c3c5cfc` | Dec 26, 2025 | added max galaxy creation limit |
| `0d748f4` | Dec 26, 2025 | added paywall to squad list panels |

---

## Related Files

### Core Implementation

- `src/store/index.ts` - Subscription state management
- `src/utils/paywallGuard.ts` - Paywall guard utilities
- `src/components/Reused/PaywallSnackbar.vue` - Paywall dialog component

### Protected Features

**Galaxy Creation:**
- `src/components/Dialogs/CreateEditDeleteGalaxyDialog.vue`
- `src/views/GalaxyList.vue`
- `src/views/MyGalaxiesList.vue`
- `src/views/AllPublicGalaxiesList.vue`

**Squad Analytics:**
- `src/components/CohortList/CohortPanelV2.vue`
- `src/components/CohortView/StudentDataIterator.vue`
- `src/views/CohortView.vue`

**Premium Panels:**
- `src/components/Reused/RequestForHelpTeacherFrame.vue`
- `src/components/Reused/SubmissionTeacherFrame.vue`

**Student Management:**
- `src/components/Dialogs/AssignCohortDialog.vue`
- `src/components/Dialogs/StudentAccountsDialog.vue`
- `src/components/Dialogs/StudentEditDialog.vue`

---

## Future Enhancements

Potential improvements to the subscription system:

- **Usage Analytics**: Track feature usage by tier
- **Subscription Management**: In-app subscription management UI
- **Team Plans**: Multi-user organization subscriptions
- **Custom Pricing**: Per-organization pricing models
- **Trial Periods**: Automated trial workflows
- **Promo Codes**: Discount code support
- **Billing Portal**: Stripe Customer Portal integration
- **Usage Limits**: Fine-grained feature limits (e.g., students per cohort)
- **Webhooks**: Custom webhook handlers for subscription events
- **Email Notifications**: Subscription lifecycle emails

---

## Additional Resources

- [Stripe Payments Extension Docs](https://github.com/invertase/firestore-stripe-payments)
- [Stripe Pricing Tables Guide](https://stripe.com/docs/payments/checkout/pricing-table)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Firebase Extensions](https://firebase.google.com/products/extensions)

---

**Last Updated**: December 26, 2025
**Branch**: `merge-main-with-stripe-paywall`
**Status**: Ready for merge to `main`
