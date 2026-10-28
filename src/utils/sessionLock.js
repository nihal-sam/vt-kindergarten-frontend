import { supabase, supabaseUrl, supabaseAnonKey } from '../supabaseClient.js';
import { ensureAuthenticatedSession } from './adminAuth.js';

// Heartbeat and session timeout constants
export const HEARTBEAT_INTERVAL_MS = 4000;  // Send presence heartbeat every 4 seconds
export const SESSION_TIMEOUT_MS = 35000;    // Lock expires after 35s without heartbeat

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
 * Check if another user/browser is actively logged in with this role/account.
 * Pure database check against Supabase - single source of truth.
 * Supports dedicated admin_sessions table with automatic student_admissions fallback.
 * Returns: { isLocked: boolean, session_id?: string, lastHeartbeat?: string }
 */
export async function checkSessionActive(email, isSuperAdmin) {
  try {
    const lockKey = getLockKey(email, isSuperAdmin);
    await ensureAuthenticatedSession();

    // 1. Check dedicated admin_sessions API table first
    const { data: dedicatedRows, error: dedicatedErr } = await supabase
      .from('admin_sessions')
      .select('*')
      .eq('lock_key', lockKey)
      .limit(1);

    if (!dedicatedErr && dedicatedRows) {
      if (dedicatedRows.length === 0) return { isLocked: false };
      const row = dedicatedRows[0];
      const now = Date.now();
      const lastHbTime = row.last_heartbeat ? new Date(row.last_heartbeat).getTime() : 0;
      const elapsed = now - lastHbTime;

      if (row.is_active !== false && elapsed < SESSION_TIMEOUT_MS) {
        return {
          isLocked: true,
          session_id: row.session_id,
          lastHeartbeat: row.last_heartbeat,
          elapsedSeconds: Math.floor(elapsed / 1000),
        };
      }

      // Expired: cleanup
      try {
        await supabase.from('admin_sessions').delete().eq('id', row.id);
      } catch (_) {}
      return { isLocked: false, wasExpired: true };
    }

    // 2. Fallback to legacy student_admissions table
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

    // Check if heartbeat is recent (within 35 seconds)
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

    // 1. Try dedicated admin_sessions table
    try {
      await supabase.from('admin_sessions').delete().eq('lock_key', lockKey);
      await supabase.from('admin_sessions').insert([{
        lock_key: lockKey,
        email: cleanEmail,
        role: isSuperAdmin ? 'Super Administrator' : 'admin',
        session_id: sessionId,
        login_time: nowIso,
        last_heartbeat: nowIso,
        is_active: true,
      }]);
    } catch (_) {}

    // 2. Also keep student_admissions in sync for complete dual compatibility
    await supabase
      .from('student_admissions')
      .delete()
      .eq('relation', 'Active Session')
      .eq('child_name', lockKey);

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

    await ensureAuthenticatedSession();

    // 1. Try dedicated admin_sessions table
    try {
      const { data: dedicatedRows, error: dedicatedErr } = await supabase
        .from('admin_sessions')
        .select('id, session_id')
        .eq('lock_key', lockKey)
        .limit(1);

      if (!dedicatedErr && dedicatedRows && dedicatedRows.length > 0) {
        if (dedicatedRows[0].session_id && dedicatedRows[0].session_id !== sessionId) {
          return { isStillOwner: false };
        }
        await supabase
          .from('admin_sessions')
          .update({ last_heartbeat: nowIso, is_active: true })
          .eq('id', dedicatedRows[0].id);
      }
    } catch (_) {}

    // 2. Refresh student_admissions legacy
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
    await ensureAuthenticatedSession();

    // 1. Delete from dedicated admin_sessions table
    try {
      await supabase.from('admin_sessions').delete().eq('lock_key', lockKey);
    } catch (_) {}

    // 2. Delete from student_admissions
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
 */
export function releaseSessionLockBeacon(email, isSuperAdmin) {
  try {
    const lockKey = getLockKey(email, isSuperAdmin);
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

    const headers = {
      apikey: supabaseAnonKey,
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // 1. Dispatch beacon to dedicated admin_sessions
    const urlDedicated = `${supabaseUrl}/rest/v1/admin_sessions?lock_key=eq.${encodeURIComponent(lockKey)}`;
    if (typeof fetch === 'function') {
      fetch(urlDedicated, {
        method: 'DELETE',
        headers,
        keepalive: true,
      }).catch(() => {});
    }

    // 2. Dispatch beacon to legacy student_admissions
    const urlLegacy = `${supabaseUrl}/rest/v1/student_admissions?relation=eq.Active%20Session&child_name=eq.${encodeURIComponent(lockKey)}`;
    if (typeof fetch === 'function') {
      fetch(urlLegacy, {
        method: 'DELETE',
        headers,
        keepalive: true,
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('releaseSessionLockBeacon note:', err);
  }
}

/**
 * Starts a reliable, non-throttled heartbeat timer using an inline Web Worker.
 * Web Workers run in an independent background thread and are not throttled
 * by Chrome / Edge when the browser tab is minimized or inactive.
 */
export function startHeartbeatTimer(callback, intervalMs = 4000) {
  if (typeof window === 'undefined') return () => {};

  let worker = null;
  let intervalId = null;

  try {
    const workerBlob = new Blob([`
      let timer = null;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          if (timer) clearInterval(timer);
          timer = setInterval(function() {
            self.postMessage('tick');
          }, ${Math.max(2000, intervalMs)});
        } else if (e.data === 'stop') {
          if (timer) clearInterval(timer);
          timer = null;
        }
      };
    `], { type: 'application/javascript' });

    const workerUrl = URL.createObjectURL(workerBlob);
    worker = new Worker(workerUrl);
    worker.onmessage = function() {
      callback();
    };
    worker.postMessage('start');

    return () => {
      try {
        if (worker) {
          worker.postMessage('stop');
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
        }
      } catch (_) {}
    };
  } catch (err) {
    // Fallback to standard setInterval if Worker creation fails
    intervalId = setInterval(callback, intervalMs);
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }
}
