# GTM & GCLID Testing Guide

## Overview
This guide explains how to test Google Tag Manager (GTM), GCLID tracking, and Google Analytics events for:
1. **Registration Complete** - When a new user signs up
2. **Chat Start** - When a user creates their first chat
3. **Payment Complete** - When a user completes a subscription payment

## Prerequisites

### 1. Browser Setup
- **Use Chrome browser** (best for debugging)
- **Install Chrome extensions:**
  - Google Tag Assistant Legacy (for GTM debugging)
  - dataLayer Inspector+ (for viewing dataLayer events)
  
### 2. Open Developer Tools
Press `F12` or `Cmd+Option+I` (Mac) to open Chrome DevTools

### 3. Console Filtering
In the Console tab, you can filter logs by typing:
- `[GTM-INIT]` - GTM initialization logs
- `[GTM-REG]` - Registration tracking logs  
- `[GTM-CHAT]` - Chat start tracking logs
- `[GTM-PAY]` - Payment tracking logs

---

## Testing Scenarios

### Scenario 1: GCLID Capture & Storage

**Purpose:** Verify that GCLID from Google Ads is properly captured and stored

**Steps:**
1. **Add GCLID to URL**
   - Visit: `https://www.chatl.ai/?gclid=TEST_GCLID_123`
   
2. **Check Console Logs**
   Look for these logs:
   ```
   ═══════════════════════════════════════════════
   🎯 [GTM] initializeGTMWithGCLID() CALLED
   ═══════════════════════════════════════════════
   📊 [GTM-INIT] GCLID Status: {
     gclidFromUrl: "TEST_GCLID_123",
     gclidFromStorage: "NOT_IN_STORAGE",
     finalGclid: "TEST_GCLID_123"
   }
   💾 [GTM-INIT] GCLID saved to localStorage: TEST_GCLID_123
   ```

3. **Verify localStorage**
   - In Console, type: `localStorage.getItem('gclid')`
   - Should return: `"TEST_GCLID_123"`

4. **Check dataLayer**
   - Type: `window.dataLayer`
   - Should see an event with:
     ```javascript
     {
       event: "gtm_init",
       gclid: "TEST_GCLID_123",
       url_params: { gclid: "TEST_GCLID_123" }
     }
     ```

**Expected Result:** ✅ GCLID is captured in URL, saved to localStorage, and pushed to dataLayer

---

### Scenario 2: Registration Complete Event

**Purpose:** Verify registration tracking fires when a new user signs up

**Steps:**

1. **Clear Previous Tracking**
   ```javascript
   // In Console, run:
   localStorage.removeItem('gtm_registration_tracked');
   localStorage.removeItem('gclid'); // Optional: remove to test without GCLID
   ```

2. **Add GCLID (Optional but Recommended)**
   - Visit: `https://www.chatl.ai/?gclid=REG_TEST_456`
   - This simulates a user coming from Google Ads

3. **Sign Up as New User**
   - Click "Get Started" or "Sign In"
   - Complete phone or Google OAuth signup
   - Wait for redirect to main app

4. **Check Console Logs**
   You should see:
   ```
   ═══════════════════════════════════════════════
   🎯 [GTM] trackRegistrationComplete() CALLED
   ═══════════════════════════════════════════════
   📊 [GTM-REG] Check status: {
     dataLayerAvailable: true,
     alreadyTracked: false
   }
   🎯 [GTM-REG] Including GCLID: REG_TEST_456
   📤 [GTM-REG] Pushing to dataLayer: {
     event: "registration_complete",
     gclid: "REG_TEST_456"
   }
   ✅ [GTM-REG] Registration tracked successfully!
   ```

5. **Verify dataLayer**
   ```javascript
   // In Console:
   window.dataLayer.filter(e => e.event === 'registration_complete')
   ```
   Should return:
   ```javascript
   [{
     event: "registration_complete",
     gclid: "REG_TEST_456"
   }]
   ```

6. **Verify localStorage Flag**
   ```javascript
   localStorage.getItem('gtm_registration_tracked')
   ```
   Should return: `"true"`

7. **Test Deduplication**
   - Refresh the page
   - Should see: `⏭️ [GTM-REG] Registration already tracked, skipping...`
   - This prevents duplicate tracking

**Expected Result:** ✅ Registration event fires once with GCLID, then is blocked on subsequent page loads

---

### Scenario 3: Chat Start Event

**Purpose:** Verify chat tracking fires when user creates their first chat

**Steps:**

1. **Clear Chat Tracking**
   ```javascript
   // In Console:
   sessionStorage.removeItem('gtm_tracked_chats');
   ```

2. **Ensure GCLID is Set (Optional)**
   ```javascript
   localStorage.setItem('gclid', 'CHAT_TEST_789');
   ```

3. **Create New Chat**
   - On homepage, type a message and click Send
   - OR click "New Chat" in sidebar

