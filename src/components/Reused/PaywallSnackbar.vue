<template>
  <v-dialog
    v-model="paywall.show"
    :width="isMobile ? '90%' : isTablet ? '60%' : '40%'"
    :fullscreen="isMobile"
    :transition="isMobile ? 'dialog-bottom-transition' : undefined"
    light
  >
    <div class="create-dialog" :class="{ 'mobile-dialog': isMobile }">
      <!-- HEADER -->
      <div class="dialog-header">
        <div class="d-flex justify-space-between align-center">
          <div class="d-flex align-center">
            <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
            <p class="dialog-title ma-0 overline">{{ paywall.text }}</p>
          </div>
          <v-btn icon @click="setPaywall({ show: false, text: '' })">
            <v-icon color="missionAccent">{{ mdiClose }}</v-icon>
          </v-btn>
        </div>
      </div>

      <!-- CONTENT -->
      <div class="create-dialog-content">
        <!-- Stripe pricing table -->
        <stripe-pricing-table
          v-if="stripeScriptLoaded"
          pricing-table-id="prctbl_1SifNj1FDuHOI0Uqq6oBXZmH"
          publishable-key="pk_live_51S8Ryu1FDuHOI0Uqm71LnxKcw50rb7K3pj5wxomtozrdCUXnGNxxpMgaMpQq3tRHaMGjiQfdriFdQHI1efZeXWNM005sI8u4Fs"
        >
        </stripe-pricing-table>
      </div>
    </div>
  </v-dialog>
</template>

<script lang="ts">
import { mapActions, mapState } from "pinia";
import useRootStore from "@/store/index";
import { getApp } from "firebase/app";
import { getStripePayments, createCheckoutSession } from "@invertase/firestore-stripe-payments";
import { db } from "@/store/firestoreConfig";
import { mdiClose, mdiInformationVariant } from "@mdi/js";
import Vue from "vue";

const app = getApp();
const payments = getStripePayments(app, {
  productsCollection: "products",
  customersCollection: "customers",
});

// Configure Vue to ignore the Stripe custom element
Vue.config.ignoredElements = [...(Vue.config.ignoredElements || []), "stripe-pricing-table"];

export default {
  name: "PaywallSnackbar",
  computed: {
    ...mapState(useRootStore, ["paywall", "user"]),
    isMobile(): boolean {
      return (this as any).$vuetify.breakpoint.smAndDown;
    },
    isTablet(): boolean {
      return (this as any).$vuetify.breakpoint.md;
    },
  },
  data: () => ({ loading: false, mdiClose, mdiInformationVariant, stripeScriptLoaded: false }),
  mounted() {
    this.loadStripeScript();
  },
  methods: {
    ...mapActions(useRootStore, ["setPaywall"]),
    loadStripeScript() {
      // Check if script is already loaded
      if (document.querySelector('script[src="https://js.stripe.com/v3/pricing-table.js"]')) {
        this.stripeScriptLoaded = true;
        return;
      }

      // Load the Stripe pricing table script
      const script = document.createElement("script");
      script.src = "https://js.stripe.com/v3/pricing-table.js";
      script.async = true;
      script.onload = () => {
        this.stripeScriptLoaded = true;
      };
      script.onerror = () => {
        console.error("Failed to load Stripe pricing table script");
      };
      document.head.appendChild(script);
    },
    async onUpgradeNow() {
      try {
        this.loading = true;
        const priceId = await this.fetchProPriceId();
        console.log("priceId", priceId);
        if (!priceId) throw new Error("Missing proPriceId");
        const session = await createCheckoutSession(payments, { price: priceId });
        console.log("checkoutSession", session);
        window.location.assign(session.url);
      } catch (e) {
        console.error("Failed to start checkout", e);
      } finally {
        this.loading = false;
      }
    },
    async fetchProPriceId(): Promise<string | null> {
      console.log("fetchProPriceId");
      try {
        const pricingDoc = await db.collection("appconfig").doc("pricing").get();
        if (!pricingDoc.data()) throw new Error("Missing pricing data");
        const pricingData = pricingDoc.data();
        console.log("pricingDoc", pricingData);
        return pricingData?.proPriceId ?? null;
      } catch (e) {
        console.error("Failed to load proPriceId", e);
        return null;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.create-dialog {
  color: var(--v-missionAccent-base);
  background-color: var(--v-background-base);
  border: 1px solid var(--v-missionAccent-base);
  display: flex;
  flex-wrap: wrap;
  overflow-x: hidden;

  .dialog-header {
    width: 100%;
    padding: 20px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--v-missionAccent-base);

    .dialog-title {
      color: var(--v-missionAccent-base);
      text-transform: uppercase;
    }
  }

  &.mobile-dialog {
    .dialog-header {
      position: sticky;
      top: 0;
      z-index: 10;
      background-color: var(--v-background-base);
    }
  }
}

.create-dialog-content {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  color: var(--v-missionAccent-base);
  padding: 20px;
  width: 100%;

  // Ensure Stripe pricing table is responsive
  stripe-pricing-table {
    width: 100%;
    max-width: 100%;
  }
}

// Mobile optimizations
@media (max-width: 960px) {
  .create-dialog-content {
    padding: 15px;
  }

  .dialog-header {
    padding: 15px !important;

    .dialog-title {
      font-size: 0.9rem;
    }
  }
}
</style>
