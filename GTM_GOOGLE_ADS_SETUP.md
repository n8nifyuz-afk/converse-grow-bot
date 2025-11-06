# Google Tag Manager Setup Guide for Google Ads Conversion Tracking

This guide walks you through setting up Google Ads conversion tracking in GTM for ChatLearn's three key events: `registration_complete`, `chat_start`, and `payment_complete`.

## Prerequisites

- Google Tag Manager account with container installed (✅ Already done - GTM-NMLGMTL5)
- Google Ads account with conversion actions created
- Access to both GTM and Google Ads accounts

---

## Part 1: Create DataLayer Variables

These variables will capture data from your events for use in tags.

### 1.1 Create GCLID Variable

**Purpose:** Capture the Google Click ID for conversion attribution

1. In GTM, go to **Variables** → **New**
2. Click **Variable Configuration**
3. Select **Data Layer Variable**
4. Configure:
   - **Data Layer Variable Name:** `gclid`
   - **Data Layer Version:** Version 2
5. **Save** as: `DLV - GCLID`

### 1.2 Create Transaction ID Variable (for payment events)

1. In GTM, go to **Variables** → **New**
2. Click **Variable Configuration**
3. Select **Data Layer Variable**
4. Configure:
   - **Data Layer Variable Name:** `transaction_id`
   - **Data Layer Version:** Version 2
5. **Save** as: `DLV - Transaction ID`

### 1.3 Create Value Variable (for payment events)

1. In GTM, go to **Variables** → **New**
2. Click **Variable Configuration**
3. Select **Data Layer Variable**
4. Configure:
   - **Data Layer Variable Name:** `value`
   - **Data Layer Version:** Version 2
5. **Save** as: `DLV - Value`

### 1.4 Create Currency Variable (for payment events)

1. In GTM, go to **Variables** → **New**
2. Click **Variable Configuration**
3. Select **Data Layer Variable**
4. Configure:
   - **Data Layer Variable Name:** `currency`
   - **Data Layer Version:** Version 2
5. **Save** as: `DLV - Currency`

---

## Part 2: Create Event Triggers

These triggers will fire when your custom events are pushed to the dataLayer.

### 2.1 Registration Complete Trigger

1. In GTM, go to **Triggers** → **New**
2. Click **Trigger Configuration**
3. Select **Custom Event**
4. Configure:
   - **Event name:** `registration_complete`
   - **This trigger fires on:** All Custom Events
5. **Save** as: `CE - Registration Complete`

### 2.2 Chat Start Trigger

1. In GTM, go to **Triggers** → **New**
2. Click **Trigger Configuration**
3. Select **Custom Event**
4. Configure:
   - **Event name:** `chat_start`
   - **This trigger fires on:** All Custom Events
5. **Save** as: `CE - Chat Start`

### 2.3 Payment Complete Trigger

1. In GTM, go to **Triggers** → **New**
2. Click **Trigger Configuration**
3. Select **Custom Event**
4. Configure:
   - **Event name:** `payment_complete`
   - **This trigger fires on:** All Custom Events
5. **Save** as: `CE - Payment Complete`

---

## Part 3: Create Conversion Actions in Google Ads

Before creating GTM tags, you need conversion actions in Google Ads.

### 3.1 Create Registration Conversion Action

1. In Google Ads, go to **Tools & Settings** → **Conversions**
2. Click **+ New conversion action**
3. Select **Website**
4. Configure:
   - **Goal and action optimization:** Sign-up
   - **Conversion name:** `Registration Complete`
   - **Value:** Don't use a value (or set a fixed value if desired)
   - **Count:** One
   - **Conversion window:** 30 days
   - **View-through conversion window:** 1 day
   - **Attribution model:** Data-driven (or Last click)
5. Click **Create and continue**
6. Select **Use Google Tag Manager**
7. **Note down the Conversion ID** (format: `AW-XXXXXXXXXX`)
8. **Note down the Conversion Label** (format: `xxxxxxxxxx`)

