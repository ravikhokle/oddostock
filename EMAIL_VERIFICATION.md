# Email Verification Feature

## Overview
StockMaster now requires email verification for all new user registrations. Only verified users can log in to the system.

## How It Works

### Registration Flow
1. User signs up with name, email, and password
2. System generates a 6-digit verification code
3. Verification email is sent to the user's email address
4. User is redirected to the verification page
5. User enters the 6-digit code
6. Upon successful verification, user is automatically logged in

### Email Verification Details
- **Verification Code**: 6-digit numeric code
- **Validity**: 24 hours from registration
- **Auto-Login**: After successful verification, users are automatically logged in

### Features
- ✅ Email verification required before login
- ✅ 24-hour verification code validity
- ✅ Resend verification code option
- ✅ Auto-login after verification
- ✅ Clear error messages for unverified accounts
- ✅ Professional email templates

## API Endpoints

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Registration successful! Please check your email to verify your account.",
    "email": "john@example.com"
  }
}
```

### Verify Email
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "email": "john@example.com",
  "token": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "warehouse_staff"
    }
  }
}
```

### Resend Verification Code
```http
POST /api/auth/resend-verification
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Verification email sent successfully"
  }
}
```

### Login (requires verified email)
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Error Response (if not verified):**
```json
{
  "success": false,
  "message": "Please verify your email before logging in. Check your inbox for the verification code."
}
```

## Database Schema Updates

### User Model
Added fields:
```javascript
{
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date
}
```

## Testing

### Seed Users (Pre-verified)
The seed script creates pre-verified users for testing:
- **Admin**: admin@stockmaster.com / password123
- **Manager**: manager@stockmaster.com / password123

### New Registrations
1. Register a new user
2. Check email for 6-digit code (or check backend logs in development)
3. Enter code on verification page
4. Login successfully

## Configuration

### Environment Variables
Required in `.env`:
```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-password
OTP_EXPIRE_MINUTES=10
```

### Gmail Setup
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App Passwords
   - Generate password for "Mail"
   - Use the 16-character password in `.env`

## User Experience

### Registration Page
- User fills out registration form
- Submits → Receives success message
- Automatically redirected to verification page

### Verification Page
- Shows email where code was sent
- Input field for 6-digit code
- "Resend Code" button (with loading state)
- Helpful tips about checking spam folder

### Login Page
- If user tries to login without verification
- Shows error message
- Auto-redirects to verification page after 2 seconds

## Error Handling
- Invalid/expired codes
- Email already registered
- Email already verified
- Failed email delivery
- Network errors

## Email Template
Professional HTML email with:
- StockMaster branding
- Clear instructions
- Large, easy-to-read verification code
- Expiry information
- Security notice

## Future Enhancements
- [ ] Email verification link (in addition to code)
- [ ] SMS verification option
- [ ] Rate limiting on resend attempts
- [ ] Email change verification
- [ ] Admin panel to manually verify users
