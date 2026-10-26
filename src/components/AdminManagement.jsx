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
  const [statusFilter, setStatusFilter] = useState('pending'); // default to pending so new registrations are front & center
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

  // Modal box for Approve / Reject / Delete confirmation
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: '', // 'approve' | 'reject' | 'delete'
    admin: null,
    loading: false,
  });

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

  // Execute modal action when Super Admin confirms "Yes"
  const handleConfirmAction = async () => {
    const { type, admin } = confirmModal;
    if (!admin) return;

    setConfirmModal((prev) => ({ ...prev, loading: true }));

    try {
      if (type === 'approve') {
        const res = await approveAdmin(admin.id, currentAdmin?.email || SUPER_ADMIN_CREDENTIALS.email);
        if (res.success) {
          showNotification(
            'success',
            `✅ Admin "${admin.name}" (${admin.email}) has been APPROVED! They can now log in directly.`
          );
          await loadAdmins();
        } else {
          showNotification('error', `Failed to approve admin: ${res.error}`);
        }
      } else if (type === 'reject') {
        const res = await rejectAdmin(admin.id, currentAdmin?.email || SUPER_ADMIN_CREDENTIALS.email);
        if (res.success) {
          showNotification('info', `Admin "${admin.name}" has been moved to the Rejected list.`);
          await loadAdmins();
        } else {
          showNotification('error', `Failed to reject admin: ${res.error}`);
        }
      } else if (type === 'delete') {
        const res = await deleteAdmin(admin.id);
        if (res.success) {
          showNotification('info', `Admin account "${admin.name}" deleted.`);
          await loadAdmins();
        } else {
          showNotification('error', `Failed to delete admin: ${res.error}`);
        }
      }
    } catch (err) {
      showNotification('error', 'Operation failed. Please try again.');
    } finally {
      setConfirmModal({ open: false, type: '', admin: null, loading: false });
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
            Logged in as Master Super Admin: <strong>superadmin@vtkindergarten.com</strong>. Review and confirm new
            admin registrations.
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

      {/* Interactive Stats Cards (Clickable to switch lists) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {/* Pending Approvals Card */}
        <div
          onClick={() => setStatusFilter('pending')}
          style={{
            background: statusFilter === 'pending' ? '#FEF3C7' : pendingCount > 0 ? '#FFFBEB' : '#FFFFFF',
            border: `2.5px solid ${statusFilter === 'pending' ? '#D97706' : pendingCount > 0 ? '#F59E0B' : '#E2E8F0'}`,
            borderRadius: 14,
            padding: '18px 20px',
            cursor: 'pointer',
            boxShadow: statusFilter === 'pending' ? '0 8px 24px rgba(217, 119, 6, 0.25)' : '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#92400E' }}>Pending Super Admin Approval</span>
            <span style={{ fontSize: 20 }}>⏳</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#B45309', marginTop: 8 }}>{pendingCount}</div>
          <div style={{ fontSize: 11.5, color: '#78350F', marginTop: 4, fontWeight: 700 }}>
            {statusFilter === 'pending' ? '👉 Currently Viewing Pending List' : 'Click to view pending registrations'}
          </div>
        </div>

        {/* Approved Admins Card */}
        <div
          onClick={() => setStatusFilter('approved')}
          style={{
            background: statusFilter === 'approved' ? '#ECFDF5' : '#FFFFFF',
            border: `2.5px solid ${statusFilter === 'approved' ? '#059669' : '#E2E8F0'}`,
            borderRadius: 14,
            padding: '18px 20px',
            cursor: 'pointer',
            boxShadow: statusFilter === 'approved' ? '0 8px 24px rgba(5, 150, 105, 0.25)' : '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#065F46' }}>Approved Admins List</span>
            <span style={{ fontSize: 20 }}>✅</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#059669', marginTop: 8 }}>{approvedCount}</div>
          <div style={{ fontSize: 11.5, color: '#065F46', marginTop: 4, fontWeight: 700 }}>
            {statusFilter === 'approved' ? '👉 Currently Viewing Approved List' : 'Click to view approved admins'}
          </div>
        </div>

        {/* Rejected Admins Card */}
        <div
          onClick={() => setStatusFilter('rejected')}
          style={{
            background: statusFilter === 'rejected' ? '#FEF2F2' : '#FFFFFF',
            border: `2.5px solid ${statusFilter === 'rejected' ? '#DC2626' : '#E2E8F0'}`,
            borderRadius: 14,
            padding: '18px 20px',
            cursor: 'pointer',
            boxShadow: statusFilter === 'rejected' ? '0 8px 24px rgba(220, 38, 38, 0.25)' : '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#991B1B' }}>Rejected Registrations List</span>
            <span style={{ fontSize: 20 }}>❌</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#DC2626', marginTop: 8 }}>{rejectedCount}</div>
          <div style={{ fontSize: 11.5, color: '#991B1B', marginTop: 4, fontWeight: 700 }}>
            {statusFilter === 'rejected' ? '👉 Currently Viewing Rejected List' : 'Click to view rejected list'}
          </div>
        </div>

        {/* Total Admin Records Card */}
        <div
          onClick={() => setStatusFilter('all')}
          style={{
            background: statusFilter === 'all' ? '#F1F5F9' : '#FFFFFF',
            border: `2.5px solid ${statusFilter === 'all' ? '#1E293B' : '#E2E8F0'}`,
            borderRadius: 14,
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#475569' }}>All Admin Records</span>
            <span style={{ fontSize: 20 }}>👥</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#1E293B', marginTop: 8 }}>
            {admins.length + 1}
          </div>
          <div style={{ fontSize: 11.5, color: '#475569', marginTop: 4, fontWeight: 700 }}>
            {statusFilter === 'all' ? '👉 Viewing All Admin Accounts' : 'Click to view all accounts'}
          </div>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="vta-panel">
        {/* Table Title Bar */}
        <div
          className="vta-table-title-bar"
          style={{
            background: 'linear-gradient(90deg, #F8FAFC 0%, #FFFFFF 100%)',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          <div className="vta-table-title-bar-left">
            <h3
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: '#0F172A',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>
                {statusFilter === 'pending'
                  ? '⏳ Pending Super Admin Approvals'
                  : statusFilter === 'approved'
                  ? '✅ Approved Administrators'
                  : statusFilter === 'rejected'
                  ? '❌ Rejected Registration List'
                  : '🛡️ All Registered Administrator Accounts'}
              </span>
              {pendingCount > 0 && statusFilter === 'pending' && (
                <span className="vta-badge-pill vta-badge-orange" style={{ animation: 'pulse 2s infinite' }}>
                  {pendingCount} Awaiting Decision
                </span>
              )}
            </h3>
          </div>
          <div className="vta-sub-text" style={{ fontWeight: 700, color: '#64748B' }}>
            Click "Approve" or "Reject" to manage access
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

            {/* Filter by Status Pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { id: 'pending', label: `⏳ Pending (${pendingCount})`, color: '#F59E0B' },
                { id: 'approved', label: `✅ Approved (${approvedCount})`, color: '#10B981' },
                { id: 'rejected', label: `❌ Rejected (${rejectedCount})`, color: '#EF4444' },
                { id: 'all', label: `👥 All (${admins.length})`, color: '#475569' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setStatusFilter(btn.id)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    background: statusFilter === btn.id ? btn.color : '#F1F5F9',
                    color: statusFilter === btn.id ? '#FFFFFF' : '#475569',
                    border: `1.5px solid ${statusFilter === btn.id ? btn.color : '#CBD5E1'}`,
                    boxShadow: statusFilter === btn.id ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          <span className="vta-count-pill">
            Showing {filteredAdmins.length} {statusFilter} accounts
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
              {/* Master Super Admin (Shown in 'all' or 'approved' view) */}
              {(statusFilter === 'all' || statusFilter === 'approved') && (
                <tr style={{ background: '#FAF5FF' }}>
                  <td style={{ fontWeight: 800, color: '#7C3AED' }}>👑</td>
                  <td>
                    <div
                      className="vta-name-bold"
                      style={{ color: '#5B21B6', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <span>{SUPER_ADMIN_CREDENTIALS.name}</span>
                      <span className="vta-badge-pill vta-badge-purple" style={{ fontSize: 10, padding: '2px 8px' }}>
                        MASTER
                      </span>
                    </div>
                    <div className="vta-sub-text">{SUPER_ADMIN_CREDENTIALS.email}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1E293B' }}>
                      📞 +91 {SUPER_ADMIN_CREDENTIALS.phone}
                    </div>
                    <span className="vta-badge-pill vta-badge-green" style={{ fontSize: 10, padding: '1px 6px' }}>
                      Master Phone
                    </span>
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
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#7C3AED' }}>Full Access</span>
                  </td>
                </tr>
              )}

              {/* Registered Admins Rows */}
              {filteredAdmins.map((adm, idx) => (
                <tr
                  key={adm.id}
                  style={{
                    background:
                      adm.status === 'pending' ? '#FFFBEB' : adm.status === 'rejected' ? '#FEF2F2' : '#FFFFFF',
                    transition: 'background 0.2s',
                  }}
                >
                  <td style={{ fontWeight: 700, color: '#94A3B8' }}>{idx + 1}</td>

                  {/* Name & Email */}
                  <td>
                    <div className="vta-name-bold" style={{ fontSize: 13.5 }}>
                      {adm.name}
                    </div>
                    <div className="vta-sub-text" style={{ fontSize: 12 }}>
                      {adm.email}
                    </div>
                  </td>

                  {/* Phone */}
                  <td>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>
                      📞 +91 {adm.phone || '9994994291'}
                    </div>
                    <span className="vta-badge-pill vta-badge-green" style={{ fontSize: 10, padding: '1px 6px' }}>
                      ✅ Phone OTP Verified
                    </span>
                  </td>

                  {/* Registration Date */}
                  <td>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                      {adm.created_at
                        ? new Date(adm.created_at).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Recent'}
                    </div>
                    <div className="vta-sub-text" style={{ fontSize: 11 }}>
                      {adm.created_at
                        ? new Date(adm.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td>
                    {adm.status === 'pending' && (
                      <span className="vta-badge-pill vta-badge-orange" style={{ fontWeight: 800, fontSize: 11.5 }}>
                        ⏳ Pending Approval
                      </span>
                    )}
                    {adm.status === 'approved' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
                        <span className="vta-badge-pill vta-badge-green" style={{ fontWeight: 800, fontSize: 11.5 }}>
                          ✅ Approved & Active
                        </span>
                        {adm.approved_at && (
                          <span style={{ fontSize: 10.5, color: '#64748B' }}>
                            {new Date(adm.approved_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </span>
                        )}
                      </div>
                    )}
                    {adm.status === 'rejected' && (
                      <span className="vta-badge-pill vta-badge-red" style={{ fontWeight: 800, fontSize: 11.5 }}>
                        ❌ Rejected
                      </span>
                    )}
                  </td>

                  {/* Action Buttons (Open Confirmation Modal Box) */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* Approve Button -> Opens Modal Box */}
                      {adm.status !== 'approved' && (
                        <button
                          type="button"
                          onClick={() => setConfirmModal({ open: true, type: 'approve', admin: adm, loading: false })}
                          title="Open Approval Confirmation"
                          style={{
                            background: '#059669',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '7px 14px',
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

                      {/* Reject Button -> Opens Modal Box */}
                      {adm.status !== 'rejected' && (
                        <button
                          type="button"
                          onClick={() => setConfirmModal({ open: true, type: 'reject', admin: adm, loading: false })}
                          title="Open Rejection Confirmation"
                          style={{
                            background: '#F1F5F9',
                            color: '#DC2626',
                            border: '1.5px solid #FECACA',
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

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => setConfirmModal({ open: true, type: 'delete', admin: adm, loading: false })}
                        title="Delete Admin Account"
                        style={{
                          background: '#FEF2F2',
                          color: '#EF4444',
                          border: '1px solid #FEE2E2',
                          padding: '6px 9px',
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
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>
                      {statusFilter === 'pending' ? '🎉' : '📂'}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#1E293B' }}>
                      No {statusFilter} admin accounts found.
                    </div>
                    <div style={{ fontSize: 12.5, marginTop: 4 }}>
                      {statusFilter === 'pending'
                        ? 'All registered administrator accounts have been reviewed.'
                        : `Switch tabs to view other accounts.`}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==============================================================
          CONFIRMATION MODAL BOX (APPROVE / REJECT / DELETE - YES OR NO)
          ============================================================== */}
      {confirmModal.open && confirmModal.admin && (
        <div
          className="vta-modal-backdrop"
          onClick={() =>
            !confirmModal.loading && setConfirmModal({ open: false, type: '', admin: null, loading: false })
          }
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
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
              borderRadius: 22,
              maxWidth: 450,
              width: '100%',
              padding: '30px 26px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 10 }}>
              {confirmModal.type === 'approve' ? '👑' : confirmModal.type === 'reject' ? '⚠️' : '🗑️'}
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 900, color: '#0F172A' }}>
              {confirmModal.type === 'approve'
                ? 'Approve Administrator?'
                : confirmModal.type === 'reject'
                ? 'Reject Administrator Registration?'
                : 'Delete Administrator Account?'}
            </h3>

            <p style={{ margin: '0 0 20px', fontSize: 13.5, color: '#475569', lineHeight: 1.5 }}>
              {confirmModal.type === 'approve'
                ? 'Do you want to confirm and approve this administrator? Once approved, they will be permitted to sign in to the Admin Console.'
                : confirmModal.type === 'reject'
                ? 'Do you want to reject this admin registration? They will be blocked from accessing the Admin Console.'
                : 'Are you sure you want to permanently delete this administrator record?'}
            </p>

            {/* Target Admin Card Details */}
            <div
              style={{
                background: confirmModal.type === 'approve' ? '#ECFDF5' : '#FEF2F2',
                border: `1.5px solid ${confirmModal.type === 'approve' ? '#A7F3D0' : '#FECACA'}`,
                borderRadius: 14,
                padding: '14px 18px',
                textAlign: 'left',
                marginBottom: 24,
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 14.5, marginBottom: 4 }}>
                {confirmModal.admin.name}
              </div>
              <div style={{ color: '#475569', fontSize: 12.5, marginBottom: 4 }}>
                ✉️ <strong>Email:</strong> {confirmModal.admin.email}
              </div>
              <div style={{ color: '#475569', fontSize: 12.5 }}>
                📞 <strong>Mobile:</strong> +91 {confirmModal.admin.phone || '9994994291'}
              </div>
            </div>

            {/* YES / NO Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                type="button"
                disabled={confirmModal.loading}
                onClick={() => setConfirmModal({ open: false, type: '', admin: null, loading: false })}
                style={{
                  background: '#F1F5F9',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: 12,
                  padding: '13px',
                  fontSize: 14,
                  fontWeight: 800,
                  color: '#475569',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                No, Cancel
              </button>

              <button
                type="button"
                disabled={confirmModal.loading}
                onClick={handleConfirmAction}
                style={{
                  background:
                    confirmModal.type === 'approve'
                      ? 'linear-gradient(135deg, #10B981, #059669)'
                      : 'linear-gradient(135deg, #EF4444, #DC2626)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 12,
                  padding: '13px',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow:
                    confirmModal.type === 'approve'
                      ? '0 6px 18px rgba(16, 185, 129, 0.35)'
                      : '0 6px 18px rgba(239, 68, 68, 0.35)',
                  transition: 'transform 0.15s',
                }}
              >
                {confirmModal.loading
                  ? 'Processing...'
                  : confirmModal.type === 'approve'
                  ? 'Yes, Approve'
                  : confirmModal.type === 'reject'
                  ? 'Yes, Reject'
                  : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 14,
                    }}
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
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 14,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Phone Number (10 digits)
                  </label>
                  <input
                    type="tel"
                    placeholder="9994994291"
                    maxLength={10}
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 14,
                    }}
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
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 14,
                    }}
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
                  <label
                    htmlFor="autoApprove"
                    style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                  >
                    Auto-Approve this admin immediately (Super Admin Pre-approval)
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{
                      background: '#F1F5F9',
                      border: '1px solid #E2E8F0',
                      padding: '10px 18px',
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addLoading}
                    style={{
                      background: '#FF6B35',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '10px 22px',
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
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
