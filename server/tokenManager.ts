/**
 * OpenF1 Token Manager
 * Handles server-side authentication with OpenF1 (OAuth2 token endpoint).
 * NEVER exposes credentials or logs tokens to stdout/stderr.
 */

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

class OpenF1TokenManager {
  private tokenCache: TokenCache | null = null;
  private isAuthenticating = false;
  private lastAttemptTimestamp: number = 0;
  private authFailureCount = 0;
  private authStatus: 'UNCONFIGURED' | 'AUTHENTICATED' | 'FAILED' | 'COMMUNITY_FALLBACK' = 'UNCONFIGURED';
  private lastErrorMessage: string | null = null;

  constructor() {
    this.init();
  }

  private init() {
    const rawToken = process.env.OPENF1_ACCESS_TOKEN?.trim();
    if (rawToken) {
      // Pre-configured access token
      this.tokenCache = {
        accessToken: rawToken,
        expiresAt: Date.now() + 3600 * 1000 * 24 * 365, // treated as long-lived
      };
      this.authStatus = 'AUTHENTICATED';
    } else if (process.env.OPENF1_USERNAME && process.env.OPENF1_PASSWORD) {
      this.authStatus = 'COMMUNITY_FALLBACK';
      // Will authenticate lazily or on startup
    } else {
      this.authStatus = 'COMMUNITY_FALLBACK';
    }
  }

  /**
   * Retrieves a valid Bearer authorization header or null if in public community mode.
   */
  async getAuthorizationHeader(): Promise<string | null> {
    const token = await this.getValidToken();
    if (token) {
      return `Bearer ${token}`;
    }
    return null;
  }

  /**
   * Returns valid access token if available, refreshing if expired.
   */
  async getValidToken(): Promise<string | null> {
    const now = Date.now();

    // Check if token exists and is valid (with 60s buffer)
    if (this.tokenCache && this.tokenCache.expiresAt > now + 60000) {
      return this.tokenCache.accessToken;
    }

    const username = process.env.OPENF1_USERNAME?.trim();
    const password = process.env.OPENF1_PASSWORD?.trim();

    if (!username || !password) {
      // No credentials provided; free community tier access is standard for OpenF1
      this.authStatus = 'COMMUNITY_FALLBACK';
      return null;
    }

    // Exponential backoff if recent attempts failed
    if (this.authFailureCount > 0) {
      const backoffMs = Math.min(60000, 2000 * Math.pow(2, this.authFailureCount - 1));
      if (now - this.lastAttemptTimestamp < backoffMs) {
        return null;
      }
    }

    if (this.isAuthenticating) {
      return this.tokenCache?.accessToken ?? null;
    }

    this.isAuthenticating = true;
    this.lastAttemptTimestamp = now;

    try {
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);

      const response = await fetch('https://api.openf1.org/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        this.authFailureCount++;
        this.authStatus = 'FAILED';
        this.lastErrorMessage = `Auth endpoint HTTP ${response.status}`;
        return null;
      }

      const data = await response.json() as { access_token?: string; expires_in?: number; token_type?: string };
      if (data && typeof data.access_token === 'string') {
        const expiresInSec = typeof data.expires_in === 'number' ? data.expires_in : 3600;
        this.tokenCache = {
          accessToken: data.access_token,
          expiresAt: now + expiresInSec * 1000,
        };
        this.authFailureCount = 0;
        this.authStatus = 'AUTHENTICATED';
        this.lastErrorMessage = null;
        return this.tokenCache.accessToken;
      } else {
        this.authFailureCount++;
        this.authStatus = 'FAILED';
        this.lastErrorMessage = 'Invalid response payload from token endpoint';
        return null;
      }
    } catch (err: unknown) {
      this.authFailureCount++;
      this.authStatus = 'FAILED';
      this.lastErrorMessage = err instanceof Error ? err.message : 'Network error during authentication';
      return null;
    } finally {
      this.isAuthenticating = false;
    }
  }

  /**
   * Sanitized public status for UI diagnostics (NEVER returns tokens or credentials)
   */
  getStatus() {
    return {
      authMode: this.authStatus,
      hasToken: Boolean(this.tokenCache),
      hasCredentialsConfigured: Boolean(process.env.OPENF1_ACCESS_TOKEN || (process.env.OPENF1_USERNAME && process.env.OPENF1_PASSWORD)),
      lastErrorMessage: this.lastErrorMessage,
    };
  }
}

export const tokenManager = new OpenF1TokenManager();
