/**
 * SMS Gateway Service for VT Kindergarten
 * Integrates Fast2SMS Dev API with user's authorization key
 */

const DEFAULT_FAST2SMS_KEY = 'Dvy35RsjXA0vTNWj044U6BwAvk3NJTqljj1eWcNzJWBdEDZLRvj5idmx1NtvTnX0kpwLhQFsUlW2vwoV';

export function getStoredSmsConfig() {
  return {
    provider: localStorage.getItem('vt_sms_provider') || 'fast2sms',
    apiKey: localStorage.getItem('vt_sms_api_key') || DEFAULT_FAST2SMS_KEY,
  };
}

export function saveSmsConfig({ provider = 'fast2sms', apiKey = '' }) {
  localStorage.setItem('vt_sms_provider', provider);
  localStorage.setItem('vt_sms_api_key', apiKey.trim() || DEFAULT_FAST2SMS_KEY);
}

/**
 * Fetch Fast2SMS wallet balance & account status
 */
export async function fetchFast2SmsWallet(apiKey = DEFAULT_FAST2SMS_KEY) {
  try {
    const res = await fetch(`https://www.fast2sms.com/dev/wallet?authorization=${encodeURIComponent(apiKey)}`);
    const data = await res.json();
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Dispatch real carrier phone SMS using Fast2SMS gateway
 */
export async function dispatchPhoneSms({ phone, otp }) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  const config = getStoredSmsConfig();
  const apiKey = config.apiKey || DEFAULT_FAST2SMS_KEY;

  const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
    `Your VT Kindergarten Security OTP code is ${otp}. Valid for 10 minutes. Please enter this code in the portal to verify.`
  )}`;

  console.info(`[VT-SMS-GATEWAY] Dispatching 6-digit OTP to +91 ${cleanPhone}`);

  try {
    // 1. Primary: Fast2SMS OTP Route
    const otpUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(
      apiKey
    )}&route=otp&numbers=${cleanPhone}&variables_values=${otp}`;

    const res = await fetch(otpUrl, { method: 'GET' });
    const json = await res.json();

    if (json.return === true || json.status_code === 200) {
      console.info(`[VT-SMS-GATEWAY] ✅ Carrier SMS successfully delivered to +91 ${cleanPhone}!`);
      return {
        success: true,
        statusCode: 200,
        method: 'carrier_sms',
        message: `✅ Carrier SMS with 6-digit OTP delivered to +91 ${cleanPhone}.`,
        whatsappUrl,
      };
    } else {
      console.warn('Fast2SMS response:', json);
      // Status code 996: Fast2SMS Website Verification / Aadhaar KYC required
      if (json.status_code === 996) {
        return {
          success: false,
          statusCode: 996,
          method: 'kyc_required',
          message:
            'Fast2SMS requires website verification / Aadhaar KYC before delivering live cellular SMS.',
          rawMessage: json.message,
          whatsappUrl,
        };
      }
      // Status code 999: ₹100 minimum recharge required
      if (json.status_code === 999) {
        return {
          success: false,
          statusCode: 999,
          method: 'recharge_required',
          message:
            'Fast2SMS requires a minimum ₹100 transaction to activate external API routing.',
          rawMessage: json.message,
          whatsappUrl,
        };
      }
      return {
        success: false,
        statusCode: json.status_code || 400,
        method: 'carrier_error',
        message: json.message || 'Fast2SMS dispatch pending account verification.',
        rawMessage: json.message,
        whatsappUrl,
      };
    }
  } catch (err) {
    console.warn('Fast2SMS fetch error (browser CORS or network):', err);
    return {
      success: false,
      statusCode: 0,
      method: 'network_fallback',
      message: 'Network error contacting Fast2SMS gateway.',
      whatsappUrl,
    };
  }
}
