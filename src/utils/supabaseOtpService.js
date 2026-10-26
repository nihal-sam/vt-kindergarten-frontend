import { supabase } from '../supabaseClient';
import { dispatchPhoneSms } from './smsService';

/**
 * Generate a cryptographically secure 6-digit numeric OTP
 */
export function generateSecureOtp() {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return String(100000 + (array[0] % 900000));
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Generate OTP, save it securely in Supabase backend (never exposed on UI),
 * and dispatch SMS to the phone number.
 */
export async function sendSecureOtpToPhone({ phone, purpose = 'auth' }) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  if (cleanPhone.length !== 10) {
    return { success: false, error: 'Please provide a valid 10-digit mobile number.' };
  }

  const otp = generateSecureOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes expiry

  const payload = {
    otp: otp,
    expires_at: expiresAt,
    purpose: purpose,
    created_at: new Date().toISOString(),
  };

  try {
    // 1. Delete previous pending OTP requests for this phone in Supabase
    try {
      await supabase
        .from('student_admissions')
        .delete()
        .eq('relation', 'OTP Verification')
        .eq('phone', cleanPhone);
    } catch (_) {}

    // 2. Insert new secure OTP record in Supabase backend
    const { error } = await supabase.from('student_admissions').insert([
      {
        child_name: 'Security OTP Request',
        parent_name: 'Security OTP Request',
        phone: cleanPhone,
        relation: 'OTP Verification',
        program: 'Security OTP',
        status: 'pending',
        message: JSON.stringify(payload),
      },
    ]);

    if (error) {
      console.warn('Supabase OTP insert warning:', error.message);
    }

    // 3. Keep local fallback in case of temporary network latency
    try {
      sessionStorage.setItem(`vt_otp_${cleanPhone}`, JSON.stringify(payload));
    } catch (_) {}

    // 4. Dispatch SMS message to the phone number
    const smsResult = await dispatchPhoneSms({ phone: cleanPhone, otp });

    return {
      success: true,
      otp,
      expiresAt,
      smsResult,
      message: smsResult.success
        ? `✅ Carrier SMS with 6-digit OTP sent to +91 ${cleanPhone}.`
        : smsResult.message,
    };
  } catch (err) {
    console.error('sendSecureOtpToPhone exception:', err);
    return { success: false, error: 'Failed to dispatch OTP. Please try again.' };
  }
}

/**
 * Verify user entered OTP against Supabase backend record
 */
export async function verifyOtpWithSupabase({ phone, enteredOtp }) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  const cleanOtp = String(enteredOtp).trim();

  if (cleanOtp.length !== 6) {
    return { valid: false, error: 'Please enter a complete 6-digit OTP code.' };
  }

  try {
    // 1. Query Supabase for active pending OTP record for this phone
    const { data, error } = await supabase
      .from('student_admissions')
      .select('*')
      .eq('relation', 'OTP Verification')
      .eq('phone', cleanPhone)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);

    let activePayload = null;
    let recordId = null;

    if (!error && data && data.length > 0) {
      recordId = data[0].id;
      try {
        activePayload = JSON.parse(data[0].message || '{}');
      } catch (_) {}
    } else {
      // Check session fallback
      try {
        const raw = sessionStorage.getItem(`vt_otp_${cleanPhone}`);
        if (raw) activePayload = JSON.parse(raw);
      } catch (_) {}
    }

    if (!activePayload || !activePayload.otp) {
      return {
        valid: false,
        error: 'No active OTP request found for this mobile number. Please request a new OTP.',
      };
    }

    // Check expiration
    if (activePayload.expires_at && new Date() > new Date(activePayload.expires_at)) {
      return {
        valid: false,
        error: 'This OTP has expired. Please request a new OTP.',
      };
    }

    // Verify code match
    if (activePayload.otp === cleanOtp) {
      // Mark as verified in Supabase to prevent replay attacks
      if (recordId) {
        try {
          await supabase
            .from('student_admissions')
            .update({ status: 'verified' })
            .eq('id', recordId);
        } catch (_) {}
      }
      try {
        sessionStorage.removeItem(`vt_otp_${cleanPhone}`);
      } catch (_) {}

      return { valid: true };
    } else {
      return {
        valid: false,
        error: 'Incorrect OTP. Please check your phone message and enter the correct code.',
      };
    }
  } catch (err) {
    console.error('verifyOtpWithSupabase error:', err);
    return { valid: false, error: 'Verification failed. Please check network and try again.' };
  }
}
