import React, { useState } from 'react';
import {
  SUPER_ADMIN_CREDENTIALS,
  verifyAdminCredentials,
  registerNewAdmin,
  generateOTP,
  approveAdmin,
} from '../utils/adminAuth';

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

  // Phone OTP State for Registration
  const [regOtpSent, setRegOtpSent] = useState(false);
  const [regGeneratedOtp, setRegGeneratedOtp] = useState('');
  const [regEnteredOtp, setRegEnteredOtp] = useState('');
  const [regPhoneVerified, setRegPhoneVerified] = useState(false);
  const [regOtpError, setRegOtpError] = useState('');
  const [smsSimulationAlert, setSmsSimulationAlert] = useState('');

  // Login 2FA OTP State
  const [loginTargetAdmin, setLoginTargetAdmin] = useState(null);
  const [loginGeneratedOtp, setLoginGeneratedOtp] = useState('');
  const [loginEnteredOtp, setLoginEnteredOtp] = useState('');
  const [loginOtpError, setLoginOtpError] = useState('');

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
        // Admin credentials verified & approved! Now send 2FA Login OTP
        const otp = generateOTP();
        const phone = res.admin.phone || '7358293839';
        setLoginTargetAdmin(res.admin);
        setLoginGeneratedOtp(otp);
        setLoginEnteredOtp('');
        setLoginOtpError('');
        setMode('login_otp');

        // Show SMS Gateway notification
        setSmsSimulationAlert(
          `📲 [SMS Gateway Simulation] Your VT Kindergarten Admin Login OTP for +91 ${phone} is: ${otp}. Valid for 5 minutes.`
        );
      }
    } catch (err) {
      setLoginError('Connection failed. Please check your network.');
    } finally {
      setLoginLoading(false);
    }
  };

  // ================= 2. INSTANT APPROVAL & SEND LOGIN OTP (FOR TESTING/DEMO) =================
  const handleInstantApproveAndSendOtp = async () => {
    if (!pendingAdmin) return;
    setPendingLoading(true);
    try {
      await approveAdmin(pendingAdmin.id || pendingAdmin.email);
      const approvedAdmin = { ...pendingAdmin, status: 'approved' };
      const otp = generateOTP();
      const phone = approvedAdmin.phone || '7358293839';

      setLoginTargetAdmin(approvedAdmin);
      setLoginGeneratedOtp(otp);
      setLoginEnteredOtp('');
      setLoginOtpError('');
      setPendingAdmin(null);
      setLoginError('');
      setMode('login_otp');

      setSmsSimulationAlert(
        `📲 [SMS Gateway Simulation] Your VT Kindergarten Admin Login OTP for +91 ${phone} is: ${otp}. Valid for 5 minutes.`
      );
    } catch (err) {
      setLoginError('Failed to approve admin account. Please try again.');
    } finally {
      setPendingLoading(false);
    }
  };

  // ================= 3. VERIFY LOGIN 2FA OTP =================
  const handleVerifyLoginOtp = (e) => {
    e.preventDefault();
    setLoginOtpError('');

    const entered = loginEnteredOtp.trim();
    if (!entered) {
      setLoginOtpError('Please enter the 6-digit OTP code.');
      return;
    }

    if (entered !== loginGeneratedOtp) {
      setLoginOtpError('❌ Invalid OTP code. Please enter the correct 6-digit code.');
      return;
    }

    // Success! Complete login
    onLocalLogin?.({
      ...loginTargetAdmin,
      isSuperAdmin: false,
    });
  };

  const handleResendLoginOtp = () => {
    const newOtp = generateOTP();
    setLoginGeneratedOtp(newOtp);
    setLoginEnteredOtp('');
    setLoginOtpError('');
    setSmsSimulationAlert(
      `📲 [SMS Gateway Simulation] Your new Login OTP for +91 ${loginTargetAdmin?.phone || '7358293839'} is: ${newOtp}`
    );
  };

  // ================= 4. PHONE CHANGE & AUTO-GENERATE REGISTRATION OTP =================
  const handleRegPhoneChange = (val) => {
    const clean = formatPhone(val);
    setRegForm((prev) => ({ ...prev, phone: clean }));
    setRegError('');
    setRegOtpError('');

    if (clean.length === 10) {
      // Auto-generate OTP as soon as 10 digits are reached!
      const otp = generateOTP();
      setRegGeneratedOtp(otp);
      setRegOtpSent(true);
      setRegPhoneVerified(false);
      setRegEnteredOtp('');
      setSmsSimulationAlert(
        `📲 [SMS Gateway Simulation] Your Phone Verification OTP for +91 ${clean} is: ${otp}. Valid for 5 minutes.`
      );
    } else {
      setRegOtpSent(false);
      setRegPhoneVerified(false);
      setRegGeneratedOtp('');
      setRegEnteredOtp('');
    }
  };

  // Manual Trigger / Resend Registration OTP
  const handleSendRegOtp = () => {
    const clean = formatPhone(regForm.phone);
    if (clean.length !== 10) {
      setRegOtpError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setRegOtpError('');
    const otp = generateOTP();
    setRegGeneratedOtp(otp);
    setRegOtpSent(true);
    setRegPhoneVerified(false);
    setRegEnteredOtp('');
    setSmsSimulationAlert(
      `📲 [SMS Gateway Simulation] Your Phone Verification OTP for +91 ${clean} is: ${otp}. (Valid for 5 minutes)`
    );
  };

  // 1-Click Auto-Fill & Verify Registration OTP
  const handleAutoFillAndVerifyRegOtp = () => {
    if (!regGeneratedOtp) return;
    setRegEnteredOtp(regGeneratedOtp);
    setRegPhoneVerified(true);
    setRegOtpError('');
    setSmsSimulationAlert(`✅ Mobile +91 ${formatPhone(regForm.phone)} successfully verified with OTP!`);
  };

  // Manual Verify Phone OTP for Registration
  const handleVerifyRegPhoneOtp = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setRegOtpError('');

    if (!regEnteredOtp.trim()) {
      setRegOtpError('Please enter the 6-digit OTP code.');
      return;
    }

    if (regEnteredOtp.trim() !== regGeneratedOtp) {
      setRegOtpError('❌ Invalid OTP. Enter the 6-digit code shown above.');
      return;
    }

    setRegPhoneVerified(true);
    setRegOtpError('');
    setSmsSimulationAlert(`✅ Mobile +91 ${formatPhone(regForm.phone)} verified successfully!`);
  };

  // ================= 5. SUBMIT REGISTRATION =================
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');

    const cleanPhone = formatPhone(regForm.phone);
    if (cleanPhone.length !== 10) {
      setRegError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    // Auto-verify if OTP is generated to prevent unnecessary blocking
    if (!regPhoneVerified) {
      if (regGeneratedOtp && (regEnteredOtp === regGeneratedOtp || !regEnteredOtp)) {
        setRegPhoneVerified(true);
        setRegEnteredOtp(regGeneratedOtp);
      } else {
        const otp = generateOTP();
        setRegGeneratedOtp(otp);
        setRegOtpSent(true);
        setSmsSimulationAlert(
          `📲 [SMS Gateway Simulation] Your Phone Verification OTP for +91 ${cleanPhone} is: ${otp}`
        );
        setRegError('Please verify your phone number with the 6-digit OTP code.');
        return;
      }
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
      <style>{`
        @keyframes pulseAlert {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes glowBorder {
          0%, 100% { box-shadow: 0 0 15px rgba(255, 107, 53, 0.4); }
          50% { box-shadow: 0 0 25px rgba(255, 107, 53, 0.7); }
        }
        @keyframes greenGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(16, 185, 129, 0.4); }
          50% { box-shadow: 0 0 25px rgba(16, 185, 129, 0.7); }
        }
        .vta-auth-inp:focus {
          border-color: #FF6B35 !important;
          background: rgba(255,255,255,0.12) !important;
        }
      `}</style>

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
        {/* Simulated SMS Alert Banner (High-Visibility Toast at top of card) */}
        {smsSimulationAlert && (
          <div
            style={{
              background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
              border: '1.5px solid #34D399',
              borderRadius: 14,
              padding: '12px 16px',
              marginBottom: 20,
              fontSize: 12.5,
              fontWeight: 700,
              color: '#FFFFFF',
              boxShadow: '0 8px 24px rgba(6, 95, 70, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              animation: 'pulseAlert 0.4s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: '#A7F3D0' }}>
                🔔 Incoming Mobile SMS Simulation
              </span>
              <button
                type="button"
                onClick={() => setSmsSimulationAlert('')}
                style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>
            <div style={{ fontSize: 13, color: '#FFFFFF', wordBreak: 'break-word', lineHeight: 1.4 }}>
              {smsSimulationAlert}
            </div>
          </div>
        )}

        {/* Portal Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
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
              marginBottom: 22,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setLoginError('');
                setPendingAdmin(null);
                setSmsSimulationAlert('');
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
                setSmsSimulationAlert('');
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
                marginBottom: 18,
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
            <div style={{ marginBottom: 18 }}>
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
                  marginBottom: 18,
                  fontSize: 12.5,
                  color: '#FEF3C7',
                  lineHeight: 1.5,
                  boxShadow: '0 4px 16px rgba(245, 158, 11, 0.2)',
                }}
              >
                <div style={{ fontWeight: 800, color: '#FBBF24', fontSize: 13, marginBottom: 4 }}>
                  ⏳ Awaiting Super Admin Approval
                </div>
                <div style={{ marginBottom: 12 }}>
                  Admin <strong>{pendingAdmin.name || pendingAdmin.email}</strong> is registered with mobile{' '}
                  <strong style={{ color: '#FDE68A' }}>+91 {pendingAdmin.phone || '7358293839'}</strong>.
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
                    {pendingLoading ? 'Approving...' : '👑 Instant 1-Click Approve & Generate Login OTP'}
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
                  marginBottom: 18,
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
            <div style={{ textAlign: 'center', marginTop: 18 }}>
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
            MODE 2: LOGIN 2FA PHONE OTP CHALLENGE
            ============================================================== */}
        {mode === 'login_otp' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div style={{ fontSize: 32, marginBottom: 4 }}>🔐</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px', color: '#FFFFFF' }}>
                Two-Factor OTP Verification
              </h3>
              <p style={{ fontSize: 12.5, color: 'rgba(255, 255, 255, 0.7)', margin: 0, lineHeight: 1.4 }}>
                Enter the 6-digit OTP code sent to your registered mobile number:
                <br />
                <strong style={{ color: '#38BDF8', fontSize: 14 }}>
                  +91 {loginTargetAdmin?.phone || '7358293839'}
                </strong>
              </p>
            </div>

            {/* High-Visibility Generated OTP Card with 1-Click Auto Fill */}
            {loginGeneratedOtp && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.14)',
                  border: '1.5px solid #10B981',
                  borderRadius: 14,
                  padding: '14px 16px',
                  textAlign: 'center',
                  marginBottom: 18,
                  animation: 'greenGlow 2.5s infinite',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: '#A7F3D0',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    marginBottom: 4,
                  }}
                >
                  📲 Simulated SMS Received on +91 {loginTargetAdmin?.phone || '7358293839'}
                </div>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 900,
                    letterSpacing: 8,
                    color: '#34D399',
                    fontFamily: 'monospace',
                    margin: '6px 0 10px',
                  }}
                >
                  {loginGeneratedOtp}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEnteredOtp(loginGeneratedOtp);
                      setLoginOtpError('');
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 9,
                      padding: '9px 12px',
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                    }}
                  >
                    ⚡ Auto-Fill ({loginGeneratedOtp})
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const phone = loginTargetAdmin?.phone || '9994994291';
                      const msg = `VT Kindergarten Admin Login OTP: ${loginGeneratedOtp}. Valid for 5 minutes.`;
                      window.open(`https://api.whatsapp.com/send?phone=91${phone}&text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 9,
                      padding: '9px 12px',
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
                    }}
                  >
                    💬 WhatsApp Code
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleVerifyLoginOtp}>
              <div style={{ marginBottom: 18 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'rgba(255, 255, 255, 0.8)',
                    marginBottom: 6,
                    textAlign: 'center',
                  }}
                >
                  ENTER 6-DIGIT LOGIN OTP
                </label>
                <input
                  className="vta-auth-inp"
                  type="text"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={loginEnteredOtp}
                  onChange={(e) => setLoginEnteredOtp(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '2px solid rgba(255, 107, 53, 0.5)',
                    borderRadius: 14,
                    padding: '13px',
                    color: '#FF6B35',
                    fontSize: 24,
                    fontWeight: 900,
                    letterSpacing: 8,
                    textAlign: 'center',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              {loginOtpError && (
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
                  {loginOtpError}
                </div>
              )}

              <button
                type="submit"
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 12,
                  padding: '14px',
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
                  marginBottom: 14,
                }}
              >
                Verify OTP & Enter Admin Dashboard ➔
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
                  🔄 Resend OTP Code
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setLoginError('');
                    setPendingAdmin(null);
                    setSmsSimulationAlert('');
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
                  ← Back to Email Sign In
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==============================================================
            MODE 3: REGISTER AS ADMIN
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
                marginBottom: 16,
                fontSize: 12,
                color: '#FDE68A',
                lineHeight: 1.4,
              }}
            >
              ℹ️ <strong>Phone OTP Verification Required:</strong> Enter 10-digit mobile number. OTP will generate
              automatically. After registration, Super Admin will approve your account.
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

            {/* Phone Number with OTP verification block */}
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
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {!regPhoneVerified && (
                    <button
                      type="button"
                      onClick={() => handleRegPhoneChange('9994994291')}
                      style={{
                        background: 'rgba(255, 107, 53, 0.2)',
                        border: '1px solid rgba(255, 107, 53, 0.4)',
                        borderRadius: 6,
                        color: '#FFA149',
                        fontSize: 10.5,
                        fontWeight: 800,
                        padding: '2px 8px',
                        cursor: 'pointer',
                      }}
                      title="Quick fill 9994994291"
                    >
                      📲 Use 9994994291
                    </button>
                  )}
                  {regPhoneVerified && (
                    <span style={{ color: '#34D399', fontSize: 12, fontWeight: 800 }}>
                      ✅ +91 {regForm.phone} Verified
                    </span>
                  )}
                </div>
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
                  {regOtpSent ? '🔄 Resend OTP' : '📲 Send OTP'}
                </button>
              </div>

              {/* Sub-block for entering / auto-filling registration Phone OTP */}
              {regOtpSent && !regPhoneVerified && (
                <div
                  style={{
                    marginTop: 10,
                    background: 'rgba(255, 107, 53, 0.14)',
                    border: '1.5px solid #FF6B35',
                    borderRadius: 12,
                    padding: '12px 14px',
                    boxShadow: '0 4px 16px rgba(255, 107, 53, 0.25)',
                    animation: 'pulseAlert 0.4s ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#FFA149' }}>
                      📲 OTP for +91 {regForm.phone}:
                    </span>
                    <span
                      style={{
                        background: '#FF6B35',
                        color: '#FFFFFF',
                        fontFamily: 'monospace',
                        fontSize: 14,
                        fontWeight: 900,
                        letterSpacing: 2,
                        padding: '2px 8px',
                        borderRadius: 6,
                      }}
                    >
                      {regGeneratedOtp}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                    <button
                      type="button"
                      onClick={handleAutoFillAndVerifyRegOtp}
                      style={{
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 10px',
                        fontSize: 11.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                      }}
                    >
                      ⚡ 1-Click Auto-Fill ({regGeneratedOtp})
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const msg = `VT Kindergarten Phone Verification OTP: ${regGeneratedOtp}. Valid for 5 minutes.`;
                        window.open(`https://api.whatsapp.com/send?phone=91${regForm.phone}&text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #25D366, #128C7E)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 10px',
                        fontSize: 11.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 12px rgba(37, 211, 102, 0.35)',
                      }}
                    >
                      💬 Send to WhatsApp
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="6-digit OTP"
                      value={regEnteredOtp}
                      onChange={(e) => setRegEnteredOtp(e.target.value.replace(/\D/g, ''))}
                      style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.12)',
                        border: '1px solid rgba(255,255,255,0.25)',
                        borderRadius: 8,
                        padding: '8px 10px',
                        color: '#FFFFFF',
                        fontSize: 14,
                        fontWeight: 800,
                        letterSpacing: 2,
                        textAlign: 'center',
                        outline: 'none',
                        fontFamily: 'monospace',
                      }}
                    />

                    <button
                      type="button"
                      onClick={handleVerifyRegPhoneOtp}
                      style={{
                        background: '#FF6B35',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 12px',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Verify
                    </button>
                  </div>

                  {regOtpError && (
                    <div style={{ color: '#F87171', fontSize: 11.5, fontWeight: 700, marginTop: 6 }}>
                      {regOtpError}
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
              disabled={regLoading}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #FF6B35 0%, #FF8A00 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 12,
                padding: '14px',
                fontSize: 14.5,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(255, 107, 53, 0.35)',
              }}
            >
              {regLoading
                ? 'Registering Account...'
                : !regPhoneVerified
                ? 'Verify OTP & Submit Admin Registration'
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
                  setSmsSimulationAlert('');
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
                  setSmsSimulationAlert('');
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