4. **Check Console Logs**
   You should see:
   ```
   ═══════════════════════════════════════════════
   🎯 [GTM] trackChatStart() CALLED with chatId: abc-123-xyz
   ═══════════════════════════════════════════════
   📊 [GTM-CHAT] Check status: {
     chatId: "abc-123-xyz",
     alreadyTracked: false
   }
   🎯 [GTM-CHAT] Including GCLID: CHAT_TEST_789
   📤 [GTM-CHAT] Pushing to dataLayer: {
     event: "chat_start",
     gclid: "CHAT_TEST_789"
   }
   ✅ [GTM-CHAT] Chat start tracked successfully!
   ```

5. **Verify dataLayer**
   ```javascript
   window.dataLayer.filter(e => e.event === 'chat_start')
   ```
   Should return:
   ```javascript
   [{
     event: "chat_start",
     gclid: "CHAT_TEST_789"
   }]
   ```

6. **Verify sessionStorage**
   ```javascript
   sessionStorage.getItem('gtm_tracked_chats')
   ```
   Should contain: `"gtm_chat_start_abc-123-xyz"`

7. **Test Deduplication**
   - Create the same chat again (refresh page with same chat ID)
   - Should NOT track again
   - Check console: `⏭️ [GTM-CHAT] Chat already tracked, skipping...`

**Expected Result:** ✅ Chat start event fires once per unique chat with GCLID

---

### Scenario 4: Payment Complete Event

**Purpose:** Verify payment tracking fires when user completes subscription purchase

**Steps:**

1. **Setup GCLID (Optional but Recommended)**
   ```javascript
   localStorage.setItem('gclid', 'PAY_TEST_999');
   ```

2. **Initiate Payment**
   - Click "Go Pro" or "Upgrade" button
   - Select a plan (e.g., Pro Monthly - €39.99)
   - Complete Stripe checkout

3. **After Successful Payment**
   - You'll be redirected back to the app
   - The payment tracking should fire automatically

4. **Check Console Logs**
   You should see:
   ```
   ═══════════════════════════════════════════════
   🎯 [GTM] trackPaymentComplete() CALLED
   ═══════════════════════════════════════════════
   📊 [GTM-PAY] Payment details: {
     planType: "Pro",
     planDuration: "monthly",
     planPrice: 39.99,
     gclid: "PAY_TEST_999"
   }
   🎯 [GTM-PAY] Including GCLID: PAY_TEST_999
   📤 [GTM-PAY] Pushing to dataLayer: {
     event: "payment_complete",
     plan_type: "Pro",
     plan_duration: "monthly",
     plan_price: 39.99,
     currency: "USD",
     value: 39.99,
     gclid: "PAY_TEST_999"
   }
   ✅ [GTM-PAY] Payment event pushed successfully!
   ```

5. **Verify dataLayer**
   ```javascript
   window.dataLayer.filter(e => e.event === 'payment_complete')
   ```
   Should return:
   ```javascript
   [{
     event: "payment_complete",
     plan_type: "Pro",
     plan_duration: "monthly",
     plan_price: 39.99,
     currency: "USD",
     value: 39.99,
     gclid: "PAY_TEST_999"
   }]
   ```

6. **Important Notes:**
   - `plan_price` is a **number** (not string): `39.99` ✅ NOT `"€39.99"` ❌
   - `currency` is hardcoded to `"USD"` (GTM handles conversion)
   - `value` equals `plan_price` (standard ecommerce field)

**Expected Result:** ✅ Payment event fires with correct plan details, price as number, and GCLID

---

## Verifying in Google Tag Manager

### 1. GTM Preview Mode

1. Go to: https://tagmanager.google.com
2. Select your container (GTM-NMLGMTL5)
3. Click **Preview** button
4. Enter your site URL: `https://www.chatl.ai/?gclid=GTM_PREVIEW_TEST`
5. Click **Start**
6. A new tab opens with GTM debugging overlay

### 2. Check Events in GTM Preview

In the GTM debugging panel, you should see:

**Events List:**
- `gtm_init` (page load with GCLID)
- `registration_complete` (after signup)
- `chat_start` (after creating chat)
- `payment_complete` (after payment)

**Click each event to see:**
- Event name
- Variables (including GCLID)
- Tags that fired
- Tags that didn't fire (and why)

---

## Verifying in Google Analytics

### 1. Real-Time Reports

1. Go to: https://analytics.google.com
2. Navigate to: **Reports** → **Realtime** → **Events**
3. Perform actions (register, chat, pay)
4. Events should appear within 30 seconds

### 2. Check Event Parameters

Click on an event to see:
- `gclid` parameter
- `plan_type`, `plan_duration`, `plan_price` (for payment_complete)
- `value` and `currency` (for payment_complete)

### 3. Debug View (Recommended)

