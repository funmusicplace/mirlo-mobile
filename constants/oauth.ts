export const OAUTH_CLIENT_ID = process.env.EXPO_PUBLIC_OAUTH_CLIENT_ID ?? "";
// Must match a redirect URI registered for the client, the scheme is app.json's
export const OAUTH_REDIRECT_URI = "mirlo://oauth/callback";
