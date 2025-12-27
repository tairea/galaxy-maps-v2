import { db } from "./_shared.js";
import * as functions from "firebase-functions";
import { FieldValue } from "firebase-admin/firestore";

// Credit conversion constants
export const TOKENS_PER_CREDIT = 100;
export const FREE_TIER_CREDITS = 300;
export const PREMIUM_TIER_CREDITS = 10000;
export const FREE_RESET_HOURS = 24;
export const PREMIUM_RESET_DAYS = 30;

/**
 * Get user's current credit balance from Firestore
 */
export async function getUserCredits(userId: string): Promise<number> {
  try {
    const userDoc = await db.collection("people").doc(userId).get();

    if (!userDoc.exists) {
      console.warn(`User ${userId} not found`);
      return 0;
    }

    const credits = userDoc.data()?.credits;
    return credits !== undefined ? credits : 0;
  } catch (error) {
    console.error("Error getting user credits:", error);
    return 0;
  }
}

/**
 * Initialize credits for a new user or user without credit fields
 */
export async function initializeUserCredits(
  userId: string,
  isPremium: boolean,
): Promise<void> {
  const initialCredits = isPremium ? PREMIUM_TIER_CREDITS : FREE_TIER_CREDITS;

  await db
    .collection("people")
    .doc(userId)
    .set(
      {
        credits: initialCredits,
        lastCreditReset: FieldValue.serverTimestamp(),
        creditsLifetimeUsed: 0,
      },
      { merge: true },
    );

  console.log(`Initialized ${userId} with ${initialCredits} credits (premium: ${isPremium})`);
}

/**
 * Check if user needs credit reset and perform reset if needed
 * Called when user comes online (via presence system)
 */
export async function checkAndResetCredits(userId: string): Promise<void> {
  try {
    await db.runTransaction(async (transaction) => {
      const userRef = db.collection("people").doc(userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        console.warn(`User ${userId} not found for credit reset`);
        return;
      }

      const userData = userDoc.data();
      const lastReset = userData?.lastCreditReset?.toDate();
      const hasActiveSubscription = userData?.hasActiveSubscription || false;

      // If no lastReset, initialize credits
      if (!lastReset) {
        transaction.set(
          userRef,
          {
            credits: hasActiveSubscription ? PREMIUM_TIER_CREDITS : FREE_TIER_CREDITS,
            lastCreditReset: FieldValue.serverTimestamp(),
            creditsLifetimeUsed: userData?.creditsLifetimeUsed || 0,
          },
          { merge: true },
        );
        console.log(
          `Initialized credits for ${userId} (premium: ${hasActiveSubscription})`,
        );
        return;
      }

      // Calculate time since last reset
      const now = new Date();
      const msSinceReset = now.getTime() - lastReset.getTime();
      const hoursSinceReset = msSinceReset / (1000 * 60 * 60);
      const daysSinceReset = hoursSinceReset / 24;

      let shouldReset = false;

      if (hasActiveSubscription) {
        // Premium users: reset every 30 days
        shouldReset = daysSinceReset >= PREMIUM_RESET_DAYS;
      } else {
        // Free users: reset every 24 hours
        shouldReset = hoursSinceReset >= FREE_RESET_HOURS;
      }

      if (shouldReset) {
        const newCredits = hasActiveSubscription
          ? PREMIUM_TIER_CREDITS
          : FREE_TIER_CREDITS;

        transaction.update(userRef, {
          credits: newCredits,
          lastCreditReset: FieldValue.serverTimestamp(),
        });

        console.log(
          `Reset credits for ${userId} to ${newCredits} (premium: ${hasActiveSubscription}, days since reset: ${daysSinceReset.toFixed(1)})`,
        );
      }
    });
  } catch (error) {
    console.error("Error checking/resetting credits:", error);
    throw error;
  }
}

/**
 * Deduct credits from user's balance after successful AI call
 * Uses transaction to prevent race conditions
 */
export async function deductCredits(
  userId: string,
  tokensUsed: number,
): Promise<{ success: boolean; newBalance: number; creditsDeducted: number }> {
  try {
    // Convert tokens to credits (round up)
    const creditsToDeduct = Math.ceil(tokensUsed / TOKENS_PER_CREDIT);

    const result = await db.runTransaction(async (transaction) => {
      const userRef = db.collection("people").doc(userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          `User ${userId} not found`,
        );
      }

      const userData = userDoc.data();
      const currentCredits = userData?.credits !== undefined ? userData.credits : 0;

      // Calculate new balance (can go negative during operation)
      const newBalance = currentCredits - creditsToDeduct;

      // Update user document
      transaction.update(userRef, {
        credits: newBalance,
        creditsLifetimeUsed: FieldValue.increment(creditsToDeduct),
      });

      console.log(
        `Deducted ${creditsToDeduct} credits from ${userId} (${tokensUsed} tokens, new balance: ${newBalance})`,
      );

      return { newBalance, creditsDeducted: creditsToDeduct };
    });

    return {
      success: true,
      newBalance: result.newBalance,
      creditsDeducted: result.creditsDeducted,
    };
  } catch (error) {
    console.error("Error deducting credits:", error);
    throw error;
  }
}

/**
 * Check if user has sufficient credits for an operation
 * This is a helper for backend validation
 */
export async function hasEnoughCredits(
  userId: string,
  estimatedTokens: number,
): Promise<boolean> {
  const currentCredits = await getUserCredits(userId);
  // Allow operation if balance > 0 (can go negative during operation)
  return currentCredits > 0;
}
