# Google Tag Manager & GCLID Testing Guide

## Overview
This guide explains how to test that Google Tag Manager (GTM) and GCLID tracking are working correctly together for proper conversion attribution.

---

## What Was Fixed

### Previous Issues ❌
1. **GCLID captured but not sent to GTM** - Breaking the conversion attribution chain
2. **URL parameters not included in GTM events** - Missing attribution data
3. **No currency/value fields in payment events** - Incomplete conversion data

### Current Implementation ✅
1. **GCLID automatically pushed to dataLayer on page load** - Google Ads can now track conversions
2. **GCLID included in `registration_complete` and `payment_complete` events**
3. **All URL parameters (utm_source, gad_source, etc.) sent to GTM**
4. **Standard ecommerce fields added** (currency, value)

---

## How It Works

### 1. Page Load (Initialization)
```javascript
// On app load, GTM is initialized with GCLID
Event: 'gtm_init'
Data: {
  gclid: 'EAIaIQ...',
  url_params: {
    gclid: 'EAIaIQ...',
    gad_source: '1',
    gad_campaignid: '123456',
    utm_source: 'google',
    utm_medium: 'cpc'
  }
}
```

### 2. User Registration
```javascript
Event: 'registration_complete'
Data: {
  event: 'registration_complete',
  gclid: 'EAIaIQ...' // If available
}
```

### 3. Payment/Subscription
```javascript
Event: 'payment_complete'
Data: {
  event: 'payment_complete',
  plan_type: 'Pro',
  plan_duration: 'monthly',
  plan_price: 24.99,
  currency: 'USD',
  value: 24.99,
  gclid: 'EAIaIQ...' // If available
}
```

---

## Testing Methods

### Method 1: Test with Real GCLID (Recommended)

**Step 1: Create a Test URL**
```
https://www.chatl.ai/?gclid=TEST_GCLID_12345&gad_source=1&utm_source=google&utm_medium=cpc
```

**Step 2: Open in Private/Incognito Window**
- Chrome: `Ctrl+Shift+N` (Windows) or `Cmd+Shift+N` (Mac)
- This ensures no cached data interferes

**Step 3: Open Browser Console**
- Press `F12` or right-click → Inspect → Console tab

**Step 4: Check Console Logs**
Look for these logs:
```
🎯 Pushing GCLID to GTM dataLayer: TEST_GCLID_12345
🎯 Pushing URL params to GTM dataLayer: {gclid: "TEST_GCLID_12345", gad_source: "1", ...}
✅ GTM initialized with tracking parameters
```

**Step 5: Verify dataLayer**
In the console, type:
```javascript
window.dataLayer
```

You should see an array with your events:
```javascript
[
  {event: "gtm_init", gclid: "TEST_GCLID_12345", url_params: {...}},
  {event: "gtm.js", "gtm.start": 1234567890},
  ...
]
```

**Step 6: Test Registration Event**
1. Sign up for a new account
2. Check console for:
```
🎯 Including GCLID in registration event: TEST_GCLID_12345
🎯 Tracking registration to Google Analytics...
✅ Registration tracked successfully
```

3. Verify in console:
```javascript
window.dataLayer.find(e => e.event === 'registration_complete')
// Should return: {event: "registration_complete", gclid: "TEST_GCLID_12345"}
```

**Step 7: Test Payment Event** (if applicable)
1. Subscribe to a paid plan
2. Check console for:
```
🎯 Including GCLID in payment event: TEST_GCLID_12345
🎯 Pushing payment_complete event to GTM dataLayer...
✅ Payment event pushed
```

3. Verify in console:
```javascript
window.dataLayer.find(e => e.event === 'payment_complete')
// Should return: {event: "payment_complete", gclid: "TEST_GCLID_12345", plan_type: "Pro", ...}
```

---

### Method 2: Use GTM Preview Mode

