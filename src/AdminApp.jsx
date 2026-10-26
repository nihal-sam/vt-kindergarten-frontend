import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supabase } from "./supabaseClient";
import { parseEnquiryEligibility, CUTOFF_LABEL } from "./utils/ageEligibility";
import BillGeneration from "./components/BillGeneration";
import LoginPage from "./components/LoginPage";
import AdminManagement from "./components/AdminManagement";
import { fetchRegisteredAdmins } from "./utils/adminAuth";
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

const parseVisitLocation = (v = {}) => {
  if (!v) {
    return {
      city: '',
      region: '',
      country: '',
      flag: '📍',
      display: 'Location not logged',
      displayWithFlag: '📍 Location not logged',
      cleanReferrer: 'Direct / Link',
      hasLocation: false,
    };
  }

  // 1. Direct table columns if present
  if (v.city || v.region || v.country) {
    const city = (v.city || '').trim();
    const region = (v.region || '').trim();
    const country = (v.country || '').trim();
    const isIndia = country.toLowerCase().includes('india') || country.toUpperCase() === 'IN';
    const flag = isIndia ? '🇮🇳' : '📍';
    const parts = [city, region, country].filter(Boolean);
    const display = parts.join(', ') || 'Unknown Location';
    const rawRef = v.referrer || '';
    const cleanReferrer = rawRef && rawRef !== 'Direct/Unknown' ? rawRef : 'Direct / Link';
    return {
      city,
      region,
      country,
      flag,
      display,
      displayWithFlag: `${flag} ${display}`,
      cleanReferrer,
      hasLocation: true,
    };
  }

  // 2. Parse location tag from referrer: e.g. "Direct/Unknown [🇮🇳 Chennai, Tamil Nadu, IN]"
  const rawRef = v.referrer || '';
  const match = rawRef.match(/\[(.*?)\]$/);
  let cleanReferrer = rawRef.replace(/\s*\[.*?\]$/, '').trim();
  if (!cleanReferrer || cleanReferrer === 'Direct/Unknown') {
    cleanReferrer = 'Direct / Link';
  }

  if (match && match[1]) {
    const inside = match[1].trim();
    const flagMatch = inside.match(/^(\p{Regional_Indicator}{2}|\p{Extended_Pictographic})/u);
    const flag = flagMatch ? flagMatch[1] : (inside.includes('IN') || inside.includes('India') ? '🇮🇳' : '📍');
    const textPart = (flagMatch ? inside.slice(flagMatch[0].length) : inside).trim();
    const pieces = textPart.split(',').map(s => s.trim()).filter(Boolean);
    const city = pieces[0] || '';
    const region = pieces[1] || '';
    const country = pieces[2] || (inside.includes('IN') ? 'India' : '');
    const display = textPart || 'Unknown Location';

    return {
      city,
      region,
      country,
      flag,
      display,
      displayWithFlag: `${flag} ${display}`,
      cleanReferrer,
      hasLocation: true,
    };
  }

  return {
    city: '',
    region: '',
    country: '',
    flag: '📍',
    display: 'Location not logged',
    displayWithFlag: '📍 Location not logged',
    cleanReferrer,
    hasLocation: false,
  };
};

