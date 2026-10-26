import React, { useState, useRef, useEffect, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { supabase } from '../supabaseClient';
import { ensureAuthenticatedSession } from '../utils/adminAuth';
import { ICON_EMAIL_B64, ICON_PHONE_B64 } from './receiptIcons';

// Helper: Convert Number to Indian Currency Words
export function numberToWordsINR(num) {
  const n = Math.floor(Number(num) || 0);
  if (n === 0) return 'Zero Rupees only.';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(val) {
    if (val < 20) return ones[val];
    const t = tens[Math.floor(val / 10)];
    const o = ones[val % 10];
    return [t, o].filter(Boolean).join(' ');
  }

  function convertThreeDigits(val) {
    const h = Math.floor(val / 100);
    const rest = val % 100;
    const parts = [];
    if (h > 0) parts.push(ones[h] + ' Hundred');
    if (rest > 0) parts.push(convertTwoDigits(rest));
    return parts.join(' ');
  }

  const crores = Math.floor(n / 10000000);
  const lakhs = Math.floor((n % 10000000) / 100000);
  const thousands = Math.floor((n % 100000) / 1000);
  const hundreds = n % 1000;

  const result = [];
  if (crores > 0) result.push(convertTwoDigits(crores) + ' Crore');
  if (lakhs > 0) result.push(convertTwoDigits(lakhs) + ' Lakh');
  if (thousands > 0) result.push(convertTwoDigits(thousands) + ' Thousand');
  if (hundreds > 0) result.push(convertThreeDigits(hundreds));

  return result.join(' ') + ' Rupees only.';
}

// Helper: Format Date with Ordinal Suffix (e.g. October 9th, 2026)
export function formatOrdinalDate(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const month = months[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();

  let suffix = 'th';
  if (day === 1 || day === 21 || day === 31) suffix = 'st';
  else if (day === 2 || day === 22) suffix = 'nd';
  else if (day === 3 || day === 23) suffix = 'rd';

  return `${month} ${day}${suffix}, ${year}`;
}

const CLASS_OPTIONS = [
  { label: 'Play Group', code: 'PG' },
  { label: 'Pre-KG', code: 'PKG' },
  { label: 'LKG', code: 'LKG' },
  { label: 'UKG', code: 'UKG' },
  { label: 'Day Care', code: 'DC' },
  { label: 'Activity & Tuition', code: 'ACT' },
  { label: 'Other', code: 'OTH' },
];

const PAYMENT_METHODS = [
  'ONLINE (UPI)',
  'CASH',
  'CARD',
  'NET BANKING',
  'CHEQUE',
];

const FEE_TYPES = [
  'Tuition fees',
  'Admission fee',
  'Term fee',
  'Books & Uniform',
  'Annual Day fee',
  'Day Care fee',
];

// Official Receipt Card Component matching 2026_10_VTPG_3 (1).pdf
function ReceiptCard({ receipt, innerRef }) {
  if (!receipt) return null;

  const amountNum = parseFloat(receipt.amount) || 0;
  const formattedAmount = amountNum > 0 ? amountNum.toFixed(2) : '0.00';
  const amountWords = receipt.amountInWords || numberToWordsINR(amountNum);
  const formattedDate = receipt.formattedDate || formatOrdinalDate(receipt.paymentDate);
  const effectiveClass = receipt.className === 'Other' && receipt.customClass ? receipt.customClass : receipt.className;

  return (
    <div
      id="vt-fee-receipt-card"
      ref={innerRef}
      style={{
        width: '100%',
        maxWidth: 640,
        background: '#FFFFFF',
        border: '2px solid #000000',
        borderRadius: 4,
        padding: '24px 28px 20px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: '#000000',
        boxSizing: 'border-box',
        userSelect: 'text',
        margin: '0 auto',
      }}
    >
      {/* 1. Header with Logo, School Name & Subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ width: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <img
            src="/assets/receipt/receipt_logo.png"
            alt="VT Pre School Logo"
            style={{ width: 85, height: 'auto', display: 'block' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/assets/vt-logo.png';
            }}
          />
        </div>
        <div style={{ flex: 1, textAlign: 'center', paddingRight: 40 }}>
          <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: 1, lineHeight: 1, color: '#000000' }}>
            VT
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: 0.5, lineHeight: 1.2, color: '#1A1A1A', marginTop: 4, fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }}>
            Kindergarten
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, marginTop: 8, color: '#000000' }}>
            FEES RECEIPT
          </div>
        </div>
      </div>

      {/* 2. Address & Contact Bar (3 columns with borders) */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: '1.5px solid #000000',
          borderBottom: 'none',
          tableLayout: 'fixed',
          boxSizing: 'border-box',
          margin: 0,
          background: '#FFFFFF',
        }}
      >
        <tbody>
          <tr>
            <td
              style={{
                width: '38%',
                borderRight: '1.5px solid #000000',
                padding: '6px 8px',
                verticalAlign: 'middle',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ fontSize: 10.5, fontWeight: 500, color: '#000000', lineHeight: 1.4, textAlign: 'left' }}>
                <div style={{ whiteSpace: 'nowrap' }}>Address: No 11, Subramaniyapuram</div>
                <div style={{ whiteSpace: 'nowrap' }}>7th street, South extension, Karaikudi-2</div>
              </div>
            </td>
            <td
              style={{
                width: '37%',
                borderRight: '1.5px solid #000000',
                padding: '5px 6px',
                verticalAlign: 'middle',
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={ICON_EMAIL_B64}
                  alt="Email"
                  style={{ width: 16, height: 11, display: 'block', margin: '0 auto 3px auto' }}
                />
                <div style={{ fontSize: 11, fontWeight: 500, color: '#000000', whiteSpace: 'nowrap', textAlign: 'center' }}>
                  vtkindergarten@gmail.com
                </div>
              </div>
            </td>
            <td
              style={{
                width: '25%',
                padding: '5px 6px',
                verticalAlign: 'middle',
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={ICON_PHONE_B64}
                  alt="Phone"
                  style={{ width: 14, height: 14, display: 'block', margin: '0 auto 2px auto' }}
                />
                <div style={{ fontSize: 11.5, fontWeight: 600, color: '#000000', whiteSpace: 'nowrap', textAlign: 'center' }}>
                  73-58-29-3839
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 3. Student Details & Receipt No Box (2 columns) */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: '1.5px solid #000000',
          borderBottom: 'none',
          tableLayout: 'fixed',
          boxSizing: 'border-box',
          margin: 0,
          background: '#FFFFFF',
          fontSize: 13,
        }}
      >
        <tbody>
          <tr>
            <td
              style={{
                width: '54%',
                borderRight: '1.5px solid #000000',
                padding: '8px 12px',
                verticalAlign: 'top',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 13.5 }}>Student Details:</div>
              <div style={{ marginBottom: 10, display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, width: 75 }}>Name :</span>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{receipt.studentName || '-'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, width: 75 }}>Class :</span>
                <span style={{ fontWeight: 600 }}>{effectiveClass || '-'}</span>
              </div>
            </td>
            <td
              style={{
                width: '46%',
                padding: 0,
                verticalAlign: 'top',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ padding: '6px 12px', borderBottom: '1.5px solid #000000' }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Receipt No:</div>
                <div style={{ fontWeight: 600, fontSize: 13, marginTop: 4 }}>{receipt.receiptNo || '-'}</div>
              </div>
              <div style={{ padding: '6px 12px' }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Payment Month</div>
                <div style={{ fontWeight: 600, fontSize: 13, marginTop: 4 }}>{receipt.period || '-'}</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 4. Fees Grid Table */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: '1.5px solid #000000',
          borderBottom: 'none',
          tableLayout: 'fixed',
          margin: 0,
          boxSizing: 'border-box',
        }}
      >
        <thead>
          <tr>
            <th style={{ width: '45%', borderRight: '1.5px solid #000000', borderBottom: '1.5px solid #000000', padding: '8px 12px', fontSize: 13, color: '#0284C7', fontWeight: 700, textAlign: 'left' }}>Description</th>
            <th style={{ width: '30%', borderRight: '1.5px solid #000000', borderBottom: '1.5px solid #000000', padding: '8px 12px', fontSize: 13, color: '#0284C7', fontWeight: 700, textAlign: 'left' }}>Period</th>
            <th style={{ width: '25%', borderBottom: '1.5px solid #000000', padding: '8px 12px', fontSize: 13, color: '#0284C7', fontWeight: 700, textAlign: 'right' }}>Amount in INR</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ borderRight: '1.5px solid #000000', borderBottom: '1.5px solid #000000', padding: '8px 12px', fontSize: 13, fontWeight: 500, height: 28 }}>{receipt.description || 'Tuition fees'}</td>
            <td style={{ borderRight: '1.5px solid #000000', borderBottom: '1.5px solid #000000', padding: '8px 12px', fontSize: 13, fontWeight: 500 }}>{receipt.period || '-'}</td>
            <td style={{ borderBottom: '1.5px solid #000000', padding: '8px 12px', fontSize: 13, textAlign: 'right', fontWeight: 600 }}>{formattedAmount}</td>
          </tr>
          <tr>
            <td colSpan={2} style={{ borderRight: '1.5px solid #000000', padding: '8px 12px', fontSize: 13, textAlign: 'right', color: '#0284C7', fontWeight: 700 }}>Total</td>
            <td style={{ padding: '8px 12px', fontSize: 13, textAlign: 'right', color: '#0284C7', fontWeight: 700 }}>{formattedAmount}</td>
          </tr>
        </tbody>
      </table>

      {/* 5. Total Amount in Words */}
      <div
        style={{
          width: '100%',
          border: '1.5px solid #000000',
          borderBottom: 'none',
          boxSizing: 'border-box',
          padding: '8px 12px',
          fontSize: 12.5,
          color: '#0284C7',
          fontWeight: 700,
          margin: 0,
        }}
      >
        Total Amount (in words):&nbsp;&nbsp;{amountWords}
      </div>

      {/* 6. Payment Information Box */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: '1.5px solid #000000',
          tableLayout: 'fixed',
          boxSizing: 'border-box',
          margin: 0,
          background: '#FFFFFF',
          fontSize: 12.5,
        }}
      >
        <tbody>
          <tr>
            <td
              style={{
                width: '40%',
                borderRight: '1.5px solid #000000',
                padding: '12px',
                verticalAlign: 'middle',
                fontWeight: 600,
                boxSizing: 'border-box',
              }}
            >
              Payment Information
            </td>
            <td
              style={{
                width: '60%',
                padding: '8px 12px',
                verticalAlign: 'middle',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', margin: '4px 0' }}>
                <span style={{ width: 130, fontWeight: 600 }}>Payment Date</span>
                <span>:&nbsp;&nbsp;{formattedDate || '-'}</span>
              </div>
              <div style={{ display: 'flex', margin: '4px 0' }}>
                <span style={{ width: 130, fontWeight: 600 }}>Payment Method</span>
                <span>:&nbsp;&nbsp;{receipt.paymentMethod || 'ONLINE (UPI)'}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 7. Footer Notice & Thank You */}
      <div style={{ fontSize: 12, color: '#262626', marginTop: 14 }}>
        Please note: Fees / Any payment once Made, cannot be refunded.
      </div>
      <div style={{ textAlign: 'center', fontSize: 13.5, fontWeight: 600, color: '#000000', marginTop: 12 }}>
        Thank you
      </div>

      {/* 8. Mascot Illustration */}
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <img
          src="/assets/receipt/receipt_mascots.png"
          alt="VT Kindergarten Mascots"
          style={{ width: 240, height: 'auto', display: 'block', margin: '0 auto' }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/assets/hero-elephant-bgless-v2.png';
            e.target.style.width = '120px';
          }}
        />
      </div>
    </div>
  );
}