1. Install **Google Analytics Debugger** Chrome extension
2. Enable the extension
3. Refresh your site
4. Open DevTools → **Console** tab
5. You'll see detailed GA4 event tracking logs

---

## Common Issues & Solutions

### Issue 1: "dataLayer not available"

**Symptoms:**
```
❌ [GTM-REG] GTM dataLayer not available!
```

**Solution:**
- Check that GTM script is loaded in `index.html`
- Verify `window.dataLayer = window.dataLayer || [];` runs before GTM script
- Check browser console for script loading errors

---

### Issue 2: Events not appearing in GA

**Symptoms:**
- Events show in dataLayer
- Events don't appear in Google Analytics

**Solutions:**

1. **Check GTM Configuration:**
   - Verify triggers are set up for custom events
   - Verify GA4 tags are configured
   - Check that GA4 Measurement ID is correct

2. **Check Cookie Consent:**
   - User must accept analytics cookies
   - Check: `localStorage.getItem('cookieConsent')`
   - Should include `"analytics": true`

3. **Wait for Processing:**
   - Realtime events: 30 seconds to 2 minutes
   - Standard reports: 24-48 hours

---

### Issue 3: GCLID not captured

**Symptoms:**
```
⚠️ [GTM-REG] No GCLID found
```

**Solutions:**

1. **Check URL has GCLID:**
   - URL must include `?gclid=XXX` parameter
   - Check: `new URLSearchParams(window.location.search).get('gclid')`

2. **Check localStorage:**
   - GCLID is stored on first visit
   - Check: `localStorage.getItem('gclid')`

3. **Clear and Retry:**
   ```javascript
   localStorage.removeItem('gclid');
   // Then visit with GCLID in URL
   ```

---

### Issue 4: Duplicate Events

**Symptoms:**
- Same event tracked multiple times

**Solutions:**

1. **Registration:**
   - Check: `localStorage.getItem('gtm_registration_tracked')`
   - Clear if testing: `localStorage.removeItem('gtm_registration_tracked')`

2. **Chat:**
   - Check: `sessionStorage.getItem('gtm_tracked_chats')`
   - Clear if testing: `sessionStorage.removeItem('gtm_tracked_chats')`

3. **Payment:**
   - Payment uses session-based deduplication
   - Each unique Stripe `session_id` tracks once

---

## Testing Checklist

Use this checklist for complete testing:

### GCLID Tracking
- [ ] GCLID captured from URL
- [ ] GCLID saved to localStorage
- [ ] GCLID persists across page refreshes
- [ ] GCLID included in subsequent events

### Registration Event
- [ ] Event fires on new signup
- [ ] Event includes GCLID (if available)
- [ ] Event appears in dataLayer
- [ ] Event appears in GTM Preview
- [ ] Event appears in GA Realtime
- [ ] Event doesn't fire twice (deduplication works)

### Chat Start Event
- [ ] Event fires on first chat creation
- [ ] Event includes GCLID (if available)
- [ ] Event appears in dataLayer
- [ ] Event appears in GTM Preview
- [ ] Event appears in GA Realtime
- [ ] Event doesn't fire for same chat twice

### Payment Complete Event
- [ ] Event fires after successful payment
- [ ] Event includes correct plan_type (Pro/Ultra)
- [ ] Event includes correct plan_duration (monthly/3_months/yearly)
- [ ] Event includes correct plan_price as **NUMBER**
- [ ] Event includes currency: "USD"
- [ ] Event includes value (equals plan_price)
- [ ] Event includes GCLID (if available)
- [ ] Event appears in dataLayer
- [ ] Event appears in GTM Preview
- [ ] Event appears in GA Realtime
- [ ] Event doesn't fire twice for same payment

---

## Advanced: Simulating Full User Journey

Test the complete flow:

```bash
# 1. Visit site with GCLID
https://www.chatl.ai/?gclid=JOURNEY_TEST_2024

# 2. Sign up as new user
# → Should track: registration_complete with GCLID

# 3. Create first chat
# → Should track: chat_start with GCLID

# 4. Upgrade to Pro
# → Should track: payment_complete with GCLID and price

# 5. Verify in GTM Preview
# → All 3 events should show with same GCLID

# 6. Verify in GA Realtime
# → All 3 events should appear within 2 minutes
```

---

## Support & Debugging

If events still don't work after following this guide:

1. **Export dataLayer:**
   ```javascript
   console.log(JSON.stringify(window.dataLayer, null, 2));
   ```

2. **Check GTM container:**
   - Verify GTM container ID: `GTM-NMLGMTL5`
   - Check that container is published

3. **Check Google Ads:**
   - Verify conversion actions are set up
   - Check conversion tracking tag is active

4. **Contact Support:**
   - Provide console logs
   - Provide dataLayer export
   - Include GTM Preview screenshots
