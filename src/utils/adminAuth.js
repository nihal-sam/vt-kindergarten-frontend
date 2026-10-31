import { supabase } from '../supabaseClient.js';
import { checkSessionActive, killAdminSession } from './sessionLock.js';
import {
  checkLoginRateLimit,
  recordFailedLogin,
  recordSuccessfulLogin,
  sanitizeSecurityInput,
  checkRegistrationRateLimit,
  recordRegistrationAttempt,
} from './cyberSecurity.js';

export const SUPER_ADMIN_CREDENTIALS = {
  email: 'superadmin@vtkindergarten.com',
  password: 'rakesh123',
  name: 'Super Admin (Rakesh)',
  role: 'Super Administrator',
  phone: '7358293839',
  isSuperAdmin: true,
};

// Fallback legacy admin
export const LEGACY_ADMIN_CREDENTIALS = {
  email: 'admin@vtkindergarten.com',
  password: 'admin123',
  name: 'Administrator',
  role: 'Administrator',
  phone: '7358293839',
  isSuperAdmin: false,
};

// Helper: Generate 6-digit numeric OTP
export function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Automatically recognizes whether an admin account has Super Admin privileges.
 * If the user's name starts with "super" (case-insensitive), e.g. "Super Admin",
 * or email starts with "super", or role starts with "super",
 * the system recognizes them as Super Admin and routes them to /superadmin!
 */
export function checkIfSuperAdmin(adminObj = {}) {
  if (!adminObj) return false;
  const name = String(adminObj.name || '').toLowerCase().trim();
  const email = String(adminObj.email || '').toLowerCase().trim();
  const role = String(adminObj.role || '').toLowerCase().trim();

  return (
    name.startsWith('super') ||
    email.startsWith('super') ||
    role.startsWith('super') ||
    adminObj.isSuperAdmin === true ||
    email === 'superadmin@vtkindergarten.com'
  );
}

// Fetch all registered admins from dedicated admin_accounts table (with student_admissions fallback)
export async function fetchRegisteredAdmins() {
  let dbAdmins = [];
  try {
    await ensureAuthenticatedSession();
    // 1. Try dedicated admin_accounts API table first
    const { data: dedicatedData, error: dedicatedErr } = await supabase
      .from('admin_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!dedicatedErr && dedicatedData) {
      dbAdmins = dedicatedData.map((row) => ({
        id: row.id,
        created_at: row.created_at,
        name: row.name || 'Admin User',
        email: (row.email || '').toLowerCase().trim(),
        phone: row.phone || '',
        status: row.status || 'pending', // 'pending' | 'approved' | 'rejected'
        role: row.role || 'admin',
        password: row.password || '',
        phone_verified: row.phone_verified ?? true,
        approved_by: row.approved_by || null,
        approved_at: row.approved_at || null,
        rejected_by: row.rejected_by || null,
        rejected_at: row.rejected_at || null,
      }));
    } else {
      // 2. Fallback to legacy student_admissions table if dedicated table not yet created
      const { data, error } = await supabase
        .from('student_admissions')
        .select('*')
        .eq('relation', 'Admin Account')
        .order('created_at', { ascending: false });

      if (!error && data) {
        dbAdmins = data.map((row) => {
          let extra = {};
          try {
            extra = JSON.parse(row.message || '{}');
          } catch (_) {}

          return {
            id: row.id,
            created_at: row.created_at,
            name: row.child_name || row.parent_name || 'Admin User',
            email: (row.email || '').toLowerCase().trim(),
            phone: row.phone || extra.phone || '',
            status: row.status || 'pending',
            role: extra.role || 'admin',
            password: extra.password || '',
            phone_verified: extra.phone_verified ?? true,
            approved_by: extra.approved_by || null,
            approved_at: extra.approved_at || null,
            rejected_by: extra.rejected_by || null,
            rejected_at: extra.rejected_at || null,
          };
        });
      }
    }
  } catch (err) {
    console.error('Error in fetchRegisteredAdmins:', err);
  }

  // Load cached admins from localStorage to merge
  let localAdmins = [];
  try {
    const cached = localStorage.getItem('vt_registered_admins');
    if (cached) localAdmins = JSON.parse(cached);
  } catch (_) {}

  const emailMap = new Map();
  // 1. First add DB records
  for (const a of dbAdmins) {
    if (a.email) emailMap.set(a.email.toLowerCase(), a);
  }
  // 2. Merge local records
  for (const a of localAdmins) {
    const key = (a.email || '').toLowerCase();
    if (!key) continue;
    if (!emailMap.has(key)) {
      emailMap.set(key, a);
    } else {
      const existing = emailMap.get(key);
      // Keep approved status if local was marked approved
      if (a.status === 'approved' && existing.status !== 'approved') {
        emailMap.set(key, { ...existing, status: 'approved' });
      }
      if (a.password && !existing.password) {
        emailMap.set(key, { ...existing, password: a.password });
      }
    }
  }

  const combined = Array.from(emailMap.values());
  try {
    localStorage.setItem('vt_registered_admins', JSON.stringify(combined));
  } catch (_) {}

  return combined;
}

