# Email Verification Flow - Complete Analysis

## Overview
This document provides a step-by-step analysis of the email signup and verification flow with all edge cases handled.

---

## Flow Diagram

```
User enters email + password
         ↓
Client validation (format, length)
         ↓
Call: send-verification-code
         ↓
Edge Function: Check if email exists
         ↓
   ┌────────┴────────┐
   ↓                 ↓
EXISTS          NEW USER
   ↓                 ↓
Check Provider   Generate 6-digit code
   ↓                 ↓
OAuth?           Store in DB + Send email
   ↓                 ↓
Return error    User receives code
with provider        ↓
info            User enters code
                     ↓
                Call: verify-email-code
                     ↓
                Validate code
                     ↓
                Check if user exists
                     ↓
              ┌──────┴──────┐
              ↓             ↓
          EXISTS        NEW USER
              ↓             ↓
        Mark verified  Create account
              ↓             ↓
        Return success Return success
        + alreadyExists + newUser flag
              ↓             ↓
              └──────┬──────┘
                     ↓
            Redirect to Sign In
```

---

## Step-by-Step Analysis

### Step 1: User Submits Email/Password
**Location:** `src/components/AuthModal.tsx` - `handleSignUp()`

**Client-side Validation:**
- ✅ Email format validation (regex)
- ✅ Password minimum 6 characters
- ✅ Rate limiting (60-second cooldown)

**Code Flow:**
```typescript
// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  setError('Please enter a valid email address');
  return;
}

// Validate password length
if (password.length < 6) {
  setError('Password must be at least 6 characters');
  return;
}
```

---

### Step 2: Send Verification Code
**Location:** `supabase/functions/send-verification-code/index.ts`

**Edge Function Logic:**
1. **Check if email exists** in `auth.users`
2. **If exists:**
   - Check providers (Google, Apple, Microsoft, etc.)
   - Return appropriate error message:
     - OAuth: "This email is already registered with [Provider]. Please sign in using [Provider] instead"
     - Email: "This email is already registered. Please sign in or use Forgot Password"
3. **If new:**
   - Generate 6-digit code
   - Store in `email_verifications` table with:
     - Code
     - Password (encrypted at rest)
     - Expiration (10 minutes)
   - Send email via Resend API

**Key Code:**
```typescript
// Check if email already exists
const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
const existingUser = existingUsers.users.find(u => u.email === email);

if (existingUser) {
  const providers = existingUser.app_metadata?.providers || [];
  if (providers.length > 0 && !providers.includes('email')) {
    // Return OAuth provider info
  } else {
    // Return "already registered" message
  }
}
```

---

### Step 3: User Enters Verification Code
**Location:** `src/components/AuthModal.tsx` - Verification UI

**Features:**
- 6 individual input boxes
- Auto-focus next box on input
- Paste support (auto-fills all boxes)
- Backspace navigation
- Resend code option (with cooldown)

**Code:**
```typescript
// 6-digit code input with individual boxes
<div className="flex justify-center gap-2">
  {[0, 1, 2, 3, 4, 5].map((index) => (
    <input
      key={index}
      type="text"
      inputMode="numeric"
      maxLength={1}
      value={verificationCode[index] || ''}
      onChange={(e) => handleCodeInput(e, index)}
      onKeyDown={(e) => handleBackspace(e, index)}
      onPaste={(e) => handlePaste(e)}
    />
  ))}
</div>
```

---

### Step 4: Verify Code and Create/Link Account
**Location:** `supabase/functions/verify-email-code/index.ts`

**Smart Flow Logic:**

1. **Validate Code:**
   - Check code exists in DB
   - Check not expired (10 minutes)
   - Check not already used

2. **Check if User Exists:**
   ```typescript
   const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
   const existingUser = existingUsers?.users?.find(
     u => u.email?.toLowerCase() === email.toLowerCase()
   );
   ```

3. **Three Possible Outcomes:**

   **A) User Exists (OAuth Account):**
   - Mark verification as used
   - Return: `{ success: true, alreadyExists: true, provider: "Google" }`
   - Message: "This email is already linked to your Google account. Please sign in using Google."

   **B) User Exists (Email Account):**
   - Mark verification as used
   - Return: `{ success: true, alreadyExists: true }`
   - Message: "This email is already registered. Please sign in with your email and password."

   **C) New User:**
   - Create user with `admin.createUser()`
   - Auto-confirm email
   - Mark verification as used
   - Send welcome email
   - Return: `{ success: true, newUser: true }`
   - Message: "Account created successfully! Please sign in."

---

### Step 5: Frontend Response Handling
**Location:** `src/components/AuthModal.tsx` - `handleVerifyEmailCode()`

