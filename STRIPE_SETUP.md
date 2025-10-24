# Stripe Setup Guide - Test Mode vs Production

## Overview
Your app uses Stripe's **native trial system** for handling 3-day trial subscriptions. When users sign up for a trial, Stripe automatically handles the conversion to a paid monthly subscription after 3 days.

### How the Trial Flow Works:
1. **Day 0**: User signs up for trial via checkout
2. **Day 0-3**: User has full access to the Pro or Ultra Pro plan (trial period)
3. **Day 3**: Stripe automatically bills the customer for the monthly subscription
4. **Day 3**: Webhook receives `invoice.payment_succeeded` and tracks the conversion

---

## 1. Stripe API Keys Configuration

### Test Mode (Development)
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Test Mode Secret Key** (starts with `sk_test_`)
3. Update Supabase secret:
   ```bash
   # In Supabase Dashboard -> Project Settings -> Edge Functions -> Secrets
   STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
   ```

### Production Mode
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys) (toggle to Live mode)
2. Copy your **Live Mode Secret Key** (starts with `sk_live_`)
3. Update Supabase secret with live key:
   ```bash
   STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
   ```

---

## 2. Product & Price Configuration

### Trial Subscriptions:
The app uses Stripe's native `trial_period_days: 3` feature. Trial products are **not needed** - the checkout uses the monthly subscription prices directly with a trial period.

### Current Price IDs (in code):
- **Pro Monthly**: `price_1SKKdNL8Zm4LqDn4gBXwrsAq` (€19.99/month)
- **Ultra Pro Monthly**: `price_1SKJAxL8Zm4LqDn43kl9BRd8` (€39.99/month)

### For Production:
1. Create products in **Live Mode** Stripe Dashboard
2. Get the live mode monthly price IDs
3. Update in `supabase/functions/create-checkout/index.ts` (lines 133-134)

### Important:
- Set tax category to **"General – Electronically Supplied Services"**
- Enable **"Include tax in price: Yes"** for proper VAT handling
- Stripe will automatically handle EU VAT based on customer location

---

## 3. Stripe Webhooks Configuration

### Required Webhook Events:
The app listens to these Stripe events:
- `customer.subscription.created` - Initial subscription setup
- `customer.subscription.updated` - Plan changes, status updates
- `customer.subscription.deleted` - Cancellations (reverts to free)
- `invoice.payment_succeeded` - **Activates subscription and tracks trial conversions**
- `invoice.payment_failed` - Handles failed payments
- `charge.refunded` - Handles refunds
- `charge.dispute.created` - Handles chargebacks

### Test Mode Webhook
1. Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL:
   ```
   https://lciaiunzacgvvbvcshdh.supabase.co/functions/v1/stripe-webhook
   ```
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `charge.refunded`
   - `charge.dispute.created`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to Supabase secrets:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

### Live Mode Webhook
1. Toggle Stripe to **Live Mode**
2. Repeat steps above but use Live mode webhook secret
3. Update `STRIPE_WEBHOOK_SECRET` with live secret

---

## 4. Stripe Customer Portal Setup