// Register a new admin account (Pending Super Admin Approval)
export async function registerNewAdmin({ name, email, phone, password }) {
  // 1. Anti-spam / bot rate limit check
  const rateLimit = checkRegistrationRateLimit();
  if (!rateLimit.allowed) {
    return { success: false, error: rateLimit.error };
  }

  // 2. Cyber injection sanitization guard
  const nameSec = sanitizeSecurityInput(name, 'Name');
  if (!nameSec.isSafe) return { success: false, error: nameSec.error };

  const emailSec = sanitizeSecurityInput(email, 'Email Address');
  if (!emailSec.isSafe) return { success: false, error: emailSec.error };

  const phoneSec = sanitizeSecurityInput(phone, 'Phone Number');
  if (!phoneSec.isSafe) return { success: false, error: phoneSec.error };

  const cleanEmail = emailSec.clean.toLowerCase().trim();
  const cleanPhone = phoneSec.clean.replace(/\D/g, '').slice(-10);

  if (cleanEmail === SUPER_ADMIN_CREDENTIALS.email) {
    return { success: false, error: 'This email is reserved for the Super Admin.' };
  }

  // Check if email already registered
  const existing = await fetchRegisteredAdmins();
  const exists = existing.some((a) => a.email === cleanEmail);
  if (exists) {
    return { success: false, error: 'An admin account with this email address already exists.' };
  }

  recordRegistrationAttempt();

  try {
    await ensureAuthenticatedSession();

    // 1. Try dedicated admin_accounts API table first
    const { data: dedicatedData, error: dedicatedErr } = await supabase
      .from('admin_accounts')
      .insert([
        {
          name: name.trim(),
          email: cleanEmail,
          phone: cleanPhone || '7358293839',
          password: password,
          role: 'admin',
          status: 'pending', // Must be approved by superadmin
          phone_verified: true,
        },
      ])
      .select();

    if (!dedicatedErr && dedicatedData && dedicatedData[0]) {
      const row = dedicatedData[0];
      const newAdmin = {
        id: row.id,
        created_at: row.created_at || new Date().toISOString(),
        name: row.name,
        email: row.email,
        phone: row.phone,
        status: row.status,
        role: row.role,
        password: row.password,
        phone_verified: true,
      };
      const updated = [newAdmin, ...existing.filter((a) => a.email !== cleanEmail)];
      localStorage.setItem('vt_registered_admins', JSON.stringify(updated));
      return { success: true, admin: newAdmin };
    }

    // 2. Fallback to legacy student_admissions table
    const payload = {
      role: 'admin',
      password: password,
      phone_verified: true,
      registered_at: new Date().toISOString(),
      approved_by: null,
      approved_at: null,
    };

    const { data, error } = await supabase
      .from('student_admissions')
      .insert([
        {
          child_name: name.trim(),
          parent_name: name.trim(),
          email: cleanEmail,
          phone: cleanPhone || '7358293839',
          relation: 'Admin Account',
          status: 'pending',
          program: 'Administrator',
          message: JSON.stringify(payload),
        },
      ])
      .select();

    if (error) {
      console.warn('Fallback admin registration warning:', error.message);
      const newAdmin = {
        id: 'local_' + Date.now(),
        created_at: new Date().toISOString(),
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        status: 'pending',
        role: 'admin',
        password: password,
        phone_verified: true,
      };
      const updated = [newAdmin, ...existing.filter((a) => a.email !== cleanEmail)];
      localStorage.setItem('vt_registered_admins', JSON.stringify(updated));
      return { success: true, admin: newAdmin, isLocal: true };
    }

    const row = data && data[0];
    const newAdmin = {
      id: row ? row.id : 'adm_' + Date.now(),
      created_at: row ? row.created_at : new Date().toISOString(),
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      status: 'pending',
      role: 'admin',
      password: password,
      phone_verified: true,
    };

    const updated = [newAdmin, ...existing.filter((a) => a.id !== newAdmin.id && a.email !== cleanEmail)];
    localStorage.setItem('vt_registered_admins', JSON.stringify(updated));
    return { success: true, admin: newAdmin };
  } catch (err) {
    console.error('Registration exception:', err);
    return { success: false, error: 'Network error during registration. Please try again.' };
  }
}

