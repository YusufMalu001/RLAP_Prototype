# Google OAuth & Stitch Design Integration Setup

## Overview
This document describes how to authenticate with Google services and integrate Stitch design data into the RLAP application.

## Prerequisites
- Google Cloud Project with OAuth 2.0 credentials
- Stitch project at https://stitch.withgoogle.com/projects/661045816018978058

## Configuration

### 1. Environment Variables
Your `.env` file should contain:

```bash
# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=392907284654-gsrn250k921ge77kcm65slkoftmmlia4.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=<your-client-secret>
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/callback

# Stitch
STITCH_PROJECT_ID=661045816018978058
```

### 2. Google Cloud Console Setup

**Redirect URIs configured:**
- ✅ http://localhost:3000/api/auth/callback
- ✅ http://localhost:3001/api/auth/callback
- ✅ https://yourdomain.com/api/auth/callback (production)

**JavaScript Origins configured:**
- ✅ http://localhost:3000
- ✅ http://localhost:3001
- ✅ https://yourdomain.com (production)

## OAuth Flow

### Login Flow
```
1. User clicks "Connect to Stitch" button
   ↓
2. Redirected to /api/auth/login
   ↓
3. Redirected to Google OAuth consent screen
   ↓
4. User authorizes access
   ↓
5. Google redirects to /api/auth/callback?code=...
   ↓
6. Access token exchanged and stored in httpOnly cookie
   ↓
7. User returned to home page (authenticated)
```

### API Endpoints

#### `GET /api/auth/login`
Initiates OAuth flow by redirecting to Google consent screen.

#### `GET /api/auth/callback`
Receives authorization code from Google and exchanges for access token.
- Stores token in secure httpOnly cookie
- Redirects to home page

#### `GET /api/stitch/design`
Fetches design data from Stitch using stored access token.
- **Requires:** Authentication (valid Google access token)
- **Returns:** Design project data

## Usage

### Using the Auth Button
```tsx
import { StitchAuthButton } from "@/components/StitchAuthButton";

export default function Page() {
  return (
    <div>
      <h1>Design System</h1>
      <StitchAuthButton />
    </div>
  );
}
```

### Fetching Design Data
```typescript
import { fetchStitchDesign } from "@/lib/stitch";

async function loadDesign(accessToken: string) {
  try {
    const design = await fetchStitchDesign(accessToken);
    console.log("Design data:", design);
  } catch (error) {
    console.error("Failed to load design:", error);
  }
}
```

### Client-Side
```typescript
async function getDesign() {
  const response = await fetch("/api/stitch/design");
  if (!response.ok) {
    throw new Error("Failed to fetch design");
  }
  return response.json();
}
```

## Security Considerations

1. **Client Secret:** Never expose in browser; kept only on server
2. **Access Tokens:** Stored in secure httpOnly cookies
3. **Scopes:** Limited to necessary permissions
4. **HTTPS:** Required for production

## Troubleshooting

### "Redirect URI mismatch" error
- Verify redirect URI in Google Cloud Console matches `GOOGLE_OAUTH_REDIRECT_URI`
- Must be exact (protocol, domain, port, path)

### "Invalid Client ID" error
- Check `GOOGLE_OAUTH_CLIENT_ID` in `.env`
- Ensure client exists in Google Cloud Project

### "Access token expired"
- User needs to re-authenticate via login flow
- Access tokens typically expire in 1 hour

### Stitch design not loading
- Verify `STITCH_PROJECT_ID` is correct
- Check that user has access to Stitch project
- Ensure OAuth scopes include necessary permissions

## Files Created

- `apps/web/app/api/auth/login/route.ts` — OAuth initiation
- `apps/web/app/api/auth/callback/route.ts` — OAuth callback
- `apps/web/app/api/stitch/design/route.ts` — Design data endpoint
- `apps/web/lib/stitch.ts` — Stitch API utilities
- `apps/web/components/StitchAuthButton.tsx` — Login button component
- `.env.example` — Environment configuration template
- `OAUTH_SETUP.md` — This file

## Next Steps

1. ✅ Configure OAuth credentials in Google Cloud Console
2. ✅ Set environment variables in `.env`
3. Test OAuth flow:
   - Start dev server: `pnpm dev`
   - Click "Connect to Stitch" button
   - Authorize access
   - Verify redirect to home page
4. Fetch design data:
   - Call `GET /api/stitch/design`
   - Use design data to build components

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Stitch Design API](https://stitch.withgoogle.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
