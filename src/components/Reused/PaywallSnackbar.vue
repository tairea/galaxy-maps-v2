<template>
  <v-snackbar
    v-model="paywall.show"
    timeout="30000"
    centered
  >
    <div class="d-flex flex-column align-center text-center">
      <div class="mb-2">
        {{ paywall.text }}
      </div>
      <div class="d-flex align-center mt-4">
        <v-btn
          color="baseAccent"
          class="mr-2"
          outlined
          @click="onUpgradeNow"
          :loading="loading"
        >
          Upgrade Now
        </v-btn>
      </div>
    </div>
    <template v-slot:action="{ attrs }">
      <v-btn
        icon
        class="mt-n4"
        v-bind="attrs"
        @click="setPaywall({ show: false, text: '' })"
      >
        <v-icon color="baseAccent">{{ mdiClose }}</v-icon>
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script lang="ts">
import { mapActions, mapState } from "pinia";
import useRootStore from "@/store/index";
import { getApp } from "firebase/app";
import { getStripePayments, createCheckoutSession } from "@invertase/firestore-stripe-payments";
import { db } from "@/store/firestoreConfig";
import { mdiClose } from "@mdi/js";

const app = getApp();
const payments = getStripePayments(app, {
  productsCollection: "products",
  customersCollection: "customers",
});

export default {
  name: "PaywallSnackbar",
  computed: {
    ...mapState(useRootStore, ["paywall", "user"]),
  },
  data: () => ({
    loading: false,
    mdiClose,
  }),
  methods: {
    ...mapActions(useRootStore, ["setPaywall"]),
    async onUpgradeNow() {
      try {
        this.loading = true;
        const priceId = await this.fetchProPriceId();
        console.log("priceId", priceId);
        if (!priceId) throw new Error("Missing proPriceId");
        const session = await createCheckoutSession(payments, {
          price: priceId
        });
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

<style scoped>
</style>