const getWhatsAppUrl = (phone = '', message = '') => {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '#';
  const full = digits.length === 10 ? `91${digits}` : digits;
  const baseUrl = `https://wa.me/${full}`;
  return message ? `${baseUrl}?text=${encodeURIComponent(message)}` : baseUrl;
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
      // 1. Insert into dedicated student_admissions table
      let { error: supabaseError } = await supabase
        .from('student_admissions')
        .insert([{ ...form, status: 'pending' }]);

      // Fallback to legacy admissions if student_admissions table is not yet created
      if (supabaseError && (supabaseError.message?.includes('student_admissions') || supabaseError.code === '42P01')) {
        const { error: fallbackErr } = await supabase
          .from('admissions')
          .insert([{ ...form, status: 'pending' }]);
        supabaseError = fallbackErr;
      }

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
  const isSuperAdmin = admin?.isSuperAdmin || admin?.email === 'superadmin@vtkindergarten.com';
  const [pendingAdminCount, setPendingAdminCount] = useState(0);

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

  // Poll / fetch pending admin registrations for Super Admin
  useEffect(() => {
    if (isSuperAdmin) {
      fetchRegisteredAdmins().then((list) => {
        const pending = (list || []).filter((a) => a.status === 'pending').length;
        setPendingAdminCount(pending);
      });
    }
  }, [isSuperAdmin, tab]);

  // Pagination states
  const [pageSizeAdm, setPageSizeAdm] = useState(10);
  const [pageAdm, setPageAdm] = useState(1);

  const [pageSizeEnq, setPageSizeEnq] = useState(10);
  const [pageEnq, setPageEnq] = useState(1);

  const [pageSizeVis, setPageSizeVis] = useState(10);
  const [pageVis, setPageVis] = useState(1);

  // Sliding pill active indicator for Admin Nav
  const [adminPillStyle, setAdminPillStyle] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    opacity: 0,
  });

  const adminNavRef = useRef(null);

  const updateAdminPill = useCallback((targetTab) => {
    const nav = adminNavRef.current;
    if (!nav) return;

    const targetBtn = nav.querySelector(`[data-tab-id="${targetTab}"]`);
    if (!targetBtn) {
      setAdminPillStyle(prev => ({ ...prev, opacity: 0 }));
      return;
    }

    const navRect = nav.getBoundingClientRect();
    const btnRect = targetBtn.getBoundingClientRect();

    setAdminPillStyle({
      left: Math.round(btnRect.left - navRect.left),
      top: Math.round(btnRect.top - navRect.top),
      width: Math.round(btnRect.width),
      height: Math.round(btnRect.height),
      opacity: 1,
    });
  }, []);

  useEffect(() => {
    updateAdminPill(tab);
  }, [tab, admissions.length, enquiries.length, visitsCount, updateAdminPill]);

  useEffect(() => {
    const handleResize = () => updateAdminPill(tab);
    window.addEventListener('resize', handleResize);

    if (document.fonts) {
      document.fonts.ready.then(() => updateAdminPill(tab));
    }

    const timer = setTimeout(() => updateAdminPill(tab), 150);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [tab, updateAdminPill]);

  useEffect(() => {
    if (menuOpen) {
      const timer = setTimeout(() => updateAdminPill(tab), 250);
      return () => clearTimeout(timer);
    }
  }, [menuOpen, tab, updateAdminPill]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // 1. Fetch Enquiries from existing admissions table
      const { data: enqRaw, error: enqErr } = await supabase
        .from('admissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (enqErr) {
        console.error('API Recall Error (enquiries):', enqErr);
        if (enqErr.message.includes('JWT')) logout();
        return;
      }

      // 2. Fetch Admissions from dedicated student_admissions table
      let admList = [];
      const { data: admData, error: admErr } = await supabase
        .from('student_admissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (admErr) {
        // Fallback to admissions table if student_admissions table is not yet created
        admList = (enqRaw || []).filter(d => d.parent_name && d.parent_name.trim() !== '' && d.relation !== 'Fee Receipt' && d.relation !== 'Admin Account');
      } else {
        admList = (admData || []).filter(d => d.relation !== 'Fee Receipt' && d.relation !== 'Admin Account');
      }

      // Filter enquiries from admissions table
      const isEnquiry = (d) =>
        d.relation !== 'Fee Receipt' &&
        d.relation !== 'Admin Account' &&
        (!d.parent_name ||
          d.parent_name.trim() === '' ||
          (d.message && (d.message.includes('Age Eligibility') || d.message.includes('Calculated Age'))) ||
          (d.relation === 'Eligible' || d.relation === 'Not Eligible'));

      const enqList = (enqRaw || []).filter(isEnquiry).map(d => ({
        ...d,
        name: d.child_name || d.parent_name || 'Prospective Parent'
      }));

      setAdmissions(admList);
      setEnquiries(enqList);

      // 3. Fetch Visitor Analytics from Supabase API
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

      // 4. Stats Calculation
      const combinedAll = admList.concat(enqList);
      setStats({
        this_month: combinedAll.filter(d => d.created_at && new Date(d.created_at).getMonth() === new Date().getMonth()).length,
        pending: admList.filter(d => !d.status || d.status === 'pending').length,
        approved: admList.filter(d => d.status === 'approved').length,
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
      let { error } = await supabase
        .from('student_admissions')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) {
        // Fallback to legacy admissions table
        const { error: fallbackErr } = await supabase
          .from('admissions')
          .update({ status: newStatus })
          .eq('id', id);
        error = fallbackErr;
      }

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
      if (type === 'admission' || type === 'admissions') {
        const { error } = await supabase.from('student_admissions').delete().eq('id', id);
        if (error) {
          await supabase.from('admissions').delete().eq('id', id);
        }
      } else {
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

    if (!data || data.length === 0) {
      alert('No records available to download in Excel.');
      return;
    }

    let cleanData = [];
    let sheetTitle = 'Data';

    if (name === 'Enquiries') {
      sheetTitle = 'Parent Enquiries';
      cleanData = data.map((e, index) => {
        const info = parseEnquiryEligibility(e);
        return {
          'S.No': index + 1,
          'Child Full Name': e.child_name || e.name || '-',
          'Date of Birth (DOB)': e.dob || '-',
          'Calculated Age (on 31 Mar 2026)': info.calculatedAgeStr || '-',
          'Eligibility Status': info.isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE (< 2 YRS)',
          'Recommended Class': info.recommendedClass || '-',
          'Parent Phone Number': e.phone || '-',
          'Parent Email Address': e.email || '-',
          'Parent Questions / Queries': info.parentNote || '-',
          'Inquiry Submitted Date': formatDate(e.created_at),
        };
      });
    } else if (name === 'Admissions') {
      sheetTitle = 'Student Admissions';
      cleanData = data.map((a, index) => ({
        'S.No': index + 1,
        'Child Full Name': a.child_name || '-',
        'Date of Birth (DOB)': a.dob || '-',
        'Gender': a.gender || '-',
        'Enrolled Program': a.program || '-',
        'Parent / Guardian Name': a.parent_name || '-',
        'Relationship': a.relation || 'Parent',
        'Contact Phone': a.phone || '-',
        'Email Address': a.email || '-',
        'Residential Address': a.address || '-',
        'Previous School': a.previous_school || '-',
        'Parent Notes / Message': a.message || '-',
        'Application Status': (a.status || 'pending').toUpperCase(),
        'Application Submitted Date': formatDate(a.created_at),
      }));
    } else if (name === 'Website_Visitors') {
      sheetTitle = 'Website Traffic Logs';
      cleanData = data.map((v, index) => {
        const ua = parseUserAgent(v.user_agent);
        const loc = parseVisitLocation(v);
        return {
          'S.No': index + 1,
          'Visit Date & Time': formatDate(v.created_at),
          'Visitor Location': loc.hasLocation ? loc.displayWithFlag : 'Not logged',
          'City': loc.city || '-',
          'State / Region': loc.region || '-',
          'Country': loc.country || '-',
          'Device Type': ua.isMobile ? 'Mobile' : 'Desktop',
          'Web Browser': ua.browser,
          'Operating System': ua.os,
          'Traffic Source / Referrer': loc.cleanReferrer,
          'Browser Language': v.language || 'en',
          'Screen Width': v.screen_width ? `${v.screen_width}px` : '-',
          'Full User Agent Details': v.user_agent || '-',
        };
      });
    } else {
      sheetTitle = name;
      cleanData = data.map(({ id, ...rest }) => rest);
    }

    const ws = window.XLSX.utils.json_to_sheet(cleanData);

    // Compute generous, readable column widths for perfect spacing in Excel
    if (cleanData.length > 0) {
      const colKeys = Object.keys(cleanData[0]);
      const colWidths = colKeys.map(key => {
        let maxLen = key.length;
        cleanData.forEach(row => {
          const val = row[key];
          if (val !== null && val !== undefined) {
            const str = String(val);
            const lineMax = Math.max(...str.split('\n').map(l => l.length));
            if (lineMax > maxLen) maxLen = lineMax;
          }
        });
        // Add 4 characters padding, min 12, max 55
        return { wch: Math.min(Math.max(maxLen + 4, 12), 55) };
      });
      ws['!cols'] = colWidths;
      ws['!rows'] = [{ hpt: 26 }]; // Spacious header row height
    }

    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, sheetTitle);

    const safeDate = new Date().toISOString().slice(0, 10);
    const fileName = `VT_Kindergarten_${name}_${safeDate}.xlsx`;
    window.XLSX.writeFile(wb, fileName);
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
      const info = parseEnquiryEligibility(e);
      const q = search.toLowerCase();
      const matchQuery = !search ||
        (e.name || '').toLowerCase().includes(q) ||
        (e.child_name || '').toLowerCase().includes(q) ||
        (e.dob || '').toLowerCase().includes(q) ||
        (e.phone || '').includes(search) ||
        (e.email || '').toLowerCase().includes(q) ||
        (e.message || '').toLowerCase().includes(q) ||
        (info.calculatedAgeStr || '').toLowerCase().includes(q) ||
        (info.recommendedClass || '').toLowerCase().includes(q);

      let matchProgram = true;
      if (filterProgram) {
        if (filterProgram === 'Not Eligible') {
          matchProgram = !info.isEligible;
        } else {
          matchProgram = isProgramMatch(info.recommendedClass, filterProgram);
        }
      }
      return matchQuery && matchProgram;
    });
  }, [enquiries, search, filterProgram]);

  const fVisits = useMemo(() => {
    return visitsList.filter(v => {
      if (!search) return true;
      const q = search.toLowerCase();
      const loc = parseVisitLocation(v);
      return (v.user_agent || '').toLowerCase().includes(q) ||
        (v.referrer || '').toLowerCase().includes(q) ||
        (v.language || '').toLowerCase().includes(q) ||
        loc.display.toLowerCase().includes(q) ||
        loc.city.toLowerCase().includes(q) ||
        loc.region.toLowerCase().includes(q) ||
        loc.country.toLowerCase().includes(q);
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
    const locCounts = {};

    visitsList.forEach(v => {
      const parsed = parseUserAgent(v.user_agent);
      if (parsed.isMobile) mobile++;
      else desktop++;

      const loc = parseVisitLocation(v);
      if (loc.hasLocation && loc.display) {
        const key = loc.city ? `${loc.city}, ${loc.region || loc.country}` : loc.display;
        locCounts[key] = (locCounts[key] || 0) + 1;
      }
    });

    let topLocation = 'Karaikudi & TN';
    let topLocationCount = 0;
    Object.entries(locCounts).forEach(([loc, cnt]) => {
      if (cnt > topLocationCount) {
        topLocationCount = cnt;
        topLocation = loc;
      }
    });

    const total = visitsList.length || 1;
    return {
      mobile,
      desktop,
      mobilePct: Math.round((mobile / total) * 100),
      desktopPct: Math.round((desktop / total) * 100),
      topLocation,
      topLocationCount,
      uniqueLocations: Object.keys(locCounts).length,
    };
  }, [visitsList]);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: '📊', count: null },
    { id: 'admissions', label: 'Admissions', icon: '🎓', count: admissions.length },
    { id: 'enquiries', label: 'Enquiries', icon: '✉️', count: enquiries.length },
    { id: 'visitors', label: 'Live Visitors', icon: '👥', count: visitsCount, live: true },
    { id: 'billing', label: 'Bill Generation', icon: '🧾', count: null },
    ...(isSuperAdmin
      ? [{ id: 'admin_management', label: 'Admin Approvals', icon: '🛡️', count: pendingAdminCount }]
      : []),
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

          {/* Segmented Tab Navigation with Smoothly Gliding Box */}
          <nav className={`vta-nav-pills ${menuOpen ? 'open' : ''}`} ref={adminNavRef}>
            {/* The Hardware-Accelerated Sliding Indicator Box */}
            <div
              className="vta-nav-sliding-pill"
              aria-hidden="true"
              style={{
                transform: `translate3d(${adminPillStyle.left}px, ${adminPillStyle.top}px, 0)`,
                width: `${adminPillStyle.width}px`,
                height: `${adminPillStyle.height}px`,
                opacity: adminPillStyle.opacity,
              }}
            />

            {navItems.map(item => (
              <button
                key={item.id}
                type="button"
                data-tab-id={item.id}
                className={`vta-nav-pill-btn ${tab === item.id ? 'active' : ''}`}
                onClick={() => {
                  setTab(item.id);
                  updateAdminPill(item.id);
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

            {/* Mobile Drawer Logout & User Details */}
            <div className="vta-mobile-menu-footer">
              <div className="vta-mobile-user-profile">
                <div
                  className="vta-user-avatar"
                  style={{
                    background: isSuperAdmin ? 'linear-gradient(135deg, #7C3AED, #5B21B6)' : '#FF6B35',
                    boxShadow: isSuperAdmin ? '0 0 10px rgba(124, 58, 237, 0.4)' : 'none',
                    width: 32,
                    height: 32,
                    fontSize: 14,
                  }}
                >
                  {isSuperAdmin ? '👑' : (admin?.name || admin?.email || 'A')[0].toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                    {admin?.name || admin?.email}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: isSuperAdmin ? '#7C3AED' : '#64748B' }}>
                    {isSuperAdmin ? '👑 Master Super Admin' : 'Administrator'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="vta-mobile-logout-btn"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
              >
                <span>🚪</span>
                <span>Logout ({isSuperAdmin ? 'Super Admin' : 'Admin'})</span>
              </button>
            </div>
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
              title={`Refresh page ${lastRefreshed ? `(Last updated: ${lastRefreshed})` : ''}`}
            >
              <span className={loading ? 'vta-spin' : ''}>🔄</span>
              <span className="vta-hide-mobile">{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            {/* User Profile Badge */}
            <div
              className={`vta-user-chip ${isSuperAdmin ? 'vta-user-chip-super' : ''}`}
              title={`Logged in as ${admin?.name || admin?.email} (${isSuperAdmin ? 'Master Super Admin' : 'Administrator'})`}
            >
              <div
                className="vta-user-avatar"
                style={{
                  background: isSuperAdmin ? 'linear-gradient(135deg, #7C3AED, #5B21B6)' : '#FF6B35',
                  boxShadow: isSuperAdmin ? '0 0 12px rgba(124, 58, 237, 0.45)' : 'none',
                }}
              >
                {isSuperAdmin ? '👑' : (admin?.name || admin?.email || 'A')[0].toUpperCase()}
              </div>
              <div className="vta-hide-mobile" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <span className="vta-user-name" style={{ fontSize: 13, fontWeight: 800, color: isSuperAdmin ? '#581C87' : 'inherit' }}>
                  {admin?.name || admin?.email?.split('@')[0] || 'Admin'}
                </span>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: isSuperAdmin ? '#7C3AED' : '#94A3B8' }}>
                  {isSuperAdmin ? 'Master Super Admin' : 'Administrator'}
                </span>
              </div>
            </div>

            {/* Prominent Dedicated Navbar Logout Button */}
            <button
              type="button"
              className={`vta-btn-logout-prominent ${isSuperAdmin ? 'is-super-admin' : ''}`}
              onClick={logout}
              title={`Sign Out of ${isSuperAdmin ? 'Super Admin' : 'Admin'} Console`}
            >
              <span className="vta-logout-icon">🚪</span>
              <span className="vta-logout-text">Logout</span>
            </button>

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
            {tab === 'overview' && (
              <>
                <span className="vta-badge-pill vta-badge-orange" style={{ marginBottom: 6, fontSize: 11, fontWeight: 800 }}>
                  📊 CENTRAL OPERATIONS DASHBOARD
                </span>
                <h1 style={{ margin: '4px 0 6px' }}>School Operations & Admissions Overview</h1>
                <p>Welcome back, {admin?.email?.split('@')[0] || 'Administrator'} • Today is {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </>
            )}
            {tab === 'admissions' && (
              <>
                <span className="vta-badge-pill vta-badge-orange" style={{ marginBottom: 6, fontSize: 11, fontWeight: 800 }}>
                  🎓 ADMISSIONS SECTION • Applications Management
                </span>
                <h1 style={{ margin: '4px 0 6px' }}>Student Admission Applications (2026–2027)</h1>
                <p>Review, approve, or manage incoming kindergarten admission requests submitted via offline entry & admissions form.</p>
              </>
            )}
            {tab === 'enquiries' && (
              <>
                <span className="vta-badge-pill vta-badge-green" style={{ marginBottom: 6, fontSize: 11, fontWeight: 800 }}>
                  💬 ENQUIRIES SECTION • Age Eligibility & Parent Inquiries
                </span>
                <h1 style={{ margin: '4px 0 6px' }}>Parent Enquiries & Age Eligibility Desk</h1>
                <p>Prospective parent inquiries submitted through the website Age Eligibility Calculator with automatic NEP 2020 verification.</p>
              </>
            )}
            {tab === 'visitors' && (
              <>
                <span className="vta-badge-pill vta-badge-blue" style={{ marginBottom: 6, fontSize: 11, fontWeight: 800 }}>
                  🌐 WEB ANALYTICS • Real-time Traffic Tracking
                </span>
                <h1 style={{ margin: '4px 0 6px' }}>Live Website Visitors & Activity Log</h1>
                <p>Live tracking of prospective parents browsing vtkindergarten.in with device, OS, screen & referral metrics.</p>
              </>
            )}
            {tab === 'billing' && (
              <>
                <span className="vta-badge-pill vta-badge-purple" style={{ marginBottom: 6, fontSize: 11, fontWeight: 800 }}>
                  🧾 BILL GENERATION • Official Fees Receipt Desk
                </span>
                <h1 style={{ margin: '4px 0 6px' }}>Student Fees Receipt & Bill Generator</h1>
                <p>Generate, print, download, and share official VT Kindergarten fee receipts matching school specifications.</p>
              </>
            )}
            {tab === 'admin_management' && (
              <>
                <span className="vta-badge-pill vta-badge-purple" style={{ marginBottom: 6, fontSize: 11, fontWeight: 800 }}>
                  🛡️ SUPER ADMIN CONTROL • Administrator Accounts & Approvals
                </span>
                <h1 style={{ margin: '4px 0 6px' }}>Admin Registrations & Phone Verification Desk</h1>
                <p>Review, confirm, or revoke portal administrator registrations with phone number OTP verification.</p>
              </>
            )}
          </div>

          <div className="vta-header-actions">
            <button
              type="button"
              className="vta-btn-ghost"
              onClick={fetchAll}
              disabled={loading}
              title="Refresh page"
              style={{ fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <span className={loading ? 'vta-spin' : ''}>🔄</span>
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
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
                  title="Download complete Student Admissions (.xlsx) spreadsheet"
                >
                  <span>📥 Download Admissions (.xlsx)</span>
                  <span className="vta-excel-count">{fAdmissions.length}</span>
                </button>
              </>
            )}

            {tab === 'enquiries' && (
              <button
                type="button"
                className="vta-btn-excel"
                onClick={() => exportExcel(fEnquiries, 'Enquiries')}
                title="Download complete Parent Enquiries & Age Eligibility (.xlsx) spreadsheet"
              >
                <span>📥 Download Enquiries (.xlsx)</span>
                <span className="vta-excel-count">{fEnquiries.length}</span>
              </button>
            )}

            {tab === 'visitors' && (
              <button
                type="button"
                className="vta-btn-excel"
                onClick={() => exportExcel(fVisits, 'Website_Visitors')}
                title="Download Website Visitor Analytics (.xlsx) spreadsheet"
              >
                <span>📥 Download Visitor Logs (.xlsx)</span>
                <span className="vta-excel-count">{fVisits.length}</span>
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
            <span>Refreshing page data...</span>
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
              <span>Page is refreshed correctly! All data is up to date.</span>
            </div>
            {lastRefreshed && (
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#047857' }}>
                Refreshed at {lastRefreshed}
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
                    <thead className="vta-thead-admissions">
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
                    <span className="vta-sub-text">Latest age eligibility inquiries</span>
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
                    <thead className="vta-thead-enquiries">
                      <tr>
                        <th>Child / Parent</th>
                        <th>Age (31 Mar)</th>
                        <th>Class & Eligibility</th>
                        <th>Parent Note</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enquiries.slice(0, 5).map((e, i) => {
                        const info = parseEnquiryEligibility(e);
                        return (
                          <tr key={i} style={{ cursor: 'pointer' }} onClick={() => setViewItem({ type: 'enquiry', data: e })}>
                            <td>
                              <div className="vta-name-bold">{e.child_name || e.name}</div>
                              <div className="vta-sub-text">{e.phone || '-'}</div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 700, fontSize: 12.5, color: '#1E293B' }}>{info.calculatedAgeStr || '-'}</div>
                            </td>
                            <td>
                              {info.isEligible ? (
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                  <span className={`vta-badge-pill ${getProgramBadgeClass(info.recommendedClass)}`} style={{ fontWeight: 800, fontSize: 11.5 }}>
                                    🎓 {info.recommendedClass}
                                  </span>
                                  <span className="vta-badge-pill vta-badge-green" style={{ fontSize: 10, padding: '2px 6px', fontWeight: 800 }}>
                                    ✓ Eligible
                                  </span>
                                </div>
                              ) : (
                                <span className="vta-badge-pill vta-badge-amber" style={{ fontSize: 11, fontWeight: 700 }}>
                                  ✕ Underage (&lt; 2 Yrs)
                                </span>
                              )}
                            </td>
                            <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={info.parentNote}>
                              {info.parentNote}
                            </td>
                            <td>
                              <span className="vta-sub-text">{timeAgo(e.created_at)}</span>
                            </td>
                          </tr>
                        );
                      })}
                      {enquiries.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#94A3B8' }}>
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
              {/* Admissions Panel Title Bar */}
              <div className="vta-table-title-bar vta-table-title-bar-admissions">
                <div className="vta-table-title-bar-left">
                  <h3>🎓 Student Admission Applications</h3>
                  <span className="vta-badge-pill vta-badge-orange">{fAdmissions.length} Applications</span>
                </div>
                <div className="vta-sub-text" style={{ fontWeight: 700, color: '#C2410C' }}>
                  Academic Session 2026–2027
                </div>
              </div>

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
                  <thead className="vta-thead-admissions">
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
            {/* Enquiries Panel Title Bar */}
            <div className="vta-table-title-bar vta-table-title-bar-enquiries">
              <div className="vta-table-title-bar-left">
                <h3>💬 Parent Enquiries & Age Eligibility</h3>
                <span className="vta-badge-pill vta-badge-green">{fEnquiries.length} Enquiries</span>
              </div>
              <div className="vta-sub-text" style={{ fontWeight: 700, color: '#047857' }}>
                Cutoff Benchmark: 31 March 2026 (NEP 2020)
              </div>
            </div>

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
                  <option value="">All Programs & Eligibility</option>
                  <option value="Play Group">Play Group (2+ yrs)</option>
                  <option value="Pre KG">Pre KG (3+ yrs)</option>
                  <option value="LKG">LKG (4+ yrs)</option>
                  <option value="UKG">UKG (5+ yrs)</option>
                  <option value="Not Eligible">Not Eligible / Underage (&lt; 2 yrs)</option>
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
                <thead className="vta-thead-enquiries">
                  <tr>
                    <th>#</th>
                    <th>Child & Contact Info</th>
                    <th>Calculated Age</th>
                    <th>Eligible Class & Status</th>
                    <th>Parent Note</th>
                    <th>Submitted</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedEnquiries.map((enq, i) => {
                    const info = parseEnquiryEligibility(enq);
                    const childName = enq.child_name || enq.name || 'your child';
                    const waText = info.isEligible
                      ? `Hello! Greetings from VT Kindergarten. We received your admission enquiry regarding ${childName}. As per our age criteria, ${childName} is eligible for ${info.recommendedClass} (Academic Session 2026–27). We would love to invite you for a campus visit! Please let us know a convenient time.`
                      : `Hello! Greetings from VT Kindergarten. We received your admission enquiry regarding ${childName}. As per our cutoff date (31 March 2026), ${childName} is currently underage for the upcoming 2026–27 intake. Feel free to contact us if you have any questions!`;

                    return (
                      <tr
                        key={enq.id || i}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setViewItem({ type: 'enquiry', data: enq })}
                      >
                        <td style={{ color: '#94A3B8', fontWeight: 700 }}>{(pageEnq - 1) * pageSizeEnq + i + 1}</td>
                        <td>
                          <div className="vta-avatar-cell">
                            <div className="vta-avatar-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
                              {(enq.child_name || enq.name || 'C')[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="vta-name-bold">{enq.child_name || enq.name}</div>
                              <div className="vta-sub-text" style={{ marginTop: 2 }}>
                                {enq.dob && <span>DOB: <strong>{enq.dob}</strong> &bull; </span>}
                                <span>{enq.phone || 'No phone'}</span>
                                {enq.email && <span> &bull; {enq.email}</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13.5 }}>
                            {info.calculatedAgeStr || '-'}
                          </div>
                          <div className="vta-sub-text" style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 3 }}>
                            🗓️ On 31 Mar 2026
                          </div>
                        </td>
                        <td>
                          {info.isEligible ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-start' }}>
                              <span
                                className={`vta-badge-pill ${getProgramBadgeClass(info.recommendedClass)}`}
                                style={{
                                  fontWeight: 900,
                                  fontSize: 12.5,
                                  padding: '4px 10px',
                                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
                                  borderWidth: 1.5,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5
                                }}
                              >
                                🎓 {info.recommendedClass}
                              </span>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: '#059669',
                                  paddingLeft: 2
                                }}
                              >
                                ✓ Eligible for Admission
                              </span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-start' }}>
                              <span
                                className="vta-badge-pill vta-badge-amber"
                                style={{
                                  fontWeight: 800,
                                  fontSize: 11.5,
                                  padding: '4px 9px',
                                  background: '#FEF3C7',
                                  color: '#B45309',
                                  border: '1.5px solid #FDE68A'
                                }}
                              >
                                ✕ Underage (&lt; 2 Yrs)
                              </span>
                              <span
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 600,
                                  color: '#DC2626',
                                  paddingLeft: 2
                                }}
                              >
                                Not Eligible for 2026-27
                              </span>
                            </div>
                          )}
                        </td>
                        <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={info.parentNote}>
                          {info.parentNote}
                        </td>
                        <td>
                          <div className="vta-sub-text">{timeAgo(enq.created_at)}</div>
                          <div style={{ fontSize: 11, color: '#94A3B8' }}>{formatDate(enq.created_at).split(',')[0]}</div>
                        </td>
                        <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <div className="vta-actions-cell" style={{ justifyContent: 'flex-end' }}>
                            {enq.phone && (
                              <a
                                href={getWhatsAppUrl(enq.phone, waText)}
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
                    );
                  })}
                  {fEnquiries.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: '#94A3B8' }}>
                        No enquiries found matching your search.
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
                  <span className="vta-stat-icon-wrap" style={{ background: 'rgba(234, 88, 12, 0.1)', color: '#EA580C' }}>
                    📍
                  </span>
                  <span className="vta-stat-badge">
                    {visitorStats.topLocationCount > 0 ? `${visitorStats.topLocationCount} hits` : 'Live'}
                  </span>
                </div>
                <div className="vta-stat-val" style={{ fontSize: 20, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={visitorStats.topLocation}>
                  {visitorStats.topLocation}
                </div>
                <div className="vta-stat-label">Top Visitor Location</div>
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
              {/* Visitors Panel Title Bar */}
              <div className="vta-table-title-bar vta-table-title-bar-visitors">
                <div className="vta-table-title-bar-left">
                  <h3>🌐 Live Website Visitor Sessions</h3>
                  <span className="vta-badge-pill vta-badge-blue">{fVisits.length} Logs</span>
                </div>
                <div className="vta-sub-text" style={{ fontWeight: 700, color: '#1E40AF' }}>
                  Real-time Visitor Tracking
                </div>
              </div>

              <div className="vta-panel-header">
                <div className="vta-filters-group">
                  <div className="vta-search-box">
                    <span className="vta-search-icon">🔍</span>
                    <input
                      type="text"
                      placeholder="Search location, device, browser, or referrer..."
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
                  <thead className="vta-thead-visitors">
                    <tr>
                      <th>#</th>
                      <th>Time Visited</th>
                      <th>Visitor Location</th>
                      <th>Device & Browser</th>
                      <th>Traffic Source</th>
                      <th>Language</th>
                      <th>Screen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedVisits.map((v, i) => {
                      const ua = parseUserAgent(v.user_agent);
                      const loc = parseVisitLocation(v);
                      return (
                        <tr key={v.id || i}>
                          <td style={{ color: '#94A3B8', fontWeight: 700 }}>{(pageVis - 1) * pageSizeVis + i + 1}</td>
                          <td>
                            <div className="vta-name-bold">{timeAgo(v.created_at)}</div>
                            <div className="vta-sub-text">{formatDate(v.created_at)}</div>
                          </td>
                          <td>
                            {loc.hasLocation ? (
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ fontSize: 16 }}>{loc.flag}</span>
                                  <span className="vta-name-bold" style={{ fontSize: 13, color: '#1E293B' }}>
                                    {loc.city ? `${loc.city}${loc.region ? `, ${loc.region}` : ''}` : loc.display}
                                  </span>
                                </div>
                                {loc.country && (
                                  <div className="vta-sub-text" style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                                    {loc.country}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94A3B8' }}>
                                <span style={{ fontSize: 13 }}>📍</span>
                                <span style={{ fontSize: 12, fontStyle: 'italic' }}>Location not logged</span>
                              </div>
                            )}
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
                            <div className="vta-sub-text" style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.user_agent}>
                              {v.user_agent}
                            </div>
                          </td>
                          <td>
                            <span className="vta-badge-pill vta-badge-gray" title={loc.cleanReferrer}>
                              {loc.cleanReferrer}
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
                        <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: '#94A3B8' }}>
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

        {/* ================= TAB 5: BILL GENERATION ================= */}
        {tab === 'billing' && (
          <BillGeneration admissions={admissions} enquiries={enquiries} />
        )}

        {/* ================= TAB 6: ADMIN APPROVALS (SUPER ADMIN) ================= */}
        {tab === 'admin_management' && isSuperAdmin && (
          <AdminManagement currentAdmin={admin} onLogout={logout} />
        )}
      </main>

      {/* ================= DETAIL MODAL ================= */}
      {viewItem && (() => {
        const isEnq = viewItem.type === 'enquiry';
        const enqInfo = isEnq ? parseEnquiryEligibility(viewItem.data) : null;
        const childName = viewItem.data.child_name || viewItem.data.name || 'your child';
        const recClass = isEnq ? (enqInfo?.recommendedClass || 'Kindergarten') : (viewItem.data.program || 'Kindergarten');

        const enqWaMsg = isEnq && enqInfo ? (
          enqInfo.isEligible
            ? `Hello! Greetings from VT Kindergarten. We received your admission enquiry regarding ${childName}. As per our age criteria, ${childName} is eligible for ${recClass} (Academic Session 2026–27). We would love to invite you for a campus visit! Please let us know a convenient time.`
            : `Hello! Greetings from VT Kindergarten. We received your admission enquiry regarding ${childName}. As per our cutoff date (31 March 2026), ${childName} is currently underage for the upcoming 2026–27 intake. Feel free to contact us if you have any questions!`
        ) : `Hello! Greetings from VT Kindergarten. We received your admission application for ${childName} (${recClass}). Our admissions desk is currently reviewing the application. Please let us know if you have any questions.`;

        return (
          <div className="vta-modal-backdrop" onClick={() => setViewItem(null)}>
            <div className="vta-modal-card" onClick={(e) => e.stopPropagation()}>
              {/* Modal Top Bar */}
              <div
                className="vta-modal-header"
                style={{
                  borderTop: isEnq
                    ? (enqInfo.isEligible ? '5px solid #10B981' : '5px solid #DC2626')
                    : '5px solid #FF6B35',
                  background: isEnq
                    ? (enqInfo.isEligible ? 'linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 100%)' : 'linear-gradient(180deg, #FEF2F2 0%, #FFFFFF 100%)')
                    : 'linear-gradient(180deg, #FFF7ED 0%, #FFFFFF 100%)'
                }}
              >
                <div>
                  <span
                    className={`vta-badge-pill ${
                      isEnq
                        ? (enqInfo.isEligible ? 'vta-badge-green' : 'vta-badge-amber')
                        : 'vta-badge-orange'
                    }`}
                    style={{ marginBottom: 6, fontSize: 11.5, fontWeight: 800 }}
                  >
                    {isEnq
                      ? `✉️ AGE ELIGIBILITY ENQUIRY • ${enqInfo.isEligible ? 'ELIGIBLE FOR ADMISSION' : 'UNDERAGE'}`
                      : '🎓 OFFICIAL STUDENT ADMISSION APPLICATION'}
                  </span>
                  <h3 style={{ margin: 0, fontSize: 21, fontWeight: 900, color: '#0F172A' }}>
                    {viewItem.data.child_name || viewItem.data.name || 'Details'}
                  </h3>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 3 }}>
                    Submitted {timeAgo(viewItem.data.created_at)} &bull; {formatDate(viewItem.data.created_at)}
                  </div>
                </div>
                <button
                  type="button"
                  className="vta-modal-close-btn"
                  onClick={() => setViewItem(null)}
                  title="Close modal"
                >
                  ✕
                </button>
              </div>

              {isEnq ? (
                /* ================= ENQUIRY ULTRA-PREMIUM BODY ================= */
                <div className="vta-modal-body">
                  {/* Hero Verdict Card */}
                  <div
                    className={`vta-modal-hero ${enqInfo.isEligible ? 'vta-modal-hero-eligible' : 'vta-modal-hero-ineligible'}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                      <span className="vta-modal-hero-tag">
                        {enqInfo.isEligible ? '✓ NEP 2020 & VT ADMISSION CRITERIA MET' : '✕ AGE CRITERIA NOT MET YET'}
                      </span>
                      <span style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.9)', fontWeight: 700 }}>
                        Cutoff Benchmark: {CUTOFF_LABEL}
                      </span>
                    </div>

                    <h2 className="vta-modal-hero-class">
                      {enqInfo.isEligible ? (
                        <>🎓 Eligible for: {enqInfo.recommendedClass}</>
                      ) : (
                        <>👶 Underage for 2026–27 Intake</>
                      )}
                    </h2>

                    <p className="vta-modal-hero-desc">
                      {enqInfo.isEligible
                        ? `Based on date of birth, ${childName} satisfies the official kindergarten age requirements for ${enqInfo.recommendedClass} (Academic Session 2026–2027).`
                        : `${childName} does not meet the minimum 2-year cutoff requirement on ${CUTOFF_LABEL} for Play Group.`}
                    </p>

                    <div className="vta-modal-hero-ribbon">
                      <div className="vta-modal-ribbon-item">
                        <div className="vta-modal-ribbon-label">Calculated Age (on 31 Mar 2026)</div>
                        <div className="vta-modal-ribbon-val">{enqInfo.calculatedAgeStr || 'Under 2 Years'}</div>
                      </div>
                      <div className="vta-modal-ribbon-item">
                        <div className="vta-modal-ribbon-label">Recommended Grade</div>
                        <div className="vta-modal-ribbon-val">{enqInfo.recommendedClass}</div>
                      </div>
                      <div className="vta-modal-ribbon-item">
                        <div className="vta-modal-ribbon-label">Admission Verdict</div>
                        <div className="vta-modal-ribbon-val">
                          {enqInfo.isEligible ? '✓ Ready for Admission' : '✕ Underage (< 2 Yrs)'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2-Column Info Grid */}
                  <div className="vta-modal-grid-2">
                    {/* Child Profile Box */}
                    <div className="vta-modal-card-box">
                      <div className="vta-modal-card-title">
                        <span>👶</span> Child Profile
                      </div>
                      <div className="vta-modal-row">
                        <span className="vta-modal-row-label">Full Name</span>
                        <span className="vta-modal-row-val" style={{ fontSize: 13.5 }}>
                          {viewItem.data.child_name || viewItem.data.name || '-'}
                        </span>
                      </div>
                      <div className="vta-modal-row">
                        <span className="vta-modal-row-label">Date of Birth (DOB)</span>
                        <span className="vta-modal-row-val">
                          {viewItem.data.dob || '-'}
                        </span>
                      </div>
                      <div className="vta-modal-row">
                        <span className="vta-modal-row-label">Age on 31 Mar 2026</span>
                        <span className="vta-modal-row-val" style={{ color: '#0D9488' }}>
                          {enqInfo.calculatedAgeStr || '-'}
                        </span>
                      </div>
                      <div className="vta-modal-row" style={{ borderBottom: 'none' }}>
                        <span className="vta-modal-row-label">Eligible Class</span>
                        <span className="vta-modal-row-val">
                          <span
                            className={`vta-badge-pill ${getProgramBadgeClass(enqInfo.recommendedClass)}`}
                            style={{ fontWeight: 800, fontSize: 11.5 }}
                          >
                            🎓 {enqInfo.recommendedClass}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Parent Contact Box */}
                    <div className="vta-modal-card-box">
                      <div className="vta-modal-card-title">
                        <span>👨‍👩‍👧</span> Parent Contact
                      </div>
                      <div className="vta-modal-row">
                        <span className="vta-modal-row-label">Mobile Phone</span>
                        <span className="vta-modal-row-val" style={{ letterSpacing: '0.3px' }}>
                          {viewItem.data.phone || 'Not provided'}
                        </span>
                      </div>
                      <div className="vta-modal-row">
                        <span className="vta-modal-row-label">Email Address</span>
                        <span className="vta-modal-row-val" style={{ fontSize: 12 }}>
                          {viewItem.data.email || 'None provided'}
                        </span>
                      </div>
                      <div className="vta-modal-row" style={{ borderBottom: 'none', paddingTop: 10 }}>
                        <span className="vta-modal-row-label">Quick Connect</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {viewItem.data.phone && (
                            <>
                              <a
                                href={getWhatsAppUrl(viewItem.data.phone, enqWaMsg)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="vta-badge-pill"
                                style={{
                                  background: '#10B981',
                                  color: '#FFFFFF',
                                  textDecoration: 'none',
                                  padding: '5px 10px',
                                  fontSize: 11,
                                  fontWeight: 800
                                }}
                                title="Chat on WhatsApp"
                              >
                                💬 WhatsApp
                              </a>
                              <a
                                href={`tel:${viewItem.data.phone}`}
                                className="vta-badge-pill"
                                style={{
                                  background: '#F1F5F9',
                                  color: '#0F172A',
                                  textDecoration: 'none',
                                  padding: '5px 10px',
                                  fontSize: 11,
                                  fontWeight: 800,
                                  border: '1px solid #CBD5E1'
                                }}
                                title="Call parent"
                              >
                                📞 Call
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Parent Questions / Notes Callout */}
                  <div className="vta-modal-note">
                    <div className="vta-modal-note-title">
                      <span>💬</span> Parent Questions & Inquiry Note
                    </div>
                    <div className="vta-modal-note-content">
                      {enqInfo.parentNote || 'No specific questions or additional notes submitted.'}
                    </div>
                  </div>

                  {/* Subtle Metadata Info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, color: '#94A3B8', padding: '0 4px' }}>
                    <span>Enquiry ID: #{viewItem.data.id || 'N/A'}</span>
                    <span>Source: Website Age Eligibility Calculator</span>
                  </div>
                </div>
              ) : (
                /* ================= ADMISSION APPLICATION ULTRA-PREMIUM BODY ================= */
                <div className="vta-modal-body">
                  {/* Hero Application Header */}
                  <div className="vta-modal-hero vta-modal-hero-admission">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                      <span className="vta-modal-hero-tag">
                        🎓 OFFICIAL ADMISSION APPLICATION
                      </span>
                      <span style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.9)', fontWeight: 700 }}>
                        Session 2026–2027
                      </span>
                    </div>

                    <h2 className="vta-modal-hero-class">
                      Student: {viewItem.data.child_name || 'Admission Applicant'}
                    </h2>

                    <p className="vta-modal-hero-desc">
                      Applied for {viewItem.data.program || 'Kindergarten Program'} &bull; Current Status: <strong>{viewItem.data.status?.toUpperCase() || 'PENDING'}</strong>
                    </p>

                    <div className="vta-modal-hero-ribbon">
                      <div className="vta-modal-ribbon-item">
                        <div className="vta-modal-ribbon-label">Program Applied</div>
                        <div className="vta-modal-ribbon-val">{viewItem.data.program || 'Kindergarten'}</div>
                      </div>
                      <div className="vta-modal-ribbon-item">
                        <div className="vta-modal-ribbon-label">Application Status</div>
                        <div className="vta-modal-ribbon-val">{viewItem.data.status?.toUpperCase() || 'PENDING'}</div>
                      </div>
                      <div className="vta-modal-ribbon-item">
                        <div className="vta-modal-ribbon-label">Submission Date</div>
                        <div className="vta-modal-ribbon-val">{formatDate(viewItem.data.created_at).split(',')[0]}</div>
                      </div>
                    </div>
                  </div>

                  {/* 2-Column Grid */}
                  <div className="vta-modal-grid-2">
                    {/* Student Info */}
                    <div className="vta-modal-card-box">
                      <div className="vta-modal-card-title">
                        <span>👶</span> Student Details
                      </div>
                      <div className="vta-modal-row">
                        <span className="vta-modal-row-label">Child Name</span>
                        <span className="vta-modal-row-val">{viewItem.data.child_name || '-'}</span>
                      </div>
                      <div className="vta-modal-row">
                        <span className="vta-modal-row-label">Date of Birth</span>
                        <span className="vta-modal-row-val">{viewItem.data.dob || '-'}</span>
                      </div>
                      <div className="vta-modal-row">
                        <span className="vta-modal-row-label">Gender</span>
                        <span className="vta-modal-row-val">{viewItem.data.gender || '-'}</span>
                      </div>
                      <div className="vta-modal-row" style={{ borderBottom: 'none' }}>
                        <span className="vta-modal-row-label">Program</span>
                        <span className="vta-modal-row-val">
                          <span className={`vta-badge-pill ${getProgramBadgeClass(viewItem.data.program)}`} style={{ fontWeight: 800 }}>
                            {viewItem.data.program || '-'}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Parent Info */}
                    <div className="vta-modal-card-box">
                      <div className="vta-modal-card-title">
                        <span>👨‍👩‍👧</span> Parent / Guardian
                      </div>
                      <div className="vta-modal-row">
                        <span className="vta-modal-row-label">Parent Name</span>
                        <span className="vta-modal-row-val">{viewItem.data.parent_name || '-'}</span>
                      </div>
                      <div className="vta-modal-row">
                        <span className="vta-modal-row-label">Relationship</span>
                        <span className="vta-modal-row-val">{viewItem.data.relation || 'Parent'}</span>
                      </div>
                      <div className="vta-modal-row">
                        <span className="vta-modal-row-label">Phone</span>
                        <span className="vta-modal-row-val">{viewItem.data.phone || '-'}</span>
                      </div>
                      <div className="vta-modal-row" style={{ borderBottom: 'none' }}>
                        <span className="vta-modal-row-label">Email</span>
                        <span className="vta-modal-row-val" style={{ fontSize: 12 }}>{viewItem.data.email || 'None provided'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Academic & Address Card */}
                  <div className="vta-modal-card-box" style={{ marginBottom: 16 }}>
                    <div className="vta-modal-card-title">
                      <span>🏡</span> Residential Address & Academic History
                    </div>
                    <div className="vta-modal-row">
                      <span className="vta-modal-row-label">Address</span>
                      <span className="vta-modal-row-val">{viewItem.data.address || 'None provided'}</span>
                    </div>
                    <div className="vta-modal-row">
                      <span className="vta-modal-row-label">Previous School</span>
                      <span className="vta-modal-row-val">{viewItem.data.previous_school || 'None / First School'}</span>
                    </div>
                    <div className="vta-modal-row" style={{ borderBottom: 'none' }}>
                      <span className="vta-modal-row-label">Message / Remarks</span>
                      <span className="vta-modal-row-val">{viewItem.data.message || 'No additional notes provided'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="vta-modal-footer">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {isEnq ? (
                    <button
                      type="button"
                      className="vta-btn-action vta-btn-action-del"
                      style={{ padding: '8px 14px', fontSize: 12.5, borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      onClick={async () => {
                        await deleteRecord('enquiries', viewItem.data.id);
                        setViewItem(null);
                      }}
                    >
                      🗑️ Delete Enquiry
                    </button>
                  ) : (
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
                      <button
                        type="button"
                        className="vta-btn-action vta-btn-action-del"
                        style={{ padding: '8px 14px', fontSize: 12.5, borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 4 }}
                        onClick={async () => {
                          await deleteRecord('admissions', viewItem.data.id);
                          setViewItem(null);
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {viewItem.data.phone && (
                    <a
                      href={getWhatsAppUrl(viewItem.data.phone, isEnq ? enqWaMsg : '')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="vta-modal-wa-btn"
                    >
                      💬 WhatsApp Parent
                    </a>
                  )}
                  {viewItem.data.phone && (
                    <a
                      href={`tel:${viewItem.data.phone}`}
                      className="vta-modal-call-btn"
                    >
                      📞 Call Parent
                    </a>
                  )}
                  <button
                    type="button"
                    className="vta-btn-secondary"
                    onClick={() => setViewItem(null)}
                    style={{ padding: '9px 18px', borderRadius: 10 }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
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
