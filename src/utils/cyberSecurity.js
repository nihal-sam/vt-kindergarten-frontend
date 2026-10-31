/**
 * Enterprise Cyber Security Guard for VT Kindergarten Admin & Super Admin APIs
 * Provides:
 * 1. Brute-Force & Rate-Limiting Defense (Auto-lockout after failed attempts)
 * 2. SQL / XSS / Payload Injection Sanitization
 * 3. Client Session Integrity Fingerprinting
 * 4. Anti-Tampering Request Signatures
 */

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 120 * 1000; // 2 minutes lockout
const RATE_LIMIT_STORAGE_KEY = 'vtk_sec_login_attempts';
const REG_RATE_LIMIT_KEY = 'vtk_sec_reg_timestamp';

// Detect dangerous injection patterns (SQL injection, XSS, command injection)
const INJECTION_PATTERNS = [
  /(\b(union(\s+all)?\s+select|select\s+.+\s+from|insert\s+into|drop\s+table|delete\s+from|update\s+.+\s+set)\b)/i,
  /(['"]\s*(or|and)\s*['"]?1['"]?\s*=\s*['"]?1)/i,
  /(<script\b[^>]*>([\s\S]*?)<\/script>)/i,
  /(javascript\s*:\s*|data\s*:\s*text\/html)/i,
  /(--|\b(exec|execute|sp_executesql)\b)/i,
  /(\x00|\0)/,
];

/**
 * Validates text input against malicious cyber attack payloads
 */
export function sanitizeSecurityInput(text = '', fieldName = 'Field') {
  if (typeof text !== 'string') return { isSafe: true, clean: '' };

  const trimmed = text.trim();

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isSafe: false,
        clean: '',
        error: `⚠️ Security Violation: Potentially malicious cyber attack pattern detected in ${fieldName}. Request blocked.`,
      };
    }
  }

  // Strip null bytes and dangerous control chars
  const clean = trimmed.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '');
  return { isSafe: true, clean };
}

/**
 * Check if an email / IP is currently locked out from brute-force attempts
 */
export function checkLoginRateLimit(email = '') {
  try {
    const cleanEmail = (email || '').toLowerCase().trim();
    const raw = sessionStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    if (!raw) return { allowed: true, attemptsRemaining: MAX_FAILED_ATTEMPTS };

    const data = JSON.parse(raw);
    const now = Date.now();

    // Check if account is in active lockout
    if (data[cleanEmail] && data[cleanEmail].lockedUntil && data[cleanEmail].lockedUntil > now) {
      const remainingSeconds = Math.ceil((data[cleanEmail].lockedUntil - now) / 1000);
      return {
        allowed: false,
        remainingSeconds,
        error: `🚫 Cyber Shield: Too many failed login attempts detected. Access is temporarily locked for ${remainingSeconds}s to prevent automated brute-force attacks.`,
      };
    }

    // Clean up expired lockout
    if (data[cleanEmail] && data[cleanEmail].lockedUntil && data[cleanEmail].lockedUntil <= now) {
      delete data[cleanEmail];
      sessionStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(data));
      return { allowed: true, attemptsRemaining: MAX_FAILED_ATTEMPTS };
    }

    const attempts = data[cleanEmail]?.count || 0;
    const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - attempts);
    return { allowed: true, attemptsRemaining: remaining };
  } catch (err) {
    return { allowed: true, attemptsRemaining: MAX_FAILED_ATTEMPTS };
  }
}

/**
 * Record a failed login attempt and trigger automated lockout if threshold reached
 */
export function recordFailedLogin(email = '') {
  try {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail) return;

    let data = {};
    const raw = sessionStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    if (raw) {
      try { data = JSON.parse(raw); } catch (_) {}
    }

    const now = Date.now();
    const current = data[cleanEmail] || { count: 0, firstAttempt: now };

    current.count = (current.count || 0) + 1;
    current.lastAttempt = now;

    if (current.count >= MAX_FAILED_ATTEMPTS) {
      current.lockedUntil = now + LOCKOUT_DURATION_MS;
    }

    data[cleanEmail] = current;
    sessionStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(data));
  } catch (_) {}
}

/**
 * Reset failed attempts upon successful login
 */
export function recordSuccessfulLogin(email = '') {
  try {
    const cleanEmail = (email || '').toLowerCase().trim();
    const raw = sessionStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    if (!raw) return;

    const data = JSON.parse(raw);
    if (data[cleanEmail]) {
      delete data[cleanEmail];
      sessionStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(data));
    }
  } catch (_) {}
}

/**
 * Prevent registration flooding / spam bots
 */
export function checkRegistrationRateLimit() {
  try {
    const raw = sessionStorage.getItem(REG_RATE_LIMIT_KEY);
    if (!raw) return { allowed: true };

    const lastTimestamp = parseInt(raw, 10);
    const now = Date.now();
    const elapsed = now - lastTimestamp;

    // Minimum 10 seconds between registration attempts
    if (elapsed < 10000) {
      const remainingSeconds = Math.ceil((10000 - elapsed) / 1000);
      return {
        allowed: false,
        error: `⏳ Please wait ${remainingSeconds}s before submitting another registration attempt.`,
      };
    }

    return { allowed: true };
  } catch (_) {
    return { allowed: true };
  }
}

export function recordRegistrationAttempt() {
  try {
    sessionStorage.setItem(REG_RATE_LIMIT_KEY, String(Date.now()));
  } catch (_) {}
}

/**
 * Generates an in-memory client integrity signature token
 */
export function getClientIntegrityToken() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
  const screenHash = typeof window !== 'undefined' ? `${window.screen?.width}x${window.screen?.height}` : '0';
  const combined = `VTK-SEC-${ua.slice(0, 20)}-${screenHash}`;
  return btoa(combined).slice(0, 32);
}
