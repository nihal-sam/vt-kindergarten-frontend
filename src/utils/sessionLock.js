import { supabase, supabaseUrl, supabaseAnonKey } from '../supabaseClient.js';
import { ensureAuthenticatedSession } from './adminAuth.js';

// Ultra-responsive heartbeat interval and timeout thresholds (in ms)
export const HEARTBEAT_INTERVAL_MS = 3000;  // Send presence heartbeat every 3 seconds
export const SESSION_TIMEOUT_MS = 8000;     // Lock expires after 8s of no heartbeats (tab closed)

/**
 * Generate a unique session ID for the current browser tab
 */
export function generateSessionId() {
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

/**
 * Get or create the unique session ID stored in sessionStorage for this tab
 */
export function getOrCreateSessionId() {
  if (typeof window === 'undefined') return generateSessionId();
  try {
    let sid = window.sessionStorage.getItem('vt_session_id');
    if (!sid) {
      sid = generateSessionId();
      window.sessionStorage.setItem('vt_session_id', sid);
    }
    return sid;
  } catch {
    return generateSessionId();
  }
}

/**
 * Derive standard unique lock key for a user
 */
export function getLockKey(email = '', isSuperAdmin = false) {
  const cleanEmail = (email || '').toLowerCase().trim();
  if (isSuperAdmin || cleanEmail === 'superadmin@vtkindergarten.com') {
    return 'superadmin_lock';
  }
  return `admin_lock_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
}

/**
 * Check if another user/browser is actively logged in with this role/account
 * Returns: { isLocked: boolean, reason?: string, lastHeartbeat?: string }
 */
export async function checkSessionActive(email, isSuperAdmin, currentSessionId = '') {
  try {
    const lockKey = getLockKey(email, isSuperAdmin);

    // 1. Instant check: If tab was closed on this computer/browser within the last 15 seconds,
    // consider it unlocked immediately!
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const closedAt = Number(window.localStorage.getItem('vt_lock_released_' + lockKey) || 0);
        if (closedAt > 0 && Date.now() - closedAt < 15000) {
          return { isLocked: false, wasJustClosedLocally: true };
        }
      } catch (_) {}
    }

    await ensureAuthenticatedSession();

    const { data: rows, error } = await supabase
      .from('student_admissions')
      .select('*')
      .eq('relation', 'Active Session')
      .eq('child_name', lockKey)
      .limit(1);

    if (error || !rows || rows.length === 0) {
      return { isLocked: false };
    }

    const row = rows[0];
    let meta = {};
    try {
      meta = JSON.parse(row.message || '{}');
    } catch (_) {}

    // If current tab is the same session, it's not locked against itself
    if (currentSessionId && meta.session_id === currentSessionId) {
      return { isLocked: false, isSelf: true };
    }

    // Check if heartbeat is recent (within 8 seconds)
    const now = Date.now();
    const lastHbTime = meta.last_heartbeat ? new Date(meta.last_heartbeat).getTime() : 0;
    const elapsed = now - lastHbTime;

    if (meta.is_active !== false && elapsed < SESSION_TIMEOUT_MS) {
      // An active session is currently alive on another tab or device!
      return {
        isLocked: true,
        session_id: meta.session_id,
        lastHeartbeat: meta.last_heartbeat,
        elapsedSeconds: Math.floor(elapsed / 1000),
      };
    }

    // Stale or abandoned session lock (previous window was closed or killed)
    // Clean it up silently
    try {
      await supabase.from('student_admissions').delete().eq('id', row.id);
    } catch (_) {}

    return { isLocked: false, wasExpired: true };
  } catch (err) {
    console.warn('checkSessionActive exception:', err);
    return { isLocked: false };
  }
}

/**
 * Acquire exclusive session lock upon login
 */
export async function acquireSessionLock(email, isSuperAdmin, sessionId) {
  try {
    await ensureAuthenticatedSession();
    const lockKey = getLockKey(email, isSuperAdmin);
    const cleanEmail = (email || '').toLowerCase().trim();
    const nowIso = new Date().toISOString();

    // Clear local release mark when acquiring a new lock
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem('vt_lock_released_' + lockKey);
      } catch (_) {}
    }

    // 1. Delete any existing lock record for this key
    await supabase
      .from('student_admissions')
      .delete()
      .eq('relation', 'Active Session')
      .eq('child_name', lockKey);

    // 2. Insert new lock record
    const payload = {
      session_id: sessionId,
      last_heartbeat: nowIso,
      is_active: true,
      login_time: nowIso,
    };

    const { error: insErr } = await supabase.from('student_admissions').insert([{
      child_name: lockKey,
      parent_name: isSuperAdmin ? 'Super Admin' : cleanEmail,
      program: 'SessionLock',
      relation: 'Active Session',
      phone: '7358293839',
      email: cleanEmail,
      message: JSON.stringify(payload),
    }]);

    if (insErr) {
      console.warn('acquireSessionLock insert warning:', insErr.message);
    }

    return { success: true };
  } catch (err) {
    console.error('acquireSessionLock error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Refresh heartbeat timestamp while user has dashboard open.
 * Returns { isStillOwner: boolean }. If another tab took over, isStillOwner is false.
 */
export async function refreshHeartbeat(email, isSuperAdmin, sessionId) {
  try {
    const lockKey = getLockKey(email, isSuperAdmin);
    const nowIso = new Date().toISOString();

    const { data: rows } = await supabase
      .from('student_admissions')
      .select('id, message')
      .eq('relation', 'Active Session')
      .eq('child_name', lockKey)
      .limit(1);

    if (rows && rows.length > 0) {
      let meta = {};
      try { meta = JSON.parse(rows[0].message || '{}'); } catch (_) {}

      // If another session took over the lock, notify caller
      if (meta.session_id && meta.session_id !== sessionId) {
        return { isStillOwner: false };
      }

      await supabase
        .from('student_admissions')
        .update({
          message: JSON.stringify({
            session_id: sessionId,
            last_heartbeat: nowIso,
            is_active: true,
          }),
        })
        .eq('id', rows[0].id);

      return { isStillOwner: true };
    } else {
      // Row was deleted, re-insert to preserve active status
      await acquireSessionLock(email, isSuperAdmin, sessionId);
      return { isStillOwner: true };
    }
  } catch (err) {
    return { isStillOwner: true };
  }
}

/**
 * Explicitly release session lock on logout
 */
export async function releaseSessionLock(email, isSuperAdmin, sessionId) {
  try {
    const lockKey = getLockKey(email, isSuperAdmin);

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('vt_lock_released_' + lockKey, String(Date.now()));
      } catch (_) {}
    }

    await ensureAuthenticatedSession();

    await supabase
      .from('student_admissions')
      .delete()
      .eq('relation', 'Active Session')
      .eq('child_name', lockKey);

    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.removeItem('vt_session_id');
      } catch (_) {}
    }
    return { success: true };
  } catch (err) {
    console.warn('releaseSessionLock note:', err);
    return { success: false };
  }
}

/**
 * Beacon release invoked on pagehide / beforeunload when browser tab is closed
 * Sets local timestamp immediately and sends keepalive fetch
 */
export function releaseSessionLockBeacon(email, isSuperAdmin) {
  try {
    const lockKey = getLockKey(email, isSuperAdmin);

    // 1. Mark local release timestamp in localStorage (instant across all tabs on this machine)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('vt_lock_released_' + lockKey, String(Date.now()));
      } catch (_) {}
    }

    // 2. Extract access token from sessionStorage
    let token = '';
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        token = window.sessionStorage.getItem('vt_supabase_token') || '';
        if (!token) {
          for (let i = 0; i < window.sessionStorage.length; i++) {
            const key = window.sessionStorage.key(i);
            if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
              const parsed = JSON.parse(window.sessionStorage.getItem(key));
              if (parsed?.access_token) {
                token = parsed.access_token;
                break;
              }
            }
          }
        }
      } catch (_) {}
    }

    // 3. Dispatch keepalive fetch to delete the row in Supabase
    const url = `${supabaseUrl}/rest/v1/student_admissions?relation=eq.Active%20Session&child_name=eq.${encodeURIComponent(lockKey)}`;
    const headers = {
      apikey: supabaseAnonKey,
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (typeof fetch === 'function') {
      fetch(url, {
        method: 'DELETE',
        headers,
        keepalive: true,
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('releaseSessionLockBeacon note:', err);
  }
}
