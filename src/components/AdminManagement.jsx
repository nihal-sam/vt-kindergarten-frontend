import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchRegisteredAdmins,
  approveAdmin,
  rejectAdmin,
  deleteAdmin,
  registerNewAdmin,
  SUPER_ADMIN_CREDENTIALS,
} from '../utils/adminAuth';

export default function AdminManagement({ currentAdmin, onLogout }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [banner, setBanner] = useState({ type: '', message: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    autoApprove: true,
  });
  const [addLoading, setAddLoading] = useState(false);

  // Load all admin accounts
  const loadAdmins = async () => {
    setLoading(true);
    try {
      const list = await fetchRegisteredAdmins();
      setAdmins(list);
    } catch (e) {
      console.error('Error loading admins:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const showNotification = (type, message) => {
    setBanner({ type, message });
    setTimeout(() => setBanner({ type: '', message: '' }), 6000);
  };

  // Actions
  const handleApprove = async (admin) => {
    const res = await approveAdmin(admin.id, currentAdmin?.email || SUPER_ADMIN_CREDENTIALS.email);
    if (res.success) {
      showNotification(
        'success',
        `✅ Admin "${admin.name}" (${admin.email}) has been APPROVED! They can now log in with Phone OTP verification.`
      );
      loadAdmins();
    } else {
      showNotification('error', `Failed to approve admin: ${res.error}`);
    }
  };

  const handleReject = async (admin) => {
    if (!confirm(`Are you sure you want to reject admin registration for "${admin.name}" (${admin.email})?`)) return;
    const res = await rejectAdmin(admin.id, currentAdmin?.email || SUPER_ADMIN_CREDENTIALS.email);
    if (res.success) {
      showNotification('info', `Admin "${admin.name}" registration was rejected.`);
      loadAdmins();
    } else {
      showNotification('error', `Failed to reject admin: ${res.error}`);
    }
  };

  const handleDelete = async (admin) => {
    if (!confirm(`Permanently delete admin account "${admin.name}" (${admin.email})? This action cannot be undone.`)) return;
    const res = await deleteAdmin(admin.id);
    if (res.success) {
      showNotification('info', `Admin account "${admin.name}" deleted.`);
      loadAdmins();
    } else {
      showNotification('error', `Failed to delete admin: ${res.error}`);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!addForm.name || !addForm.email || !addForm.phone || !addForm.password) {
      alert('Please fill out all fields.');
      return;
    }
    setAddLoading(true);
    try {
      const res = await registerNewAdmin({
        name: addForm.name,
        email: addForm.email,
        phone: addForm.phone,
        password: addForm.password,
      });

      if (!res.success) {
        alert(res.error || 'Failed to create admin.');
        return;
      }

      if (addForm.autoApprove && res.admin?.id) {
        await approveAdmin(res.admin.id, currentAdmin?.email || SUPER_ADMIN_CREDENTIALS.email);
      }

      showNotification('success', `Admin "${addForm.name}" created successfully!`);
      setShowAddModal(false);
      setAddForm({ name: '', email: '', phone: '', password: '', autoApprove: true });
      loadAdmins();
    } catch (err) {
      alert('Error creating admin.');
    } finally {
      setAddLoading(false);
    }
  };

  // Stats
  const pendingCount = useMemo(() => admins.filter((a) => a.status === 'pending').length, [admins]);
  const approvedCount = useMemo(() => admins.filter((a) => a.status === 'approved').length, [admins]);
  const rejectedCount = useMemo(() => admins.filter((a) => a.status === 'rejected').length, [admins]);

  // Filtered List
  const filteredAdmins = useMemo(() => {
    return admins.filter((a) => {
      const matchSearch =
        !search ||
        (a.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.phone || '').includes(search);

      const matchStatus = statusFilter === 'all' || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [admins, search, statusFilter]);

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Banner Notifications */}
      {banner.message && (
        <div
          style={{
            padding: '14px 20px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: banner.type === 'success' ? '#ECFDF5' : banner.type === 'error' ? '#FEF2F2' : '#F0F9FF',
            color: banner.type === 'success' ? '#065F46' : banner.type === 'error' ? '#991B1B' : '#0369A1',
            border: `1.5px solid ${banner.type === 'success' ? '#A7F3D0' : banner.type === 'error' ? '#FECACA' : '#BAE6FD'}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          <span>{banner.message}</span>
          <button
            type="button"
            onClick={() => setBanner({ type: '', message: '' })}
            style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', fontWeight: 800 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner & Super Admin Status */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
          borderRadius: 18,
          padding: '24px 28px',
          color: '#FFFFFF',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          boxShadow: '0 12px 32px rgba(30, 27, 75, 0.25)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 24 }}>👑</span>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>
              Super Admin Control Panel: Admin Approvals
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: 'rgba(255, 255, 255, 0.8)' }}>
            Logged in as Master Super Admin: <strong>superadmin@vtkindergarten.com</strong>. Review and confirm new admin registrations.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            style={{
              background: '#FF6B35',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 14px rgba(255, 107, 53, 0.35)',
            }}
          >
            <span>➕</span> Add Admin Directly
          </button>
          <button
            type="button"
            onClick={loadAdmins}
            disabled={loading}
            style={{
              background: 'rgba(255,255,255,0.12)',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.25)',
              padding: '10px 16px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {loading ? '⏳ Refreshing...' : '🔄 Refresh List'}
          </button>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#FECACA',
                border: '1.5px solid rgba(239, 68, 68, 0.4)',
                padding: '10px 16px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s ease',
              }}
              title="Sign Out of Super Admin Console"
            >
              <span>🚪</span> Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {/* Pending Approvals (Highlight Card) */}
        <div
          style={{
            background: pendingCount > 0 ? '#FFFBEB' : '#FFFFFF',
            border: `2px solid ${pendingCount > 0 ? '#F59E0B' : '#E2E8F0'}`,
            borderRadius: 14,
            padding: '18px 20px',
            boxShadow: pendingCount > 0 ? '0 8px 20px rgba(245, 158, 11, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>Pending Super Admin Approval</span>
            <span style={{ fontSize: 20 }}>⏳</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#B45309', marginTop: 8 }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: 11.5, color: '#78350F', marginTop: 4 }}>
            {pendingCount > 0 ? '⚠️ Action needed: review & confirm registrations below' : 'All registrations reviewed'}
          </div>
        </div>

        {/* Approved Admins */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#065F46' }}>Active Approved Admins</span>
            <span style={{ fontSize: 20 }}>✅</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#059669', marginTop: 8 }}>
            {approvedCount}
          </div>
          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>
            Permitted to log in with 2FA Phone OTP
          </div>
        </div>

        {/* Rejected Admins */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#991B1B' }}>Rejected Registrations</span>
            <span style={{ fontSize: 20 }}>❌</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#DC2626', marginTop: 8 }}>
            {rejectedCount}
          </div>
          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>
            Access blocked by Super Admin
          </div>
        </div>

        {/* Total Admin Records */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>Total Admin Accounts</span>
            <span style={{ fontSize: 20 }}>👥</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#1E293B', marginTop: 8 }}>
            {admins.length + 1} {/* +1 for Master Super Admin */}
          </div>
          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>
            Includes 1 Master Super Admin
          </div>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="vta-panel">
        
        {/* Table Title Bar */}
        <div className="vta-table-title-bar" style={{ background: 'linear-gradient(90deg, #F8FAFC 0%, #FFFFFF 100%)', borderBottom: '1px solid #E2E8F0' }}>
          <div className="vta-table-title-bar-left">
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🛡️ Registered Administrator Accounts</span>
              {pendingCount > 0 && (
                <span className="vta-badge-pill vta-badge-orange" style={{ animation: 'pulse 2s infinite' }}>
                  {pendingCount} Pending Approval
                </span>
              )}
            </h3>
          </div>
          <div className="vta-sub-text" style={{ fontWeight: 700, color: '#64748B' }}>
            Phone Number OTP Verified Registrations
          </div>
        </div>

        {/* Filters Bar */}
        <div className="vta-panel-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div className="vta-filters-group" style={{ flexWrap: 'wrap', gap: 10 }}>
            <div className="vta-search-box">
              <span className="vta-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search admin name, email, or mobile..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter by Status */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { id: 'all', label: 'All Accounts' },
                { id: 'pending', label: `Pending (${pendingCount})` },
                { id: 'approved', label: `Approved (${approvedCount})` },
                { id: 'rejected', label: `Rejected (${rejectedCount})` },
              ].map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setStatusFilter(btn.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: statusFilter === btn.id ? '#1E293B' : '#F1F5F9',
                    color: statusFilter === btn.id ? '#FFFFFF' : '#475569',
                    border: '1px solid #CBD5E1',
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          <span className="vta-count-pill">
            Showing {filteredAdmins.length + 1} admin accounts
          </span>
        </div>

        {/* Admins Table */}
        <div className="vta-table-scroll">
          <table className="vta-table">
            <thead className="vta-thead-admissions">
              <tr>
                <th>#</th>
                <th>Administrator</th>
                <th>Contact Details</th>
                <th>Registration Date</th>
                <th>Approval Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              
              {/* Row 1: Master Super Admin (Immutable) */}
              <tr style={{ background: '#FAF5FF' }}>
                <td style={{ fontWeight: 800, color: '#7C3AED' }}>👑</td>
                <td>
                  <div className="vta-name-bold" style={{ color: '#5B21B6', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{SUPER_ADMIN_CREDENTIALS.name}</span>
                    <span className="vta-badge-pill vta-badge-purple" style={{ fontSize: 10, padding: '2px 8px' }}>
                      SUPER ADMIN
                    </span>
                  </div>
                  <div className="vta-sub-text">{SUPER_ADMIN_CREDENTIALS.email}</div>
                </td>
                <td>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1E293B' }}>📞 +91 {SUPER_ADMIN_CREDENTIALS.phone}</div>
                  <span className="vta-badge-pill vta-badge-green" style={{ fontSize: 10, padding: '1px 6px' }}>Master Phone Verified</span>
                </td>
                <td>
                  <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Permanent System Account</span>
                </td>
                <td>
                  <span className="vta-badge-pill vta-badge-purple" style={{ fontWeight: 800 }}>
                    👑 MASTER SUPER ADMIN
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: '#7C3AED' }}>
                    Full Super Admin Access
                  </span>
                </td>
              </tr>

              {/* Registered Admins Rows */}
              {filteredAdmins.map((adm, idx) => (
                <tr
                  key={adm.id}
                  style={{
                    background: adm.status === 'pending' ? '#FFFBEB' : '#FFFFFF',
                    transition: 'background 0.2s',
                  }}
                >
                  <td style={{ fontWeight: 700, color: '#94A3B8' }}>{idx + 1}</td>

                  {/* Name & Role */}
                  <td>
                    <div className="vta-name-bold" style={{ fontSize: 13.5 }}>{adm.name}</div>
                    <div className="vta-sub-text" style={{ fontSize: 12 }}>{adm.email}</div>
                  </td>

                  {/* Phone & Verification */}
                  <td>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>
                      📞 +91 {adm.phone || 'No phone'}
                    </div>
                    {adm.phone_verified ? (
                      <span className="vta-badge-pill vta-badge-green" style={{ fontSize: 10, padding: '1px 6px' }}>
                        ✅ Phone OTP Verified
                      </span>
                    ) : (
                      <span className="vta-badge-pill vta-badge-orange" style={{ fontSize: 10, padding: '1px 6px' }}>
                        Unverified Phone
                      </span>
                    )}
                  </td>

                  {/* Registration Date */}
                  <td>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                      {adm.created_at ? new Date(adm.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'}
                    </div>
                    <div className="vta-sub-text" style={{ fontSize: 11 }}>
                      {adm.created_at ? new Date(adm.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </td>

                  {/* Status */}
                  <td>
                    {adm.status === 'pending' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                        <span className="vta-badge-pill vta-badge-orange" style={{ fontWeight: 800, fontSize: 11 }}>
                          ⏳ Pending Super Admin Approval
                        </span>
                        <span style={{ fontSize: 11, color: '#B45309', fontWeight: 600 }}>
                          Requires Super Admin confirmation
                        </span>
                      </div>
                    )}
                    {adm.status === 'approved' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
                        <span className="vta-badge-pill vta-badge-green" style={{ fontWeight: 800, fontSize: 11 }}>
                          ✅ Approved & Active
                        </span>
                        {adm.approved_at && (
                          <span style={{ fontSize: 10.5, color: '#64748B' }}>
                            Approved on {new Date(adm.approved_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </span>
                        )}
                      </div>
                    )}
                    {adm.status === 'rejected' && (
                      <span className="vta-badge-pill vta-badge-red" style={{ fontWeight: 800, fontSize: 11 }}>
                        ❌ Rejected
                      </span>
                    )}
                  </td>

                  {/* Action Buttons */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* Approve Button */}
                      {adm.status !== 'approved' && (
                        <button
                          type="button"
                          onClick={() => handleApprove(adm)}
                          title="Confirm and Approve Admin"
                          style={{
                            background: '#059669',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            boxShadow: '0 2px 6px rgba(5,150,105,0.25)',
                          }}
                        >
                          ✅ Approve
                        </button>
                      )}

                      {/* Reject / Suspend */}
                      {adm.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleReject(adm)}
                          title="Reject Registration"
                          style={{
                            background: '#F1F5F9',
                            color: '#DC2626',
                            border: '1px solid #FECACA',
                            padding: '6px 12px',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          ❌ Reject
                        </button>
                      )}

                      {adm.status === 'approved' && (
                        <button
                          type="button"
                          onClick={() => handleReject(adm)}
                          title="Suspend Admin Access"
                          style={{
                            background: '#F1F5F9',
                            color: '#B45309',
                            border: '1px solid #FDE68A',
                            padding: '5px 10px',
                            borderRadius: 8,
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          ⏸️ Suspend
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDelete(adm)}
                        title="Delete Admin Account"
                        style={{
                          background: '#FEF2F2',
                          color: '#EF4444',
                          border: '1px solid #FEE2E2',
                          padding: '5px 8px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredAdmins.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                    No other registered admins found. When new admins register on the login page, their accounts will appear here for Super Admin approval.
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>

      </div>

      {/* Add Admin Modal (Super Admin Direct Invite) */}
      {showAddModal && (
        <div
          className="vta-modal-backdrop"
          onClick={() => setShowAddModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            className="vta-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: 18,
              maxWidth: 480,
              width: '100%',
              padding: '28px 32px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                ➕ Create Admin Account Directly
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdmin}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Admin Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Anand Kumar"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    required
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 14 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="admin@vtkindergarten.com"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    required
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 14 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Phone Number (10 digits)
                  </label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    required
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 14 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    required
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 14 }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <input
                    type="checkbox"
                    id="autoApprove"
                    checked={addForm.autoApprove}
                    onChange={(e) => setAddForm({ ...addForm, autoApprove: e.target.checked })}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <label htmlFor="autoApprove" style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                    Auto-Approve this admin immediately (Super Admin Pre-approval)
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addLoading}
                    style={{ background: '#FF6B35', color: '#FFFFFF', border: 'none', padding: '10px 22px', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
                  >
                    {addLoading ? 'Creating...' : 'Create Admin'}
                  </button>
                </div>

              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