// Helper to ensure authenticated Supabase session with signed Bearer token so RLS policies permit operations
export async function ensureAuthenticatedSession() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.access_token) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@vtkindergarten.com',
        password: 'admin123',
      });
      if (data?.session?.access_token) {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          window.sessionStorage.setItem('vt_supabase_token', data.session.access_token);
        }
        return data.session.access_token;
      }
      if (error) {
        console.warn('Bearer auth handshake warning:', error.message);
      }
    } else {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem('vt_supabase_token', session.access_token);
      }
      return session.access_token;
    }
  } catch (err) {
    console.warn('ensureAuthenticatedSession warning:', err);
  }
}

// Approve admin registration (by Super Admin)
export async function approveAdmin(adminIdOrEmail, superAdminEmail = SUPER_ADMIN_CREDENTIALS.email) {
  try {
    await ensureAuthenticatedSession();
    const isEmail = typeof adminIdOrEmail === 'string' && adminIdOrEmail.includes('@');
    const cleanIdentifier = String(adminIdOrEmail).toLowerCase().trim();
    const nowIso = new Date().toISOString();

    // 1. Try updating dedicated admin_accounts table
    try {
      let query = supabase.from('admin_accounts').update({
        status: 'approved',
        approved_by: superAdminEmail,
        approved_at: nowIso,
      });
      if (isEmail) {
        query = query.eq('email', cleanIdentifier);
      } else {
        query = query.eq('id', adminIdOrEmail);
      }
      await query;
    } catch (_) {}

    // 2. Also update student_admissions for complete dual compatibility
    try {
      let q2 = supabase.from('student_admissions').select('*').eq('relation', 'Admin Account');
      if (isEmail) {
        q2 = q2.eq('email', cleanIdentifier);
      } else {
        q2 = q2.eq('id', adminIdOrEmail);
      }
      const { data: rows } = await q2.limit(1);
      const row = rows && rows[0];
      if (row) {
        let extra = {};
        if (row.message) {
          try { extra = JSON.parse(row.message); } catch (_) {}
        }
        extra.approved_by = superAdminEmail;
        extra.approved_at = nowIso;
        await supabase.from('student_admissions').delete().eq('id', row.id);
        await supabase.from('student_admissions').insert([{
          child_name: row.child_name,
          parent_name: row.parent_name,
          email: row.email,
          phone: row.phone || '7358293839',
          relation: 'Admin Account',
          status: 'approved',
          program: 'Administrator',
          message: JSON.stringify(extra),
        }]);
      }
    } catch (_) {}

    // 3. Update local storage
    const cached = localStorage.getItem('vt_registered_admins');
    if (cached) {
      const list = JSON.parse(cached).map((a) =>
        (a.id === adminIdOrEmail || (a.email && a.email.toLowerCase() === cleanIdentifier))
          ? { ...a, status: 'approved', approved_by: superAdminEmail, approved_at: nowIso }
          : a
      );
      localStorage.setItem('vt_registered_admins', JSON.stringify(list));
    }

    return { success: true };
  } catch (err) {
    console.error('approveAdmin error:', err);
    return { success: false, error: err.message };
  }
}

