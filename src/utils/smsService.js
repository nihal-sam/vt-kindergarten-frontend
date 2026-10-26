/**
 * SMS Gateway Service for VT Kindergarten
 * Supports:
 * 1. Fast2SMS Quick OTP API (Direct SIM delivery)
 * 2. 2Factor.in OTP API
 * 3. Native Phone SMS Messages trigger (`sms:+91...`)
 * 4. WhatsApp instant delivery
 */

const DEFAULT_SMS_KEY = localStorage.getItem('vt_sms_api_key') || '';

export function getStoredSmsConfig() {
  return {
    provider: localStorage.getItem('vt_sms_provider') || 'fast2sms',
    apiKey: localStorage.getItem('vt_sms_api_key') || '',
  };
}

export function saveSmsConfig({ provider = 'fast2sms', apiKey = '' }) {
  localStorage.setItem('vt_sms_provider', provider);
  localStorage.setItem('vt_sms_api_key', apiKey.trim());
}

/**
 * Dispatch real phone SMS or trigger native phone SMS app
 */
export async function dispatchPhoneSms({ phone, otp }) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  const config = getStoredSmsConfig();

  // 1. If user configured a Fast2SMS or 2Factor API key, attempt direct network delivery
  if (config.apiKey) {
    try {
      if (config.provider === 'fast2sms') {
        const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(
          config.apiKey
        )}&route=otp&numbers=${cleanPhone}&variables_values=${otp}`;

        const res = await fetch(url, { method: 'GET' });
        const json = await res.json();
        if (json.return === true || json.status_code === 200) {
          return {
            success: true,
            method: 'carrier_sms',
            message: `✅ Real SMS successfully sent to +91 ${cleanPhone} via Fast2SMS gateway!`,
          };
        } else {
          console.warn('Fast2SMS returned error:', json);
          return {
            success: false,
            method: 'carrier_sms_error',
            message: json.message?.[0] || 'Fast2SMS dispatch failed. Check API key/balance.',
          };
        }
      } else if (config.provider === 'twofactor') {
        const url = `https://2factor.in/API/V1/${encodeURIComponent(
          config.apiKey
        )}/SMS/${cleanPhone}/${otp}/`;

        const res = await fetch(url, { method: 'GET' });
        const json = await res.json();
        if (json.Status === 'Success') {
          return {
            success: true,
            method: 'carrier_sms',
            message: `✅ Real SMS successfully sent to +91 ${cleanPhone} via 2Factor gateway!`,
          };
        }
      }
    } catch (err) {
      console.warn('Direct carrier SMS network exception:', err);
    }
  }

  // Fallback: Ready for Native Phone SMS app or WhatsApp
  return {
    success: true,
    method: 'client_ready',
    message: `OTP ${otp} generated for +91 ${cleanPhone}. Ready to send to phone message!`,
  };
}

/**
 * Open native phone messaging app with pre-filled SMS
 */
export function openNativePhoneSms(phone, otp) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  const message = `Your VT Kindergarten Admin Verification OTP is: ${otp}. Valid for 5 minutes.`;
  // Use standard sms URI scheme for mobile phones and Windows Phone Link
  const separator = navigator.userAgent.match(/iPhone|iPad|iPod/i) ? '&' : '?';
  const url = `sms:+91${cleanPhone}${separator}body=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

/**
 * Open WhatsApp with pre-filled message
 */
export function openWhatsAppSms(phone, otp) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  const message = `VT Kindergarten Admin Portal OTP Verification Code: *${otp}*. Valid for 5 minutes.`;
  window.open(`https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodeURIComponent(message)}`, '_blank');
}
