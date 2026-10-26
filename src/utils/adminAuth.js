import { supabase } from '../supabaseClient';

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

// Fetch all registered admins from Supabase student_admissions (relation = 'Admin Account')
export async function fetchRegisteredAdmins() {
  let dbAdmins = [];
  try {
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
          status: row.status || 'pending', // 'pending' | 'approved' | 'rejected'
          role: extra.role || 'admin',
          password: extra.password || '',
          phone_verified: extra.phone_verified ?? true,
          approved_by: extra.approved_by || null,
          approved_at: extra.approved_at || null,
        };
      });
    } else if (error) {
      console.warn('Supabase fetchRegisteredAdmins error:', error.message);
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
  const cleanEmail = email.toLowerCase().trim();
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);

  if (cleanEmail === SUPER_ADMIN_CREDENTIALS.email) {
    return { success: false, error: 'This email is reserved for the Super Admin.' };
  }

  // Check if email already registered
  const existing = await fetchRegisteredAdmins();
  const exists = existing.some((a) => a.email === cleanEmail);
  if (exists) {
    return { success: false, error: 'An admin account with this email address already exists.' };
  }

  const payload = {
    role: 'admin',
    password: password,
    phone_verified: true,
    registered_at: new Date().toISOString(),
    approved_by: null,
    approved_at: null,
  };

  try {
    const { data, error } = await supabase
      .from('student_admissions')
      .insert([
        {
          child_name: name.trim(),
          parent_name: name.trim(),
          email: cleanEmail,
          phone: cleanPhone || '7358293839',
          relation: 'Admin Account',
          status: 'pending', // Must be approved by superadmin
          program: 'Administrator',
          message: JSON.stringify(payload),
        },
      ])
      .select();

    if (error) {
      console.error('Supabase admin registration error:', error.message);
      // Fallback local save
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

// Helper to ensure authenticated Supabase session so RLS policies permit DELETE/UPDATE operations
export async function ensureAuthenticatedSession() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      await supabase.auth.signInWithPassword({
        email: 'admin@vtkindergarten.com',
        password: 'admin123',
      });
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

    // 1. Fetch current row from Supabase
    let query = supabase.from('student_admissions').select('*').eq('relation', 'Admin Account');
    if (isEmail) {
      query = query.eq('email', cleanIdentifier);
    } else {
      query = query.eq('id', adminIdOrEmail);
    }
    const { data: rows } = await query.limit(1);
    const row = rows && rows[0];

    if (row) {
      let extra = {};
      if (row.message) {
        try {
          extra = JSON.parse(row.message);
        } catch (_) {}
      }

      extra.approved_by = superAdminEmail;
      extra.approved_at = new Date().toISOString();

      // Delete old and re-insert with approved status
      await supabase.from('student_admissions').delete().eq('id', row.id);

      const clone = {
        child_name: row.child_name,
        parent_name: row.parent_name,
        email: row.email,
        phone: row.phone || '7358293839',
        relation: 'Admin Account',
        status: 'approved',
        program: 'Administrator',
        message: JSON.stringify(extra),
      };

      await supabase.from('student_admissions').insert([clone]);
    }

    // 2. Update local storage
    const cached = localStorage.getItem('vt_registered_admins');
    if (cached) {
      const list = JSON.parse(cached).map((a) =>
        (a.id === adminIdOrEmail || (a.email && a.email.toLowerCase() === cleanIdentifier))
          ? { ...a, status: 'approved', approved_by: superAdminEmail, approved_at: new Date().toISOString() }
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
export async function rejectAdmin(adminId, superAdminEmail = SUPER_ADMIN_CREDENTIALS.email) {
  try {
    await ensureAuthenticatedSession();
    const { data: row } = await supabase
      .from('student_admissions')
      .select('*')
      .eq('id', adminId)
      .single();

    if (row) {
      let extra = {};
      if (row.message) {
        try {
          extra = JSON.parse(row.message);
        } catch (_) {}
      }

      extra.rejected_by = superAdminEmail;
      extra.rejected_at = new Date().toISOString();

      await supabase.from('student_admissions').delete().eq('id', adminId);

      const clone = {
        child_name: row.child_name,
        parent_name: row.parent_name,
        email: row.email,
        phone: row.phone || '7358293839',
        relation: 'Admin Account',
        status: 'rejected',
        program: 'Administrator',
        message: JSON.stringify(extra),
      };

      await supabase.from('student_admissions').insert([clone]);
    }

    // Update local storage
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

    // 1. Delete by numeric/string ID if valid
    if (adminId && !String(adminId).startsWith('local_')) {
      const { error: idErr } = await supabase
        .from('student_admissions')
        .delete()
        .eq('id', adminId);
      if (idErr) console.warn('Supabase delete by id error:', idErr.message);
    }

    // 2. Delete by email to remove all related records in student_admissions
    if (cleanEmail) {
      const { error: emailErr } = await supabase
        .from('student_admissions')
        .delete()
        .eq('relation', 'Admin Account')
        .eq('email', cleanEmail);
      if (emailErr) console.warn('Supabase delete by email error:', emailErr.message);
    }

    // 3. Update localStorage cache
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

// Validate credentials for Login
export async function verifyAdminCredentials(email, password) {
  const cleanEmail = email.toLowerCase().trim();

  // 1. Check Super Admin
  if (
    cleanEmail === SUPER_ADMIN_CREDENTIALS.email &&
    password === SUPER_ADMIN_CREDENTIALS.password
  ) {
    return {
      status: 'ok',
      isSuperAdmin: true,
      admin: { ...SUPER_ADMIN_CREDENTIALS },
    };
  }

  // 2. Check Legacy Master Admin
  if (
    (cleanEmail === 'admin@vtkindergarten.com' || cleanEmail === 'admin2@vtkindergarten.com') &&
    (password === 'admin123' || password === 'AdminPassword123!')
  ) {
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

  // 3. Check Registered Admins from Supabase & Local Cache
  const admins = await fetchRegisteredAdmins();
  const found = admins.find((a) => a.email === cleanEmail);

  if (!found) {
    return { status: 'invalid_credentials', error: 'No admin account found with this email address.' };
  }

  if (found.password !== password) {
    return { status: 'invalid_credentials', error: 'Incorrect password. Please try again.' };
  }

  // Check approval status
  if (found.status === 'pending') {
    return {
      status: 'pending',
      error: '⏳ Account Pending Approval: Super Admin (superadmin@vtkindergarten.com) has not yet confirmed your registration. Please contact the Super Admin.',
      admin: found,
    };
  }

  if (found.status === 'rejected') {
    return {
      status: 'rejected',
      error: '❌ Access Denied: Your admin registration was rejected by the Super Admin.',
      admin: found,
    };
  }

  // Status is approved -> Direct login ok with credentials & CAPTCHA!
  return {
    status: 'ok',
    isSuperAdmin: false,
    admin: found,
  };
}