### Required for subscription management:
1. Go to [Customer Portal Settings](https://dashboard.stripe.com/settings/billing/portal)
2. Enable the portal
3. Configure which actions customers can perform:
   - ✅ Cancel subscriptions
   - ✅ Update payment methods
   - ✅ View invoices
4. Do this for **both Test and Live modes**

---

## 5. Testing Workflow

### Test Mode Testing:
1. Set `STRIPE_SECRET_KEY` to test key
2. Use [Stripe test cards](https://stripe.com/docs/testing):
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3DS required: `4000 0027 6000 3184`
3. Test trial subscription flow:
   - Sign up for trial
   - Verify trial period is active (3 days)
   - Wait for or manually trigger `invoice.payment_succeeded` webhook
   - Confirm conversion is tracked in `trial_conversions` table
4. Check webhook logs in Stripe Dashboard

### Before Going Live:
- [ ] Switch `STRIPE_SECRET_KEY` to live key
- [ ] Update price IDs to live mode prices
- [ ] Configure live mode webhook
- [ ] Enable live mode Customer Portal
- [ ] Test with real card (small amount)
- [ ] Verify VAT collection is working correctly
- [ ] Test 3DS authentication flow

---

## 6. How Trial Subscriptions Work

### Native Stripe Trial Flow:
The app now uses Stripe's **built-in trial system** for a seamless experience:

1. **Checkout Creation** (`create-checkout` edge function):
   - User requests a trial via trial product ID
   - System creates checkout with **monthly price** + `trial_period_days: 3`
   - Stripe collects payment method during checkout
   - Payment method is **saved but not charged** during trial

2. **Trial Period (3 Days)**:
   - User has full access to Pro/Ultra Pro features
   - No charges occur during this period
   - Subscription status is `active` with trial end date

3. **Trial End (Automatic)**:
   - On day 3, Stripe **automatically charges** the saved payment method
   - Stripe handles 3DS authentication if required
   - Stripe sends `invoice.payment_succeeded` webhook

4. **Conversion Tracking** (`stripe-webhook` edge function):
   - Webhook detects `invoice.payment_succeeded` with trial metadata
   - Records conversion in `trial_conversions` table
   - Updates user subscription status to `active`

### Benefits of This Approach:
- ✅ Fully automatic - no manual subscription creation needed
- ✅ Stripe handles VAT collection based on customer location
- ✅ 3DS/SCA authentication handled natively
- ✅ Proper dunning and retry logic for failed payments
- ✅ No risk of double subscriptions or duplicate charges
- ✅ Better compliance with EU payment regulations

### What Happens on Cancellation:
If user cancels during trial:
- Subscription is canceled immediately
- No charges occur
- User is reverted to free plan
- `customer.subscription.deleted` webhook handles cleanup

---

## 7. Security Checklist

- [ ] Never commit secret keys to git
- [ ] Use Supabase secrets for all keys
- [ ] Verify webhook signatures (already implemented)
- [ ] Test subscription cancellations
- [ ] Test failed payment handling
- [ ] Monitor Stripe Dashboard for issues

---

## 8. Common Issues

### Webhook not receiving events
- Check webhook URL is correct
- Verify `STRIPE_WEBHOOK_SECRET` is set
- Check Supabase edge function logs
- Verify webhook signature is valid

### Trial not converting to paid
- Check if `invoice.payment_succeeded` webhook is being received
- Verify payment method was saved during checkout
- Check Stripe Dashboard for failed payment attempts
- Review edge function logs: `stripe-webhook`

### Wrong environment
- Verify you're using matching keys/products (test with test, live with live)
- Can't mix test keys with live products

### Subscription not updating
- Check webhook events are reaching your endpoint
- Verify user email matches between Supabase and Stripe
- Check edge function logs: `check-subscription`, `stripe-webhook`
- Ensure `trial_conversions` table has proper indexes

---

## Quick Reference

| Component | Test Mode | Live Mode |
|-----------|-----------|-----------|
| API Key | `sk_test_...` | `sk_live_...` |
| Products | Test products | Live products |
| Webhook Secret | `whsec_test_...` | `whsec_live_...` |
| Dashboard | Toggle OFF | Toggle ON |

---

## Supabase Dashboard Links

- [Edge Functions Secrets](https://supabase.com/dashboard/project/lciaiunzacgvvbvcshdh/settings/functions)
- [Edge Function Logs - stripe-webhook](https://supabase.com/dashboard/project/lciaiunzacgvvbvcshdh/functions/stripe-webhook/logs)
- [Edge Function Logs - check-subscription](https://supabase.com/dashboard/project/lciaiunzacgvvbvcshdh/functions/check-subscription/logs)
- [Edge Function Logs - create-checkout](https://supabase.com/dashboard/project/lciaiunzacgvvbvcshdh/functions/create-checkout/logs)
