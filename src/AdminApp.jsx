import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabaseClient";
import "./admin.css";

const LOGO_SRC = '/assets/vt-logo.png';

const initialAdmissionForm = {
  child_name: '', dob: '', gender: '',
  program: '', parent_name: '', relation: '',
  phone: '', email: '', address: '',
  previous_school: '', message: ''
};

const formatDate = (isoStr) => {
  if (!isoStr) return '-';
  try {
    return new Date(isoStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  } catch {
    return isoStr;
  }
};

const timeAgo = (isoStr) => {
  if (!isoStr) return '-';
  try {
    const diffMs = Date.now() - new Date(isoStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(isoStr).split(',')[0];
  } catch {
    return '-';
  }
};

const parseUserAgent = (ua = '') => {
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  let browser = 'Browser';
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Chrome/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';

  let os = 'Device';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Macintosh|Mac OS/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad/i.test(ua)) os = 'iOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  return { isMobile, browser, os };
};

const getWhatsAppUrl = (phone = '') => {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '#';
  const full = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${full}`;
};

const isProgramMatch = (itemProgram = '', selectedFilter = '') => {
  if (!selectedFilter) return true;
  const item = (itemProgram || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const filter = (selectedFilter || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  if (!item) return false;
  if (item === filter) return true;

  // Flexible keyword matching for kindergarten grades
  if (filter.includes('play') && item.includes('play')) return true;
  if (filter.includes('pre') && item.includes('pre')) return true;
  if (filter.includes('lkg') && item.includes('lkg')) return true;
  if (filter.includes('ukg') && item.includes('ukg')) return true;

  return item.includes(filter) || filter.includes(item);
};

function useAuth() {
  const [session, setSession] = useState(null);
  const [localAdmin, setLocalAdmin] = useState(() => {
    try {
      const saved = localStorage.getItem('vt_admin_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginLocal = (user) => {
    localStorage.setItem('vt_admin_session', JSON.stringify(user));
    setLocalAdmin(user);
  };

  const logout = async () => {
    localStorage.removeItem('vt_admin_session');
    setLocalAdmin(null);
    try {
      await supabase.auth.signOut();
    } catch {}
  };

  const currentAdmin = session?.user || localAdmin;
  const isAuth = !!session || !!localAdmin;

  return { session, admin: currentAdmin, loginLocal, logout, isAuth, loading };
}

/* ==========================================================================
   ORIGINAL LOGIN PAGE DESIGN (Restored exact look & feel)
   ========================================================================== */
const s = {
  loginWrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg,#1a1a2e,#16213e)',
    fontFamily: "'Nunito',sans-serif",
    padding: 20,
    boxSizing: 'border-box',
  },
  loginCard: {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: '48px 40px',
    width: 420,
    maxWidth: '95vw',
    boxSizing: 'border-box',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  loginLogo: {
    width: 112,
    height: 112,
    display: 'block',
    margin: '0 auto 16px',
    padding: 4,
    borderRadius: '50%',
    background: 'white',
    objectFit: 'contain',
    boxShadow: '0 12px 32px rgba(255,107,53,0.24)',
    boxSizing: 'border-box',
  },
  fg: {
    marginBottom: 20,
  },
  label: {
    display: 'block',
    marginBottom: 8,
    fontWeight: 700,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  inp: {
    width: '100%',
    background: 'rgba(255,255,255,0.08)',
    border: '1.5px solid rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: '14px 18px',
    color: 'white',
    fontSize: 15,
    fontFamily: "'Nunito',sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, background 0.2s',
  },
  err: {
    background: 'rgba(255,0,0,0.15)',
    border: '1px solid rgba(255,0,0,0.3)',
    borderRadius: 10,
    padding: '12px 16px',
    color: '#ff8888',
    marginBottom: 16,
    fontSize: 14,
    fontWeight: 700,
    textAlign: 'center',
  },
  loginBtn: {
    width: '100%',
    background: 'linear-gradient(135deg,#FF6B35,#FFD93D)',
    border: 'none',
    borderRadius: 12,
    padding: 16,
    color: 'white',
    fontSize: 16,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: "'Nunito',sans-serif",
    boxShadow: '0 8px 24px rgba(255,107,53,0.28)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
};

function LoginPage({ onLocalLogin }) {
  const [form, setForm] = useState({ email: 'admin@vtkindergarten.com', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const emailTrimmed = (form.email || '').trim().toLowerCase();
    const isMasterCredentials =
      (emailTrimmed === 'admin@vtkindergarten.com' || emailTrimmed === 'admin2@vtkindergarten.com') &&
      (form.password === 'admin123' || form.password === 'AdminPassword123!');

    try {
      // 1. Authenticate with Supabase Auth (establishes JWT token for Row Level Security)
      const { data, error: loginErr } = await supabase.auth.signInWithPassword({
        email: emailTrimmed,
        password: form.password,
      });

      if (!loginErr && data?.session) {
        // Authenticated with Supabase! useAuth onAuthStateChange handles session state
        setLoading(false);
        return;
      }

      // 2. If Supabase Auth fails but master credentials were used, allow local login
      if (isMasterCredentials) {
        onLocalLogin?.({
          email: form.email,
          name: emailTrimmed.startsWith('admin2') ? 'Admin 2' : 'Admin 1',
          role: 'Administrator',
        });
        setLoading(false);
        return;
      }

      setError(loginErr?.message || 'Invalid email or password.');
    } catch {
      if (isMasterCredentials) {
        onLocalLogin?.({
          email: form.email,
          name: 'Admin',
          role: 'Administrator',
        });
      } else {
        setError('Connection failed. Please check your network connection.');
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={s.loginWrap}>
      <style>{`
        @media (max-width: 768px) {
          .admin-login-card { padding: 32px 24px !important; width: 100% !important; border-radius: 16px !important; }
        }
      `}</style>
      <div style={s.loginCard} className="admin-login-card">
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <img style={s.loginLogo} src={LOGO_SRC} alt="VT Kindergarten Pre School logo" />
          <h1 style={{ fontFamily: 'sans-serif', fontSize: 28, color: '#FF6B35', margin: '0 0 6px' }}>VT Kindergarten</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>Admin Portal</p>
        </div>
        <form onSubmit={submit}>
          <div style={s.fg}>
            <label style={s.label}>Email Address</label>
            <input
              style={s.inp}
              type="email"
              placeholder="admin@vtkindergarten.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div style={s.fg}>
            <label style={s.label}>Password</label>
            <input
              style={s.inp}
              type="password"
              placeholder="Enter password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          {error && <div style={s.err}>{error}</div>}
          <button style={s.loginBtn} type="submit" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In to Admin'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#888' }}>
          Admin 1: admin@vtkindergarten.com / admin123<br />
          Admin 2: admin2@vtkindergarten.com / admin123
        </p>
      </div>
    </div>
  );
}


/* ==========================================================================
   NEW ADMISSION FORM (Clean & Elegant Modern Card)
   ========================================================================== */
function AdmissionApplicationBox({ onSubmitted, onCancel }) {
  const [form, setForm] = useState({ ...initialAdmissionForm });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: supabaseError } = await supabase
        .from('admissions')
        .insert([{ ...form, status: 'pending' }]);

      if (supabaseError) {
        setError(supabaseError.message || 'Submission failed. Please try again.');
      } else {
        setSuccess(true);
        setForm({ ...initialAdmissionForm });
        onSubmitted?.();
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const submitAnother = () => {
    setSuccess(false);
    setError('');
  };

  return (
    <div className="vta-form-card">
      <div className="vta-form-card-header">
        <div>
          <span className="vta-badge-pill vta-badge-orange">New Enrollment</span>
          <h3>Manual Admission Application</h3>
          <p>Register a child directly into the school admissions database.</p>
        </div>
        {onCancel && (
          <button type="button" className="vta-btn-secondary" onClick={onCancel}>
            Close Form
          </button>
        )}
      </div>

      {success ? (
        <div className="vta-form-success">
          <div className="vta-success-icon">&check;</div>
          <h4>Admission Successfully Recorded!</h4>
          <p>The student application has been stored and marked as pending review.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 18 }}>
            <button type="button" className="vta-btn-primary" onClick={submitAnother}>
              + Enroll Another Child
            </button>
            {onCancel && (
              <button type="button" className="vta-btn-secondary" onClick={onCancel}>
                View Admissions List
              </button>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="vta-admission-form">
          <div className="vta-form-section-title">1. Child's Details</div>
          <div className="vta-grid-2">
            <div className="vta-field">
              <label>Child's Full Name *</label>
              <input
                name="child_name"
                placeholder="e.g. Aarav Kumar"
                value={form.child_name}
                onChange={handle}
                required
              />
            </div>
            <div className="vta-field">
              <label>Date of Birth * (DD/MM/YYYY)</label>
              <input
                type="text"
                name="dob"
                placeholder="DD/MM/YYYY"
                value={form.dob}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '');
                  let formatted = val;
                  if (val.length > 2) formatted = val.slice(0, 2) + '/' + val.slice(2);
                  if (val.length > 4) formatted = formatted.slice(0, 5) + '/' + val.slice(4, 8);
                  e.target.value = formatted;
                  handle(e);
                }}
                required
              />
            </div>
          </div>

          <div className="vta-grid-2">
            <div className="vta-field">
              <label>Gender *</label>
              <select name="gender" value={form.gender} onChange={handle} required>
                <option value="">Select Gender</option>
                <option>Male</option>
                <option>Female</option>
              </select>
            </div>
            <div className="vta-field">
              <label>Program Applying For *</label>
              <select name="program" value={form.program} onChange={handle} required>
                <option value="">Select Program</option>
                <option>Play Group (2+ yrs)</option>
                <option>Pre KG (3+ yrs)</option>
                <option>LKG (4+ yrs)</option>
                <option>UKG (5+ yrs)</option>
              </select>
            </div>
          </div>

          <div className="vta-form-section-title" style={{ marginTop: 24 }}>2. Parent / Guardian Details</div>
          <div className="vta-grid-2">
            <div className="vta-field">
              <label>Parent / Guardian Name *</label>
              <input
                name="parent_name"
                placeholder="e.g. Rajesh Kumar"
                value={form.parent_name}
                onChange={handle}
                required
              />
            </div>
            <div className="vta-field">
              <label>Relation to Child *</label>
              <select name="relation" value={form.relation} onChange={handle} required>
                <option value="">Select Relation</option>
                <option>Father</option>
                <option>Mother</option>
                <option>Guardian</option>
              </select>
            </div>
          </div>

          <div className="vta-grid-2">
            <div className="vta-field">
              <label>Phone Number *</label>
              <input
                name="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={handle}
                required
              />
            </div>
            <div className="vta-field">
              <label>Email Address</label>
              <input
                name="email"
                type="email"
                placeholder="parent@example.com"
                value={form.email}
                onChange={handle}
              />
            </div>
          </div>

          <div className="vta-field" style={{ marginTop: 12 }}>
            <label>Residential Address *</label>
            <input
              name="address"
              placeholder="Door No, Street Name, Karaikudi"
              value={form.address}
              onChange={handle}
              required
            />
          </div>

          <div className="vta-grid-2" style={{ marginTop: 12 }}>
            <div className="vta-field">
              <label>Previous School (if any)</label>
              <input
                name="previous_school"
                placeholder="School name"
                value={form.previous_school}
                onChange={handle}
              />
            </div>
            <div className="vta-field">
              <label>Special Notes / Remarks</label>
              <input
                name="message"
                placeholder="Dietary, allergies, or special requirements"
                value={form.message}
                onChange={handle}
              />
            </div>
          </div>

          {error && <div className="vta-alert-error" style={{ marginTop: 16 }}>{error}</div>}

          <div className="vta-form-actions">
            {onCancel && (
              <button type="button" className="vta-btn-secondary" onClick={onCancel}>
                Cancel
              </button>
            )}
            <button type="submit" className="vta-btn-primary" disabled={loading}>
              {loading ? 'Submitting Application...' : 'Save & Submit Admission'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}


/* ==========================================================================
   TOP RIGHT TABLE CONTROLS & PAGINATION COMPONENT
   ========================================================================== */
function TablePaginationTop({ currentPage, totalItems, pageSize, onPageChange, onPageSizeChange, onRefresh, loading }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return (
    <div className="vta-pagination-top">
      {/* 🔄 Recall API / Refresh Button */}
      {onRefresh && (
        <>
          <button
            type="button"
            className={`vta-top-refresh-btn ${loading ? 'is-syncing' : ''}`}
            onClick={onRefresh}
            disabled={loading}
            title="Recall API & Refresh data from Supabase"
          >
            <span className={`vta-refresh-icon ${loading ? 'vta-spin' : ''}`}>🔄</span>
            <span className="vta-top-refresh-label">{loading ? 'Syncing...' : 'Refresh'}</span>
          </button>
          <div className="vta-top-sep" />
        </>
      )}

      {/* Rows Per Page Dropdown */}
      <div className="vta-top-size-wrap">
        <span>Rows:</span>
        <select
          className="vta-top-size-select"
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value));
            onPageChange(1);
          }}
          title="Select rows per page"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      <div className="vta-top-sep" />

      {/* Previous / Next Page Nav */}
      <div className="vta-top-nav-wrap">
        <button
          type="button"
          className="vta-top-nav-btn"
          disabled={totalItems === 0 || currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          title="Previous Page"
        >
          &larr; Prev
        </button>

        <span className="vta-top-page-text">
          {totalItems === 0 ? (
            <span>0 of 0</span>
          ) : (
            <>Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></>
          )}
        </span>

        <button
          type="button"
          className="vta-top-nav-btn"
          disabled={totalItems === 0 || currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          title="Next Page"
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
}

/* ==========================================================================
   DASHBOARD MAIN COMPONENT
   ========================================================================== */
function Dashboard({ admin, logout }) {
  const [tab, setTab] = useState('overview');
  const [admissions, setAdmissions] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [visitsCount, setVisitsCount] = useState(0);
  const [visitsList, setVisitsList] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [refreshBanner, setRefreshBanner] = useState(false);
  const [search, setSearch] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewItem, setViewItem] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Pagination states
  const [pageSizeAdm, setPageSizeAdm] = useState(10);
  const [pageAdm, setPageAdm] = useState(1);

  const [pageSizeEnq, setPageSizeEnq] = useState(10);
  const [pageEnq, setPageEnq] = useState(1);

  const [pageSizeVis, setPageSizeVis] = useState(10);
  const [pageVis, setPageVis] = useState(1);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // 1. Fetch Admissions & Enquiries from Supabase API
      const { data, error } = await supabase
        .from('admissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('API Recall Error (admissions):', error);
        if (error.message.includes('JWT')) logout();
        return;
      }

      const allData = data || [];
      const isEnquiry = (d) => !d.parent_name || d.parent_name.trim() === '' || (d.message && d.message.includes('Age Eligibility'));
      const adm = allData.filter(d => !isEnquiry(d));
      const enq = allData.filter(isEnquiry).map(d => ({ ...d, name: d.child_name || d.parent_name || 'Prospective Parent' }));



      setAdmissions(adm);
      setEnquiries(enq);

      // 2. Fetch Visitor Analytics from Supabase API
      try {
        const { data: vData, count, error: vError } = await supabase
          .from('visits')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .limit(1000);

        if (!vError) {
          setVisitsCount(count || 0);
          setVisitsList(vData || []);
        }
      } catch (e) {
        console.error("Visits table query note:", e);
      }

      // 3. Stats Calculation
      setStats({
        this_month: allData.filter(d => new Date(d.created_at).getMonth() === new Date().getMonth()).length,
        pending: adm.filter(d => !d.status || d.status === 'pending').length,
        approved: adm.filter(d => d.status === 'approved').length,
      });

      const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastRefreshed(nowTime);
      setRefreshBanner(true);
      setTimeout(() => setRefreshBanner(false), 3000);
    } catch (err) {
      console.error('API Recall error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('admissions')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) {
        alert('Failed to update status: ' + error.message);
      } else {
        setAdmissions(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
        if (viewItem?.data?.id === id) {
          setViewItem(prev => ({ ...prev, data: { ...prev.data, status: newStatus } }));
        }
      }
    } catch (e) {
      alert('Error updating status');
    }
  };

  const deleteRecord = async (type, id) => {
    if (!confirm('Are you sure you want to permanently delete this record?')) return;
    try {
      const table = (type === 'enquiry' || type === 'enquiries') ? 'enquiries' : 'admissions';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error && table === 'enquiries') {
        await supabase.from('admissions').delete().eq('id', id);
      }
      fetchAll();
      if (viewItem?.data?.id === id) setViewItem(null);
    } catch (e) {
      alert('Error deleting record');
    }
  };

  const exportExcel = (data, name) => {
    if (!window.XLSX) {
      alert('Spreadsheet export engine is initializing. Please try again in 2 seconds.');
      return;
    }
    const cleanData = data.map(({ id, ...rest }) => rest);
    const ws = window.XLSX.utils.json_to_sheet(cleanData);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, name);
    window.XLSX.writeFile(wb, `VT_Kindergarten_${name}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Filtered lists
  const fAdmissions = useMemo(() => {
    return admissions.filter(a => {
      const q = search.toLowerCase();
      const matchQuery = !search ||
        (a.child_name || '').toLowerCase().includes(q) ||
        (a.parent_name || '').toLowerCase().includes(q) ||
        (a.phone || '').includes(search) ||
        (a.email || '').toLowerCase().includes(q);

      const matchProgram = isProgramMatch(a.program, filterProgram);
      const currentStatus = a.status || 'pending';
      const matchStatus = !filterStatus || currentStatus === filterStatus;

      return matchQuery && matchProgram && matchStatus;
    });
  }, [admissions, search, filterProgram, filterStatus]);

  const fEnquiries = useMemo(() => {
    return enquiries.filter(e => {
      const q = search.toLowerCase();
      const matchQuery = !search ||
        (e.name || '').toLowerCase().includes(q) ||
        (e.phone || '').includes(search) ||
        (e.email || '').toLowerCase().includes(q) ||
        (e.message || '').toLowerCase().includes(q);

      const matchProgram = isProgramMatch(e.program, filterProgram);
      return matchQuery && matchProgram;
    });
  }, [enquiries, search, filterProgram]);

  const fVisits = useMemo(() => {
    return visitsList.filter(v => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (v.user_agent || '').toLowerCase().includes(q) ||
        (v.referrer || '').toLowerCase().includes(q) ||
        (v.language || '').toLowerCase().includes(q);
    });
  }, [visitsList, search]);

  // Reset pagination when search or filters change
  useEffect(() => {
    setPageAdm(1);
  }, [search, filterProgram, filterStatus]);

  useEffect(() => {
    setPageEnq(1);
  }, [search, filterProgram]);

  useEffect(() => {
    setPageVis(1);
  }, [search]);

  // Paginated item slices
  const pagedAdmissions = useMemo(() => {
    const start = (pageAdm - 1) * pageSizeAdm;
    return fAdmissions.slice(start, start + pageSizeAdm);
  }, [fAdmissions, pageAdm, pageSizeAdm]);

  const pagedEnquiries = useMemo(() => {
    const start = (pageEnq - 1) * pageSizeEnq;
    return fEnquiries.slice(start, start + pageSizeEnq);
  }, [fEnquiries, pageEnq, pageSizeEnq]);

  const pagedVisits = useMemo(() => {
    const start = (pageVis - 1) * pageSizeVis;
    return fVisits.slice(start, start + pageSizeVis);
  }, [fVisits, pageVis, pageSizeVis]);

  // Visitor analytics breakdown
  const visitorStats = useMemo(() => {
    let mobile = 0;
    let desktop = 0;
    visitsList.forEach(v => {
      const parsed = parseUserAgent(v.user_agent);
      if (parsed.isMobile) mobile++;
      else desktop++;
    });
    const total = visitsList.length || 1;
    return {
      mobile,
      desktop,
      mobilePct: Math.round((mobile / total) * 100),
      desktopPct: Math.round((desktop / total) * 100),
    };
  }, [visitsList]);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: '📊', count: null },
    { id: 'admissions', label: 'Admissions', icon: '🎓', count: admissions.length },
    { id: 'enquiries', label: 'Enquiries', icon: '✉️', count: enquiries.length },
    { id: 'visitors', label: 'Live Visitors', icon: '👥', count: visitsCount, live: true },
  ];

  const statCards = [
    { label: 'Total Visitors', value: visitsCount, icon: '👥', color: '#F43F5E', bg: 'rgba(244, 63, 94, 0.1)', badge: 'Live Traffic' },
    { label: 'Total Admissions', value: admissions.length, icon: '🎓', color: '#FF6B35', bg: 'rgba(255, 107, 53, 0.1)', badge: 'Applications' },
    { label: 'Total Enquiries', value: enquiries.length, icon: '💬', color: '#0D9488', bg: 'rgba(13, 148, 136, 0.1)', badge: 'Parent Queries' },
    { label: 'This Month', value: stats?.this_month || 0, icon: '📅', color: '#D97706', bg: 'rgba(217, 119, 6, 0.1)', badge: 'Current Month' },
    { label: 'Pending Review', value: stats?.pending || 0, icon: '⏳', color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.1)', badge: 'Needs Action' },
  ];

  const getProgramBadgeClass = (prog = '') => {
    if (prog.includes('Play Group')) return 'vta-prog-play';
    if (prog.includes('Pre KG')) return 'vta-prog-prekg';
    if (prog.includes('LKG')) return 'vta-prog-lkg';
    if (prog.includes('UKG')) return 'vta-prog-ukg';
    return 'vta-prog-default';
  };

  return (
    <div className="vta-dashboard-layout">
      

      {/* ================= STICKY TOP NAVBAR ================= */}
      <header className="vta-navbar">
        <div className="vta-navbar-inner">
          <a href="#home" className="vta-brand" onClick={(e) => { e.preventDefault(); setTab('overview'); }}>
            <img src={LOGO_SRC} alt="VT Kindergarten" className="vta-brand-logo" />
            <div className="vta-brand-text">
              <h2>VT Kindergarten</h2>
              <span>
                <span className="vta-brand-live-dot" />
                Admin Portal
              </span>
            </div>
          </a>

          {/* Segmented Tab Navigation */}
          <nav className={`vta-nav-pills ${menuOpen ? 'open' : ''}`}>
            {navItems.map(item => (
              <button
                key={item.id}
                type="button"
                className={`vta-nav-pill-btn ${tab === item.id ? 'active' : ''}`}
                onClick={() => {
                  setTab(item.id);
                  setSearch('');
                  setFilterProgram('');
                  setFilterStatus('');
                  setShowAddForm(false);
                  setMenuOpen(false);
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {item.count !== null && (
                  <span className="vta-nav-badge">{item.count}</span>
                )}
              </button>
            ))}
          </nav>

          {/* Actions & Profile */}
          <div className="vta-navbar-actions">
            <a href="/" target="_blank" rel="noopener noreferrer" className="vta-btn-ghost" title="Open live public website">
              <span>🌐</span>
              <span className="vta-hide-mobile">Live Website</span>
            </a>

            <button
              type="button"
              className="vta-btn-ghost"
              onClick={fetchAll}
              disabled={loading}
              title={`Recall API & Reload fresh data ${lastRefreshed ? `(Last synced: ${lastRefreshed})` : ''}`}
            >
              <span className={loading ? 'vta-spin' : ''}>🔄</span>
              <span className="vta-hide-mobile">{loading ? 'Syncing...' : 'Refresh'}</span>
            </button>

            <div className="vta-user-chip">
              <div className="vta-user-avatar">
                {(admin?.email || 'A')[0].toUpperCase()}
              </div>
              <span className="vta-user-name vta-hide-mobile">
                {admin?.email?.split('@')[0] || 'Admin'}
              </span>
              <button type="button" className="vta-btn-logout" onClick={logout} title="Sign Out">
                Logout
              </button>
            </div>

            <button
              type="button"
              className="vta-mobile-toggle"
              aria-label="Toggle navigation menu"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main className="vta-main-content">
        {/* Header greeting & quick action */}
        <div className="vta-page-header">
          <div className="vta-page-header-text">
            <h1>
              {tab === 'overview' && 'School Operations Dashboard'}
              {tab === 'admissions' && 'Student Admission Applications'}
              {tab === 'enquiries' && 'Parent Enquiry Desk'}
              {tab === 'visitors' && 'Real-time Website Visitors'}
            </h1>
            <p>
              {tab === 'overview' && `Welcome back, ${admin?.email?.split('@')[0] || 'Administrator'} • Today is ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
              {tab === 'admissions' && 'Review, accept, or manage incoming kindergarten admission requests.'}
              {tab === 'enquiries' && 'Direct inquiries submitted by prospective parents via the public portal.'}
              {tab === 'visitors' && 'Live tracking of visitors browsing vtkindergarten.in with device & source metrics.'}
            </p>
          </div>

          <div className="vta-header-actions">
            <button
              type="button"
              className="vta-btn-ghost"
              onClick={fetchAll}
              disabled={loading}
              title="Recall API & Refresh data from Supabase"
              style={{ fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <span className={loading ? 'vta-spin' : ''}>🔄</span>
              <span>{loading ? 'Recalling API...' : 'Refresh'}</span>
            </button>

            {tab === 'admissions' && (
              <>
                <button
                  type="button"
                  className="vta-btn-primary"
                  onClick={() => setShowAddForm(prev => !prev)}
                >
                  {showAddForm ? '✕ Close Form' : '+ New Admission'}
                </button>
                <button
                  type="button"
                  className="vta-btn-excel"
                  onClick={() => exportExcel(fAdmissions, 'Admissions')}
                >
                  📊 Export Excel
                </button>
              </>
            )}

            {tab === 'enquiries' && (
              <button
                type="button"
                className="vta-btn-excel"
                onClick={() => exportExcel(fEnquiries, 'Enquiries')}
              >
                📊 Export Excel
              </button>
            )}

            {tab === 'visitors' && (
              <button
                type="button"
                className="vta-btn-excel"
                onClick={() => exportExcel(fVisits, 'Website_Visitors')}
              >
                📊 Export Visitor Logs
              </button>
            )}
          </div>
        </div>

        {/* Global Loading / Sync Indicator */}
        {loading && (
          <div style={{
            background: '#FFF7ED',
            border: '1.5px solid rgba(255, 107, 53, 0.3)',
            borderRadius: 12,
            padding: '12px 20px',
            marginBottom: 24,
            fontSize: 13.5,
            fontWeight: 800,
            color: '#C2410C',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 2px 10px rgba(255, 107, 53, 0.08)'
          }}>
            <span className="vta-spin" style={{ fontSize: 16 }}>🔄</span>
            <span>Recalling API & synchronizing fresh data from Supabase...</span>
          </div>
        )}

        {/* Global Success Indicator on refresh */}
        {!loading && refreshBanner && (
          <div style={{
            background: '#ECFDF5',
            border: '1.5px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 12,
            padding: '12px 20px',
            marginBottom: 24,
            fontSize: 13.5,
            fontWeight: 800,
            color: '#065F46',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 10px rgba(16, 185, 129, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>✅</span>
              <span>API successfully recalled! Data is completely up to date.</span>
            </div>
            {lastRefreshed && (
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#047857' }}>
                Synced at {lastRefreshed}
              </span>
            )}
          </div>
        )}

        {/* ================= TAB 1: OVERVIEW ================= */}
        {tab === 'overview' && (
          <>
            {/* Stat Cards */}
            <div className="vta-stats-grid">
              {statCards.map((card, i) => (
                <div key={i} className="vta-stat-card">
                  <div className="vta-stat-top">
                    <div className="vta-stat-icon-wrap" style={{ background: card.bg, color: card.color }}>
                      {card.icon}
                    </div>
                    <span className="vta-stat-badge">{card.badge}</span>
                  </div>
                  <div className="vta-stat-val">{card.value}</div>
                  <div className="vta-stat-label">{card.label}</div>
                </div>
              ))}
            </div>

            {/* Welcome Operations Banner */}
            <div className="vta-welcome-banner">
              <div className="vta-welcome-text">
                <h2>VT Kindergarten Academic Management</h2>
                <p>
                  Quickly manage student admissions, monitor parent queries from the website,
                  and inspect real-time visitor interest across Karaikudi and beyond.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="vta-btn-primary"
                  onClick={() => setTab('admissions')}
                >
                  View Admissions Portal &rarr;
                </button>
              </div>
            </div>

            {/* Quick Glance Grids: Recent 5 Admissions & Recent 5 Enquiries */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24 }}>
              {/* Recent Admissions */}
              <div className="vta-panel">
                <div className="vta-panel-header">
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Recent Admissions</h3>
                    <span className="vta-sub-text">Latest applications received</span>
                  </div>
                  <button
                    type="button"
                    className="vta-btn-ghost"
                    style={{ fontSize: 12 }}
                    onClick={() => setTab('admissions')}
                  >
                    View All &rarr;
                  </button>
                </div>
                <div className="vta-table-scroll">
                  <table className="vta-table">
                    <thead>
                      <tr>
                        <th>Child Name</th>
                        <th>Program</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admissions.slice(0, 5).map((a, i) => (
                        <tr key={i} style={{ cursor: 'pointer' }} onClick={() => setViewItem({ type: 'admission', data: a })}>
                          <td>
                            <div className="vta-name-bold">{a.child_name}</div>
                            <div className="vta-sub-text">{a.parent_name} ({a.phone})</div>
                          </td>
                          <td>
                            <span className={`vta-badge-pill ${getProgramBadgeClass(a.program)}`}>
                              {a.program}
                            </span>
                          </td>
                          <td>
                            <span className={`vta-badge-pill ${a.status === 'approved' ? 'vta-badge-green' : a.status === 'rejected' ? 'vta-badge-red' : 'vta-badge-amber'}`}>
                              {a.status || 'pending'}
                            </span>
                          </td>
                          <td>
                            <span className="vta-sub-text">{timeAgo(a.created_at)}</span>
                          </td>
                        </tr>
                      ))}
                      {admissions.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: 32, color: '#94A3B8' }}>
                            No admissions submitted yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Enquiries */}
              <div className="vta-panel">
                <div className="vta-panel-header">
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Recent Enquiries</h3>
                    <span className="vta-sub-text">Latest web contact messages</span>
                  </div>
                  <button
                    type="button"
                    className="vta-btn-ghost"
                    style={{ fontSize: 12 }}
                    onClick={() => setTab('enquiries')}
                  >
                    View All &rarr;
                  </button>
                </div>
                <div className="vta-table-scroll">
                  <table className="vta-table">
                    <thead>
                      <tr>
                        <th>Parent Name</th>
                        <th>Program</th>
                        <th>Message</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enquiries.slice(0, 5).map((e, i) => (
                        <tr key={i} style={{ cursor: 'pointer' }} onClick={() => setViewItem({ type: 'enquiry', data: e })}>
                          <td>
                            <div className="vta-name-bold">{e.name}</div>
                            <div className="vta-sub-text">{e.phone}</div>
                          </td>
                          <td>
                            <span className={`vta-badge-pill ${getProgramBadgeClass(e.program)}`}>
                              {e.program || 'General'}
                            </span>
                          </td>
                          <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {e.message || '-'}
                          </td>
                          <td>
                            <span className="vta-sub-text">{timeAgo(e.created_at)}</span>
                          </td>
                        </tr>
                      ))}
                      {enquiries.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: 32, color: '#94A3B8' }}>
                            No parent enquiries yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ================= TAB 2: ADMISSIONS ================= */}
        {tab === 'admissions' && (
          <>
            {/* Manual Admission Entry Form (Exclusively in Admissions) */}
            {showAddForm && (
              <AdmissionApplicationBox
                onSubmitted={() => {
                  fetchAll();
                  setShowAddForm(false);
                }}
                onCancel={() => setShowAddForm(false)}
              />
            )}

            <div className="vta-panel">
            {/* Filter Toolbar */}
            <div className="vta-panel-header">
              <div className="vta-filters-group">
                <div className="vta-search-box">
                  <span className="vta-search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search by child, parent, or phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <select
                  className="vta-select"
                  value={filterProgram}
                  onChange={(e) => setFilterProgram(e.target.value)}
                >
                  <option value="">All Programs</option>
                  <option value="Play Group">Play Group (2+ yrs)</option>
                  <option value="Pre KG">Pre KG (3+ yrs)</option>
                  <option value="LKG">LKG (4+ yrs)</option>
                  <option value="UKG">UKG (5+ yrs)</option>
                </select>

                <select
                  className="vta-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>

                <span className="vta-count-pill">{fAdmissions.length} records</span>
              </div>

              <TablePaginationTop
                currentPage={pageAdm}
                totalItems={fAdmissions.length}
                pageSize={pageSizeAdm}
                onPageChange={setPageAdm}
                onPageSizeChange={setPageSizeAdm}
                onRefresh={fetchAll}
                loading={loading}
              />
            </div>

            {/* Admissions Table */}
            <div className="vta-table-scroll">
              <table className="vta-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Child Details</th>
                    <th>Program</th>
                    <th>Parent / Contact</th>
                    <th>Address</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedAdmissions.map((adm, i) => (
                    <tr
                      key={adm.id || i}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setViewItem({ type: 'admission', data: adm })}
                    >
                      <td style={{ color: '#94A3B8', fontWeight: 700 }}>{(pageAdm - 1) * pageSizeAdm + i + 1}</td>
                      <td>
                        <div className="vta-avatar-cell">
                          <div className="vta-avatar-icon">
                            {(adm.child_name || 'C')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="vta-name-bold">{adm.child_name}</div>
                            <div className="vta-sub-text">
                              DOB: {adm.dob || '-'} &bull; {adm.gender || '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`vta-badge-pill ${getProgramBadgeClass(adm.program)}`}>
                          {adm.program}
                        </span>
                      </td>
                      <td>
                        <div className="vta-name-bold">{adm.parent_name} ({adm.relation || 'Parent'})</div>
                        <div className="vta-sub-text" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{adm.phone}</span>
                          {adm.phone && (
                            <a
                              href={getWhatsAppUrl(adm.phone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="vta-btn-action-wa"
                              style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 800 }}
                              onClick={(e) => e.stopPropagation()}
                              title="Chat on WhatsApp"
                            >
                              WhatsApp
                            </a>
                          )}
                        </div>
                      </td>
                      <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {adm.address || '-'}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <select
                          className={`vta-status-select ${adm.status || 'pending'}`}
                          value={adm.status || 'pending'}
                          onChange={(e) => updateStatus(adm.id, e.target.value)}
                        >
                          <option value="pending">⏳ Pending</option>
                          <option value="approved">✓ Approved</option>
                          <option value="rejected">✕ Rejected</option>
                        </select>
                      </td>
                      <td>
                        <div className="vta-sub-text">{timeAgo(adm.created_at)}</div>
                      </td>
                      <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <div className="vta-actions-cell" style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="vta-btn-action"
                            title="View details"
                            onClick={() => setViewItem({ type: 'admission', data: adm })}
                          >
                            👁️
                          </button>
                          <button
                            type="button"
                            className="vta-btn-action vta-btn-action-del"
                            title="Delete permanently"
                            onClick={() => deleteRecord('admissions', adm.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {fAdmissions.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: 48, color: '#94A3B8' }}>
                        No admissions found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </>
        )}

        {/* ================= TAB 3: ENQUIRIES ================= */}
        {tab === 'enquiries' && (
          <div className="vta-panel">
            <div className="vta-panel-header">
              <div className="vta-filters-group">
                <div className="vta-search-box">
                  <span className="vta-search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search parent name, phone, or keyword..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <select
                  className="vta-select"
                  value={filterProgram}
                  onChange={(e) => setFilterProgram(e.target.value)}
                >
                  <option value="">All Programs</option>
                  <option value="Play Group">Play Group (2+ yrs)</option>
                  <option value="Pre KG">Pre KG (3+ yrs)</option>
                  <option value="LKG">LKG (4+ yrs)</option>
                  <option value="UKG">UKG (5+ yrs)</option>
                </select>

                <span className="vta-count-pill">{fEnquiries.length} records</span>
              </div>

              <TablePaginationTop
                currentPage={pageEnq}
                totalItems={fEnquiries.length}
                pageSize={pageSizeEnq}
                onPageChange={setPageEnq}
                onPageSizeChange={setPageSizeEnq}
                onRefresh={fetchAll}
                loading={loading}
              />
            </div>

            <div className="vta-table-scroll">
              <table className="vta-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Parent / Sender</th>
                    <th>Program</th>
                    <th>Message</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedEnquiries.map((enq, i) => (
                    <tr
                      key={enq.id || i}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setViewItem({ type: 'enquiry', data: enq })}
                    >
                      <td style={{ color: '#94A3B8', fontWeight: 700 }}>{(pageEnq - 1) * pageSizeEnq + i + 1}</td>
                      <td>
                        <div className="vta-avatar-cell">
                          <div className="vta-avatar-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
                            {(enq.name || 'P')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="vta-name-bold">{enq.name}</div>
                            <div className="vta-sub-text">{enq.phone} &bull; {enq.email || 'No email'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`vta-badge-pill ${getProgramBadgeClass(enq.program)}`}>
                          {enq.program || 'General'}
                        </span>
                      </td>
                      <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {enq.message || '-'}
                      </td>
                      <td>
                        <div className="vta-sub-text">{formatDate(enq.created_at)}</div>
                      </td>
                      <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <div className="vta-actions-cell" style={{ justifyContent: 'flex-end' }}>
                          {enq.phone && (
                            <a
                              href={getWhatsAppUrl(enq.phone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="vta-btn-action vta-btn-action-wa"
                              title="Chat on WhatsApp"
                            >
                              💬
                            </a>
                          )}
                          <button
                            type="button"
                            className="vta-btn-action"
                            title="View full enquiry"
                            onClick={() => setViewItem({ type: 'enquiry', data: enq })}
                          >
                            👁️
                          </button>
                          <button
                            type="button"
                            className="vta-btn-action vta-btn-action-del"
                            title="Delete permanently"
                            onClick={() => deleteRecord('enquiries', enq.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {fEnquiries.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 48, color: '#94A3B8' }}>
                        No enquiries found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 4: VISITORS (LIVE ANALYTICS) ================= */}
        {tab === 'visitors' && (
          <>
            {/* Visitor Stats Summary Card */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
              marginBottom: 24
            }}>
              <div className="vta-stat-card" style={{ padding: 18 }}>
                <div className="vta-stat-top">
                  <span className="vta-stat-icon-wrap" style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#F43F5E' }}>
                    👥
                  </span>
                  <span className="vta-stat-badge">Total</span>
                </div>
                <div className="vta-stat-val" style={{ fontSize: 28 }}>{visitsCount}</div>
                <div className="vta-stat-label">Total Visits Logged</div>
              </div>

              <div className="vta-stat-card" style={{ padding: 18 }}>
                <div className="vta-stat-top">
                  <span className="vta-stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                    📱
                  </span>
                  <span className="vta-stat-badge">{visitorStats.mobilePct}%</span>
                </div>
                <div className="vta-stat-val" style={{ fontSize: 28 }}>{visitorStats.mobile}</div>
                <div className="vta-stat-label">Mobile Smartphone Visits</div>
              </div>

              <div className="vta-stat-card" style={{ padding: 18 }}>
                <div className="vta-stat-top">
                  <span className="vta-stat-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                    💻
                  </span>
                  <span className="vta-stat-badge">{visitorStats.desktopPct}%</span>
                </div>
                <div className="vta-stat-val" style={{ fontSize: 28 }}>{visitorStats.desktop}</div>
                <div className="vta-stat-label">Desktop & Laptop Visits</div>
              </div>
            </div>

            {/* Visitors Table */}
            <div className="vta-panel">
              <div className="vta-panel-header">
                <div className="vta-filters-group">
                  <div className="vta-search-box">
                    <span className="vta-search-icon">🔍</span>
                    <input
                      type="text"
                      placeholder="Search device, browser, or referrer..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <span className="vta-count-pill">{fVisits.length} logs captured</span>
                </div>

                <TablePaginationTop
                  currentPage={pageVis}
                  totalItems={fVisits.length}
                  pageSize={pageSizeVis}
                  onPageChange={setPageVis}
                  onPageSizeChange={setPageSizeVis}
                  onRefresh={fetchAll}
                  loading={loading}
                />
              </div>

              <div className="vta-table-scroll">
                <table className="vta-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Time Visited</th>
                      <th>Device & Browser</th>
                      <th>Referrer Source</th>
                      <th>Language</th>
                      <th>Screen Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedVisits.map((v, i) => {
                      const ua = parseUserAgent(v.user_agent);
                      return (
                        <tr key={v.id || i}>
                          <td style={{ color: '#94A3B8', fontWeight: 700 }}>{(pageVis - 1) * pageSizeVis + i + 1}</td>
                          <td>
                            <div className="vta-name-bold">{timeAgo(v.created_at)}</div>
                            <div className="vta-sub-text">{formatDate(v.created_at)}</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span className={`vta-badge-pill ${ua.isMobile ? 'vta-badge-purple' : 'vta-badge-blue'}`}>
                                {ua.isMobile ? '📱 Mobile' : '💻 Desktop'}
                              </span>
                              <span className="vta-name-bold" style={{ fontSize: 13 }}>
                                {ua.browser} ({ua.os})
                              </span>
                            </div>
                            <div className="vta-sub-text" style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.user_agent}>
                              {v.user_agent}
                            </div>
                          </td>
                          <td>
                            <span className="vta-badge-pill vta-badge-gray" title={v.referrer}>
                              {v.referrer && v.referrer !== 'Direct/Unknown' ? v.referrer : '🔗 Direct / Link'}
                            </span>
                          </td>
                          <td>
                            <span className="vta-badge-pill vta-badge-gray">
                              {v.language || 'en'}
                            </span>
                          </td>
                          <td>
                            <span className="vta-sub-text">
                              {v.screen_width ? `${v.screen_width}px` : '-'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {fVisits.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: 48, color: '#94A3B8' }}>
                          No visitor logs captured yet. Ensure the visits table is configured in Supabase.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ================= DETAIL MODAL ================= */}
      {viewItem && (
        <div className="vta-modal-backdrop" onClick={() => setViewItem(null)}>
          <div className="vta-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="vta-modal-header">
              <div>
                <span className="vta-badge-pill vta-badge-orange" style={{ marginBottom: 6 }}>
                  {viewItem.type === 'admission' ? 'Admission Application' : 'Parent Contact Enquiry'}
                </span>
                <h3>{viewItem.data.child_name || viewItem.data.name || 'Details'}</h3>
              </div>
              <button
                type="button"
                className="vta-modal-close-btn"
                onClick={() => setViewItem(null)}
              >
                ✕
              </button>
            </div>

            <div className="vta-modal-body">
              {Object.entries(viewItem.data)
                .filter(([k]) => k !== 'id' && k !== 'updated_at')
                .map(([k, v]) => (
                  <div key={k} className="vta-modal-field-row">
                    <span className="vta-modal-key">{k.replace(/_/g, ' ')}</span>
                    <span className="vta-modal-val">
                      {k === 'created_at' ? formatDate(v) : (String(v) || '-')}
                    </span>
                  </div>
                ))}
            </div>

            <div className="vta-modal-footer">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {viewItem.type === 'admission' && (
                  <>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>Status:</span>
                    <select
                      className={`vta-status-select ${viewItem.data.status || 'pending'}`}
                      value={viewItem.data.status || 'pending'}
                      onChange={(e) => updateStatus(viewItem.data.id, e.target.value)}
                    >
                      <option value="pending">⏳ Pending Review</option>
                      <option value="approved">✓ Approved</option>
                      <option value="rejected">✕ Rejected</option>
                    </select>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {viewItem.data.phone && (
                  <a
                    href={getWhatsAppUrl(viewItem.data.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="vta-btn-action-wa"
                    style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 800, textDecoration: 'none' }}
                  >
                    💬 WhatsApp Parent
                  </a>
                )}
                <button
                  type="button"
                  className="vta-btn-secondary"
                  onClick={() => setViewItem(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   EXPORT ROOT COMPONENT
   ========================================================================== */
export default function AdminApp() {
  const { session, admin, loginLocal, logout, isAuth, loading } = useAuth();

  useEffect(() => {
    if (!window.XLSX) {
      const sc = document.createElement('script');
      sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      document.head.appendChild(sc);
    }
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0F172A',
        color: '#FFFFFF',
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}>
        <div style={{ textAlign: 'center' }}>
          <img src={LOGO_SRC} alt="" style={{ width: 64, height: 64, borderRadius: '50%', marginBottom: 16 }} />
          <h3 style={{ margin: 0, fontWeight: 800 }}>Loading VT Kindergarten Portal...</h3>
          <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Connecting securely</p>
        </div>
      </div>
    );
  }

  if (!isAuth) return <LoginPage onLocalLogin={loginLocal} />;
  return <Dashboard admin={admin} logout={logout} />;
}
