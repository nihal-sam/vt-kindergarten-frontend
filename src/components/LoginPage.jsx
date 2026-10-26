import React, { useState } from 'react';
import {
  SUPER_ADMIN_CREDENTIALS,
  verifyAdminCredentials,
  registerNewAdmin,
  generateOTP,
} from '../utils/adminAuth';

const LOGO_SRC = '/assets/vt-logo.png';

export default function LoginPage({ onLocalLogin }) {
  // Mode: 'login' | 'register' | 'login_otp' | 'register_success'
  const [mode, setMode] = useState('login');

  // Login Form State
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

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
  const formatPhone = (val) => val.replace(/\D/g, '').slice(0, 10);

  // ================= 1. SUBMIT LOGIN (CREDENTIALS CHECK) =================
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

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
        setLoginError(res.error || 'Your account is pending Super Admin approval.');
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

  // ================= 2. VERIFY LOGIN 2FA OTP =================
  const handleVerifyLoginOtp = (e) => {
    e.preventDefault();
    setLoginOtpError('');

    if (loginEnteredOtp.trim() !== loginGeneratedOtp) {
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
      `📲 [SMS Gateway Simulation] Your new Login OTP for +91 ${loginTargetAdmin?.phone} is: ${newOtp}`
    );
  };

  // ================= 3. SEND PHONE OTP FOR REGISTRATION =================
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
    setRegEnteredOtp('');
    setSmsSimulationAlert(
      `📲 [SMS Gateway Simulation] Your Phone Verification OTP for +91 ${clean} is: ${otp} (Valid for 5 minutes)`
    );
  };

  // ================= 4. VERIFY PHONE OTP FOR REGISTRATION =================
  const handleVerifyRegPhoneOtp = (e) => {
    e.preventDefault();
    setRegOtpError('');

    if (regEnteredOtp.trim() !== regGeneratedOtp) {
      setRegOtpError('❌ Invalid OTP. Please enter the 6-digit code shown in the SMS alert.');
      return;
    }

    setRegPhoneVerified(true);
    setRegOtpSent(false);
    setSmsSimulationAlert('');
  };

  // ================= 5. SUBMIT REGISTRATION =================
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');

    if (!regPhoneVerified) {
      setRegError('Please verify your phone number via OTP first.');
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
        phone: regForm.phone,
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
        .vta-auth-inp:focus {
          border-color: #FF6B35 !important;
          background: rgba(255,255,255,0.12) !important;
        }
      `}</style>

      <div
        style={{
          width: '100%',
          maxWidth: mode === 'register' ? 480 : 420,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 24,
          padding: '40px 36px',
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
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img
            src={LOGO_SRC}
            alt="VT Kindergarten Logo"
            style={{
              width: 90,
              height: 90,
              display: 'block',
              margin: '0 auto 14px',
              padding: 4,
              borderRadius: '50%',
              background: '#FFFFFF',
              objectFit: 'contain',
              boxShadow: '0 10px 28px rgba(255, 107, 53, 0.3)',
            }}
          />
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#FF6B35', margin: '0 0 4px', letterSpacing: -0.5 }}>
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
              marginBottom: 24,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setLoginError('');
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
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 20,
                fontSize: 12,
                color: '#E9D5FF',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 16 }}>👑</span>
              <div>
                Super Admin: <strong>superadmin@vtkindergarten.com</strong>
              </div>
            </div>

            {/* Email Address */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 6 }}>
                Admin Email Address
              </label>
              <input
                className="vta-auth-inp"
                type="email"
                placeholder="Enter email address"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                required
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1.5px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 12,
                  padding: '13px 16px',
                  color: '#FFFFFF',
                  fontSize: 14.5,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 6 }}>
                Password
              </label>
              <input
                className="vta-auth-inp"
                type="password"
                placeholder="Enter password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1.5px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 12,
                  padding: '13px 16px',
                  color: '#FFFFFF',
                  fontSize: 14.5,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

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
                padding: '15px',
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
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <span style={{ fontSize: 12.5, color: 'rgba(255, 255, 255, 0.55)' }}>
                New administrator?{' '}
              </span>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setRegError('');
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
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>🔐</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px', color: '#FFFFFF' }}>
                Two-Factor OTP Verification
              </h3>
              <p style={{ fontSize: 12.5, color: 'rgba(255, 255, 255, 0.7)', margin: 0, lineHeight: 1.4 }}>
                Enter the 6-digit OTP code sent to your registered mobile number:
                <br />
                <strong style={{ color: '#38BDF8' }}>
                  +91 ******{loginTargetAdmin?.phone ? String(loginTargetAdmin.phone).slice(-4) : '3839'}
                </strong>
              </p>
            </div>

            <form onSubmit={handleVerifyLoginOtp}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 6, textAlign: 'center' }}>
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
                    border: '2px solid rgba(255, 107, 53, 0.4)',
                    borderRadius: 14,
                    padding: '14px',
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
                  padding: '15px',
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
                  marginBottom: 14,
                }}
              >
                Verify OTP & Enter Admin Dashboard
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
                padding: '10px 14px',
                marginBottom: 18,
                fontSize: 12,
                color: '#FDE68A',
                lineHeight: 1.4,
              }}
            >
              ℹ️ <strong>Phone OTP Verification Required:</strong> After submitting, Super Admin (superadmin@vtkindergarten.com) must confirm your registration.
            </div>

            {/* Full Name */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 5 }}>
                Full Name <span style={{ color: '#FF6B35' }}>*</span>
              </label>
              <input
                className="vta-auth-inp"
                type="text"
                placeholder="Enter your full name"
                value={regForm.name}
                onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                required
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1.5px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 10,
                  padding: '11px 14px',
                  color: '#FFFFFF',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Email Address */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 5 }}>
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
                  padding: '11px 14px',
                  color: '#FFFFFF',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Phone Number with OTP verification block */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 5 }}>
                <span>Mobile Phone (10 Digits) <span style={{ color: '#FF6B35' }}>*</span></span>
                {regPhoneVerified && (
                  <span style={{ color: '#34D399', fontWeight: 800 }}>✅ Verified</span>
                )}
              </label>

              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="vta-auth-inp"
                  type="tel"
                  placeholder="9876543210"
                  maxLength={10}
                  value={regForm.phone}
                  disabled={regPhoneVerified}
                  onChange={(e) => {
                    setRegForm({ ...regForm, phone: formatPhone(e.target.value) });
                    setRegPhoneVerified(false);
                    setRegOtpSent(false);
                  }}
                  required
                  style={{
                    flex: 1,
                    background: regPhoneVerified ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.08)',
                    border: `1.5px solid ${regPhoneVerified ? '#10B981' : 'rgba(255, 255, 255, 0.15)'}`,
                    borderRadius: 10,
                    padding: '11px 14px',
                    color: '#FFFFFF',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontWeight: 700,
                  }}
                />

                {!regPhoneVerified && (
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
                    {regOtpSent ? 'Resend OTP' : '📲 Send OTP'}
                  </button>
                )}
              </div>

              {/* Sub-block for entering registration Phone OTP */}
              {regOtpSent && !regPhoneVerified && (
                <div
                  style={{
                    marginTop: 10,
                    background: 'rgba(255, 107, 53, 0.12)',
                    border: '1px solid rgba(255, 107, 53, 0.3)',
                    borderRadius: 10,
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#FFA149', marginBottom: 6 }}>
                    Enter 6-digit OTP sent to +91 {regForm.phone}:
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="6-digit OTP"
                      value={regEnteredOtp}
                      onChange={(e) => setRegEnteredOtp(e.target.value.replace(/\D/g, ''))}
                      style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 8,
                        padding: '8px 12px',
                        color: '#FFFFFF',
                        fontSize: 14,
                        fontWeight: 800,
                        letterSpacing: 2,
                        textAlign: 'center',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyRegPhoneOtp}
                      style={{
                        background: '#10B981',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 14px',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      Verify Phone
                    </button>
                  </div>
                  {regOtpError && (
                    <div style={{ color: '#F87171', fontSize: 11.5, fontWeight: 700, marginTop: 6 }}>
                      {regOtpError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 5 }}>
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
                  padding: '11px 14px',
                  color: '#FFFFFF',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 5 }}>
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
                  padding: '11px 14px',
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
                padding: '15px',
                fontSize: 14.5,
                fontWeight: 800,
                cursor: regPhoneVerified ? 'pointer' : 'not-allowed',
                boxShadow: regPhoneVerified ? '0 8px 24px rgba(255, 107, 53, 0.35)' : 'none',
              }}
            >
              {regLoading
                ? 'Registering Account...'
                : !regPhoneVerified
                ? 'Verify Phone with OTP to Register'
                : 'Submit Admin Registration'}
            </button>

            {/* Switch to Login link */}
            <div style={{ textAlign: 'center', marginTop: 18 }}>
              <span style={{ fontSize: 12.5, color: 'rgba(255, 255, 255, 0.55)' }}>
                Already have an account?{' '}
              </span>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setLoginError('');
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
                marginBottom: 24,
                fontSize: 13,
                color: '#FEF3C7',
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 13.5, color: '#FBBF24', marginBottom: 6 }}>
                ⏳ Status: PENDING SUPER ADMIN APPROVAL
              </div>
              <div>
                Your admin registration with verified mobile <strong>+91 {regForm.phone}</strong> has been successfully recorded.
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(254, 243, 199, 0.85)' }}>
                • Super Admin (<strong>superadmin@vtkindergarten.com</strong>) must review and confirm your registration before you can log in.
                <br />
                • Once approved, you can sign in using your email, password, and mobile OTP.
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setLoginForm({ email: regForm.email, password: '' });
                setLoginError('');
                setSmsSimulationAlert('');
              }}
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
              Return to Sign In
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
