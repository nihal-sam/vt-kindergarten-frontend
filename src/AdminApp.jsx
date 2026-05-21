import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const initialAdmissionForm = {
  child_name: '', dob: '', gender: '',
  program: '', parent_name: '', relation: '',
  phone: '', email: '', address: '',
  previous_school: '', message: ''
};

function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token'));
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem('admin_user') || 'null'); } catch { return null; }
  });
  const login = (tok, user) => {
    localStorage.setItem('admin_token', tok);
    localStorage.setItem('admin_user', JSON.stringify(user));
    setToken(tok); setAdmin(user);
  };
  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setToken(null); setAdmin(null);
  };
  useEffect(() => {
    if (!token) {
      localStorage.removeItem('admin_user');
      setAdmin(null);
    }
  }, [token]);
  return { token, admin, login, logout, isAuth: !!token };
}

function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/admin/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) onLogin(data.token, data.admin);
      else setError(data.message || 'Invalid credentials');
    } catch { setError('Connection failed. Is the backend running on port 8000?'); }
    finally { setLoading(false); }
  };

  return (
    <div style={s.loginWrap}>
      <div style={s.loginCard}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>VT</div>
          <h1 style={{ fontFamily: 'sans-serif', fontSize: 28, color: '#FF6B35', margin: '0 0 6px' }}>VT Kindergarten</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>Admin Portal</p>
        </div>
        <form onSubmit={submit}>
          <div style={s.fg}>
            <label style={s.label}>Email Address</label>
            <input style={s.inp} type="email" placeholder="admin@vtkindergarten.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div style={s.fg}>
            <label style={s.label}>Password</label>
            <input style={s.inp} type="password" placeholder="Enter password"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
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

function AdmissionApplicationBox({ onSubmitted }) {
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
      const res = await fetch(`${API}/admissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccess(true);
        setForm({ ...initialAdmissionForm });
        onSubmitted?.();
      } else {
        const validationMessage = data.errors ? Object.values(data.errors).flat().join(' ') : '';
        setError(validationMessage || data.message || 'Submission failed. Please try again.');
      }
    } catch {
      setError('Network error. Please check the backend connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitAnother = () => {
    setSuccess(false);
    setError('');
  };

  return (
    <section style={s.admissionPanel}>
      <div style={s.admissionGlowOne} />
      <div style={s.admissionGlowTwo} />
      <div style={s.admissionInner}>
        <div style={s.admissionHeader}>
          <div style={s.admissionTag}>Admissions 2025-26</div>
          <h2 style={s.admissionTitle}>
            Enroll Your <span style={s.admissionTitleAccent}>Little Star</span> Today
          </h2>
          <p style={s.admissionDesc}>
            Add a new admission application directly from the admin overview.
          </p>
        </div>

        <div style={s.admissionFormWrap}>
          {success ? (
            <div style={s.formSuccess}>
              <span style={s.successIcon}>OK</span>
              <h3 style={s.successTitle}>Application Submitted!</h3>
              <p style={s.successText}>The new admission record has been saved successfully.</p>
              <button type="button" style={s.successBtn} onClick={submitAnother}>Submit Another</button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <h3 style={s.formSectionTitle}>Child's Information</h3>
              <div style={s.admissionFormRow}>
                <div style={s.admissionFormGroup}>
                  <label style={s.admissionLabel}>Child's Full Name *</label>
                  <input style={s.admissionInput} name="child_name" placeholder="Enter child's name" value={form.child_name} onChange={handle} required />
                </div>
                <div style={s.admissionFormGroup}>
                  <label style={s.admissionLabel}>Date of Birth *</label>
                  <input style={s.admissionInput} type="date" name="dob" value={form.dob} onChange={handle} required />
                </div>
              </div>
              <div style={s.admissionFormRow}>
                <div style={s.admissionFormGroup}>
                  <label style={s.admissionLabel}>Gender *</label>
                  <select style={s.admissionInput} name="gender" value={form.gender} onChange={handle} required>
                    <option value="">Select Gender</option>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
                <div style={s.admissionFormGroup}>
                  <label style={s.admissionLabel}>Program Applying For *</label>
                  <select style={s.admissionInput} name="program" value={form.program} onChange={handle} required>
                    <option value="">Select Program</option>
                    <option>Play Group (2+ yrs)</option>
                    <option>Pre KG (3+ yrs)</option>
                    <option>LKG (4+ yrs)</option>
                    <option>UKG (5+ yrs)</option>
                  </select>
                </div>
              </div>

              <h3 style={{ ...s.formSectionTitle, marginTop: 28 }}>Parent / Guardian Information</h3>
              <div style={s.admissionFormRow}>
                <div style={s.admissionFormGroup}>
                  <label style={s.admissionLabel}>Parent/Guardian Name *</label>
                  <input style={s.admissionInput} name="parent_name" placeholder="Full name" value={form.parent_name} onChange={handle} required />
                </div>
                <div style={s.admissionFormGroup}>
                  <label style={s.admissionLabel}>Relation to Child *</label>
                  <select style={s.admissionInput} name="relation" value={form.relation} onChange={handle} required>
                    <option value="">Select Relation</option>
                    <option>Father</option>
                    <option>Mother</option>
                    <option>Guardian</option>
                  </select>
                </div>
              </div>
              <div style={s.admissionFormRow}>
                <div style={s.admissionFormGroup}>
                  <label style={s.admissionLabel}>Phone Number *</label>
                  <input style={s.admissionInput} name="phone" type="tel" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={handle} required />
                </div>
                <div style={s.admissionFormGroup}>
                  <label style={s.admissionLabel}>Email Address</label>
                  <input style={s.admissionInput} name="email" type="email" placeholder="email@example.com" value={form.email} onChange={handle} />
                </div>
              </div>
              <div style={s.admissionFormRow}>
                <div style={{ ...s.admissionFormGroup, ...s.admissionFull }}>
                  <label style={s.admissionLabel}>Home Address *</label>
                  <input style={s.admissionInput} name="address" placeholder="Full address" value={form.address} onChange={handle} required />
                </div>
              </div>
              <div style={s.admissionFormRow}>
                <div style={s.admissionFormGroup}>
                  <label style={s.admissionLabel}>Previous School (if any)</label>
                  <input style={s.admissionInput} name="previous_school" placeholder="School name" value={form.previous_school} onChange={handle} />
                </div>
                <div style={s.admissionFormGroup}>
                  <label style={s.admissionLabel}>Additional Message</label>
                  <input style={s.admissionInput} name="message" placeholder="Any special requirements?" value={form.message} onChange={handle} />
                </div>
              </div>

              {error && <div style={s.formError}>{error}</div>}

              <button style={{ ...s.formSubmit, ...(loading ? s.formSubmitDisabled : {}) }} type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Admission Application'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function Dashboard({ token, admin, logout }) {
  const [tab, setTab] = useState('overview');
  const [admissions, setAdmissions] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [viewItem, setViewItem] = useState(null);

  const headers = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [aRes, eRes, stRes] = await Promise.all([
        fetch(`${API}/admin/admissions`, { headers }),
        fetch(`${API}/admin/enquiries`, { headers }),
        fetch(`${API}/admin/stats`, { headers }),
      ]);
      if ([aRes.status, eRes.status, stRes.status].some(status => status === 401)) {
        logout();
        return;
      }
      const [a, e, st] = await Promise.all([aRes.json(), eRes.json(), stRes.json()]);
      setAdmissions(Array.isArray(a.data) ? a.data : (Array.isArray(a) ? a : []));
      setEnquiries(Array.isArray(e.data) ? e.data : (Array.isArray(e) ? e : []));
      setStats(st);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const exportExcel = (data, name) => {
    if (!window.XLSX) { alert('XLSX library not loaded yet. Try again.'); return; }
    const ws = window.XLSX.utils.json_to_sheet(data);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, name);
    window.XLSX.writeFile(wb, `${name}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const deleteRecord = async (type, id) => {
    if (!confirm('Delete this record permanently?')) return;
    await fetch(`${API}/admin/${type}/${id}`, { method: 'DELETE', headers });
    fetchAll();
  };

  const fAdmissions = admissions.filter(a =>
    (!search || (a.child_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.parent_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.phone || '').includes(search)) &&
    (!filterProgram || a.program === filterProgram)
  );

  const fEnquiries = enquiries.filter(e =>
    !search || (e.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.phone || '').includes(search)
  );

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'admissions', label: 'Admissions' },
    { id: 'enquiries', label: 'Enquiries' },
  ];

  const statCards = [
    { label: 'Total Admissions', value: admissions.length, color: '#FF6B35' },
    { label: 'Total Enquiries', value: enquiries.length, color: '#4ECDC4' },
    { label: 'This Month', value: stats?.this_month || 0, color: '#FFD93D' },
    { label: 'Pending Review', value: stats?.pending || 0, color: '#A78BFA' },
  ];

  return (
    <div style={s.wrap}>
      <aside style={s.sidebar}>
        <div style={s.sideTop}>
          <span style={{ fontSize: 32 }}>VT</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'white' }}>VT Kindergarten</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Admin Panel</div>
          </div>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(n => (
            <button key={n.id}
              style={{ ...s.navBtn, ...(tab === n.id ? s.navActive : {}) }}
              onClick={() => { setTab(n.id); setSearch(''); setFilterProgram(''); }}>
              {n.label}
            </button>
          ))}
        </nav>
        <div style={{ flex: 1 }} />
        <div style={s.adminBox}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'white' }}>{admin?.name || 'Admin'}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{admin?.email}</div>
          </div>
        </div>
        <button style={s.logoutBtn} onClick={logout}>Logout</button>
      </aside>

      <main style={s.main}>
        <div style={s.topBar}>
          <h1 style={s.pageH}>
            {tab === 'overview' ? 'Dashboard Overview' : tab === 'admissions' ? 'Admission Applications' : 'Enquiry Messages'}
          </h1>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={s.refreshBtn} onClick={fetchAll}>Refresh</button>
            {tab === 'admissions' && (
              <button style={s.exportBtn} onClick={() => exportExcel(fAdmissions, 'Admissions')}>
                Export Excel
              </button>
            )}
            {tab === 'enquiries' && (
              <button style={s.exportBtn} onClick={() => exportExcel(fEnquiries, 'Enquiries')}>
                Export Excel
              </button>
            )}
          </div>
        </div>

        {loading && <div style={s.loadingBar}>Loading data from server...</div>}

        {tab === 'overview' && (
          <>
            <div style={s.statsRow}>
              {statCards.map((c, i) => (
                <div key={i} style={{ ...s.statCard, borderTop: `4px solid ${c.color}` }}>
                  <div style={{ ...s.statNum, color: c.color }}>{c.value}</div>
                  <div style={s.statLbl}>{c.label}</div>
                </div>
              ))}
            </div>
            <AdmissionApplicationBox onSubmitted={fetchAll} />
          </>
        )}

        {tab === 'admissions' && (
          <div style={s.panel}>
            <div style={s.filterRow}>
              <input style={s.searchInp} placeholder="Search name / phone..."
                value={search} onChange={e => setSearch(e.target.value)} />
              <select style={s.selInp} value={filterProgram} onChange={e => setFilterProgram(e.target.value)}>
                <option value="">All Programs</option>
                <option>Play Group (2+ yrs)</option>
                <option>Pre KG (3+ yrs)</option>
                <option>LKG (4+ yrs)</option>
                <option>UKG (5+ yrs)</option>
              </select>
              <span style={s.cntBadge}>{fAdmissions.length} records</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={s.tbl}>
                <thead><tr>
                  {['#', 'Child Name', 'DOB', 'Gender', 'Program', 'Parent', 'Phone', 'Email', 'Address', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {fAdmissions.map((a, i) => (
                    <tr key={i} style={s.tr}>
                      <td style={s.td}>{i + 1}</td>
                      <td style={{ ...s.td, fontWeight: 700, whiteSpace: 'nowrap' }}>{a.child_name}</td>
                      <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{a.dob}</td>
                      <td style={s.td}>{a.gender}</td>
                      <td style={{ ...s.td, whiteSpace: 'nowrap' }}><span style={s.badge}>{a.program}</span></td>
                      <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{a.parent_name}</td>
                      <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{a.phone}</td>
                      <td style={s.td}>{a.email || '-'}</td>
                      <td style={{ ...s.td, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.address}</td>
                      <td style={s.td}><span style={{ ...s.badge, background: a.status === 'approved' ? 'rgba(52,211,153,0.15)' : a.status === 'rejected' ? 'rgba(239,68,68,0.12)' : 'rgba(255,107,53,0.1)', color: a.status === 'approved' ? '#059669' : a.status === 'rejected' ? '#dc2626' : '#FF6B35' }}>{a.status || 'pending'}</span></td>
                      <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{(a.created_at || '').slice(0, 10)}</td>
                      <td style={{ ...s.td, whiteSpace: 'nowrap' }}>
                        <button style={s.viewBtn} title="View" onClick={() => setViewItem({ type: 'admission', data: a })}>View</button>
                        <button style={s.delBtn} title="Delete" onClick={() => deleteRecord('admissions', a.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {fAdmissions.length === 0 && (
                    <tr><td colSpan={12} style={{ ...s.td, textAlign: 'center', padding: 40, color: '#aaa' }}>No admissions found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'enquiries' && (
          <div style={s.panel}>
            <div style={s.filterRow}>
              <input style={s.searchInp} placeholder="Search name / phone..."
                value={search} onChange={e => setSearch(e.target.value)} />
              <span style={s.cntBadge}>{fEnquiries.length} records</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={s.tbl}>
                <thead><tr>
                  {['#', 'Name', 'Phone', 'Email', 'Program', 'Message', 'Date', 'Actions'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {fEnquiries.map((e, i) => (
                    <tr key={i} style={s.tr}>
                      <td style={s.td}>{i + 1}</td>
                      <td style={{ ...s.td, fontWeight: 700, whiteSpace: 'nowrap' }}>{e.name}</td>
                      <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{e.phone}</td>
                      <td style={s.td}>{e.email || '-'}</td>
                      <td style={s.td}>{e.program || '-'}</td>
                      <td style={{ ...s.td, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.message}</td>
                      <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{(e.created_at || '').slice(0, 10)}</td>
                      <td style={{ ...s.td, whiteSpace: 'nowrap' }}>
                        <button style={s.viewBtn} title="View" onClick={() => setViewItem({ type: 'enquiry', data: e })}>View</button>
                        <button style={s.delBtn} title="Delete" onClick={() => deleteRecord('enquiries', e.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {fEnquiries.length === 0 && (
                    <tr><td colSpan={8} style={{ ...s.td, textAlign: 'center', padding: 40, color: '#aaa' }}>No enquiries found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {viewItem && (
        <div style={s.overlay} onClick={() => setViewItem(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'sans-serif', fontSize: 22, margin: 0 }}>
                {viewItem.type === 'admission' ? 'Admission Details' : 'Enquiry Details'}
              </h2>
              <button style={s.closeX} onClick={() => setViewItem(null)}>Close</button>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {Object.entries(viewItem.data)
                .filter(([k]) => k !== 'id' && k !== 'updated_at')
                .map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 16, borderBottom: '1px solid #f0f0f0', paddingBottom: 10 }}>
                    <span style={{ fontWeight: 800, fontSize: 11, color: '#888', minWidth: 140, textTransform: 'uppercase', letterSpacing: '0.5px', paddingTop: 2 }}>
                      {k.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: 15, color: '#333', flex: 1, wordBreak: 'break-word' }}>{String(v) || '-'}</span>
                  </div>
                ))}
            </div>
            <button style={s.closeBtn} onClick={() => setViewItem(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminApp() {
  const { token, admin, login, logout, isAuth } = useAuth();
  useEffect(() => {
    if (!window.XLSX) {
      const sc = document.createElement('script');
      sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      document.head.appendChild(sc);
    }
  }, []);
  if (!isAuth) return <LoginPage onLogin={login} />;
  return <Dashboard token={token} admin={admin} logout={logout} />;
}

const s = {
  loginWrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#1a1a2e,#16213e)', fontFamily: "'Nunito',sans-serif" },
  loginCard: { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: '48px 40px', width: 420, maxWidth: '95vw' },
  fg: { marginBottom: 20 },
  label: { display: 'block', marginBottom: 8, fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  inp: { width: '100%', background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '14px 18px', color: 'white', fontSize: 15, fontFamily: "'Nunito',sans-serif", outline: 'none', boxSizing: 'border-box' },
  err: { background: 'rgba(255,0,0,0.15)', border: '1px solid rgba(255,0,0,0.3)', borderRadius: 10, padding: '12px 16px', color: '#ff8888', marginBottom: 16, fontSize: 14 },
  loginBtn: { width: '100%', background: 'linear-gradient(135deg,#FF6B35,#FFD93D)', border: 'none', borderRadius: 12, padding: 16, color: 'white', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" },
  wrap: { display: 'flex', minHeight: '100vh', fontFamily: "'Nunito',sans-serif", background: '#f0f2f5' },
  sidebar: { width: 260, background: 'linear-gradient(180deg,#1a1a2e,#16213e)', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 8, position: 'fixed', top: 0, left: 0, bottom: 0, overflowY: 'auto', zIndex: 100 },
  sideTop: { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 8px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 },
  navBtn: { display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', background: 'transparent', border: 'none', borderRadius: 12, color: 'rgba(255,255,255,0.65)', fontFamily: "'Nunito',sans-serif", fontSize: 15, fontWeight: 700, cursor: 'pointer', textAlign: 'left', width: '100%' },
  navActive: { background: 'rgba(255,107,53,0.18)', color: 'white', borderLeft: '3px solid #FF6B35' },
  adminBox: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 8px', borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 8 },
  logoutBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 16px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: 14 },
  main: { flex: 1, marginLeft: 260, padding: 32, overflowX: 'auto' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 },
  pageH: { fontSize: 26, fontWeight: 900, color: '#1a1a2e', margin: 0 },
  refreshBtn: { background: 'white', border: '1.5px solid #e0e0e0', borderRadius: 10, padding: '10px 18px', cursor: 'pointer', fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: 14 },
  exportBtn: { background: 'linear-gradient(135deg,#FF6B35,#FFD93D)', border: 'none', borderRadius: 10, padding: '10px 18px', color: 'white', fontFamily: "'Nunito',sans-serif", fontWeight: 700, cursor: 'pointer', fontSize: 14 },
  loadingBar: { background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 10, padding: '12px 20px', marginBottom: 20, fontWeight: 700 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 28 },
  statCard: { background: 'white', borderRadius: 16, padding: '28px 20px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' },
  statNum: { fontSize: 40, fontWeight: 900, margin: '8px 0 4px' },
  statLbl: { color: '#888', fontWeight: 700, fontSize: 13 },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 },
  panel: { background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: 24 },
  panelH: { fontSize: 17, fontWeight: 800, marginBottom: 18, color: '#1a1a2e', margin: '0 0 18px' },
  admissionPanel: { position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg,#1a1a2e,#16213e)', borderRadius: 16, padding: '46px 32px', boxShadow: '0 14px 40px rgba(26,26,46,0.18)', marginBottom: 24 },
  admissionGlowOne: { position: 'absolute', top: -180, right: -180, width: 500, height: 500, background: 'radial-gradient(circle, rgba(255,107,53,0.16), transparent 70%)', borderRadius: '50%' },
  admissionGlowTwo: { position: 'absolute', left: -160, bottom: -220, width: 460, height: 460, background: 'radial-gradient(circle, rgba(78,205,196,0.13), transparent 72%)', borderRadius: '50%' },
  admissionInner: { position: 'relative', zIndex: 1 },
  admissionHeader: { textAlign: 'center', maxWidth: 680, margin: '0 auto 28px' },
  admissionTag: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,107,53,0.2)', color: '#FF6B35', borderRadius: 50, padding: '8px 18px', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 },
  admissionTitle: { fontFamily: 'sans-serif', fontSize: 32, lineHeight: 1.15, color: 'white', margin: '0 0 12px', fontWeight: 900 },
  admissionTitleAccent: { color: '#FFD93D' },
  admissionDesc: { color: 'rgba(255,255,255,0.62)', fontSize: 15, lineHeight: 1.6, margin: 0 },
  admissionFormWrap: { maxWidth: 820, margin: '0 auto', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 36 },
  formSectionTitle: { fontFamily: 'sans-serif', fontSize: 22, color: 'white', margin: '0 0 22px', fontWeight: 900 },
  admissionFormRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 20, marginBottom: 20 },
  admissionFormGroup: { display: 'flex', flexDirection: 'column', gap: 8 },
  admissionFull: { gridColumn: '1 / -1' },
  admissionLabel: { fontWeight: 800, fontSize: 14, color: 'rgba(255,255,255,0.82)' },
  admissionInput: { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '14px 18px', color: 'white', fontFamily: "'Nunito',sans-serif", fontSize: 15, outline: 'none', colorScheme: 'dark' },
  formError: { background: 'rgba(255,0,0,0.15)', border: '1px solid rgba(255,0,0,0.3)', borderRadius: 10, padding: '12px 16px', color: '#ff9a9a', marginBottom: 16, fontSize: 14, fontWeight: 700 },
  formSubmit: { width: '100%', background: 'linear-gradient(135deg,#FF6B35,#FFD93D)', border: 'none', padding: 18, borderRadius: 12, color: 'white', fontFamily: "'Nunito',sans-serif", fontSize: 17, fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 28px rgba(255,107,53,0.28)' },
  formSubmitDisabled: { cursor: 'not-allowed', opacity: 0.65 },
  formSuccess: { textAlign: 'center', padding: '48px 20px' },
  successIcon: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 76, height: 76, borderRadius: '50%', background: 'linear-gradient(135deg,#34d399,#4ECDC4)', color: 'white', fontWeight: 900, fontSize: 22, marginBottom: 22, boxShadow: '0 12px 32px rgba(78,205,196,0.28)' },
  successTitle: { fontFamily: 'sans-serif', fontSize: 30, color: 'white', margin: '0 0 12px', fontWeight: 900 },
  successText: { color: 'rgba(255,255,255,0.72)', fontSize: 16, margin: 0 },
  successBtn: { marginTop: 24, background: 'linear-gradient(135deg,#FF6B35,#FFD93D)', border: 'none', borderRadius: 12, padding: '13px 22px', color: 'white', fontFamily: "'Nunito',sans-serif", fontWeight: 900, cursor: 'pointer', fontSize: 15 },
  filterRow: { display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' },
  searchInp: { flex: 1, minWidth: 200, padding: '11px 16px', border: '1.5px solid #e0e0e0', borderRadius: 10, fontSize: 14, fontFamily: "'Nunito',sans-serif", outline: 'none' },
  selInp: { padding: '11px 16px', border: '1.5px solid #e0e0e0', borderRadius: 10, fontSize: 14, fontFamily: "'Nunito',sans-serif", outline: 'none' },
  cntBadge: { background: '#f0f2f5', padding: '8px 16px', borderRadius: 50, fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' },
  tbl: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#f8f9fa', padding: '11px 14px', textAlign: 'left', fontWeight: 800, fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f5f5f5' },
  td: { padding: '13px 14px', fontSize: 14, color: '#333' },
  badge: { background: 'rgba(255,107,53,0.1)', color: '#FF6B35', padding: '3px 10px', borderRadius: 50, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' },
  viewBtn: { background: 'rgba(78,205,196,0.12)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', marginRight: 6, fontSize: 14 },
  delBtn: { background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 14 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  modal: { background: 'white', borderRadius: 20, padding: '36px 40px', maxWidth: 600, width: '90vw', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  closeX: { background: '#f0f0f0', border: 'none', borderRadius: 8, width: 60, height: 36, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  closeBtn: { marginTop: 24, background: 'linear-gradient(135deg,#FF6B35,#FFD93D)', border: 'none', borderRadius: 10, padding: '12px 28px', color: 'white', fontWeight: 800, cursor: 'pointer', fontSize: 15 },
};
