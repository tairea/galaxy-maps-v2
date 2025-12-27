# Credit System Testing Guide

## ✅ Deployment Status

**Date:** 2025-12-26
**Branch:** `merge-main-with-stripe-paywall`
**Status:** ✅ Successfully Deployed

### Deployed Components:

1. **Cloud Functions:**
   - `generateUnifiedGalaxyMapHttpsEndpoint` - Galaxy generation with credit deduction
   - `generateInstructionsForMissionHttpsEndpoint` - Mission instruction generation with credit deduction
   - `generateSquadReportHttpsEndpoint` - Squad report generation with credit deduction
   - `refineStructureHttpsEndpoint` - Structure refinement with credit deduction
   - `onUserStatusChangedOnUpdateTrigger` - Credit reset on user online (presence system)

2. **Firestore Security Rules:**
   - Users cannot modify `credits`, `lastCreditReset`, or `creditsLifetimeUsed` fields
   - Only Cloud Functions can write to these fields
   - Read access remains unchanged

3. **Frontend Components:**
   - `AICreateGalaxyDialog.vue` - Credit guard and display
   - `AiGalaxyEdit.vue` - Credit guard for refinement and mission generation
   - `PaywallSnackbar.vue` - Enhanced with credit balance and reset time
   - `UserBar.vue` - Credit display (already deployed)

### Recent Commits:
```
180302e Add functions/.env to gitignore
c6346e4 Fix linting issues in credit system files
b055a4e Integrate AI credit system UI and security rules
974da76 Add implementation guide for completing AI credit system
de78853 Implement AI credit system backend and state management
```

---

## 🧪 Manual Testing Checklist

### 1. Free User Credit Flow

**Test Case:** Verify free tier credits work correctly