### 3.2 Create Chat Start Conversion Action

Repeat the same steps as above with:
- **Goal and action optimization:** Engagement / Other
- **Conversion name:** `Chat Start`
- **Count:** One
- Note down the Conversion Label (different from registration)

### 3.3 Create Payment Complete Conversion Action

Repeat the same steps as above with:
- **Goal and action optimization:** Purchase
- **Conversion name:** `Payment Complete`
- **Value:** Use different values for each conversion (transaction-specific)
- **Count:** One
- Note down the Conversion Label (different from others)

---

## Part 4: Create Google Ads Conversion Tags in GTM

Now connect your triggers to Google Ads conversions.

### 4.1 Registration Complete Conversion Tag

1. In GTM, go to **Tags** → **New**
2. Click **Tag Configuration**
3. Select **Google Ads Conversion Tracking**
4. Configure:
   - **Conversion ID:** `AW-16917874636` (your existing ID)
   - **Conversion Label:** [Paste the label from step 3.1]
   - **Conversion Value:** (leave empty or set static value)
   - **Transaction ID:** (leave empty for registration)
   - **Enable Enhanced Conversions:** ✅ Check this box
   - **Click Advanced Settings** → **Consent Settings**:
     - **Enable Enhanced Consent Mode:** ✅ Check this box
5. Click **Triggering**
6. Select: `CE - Registration Complete`
7. **Save** as: `Google Ads - Registration Conversion`

### 4.2 Chat Start Conversion Tag

1. In GTM, go to **Tags** → **New**
2. Click **Tag Configuration**
3. Select **Google Ads Conversion Tracking**
4. Configure:
   - **Conversion ID:** `AW-16917874636`
   - **Conversion Label:** [Paste the label from step 3.2]
   - **Conversion Value:** (leave empty)
   - **Transaction ID:** (leave empty)
   - **Enable Enhanced Conversions:** ✅ Check this box
   - **Enable Enhanced Consent Mode:** ✅ Check this box
5. Click **Triggering**
6. Select: `CE - Chat Start`
7. **Save** as: `Google Ads - Chat Start Conversion`

### 4.3 Payment Complete Conversion Tag

1. In GTM, go to **Tags** → **New**
2. Click **Tag Configuration**
3. Select **Google Ads Conversion Tracking**
4. Configure:
   - **Conversion ID:** `AW-16917874636`
   - **Conversion Label:** [Paste the label from step 3.3]
   - **Conversion Value:** `{{DLV - Value}}` (use the variable)
   - **Currency Code:** `{{DLV - Currency}}` (use the variable)
   - **Transaction ID:** `{{DLV - Transaction ID}}` (use the variable)
   - **Enable Enhanced Conversions:** ✅ Check this box
   - **Enable Enhanced Consent Mode:** ✅ Check this box
5. Click **Triggering**
6. Select: `CE - Payment Complete`
7. **Save** as: `Google Ads - Payment Conversion`

---

## Part 5: Test Your Setup

### 5.1 Use GTM Preview Mode

1. In GTM, click **Preview**
2. Enter your website URL with GCLID:
   ```
   https://www.chatl.ai/?gclid=TEST_GCLID_12345
   ```
3. Click **Connect**

### 5.2 Test Registration Event

1. In preview mode, navigate through signup flow
2. Complete registration
3. In GTM Preview:
   - Verify `registration_complete` event fires
   - Check that `Google Ads - Registration Conversion` tag fires
   - Verify GCLID is captured

### 5.3 Test Chat Start Event

1. In preview mode, send your first chat message
2. In GTM Preview:
   - Verify `chat_start` event fires
   - Check that `Google Ads - Chat Start Conversion` tag fires

### 5.4 Test Payment Event

1. Complete a test payment (use Stripe test mode)
2. In GTM Preview:
   - Verify `payment_complete` event fires
   - Check that `Google Ads - Payment Conversion` tag fires
   - Verify `value`, `currency`, and `transaction_id` are populated

