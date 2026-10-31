// Single place that turns Supabase/auth errors into messages that are safe and
// useful for end users. Technical details stay in the browser console only.

const NETWORK_MARKERS = [
  'failed to fetch',
  'fetch failed',
  'network request failed',
  'networkerror',
  'load failed',
  'failed to send request',
];

// Messages that would leak implementation details (databases, HTTP, JWTs...).
// They are logged for developers and replaced with a safe fallback for users.
const TECHNICAL_MARKERS = [
  'fetch',
  'http',
  'jwt',
  'postgrest',
  'schema',
  'constraint',
  'duplicate key',
  'undefined',
  'exception',
  'stack',
  'timeout',
  'socket',
  'status code',
  'internal error',
  'invalid request',
];

export function describeAuthError(error: unknown, fallback: string): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';
  const message = raw.toLowerCase();

  if (
    message.includes('invalid login credentials') ||
    message.includes('invalid credentials') ||
    message.includes('email or password')
  ) {
    return 'Incorrect email or password. Check your credentials and try again.';
  }

  if (message.includes('email not confirmed') || message.includes('confirm your email')) {
    return 'Please confirm your email address before signing in. Check your inbox for the confirmation link.';
  }

  if (message.includes('already registered') || message.includes('already exists')) {
    return 'An account with this email already exists. Please sign in instead.';
  }

  if (message.includes('user not found')) {
    return 'No account found with this email. Please sign up first.';
  }

  if (message.includes('rate limit') || message.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  if (NETWORK_MARKERS.some((marker) => message.includes(marker))) {
    return 'Network error. Check your connection and try again.';
  }

  if (message.includes('password')) {
    return 'Password is too weak. Use at least 8 characters with a mix of letters and numbers.';
  }

  if (!raw) return fallback;

  if (TECHNICAL_MARKERS.some((marker) => message.includes(marker))) {
    console.warn('[MyDoctor] Showing a generic message for an auth error:', raw);
    return fallback;
  }

  return raw;
}

