import { supabase } from '../supabaseClient.js';
import { ensureAuthenticatedSession } from './adminAuth.js';

/**
 * Dedicated Fee Receipts API Service
 * Handles fetching, creating, updating, and deleting fee receipts
 * Primary endpoint: /rest/v1/fee_receipts
 */

// Helper to normalize receipt data from DB into standard format
export function normalizeReceipt(row = {}) {
  let extra = {};
  if (row.message && typeof row.message === 'string' && row.message.startsWith('{')) {
    try {
      extra = JSON.parse(row.message);
    } catch (_) {}
  }

  const numericAmt = row.amount !== undefined && row.amount !== null
    ? String(row.amount)
    : String(extra.amount || extra.total || '0.00');

  return {
    id: row.id,
    created_at: row.created_at,
    receiptNo: row.receipt_no || extra.receipt_no || extra.receiptNo || `VT-${row.id}`,
    studentName: row.student_name || row.child_name || extra.student_name || extra.studentName || '-',
    className: row.class_name || row.program || extra.class_name || extra.className || 'Play Group',
    description: row.description || extra.description || 'Tuition fees',
    period: row.period || extra.period || '-',
    amount: numericAmt,
    total: row.total !== undefined && row.total !== null ? String(row.total) : numericAmt,
    amountInWords: row.amount_in_words || extra.amount_in_words || extra.amountInWords || '',
    paymentDate: row.payment_date || extra.payment_date || (row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
    paymentMethod: row.payment_method || extra.payment_method || extra.paymentMethod || 'ONLINE (UPI)',
    formattedDate: row.formatted_date || extra.formatted_date || extra.formattedDate || '',
    parentPhone: row.parent_phone || row.phone || extra.parent_phone || extra.parentPhone || '',
    status: row.status || 'paid',
  };
}

/**
 * Fetch all fee receipts from dedicated fee_receipts API (with backward compatibility fallback)
 */
export async function fetchFeeReceipts() {
  try {
    await ensureAuthenticatedSession();

    // 1. Primary: Dedicated fee_receipts table
    const { data: dedicatedData, error: dedicatedErr } = await supabase
      .from('fee_receipts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!dedicatedErr && dedicatedData) {
      const parsed = dedicatedData.map(normalizeReceipt);
      try {
        localStorage.setItem('vt_saved_receipts', JSON.stringify(parsed));
      } catch (_) {}
      return { success: true, receipts: parsed, source: 'fee_receipts' };
    }

    // 2. Fallback: Legacy student_admissions table
    const { data: legacyData, error: legacyErr } = await supabase
      .from('student_admissions')
      .select('*')
      .eq('relation', 'Fee Receipt')
      .order('created_at', { ascending: false });

    if (!legacyErr && legacyData) {
      const parsed = legacyData.map(normalizeReceipt);
      try {
        localStorage.setItem('vt_saved_receipts', JSON.stringify(parsed));
      } catch (_) {}
      return { success: true, receipts: parsed, source: 'student_admissions' };
    }

    // 3. Fallback: Cached localStorage
    const saved = localStorage.getItem('vt_saved_receipts');
    return {
      success: true,
      receipts: saved ? JSON.parse(saved) : [],
      source: 'cache',
    };
  } catch (err) {
    console.error('fetchFeeReceipts error:', err);
    const saved = localStorage.getItem('vt_saved_receipts');
    return {
      success: false,
      receipts: saved ? JSON.parse(saved) : [],
      error: err.message,
    };
  }
}

/**
 * Save or record a new fee receipt in the dedicated fee_receipts API
 */
export async function saveFeeReceipt(receiptData) {
  try {
    await ensureAuthenticatedSession();

    const rawAmt = String(receiptData.formattedAmount || receiptData.amount || '0').replace(/[^0-9.]/g, '');
    const numericAmt = parseFloat(rawAmt) || 0;
    const nowIso = new Date().toISOString();
    const todayDate = nowIso.split('T')[0];

    const cleanReceipt = {
      receipt_no: receiptData.receiptNo,
      student_name: receiptData.studentName || 'Student',
      class_name: receiptData.effectiveClass || receiptData.className || 'Play Group',
      description: receiptData.description || 'Tuition fees',
      period: receiptData.period || '-',
      amount: numericAmt,
      total: numericAmt,
      amount_in_words: receiptData.amountInWords || '',
      payment_date: receiptData.paymentDate || todayDate,
      payment_method: receiptData.paymentMethod || 'ONLINE (UPI)',
      formatted_date: receiptData.formattedDate || '',
      parent_phone: (receiptData.parentPhone || '').trim() || '7358293839',
      status: 'paid',
    };

    // 1. Primary: Save to dedicated fee_receipts API table
    const { data: dedicatedData, error: dedicatedErr } = await supabase
      .from('fee_receipts')
      .insert([cleanReceipt])
      .select();

    if (!dedicatedErr && dedicatedData && dedicatedData[0]) {
      return {
        success: true,
        receipt: normalizeReceipt(dedicatedData[0]),
        source: 'fee_receipts',
      };
    }

    // 2. Fallback: Legacy student_admissions table
    const legacyPayload = {
      type: 'fee_receipt',
      ...cleanReceipt,
      formattedAmount: String(numericAmt),
    };

    const { data: legacyData, error: legacyErr } = await supabase
      .from('student_admissions')
      .insert([{
        child_name: cleanReceipt.student_name,
        program: cleanReceipt.class_name,
        parent_name: cleanReceipt.student_name,
        relation: 'Fee Receipt',
        status: 'paid',
        phone: cleanReceipt.parent_phone,
        message: JSON.stringify(legacyPayload),
      }])
      .select();

    if (!legacyErr && legacyData && legacyData[0]) {
      return {
        success: true,
        receipt: normalizeReceipt(legacyData[0]),
        source: 'student_admissions',
      };
    }

    throw new Error(dedicatedErr?.message || legacyErr?.message || 'Failed to save receipt to API');
  } catch (err) {
    console.error('saveFeeReceipt error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Delete a fee receipt by ID or Receipt Number from dedicated fee_receipts API
 */
export async function deleteFeeReceipt(id, receiptNo = '') {
  try {
    await ensureAuthenticatedSession();

    // 1. Delete from dedicated fee_receipts
    try {
      if (id && !String(id).startsWith('local_')) {
        await supabase.from('fee_receipts').delete().eq('id', id);
      }
      if (receiptNo) {
        await supabase.from('fee_receipts').delete().eq('receipt_no', receiptNo);
      }
    } catch (_) {}

    // 2. Also delete from legacy student_admissions
    try {
      if (id && !String(id).startsWith('local_')) {
        await supabase.from('student_admissions').delete().eq('id', id);
      }
    } catch (_) {}

    return { success: true };
  } catch (err) {
    console.error('deleteFeeReceipt error:', err);
    return { success: false, error: err.message };
  }
}
