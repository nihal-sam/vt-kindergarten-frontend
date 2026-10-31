import React, { useState, useEffect, useRef } from 'react';
import {
  SUPER_ADMIN_CREDENTIALS,
  verifyAdminCredentials,
  registerNewAdmin,
  approveAdmin,
  fetchRegisteredAdmins,
} from '../utils/adminAuth';
import { generateSessionId, acquireSessionLock } from '../utils/sessionLock';

const LOGO_SRC = '/assets/vt-logo.png';

/**
 * Generate a cryptographically random 5-character alphanumeric CAPTCHA code
 * (Excludes ambiguous characters 0/O, 1/I/l to avoid confusion)
 */
function generateCaptchaCode(length = 5) {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Modern, authentic security CAPTCHA component
 * Renders stylized canvas with noise lines, dots, angled colored characters + refresh button
 */
function CaptchaBox({ captchaCode, onRefresh, enteredValue, onChange }) {
  const canvasRef = useRef(null);
  const cleanEntered = (enteredValue || '').trim().toUpperCase();
  const cleanTarget = (captchaCode || '').toUpperCase();
  const isMatch = cleanEntered.length > 0 && cleanEntered === cleanTarget;
  const isLengthReached = cleanEntered.length >= cleanTarget.length;
  const isDirty = cleanEntered.length > 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Dark sleek gradient background
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#1E293B');
    grad.addColorStop(0.5, '#0F172A');
    grad.addColorStop(1, '#1E1B4B');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Decorative noise lines
    const lineColors = [
      'rgba(56, 189, 248, 0.35)',
      'rgba(255, 107, 53, 0.35)',
      'rgba(52, 211, 153, 0.35)',
      'rgba(167, 139, 250, 0.35)',
    ];
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = lineColors[i % lineColors.length];
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.random() * 20, Math.random() * height);
      ctx.bezierCurveTo(
        Math.random() * width,
        Math.random() * height,
        Math.random() * width,
        Math.random() * height,
        width - Math.random() * 20,
        Math.random() * height
      );
      ctx.stroke();
    }

    // Noise dots
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.25 + 0.08})`;
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw characters with distinct vibrant colors, shadow and slight rotation
    const charColors = ['#38BDF8', '#34D399', '#FBBF24', '#F472B6', '#A78BFA', '#FB923C'];
    const charSpacing = width / (captchaCode.length + 0.85);

    ctx.font = 'bold 22px "Plus Jakarta Sans", monospace';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < captchaCode.length; i++) {
      const char = captchaCode[i];
      const x = (i + 0.65) * charSpacing;
      const y = height / 2 + (Math.random() * 4 - 2);
      const angle = (Math.random() * 24 - 12) * (Math.PI / 180);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = charColors[i % charColors.length];
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 4;
      ctx.fillText(char, -7, 1);
      ctx.restore();
    }
  }, [captchaCode]);

  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: 'block',
          fontSize: 12,
          fontWeight: 700,
          color: 'rgba(255, 255, 255, 0.85)',
          marginBottom: 6,
        }}
      >
        Security Verification (CAPTCHA) <span style={{ color: '#FF6B35' }}>*</span>
      </label>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {/* Visual Canvas Display */}
        <div
          style={{
            borderRadius: 10,
            overflow: 'hidden',
            border: '1.5px solid rgba(255, 255, 255, 0.18)',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.5)',
            height: 44,
            display: 'flex',
            alignItems: 'center',
            background: '#0F172A',
          }}
          title="Security CAPTCHA Image - Enter these characters"
        >
          <canvas ref={canvasRef} width={128} height={44} style={{ display: 'block' }} />
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={onRefresh}
          title="Refresh / Generate New CAPTCHA"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1.5px solid rgba(255, 255, 255, 0.18)',
            color: '#38BDF8',
            borderRadius: 10,
            width: 44,
            height: 44,
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.15s ease',
          }}
        >
          🔄
        </button>

        {/* Input box with real-time match feedback */}
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            className="vta-auth-inp"
            type="text"
            maxLength={captchaCode.length}
            placeholder="Type code"
            value={enteredValue}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            required
            style={{
              width: '100%',
              background: isMatch
                ? 'rgba(16, 185, 129, 0.12)'
                : isLengthReached && !isMatch
                ? 'rgba(239, 68, 68, 0.12)'
                : 'rgba(255, 255, 255, 0.08)',
              border: `2px solid ${
                isMatch
                  ? '#10B981'
                  : isLengthReached && !isMatch
                  ? '#EF4444'
                  : 'rgba(255, 255, 255, 0.18)'
              }`,
              borderRadius: 10,
              padding: '11px 36px 11px 12px',
              color: isMatch ? '#34D399' : '#FFFFFF',
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: 3,
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s, background 0.2s',
            }}
          />
          {isDirty && (
            <span
              style={{
                position: 'absolute',
                right: 11,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 16,
              }}
            >
              {isMatch ? '✅' : isLengthReached ? '❌' : ''}
            </span>
          )}
        </div>
      </div>

      {isDirty && (
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            marginTop: 5,
            color: isMatch ? '#34D399' : isLengthReached ? '#F87171' : 'rgba(255, 255, 255, 0.6)',
          }}
        >
          {isMatch
            ? '✅ CAPTCHA verified correctly'
            : isLengthReached
            ? '❌ Incorrect code. Click 🔄 to refresh if unclear.'
            : `Enter all ${captchaCode.length} characters (case-insensitive)`}
        </div>
      )}
    </div>
  );
}

export default function LoginPage({ onLocalLogin }) {
  // Mode: 'login' | 'register' | 'register_success'
  const [mode, setMode] = useState('login');

  // Login Form State (Always blank by default - no prefill box)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isAlreadyLoggedIn, setIsAlreadyLoggedIn] = useState(false);
  const [pendingAdmin, setPendingAdmin] = useState(null);
  const [pendingLoading, setPendingLoading] = useState(false);

  // Login CAPTCHA State
  const [loginCaptchaCode, setLoginCaptchaCode] = useState(() => generateCaptchaCode(5));
  const [loginEnteredCaptcha, setLoginEnteredCaptcha] = useState('');

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

  // Register CAPTCHA State
  const [regCaptchaCode, setRegCaptchaCode] = useState(() => generateCaptchaCode(5));
  const [regEnteredCaptcha, setRegEnteredCaptcha] = useState('');

  // Helpers
  const formatPhone = (val = '') => String(val).replace(/\D/g, '').slice(0, 10);

  const refreshLoginCaptcha = () => {
    setLoginCaptchaCode(generateCaptchaCode(5));
    setLoginEnteredCaptcha('');
  };

  const refreshRegCaptcha = () => {
    setRegCaptchaCode(generateCaptchaCode(5));
    setRegEnteredCaptcha('');
  };

  // ================= 1. SUBMIT LOGIN (CREDENTIALS + CAPTCHA) =================
  // Supports both Super Admin and Normal Admin automatically
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    setIsAlreadyLoggedIn(false);
    setPendingAdmin(null);

    // 1. Validate CAPTCHA
    if (loginEnteredCaptcha.trim().toUpperCase() !== loginCaptchaCode.toUpperCase()) {
      setLoginError('❌ Incorrect CAPTCHA security code. Please check and try again.');
      refreshLoginCaptcha();
      setLoginLoading(false);
      return;
    }

    try {
      const emailTrimmed = loginForm.email.trim();
      // Generate a fresh session ID on every login attempt (never reuse cloned IDs)
      const currentSessionId = generateSessionId();
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem('vt_session_id', currentSessionId);
      }

      const res = await verifyAdminCredentials(emailTrimmed, loginForm.password);

      if (res.status === 'ok') {
        // Automatically handles Super Admin or Approved Normal Admin!
        await acquireSessionLock(emailTrimmed, res.isSuperAdmin, currentSessionId);
        setLoginLoading(false);
        onLocalLogin?.(res.admin);
        return;
      }

      if (res.status === 'already_logged_in') {
        setIsAlreadyLoggedIn(true);
        setLoginError(res.error || 'This account is currently active on another device or window.');
        refreshLoginCaptcha();
        setLoginLoading(false);
        return;
      }

      if (res.status === 'rate_limited') {
        setLoginError(res.error || 'Too many failed login attempts. Temporarily locked for security.');
        refreshLoginCaptcha();
        setLoginLoading(false);
        return;
      }

      if (res.status === 'invalid_credentials') {
        setLoginError(res.error || 'Invalid email or password.');
        refreshLoginCaptcha();
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
        refreshLoginCaptcha();
        setLoginLoading(false);
        return;
      }
    } catch (err) {
      setLoginError('Connection failed. Please check your network.');
    } finally {
      setLoginLoading(false);
    }
  };

  // ================= 2. INSTANT APPROVAL FOR DEMO / TESTING =================
  const handleInstantApproveAndLogin = async () => {
    if (!pendingAdmin) return;
    setPendingLoading(true);
    try {
      await approveAdmin(pendingAdmin.id || pendingAdmin.email);
      const approvedAdmin = { ...pendingAdmin, status: 'approved', isSuperAdmin: false };
      onLocalLogin?.(approvedAdmin);
    } catch (err) {
      setLoginError('Failed to approve admin account. Please try again.');
    } finally {
      setPendingLoading(false);
    }
  };

  // ================= 3. SUBMIT REGISTRATION (DETAILS + CAPTCHA) =================
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');

    const cleanPhone = formatPhone(regForm.phone);
    if (cleanPhone.length !== 10) {
      setRegError('Please enter a valid 10-digit mobile number.');
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

    // Validate CAPTCHA
    if (regEnteredCaptcha.trim().toUpperCase() !== regCaptchaCode.toUpperCase()) {
      setRegError('❌ Incorrect CAPTCHA security code. Please check and try again.');
      refreshRegCaptcha();
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
        refreshRegCaptcha();
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
          <h1
            style={{
              fontSize: 23,
              fontWeight: 900,
              color: '#FF6B35',
              margin: '0 0 3px',
              letterSpacing: -0.5,
            }}
          >
            VT Kindergarten
          </h1>
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.65)',
              fontSize: 13,
              margin: 0,
              fontWeight: 600,
            }}
          >
            Official Administrator Portal
          </p>
        </div>

        {/* Mode Switcher Tabs (2 Tabs: Admin Login & Register Admin) */}
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
                refreshLoginCaptcha();
              }}
              style={{
                background:
                  mode === 'login'
                    ? 'linear-gradient(135deg, #FF6B35, #FFA149)'
                    : 'transparent',
                color: mode === 'login' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
                border: 'none',
                borderRadius: 9,
                padding: '10px 14px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              🔑 Admin Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setRegError('');
                refreshRegCaptcha();
              }}
              style={{
                background:
                  mode === 'register'
                    ? 'linear-gradient(135deg, #FF6B35, #FFA149)'
                    : 'transparent',
                color: mode === 'register' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
                border: 'none',
                borderRadius: 9,
                padding: '10px 14px',
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
            MODE 1: UNIFIED ADMIN LOGIN (Super Admin & Normal Admin)
            ============================================================== */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            {/* Top Alert: Blocked Active Session or Error Banner */}
            {isAlreadyLoggedIn ? (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '2px solid #EF4444',
                  borderRadius: 14,
                  padding: '16px',
                  marginBottom: 18,
                  boxShadow: '0 8px 24px rgba(239, 68, 68, 0.28)',
                  animation: 'fadeIn 0.25s ease-in-out',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ fontSize: 24, lineHeight: 1 }}>🚫</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, color: '#FCA5A5', fontSize: 13, marginBottom: 5, letterSpacing: 0.2 }}>
                      ACCESS BLOCKED — ACTIVE SESSION EXISTS
                    </div>
                    <div style={{ lineHeight: 1.5, fontSize: 13, color: '#FFFFFF', fontWeight: 600 }}>
                      {loginError}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.4 }}>
                      🔒 Security Policy: Only one active session is allowed at a time. To log in from this window, please close the tab or sign out from the other active device first.
                    </div>
                  </div>
                </div>
              </div>
            ) : loginError ? (
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>⚠️</span>
                <span>{loginError}</span>
              </div>
            ) : null}

            {/* Email Address */}
            <div style={{ marginBottom: 15 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: 'rgba(255, 255, 255, 0.85)',
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
                  color: 'rgba(255, 255, 255, 0.85)',
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

            {/* CAPTCHA Security Verification Box */}
            <CaptchaBox
              captchaCode={loginCaptchaCode}
              onRefresh={refreshLoginCaptcha}
              enteredValue={loginEnteredCaptcha}
              onChange={setLoginEnteredCaptcha}
            />

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
                    onClick={handleInstantApproveAndLogin}
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
                    {pendingLoading ? 'Approving...' : '👑 1-Click Approve & Log In Directly'}
                  </button>
                </div>
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
                  refreshRegCaptcha();
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
                Register Admin Account
              </button>
            </div>
          </form>
        )}

        {/* ==============================================================
            MODE 2: REGISTER AS ADMIN (CAPTCHA VERIFICATION)
            ============================================================== */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit}>
            {/* Info Notice */}
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 15,
                fontSize: 12,
                color: '#BAE6FD',
                lineHeight: 1.4,
              }}
            >
              🛡️ <strong>New Admin Registration:</strong> Fill out details and complete the CAPTCHA
              security check below. Super Admin confirms your registration.
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

            {/* Mobile Phone (10 Digits) */}
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
                Mobile Phone (10 Digits) <span style={{ color: '#FF6B35' }}>*</span>
              </label>
              <input
                className="vta-auth-inp"
                type="tel"
                placeholder="e.g. 9994994291"
                maxLength={10}
                value={regForm.phone}
                onChange={(e) =>
                  setRegForm({ ...regForm, phone: formatPhone(e.target.value) })
                }
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
                  fontWeight: 700,
                }}
              />
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
                onChange={(e) =>
                  setRegForm({ ...regForm, confirmPassword: e.target.value })
                }
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

            {/* Security CAPTCHA Check */}
            <CaptchaBox
              captchaCode={regCaptchaCode}
              onRefresh={refreshRegCaptcha}
              enteredValue={regEnteredCaptcha}
              onChange={setRegEnteredCaptcha}
            />

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
              {regLoading ? 'Registering Account...' : 'Submit Admin Registration'}
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
                  refreshLoginCaptcha();
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
            MODE 3: REGISTRATION SUCCESS CONFIRMATION
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
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 13.5,
                  color: '#FBBF24',
                  marginBottom: 6,
                }}
              >
                ⏳ Status: PENDING SUPER ADMIN APPROVAL
              </div>
              <div>
                Your admin registration for <strong>{regForm.email}</strong> with mobile{' '}
                <strong style={{ color: '#FDE68A' }}>+91 {regForm.phone}</strong> has been successfully
                submitted to the system!
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(254, 243, 199, 0.9)' }}>
                • Super Admin will review and confirm your registration.
                <br />
                • Once approved, you can sign in directly with your email, password, and CAPTCHA.
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setLoginForm({ email: '', password: '' });
                setLoginError('');
                setPendingAdmin(null);
                refreshLoginCaptcha();
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
        )}
      </div>
    </div>
  );
}