export default function BillGeneration({ admissions = [], enquiries = [] }) {
  const hiddenReceiptRef = useRef(null);
  const modalReceiptRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');
  const [errorBanner, setErrorBanner] = useState('');
  
  // Receipts History fetched from API
  const [receiptsList, setReceiptsList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State for Viewing Receipt
  const [activeModalReceipt, setActiveModalReceipt] = useState(null);

  // Background Action Receipt Target (for Print/Download without opening modal)
  const [actionReceiptTarget, setActionReceiptTarget] = useState(null);

  // Current Date
  const today = new Date();
  const todayISO = today.toISOString().split('T')[0];
  const curYear = today.getFullYear();
  const curMonthNum = String(today.getMonth() + 1).padStart(2, '0');

  // Form State (NO PREFILLED STUDENT DATA - starts completely clean)
  const [form, setForm] = useState({
    studentName: '',
    className: 'Play Group',
    classCode: 'PG',
    customClass: '',
    description: 'Tuition fees',
    period: '',
    amount: '',
    paymentDate: todayISO,
    paymentMethod: 'ONLINE (UPI)',
    receiptNo: `${curYear}_${curMonthNum}_VTPG_1`,
    parentPhone: '',
  });

  // Auto-generate clean receipt number
  const generateReceiptNo = (code = form.classCode) => {
    const seq = (receiptsList.length % 99) + 1;
    return `${curYear}_${curMonthNum}_VT${code || 'GEN'}_${seq}`;
  };

  // Fetch all receipts from Supabase API on load
  const fetchReceipts = async () => {
    setLoadingList(true);
    try {
      // 1. Try fetching from student_admissions where relation = 'Fee Receipt'
      const { data, error } = await supabase
        .from('student_admissions')
        .select('*')
        .eq('relation', 'Fee Receipt')
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback to local storage
        const saved = localStorage.getItem('vt_saved_receipts');
        if (saved) setReceiptsList(JSON.parse(saved));
      } else if (data) {
        const parsed = data.map(item => {
          let extra = {};
          try {
            extra = JSON.parse(item.message || '{}');
          } catch (_) {}
          return {
            id: item.id,
            created_at: item.created_at,
            studentName: item.child_name || extra.student_name || extra.studentName || '-',
            className: item.program || extra.class_name || extra.className || 'Play Group',
            receiptNo: extra.receipt_no || extra.receiptNo || `VT-${item.id}`,
            description: extra.description || 'Tuition fees',
            period: extra.period || '-',
            amount: extra.amount || '0.00',
            total: extra.total || extra.amount || '0.00',
            amountInWords: extra.amount_in_words || extra.amountInWords || '',
            paymentDate: extra.payment_date || item.created_at?.split('T')[0] || todayISO,
            paymentMethod: extra.payment_method || extra.paymentMethod || 'ONLINE (UPI)',
            formattedDate: extra.formatted_date || extra.formattedDate || '',
            parentPhone: item.phone || extra.parent_phone || extra.parentPhone || '',
          };
        });

        setReceiptsList(parsed);
        // Cache to localStorage
        try {
          localStorage.setItem('vt_saved_receipts', JSON.stringify(parsed));
        } catch (_) {}
      }
    } catch (e) {
      console.error('Error fetching receipts:', e);
      const saved = localStorage.getItem('vt_saved_receipts');
      if (saved) setReceiptsList(JSON.parse(saved));
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  // Handle Form Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'className') {
      const found = CLASS_OPTIONS.find(c => c.label === value);
      const code = found ? found.code : 'GEN';
      setForm(prev => ({
        ...prev,
        className: value,
        classCode: code,
        receiptNo: `${curYear}_${curMonthNum}_VT${code}_${(receiptsList.length % 99) + 1}`
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Quick fill student from admissions / enquiries dropdown
  const handleQuickFill = (item) => {
    if (!item) return;
    const name = item.child_name || item.name || '';
    const rawClass = item.program || item.class || 'Play Group';

    let matchedClass = 'Play Group';
    let code = 'PG';
    for (const opt of CLASS_OPTIONS) {
      if (rawClass.toLowerCase().includes(opt.label.toLowerCase()) || rawClass.toLowerCase().includes(opt.code.toLowerCase())) {
        matchedClass = opt.label;
        code = opt.code;
        break;
      }
    }

    setForm(prev => ({
      ...prev,
      studentName: name.toUpperCase(),
      className: matchedClass,
      classCode: code,
      parentPhone: item.phone || '',
      receiptNo: `${curYear}_${curMonthNum}_VT${code}_${(receiptsList.length % 99) + 1}`
    }));
  };

  // Computed Values for Current Form Receipt
  const numericAmount = parseFloat(form.amount) || 0;
  const formattedAmount = numericAmount > 0 ? numericAmount.toFixed(2) : '0.00';
  const amountInWords = useMemo(() => numberToWordsINR(numericAmount), [numericAmount]);
  const formattedDate = useMemo(() => formatOrdinalDate(form.paymentDate), [form.paymentDate]);
  const effectiveClass = form.className === 'Other' && form.customClass ? form.customClass : form.className;

  const currentReceiptObj = {
    ...form,
    effectiveClass,
    numericAmount,
    formattedAmount,
    amountInWords,
    formattedDate,
  };

  // Save receipt into Supabase API
  const saveReceiptToAPI = async (receiptData) => {
    setSaving(true);
    setErrorBanner('');
    try {
      const payload = {
        type: 'fee_receipt',
        receipt_no: receiptData.receiptNo,
        description: receiptData.description,
        period: receiptData.period,
        amount: receiptData.formattedAmount,
        total: receiptData.formattedAmount,
        amount_in_words: receiptData.amountInWords,
        payment_date: receiptData.paymentDate,
        payment_method: receiptData.paymentMethod,
        formatted_date: receiptData.formattedDate,
        parent_phone: receiptData.parentPhone,
        student_name: receiptData.studentName,
        class_name: receiptData.effectiveClass,
      };

      await ensureAuthenticatedSession();
      const { data, error } = await supabase
        .from('student_admissions')
        .insert([{
          child_name: receiptData.studentName,
          program: receiptData.effectiveClass,
          parent_name: receiptData.studentName,
          relation: 'Fee Receipt',
          status: 'paid',
          phone: receiptData.parentPhone?.trim() || '7358293839',
          message: JSON.stringify(payload)
        }])
        .select();

      if (error) {
        console.error('API save error:', error.message);
        setErrorBanner(`Database Note: ${error.message}`);
        setTimeout(() => setErrorBanner(''), 6000);
      } else {
        setSuccessBanner(`✅ Receipt #${receiptData.receiptNo} for ${receiptData.studentName} successfully stored in API database!`);
        setTimeout(() => setSuccessBanner(''), 5000);
      }

      await fetchReceipts();
      return data && data[0] ? data[0] : null;
    } catch (e) {
      console.error('Error saving receipt to API:', e);
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Validation
  const validateForm = () => {
    if (!form.studentName.trim()) {
      setErrorBanner('Please enter the Student Name before printing or downloading.');
      return false;
    }
    if (!form.amount || numericAmount <= 0) {
      setErrorBanner('Please enter a valid Fee Amount (₹).');
      return false;
    }
    return true;
  };

  // 1. Print Action: Save to API + Print Directly (WITHOUT opening modal)
  const handlePrintReceipt = async (receiptObj = currentReceiptObj) => {
    if (!receiptObj.studentName?.trim() && !validateForm()) return;
    
    // Save to API if new receipt
    if (!receiptObj.id) {
      await saveReceiptToAPI(receiptObj);
    }
    setActionReceiptTarget(receiptObj);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  // 2. Download PNG Action: Save to API + Render Image (WITHOUT opening modal)
  const handleDownloadImage = async (receiptObj = currentReceiptObj) => {
    if (!receiptObj.studentName?.trim() && !validateForm()) return;
    setDownloading(true);

    // Save to API if new receipt
    if (!receiptObj.id) {
      await saveReceiptToAPI(receiptObj);
    }
    setActionReceiptTarget(receiptObj);

    setTimeout(async () => {
      try {
        const targetEl = (activeModalReceipt && modalReceiptRef.current)
          ? modalReceiptRef.current
          : hiddenReceiptRef.current;
        if (!targetEl) return;

        const canvas = await html2canvas(targetEl, {
          scale: 3.0,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
        });

        const imageURL = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        const safeName = (receiptObj.studentName || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_');
        link.download = `VT_Receipt_${receiptObj.receiptNo}_${safeName}.png`;
        link.href = imageURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error('Download error:', err);
        alert('Failed to download image. Try printing directly.');
      } finally {
        setDownloading(false);
      }
    }, 250);
  };

  // 3. Share WhatsApp Action: Save to API + Open WhatsApp (WITHOUT opening modal)
  const handleShareWhatsApp = async (receiptObj = currentReceiptObj) => {
    if (!receiptObj.studentName?.trim() && !validateForm()) return;

    if (!receiptObj.id) {
      await saveReceiptToAPI(receiptObj);
    }

    const phone = (receiptObj.parentPhone || '').replace(/\D/g, '');
    const fullPhone = phone.length === 10 ? `91${phone}` : phone;

    const message = 
`🧾 *VT KINDERGARTEN - OFFICIAL FEES RECEIPT*
━━━━━━━━━━━━━━━━━━━━
• *Receipt No:* ${receiptObj.receiptNo}
• *Student Name:* ${receiptObj.studentName}
• *Class:* ${receiptObj.effectiveClass || receiptObj.className}
• *Period:* ${receiptObj.period || 'Current Term'}
• *Description:* ${receiptObj.description}
• *Amount Paid:* ₹${receiptObj.formattedAmount || receiptObj.amount}
• *Amount in Words:* ${receiptObj.amountInWords || numberToWordsINR(receiptObj.amount)}
• *Payment Date:* ${receiptObj.formattedDate || formatOrdinalDate(receiptObj.paymentDate)}
• *Payment Mode:* ${receiptObj.paymentMethod}
━━━━━━━━━━━━━━━━━━━━
📍 *Address:*
No 11, Subramaniyapuram,
7th street, South extension, Karaikudi-2

📞 *Phone:* 73-58-29-3839
✉️ *Email:* vtkindergarten@gmail.com
━━━━━━━━━━━━━━━━━━━━
_Thank you for your payment!_`;

    const url = fullPhone 
      ? `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
  };

  // Delete Receipt from API
  const handleDeleteReceipt = async (id, receiptNo) => {
    if (!confirm(`Are you sure you want to delete Receipt #${receiptNo}?`)) return;
    try {
      await ensureAuthenticatedSession();
      if (id && !String(id).startsWith('local_')) {
        await supabase.from('student_admissions').delete().eq('id', id);
      }
      const next = receiptsList.filter(r => r.id !== id && r.receiptNo !== receiptNo);
      setReceiptsList(next);
      localStorage.setItem('vt_saved_receipts', JSON.stringify(next));
      setSuccessBanner(`Receipt #${receiptNo} deleted.`);
      setTimeout(() => setSuccessBanner(''), 4000);
    } catch (e) {
      alert('Error deleting receipt: ' + (e.message || ''));
    }
  };

  // Clear Form
  const handleResetForm = () => {
    setForm({
      studentName: '',
      className: 'Play Group',
      classCode: 'PG',
      customClass: '',
      description: 'Tuition fees',
      period: '',
      amount: '',
      paymentDate: todayISO,
      paymentMethod: 'ONLINE (UPI)',
      receiptNo: generateReceiptNo('PG'),
      parentPhone: '',
    });
    setErrorBanner('');
  };

  // Filtered Receipts for the List
  const filteredReceipts = useMemo(() => {
    if (!searchQuery.trim()) return receiptsList;
    const q = searchQuery.toLowerCase();
    return receiptsList.filter(r => 
      (r.studentName || '').toLowerCase().includes(q) ||
      (r.receiptNo || '').toLowerCase().includes(q) ||
      (r.className || '').toLowerCase().includes(q) ||
      (r.period || '').toLowerCase().includes(q) ||
      (r.paymentMethod || '').toLowerCase().includes(q)
    );
  }, [receiptsList, searchQuery]);

  return (
    <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
      
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #vt-print-receipt,
          #vt-print-receipt *,
          #vt-modal-receipt-print-target,
          #vt-modal-receipt-print-target * {
            visibility: visible !important;
          }
          #vt-print-receipt,
          #vt-modal-receipt-print-target {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 640px !important;
            margin: 0 auto !important;
            padding: 14px !important;
            border: 2px solid #000 !important;
            box-shadow: none !important;
            background: #fff !important;
            page-break-inside: avoid;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>

      {/* Success Banner */}
      {successBanner && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{successBanner}</span>
          <button type="button" onClick={() => setSuccessBanner('')} style={{ background: 'none', border: 'none', color: '#065F46', cursor: 'pointer', fontWeight: 800 }}>✕</button>
        </div>
      )}

      {/* Error Banner */}
      {errorBanner && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>⚠️ {errorBanner}</span>
          <button type="button" onClick={() => setErrorBanner('')} style={{ background: 'none', border: 'none', color: '#B91C1C', cursor: 'pointer', fontWeight: 800 }}>✕</button>
        </div>
      )}

      {/* ================= SECTION 1: CENTERED FEE RECEIPT DETAILS FORM ================= */}
      <div style={{ maxWidth: 680, width: '100%', margin: '0 auto' }}>
        
        {/* Quick Fill Dropdown from Enquiries */}
        {enquiries && enquiries.length > 0 && (
          <div style={{ background: 'linear-gradient(135deg, #FFF9F5 0%, #FFF3EC 100%)', border: '1px solid rgba(255, 107, 53, 0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: '#FF6B35', letterSpacing: 0.5 }}>
                ⚡ QUICK-FILL FROM ENQUIRIES
              </span>
              <span style={{ fontSize: 11, color: '#78716C' }}>{enquiries.length} Enquiries Available</span>
            </div>
            <select
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 13, fontWeight: 600, color: '#1E293B' }}
              onChange={(e) => {
                const selected = enquiries.find(enq => {
                  const candidateName = enq.child_name || enq.name || enq.parent_name || '';
                  return candidateName === e.target.value;
                });
                if (selected) handleQuickFill(selected);
              }}
              defaultValue=""
            >
              <option value="" disabled>Select enquiry candidate to auto-fill details...</option>
              {enquiries.map((s, idx) => {
                const displayName = s.child_name || s.name || s.parent_name || `Enquiry #${s.id || idx + 1}`;
                return (
                  <option key={idx} value={displayName}>
                    {displayName} ({s.program || 'Kindergarten'}) - {s.phone || 'No phone'}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* The Centered Form Card */}
        <div style={{ background: '#FFFFFF', borderRadius: 18, border: '1px solid rgba(255, 107, 53, 0.18)', boxShadow: '0 8px 28px rgba(255, 107, 53, 0.08)', padding: '28px 32px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0F172A' }}>
                🧾 Fee Receipt Details
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
                Enter receipt details below. Print or download to automatically save to the database.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetForm}
              title="Reset fields"
              style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#475569', cursor: 'pointer' }}
            >
              ↺ Reset
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handlePrintReceipt(); }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              
              {/* Student Name */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Student Name <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  name="studentName"
                  placeholder="Enter Student Name (e.g. P. RITHYA)"
                  value={form.studentName}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 14, fontWeight: 600, color: '#0F172A', background: '#F8FAFC' }}
                />
              </div>

              {/* Class */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Class / Grade <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <select
                  name="className"
                  value={form.className}
                  onChange={handleChange}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 14, fontWeight: 600, color: '#0F172A', background: '#F8FAFC' }}
                >
                  {CLASS_OPTIONS.map(c => (
                    <option key={c.code} value={c.label}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Receipt No */}
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  <span>Receipt No.</span>
                  <a
                    href="#generate"
                    onClick={(e) => {
                      e.preventDefault();
                      setForm(p => ({ ...p, receiptNo: generateReceiptNo() }));
                    }}
                    style={{ color: '#FF6B35', fontSize: 11, textDecoration: 'none', textTransform: 'none' }}
                  >
                    🎲 Regenerate
                  </a>
                </label>
                <input
                  type="text"
                  name="receiptNo"
                  placeholder="2026_10_VTPG_1"
                  value={form.receiptNo}
                  onChange={handleChange}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 14, fontWeight: 600, color: '#0F172A', background: '#F8FAFC' }}
                />
              </div>

              {/* Custom Class if Other selected */}
              {form.className === 'Other' && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Specify Custom Class Name
                  </label>
                  <input
                    type="text"
                    name="customClass"
                    placeholder="Enter custom grade"
                    value={form.customClass}
                    onChange={handleChange}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 14, color: '#0F172A', background: '#F8FAFC' }}
                  />
                </div>
              )}

              {/* Fee Description */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Fee Description
                </label>
                <input
                  type="text"
                  name="description"
                  placeholder="e.g. Tuition fees"
                  value={form.description}
                  onChange={handleChange}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 14, color: '#0F172A', background: '#F8FAFC' }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {FEE_TYPES.map(fee => (
                    <button
                      key={fee}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, description: fee }))}
                      style={{
                        background: form.description === fee ? '#FF6B35' : '#F1F5F9',
                        color: form.description === fee ? '#FFFFFF' : '#475569',
                        border: `1px solid ${form.description === fee ? '#FF6B35' : '#E2E8F0'}`,
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: 20,
                        cursor: 'pointer'
                      }}
                    >
                      {fee}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Fee Amount in INR (₹) <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  placeholder="Enter Amount (e.g. 1500)"
                  value={form.amount}
                  onChange={handleChange}
                  min="0"
                  step="50"
                  required
                  style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 14, fontWeight: 700, color: '#0284C7', background: '#F8FAFC' }}
                />
              </div>

              {/* Payment Period / Month */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Payment Month / Period
                </label>
                <input
                  type="text"
                  name="period"
                  placeholder="e.g. October 2026"
                  value={form.period}
                  onChange={handleChange}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 14, color: '#0F172A', background: '#F8FAFC' }}
                />
              </div>

              {/* Payment Date */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Payment Date
                </label>
                <input
                  type="date"
                  name="paymentDate"
                  value={form.paymentDate}
                  onChange={handleChange}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 14, color: '#0F172A', background: '#F8FAFC' }}
                />
              </div>

              {/* Payment Method */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Payment Method
                </label>
                <select
                  name="paymentMethod"
                  value={form.paymentMethod}
                  onChange={handleChange}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 14, fontWeight: 600, color: '#0F172A', background: '#F8FAFC' }}
                >
                  {PAYMENT_METHODS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Parent Phone Number */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Parent WhatsApp Number (Optional)
                </label>
                <input
                  type="tel"
                  name="parentPhone"
                  placeholder="e.g. 9876543210 (for 1-click WhatsApp share)"
                  value={form.parentPhone}
                  onChange={handleChange}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 14, color: '#0F172A', background: '#F8FAFC' }}
                />
              </div>

            </div>

            {/* Total Preview Summary Box */}
            {numericAmount > 0 && (
              <div style={{ marginTop: 18, padding: '12px 16px', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0369A1' }}>Total Amount:</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#0284C7' }}>₹{formattedAmount}</span>
                </div>
                <div style={{ fontSize: 11.5, color: '#0284C7', fontWeight: 600, marginTop: 4 }}>
                  In Words: {amountInWords}
                </div>
              </div>
            )}

            {/* Action Buttons Toolbar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 24 }}>

              {/* Print Receipt */}
              <button
                type="button"
                onClick={() => handlePrintReceipt()}
                disabled={saving}
                style={{ background: '#FF6B35', color: '#FFF', fontWeight: 800, fontSize: 13, padding: '12px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 12px rgba(255,107,53,0.25)' }}
              >
                🖨️ Print Receipt
              </button>

              {/* Download PNG */}
              <button
                type="button"
                onClick={() => handleDownloadImage()}
                disabled={downloading || saving}
                style={{ background: '#0284C7', color: '#FFF', fontWeight: 800, fontSize: 13, padding: '12px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                {downloading ? '⏳ Rendering...' : '📥 Download (PNG)'}
              </button>

              {/* WhatsApp Share */}
              <button
                type="button"
                onClick={() => handleShareWhatsApp()}
                style={{ background: '#10B981', color: '#FFF', fontWeight: 800, fontSize: 13, padding: '12px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                📲 WhatsApp Share
              </button>

            </div>

          </form>

        </div>

      </div>


      {/* ================= SECTION 2: GENERATED RECEIPTS LIST & TABLE ================= */}
      <div className="vta-panel" style={{ marginTop: 8 }}>
        
        {/* Panel Title Bar */}
        <div className="vta-table-title-bar vta-table-title-bar-billing">
          <div className="vta-table-title-bar-left">
            <h3>📜 Generated Fee Receipts List</h3>
            <span className="vta-badge-pill vta-badge-purple">{filteredReceipts.length} Receipts</span>
          </div>
          <div className="vta-sub-text" style={{ fontWeight: 700, color: '#7C3AED' }}>
            Database Fee Ledger & Receipts History
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="vta-panel-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div className="vta-filters-group" style={{ flexWrap: 'wrap', gap: 10 }}>
            <div className="vta-search-box">
              <span className="vta-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search student, receipt no, class, or month..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <span className="vta-count-pill">{filteredReceipts.length} receipts captured</span>
          </div>

          <button
            type="button"
            className="vta-btn-ghost"
            onClick={fetchReceipts}
            disabled={loadingList}
            title="Reload from API"
            style={{ fontWeight: 700, fontSize: 12 }}
          >
            {loadingList ? '⏳ Refreshing...' : '🔄 Refresh API'}
          </button>
        </div>

        {/* Receipts Table */}
        <div className="vta-table-scroll">
          <table className="vta-table">
            <thead className="vta-thead-admissions">
              <tr>
                <th>#</th>
                <th>Receipt No.</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Amount (₹)</th>
                <th>Payment Mode</th>
                <th>Payment Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReceipts.map((r, i) => (
                <tr key={r.id || r.receiptNo || i} style={{ cursor: 'pointer' }} onClick={() => setActiveModalReceipt(r)}>
                  <td style={{ color: '#94A3B8', fontWeight: 700 }}>{i + 1}</td>
                  
                  <td>
                    <span className="vta-badge-pill vta-badge-blue" style={{ fontFamily: 'monospace', fontWeight: 800 }}>
                      {r.receiptNo}
                    </span>
                  </td>

                  <td>
                    <div className="vta-name-bold" style={{ fontSize: 13.5 }}>{r.studentName}</div>
                    {r.parentPhone && (
                      <div className="vta-sub-text" style={{ fontSize: 11 }}>📞 {r.parentPhone}</div>
                    )}
                  </td>

                  <td>
                    <span className="vta-badge-pill vta-badge-orange">{r.className}</span>
                  </td>

                  <td>
                    <span style={{ fontWeight: 800, color: '#0284C7', fontSize: 14 }}>
                      ₹{r.total || r.amount}
                    </span>
                  </td>

                  <td>
                    <span className="vta-badge-pill vta-badge-green" style={{ fontSize: 11 }}>
                      {r.paymentMethod || 'ONLINE'}
                    </span>
                  </td>

                  <td>
                    <div className="vta-name-bold" style={{ fontSize: 12 }}>{r.formattedDate || r.paymentDate}</div>
                    <div className="vta-sub-text" style={{ fontSize: 11 }}>{r.period || '-'}</div>
                  </td>

                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {/* View Receipt in Modal */}
                      <button
                        type="button"
                        className="vta-btn-action-icon"
                        title="View Receipt in Modal Box"
                        onClick={() => setActiveModalReceipt(r)}
                        style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}
                      >
                        👁️
                      </button>

                      {/* Print */}
                      <button
                        type="button"
                        className="vta-btn-action-icon"
                        title="Print Receipt"
                        onClick={() => handlePrintReceipt(r)}
                        style={{ background: '#FFF7ED', border: '1px solid #FFEDD5' }}
                      >
                        🖨️
                      </button>

                      {/* Download PNG */}
                      <button
                        type="button"
                        className="vta-btn-action-icon"
                        title="Download Receipt (PNG)"
                        onClick={() => handleDownloadImage(r)}
                        style={{ background: '#F0F9FF', border: '1px solid #BAE6FD' }}
                      >
                        📥
                      </button>

                      {/* WhatsApp */}
                      <button
                        type="button"
                        className="vta-btn-action-icon"
                        title="Share on WhatsApp"
                        onClick={() => handleShareWhatsApp(r)}
                        style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}
                      >
                        📲
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        className="vta-btn-action-icon vta-btn-action-delete"
                        title="Delete receipt"
                        onClick={() => handleDeleteReceipt(r.id, r.receiptNo)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredReceipts.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 48, color: '#94A3B8' }}>
                    {loadingList ? 'Loading receipts from API database...' : 'No fee receipts generated yet. Fill out the form above to print or download your first receipt.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>


      {/* ================= SECTION 3: PREMIUM RECEIPT MODAL BOX ================= */}
      {activeModalReceipt && (
        <div
          className="vta-modal-backdrop"
          onClick={() => setActiveModalReceipt(null)}
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
            overflowY: 'auto'
          }}
        >
          <div
            className="vta-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: 18,
              maxWidth: 720,
              width: '100%',
              maxHeight: '94vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #E2E8F0', background: 'linear-gradient(90deg, #FFF9F5 0%, #FFFFFF 100%)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🧾 Official Fee Receipt</span>
                  <span className="vta-badge-pill vta-badge-blue" style={{ fontSize: 11 }}>#{activeModalReceipt.receiptNo}</span>
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
                  Student: {activeModalReceipt.studentName} ({activeModalReceipt.className})
                </p>
              </div>

              {/* Action Buttons in Modal Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  style={{ background: '#FF6B35', color: '#FFF', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  🖨️ Print
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadImage(activeModalReceipt)}
                  disabled={downloading}
                  style={{ background: '#0284C7', color: '#FFF', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {downloading ? '⏳ Rendering...' : '📥 Download (PNG)'}
                </button>

                <button
                  type="button"
                  onClick={() => handleShareWhatsApp(activeModalReceipt)}
                  style={{ background: '#10B981', color: '#FFF', border: 'none', padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                >
                  📲
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModalReceipt(null)}
                  style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 800, color: '#64748B', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body: The Complete Official Receipt */}
            <div id="vt-modal-receipt-print-target" style={{ padding: '24px 28px', background: '#F8FAFC', display: 'flex', justifyContent: 'center' }}>
              <ReceiptCard receipt={activeModalReceipt} innerRef={modalReceiptRef} />
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderTop: '1px solid #E2E8F0', background: '#FFFFFF' }}>
              <span style={{ fontSize: 12, color: '#64748B' }}>
                💡 Click <strong>Print</strong> or <strong>Download (PNG)</strong> to export this receipt.
              </span>
              <button
                type="button"
                className="vta-btn-secondary"
                onClick={() => setActiveModalReceipt(null)}
                style={{ padding: '8px 18px', fontSize: 13 }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Hidden container used for offscreen capture & direct print without opening modal */}
      <div
        id={activeModalReceipt ? 'vt-hidden-receipt' : 'vt-print-receipt'}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: 640,
          background: '#ffffff',
          zIndex: -9999,
          pointerEvents: 'none',
        }}
      >
        <ReceiptCard receipt={actionReceiptTarget || currentReceiptObj} innerRef={hiddenReceiptRef} />
      </div>

    </div>
  );
}
