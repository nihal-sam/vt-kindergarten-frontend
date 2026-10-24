import React, { useState, useRef, useEffect, useMemo } from 'react';
import html2canvas from 'html2canvas';

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

export default function BillGeneration({ admissions = [], enquiries = [] }) {
  const receiptRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Current Date & Defaults
  const today = new Date();
  const todayISO = today.toISOString().split('T')[0];
  const curMonthName = today.toLocaleString('en-US', { month: 'long' });
  const curYear = today.getFullYear();
  const curMonthNum = String(today.getMonth() + 1).padStart(2, '0');

  // Form State
  const [form, setForm] = useState({
    studentName: 'P. RITHYA',
    className: 'Play Group',
    classCode: 'PG',
    customClass: '',
    description: 'Tuition fees',
    period: curMonthName,
    amount: '1500.00',
    paymentDate: todayISO,
    paymentMethod: 'ONLINE (UPI)',
    receiptNo: `${curYear}_${curMonthNum}_VTPG_3`,
    parentPhone: '',
    parentEmail: '',
  });

  // Recent Receipts History (Saved in localStorage)
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('vt_saved_receipts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Auto-generate receipt number based on class and month
  const generateReceiptNo = (code = form.classCode) => {
    const seq = (history.length % 99) + 3; // sequence number
    return `${curYear}_${curMonthNum}_VT${code || 'GEN'}_${seq}`;
  };

  // Handle Form Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'className') {
      const found = CLASS_OPTIONS.find(c => c.label === value);
      const code = found ? found.code : 'GEN';
      setForm(prev => ({
        ...prev,
        className: value,
        classCode: code,
        receiptNo: `${curYear}_${curMonthNum}_VT${code}_3`
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Quick fill from recent admissions / enquiries
  const handleQuickFill = (item) => {
    if (!item) return;
    const name = item.child_name || item.student_name || item.name || '';
    const rawClass = item.program || item.class || item.grade || 'Play Group';
    
    // Match to known class option
    let matchedClass = 'Play Group';
    let code = 'PG';
    for (const opt of CLASS_OPTIONS) {
      if (rawClass.toLowerCase().includes(opt.label.toLowerCase()) || rawClass.toLowerCase().includes(opt.code.toLowerCase())) {
        matchedClass = opt.label;
        code = opt.code;
        break;
      }
    }

    const phone = item.phone || item.mobile || item.parent_phone || '';
    const email = item.email || '';

    setForm(prev => ({
      ...prev,
      studentName: name.toUpperCase(),
      className: matchedClass,
      classCode: code,
      parentPhone: phone,
      parentEmail: email,
      receiptNo: `${curYear}_${curMonthNum}_VT${code}_${(history.length % 99) + 4}`
    }));
  };

  // Computed values
  const numericAmount = parseFloat(form.amount) || 0;
  const formattedAmount = numericAmount.toFixed(2);
  const amountInWords = useMemo(() => numberToWordsINR(numericAmount), [numericAmount]);
  const formattedDate = useMemo(() => formatOrdinalDate(form.paymentDate), [form.paymentDate]);
  const effectiveClass = form.className === 'Other' && form.customClass ? form.customClass : form.className;

  // Save receipt to history
  const saveToHistory = () => {
    const receiptData = {
      ...form,
      effectiveClass,
      numericAmount,
      formattedAmount,
      amountInWords,
      formattedDate,
      savedAt: new Date().toISOString()
    };
    const nextHistory = [receiptData, ...history.filter(h => h.receiptNo !== form.receiptNo)].slice(0, 30);
    setHistory(nextHistory);
    try {
      localStorage.setItem('vt_saved_receipts', JSON.stringify(nextHistory));
    } catch (_) {}
  };

  // 1. Direct Print Action
  const handlePrint = () => {
    saveToHistory();
    window.print();
  };

  // 2. High-Resolution Image Download Action (PNG)
  const handleDownloadImage = async () => {
    if (!receiptRef.current) return;
    setDownloading(true);
    saveToHistory();

    try {
      // Capture element at 2.5x retina scale for ultra-crisp receipt printing quality
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imageURL = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      const safeName = (form.studentName || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = `VT_Receipt_${form.receiptNo}_${safeName}.png`;
      link.href = imageURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error generating receipt image:', err);
      alert('Failed to generate receipt image. Please try printing directly using the Print button.');
    } finally {
      setDownloading(false);
    }
  };

  // 3. Share via WhatsApp Action
  const handleShareWhatsApp = () => {
    saveToHistory();
    const phone = (form.parentPhone || '').replace(/\D/g, '');
    const fullPhone = phone.length === 10 ? `91${phone}` : phone;

    const message = 
`🧾 *VT KINDERGARTEN - OFFICIAL FEES RECEIPT*
━━━━━━━━━━━━━━━━━━━━
• *Receipt No:* ${form.receiptNo}
• *Student Name:* ${form.studentName}
• *Class:* ${effectiveClass}
• *Period:* ${form.period}
• *Description:* ${form.description}
• *Amount Paid:* ₹${formattedAmount}
• *Amount in Words:* ${amountInWords}
• *Payment Date:* ${formattedDate}
• *Payment Mode:* ${form.paymentMethod}
━━━━━━━━━━━━━━━━━━━━
_Address: No 11, Subramaniyapuram 7th street, South extension, Karaikudi-2_
_Contact: 73-58-29-3839 | vtkindergarten@gmail.com_
_Thank you for your payment!_`;

    const url = fullPhone 
      ? `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
  };

  // 4. Native Web Share Action (Mobile / Supported Browsers)
  const handleNativeShare = async () => {
    saveToHistory();
    const shareText = `VT Kindergarten Fees Receipt #${form.receiptNo} for ${form.studentName} (${effectiveClass}) of ₹${formattedAmount} paid on ${formattedDate}.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `VT Kindergarten Fees Receipt - ${form.receiptNo}`,
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleShareWhatsApp();
        }
      }
    } else {
      handleShareWhatsApp();
    }
  };

  // 5. Copy Text Summary
  const handleCopyText = () => {
    const text = `VT Kindergarten Fees Receipt #${form.receiptNo} | Student: ${form.studentName} (${effectiveClass}) | Amount: ₹${formattedAmount} | Date: ${formattedDate} | Method: ${form.paymentMethod}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Load past receipt from history
  const handleLoadReceipt = (item) => {
    setForm({
      studentName: item.studentName || '',
      className: item.className || 'Play Group',
      classCode: item.classCode || 'PG',
      customClass: item.customClass || '',
      description: item.description || 'Tuition fees',
      period: item.period || curMonthName,
      amount: item.amount || '1500.00',
      paymentDate: item.paymentDate || todayISO,
      paymentMethod: item.paymentMethod || 'ONLINE (UPI)',
      receiptNo: item.receiptNo || '',
      parentPhone: item.parentPhone || '',
      parentEmail: item.parentEmail || '',
    });
  };

  // Quick list of student options for quick-fill
  const quickStudents = useMemo(() => {
    const list = [];
    (admissions || []).forEach(a => {
      const name = a.child_name || a.parent_name;
      if (name) list.push({ name, program: a.program || 'Play Group', phone: a.phone, type: 'Admission' });
    });
    (enquiries || []).forEach(e => {
      const name = e.child_name || e.parent_name;
      if (name && !list.some(l => l.name === name)) {
        list.push({ name, program: e.program || 'Kindergarten', phone: e.phone, type: 'Enquiry' });
      }
    });
    return list.slice(0, 15);
  }, [admissions, enquiries]);

  return (
    <div className="vta-billing-container">
      {/* Print Specific CSS to only print the clean receipt */}
      <style>{`
        @media print {
          /* Hide all page content except the receipt card */
          body * {
            visibility: hidden !important;
          }
          #vt-fee-receipt-card,
          #vt-fee-receipt-card * {
            visibility: visible !important;
          }
          #vt-fee-receipt-card {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 16px !important;
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

        .vta-billing-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 40px;
        }

        .vta-billing-layout {
          display: grid;
          grid-template-columns: minmax(360px, 440px) 1fr;
          gap: 24px;
          align-items: flex-start;
        }

        @media (max-width: 1024px) {
          .vta-billing-layout {
            grid-template-columns: 1fr;
          }
        }

        /* Form Card Styling */
        .vta-billing-card {
          background: #FFFFFF;
          border-radius: 16px;
          border: 1px solid rgba(255, 107, 53, 0.16);
          box-shadow: 0 4px 20px rgba(255, 107, 53, 0.05);
          padding: 24px;
        }

        .vta-billing-card h2 {
          margin: 0 0 16px;
          font-size: 18px;
          font-weight: 800;
          color: #1C1917;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .vta-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .vta-form-grid-full {
          grid-column: 1 / -1;
        }

        .vta-input-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .vta-input-control {
          width: 100%;
          box-sizing: border-box;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1.5px solid #CBD5E1;
          font-size: 14px;
          font-family: inherit;
          color: #0F172A;
          background: #F8FAFC;
          transition: all 0.2s ease;
        }

        .vta-input-control:focus {
          outline: none;
          border-color: #FF6B35;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.15);
        }

        .vta-chip-group {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 6px;
        }

        .vta-chip-btn {
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          color: #475569;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .vta-chip-btn:hover {
          background: #FFE4D6;
          color: #EA580C;
          border-color: #FDBA74;
        }

        .vta-chip-btn.active {
          background: #FF6B35;
          color: #FFFFFF;
          border-color: #FF6B35;
        }

        /* Action Buttons */
        .vta-actions-bar {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 20px;
        }

        .vta-btn-action-primary {
          background: #FF6B35;
          color: #FFFFFF;
          font-weight: 800;
          font-size: 13px;
          padding: 12px 16px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.25);
        }

        .vta-btn-action-primary:hover:not(:disabled) {
          background: #EA580C;
          transform: translateY(-1px);
        }

        .vta-btn-action-green {
          background: #10B981;
          color: #FFFFFF;
          font-weight: 800;
          font-size: 13px;
          padding: 12px 16px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
        }

        .vta-btn-action-green:hover {
          background: #059669;
          transform: translateY(-1px);
        }

        .vta-btn-action-secondary {
          background: #F8FAFC;
          color: #1E293B;
          font-weight: 700;
          font-size: 13px;
          padding: 11px 16px;
          border-radius: 10px;
          border: 1.5px solid #CBD5E1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .vta-btn-action-secondary:hover {
          background: #F1F5F9;
          border-color: #94A3B8;
        }

        /* RECEIPT CARD PREVIEW (Exact match of 2026_10_VTPG_3 (1).pdf) */
        .vta-receipt-preview-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .vta-receipt-card {
          width: 100%;
          max-width: 640px;
          background: #FFFFFF;
          border: 2px solid #000000;
          border-radius: 4px;
          padding: 24px 28px 20px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
          font-family: Arial, Helvetica, sans-serif;
          color: #000000;
          box-sizing: border-box;
          user-select: text;
        }

        /* Top Header */
        .vtr-header {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          margin-bottom: 16px;
          position: relative;
        }

        .vtr-logo-box {
          width: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .vtr-title-box {
          flex: 1;
          text-align: center;
          padding-right: 40px;
        }

        .vtr-title-vt {
          font-size: 40px;
          font-weight: 900;
          letter-spacing: 1px;
          line-height: 1;
          color: #000000;
          font-family: Arial, sans-serif;
        }

        .vtr-title-kindergarten {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: 0.5px;
          line-height: 1.2;
          color: #1A1A1A;
          margin-top: 4px;
          font-family: 'Plus Jakarta Sans', Arial, sans-serif;
        }

        .vtr-subtitle {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 2px;
          margin-top: 8px;
          color: #000000;
        }

        /* Table Box Base */
        .vtr-box {
          width: 100%;
          border: 1.5px solid #000000;
          box-sizing: border-box;
          margin-bottom: -1.5px; /* collapse adjacent borders */
        }

        /* Address Bar */
        .vtr-address-bar {
          display: grid;
          grid-template-columns: 2fr 1.6fr 1.4fr;
          font-size: 11px;
          line-height: 1.35;
        }

        .vtr-address-col {
          padding: 6px 8px;
          border-right: 1.5px solid #000000;
          display: flex;
          align-items: center;
        }

        .vtr-address-col:last-child {
          border-right: none;
          justify-content: center;
        }

        /* Student & Receipt Box */
        .vtr-details-bar {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          font-size: 13px;
        }

        .vtr-details-left {
          border-right: 1.5px solid #000000;
          padding: 8px 12px;
        }

        .vtr-details-right {
          padding: 0;
        }

        .vtr-details-right-cell {
          padding: 6px 12px;
          border-bottom: 1.5px solid #000000;
        }

        .vtr-details-right-cell:last-child {
          border-bottom: none;
        }

        /* Fees Grid Table */
        .vtr-fees-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.5px solid #000000;
          margin-bottom: -1.5px;
        }

        .vtr-fees-table th,
        .vtr-fees-table td {
          border: 1.5px solid #000000;
          padding: 8px 12px;
          font-size: 13px;
        }

        .vtr-fees-table th {
          color: #0284C7;
          font-weight: 700;
          text-align: left;
        }

        .vtr-fees-blue-text {
          color: #0284C7;
          font-weight: 700;
        }

        /* Amount in words */
        .vtr-words-bar {
          padding: 8px 12px;
          font-size: 12.5px;
          color: #0284C7;
          font-weight: 700;
          border: 1.5px solid #000000;
          margin-bottom: -1.5px;
        }

        /* Payment Information Box */
        .vtr-payment-box {
          display: grid;
          grid-template-columns: 1.2fr 1.8fr;
          border: 1.5px solid #000000;
          font-size: 12.5px;
        }

        .vtr-payment-left {
          padding: 12px;
          border-right: 1.5px solid #000000;
          display: flex;
          align-items: center;
          font-weight: 600;
        }

        .vtr-payment-right {
          padding: 8px 12px;
        }

        .vtr-payment-row {
          display: flex;
          margin: 4px 0;
        }

        .vtr-payment-label {
          width: 130px;
          font-weight: 600;
        }

        /* Notice & Thank You */
        .vtr-notice {
          font-size: 12px;
          color: #262626;
          margin-top: 14px;
        }

        .vtr-thankyou {
          text-align: center;
          font-size: 13.5px;
          font-weight: 600;
          color: #000000;
          margin-top: 12px;
        }

        /* Mascots Area */
        .vtr-mascots-box {
          text-align: center;
          margin-top: 12px;
        }

        .vtr-mascots-img {
          width: 240px;
          height: auto;
          display: block;
          margin: 0 auto;
        }
      `}</style>

      {/* Main Split Layout */}
      <div className="vta-billing-layout">
        
        {/* ================= LEFT COLUMN: FORM & CONTROLS ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Quick Fill Dropdown (if admissions/enquiries exist) */}
          {quickStudents.length > 0 && (
            <div className="vta-billing-card" style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #FFF9F5 0%, #FFF3EC 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#FF6B35' }}>
                  ⚡ QUICK-FILL FROM STUDENT ADMISSIONS
                </span>
                <span style={{ fontSize: 11, color: '#78716C' }}>{quickStudents.length} Students</span>
              </div>
              <select
                className="vta-input-control"
                onChange={(e) => {
                  const selected = quickStudents.find(s => s.name === e.target.value);
                  if (selected) handleQuickFill(selected);
                }}
                defaultValue=""
              >
                <option value="" disabled>Select student to auto-fill details...</option>
                {quickStudents.map((s, idx) => (
                  <option key={idx} value={s.name}>
                    {s.name} ({s.program}) - {s.phone || 'No phone'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Form Input Card */}
          <div className="vta-billing-card">
            <h2>🧾 Fee Receipt Details</h2>

            <div className="vta-form-grid">
              
              {/* Student Name */}
              <div className="vta-form-grid-full">
                <label className="vta-input-label">Student Name *</label>
                <input
                  type="text"
                  name="studentName"
                  className="vta-input-control"
                  placeholder="e.g. P. RITHYA"
                  value={form.studentName}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Class Selection */}
              <div>
                <label className="vta-input-label">Class / Grade *</label>
                <select
                  name="className"
                  className="vta-input-control"
                  value={form.className}
                  onChange={handleChange}
                >
                  {CLASS_OPTIONS.map(c => (
                    <option key={c.code} value={c.label}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Receipt Number */}
              <div>
                <label className="vta-input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Receipt No.</span>
                  <a
                    href="#generate"
                    onClick={(e) => {
                      e.preventDefault();
                      setForm(p => ({ ...p, receiptNo: generateReceiptNo() }));
                    }}
                    style={{ color: '#FF6B35', fontSize: 11, textDecoration: 'none' }}
                  >
                    🎲 Regenerate
                  </a>
                </label>
                <input
                  type="text"
                  name="receiptNo"
                  className="vta-input-control"
                  value={form.receiptNo}
                  onChange={handleChange}
                  placeholder="2026_10_VTPG_3"
                />
              </div>

              {/* Custom Class if Other selected */}
              {form.className === 'Other' && (
                <div className="vta-form-grid-full">
                  <label className="vta-input-label">Specify Custom Class</label>
                  <input
                    type="text"
                    name="customClass"
                    className="vta-input-control"
                    placeholder="Enter custom grade name"
                    value={form.customClass}
                    onChange={handleChange}
                  />
                </div>
              )}

              {/* Description */}
              <div className="vta-form-grid-full">
                <label className="vta-input-label">Fee Description</label>
                <input
                  type="text"
                  name="description"
                  className="vta-input-control"
                  placeholder="Tuition fees"
                  value={form.description}
                  onChange={handleChange}
                />
                <div className="vta-chip-group">
                  {FEE_TYPES.map(fee => (
                    <button
                      key={fee}
                      type="button"
                      className={`vta-chip-btn ${form.description === fee ? 'active' : ''}`}
                      onClick={() => setForm(p => ({ ...p, description: fee }))}
                    >
                      {fee}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Period / Month */}
              <div>
                <label className="vta-input-label">Payment Month / Period</label>
                <input
                  type="text"
                  name="period"
                  className="vta-input-control"
                  placeholder="e.g. October"
                  value={form.period}
                  onChange={handleChange}
                />
              </div>

              {/* Amount */}
              <div>
                <label className="vta-input-label">Amount in INR (₹) *</label>
                <input
                  type="number"
                  name="amount"
                  className="vta-input-control"
                  placeholder="1500"
                  value={form.amount}
                  onChange={handleChange}
                  step="50"
                  min="0"
                  required
                />
              </div>

              {/* Payment Date */}
              <div>
                <label className="vta-input-label">Payment Date</label>
                <input
                  type="date"
                  name="paymentDate"
                  className="vta-input-control"
                  value={form.paymentDate}
                  onChange={handleChange}
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="vta-input-label">Payment Method</label>
                <select
                  name="paymentMethod"
                  className="vta-input-control"
                  value={form.paymentMethod}
                  onChange={handleChange}
                >
                  {PAYMENT_METHODS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Parent Phone (Optional for WhatsApp Sharing) */}
              <div className="vta-form-grid-full">
                <label className="vta-input-label">Parent WhatsApp Number (Optional for sharing)</label>
                <input
                  type="tel"
                  name="parentPhone"
                  className="vta-input-control"
                  placeholder="e.g. 9876543210 (for 1-click WhatsApp share)"
                  value={form.parentPhone}
                  onChange={handleChange}
                />
              </div>

            </div>

            {/* Action Buttons Toolbar */}
            <div className="vta-actions-bar">
              <button
                type="button"
                className="vta-btn-action-primary"
                onClick={handlePrint}
                title="Print this receipt directly through connected printer"
              >
                🖨️ Print Receipt
              </button>

              <button
                type="button"
                className="vta-btn-action-primary"
                style={{ background: '#0284C7' }}
                onClick={handleDownloadImage}
                disabled={downloading}
                title="Download receipt as high-resolution PNG image"
              >
                {downloading ? '⏳ Rendering Image...' : '📥 Download (PNG)'}
              </button>

              <button
                type="button"
                className="vta-btn-action-green"
                onClick={handleShareWhatsApp}
                title="Send receipt details to parent on WhatsApp"
              >
                📲 Share on WhatsApp
              </button>

              <button
                type="button"
                className="vta-btn-action-secondary"
                onClick={handleNativeShare}
                title="Share receipt via device sharing menu"
              >
                🔗 Share Receipt
              </button>
            </div>

            {/* Quick helper note */}
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#64748B' }}>
              <span>💡 Receipt preview updates live as you type</span>
              <button
                type="button"
                onClick={handleCopyText}
                style={{ background: 'none', border: 'none', color: '#FF6B35', cursor: 'pointer', fontWeight: 700, padding: 0 }}
              >
                {copied ? '✓ Copied Summary' : '📋 Copy Text Summary'}
              </button>
            </div>

          </div>

          {/* Past Receipts History Quick Tray */}
          {history.length > 0 && (
            <div className="vta-billing-card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#1E293B' }}>
                  📜 RECENTLY GENERATED RECEIPTS ({history.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Clear receipt history?')) {
                      setHistory([]);
                      localStorage.removeItem('vt_saved_receipts');
                    }
                  }}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 11, cursor: 'pointer' }}
                >
                  Clear History
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                {history.map((h, i) => (
                  <div
                    key={i}
                    onClick={() => handleLoadReceipt(h)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: h.receiptNo === form.receiptNo ? '#FFF0E6' : '#F8FAFC',
                      border: `1px solid ${h.receiptNo === form.receiptNo ? '#FF6B35' : '#E2E8F0'}`,
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 12,
                      transition: 'all 0.15s'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700, color: '#1E293B' }}>{h.studentName}</span>
                      <span style={{ color: '#64748B', marginLeft: 8 }}>({h.className || h.effectiveClass})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, color: '#0284C7' }}>₹{h.formattedAmount}</span>
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>#{h.receiptNo}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>


        {/* ================= RIGHT COLUMN: EXACT RECEIPT PREVIEW ================= */}
        <div className="vta-receipt-preview-wrap">
          
          <div style={{ width: '100%', maxWidth: 640, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#475569', letterSpacing: 0.5 }}>
              LIVE RECEIPT PREVIEW (PRINT & DOWNLOAD FORMAT)
            </span>
            <span className="vta-badge-pill vta-badge-orange" style={{ fontSize: 11, fontWeight: 700 }}>
              Official Standard Layout
            </span>
          </div>

          {/* THE RECEIPT CARD (Matched to 2026_10_VTPG_3 (1).pdf) */}
          <div id="vt-fee-receipt-card" ref={receiptRef} className="vta-receipt-card">
            
            {/* 1. Header with Logo, School Name & Fees Receipt Subtitle */}
            <div className="vtr-header">
              <div className="vtr-logo-box">
                <img
                  src="/assets/receipt/receipt_logo.png"
                  alt="Pre school V logo"
                  style={{ width: 85, height: 'auto', display: 'block' }}
                  onError={(e) => {
                    // Fallback to vt-logo if receipt_logo fails
                    e.target.onerror = null;
                    e.target.src = '/assets/vt-logo.png';
                  }}
                />
              </div>

              <div className="vtr-title-box">
                <div className="vtr-title-vt">VT</div>
                <div className="vtr-title-kindergarten">Kindergarten</div>
                <div className="vtr-subtitle">FEES RECEIPT</div>
              </div>
            </div>

            {/* 2. Address & Contact Bar (3 columns with borders) */}
            <div className="vtr-box vtr-address-bar">
              <div className="vtr-address-col" style={{ fontWeight: 500 }}>
                Address: No 11, Subramaniyapuram<br />
                7<sup>th</sup> street, South extension, Karaikudi-2
              </div>
              <div className="vtr-address-col" style={{ justifyContent: 'center', gap: 6 }}>
                <span style={{ fontSize: 12 }}>✉️</span>
                <span style={{ fontWeight: 500 }}>vtkindergarten@gmail.com</span>
              </div>
              <div className="vtr-address-col" style={{ gap: 6 }}>
                <span style={{ fontSize: 12 }}>📞</span>
                <span style={{ fontWeight: 600 }}>73-58-29-3839</span>
              </div>
            </div>

            {/* 3. Student Details & Receipt No Box (2 columns) */}
            <div className="vtr-box vtr-details-bar">
              <div className="vtr-details-left">
                <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 13.5 }}>Student Details:</div>
                <div style={{ marginBottom: 10, display: 'flex', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 700, width: 75 }}>Name :</span>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{form.studentName || '-'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 700, width: 75 }}>Class :</span>
                  <span style={{ fontWeight: 600 }}>{effectiveClass || '-'}</span>
                </div>
              </div>

              <div className="vtr-details-right">
                <div className="vtr-details-right-cell">
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Receipt No:</div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginTop: 4 }}>{form.receiptNo || '-'}</div>
                </div>
                <div className="vtr-details-right-cell">
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Payment Month</div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginTop: 4 }}>{form.period || curMonthName}</div>
                </div>
              </div>
            </div>

            {/* 4. Fees Grid Table */}
            <table className="vtr-fees-table">
              <thead>
                <tr>
                  <th style={{ width: '45%' }}>Description</th>
                  <th style={{ width: '30%' }}>Period</th>
                  <th style={{ width: '25%', textAlign: 'right' }}>Amount in INR</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 500, height: 28 }}>{form.description || 'Tuition fees'}</td>
                  <td style={{ fontWeight: 500 }}>{form.period || curMonthName}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formattedAmount}</td>
                </tr>
                <tr>
                  <td colSpan={2} style={{ textAlign: 'right' }} className="vtr-fees-blue-text">
                    Total
                  </td>
                  <td style={{ textAlign: 'right' }} className="vtr-fees-blue-text">
                    {formattedAmount}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 5. Total Amount in Words */}
            <div className="vtr-words-bar">
              Total Amount (in words):&nbsp;&nbsp;{amountInWords}
            </div>

            {/* 6. Payment Information Box */}
            <div className="vtr-payment-box">
              <div className="vtr-payment-left">
                Payment Information
              </div>
              <div className="vtr-payment-right">
                <div className="vtr-payment-row">
                  <span className="vtr-payment-label">Payment Date</span>
                  <span>:&nbsp;&nbsp;{formattedDate}</span>
                </div>
                <div className="vtr-payment-row">
                  <span className="vtr-payment-label">Payment Method</span>
                  <span>:&nbsp;&nbsp;{form.paymentMethod}</span>
                </div>
              </div>
            </div>

            {/* 7. Footer Notice & Thank You */}
            <div className="vtr-notice">
              Please note: Fees / Any payment once Made, cannot be refunded.
            </div>

            <div className="vtr-thankyou">
              Thank you
            </div>

            {/* 8. Cute Mascots Footer Graphic */}
            <div className="vtr-mascots-box">
              <img
                src="/assets/receipt/receipt_mascots.png"
                alt="VT Kindergarten Mascots"
                className="vtr-mascots-img"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/assets/hero-elephant-bgless-v2.png';
                  e.target.style.width = '120px';
                }}
              />
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
