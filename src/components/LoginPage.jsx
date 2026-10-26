import React, { useState } from 'react';
import {
  SUPER_ADMIN_CREDENTIALS,
  verifyAdminCredentials,
  registerNewAdmin,
  approveAdmin,
} from '../utils/adminAuth';
import { sendSecureOtpToPhone, verifyOtpWithSupabase } from '../utils/supabaseOtpService';

const LOGO_SRC = '/assets/vt-logo.png';

export default function LoginPage({ onLocalLogin }) {
  // Mode: 'login' | 'register' | 'login_otp' | 'register_success'
  const [mode, setMode] = useState('login');

  // Login Form State
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [pendingAdmin, setPendingAdmin] = useState(null);
  const [pendingLoading, setPendingLoading] = useState(false);

  // Register Form State
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  // Phone OTP State for Registration (Managed via Supabase backend, never shown on UI)
  const [regOtpSent, setRegOtpSent] = useState(false);
  const [regEnteredOtp, setRegEnteredOtp] = useState('');
  const [regPhoneVerified, setRegPhoneVerified] = useState(false);
  const [regOtpStatus, setRegOtpStatus] = useState(''); // '' | 'sent' | 'checking' | 'correct' | 'wrong'
  const [regOtpMessage, setRegOtpMessage] = useState('');

  // Login 2FA OTP State (Managed via Supabase backend, never shown on UI)
  const [loginTargetAdmin, setLoginTargetAdmin] = useState(null);
  const [loginEnteredOtp, setLoginEnteredOtp] = useState('');
  const [loginOtpStatus, setLoginOtpStatus] = useState(''); // '' | 'checking' | 'correct' | 'wrong'
  const [loginOtpMessage, setLoginOtpMessage] = useState('');

  // Helper: Format phone to 10 digits
  const formatPhone = (val = '') => String(val).replace(/\D/g, '').slice(0, 10);

  // ================= 1. SUBMIT LOGIN (CREDENTIALS CHECK) =================
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    setPendingAdmin(null);

    try {
      const emailTrimmed = loginForm.email.trim();
      const res = await verifyAdminCredentials(emailTrimmed, loginForm.password);

      if (res.status === 'ok' && res.isSuperAdmin) {
        // Super Admin logs in directly!
        setLoginLoading(false);
        onLocalLogin?.(res.admin);
        return;
      }

      if (res.status === 'invalid_credentials') {
        setLoginError(res.error || 'Invalid email or password.');
        setLoginLoading(false);
        return;
      }

      if (res.status === 'pending') {
        // Newly registered admin awaiting Super Admin approval
        setPendingAdmin(res.admin);
        setLoginError('');
        setLoginLoading(false);
        return;
      }

      if (res.status === 'rejected') {
        setLoginError(res.error || 'Your registration was rejected by the Super Admin.');
        setLoginLoading(false);
        return;
      }

      if (res.status === 'require_otp') {
        // Approved admin: Generate OTP and save inside Supabase backend, dispatch SMS
        const phone = res.admin.phone || '9994994291';
        setLoginTargetAdmin(res.admin);
        setLoginEnteredOtp('');
        setLoginOtpStatus('');
        setLoginOtpMessage('');
        setMode('login_otp');

        // Save OTP securely in Supabase backend
        await sendSecureOtpToPhone({ phone, purpose: 'login_2fa' });
      }
    } catch (err) {
      setLoginError('Connection failed. Please check your network.');
    } finally {
      setLoginLoading(false);
    }
  };

  // ================= 2. INSTANT APPROVAL FOR TESTING/DEMO =================
  const handleInstantApproveAndSendOtp = async () => {
    if (!pendingAdmin) return;
    setPendingLoading(true);
    try {
      await approveAdmin(pendingAdmin.id || pendingAdmin.email);
      const approvedAdmin = { ...pendingAdmin, status: 'approved' };
      const phone = approvedAdmin.phone || '9994994291';

      setLoginTargetAdmin(approvedAdmin);
      setLoginEnteredOtp('');
      setLoginOtpStatus('');
      setLoginOtpMessage('');
      setPendingAdmin(null);
      setLoginError('');
      setMode('login_otp');

      // Save OTP securely in Supabase backend
      await sendSecureOtpToPhone({ phone, purpose: 'login_2fa' });
    } catch (err) {
      setLoginError('Failed to approve admin account. Please try again.');
    } finally {
      setPendingLoading(false);
    }
  };

  // ================= 3. REAL-TIME VALIDATION IN LOGIN OTP INPUT BOX VIA SUPABASE =================
  const handleLoginOtpInputChange = async (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 6);
    setLoginEnteredOtp(digits);

    if (digits.length < 6) {
      setLoginOtpStatus('');
      setLoginOtpMessage('');
    } else if (digits.length === 6) {
      setLoginOtpStatus('checking');
      setLoginOtpMessage('Verifying OTP with Supabase...');

      const phone = loginTargetAdmin?.phone || '9994994291';
      const verifyRes = await verifyOtpWithSupabase({ phone, enteredOtp: digits });

      if (verifyRes.valid) {
        setLoginOtpStatus('correct');
        setLoginOtpMessage('✅ OTP Verified Successfully! Logging you in...');
        setTimeout(() => {
          onLocalLogin?.({
            ...loginTargetAdmin,
            isSuperAdmin: false,
          });
        }, 500);
      } else {
        setLoginOtpStatus('wrong');
        setLoginOtpMessage(verifyRes.error || '❌ Incorrect OTP code. Please try again.');
      }
    }
  };

  const handleVerifyLoginOtp = async (e) => {
    e.preventDefault();
    if (loginEnteredOtp.length !== 6) return;

    setLoginOtpStatus('checking');
    const phone = loginTargetAdmin?.phone || '9994994291';
    const verifyRes = await verifyOtpWithSupabase({ phone, enteredOtp: loginEnteredOtp });

    if (verifyRes.valid) {
      setLoginOtpStatus('correct');
      onLocalLogin?.({
        ...loginTargetAdmin,
        isSuperAdmin: false,
      });
    } else {
      setLoginOtpStatus('wrong');
      setLoginOtpMessage(verifyRes.error || '❌ Incorrect OTP code.');
    }
  };

  const handleResendLoginOtp = async () => {
    const phone = loginTargetAdmin?.phone || '9994994291';
    setLoginEnteredOtp('');
    setLoginOtpStatus('');
    setLoginOtpMessage('Sending new OTP to phone message...');
    await sendSecureOtpToPhone({ phone, purpose: 'login_2fa' });
    setLoginOtpMessage('📲 New OTP code sent to your phone message.');
  };

  // ================= 4. REGISTRATION PHONE OTP (REAL-TIME SUPABASE VERIFICATION) =================
  const handleRegPhoneChange = async (val) => {
    const clean = formatPhone(val);
    setRegForm((prev) => ({ ...prev, phone: clean }));
    setRegError('');

    if (clean.length === 10) {
      // Securely generate & save OTP in Supabase backend
      setRegOtpSent(true);
      setRegPhoneVerified(false);
      setRegEnteredOtp('');
      setRegOtpStatus('sent');
      setRegOtpMessage('📲 SMS with 6-digit OTP sent to your phone.');

      await sendSecureOtpToPhone({ phone: clean, purpose: 'registration' });
    } else {
      setRegOtpSent(false);
      setRegPhoneVerified(false);
      setRegEnteredOtp('');
      setRegOtpStatus('');
      setRegOtpMessage('');
    }
  };

  const handleSendRegOtp = async () => {
    const clean = formatPhone(regForm.phone);
    if (clean.length !== 10) {
      setRegError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setRegOtpSent(true);
    setRegPhoneVerified(false);
    setRegEnteredOtp('');
    setRegOtpStatus('sent');
    setRegOtpMessage('📲 Sending new SMS OTP to your phone...');
    await sendSecureOtpToPhone({ phone: clean, purpose: 'registration' });
    setRegOtpMessage('📲 New OTP sent to your phone message.');
  };

  // Real-time verification against Supabase when 6 digits are typed
  const handleRegOtpInputChange = async (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 6);
    setRegEnteredOtp(digits);

    if (digits.length < 6) {
      setRegOtpStatus('sent');
      setRegPhoneVerified(false);
      setRegOtpMessage('');
    } else if (digits.length === 6) {
      setRegOtpStatus('checking');
      setRegOtpMessage('Verifying OTP with Supabase...');

      const verifyRes = await verifyOtpWithSupabase({
        phone: regForm.phone,
        enteredOtp: digits,
      });

      if (verifyRes.valid) {
        setRegOtpStatus('correct');
        setRegPhoneVerified(true);
        setRegOtpMessage('✅ OTP Verified Successfully! Mobile +91 ' + regForm.phone + ' confirmed.');
        setRegError('');
      } else {
        setRegOtpStatus('wrong');
        setRegPhoneVerified(false);
        setRegOtpMessage(verifyRes.error || '❌ Incorrect OTP. Please check your phone SMS.');
      }
    }
  };

  // ================= 5. SUBMIT REGISTRATION =================
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');

    const cleanPhone = formatPhone(regForm.phone);
    if (cleanPhone.length !== 10) {
      setRegError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!regPhoneVerified) {
      setRegError('Please enter the correct 6-digit OTP sent to your phone message first.');
      return;
    }

    if (regForm.password.length < 6) {
      setRegError('Password must be at least 6 characters.');
      return;
    }

    if (regForm.password !== regForm.confirmPassword) {
      setRegError('Password and Confirm Password do not match.');
      return;
    }

    setRegLoading(true);
    try {
      const res = await registerNewAdmin({
        name: regForm.name,
        email: regForm.email,
        phone: cleanPhone,
        password: regForm.password,
      });

      if (!res.success) {
        setRegError(res.error || 'Failed to submit registration.');
        setRegLoading(false);
        return;
      }

      // Success! Move to confirmation card
      setMode('register_success');
    } catch (err) {
      setRegError('Network error during registration. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)',
        fontFamily: "'Plus Jakarta Sans', 'Nunito', sans-serif",
        padding: '24px 16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: mode === 'register' ? 490 : 430,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 24,
          padding: '36px 32px',
          boxSizing: 'border-box',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)',
          color: '#FFFFFF',
          position: 'relative',
        }}
      >
        {/* Portal Header */}
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <img
            src={LOGO_SRC}
            alt="VT Kindergarten Logo"
            style={{
              width: 82,
              height: 82,
              display: 'block',
              margin: '0 auto 12px',
              padding: 4,
              borderRadius: '50%',
              background: '#FFFFFF',
              objectFit: 'contain',
              boxShadow: '0 10px 28px rgba(255, 107, 53, 0.3)',
            }}
          />
          <h1 style={{ fontSize: 23, fontWeight: 900, color: '#FF6B35', margin: '0 0 3px', letterSpacing: -0.5 }}>
            VT Kindergarten
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: 13, margin: 0, fontWeight: 600 }}>
            Official Administrator Portal
          </p>
        </div>

        {/* Mode Switcher Tabs (Only visible in login & register modes) */}
        {(mode === 'login' || mode === 'register') && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              padding: 4,
              marginBottom: 20,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setLoginError('');
                setPendingAdmin(null);
              }}
              style={{
                background: mode === 'login' ? 'linear-gradient(135deg, #FF6B35, #FFA149)' : 'transparent',
                color: mode === 'login' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
                border: 'none',
                borderRadius: 9,
                padding: '9px 12px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              🔑 Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setRegError('');
              }}
              style={{
                background: mode === 'register' ? 'linear-gradient(135deg, #FF6B35, #FFA149)' : 'transparent',
                color: mode === 'register' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
                border: 'none',
                borderRadius: 9,
                padding: '9px 12px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              📝 Register Admin
            </button>
          </div>
        )}

        {/* ==============================================================
            MODE 1: LOGIN (EMAIL & PASSWORD)
            ============================================================== */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            {/* Super Admin Info Hint */}
            <div
              style={{
                background: 'rgba(124, 58, 237, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.35)',
                borderRadius: 11,
                padding: '10px 14px',
                marginBottom: 16,
                fontSize: 12,
                color: '#E9D5FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>👑</span>
                <div>
                  Super Admin: <strong>superadmin@vtkindergarten.com</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLoginForm({
                    email: SUPER_ADMIN_CREDENTIALS.email,
                    password: SUPER_ADMIN_CREDENTIALS.password,
                  });
                  setLoginError('');
                  setPendingAdmin(null);
                }}
                style={{
                  background: 'rgba(139, 92, 246, 0.3)',
                  border: '1px solid rgba(167, 139, 250, 0.5)',
                  borderRadius: 6,
                  color: '#FFFFFF',
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '4px 8px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                ⚡ Fill
              </button>
            </div>

            {/* Email Address */}
            <div style={{ marginBottom: 15 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: 'rgba(255, 255, 255, 0.8)',
                  marginBottom: 6,
                }}
              >
                Admin Email Address
              </label>
              <input
                className="vta-auth-inp"
                type="email"
                placeholder="Enter email address"
                value={loginForm.email}
                onChange={(e) => {
                  setLoginForm({ ...loginForm, email: e.target.value });
                  setPendingAdmin(null);
                  setLoginError('');
                }}
                required
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1.5px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  color: '#FFFFFF',
                  fontSize: 14.5,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: 'rgba(255, 255, 255, 0.8)',
                  marginBottom: 6,
                }}
              >
                Password
              </label>
              <input
                className="vta-auth-inp"
                type="password"
                placeholder="Enter password"
                value={loginForm.password}
                onChange={(e) => {
                  setLoginForm({ ...loginForm, password: e.target.value });
                  setLoginError('');
                }}
                required
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1.5px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  color: '#FFFFFF',
                  fontSize: 14.5,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Pending Admin Approval Prompt */}
            {pendingAdmin && (
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.14)',
                  border: '1.5px solid rgba(245, 158, 11, 0.45)',
                  borderRadius: 14,
                  padding: '14px 16px',
                  marginBottom: 16,
                  fontSize: 12.5,
                  color: '#FEF3C7',
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 800, color: '#FBBF24', fontSize: 13, marginBottom: 4 }}>
                  ⏳ Awaiting Super Admin Approval
                </div>
                <div style={{ marginBottom: 12 }}>
                  Admin <strong>{pendingAdmin.name || pendingAdmin.email}</strong> is registered with mobile{' '}
                  <strong style={{ color: '#FDE68A' }}>+91 {pendingAdmin.phone || '9994994291'}</strong>.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    type="button"
                    disabled={pendingLoading}
                    onClick={handleInstantApproveAndSendOtp}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 10,
                      padding: '11px 14px',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                    }}
                  >
                    {pendingLoading ? 'Approving...' : '👑 Instant 1-Click Approve & Send Phone SMS OTP'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginForm({
                        email: SUPER_ADMIN_CREDENTIALS.email,
                        password: SUPER_ADMIN_CREDENTIALS.password,
                      });
                      setLoginError('');
                      setPendingAdmin(null);
                    }}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#E2E8F0',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: 10,
                      padding: '9px 12px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Log In as Super Admin (Review in Approvals Tab)
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {loginError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  color: '#FCA5A5',
                  fontSize: 12.5,
                  fontWeight: 700,
                  marginBottom: 16,
                  lineHeight: 1.4,
                }}
              >
                {loginError}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loginLoading}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #FF6B35 0%, #FF8A00 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 12,
                padding: '14px',
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(255, 107, 53, 0.35)',
                transition: 'transform 0.15s, opacity 0.15s',
              }}
            >
              {loginLoading ? 'Verifying Credentials...' : 'Sign In to Admin Portal'}
            </button>

            {/* Switch to Register link */}
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <span style={{ fontSize: 12.5, color: 'rgba(255, 255, 255, 0.55)' }}>
                New administrator?{' '}
              </span>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setRegError('');
                  setPendingAdmin(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FF9454',
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Register with Phone OTP
              </button>
            </div>
          </form>
        )}

        {/* ==============================================================
            MODE 2: LOGIN 2FA PHONE OTP (SUPABASE VERIFICATION IN INPUT BOX)
            ============================================================== */}
        {mode === 'login_otp' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 6 }}>🔐</div>
              <h3 style={{ fontSize: 19, fontWeight: 800, margin: '0 0 6px', color: '#FFFFFF' }}>
                Two-Factor Phone OTP Verification
              </h3>
              <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.7)', margin: 0, lineHeight: 1.5 }}>
                An SMS with a 6-digit OTP code was sent to your phone message:
                <br />
                <strong style={{ color: '#38BDF8', fontSize: 15 }}>
                  +91 {loginTargetAdmin?.phone || '9994994291'}
                </strong>
              </p>
            </div>

            <form onSubmit={handleVerifyLoginOtp}>
              <div style={{ marginBottom: 18 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 800,
                    color: 'rgba(255, 255, 255, 0.75)',
                    marginBottom: 8,
                    textAlign: 'center',
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                  }}
                >
                  Enter 6-Digit OTP From Phone Message
                </label>

                {/* Input box that checks whether it is correct or not directly inside */}
                <div style={{ position: 'relative' }}>
                  <input
                    className="vta-auth-inp"
                    type="text"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={loginEnteredOtp}
                    onChange={(e) => handleLoginOtpInputChange(e.target.value)}
                    autoFocus
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: `2.5px solid ${
                        loginOtpStatus === 'correct'
                          ? '#10B981'
                          : loginOtpStatus === 'wrong'
                          ? '#EF4444'
                          : loginOtpStatus === 'checking'
                          ? '#38BDF8'
                          : 'rgba(255, 107, 53, 0.5)'
                      }`,
                      borderRadius: 14,
                      padding: '14px 44px 14px 16px',
                      color: loginOtpStatus === 'correct' ? '#34D399' : '#FFFFFF',
                      fontSize: 24,
                      fontWeight: 900,
                      letterSpacing: 8,
                      textAlign: 'center',
                      fontFamily: 'monospace',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      boxShadow:
                        loginOtpStatus === 'correct'
                          ? '0 0 20px rgba(16, 185, 129, 0.4)'
                          : loginOtpStatus === 'wrong'
                          ? '0 0 20px rgba(239, 68, 68, 0.4)'
                          : 'none',
                    }}
                  />
                  {loginOtpStatus === 'correct' && (
                    <span
                      style={{
                        position: 'absolute',
                        right: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 20,
                      }}
                    >
                      ✅
                    </span>
                  )}
                  {loginOtpStatus === 'wrong' && (
                    <span
                      style={{
                        position: 'absolute',
                        right: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 20,
                      }}
                    >
                      ❌
                    </span>
                  )}
                  {loginOtpStatus === 'checking' && (
                    <span
                      style={{
                        position: 'absolute',
                        right: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 16,
                      }}
                    >
                      ⏳
                    </span>
                  )}
                </div>

                {loginOtpMessage && (
                  <div
                    style={{
                      color: loginOtpStatus === 'correct' ? '#34D399' : loginOtpStatus === 'wrong' ? '#F87171' : '#38BDF8',
                      fontSize: 12.5,
                      fontWeight: 800,
                      marginTop: 8,
                      textAlign: 'center',
                    }}
                  >
                    {loginOtpMessage}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loginEnteredOtp.length !== 6 || loginOtpStatus === 'wrong'}
                style={{
                  width: '100%',
                  background:
                    loginOtpStatus === 'correct'
                      ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                      : 'linear-gradient(135deg, #FF6B35 0%, #FF8A00 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 12,
                  padding: '14px',
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: loginEnteredOtp.length === 6 ? 'pointer' : 'not-allowed',
                  opacity: loginEnteredOtp.length === 6 ? 1 : 0.6,
                  boxShadow: '0 8px 24px rgba(255, 107, 53, 0.35)',
                  marginBottom: 14,
                  transition: 'all 0.2s',
                }}
              >
                {loginOtpStatus === 'correct'
                  ? 'Verified! Entering Dashboard...'
                  : 'Verify OTP & Enter Admin Dashboard'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <button
                  type="button"
                  onClick={handleResendLoginOtp}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#38BDF8',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  🔄 Resend SMS OTP
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setLoginError('');
                    setPendingAdmin(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==============================================================
            MODE 3: REGISTER AS ADMIN (SUPABASE SECURE VERIFICATION)
            ============================================================== */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit}>
            {/* Info Notice */}
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 10,
                padding: '9px 12px',
                marginBottom: 15,
                fontSize: 12,
                color: '#FDE68A',
                lineHeight: 1.4,
              }}
            >
              ℹ️ <strong>Phone OTP Verification Required:</strong> Enter 10-digit mobile number. An OTP will be sent to
              your phone message. Super Admin confirms registration.
            </div>

            {/* Full Name */}
            <div style={{ marginBottom: 12 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'rgba(255, 255, 255, 0.8)',
                  marginBottom: 4,
                }}
              >
                Full Name <span style={{ color: '#FF6B35' }}>*</span>
              </label>
              <input
                className="vta-auth-inp"
                type="text"
                placeholder="Enter full name"
                value={regForm.name}
                onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                required
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1.5px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  color: '#FFFFFF',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Email Address */}
            <div style={{ marginBottom: 12 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'rgba(255, 255, 255, 0.8)',
                  marginBottom: 4,
                }}
              >
                Email Address <span style={{ color: '#FF6B35' }}>*</span>
              </label>
              <input
                className="vta-auth-inp"
                type="email"
                placeholder="admin@vtkindergarten.com"
                value={regForm.email}
                onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                required
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1.5px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  color: '#FFFFFF',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Phone Number with Real-time Validating Input Box */}
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 4,
                }}
              >
                <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)' }}>
                  Mobile Phone (10 Digits) <span style={{ color: '#FF6B35' }}>*</span>
                </label>
                {regPhoneVerified && (
                  <span style={{ color: '#34D399', fontSize: 12, fontWeight: 800 }}>
                    ✅ +91 {regForm.phone} Verified
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="vta-auth-inp"
                  type="tel"
                  placeholder="e.g. 9994994291"
                  maxLength={10}
                  value={regForm.phone}
                  onChange={(e) => handleRegPhoneChange(e.target.value)}
                  required
                  style={{
                    flex: 1,
                    background: regPhoneVerified ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.08)',
                    border: `1.5px solid ${regPhoneVerified ? '#10B981' : 'rgba(255, 255, 255, 0.15)'}`,
                    borderRadius: 10,
                    padding: '10px 14px',
                    color: '#FFFFFF',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontWeight: 700,
                  }}
                />

                <button
                  type="button"
                  onClick={handleSendRegOtp}
                  disabled={formatPhone(regForm.phone).length !== 10}
                  style={{
                    background: formatPhone(regForm.phone).length === 10 ? '#FF6B35' : 'rgba(255,255,255,0.12)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 10,
                    padding: '0 14px',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: formatPhone(regForm.phone).length === 10 ? 'pointer' : 'not-allowed',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {regOtpSent ? '🔄 Resend SMS' : '📲 Send SMS OTP'}
                </button>
              </div>

              {/* Real-time validating OTP input box (Checks against Supabase backend) */}
              {regOtpSent && !regPhoneVerified && (
                <div style={{ marginTop: 12 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                      fontSize: 12,
                      color: '#93C5FD',
                      fontWeight: 700,
                    }}
                  >
                    <span>📲 SMS Sent to +91 {regForm.phone}</span>
                    <button
                      type="button"
                      onClick={handleSendRegOtp}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#38BDF8',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      Resend SMS
                    </button>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP from SMS"
                      value={regEnteredOtp}
                      onChange={(e) => handleRegOtpInputChange(e.target.value)}
                      autoFocus
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: `2px solid ${
                          regOtpStatus === 'correct'
                            ? '#10B981'
                            : regOtpStatus === 'wrong'
                            ? '#EF4444'
                            : regOtpStatus === 'checking'
                            ? '#38BDF8'
                            : 'rgba(255, 255, 255, 0.25)'
                        }`,
                        borderRadius: 12,
                        padding: '12px 40px 12px 16px',
                        color: regOtpStatus === 'correct' ? '#34D399' : '#FFFFFF',
                        fontSize: 18,
                        fontWeight: 900,
                        letterSpacing: 6,
                        textAlign: 'center',
                        fontFamily: 'monospace',
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        boxShadow:
                          regOtpStatus === 'correct'
                            ? '0 0 16px rgba(16, 185, 129, 0.35)'
                            : regOtpStatus === 'wrong'
                            ? '0 0 16px rgba(239, 68, 68, 0.35)'
                            : 'none',
                      }}
                    />
                    {regOtpStatus === 'correct' && (
                      <span
                        style={{
                          position: 'absolute',
                          right: 14,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: 18,
                        }}
                      >
                        ✅
                      </span>
                    )}
                    {regOtpStatus === 'wrong' && (
                      <span
                        style={{
                          position: 'absolute',
                          right: 14,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: 18,
                        }}
                      >
                        ❌
                      </span>
                    )}
                    {regOtpStatus === 'checking' && (
                      <span
                        style={{
                          position: 'absolute',
                          right: 14,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: 16,
                        }}
                      >
                        ⏳
                      </span>
                    )}
                  </div>

                  {regOtpMessage && (
                    <div
                      style={{
                        color:
                          regOtpStatus === 'correct'
                            ? '#34D399'
                            : regOtpStatus === 'wrong'
                            ? '#F87171'
                            : '#93C5FD',
                        fontSize: 12,
                        fontWeight: 700,
                        marginTop: 6,
                        textAlign: 'center',
                      }}
                    >
                      {regOtpMessage}
                    </div>
                  )}
                </div>
              )}

              {regPhoneVerified && (
                <div
                  style={{
                    marginTop: 8,
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid #10B981',
                    borderRadius: 8,
                    padding: '8px 12px',
                    color: '#34D399',
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>✅</span>
                  <span>Mobile +91 {regForm.phone} verified successfully via OTP!</span>
                </div>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: 12 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'rgba(255, 255, 255, 0.8)',
                  marginBottom: 4,
                }}
              >
                Password (Min 6 Characters) <span style={{ color: '#FF6B35' }}>*</span>
              </label>
              <input
                className="vta-auth-inp"
                type="password"
                placeholder="Create password"
                value={regForm.password}
                onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                required
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1.5px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  color: '#FFFFFF',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'rgba(255, 255, 255, 0.8)',
                  marginBottom: 4,
                }}
              >
                Confirm Password <span style={{ color: '#FF6B35' }}>*</span>
              </label>
              <input
                className="vta-auth-inp"
                type="password"
                placeholder="Re-enter password"
                value={regForm.confirmPassword}
                onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                required
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1.5px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  color: '#FFFFFF',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Registration Error */}
            {regError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  color: '#FCA5A5',
                  fontSize: 12.5,
                  fontWeight: 700,
                  marginBottom: 16,
                  textAlign: 'center',
                }}
              >
                {regError}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={regLoading || !regPhoneVerified}
              style={{
                width: '100%',
                background: regPhoneVerified
                  ? 'linear-gradient(135deg, #FF6B35 0%, #FF8A00 100%)'
                  : 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 12,
                padding: '14px',
                fontSize: 14.5,
                fontWeight: 800,
                cursor: regPhoneVerified ? 'pointer' : 'not-allowed',
                boxShadow: regPhoneVerified ? '0 8px 24px rgba(255, 107, 53, 0.35)' : 'none',
              }}
            >
              {regLoading
                ? 'Registering Account...'
                : !regPhoneVerified
                ? 'Verify Phone OTP to Submit Registration'
                : 'Submit Admin Registration'}
            </button>

            {/* Switch to Login link */}
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <span style={{ fontSize: 12.5, color: 'rgba(255, 255, 255, 0.55)' }}>
                Already have an account?{' '}
              </span>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setLoginError('');
                  setPendingAdmin(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FF9454',
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* ==============================================================
            MODE 4: REGISTRATION SUCCESS CONFIRMATION
            ============================================================== */}
        {mode === 'register_success' && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🎉</div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: '#34D399', margin: '0 0 10px' }}>
              Registration Submitted!
            </h3>

            <div
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1.5px solid rgba(245, 158, 11, 0.4)',
                borderRadius: 14,
                padding: '16px',
                textAlign: 'left',
                marginBottom: 20,
                fontSize: 13,
                color: '#FEF3C7',
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 13.5, color: '#FBBF24', marginBottom: 6 }}>
                ⏳ Status: PENDING SUPER ADMIN APPROVAL
              </div>
              <div>
                Your admin registration for <strong>{regForm.email}</strong> with verified mobile{' '}
                <strong style={{ color: '#FDE68A' }}>+91 {regForm.phone}</strong> has been successfully submitted!
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(254, 243, 199, 0.9)' }}>
                • Super Admin (<strong>superadmin@vtkindergarten.com</strong>) must confirm your registration.
                <br />
                • Once approved, you can sign in with your email, password, and mobile OTP.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setLoginForm({
                    email: SUPER_ADMIN_CREDENTIALS.email,
                    password: SUPER_ADMIN_CREDENTIALS.password,
                  });
                  setLoginError('');
                  setPendingAdmin(null);
                }}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 12,
                  padding: '13px',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(124, 58, 237, 0.4)',
                }}
              >
                👑 Log In as Super Admin to Approve Now
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setLoginForm({ email: regForm.email, password: '' });
                  setLoginError('');
                  setPendingAdmin(null);
                }}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #FF6B35 0%, #FF8A00 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 12,
                  padding: '13px',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(255, 107, 53, 0.35)',
                }}
              >
                Return to Admin Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