**Response Handling:**
```typescript
if (data?.success) {
  // Case 1: User already exists (OAuth)
  if (data.alreadyExists && data.provider) {
    toast({
      title: "Account Found",
      description: data.message, // Mentions provider
    });
    setMode('signin');
  }
  
  // Case 2: User already exists (Email)
  else if (data.alreadyExists) {
    toast({
      title: "Account Already Exists",
      description: data.message,
    });
    setMode('signin');
    setEmail(pendingEmail); // Pre-fill for convenience
  }
  
  // Case 3: New user created
  else if (data.newUser) {
    toast({
      title: "Success!",
      description: data.message,
    });
    setMode('signin');
    setEmail(pendingEmail); // Pre-fill for convenience
  }
  
  // Clean up
  setVerificationCode('');
  setPendingEmail('');
  setPassword('');
}
```

---

## Edge Cases Handled

### 1. Duplicate Signup Attempts
**Scenario:** User tries to verify the same code twice
**Handling:** Returns "already exists" message, doesn't error out

### 2. Email Already Registered (OAuth)
**Scenario:** Email is linked to Google/Apple account
**Handling:** Tells user to sign in with that provider

### 3. Email Already Registered (Email/Password)
**Scenario:** User already has email/password account
**Handling:** Directs to sign in, pre-fills email

### 4. Expired Verification Code
**Scenario:** User tries to verify after 10 minutes
**Handling:** Returns "verification code has expired" error

### 5. Invalid Verification Code
**Scenario:** User enters wrong code
**Handling:** Returns "invalid or expired verification code" error

### 6. Code Already Used
**Scenario:** User tries to use the same code twice
**Handling:** Returns "this code has already been used" error

### 7. Rate Limiting
**Scenario:** User requests multiple codes rapidly
**Handling:** 60-second cooldown between requests

---

## Security Considerations

### ✅ Implemented Security Features:

1. **No Direct Environment Variables**
   - Uses Supabase client methods
   - No `import.meta.env.VITE_*` usage

2. **Input Validation**
   - Email format validation (client + server)
   - Password minimum length (6 characters)
   - Code format validation (6 digits only)

3. **Rate Limiting**
   - 60-second cooldown between verification emails
   - Prevents spam and abuse

4. **Verification Expiration**
   - 10-minute expiration window
   - One-time use codes (marked as used)

5. **Secure Password Storage**
   - Passwords stored temporarily in `email_verifications`
   - Encrypted at rest by Supabase
   - Only used once during account creation

6. **Admin-Only Operations**
   - User creation uses `admin.createUser()`
   - User lookup uses `admin.listUsers()`
   - Requires service role key

---

## Database Tables

### email_verifications
```sql
CREATE TABLE email_verifications (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  password_hash TEXT NOT NULL, -- Encrypted at rest
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Purpose:**
- Store verification codes temporarily
- Track which codes have been used
- Store password until account creation

---

## User Experience Flow

### Success Path (New User):
1. Enter email + password → ✅
2. Receive verification code email → ✅
3. Enter 6-digit code → ✅
4. Account created → ✅
5. Redirected to sign in with email pre-filled → ✅

### Success Path (Existing User):
1. Enter email + password → ❌ "Email already registered"
2. Directed to sign in instead

### Edge Case Path (Tried to verify twice):
1. Enter code first time → Account created ✅
2. Enter same code again → "Account already exists, please sign in" ✅
3. No error, just friendly redirect → ✅

---

## Testing Checklist

- [x] New user signup flow
- [x] Existing email (OAuth) detection
- [x] Existing email (Email/Password) detection
- [x] Expired verification code handling
- [x] Invalid verification code handling
- [x] Double verification attempt handling
- [x] Rate limiting (60-second cooldown)
- [x] Email pre-fill after verification
- [x] Welcome email sent for new users
- [x] No errors on duplicate attempts

---

## Improvements Made

1. ✅ Removed `import.meta.env.VITE_*` usage
2. ✅ Added comprehensive error handling
3. ✅ Smart user existence checking
4. ✅ Graceful handling of duplicate verifications
5. ✅ Pre-fill email after verification
6. ✅ Better toast messages for different scenarios
7. ✅ Client-side validation before API calls
8. ✅ Proper use of Supabase client methods

---

## Conclusion

The email verification flow now handles all edge cases gracefully:
- ✅ New users can sign up
- ✅ Existing users are directed to sign in
- ✅ OAuth users are identified and directed properly
- ✅ Duplicate attempts don't cause errors
- ✅ All security best practices followed
- ✅ Great user experience with helpful messages