// Reject admin registration (by Super Admin)
export async function rejectAdmin(adminId, superAdminEmail = SUPER_ADMIN_CREDENTIALS.email, adminEmail = '') {
  try {
    await ensureAuthenticatedSession();
    const nowIso = new Date().toISOString();
    let cleanEmail = (adminEmail || (typeof adminId === 'string' && adminId.includes('@') ? adminId : '')).toLowerCase().trim();

    // 1. Try dedicated admin_accounts table
    try {
      const { data: accData } = await supabase
        .from('admin_accounts')
        .update({
          status: 'rejected',
          rejected_by: superAdminEmail,
          rejected_at: nowIso,
        })
        .eq('id', adminId)
        .select('email');

      if (!cleanEmail && accData && accData[0]?.email) {
        cleanEmail = accData[0].email.toLowerCase().trim();
      }
    } catch (_) {}

    // 2. Also update student_admissions legacy
    try {
      const { data: row } = await supabase
        .from('student_admissions')
        .select('*')
        .eq('id', adminId)
        .single();

      if (row) {
        if (!cleanEmail && row.email) cleanEmail = row.email.toLowerCase().trim();
        let extra = {};
        if (row.message) {
          try { extra = JSON.parse(row.message); } catch (_) {}
        }
        extra.rejected_by = superAdminEmail;
        extra.rejected_at = nowIso;

        await supabase.from('student_admissions').delete().eq('id', adminId);
        await supabase.from('student_admissions').insert([{
          child_name: row.child_name,
          parent_name: row.parent_name,
          email: row.email,
          phone: row.phone || '7358293839',
          relation: 'Admin Account',
          status: 'rejected',
          program: 'Administrator',
          message: JSON.stringify(extra),
        }]);
      }
    } catch (_) {}

    // 3. Immediately kill active sessions and heartbeats
    if (cleanEmail) {
      await killAdminSession(cleanEmail);
    }

    // 4. Update local storage
    const cached = localStorage.getItem('vt_registered_admins');
    if (cached) {
      const list = JSON.parse(cached).map((a) =>
        a.id === adminId ? { ...a, status: 'rejected' } : a
      );
      localStorage.setItem('vt_registered_admins', JSON.stringify(list));
    }

    return { success: true };
  } catch (err) {
    console.error('rejectAdmin error:', err);
    return { success: false, error: err.message };
  }
}

// Delete admin account (by Super Admin)
export async function deleteAdmin(adminId, adminEmail = '') {
  try {
    await ensureAuthenticatedSession();
    const cleanEmail = (adminEmail || (typeof adminId === 'string' && adminId.includes('@') ? adminId : '')).toLowerCase().trim();

    // 1. Delete from dedicated admin_accounts table
    try {
      if (adminId && !String(adminId).startsWith('local_')) {
        await supabase.from('admin_accounts').delete().eq('id', adminId);
      }
      if (cleanEmail) {
        await supabase.from('admin_accounts').delete().eq('email', cleanEmail);
      }
    } catch (_) {}

    // 2. Delete from student_admissions legacy
    try {
      if (adminId && !String(adminId).startsWith('local_')) {
        await supabase.from('student_admissions').delete().eq('id', adminId);
      }
      if (cleanEmail) {
        await supabase
          .from('student_admissions')
          .delete()
          .eq('relation', 'Admin Account')
          .eq('email', cleanEmail);
      }
    } catch (_) {}

    // 3. Immediately kill active sessions and heartbeats
    if (cleanEmail) {
      await killAdminSession(cleanEmail);
    }

    // 4. Update localStorage cache
    const cached = localStorage.getItem('vt_registered_admins');
    if (cached) {
      const list = JSON.parse(cached).filter((a) => {
        const matchId = String(a.id) === String(adminId);
        const matchEmail = cleanEmail && (a.email || '').toLowerCase() === cleanEmail;
        return !matchId && !matchEmail;
      });
      localStorage.setItem('vt_registered_admins', JSON.stringify(list));
    }

    return { success: true };
  } catch (err) {
    console.error('deleteAdmin error:', err);
    return { success: false, error: err.message };
  }
}

