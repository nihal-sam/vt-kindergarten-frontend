import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabaseClient";

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

  const logout = () => supabase.auth.signOut();

  return { session, admin: session?.user, logout, isAuth: !!session, loading };
}

/* ==========================================================================
   LOGIN PAGE (Ultra-Premium Frosted Dark Theme)
   ========================================================================== */
function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (loginErr) setError(loginErr.message);
    } catch {
      setError('Connection failed. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vta-login-wrap">
      <div className="vta-login-glow-1" />
      <div className="vta-login-glow-2" />

      <div className="vta-login-card">
        <div className="vta-login-header">
          <div className="vta-login-logo-ring">
            <img src={LOGO_SRC} alt="VT Kindergarten Logo" />
          </div>
          <h2>VT Kindergarten</h2>
          <span className="vta-badge-pill vta-badge-orange">Admin Operations Portal</span>
        </div>

        <form onSubmit={submit} className="vta-login-form">
          <div className="vta-field">
            <label>Admin Email</label>
            <input
              type="email"
              placeholder="admin@vtkindergarten.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="vta-field">
            <label>Secure Password</label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && <div className="vta-alert-error">{error}</div>}

          <button type="submit" className="vta-btn-primary vta-btn-block" disabled={loading}>
            {loading ? (
              <span className="vta-spinner-text">Authenticating...</span>
            ) : (
              <span>Sign In to Dashboard &rarr;</span>
            )}
          </button>
        </form>

        <div className="vta-login-footer">
          <p>&copy; {new Date().getFullYear()} VT Kindergarten &bull; Karaikudi, Tamil Nadu</p>
        </div>
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
   TOP RIGHT TABLE PAGINATION COMPONENT
   ========================================================================== */
function TablePaginationTop({ currentPage, totalItems, pageSize, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems === 0) return null;

  return (
    <div className="vta-pagination-top">
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

      <div className="vta-top-nav-wrap">
        <button
          type="button"
          className="vta-top-nav-btn"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          title="Previous Page"
        >
          &larr; Prev
        </button>

        <span className="vta-top-page-text">
          Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
        </span>

        <button
          type="button"
          className="vta-top-nav-btn"
          disabled={currentPage >= totalPages}
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
      // 1. Fetch Admissions & Enquiries
      const { data, error } = await supabase
        .from('admissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
        if (error.message.includes('JWT')) logout();
        return;
      }

      const allData = data || [];
      const adm = allData.filter(d => d.parent_name && d.parent_name.trim() !== '');
      const enq = allData
        .filter(d => !d.parent_name || d.parent_name.trim() === '')
        .map(d => ({ ...d, name: d.child_name }));

      setAdmissions(adm);
      setEnquiries(enq);

      // 2. Fetch Visitor Analytics
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
        console.error("No visits table yet", e);
      }

      // 3. Stats Calculation
      setStats({
        this_month: allData.filter(d => new Date(d.created_at).getMonth() === new Date().getMonth()).length,
        pending: adm.filter(d => !d.status || d.status === 'pending').length,
        approved: adm.filter(d => d.status === 'approved').length,
      });
    } catch (err) {
      console.error(err);
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
      await supabase.from('admissions').delete().eq('id', id);
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
      {/* ================= STYLESHEET ================= */}
      <style>{`
        :root {
          --vta-font: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          --vta-primary: #FF6B35;
          --vta-primary-hover: #EA580C;
          --vta-primary-light: rgba(255, 107, 53, 0.12);
          --vta-bg: #FFF9F5;
          --vta-card-bg: #FFFFFF;
          --vta-border: rgba(255, 107, 53, 0.16);
          --vta-border-subtle: rgba(255, 107, 53, 0.08);
          --vta-text-main: #1C1917;
          --vta-text-muted: #78716C;
          --vta-text-light: #A8A29E;
          --vta-shadow-sm: 0 1px 3px rgba(255, 107, 53, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
          --vta-shadow-card: 0 4px 20px rgba(255, 107, 53, 0.06), 0 1px 3px rgba(0, 0, 0, 0.03);
          --vta-shadow-hover: 0 14px 36px rgba(255, 107, 53, 0.14);
          --vta-radius-sm: 8px;
          --vta-radius-md: 12px;
          --vta-radius-lg: 18px;
          --vta-radius-xl: 24px;
        }

        body {
          margin: 0;
          background: #FFF9F5;
          font-family: var(--vta-font);
          color: var(--vta-text-main);
          -webkit-font-smoothing: antialiased;
        }

        /* Layout with Warm Ambient Orange & White Gradients */
        .vta-dashboard-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: #FFF9F5;
          background-image: 
            radial-gradient(at 0% 0%, rgba(255, 107, 53, 0.09) 0px, transparent 55%),
            radial-gradient(at 100% 0%, rgba(255, 180, 50, 0.08) 0px, transparent 50%),
            radial-gradient(at 50% 45%, rgba(255, 107, 53, 0.04) 0px, transparent 65%),
            radial-gradient(at 100% 100%, rgba(255, 107, 53, 0.08) 0px, transparent 55%),
            radial-gradient(at 0% 100%, rgba(255, 195, 80, 0.07) 0px, transparent 50%);
          background-attachment: fixed;
        }

        /* Top Sticky Glass Navbar */
        .vta-navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255, 253, 250, 0.94);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1.5px solid rgba(255, 107, 53, 0.16);
          box-shadow: 0 4px 24px rgba(255, 107, 53, 0.05);
        }

        .vta-navbar-inner {
          max-width: 1440px;
          margin: 0 auto;
          padding: 10px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .vta-brand {
          display: flex;
          align-items: center;
          gap: 14px;
          text-decoration: none;
        }

        .vta-brand-logo {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          padding: 3px;
          background: #fff;
          border: 2px solid rgba(255, 107, 53, 0.35);
          box-shadow: 0 4px 16px rgba(255, 107, 53, 0.25);
          object-fit: contain;
          flex-shrink: 0;
        }

        .vta-brand-text h2 {
          margin: 0;
          font-size: 18.5px;
          font-weight: 900;
          color: var(--vta-text-main);
          letter-spacing: -0.2px;
        }

        .vta-brand-text span {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 700;
          color: #059669;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .vta-brand-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10B981;
          box-shadow: 0 0 8px #10B981;
          animation: vta-pulse 2s infinite;
        }

        /* Nav Pills with Warm Orange & White Theme */
        .vta-nav-pills {
          display: flex;
          align-items: center;
          background: #FFF2E8;
          border: 1.5px solid rgba(255, 107, 53, 0.16);
          padding: 4px;
          border-radius: 14px;
          list-style: none;
          margin: 0;
          gap: 4px;
        }

        .vta-nav-pill-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: #78716C;
          font-family: var(--vta-font);
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          text-decoration: none;
          white-space: nowrap;
        }

        .vta-nav-pill-btn:hover {
          color: var(--vta-primary);
          background: rgba(255, 255, 255, 0.7);
        }

        .vta-nav-pill-btn.active {
          background: #FFFFFF;
          color: var(--vta-primary);
          box-shadow: 0 2px 10px rgba(255, 107, 53, 0.15);
        }

        .vta-nav-badge {
          background: rgba(255, 107, 53, 0.12);
          color: var(--vta-primary);
          font-size: 11px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 20px;
        }

        .vta-nav-pill-btn.active .vta-nav-badge {
          background: var(--vta-primary);
          color: #FFFFFF;
        }

        /* Right Nav Actions */
        .vta-navbar-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .vta-btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          border: 1.5px solid rgba(255, 107, 53, 0.2);
          background: #FFFFFF;
          color: #57534E;
          font-family: var(--vta-font);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .vta-btn-ghost:hover {
          color: var(--vta-primary);
          border-color: var(--vta-primary);
          background: #FFF7F2;
        }

        .vta-user-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 12px 5px 6px;
          border-radius: 30px;
          background: #FFF5EE;
          border: 1.5px solid rgba(255, 107, 53, 0.2);
        }

        .vta-user-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--vta-primary), #FFD93D);
          color: #fff;
          font-size: 12px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .vta-user-name {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--vta-text-main);
        }

        .vta-btn-logout {
          background: transparent;
          border: none;
          color: #EF4444;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          padding: 4px 6px;
          border-radius: 6px;
        }

        .vta-btn-logout:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .vta-mobile-toggle {
          display: none;
          background: transparent;
          border: none;
          padding: 8px;
          cursor: pointer;
          flex-direction: column;
          gap: 5px;
        }

        .vta-mobile-toggle span {
          display: block;
          width: 22px;
          height: 2px;
          background: var(--vta-text-main);
          border-radius: 2px;
        }

        /* Main Container */
        .vta-main-content {
          max-width: 1440px;
          width: 100%;
          margin: 0 auto;
          padding: 32px 28px 60px;
          box-sizing: border-box;
          flex: 1;
        }

        /* Top Page Header */
        .vta-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 28px;
        }

        .vta-page-header-text h1 {
          margin: 0 0 6px;
          font-size: 26px;
          font-weight: 900;
          letter-spacing: -0.4px;
          color: var(--vta-text-main);
        }

        .vta-page-header-text p {
          margin: 0;
          color: var(--vta-text-muted);
          font-size: 14px;
          font-weight: 500;
        }

        .vta-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        /* Button Styles */
        .vta-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, #FF6B35, #FA5A20);
          color: #FFFFFF;
          border: none;
          border-radius: var(--vta-radius-md);
          padding: 10px 20px;
          font-family: var(--vta-font);
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(255, 107, 53, 0.28);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .vta-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(255, 107, 53, 0.36);
        }

        .vta-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #FFFFFF;
          color: var(--vta-text-main);
          border: 1.5px solid var(--vta-border);
          border-radius: var(--vta-radius-md);
          padding: 10px 18px;
          font-family: var(--vta-font);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .vta-btn-secondary:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        .vta-btn-excel {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #ECFDF5;
          color: #065F46;
          border: 1.5px solid #A7F3D0;
          border-radius: var(--vta-radius-md);
          padding: 10px 18px;
          font-family: var(--vta-font);
          font-size: 13.5px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .vta-btn-excel:hover {
          background: #D1FAE5;
          border-color: #6EE7B7;
        }

        /* Stat Cards Grid */
        .vta-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 18px;
          margin-bottom: 32px;
        }

        .vta-stat-card {
          background: #FFFFFF;
          border-radius: var(--vta-radius-lg);
          padding: 22px;
          border: 1.5px solid rgba(255, 107, 53, 0.16);
          box-shadow: 0 4px 20px rgba(255, 107, 53, 0.05);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }

        .vta-stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(255, 107, 53, 0.14);
          border-color: rgba(255, 107, 53, 0.38);
        }

        .vta-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .vta-stat-icon-wrap {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .vta-stat-badge {
          font-size: 11px;
          font-weight: 800;
          padding: 3px 9px;
          border-radius: 20px;
          background: #FFF2E8;
          color: #EA580C;
          border: 1px solid rgba(255, 107, 53, 0.15);
        }

        .vta-stat-val {
          font-size: 34px;
          font-weight: 900;
          letter-spacing: -0.5px;
          color: var(--vta-text-main);
          margin-bottom: 4px;
          line-height: 1.1;
        }

        .vta-stat-label {
          font-size: 13px;
          font-weight: 700;
          color: var(--vta-text-muted);
        }

        /* Welcome Banner with Warm Sunset Obsidian & Orange Flare */
        .vta-welcome-banner {
          background: linear-gradient(135deg, #1C1917 0%, #292524 55%, #431407 100%);
          border: 1.5px solid rgba(255, 107, 53, 0.28);
          border-radius: var(--vta-radius-xl);
          padding: 32px 36px;
          color: #FFFFFF;
          margin-bottom: 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 16px 40px rgba(255, 107, 53, 0.15);
        }

        .vta-welcome-banner::after {
          content: '';
          position: absolute;
          top: -100px;
          right: -80px;
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, rgba(255, 107, 53, 0.35) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .vta-welcome-text h2 {
          margin: 0 0 8px;
          font-size: 24px;
          font-weight: 900;
        }

        .vta-welcome-text p {
          margin: 0;
          color: rgba(255, 255, 255, 0.7);
          font-size: 14.5px;
          max-width: 600px;
          line-height: 1.5;
        }

        /* Panel & Table Card */
        .vta-panel {
          background: #FFFFFF;
          border-radius: var(--vta-radius-xl);
          border: 1.5px solid rgba(255, 107, 53, 0.16);
          box-shadow: 0 6px 24px rgba(255, 107, 53, 0.05);
          overflow: hidden;
          margin-bottom: 28px;
        }

        .vta-panel-header {
          padding: 20px 24px;
          border-bottom: 1.5px solid rgba(255, 107, 53, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          background: #FFFDFB;
        }

        .vta-filters-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          flex: 1;
        }

        .vta-search-box {
          position: relative;
          flex: 1;
          min-width: 220px;
          max-width: 380px;
        }

        .vta-search-box input {
          width: 100%;
          box-sizing: border-box;
          padding: 10px 14px 10px 36px;
          border-radius: var(--vta-radius-md);
          border: 1.5px solid rgba(255, 107, 53, 0.2);
          font-family: var(--vta-font);
          font-size: 13.5px;
          outline: none;
          transition: all 0.2s ease;
          background: #FFFDFB;
        }

        .vta-search-box input:focus {
          border-color: var(--vta-primary);
          background: #FFFFFF;
          box-shadow: 0 0 0 3.5px rgba(255, 107, 53, 0.18);
        }

        .vta-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 14px;
          color: #EA580C;
          opacity: 0.6;
          pointer-events: none;
        }

        .vta-select {
          padding: 10px 14px;
          border-radius: var(--vta-radius-md);
          border: 1.5px solid rgba(255, 107, 53, 0.2);
          font-family: var(--vta-font);
          font-size: 13.5px;
          font-weight: 600;
          color: var(--vta-text-main);
          background: #FFFDFB;
          outline: none;
          cursor: pointer;
        }

        .vta-select:focus {
          border-color: var(--vta-primary);
          background: #FFFFFF;
          box-shadow: 0 0 0 3.5px rgba(255, 107, 53, 0.18);
        }

        .vta-count-pill {
          background: #FFF0E6;
          color: #C2410C;
          font-size: 12.5px;
          font-weight: 800;
          padding: 6px 14px;
          border-radius: 20px;
          white-space: nowrap;
          border: 1px solid rgba(255, 107, 53, 0.18);
        }

        /* Table */
        .vta-table-scroll {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          width: 100%;
        }

        .vta-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .vta-table th {
          background: #FFF5EE;
          padding: 14px 18px;
          font-size: 11.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: #9A3412;
          border-bottom: 1.5px solid rgba(255, 107, 53, 0.14);
          white-space: nowrap;
        }

        .vta-table td {
          padding: 16px 18px;
          font-size: 13.5px;
          color: var(--vta-text-main);
          border-bottom: 1px solid rgba(255, 107, 53, 0.08);
          vertical-align: middle;
        }

        .vta-table tr:hover td {
          background: #FFFBF7;
        }


        /* Top Right Table Pagination */
        .vta-pagination-top {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          margin-left: auto;
          background: #FFFFFF;
          padding: 6px 14px;
          border-radius: 12px;
          border: 1.5px solid rgba(255, 107, 53, 0.22);
          box-shadow: 0 2px 8px rgba(255, 107, 53, 0.05);
          flex-shrink: 0;
        }

        .vta-top-size-wrap {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 700;
          color: #78716C;
        }

        .vta-top-size-select {
          padding: 4px 8px;
          border-radius: 8px;
          border: 1.5px solid rgba(255, 107, 53, 0.25);
          background: #FFFDFB;
          color: #1C1917;
          font-family: var(--vta-font);
          font-size: 12.5px;
          font-weight: 800;
          outline: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .vta-top-size-select:focus {
          border-color: var(--vta-primary);
          box-shadow: 0 0 0 2.5px rgba(255, 107, 53, 0.15);
        }

        .vta-top-sep {
          width: 1px;
          height: 18px;
          background: rgba(255, 107, 53, 0.2);
        }

        .vta-top-nav-wrap {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .vta-top-nav-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 11px;
          border-radius: 7px;
          border: 1.5px solid rgba(255, 107, 53, 0.2);
          background: #FFFFFF;
          color: #1C1917;
          font-family: var(--vta-font);
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .vta-top-nav-btn:hover:not(:disabled) {
          border-color: var(--vta-primary);
          background: #FFF7F2;
          color: var(--vta-primary);
        }

        .vta-top-nav-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
          background: #F5F5F4;
          border-color: #E7E5E4;
        }

        .vta-top-page-text {
          font-size: 12.5px;
          font-weight: 700;
          color: #78716C;
          padding: 0 2px;
          white-space: nowrap;
        }

        .vta-top-page-text strong {
          color: var(--vta-primary);
          font-weight: 900;
        }

        @media (max-width: 768px) {
          .vta-pagination-top {
            width: 100%;
            justify-content: space-between;
            margin-left: 0;
            padding: 8px 12px;
          }
        }

        .vta-avatar-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .vta-avatar-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: #F1F5F9;
          color: var(--vta-primary);
          font-size: 13px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .vta-name-bold {
          font-weight: 800;
          color: var(--vta-text-main);
          line-height: 1.3;
        }

        .vta-sub-text {
          font-size: 12px;
          color: var(--vta-text-muted);
        }

        /* Badges */
        .vta-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11.5px;
          font-weight: 800;
          letter-spacing: 0.2px;
          white-space: nowrap;
        }

        .vta-badge-orange { background: rgba(255, 107, 53, 0.12); color: #EA580C; }
        .vta-badge-green  { background: rgba(16, 185, 129, 0.12); color: #059669; }
        .vta-badge-amber  { background: rgba(245, 158, 11, 0.14); color: #D97706; }
        .vta-badge-red    { background: rgba(239, 68, 68, 0.12); color: #DC2626; }
        .vta-badge-purple { background: rgba(139, 92, 246, 0.12); color: #7C3AED; }
        .vta-badge-blue   { background: rgba(59, 130, 246, 0.12); color: #2563EB; }
        .vta-badge-gray   { background: #F1F5F9; color: #475569; }

        /* Program Colors */
        .vta-prog-play  { background: #FDF4FF; color: #C026D3; border: 1px solid #F5D0FE; }
        .vta-prog-prekg { background: #FFF7ED; color: #EA580C; border: 1px solid #FFEDD5; }
        .vta-prog-lkg   { background: #EFF6FF; color: #2563EB; border: 1px solid #DBEAFE; }
        .vta-prog-ukg   { background: #F0FDF4; color: #16A34A; border: 1px solid #DCFCE7; }
        .vta-prog-default { background: #F8FAFC; color: #475569; border: 1px solid #E2E8F0; }

        /* Action Buttons */
        .vta-actions-cell {
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }

        .vta-btn-action {
          border: none;
          background: #F1F5F9;
          color: var(--vta-text-main);
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .vta-btn-action:hover {
          background: #E2E8F0;
          transform: scale(1.05);
        }

        .vta-btn-action-del:hover {
          background: #FEE2E2;
          color: #DC2626;
        }

        .vta-btn-action-wa {
          background: #DCFCE7;
          color: #15803D;
          text-decoration: none;
        }

        .vta-btn-action-wa:hover {
          background: #BBF7D0;
        }

        /* Status Dropdown in Table */
        .vta-status-select {
          padding: 4px 8px;
          border-radius: 20px;
          font-family: var(--vta-font);
          font-size: 11.5px;
          font-weight: 800;
          border: 1px solid transparent;
          cursor: pointer;
          outline: none;
        }

        .vta-status-select.pending { background: #FEF3C7; color: #B45309; border-color: #FDE68A; }
        .vta-status-select.approved { background: #D1FAE5; color: #047857; border-color: #A7F3D0; }
        .vta-status-select.rejected { background: #FEE2E2; color: #B91C1C; border-color: #FECACA; }

        /* Form Card */
        .vta-form-card {
          background: #FFFFFF;
          border-radius: var(--vta-radius-xl);
          border: 1.5px solid rgba(255, 107, 53, 0.22);
          box-shadow: 0 10px 36px rgba(255, 107, 53, 0.08);
          padding: 32px;
          margin-bottom: 32px;
        }

        .vta-form-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 24px;
          border-bottom: 1.5px solid rgba(255, 107, 53, 0.12);
          padding-bottom: 20px;
        }

        .vta-form-card-header h3 {
          margin: 10px 0 4px;
          font-size: 20px;
          font-weight: 900;
        }

        .vta-form-card-header p {
          margin: 0;
          color: var(--vta-text-muted);
          font-size: 13.5px;
        }

        .vta-form-section-title {
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: var(--vta-primary);
          margin-bottom: 14px;
        }

        .vta-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .vta-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .vta-field label {
          font-size: 12.5px;
          font-weight: 700;
          color: #57534E;
        }

        .vta-field input, .vta-field select {
          padding: 12px 16px;
          border-radius: var(--vta-radius-md);
          border: 1.5px solid rgba(255, 107, 53, 0.2);
          font-family: var(--vta-font);
          font-size: 14px;
          outline: none;
          background: #FFFDFB;
          transition: all 0.2s ease;
          box-sizing: border-box;
          width: 100%;
        }

        .vta-field input:focus, .vta-field select:focus {
          border-color: var(--vta-primary);
          background: #FFFFFF;
          box-shadow: 0 0 0 3.5px rgba(255, 107, 53, 0.18);
        }

        .vta-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
          border-top: 1px solid var(--vta-border);
          padding-top: 20px;
        }

        .vta-form-success {
          text-align: center;
          padding: 40px 20px;
        }

        .vta-success-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #D1FAE5;
          color: #059669;
          font-size: 32px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        .vta-alert-error {
          background: #FEE2E2;
          border: 1px solid #FECACA;
          color: #B91C1C;
          border-radius: var(--vta-radius-md);
          padding: 12px 16px;
          font-size: 13.5px;
          font-weight: 700;
        }

        /* Modal */
        .vta-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
          box-sizing: border-box;
        }

        .vta-modal-card {
          background: #FFFFFF;
          border-radius: var(--vta-radius-xl);
          width: 100%;
          max-width: 640px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
          animation: vta-modal-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .vta-modal-header {
          padding: 24px 28px;
          border-bottom: 1px solid var(--vta-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .vta-modal-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 900;
        }

        .vta-modal-close-btn {
          background: #F1F5F9;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 16px;
          font-weight: 700;
          color: var(--vta-text-muted);
        }

        .vta-modal-body {
          padding: 24px 28px;
        }

        .vta-modal-field-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid var(--vta-border-subtle);
          font-size: 14px;
        }

        .vta-modal-key {
          font-weight: 700;
          color: var(--vta-text-muted);
          text-transform: capitalize;
          min-width: 140px;
        }

        .vta-modal-val {
          font-weight: 600;
          color: var(--vta-text-main);
          text-align: right;
          word-break: break-word;
        }

        .vta-modal-footer {
          padding: 20px 28px;
          background: #F8FAFC;
          border-top: 1px solid var(--vta-border);
          border-radius: 0 0 var(--vta-radius-xl) var(--vta-radius-xl);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        /* Login Screen CSS */
        .vta-login-wrap {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #090D16 0%, #111827 50%, #1E1B4B 100%);
          position: relative;
          overflow: hidden;
          padding: 24px;
          box-sizing: border-box;
        }

        .vta-login-glow-1 {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 107, 53, 0.25) 0%, transparent 70%);
          top: -150px;
          left: -150px;
          pointer-events: none;
        }

        .vta-login-glow-2 {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%);
          bottom: -150px;
          right: -150px;
          pointer-events: none;
        }

        .vta-login-card {
          width: 100%;
          max-width: 440px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: var(--vta-radius-xl);
          padding: 44px 36px;
          box-shadow: 0 32px 64px rgba(0, 0, 0, 0.4);
          position: relative;
          z-index: 1;
        }

        .vta-login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .vta-login-logo-ring {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #FFFFFF;
          margin: 0 auto 16px;
          padding: 6px;
          box-shadow: 0 8px 24px rgba(255, 107, 53, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .vta-login-logo-ring img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .vta-login-header h2 {
          margin: 0 0 8px;
          font-size: 24px;
          font-weight: 900;
          color: #FFFFFF;
        }

        .vta-login-form .vta-field label {
          color: rgba(255, 255, 255, 0.8);
        }

        .vta-login-form .vta-field input {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.18);
          color: #FFFFFF;
        }

        .vta-login-form .vta-field input:focus {
          border-color: var(--vta-primary);
          background: rgba(255, 255, 255, 0.14);
        }

        .vta-btn-block {
          width: 100%;
          padding: 14px;
          font-size: 15px;
          margin-top: 14px;
        }

        .vta-login-footer {
          text-align: center;
          margin-top: 24px;
        }

        .vta-login-footer p {
          margin: 0;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
        }

        @keyframes vta-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.2); }
        }

        @keyframes vta-modal-up {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Mobile Responsive */
        @media (max-width: 900px) {
          .vta-navbar-inner {
            padding: 12px 18px;
          }
          .vta-nav-pills {
            display: none;
          }
          .vta-nav-pills.open {
            display: flex;
            flex-direction: column;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: #FFFFFF;
            padding: 16px;
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
            border-radius: 0 0 20px 20px;
            border-bottom: 1px solid var(--vta-border);
          }
          .vta-mobile-toggle {
            display: flex;
          }
          .vta-main-content {
            padding: 20px 16px 40px;
          }
          .vta-grid-2 {
            grid-template-columns: 1fr;
          }
          .vta-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .vta-stat-val {
            font-size: 26px;
          }
        }

        @media (max-width: 520px) {
          .vta-stats-grid {
            grid-template-columns: 1fr;
          }
          .vta-welcome-banner {
            flex-direction: column;
            align-items: flex-start;
            padding: 24px 20px;
          }
        }
      `}</style>

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

            <button type="button" className="vta-btn-ghost" onClick={fetchAll} title="Reload fresh data">
              <span>🔄</span>
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

        {/* Global Loading Indicator */}
        {loading && (
          <div style={{
            background: '#FEF3C7',
            border: '1px solid #FDE68A',
            borderRadius: 12,
            padding: '12px 20px',
            marginBottom: 24,
            fontSize: 13.5,
            fontWeight: 700,
            color: '#B45309',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <span>⏳</span> Synchronizing live data with Supabase...
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
  const { admin, logout, isAuth, loading } = useAuth();

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

  if (!isAuth) return <LoginPage />;
  return <Dashboard admin={admin} logout={logout} />;
}