---

## Part 6: Publish Your GTM Container

1. Click **Submit** in GTM
2. Add **Version Name:** `Google Ads Conversion Tracking Setup`
3. Add **Version Description:** `Added conversion tracking for registration, chat start, and payment events`
4. Click **Publish**

---

## Part 7: Verify in Google Ads

### 7.1 Check Conversion Status

1. In Google Ads, go to **Tools & Settings** → **Conversions**
2. Look for your conversion actions
3. Status should show:
   - **Unverified** initially (normal)
   - **Recording conversions** after first conversion fires
   - Takes 24-72 hours for status to update

### 7.2 Test Conversion (Recommended)

1. In Google Ads Conversions page, click on your conversion action
2. Look for **"Check your tag setup"** or **"Test your tag"**
3. Use your website URL with `?gclid=TEST` parameter
4. Complete the conversion action
5. Within a few hours, you should see a test conversion recorded

### 7.3 Monitor Real Conversions

1. Go to **Campaigns** → Select a campaign
2. Click **Columns** → **Modify columns**
3. Add **Conversions** columns for each conversion action
4. Wait 24-72 hours for conversions to appear

---

## Part 8: Advanced - Enhanced Conversions (Optional)

Enhanced Conversions improve accuracy by hashing user data. Already enabled in your tags!

**What it does:**
- Hashes email addresses, phone numbers, names
- Sends to Google Ads for better matching
- Improves conversion attribution

**Already configured in your app:**
- ✅ Consent Mode v2 enabled
- ✅ Enhanced Conversions enabled in tags
- ✅ GCLID passed with all events

---

## Troubleshooting

### Issue: Conversions not showing in Google Ads

**Check:**
1. ✅ GTM container published?
2. ✅ Conversion Label correct in GTM tags?
3. ✅ Conversion ID is `AW-16917874636`?
4. ✅ User has GCLID in URL or localStorage?
5. ✅ Wait 24-72 hours for data to appear

### Issue: Tags not firing in Preview

**Check:**
1. ✅ Event name exactly matches: `registration_complete`, `chat_start`, `payment_complete`
2. ✅ Trigger configured as Custom Event?
3. ✅ Check browser console for errors

### Issue: GCLID not captured

**Check:**
1. ✅ URL has `?gclid=` parameter from Google Ad?
2. ✅ Check localStorage: `localStorage.getItem('gclid')`
3. ✅ Check dataLayer: `window.dataLayer`

---

## Summary Checklist

- [ ] Created 4 DataLayer Variables (GCLID, Transaction ID, Value, Currency)
- [ ] Created 3 Custom Event Triggers (registration_complete, chat_start, payment_complete)
- [ ] Created 3 Conversion Actions in Google Ads
- [ ] Created 3 Google Ads Conversion Tags in GTM
- [ ] Tested all events in GTM Preview Mode
- [ ] Published GTM Container
- [ ] Verified conversions appearing in Google Ads (24-72 hours)

---

## Current Implementation Status

✅ **Frontend Tracking (Your App):**
- Consent Mode v2 enabled
- GCLID capture and storage (90-day expiry)
- URL parameter persistence
- Events firing correctly with GCLID
- All three events tracked: registration, chat start, payment

⚠️ **GTM Configuration (You Need to Do):**
- Create variables in GTM
- Create triggers in GTM
- Create conversion actions in Google Ads
- Create conversion tags in GTM
- Test and publish

---

## Support Resources

- [Google Ads Conversion Tracking Guide](https://support.google.com/google-ads/answer/1722022)
- [GTM Custom Events Documentation](https://support.google.com/tagmanager/answer/7679219)
- [Enhanced Conversions Setup](https://support.google.com/google-ads/answer/11062876)
- [Consent Mode v2 Guide](https://support.google.com/tagmanager/answer/10718549)

---

**Need Help?** Check your dataLayer: `console.log(window.dataLayer)` to verify events are firing correctly before troubleshooting GTM.