**Step 1: Access GTM Container**
- Go to [Google Tag Manager](https://tagmanager.google.com/)
- Select your container (GTM-NMLGMTL5)

**Step 2: Enable Preview Mode**
1. Click **Preview** button (top right)
2. Enter your website URL with test GCLID:
   ```
   https://www.chatl.ai/?gclid=PREVIEW_TEST_12345
   ```
3. Click **Start** or **Connect**

**Step 3: View Events in Real-Time**
- GTM will show all events firing in real-time
- Click on each event to see the data being sent
- Verify `gclid` is present in `registration_complete` and `payment_complete` events

**Step 4: Check Variables**
- In GTM Preview, go to **Variables** tab
- Look for your GCLID variable
- Verify it's being populated correctly

---

### Method 3: Use Google Tag Assistant (Chrome Extension)

**Step 1: Install Extension**
- Install [Tag Assistant Legacy](https://chrome.google.com/webstore/detail/tag-assistant-legacy-by-g/kejbdjndbnbjgmefkgdddjlbokphdefk)

**Step 2: Enable Recording**
1. Click the extension icon
2. Click **Enable** on your site
3. Reload the page with GCLID parameter

**Step 3: Perform Actions**
- Navigate through your site
- Register for an account
- Make a payment (if testing)

**Step 4: View Report**
1. Click extension icon again
2. Click **Show Full Report**
3. Review all tags that fired
4. Verify GTM events include GCLID data

---

### Method 4: Network Tab Monitoring

**Step 1: Open DevTools Network Tab**
- Press `F12` → Network tab
- Filter by "google" or "gtm"

**Step 2: Visit with GCLID**
```
https://www.chatl.ai/?gclid=NETWORK_TEST_12345
```

**Step 3: Look for GTM Requests**
- Find requests to `www.googletagmanager.com`
- Click on them and check:
  - **Query String Parameters** tab
  - **Payload** tab
- Verify GCLID is being sent

**Step 4: Check Google Analytics Requests**
- Look for requests to `www.google-analytics.com` or `analytics.google.com`
- Verify conversion events include GCLID

---

## Expected Console Logs

### On Page Load
```
🎯 Pushing GCLID to GTM dataLayer: EAIaIQ...
🎯 Pushing URL params to GTM dataLayer: {gclid: "EAIaIQ...", gad_source: "1", ...}
✅ GTM initialized with tracking parameters
```

### On Registration
```
🎯 Including GCLID in registration event: EAIaIQ...
🎯 Tracking registration to Google Analytics...
✅ Registration tracked successfully with data: {...}
```

### On Payment
```
🎯 Including GCLID in payment event: EAIaIQ...
🎯 Pushing payment_complete event to GTM dataLayer...
✅ Payment event pushed to dataLayer: {event: "payment_complete", plan_type: "Pro", ...}
```

---

## Verifying in Google Ads

### Real Conversion Tracking (Production)

**Step 1: Set Up Conversion Action in Google Ads**
1. Go to [Google Ads](https://ads.google.com/)
2. Navigate to **Tools & Settings** → **Conversions**
3. Create conversion actions:
   - **Registration** (Sign-up)
   - **Payment** (Purchase)

**Step 2: Link Conversion Actions to GTM Events**
1. In Google Ads, get your Conversion ID and Label
2. In GTM, create a tag:
   - Tag Type: **Google Ads Conversion Tracking**
   - Conversion ID: Your ID (e.g., AW-16917874636)
   - Conversion Label: Your label
   - Trigger: Custom Event → `registration_complete` or `payment_complete`

**Step 3: Wait for Real Clicks**
- Click on your Google Ads
- Complete registration/payment
- Check Google Ads **Conversions** report (can take 24-48 hours)

**Step 4: Verify Attribution**
- In Google Ads, go to **Conversions** report
- Check if conversions are being attributed to the correct campaigns/keywords
- GCLID ensures proper attribution

---

## Database vs GTM: What's the Difference?

| Feature | Database (Backend) | GTM (Frontend) |
|---------|-------------------|----------------|
| **GCLID Storage** | ✅ Stored in `profiles` table | ✅ Sent via dataLayer |
| **Purpose** | Backend attribution, CRM, webhooks | Real-time analytics, Google Ads |
| **When** | On signup/login | On every page load & event |
| **Use Cases** | - Customer attribution<br>- Webhook data<br>- Manual analysis | - Google Ads conversion tracking<br>- Google Analytics<br>- Remarketing |
| **Testing** | Query `profiles` table | Check `window.dataLayer` |

**Both are needed** for complete conversion tracking!

---

## Troubleshooting

### Issue: "GTM dataLayer not available"
**Solution:**
- Ensure GTM script is loading before your app code
- Check browser console for script errors
- Verify you're not blocking GTM with ad blockers

### Issue: GCLID not appearing in dataLayer
**Check:**
1. URL actually has GCLID parameter
2. Browser console shows GCLID logs
3. localStorage has `gclid` key
4. No errors in console

### Issue: Events firing but no GCLID attached
**Check:**
1. GCLID was present when page loaded
2. User arrived via Google Ads (real traffic)
3. Check localStorage: `localStorage.getItem('gclid')`

### Issue: Conversions not showing in Google Ads
**Possible causes:**
1. Conversion tracking not set up in Google Ads
2. GTM tag not configured correctly
3. Events not firing (check GTM Preview)
4. Delay in reporting (wait 24-48 hours)
5. Ad blocker interfering

---

## Testing Checklist

- [ ] Open app with test GCLID URL
- [ ] Check console for initialization logs
- [ ] Verify `window.dataLayer` contains GCLID
- [ ] Register new account
- [ ] Check console for registration event logs
- [ ] Verify registration event in dataLayer
- [ ] Subscribe to paid plan (if testing payments)
- [ ] Check console for payment event logs
- [ ] Verify payment event in dataLayer with plan details
- [ ] Use GTM Preview mode to verify all events
- [ ] Check database: Query `profiles` table for GCLID
- [ ] Test with ad blocker disabled
- [ ] Test in incognito window

---

## Quick Test Commands

### Check dataLayer in Console
```javascript
// View all events
window.dataLayer

// Find specific events
window.dataLayer.filter(e => e.event)

// Check if GCLID is present
window.dataLayer.find(e => e.gclid)

// View registration event
window.dataLayer.find(e => e.event === 'registration_complete')

// View payment event
window.dataLayer.find(e => e.event === 'payment_complete')

// Check localStorage
localStorage.getItem('gclid')

// Check URL parameters
new URLSearchParams(window.location.search).get('gclid')
```

---

## Support & Resources

- **GTM Documentation**: https://support.google.com/tagmanager
- **Google Ads Conversion Tracking**: https://support.google.com/google-ads/answer/1722022
- **GTM Container ID**: GTM-NMLGMTL5
- **Google Ads ID**: AW-16917874636

For issues, check the browser console first - all tracking events are logged with emojis for easy identification! 🎯✅❌