1. **Login as a new user** (or clear existing user's credit history)
   ```
   Expected: User should have 300 credits
   ```

2. **Check UserBar display**
   - Location: Click on your avatar in top-right → UserBar panel
   - Expected Results:
     - Shows "AI Credits" section
     - Displays "300 credits" with color-coded chip
     - Shows "Resets daily" message
     - Shows time until next reset (e.g., "23h 45m")

3. **Generate an AI Galaxy**
   - Go to Galaxy List → Click "Create Galaxy" → Choose "AI Generate"
   - Fill in description and generate
   - Expected Results:
     - Credit balance alert shows before "Create Galaxy Map" button
     - Shows "You have 300 credits remaining (1 credit = 100 tokens)"
     - After generation completes, credits should decrease
     - UserBar updates with new balance (e.g., "150 credits remaining")

4. **Monitor credit deduction**
   - Check browser console for credit balance updates
   - Expected: Console log shows "Credit balance updated: [new_amount]"

5. **Generate multiple galaxies until depleted**
   - Keep generating until credits reach 0
   - Expected Results:
     - When credits = 0, paywall appears
     - Paywall shows:
       - "You've run out of AI credits..."
       - "Current balance: 0 credits"
       - "Resets in [time]"
       - Stripe pricing table

6. **Try to generate after depletion**
   - Attempt to create another AI galaxy
   - Expected: Paywall appears immediately (blocked by `guardAIActionOrPaywall()`)

---

### 2. Premium User Credit Flow

**Test Case:** Verify premium tier credits work correctly

1. **Login as a premium subscriber**
   ```
   Expected: User should have 10,000 credits
   ```

2. **Check UserBar display**
   - Expected Results:
     - Shows "10,000 credits"
     - Shows "Resets monthly" message
     - Shows days until next reset (e.g., "29 days")

3. **Generate AI content**
   - Generate galaxy, missions, refinements
   - Expected: Credits deduct normally

4. **Deplete credits (if testing)**
   - Manually set credits to 0 in Firestore (admin only)
   - Expected Results:
     - Paywall appears
     - Shows "Your credits will reset at the start of next month"
     - Does NOT show time until reset for premium users

---

### 3. Credit Reset Testing

**Test Case:** Verify credits reset correctly

#### Option A: Manual Firestore Update (Fastest)

1. Open Firebase Console → Firestore
2. Navigate to `people/{userId}`
3. Set `lastCreditReset` to 25 hours ago:
   ```
   lastCreditReset: Timestamp (now - 25 hours)
   ```
4. Logout and login again
5. Expected Results:
   - Credits reset to 300 (free) or 10,000 (premium)
   - `lastCreditReset` updates to current timestamp
   - UserBar shows updated balance

#### Option B: Natural Reset (24h wait)

1. Use all credits today
2. Wait 24 hours
3. Logout and login
4. Expected: Credits reset to 300

---

### 4. Real-time Updates Testing

**Test Case:** Verify real-time credit synchronization

1. **Open app in two browser tabs/windows**
2. **Login with the same account in both**
3. **Generate AI content in Tab 1**
4. **Watch Tab 2**
   - Expected: Credit balance updates automatically in Tab 2
   - No page refresh needed
   - Console shows "Credit balance updated: [amount]"

---

### 5. AI Galaxy Edit View Testing

**Test Case:** Verify credit guards in edit view

1. **Generate an AI galaxy**
2. **Click "Edit" to open AiGalaxyEdit view**
3. **Check credit display**
   - Expected: Credit balance alert shows near AI refinement controls

4. **Test Structure Refinement**
   - Enter refinement request (e.g., "Add a new star about Python")
   - Click "Refine"
   - Expected:
     - Credit guard checks balance before call
     - Credits deduct after refinement
     - Paywall appears if depleted

5. **Test Mission Generation**
   - Click "Generate Missions" button
   - Expected:
     - Credit guard checks balance before call
     - Credits deduct for each mission generated
     - Paywall appears if depleted during generation

---

### 6. Security Rules Testing

**Test Case:** Verify users cannot manipulate credits

1. **Open Browser Console**
2. **Try to manually update credits** (should fail):
   ```javascript
   firebase.firestore().collection('people').doc(uid).update({
     credits: 99999
   })
   ```
3. **Expected Result:**
   - Error: "Missing or insufficient permissions"
   - Credits remain unchanged

4. **Try to update other fields** (should succeed):
   ```javascript
   firebase.firestore().collection('people').doc(uid).update({
     displayName: 'Test User'
   })
   ```
5. **Expected Result:**
   - Success: Field updates
   - Credits fields remain protected

---

### 7. Error Handling Testing

**Test Case:** Verify graceful error handling

1. **Disconnect internet** (before AI call)
2. **Try to generate galaxy**
3. **Expected:**
   - Error message appears
   - Credits NOT deducted (only on successful AI call)
   - User can retry

---

### 8. Edge Cases

#### Test Case 8.1: Concurrent AI Calls

1. **Click "Generate Galaxy" multiple times rapidly**
2. **Expected:**
   - Only first call proceeds (prevented by `loading` flag)
   - No double deduction
   - Console shows "Already processing, ignoring duplicate submission"

#### Test Case 8.2: Negative Balance

1. **Have 50 credits remaining**
2. **Generate large galaxy** (uses 200 credits)
3. **Expected:**
   - AI call completes successfully
   - Balance goes negative (e.g., -150)
   - Paywall appears immediately
   - Next AI call is blocked

#### Test Case 8.3: Credits Not Checked Yet

1. **Fresh page load** (before getUserCredits completes)
2. **Try to generate AI content immediately**
3. **Expected:**
   - Guard returns false
   - Snackbar shows "Checking your AI credit balance..."
   - User must wait for credits to load

---

## 📊 Monitoring & Debugging

### Check Cloud Functions Logs

```bash
firebase functions:log --only generateUnifiedGalaxyMapHttpsEndpoint
```

Look for:
- "Deducted X credits from USER_ID"
- "Reset credits for USER_ID to X"
- Any error messages

### Check Firestore Data

Navigate to Firebase Console → Firestore → `people/{userId}`

Verify fields:
```javascript
{
  credits: 300,              // Current balance
  lastCreditReset: Timestamp, // Last reset time
  creditsLifetimeUsed: 500,  // Total credits ever used
  creditsChecked: true       // Frontend flag
}
```

### Browser Console Monitoring

Watch for:
```
Credit balance updated: 250
Deducted 50 credits from USER_ID (5000 tokens, new balance: 250)
```

---

## 🐛 Known Issues & Troubleshooting

### Issue: Credits show "..."

**Solution:**
- Wait for `getUserCredits()` to complete
- Check browser console for Firestore errors
- Verify Firestore read permissions

### Issue: Paywall doesn't appear at 0 credits

**Solution:**
- Check `guardAIActionOrPaywall()` is called before AI functions
- Verify `setPaywall` action is imported
- Check `creditsChecked === true`

### Issue: Credits not deducting

**Solution:**
- Check Cloud Functions logs for errors
- Verify `context.auth.uid` exists (user authenticated)
- Ensure backend returns `newCreditBalance`

### Issue: Credits not resetting after 24h

**Solution:**
- Check presence system is working (Realtime Database `/status/{uid}`)
- Verify `lastCreditReset` field exists
- Check Cloud Functions logs for "onUserStatusChangedOnUpdateTrigger"
- Manually trigger by logout/login

---

## ✅ Success Criteria

The credit system is working correctly when ALL of the following are true:

- [ ] UserBar displays credit balance with correct color coding
- [ ] Credits deduct after each AI API call
- [ ] Paywall appears when credits = 0
- [ ] Paywall blocks future AI calls
- [ ] Credits reset after 24h for free users
- [ ] Credits reset after 30d for premium users
- [ ] Real-time updates work across tabs
- [ ] Firestore rules prevent manual credit manipulation
- [ ] All Cloud Functions deploy without errors
- [ ] No console errors during normal usage

---

## 📚 Additional Resources

- **Design Spec:** `specs/2025-12-26-ai-credit-system.md`
- **Implementation Guide:** `IMPLEMENTATION_GUIDE.md`
- **Subscription Docs:** `README_SUBSCRIPTIONS.md`
- **Credit Guard Source:** `src/utils/creditGuard.ts`
- **Backend Logic:** `functions/src/creditManagement.ts`

---

## 🚀 Next Steps After Testing

1. **If all tests pass:**
   - Merge `merge-main-with-stripe-paywall` into `main`
   - Deploy to production
   - Monitor for first 24 hours

2. **If issues found:**
   - Document issue in this file
   - Create GitHub issue
   - Fix and re-deploy
   - Re-test

---

**Testing completed by:** _________________
**Date:** _________________
**Results:** ☐ Pass ☐ Fail ☐ Partial
**Notes:** ___________________________________________________