// Validate credentials for Login and ensure single active session policy with Brute-Force Cyber Guard
export async function verifyAdminCredentials(email, password) {
  const cleanEmail = (email || '').toLowerCase().trim();

  // 1. Cyber Security: Check Brute-Force Rate Limiting Lockout
  const rateLimit = checkLoginRateLimit(cleanEmail);
  if (!rateLimit.allowed) {
    return {
      status: 'rate_limited',
      error: rateLimit.error,
      remainingSeconds: rateLimit.remainingSeconds,
    };
  }

  // 2. Cyber Security: Sanitize against SQL/XSS/Command Injections
  const emailSec = sanitizeSecurityInput(email, 'Email Address');
  if (!emailSec.isSafe) {
    recordFailedLogin(cleanEmail);
    return { status: 'invalid_credentials', error: emailSec.error };
  }
  const passSec = sanitizeSecurityInput(password, 'Password');
  if (!passSec.isSafe) {
    recordFailedLogin(cleanEmail);
    return { status: 'invalid_credentials', error: passSec.error };
  }

  // Helper for failed attempt feedback
  const handleAuthFailure = (errorMsg) => {
    recordFailedLogin(cleanEmail);
    const updatedCheck = checkLoginRateLimit(cleanEmail);
    if (!updatedCheck.allowed) {
      return { status: 'rate_limited', error: updatedCheck.error };
    }
    const warning =
      updatedCheck.attemptsRemaining <= 2
        ? ` Warning: Only ${updatedCheck.attemptsRemaining} attempt(s) remaining before automatic security lockout.`
        : '';
    return { status: 'invalid_credentials', error: `${errorMsg}${warning}` };
  };

  // 3. Check Super Admin
  if (
    cleanEmail === SUPER_ADMIN_CREDENTIALS.email &&
    password === SUPER_ADMIN_CREDENTIALS.password
  ) {
    // Check if another Super Admin session is already active
    const lockCheck = await checkSessionActive(cleanEmail, true);
    if (lockCheck.isLocked) {
      return {
        status: 'already_logged_in',
        isSuperAdmin: true,
        error: '⚠️ Already Logged In: Super Admin is currently logged in on another device or window. Only one active Super Admin session is allowed at a time. If the previous window was closed, please wait a few seconds and try again.',
      };
    }

    recordSuccessfulLogin(cleanEmail);
    return {
      status: 'ok',
      isSuperAdmin: true,
      admin: { ...SUPER_ADMIN_CREDENTIALS },
    };
  }

  // 4. Check Legacy Master Admin
  if (
    (cleanEmail === 'admin@vtkindergarten.com' || cleanEmail === 'admin2@vtkindergarten.com') &&
    (password === 'admin123' || password === 'AdminPassword123!')
  ) {
    const lockCheck = await checkSessionActive(cleanEmail, false);
    if (lockCheck.isLocked) {
      return {
        status: 'already_logged_in',
        isSuperAdmin: false,
        error: '⚠️ Already Logged In: This admin account is currently active on another device or window. Only one active session is allowed at a time. If the previous window was closed, please wait a few seconds and try again.',
      };
    }

    recordSuccessfulLogin(cleanEmail);
    return {
      status: 'ok',
      isSuperAdmin: false,
      admin: {
        email: cleanEmail,
        name: cleanEmail.startsWith('admin2') ? 'Admin 2' : 'Admin 1',
        phone: '7358293839',
        role: 'Administrator',
        status: 'approved',
      },
    };
  }

  // 5. Check Registered Admins from Supabase & Local Cache (Both Super Admin and Normal Admin)
  const admins = await fetchRegisteredAdmins();
  const found = admins.find((a) => a.email === cleanEmail);

  if (!found) {
    return handleAuthFailure('No administrator account found with this email address.');
  }

  if (found.password !== password) {
    return handleAuthFailure('Incorrect password. Please verify and try again.');
  }

  // Automatically detect if account has Super Admin privileges (name/email/role starts with "super")
  const isSuper = checkIfSuperAdmin(found);
  const adminObj = {
    ...found,
    isSuperAdmin: isSuper,
    role: isSuper ? (found.role?.toLowerCase().includes('super') ? found.role : 'Super Administrator') : (found.role || 'Administrator'),
  };

  // Check approval status (Normal Admins require approval; Super Admins are automatically approved)
  if (!isSuper && found.status === 'pending') {
    return {
      status: 'pending',
      error: '⏳ Account Pending Approval: Super Admin has not yet confirmed your registration. Please contact the Super Admin.',
      admin: adminObj,
    };
  }

  if (!isSuper && found.status === 'rejected') {
    return {
      status: 'rejected',
      error: '❌ Access Denied: Your admin registration was rejected by the Super Admin.',
      admin: adminObj,
    };
  }

  // Check if this admin account is already active on another device/window
  const lockCheck = await checkSessionActive(cleanEmail, isSuper);
  if (lockCheck.isLocked) {
    return {
      status: 'already_logged_in',
      isSuperAdmin: isSuper,
      error: isSuper
        ? '⚠️ Already Logged In: Super Admin is currently logged in on another device or window. Only one active Super Admin session is allowed at a time. If the previous window was closed, please wait a few seconds and try again.'
        : '⚠️ Already Logged In: This admin account is currently active on another device or window. Only one active session is allowed at a time. If the previous window was closed, please wait a few seconds and try again.',
    };
  }

  recordSuccessfulLogin(cleanEmail);
  return {
    status: 'ok',
    isSuperAdmin: isSuper,
    admin: adminObj,
  };
}
