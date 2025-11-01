# Google Ads Test URLs

## Test URL with All Google Ads Parameters

Use this URL to test the complete Google Ads tracking implementation:

```
https://www.chatl.ai/?gclid=CjwKCAjwu9fHBhAWEiwAzGRC_y62zrgI0tjqumnsqIye4DjpyYn5O6ixxQhW58atVoVqtXrbCI5lmhoCmYoQAvD_BwE&gad_source=1&gad_campaignid=23041451890&gbraid=0AAAAA_GQRwqS_wGe_4oOGSfU6NMKgrYNF
```

## Parameters Breakdown

| Parameter | Value | Description |
|-----------|-------|-------------|
| `gclid` | `CjwKCAjwu9fHBhAWEiwAzGRC_y62zrgI0tjqumnsqIye4DjpyYn5O6ixxQhW58atVoVqtXrbCI5lmhoCmYoQAvD_BwE` | Google Click ID - Unique identifier for the ad click |
| `gad_source` | `1` | Google Ads source indicator |
| `gad_campaignid` | `23041451890` | Campaign ID from Google Ads |
| `gbraid` | `0AAAAA_GQRwqS_wGe_4oOGSfU6NMKgrYNF` | Google's browser identifier for attribution |

## Expected Behavior

### 1. On Page Load
You should see in console logs:
```
🎯 [GTM] initializeGTMWithGCLID() CALLED
📊 [GTM-INIT] GCLID Status: {
  gclidFromUrl: "CjwKCAjwu9fHBhAWEiwAzGRC_y62zrgI0tjqumnsqIye4DjpyYn5O6ixxQhW58atVoVqtXrbCI5lmhoCmYoQAvD_BwE",
  ...
}
💾 [GTM-INIT] URL parameters saved to localStorage: {
  gclid: "CjwKCAjwu9fHBhAWEiwAzGRC_y62zrgI0tjqumnsqIye4DjpyYn5O6ixxQhW58atVoVqtXrbCI5lmhoCmYoQAvD_BwE",
  gad_source: "1",
  gad_campaignid: "23041451890",
  gbraid: "0AAAAA_GQRwqS_wGe_4oOGSfU6NMKgrYNF"
}
```

### 2. After User Signs Up
You should see in console logs:
```
🎯 [SIGNUP-GOOGLE-ADS] Google Ads Parameters Captured: {
  gclid: "CjwKCAjwu9fHBhAWEiwAzGRC_y62zrgI0tjqumnsqIye4DjpyYn5O6ixxQhW58atVoVqtXrbCI5lmhoCmYoQAvD_BwE",
  gad_source: "1",
  gad_campaignid: "23041451890",
  gbraid: "0AAAAA_GQRwqS_wGe_4oOGSfU6NMKgrYNF"
}

✅ [SIGNUP-DB] Successfully saved to database: {
  gclid: "CjwKCAjwu9fHBhAWEiwAzGRC_y62zrgI0tjqumnsqIye4DjpyYn5O6ixxQhW58atVoVqtXrbCI5lmhoCmYoQAvD_BwE",
  gad_source: "1",
  gad_campaignid: "23041451890",
  gbraid: "0AAAAA_GQRwqS_wGe_4oOGSfU6NMKgrYNF",
  all_params: { ... }
}

📤 [SIGNUP-WEBHOOK] Sending webhook with Google Ads data: {
  gclid: "CjwKCAjwu9fHBhAWEiwAzGRC_y62zrgI0tjqumnsqIye4DjpyYn5O6ixxQhW58atVoVqtXrbCI5lmhoCmYoQAvD_BwE",
  gad_source: "1",
  gad_campaignid: "23041451890",
  gbraid: "0AAAAA_GQRwqS_wGe_4oOGSfU6NMKgrYNF"
}
```

### 3. In Webhook Edge Function Logs
Check Supabase Edge Function logs for `send-subscriber-webhook`:
```
🎯 [SUBSCRIBER-WEBHOOK-GOOGLE-ADS] Google Ads Parameters: {
  gclid: "CjwKCAjwu9fHBhAWEiwAzGRC_y62zrgI0tjqumnsqIye4DjpyYn5O6ixxQhW58atVoVqtXrbCI5lmhoCmYoQAvD_BwE",
  gad_source: "1",
  gad_campaignid: "23041451890",
  gbraid: "0AAAAA_GQRwqS_wGe_4oOGSfU6NMKgrYNF"
}
```

### 4. In Database
Query the `profiles` table:
```sql
SELECT 
  user_id, 
  email, 
  gclid, 
  url_params,
  created_at
FROM profiles
WHERE gclid = 'CjwKCAjwu9fHBhAWEiwAzGRC_y62zrgI0tjqumnsqIye4DjpyYn5O6ixxQhW58atVoVqtXrbCI5lmhoCmYoQAvD_BwE'
ORDER BY created_at DESC
LIMIT 5;
```

The `url_params` column should contain:
```json
{
  "gclid": "CjwKCAjwu9fHBhAWEiwAzGRC_y62zrgI0tjqumnsqIye4DjpyYn5O6ixxQhW58atVoVqtXrbCI5lmhoCmYoQAvD_BwE",
  "gad_source": "1",
  "gad_campaignid": "23041451890",
  "gbraid": "0AAAAA_GQRwqS_wGe_4oOGSfU6NMKgrYNF"
}
```

### 5. In n8n Webhook
The webhook at `https://adsgbt.app.n8n.cloud/webhook/subscriber` should receive:
```json
{
  "email": "user@example.com",
  "username": "User Name",
  "country": "US",
  "ip_address": "1.2.3.4",
  "user_id": "uuid-here",
  "signup_method": "google",
  "gclid": "CjwKCAjwu9fHBhAWEiwAzGRC_y62zrgI0tjqumnsqIye4DjpyYn5O6ixxQhW58atVoVqtXrbCI5lmhoCmYoQAvD_BwE",
  "urlParams": "{\"gclid\":\"CjwKCAjwu9fHBhAWEiwAzGRC_y62zrgI0tjqumnsqIye4DjpyYn5O6ixxQhW58atVoVqtXrbCI5lmhoCmYoQAvD_BwE\",\"gad_source\":\"1\",\"gad_campaignid\":\"23041451890\",\"gbraid\":\"0AAAAA_GQRwqS_wGe_4oOGSfU6NMKgrYNF\"}",
  "referer": "https://www.google.com/",
  "timestamp": "2025-11-01T10:00:00.000Z",
  "hasDocument": "false"
}
```

## Testing Scenarios

### Scenario 1: Direct Signup (No OAuth)
1. Open incognito window
2. Paste the test URL
3. Sign up with email
4. Check console logs and database

### Scenario 2: OAuth Signup (Google/Apple)
1. Open incognito window
2. Paste the test URL (parameters saved to localStorage)
3. Click "Sign in with Google"
4. Complete OAuth flow (redirects back without URL params)
5. Parameters should still be captured from localStorage
6. Check console logs and database

### Scenario 3: Multiple Parameters
Test with additional UTM parameters:
```
https://www.chatl.ai/?gclid=TEST_123&gad_source=1&gad_campaignid=23041451890&gbraid=0AAAAA_test&utm_source=google&utm_medium=cpc&utm_campaign=summer_sale
```

## Troubleshooting

### Issue: URL Params Empty in Webhook
**Solution**: Check if `localStorage.getItem('url_params')` contains the parameters. If yes, the OAuth redirect logic is working.

### Issue: Only gclid Saved, Not Other Parameters
**Solution**: Verify that `url_params` JSONB column in database contains all parameters, not just gclid.

### Issue: Parameters Lost After OAuth
**Solution**: Ensure localStorage persistence is working. Check for localStorage clearing or incognito mode issues.

## Quick Verification Commands

Open browser console and run:
```javascript
// Check what's in localStorage
console.log('GCLID:', localStorage.getItem('gclid'));
console.log('URL Params:', JSON.parse(localStorage.getItem('url_params') || '{}'));

// Check current URL parameters
console.log('Current URL:', window.location.href);
console.log('Current Params:', Object.fromEntries(new URLSearchParams(window.location.search)));

// Check dataLayer
console.log('DataLayer:', window.dataLayer);
```
