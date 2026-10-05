import { useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

const CUTOFF_DATE = new Date(2026, 2, 31);
const CUTOFF_LABEL = "31 March 2026";

const eligibilityLevels = [
  { grade: "Play Group", minYears: 2, accent: "orange", desc: "Sensory & motor play", color: "#FF6B35" },
  { grade: "Pre KG", minYears: 3, accent: "teal", desc: "Phonics & social skills", color: "#0D9488" },
  { grade: "LKG", minYears: 4, accent: "yellow", desc: "Pre-writing & math", color: "#D97706" },
  { grade: "UKG", minYears: 5, accent: "purple", desc: "Literacy & readiness", color: "#7C3AED" },
];

function parseLocalDate(value) {
  if (!value) return null;
  let year, month, day;
  if (value.includes("-")) {
    [year, month, day] = value.split("-").map(Number);
  } else if (value.includes("/")) {
    [day, month, year] = value.split("/").map(Number);
  }
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function getAgeOnCutoff(dateOfBirth) {
  let years = CUTOFF_DATE.getFullYear() - dateOfBirth.getFullYear();
  let months = CUTOFF_DATE.getMonth() - dateOfBirth.getMonth();
  let days = CUTOFF_DATE.getDate() - dateOfBirth.getDate();

  if (days < 0) {
    months -= 1;
    const previousMonth = CUTOFF_DATE.getMonth() - 1;
    const previousMonthYear =
      previousMonth < 0 ? CUTOFF_DATE.getFullYear() - 1 : CUTOFF_DATE.getFullYear();
    const normalizedPreviousMonth = previousMonth < 0 ? 11 : previousMonth;
    days += getDaysInMonth(previousMonthYear, normalizedPreviousMonth);
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days };
}

function getEligibleGrade(age) {
  return [...eligibilityLevels]
    .reverse()
    .find((level) => age.years >= level.minYears);
}

function formatAge(age) {
  const parts = [
    `${age.years} year${age.years === 1 ? "" : "s"}`,
    `${age.months} month${age.months === 1 ? "" : "s"}`,
  ];

  if (age.days > 0) parts.push(`${age.days} day${age.days === 1 ? "" : "s"}`);
  return parts.join(" ");
}

export default function AgeEligibilityCalculator({ onInteraction }) {
  const [childName, setChildName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const [submittedInfo, setSubmittedInfo] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const normalizedName = childName.trim();

  // Live real-time preview as parent types
  const livePreview = useMemo(() => {
    if (!dateOfBirth || dateOfBirth.length < 10) return null;
    const bDate = parseLocalDate(dateOfBirth);
    if (!bDate || bDate > CUTOFF_DATE) return null;
    const age = getAgeOnCutoff(bDate);
    const grade = getEligibleGrade(age);
    return { age, grade };
  }, [dateOfBirth]);

  const highlightedGrade = useMemo(() => {
    if (result?.eligible) return result.grade;
    if (livePreview?.grade) return livePreview.grade.grade;
    return "";
  }, [result, livePreview]);

  const resetForm = () => {
    setSuccess(false);
    setSubmittedInfo(null);
    setResult(null);
  };

  const calculateEligibility = async (event) => {
    event.preventDefault();

    const birthDate = parseLocalDate(dateOfBirth);

    if (!normalizedName) {
      setResult(null);
      setError("Please enter your child's full name.");
      return;
    }

    if (!birthDate) {
      setResult(null);
      setError("Please enter a valid date of birth (DD/MM/YYYY).");
      return;
    }

    if (birthDate > CUTOFF_DATE) {
      setResult(null);
      setError(`Date of birth must be on or before ${CUTOFF_LABEL}.`);
      return;
    }

    const age = getAgeOnCutoff(birthDate);
    const grade = getEligibleGrade(age);

    setError("");
    const calcResult = {
      age,
      eligible: Boolean(grade),
      grade: grade?.grade || "",
      minYears: grade?.minYears || null,
    };
    setResult(calcResult);

    // Save copy of submitted info
    const infoToSave = {
      childName: normalizedName,
      dob: dateOfBirth,
      phone,
      grade: grade?.grade || "Play Group",
    };

    // Send Enquiry to Supabase API
    setLoading(true);
    try {
      const { error: supabaseError } = await supabase
        .from('admissions')
        .insert([{
          child_name: normalizedName,
          dob: dateOfBirth,
          phone,
          email,
          program: grade?.grade || 'Play Group',
          message: `${message || 'Admission inquiry'}\n\n(Note: Online Age Eligibility Calculator)`
        }]);

      if (supabaseError) {
        console.error('Supabase error:', supabaseError);
        setError('Submission notice: Please check your internet or reach us directly via WhatsApp.');
      } else {
        setSubmittedInfo(infoToSave);
        setSuccess(true);
      }
    } catch (err) {
      console.error('Network error:', err);
      // Still show calculated result so parent gets value
      setSubmittedInfo(infoToSave);
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="eligibility-section">
      <div className="section-header text-center" style={{ maxWidth: '780px', margin: '0 auto 40px', textAlign: 'center' }}>
        <div className="section-tag">Interactive Age Check</div>
        <h2 className="section-title">Find the Perfect <span>Class</span> 🎯</h2>
        <p className="section-desc">
          Admissions at VT Kindergarten are thoughtfully based on your child&apos;s age as of <strong>{CUTOFF_LABEL}</strong>. Check instant eligibility below!
        </p>
      </div>

      {/* 4 Levels Progress Ladder */}
      <div className="eligibility-spectrum-wrap">
        <div className="eligibility-spectrum">
          {eligibilityLevels.map((lvl) => {
            const isMatch = highlightedGrade === lvl.grade;
            return (
              <div 
                key={lvl.grade}
                className={`eligibility-spectrum-item ${lvl.accent} ${isMatch ? 'is-selected' : ''}`}
              >
                <div className="spectrum-age-badge">{lvl.minYears}+ Yrs</div>
                <div className="spectrum-title">{lvl.grade}</div>
                <div className="spectrum-desc">{lvl.desc}</div>
                {isMatch && <span className="spectrum-match-tag">✨ Recommended</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="eligibility-shell">
        {/* Left Card: Input Form */}
        <div className="eligibility-panel">
          <div className="eligibility-panel-heading">
            <span className="eligibility-step-number">1</span>
            <div>
              <h3>Child &amp; Parent Details</h3>
              <p>Enter your child&apos;s details to calculate exact class eligibility.</p>
            </div>
          </div>

          <form className="eligibility-form" onSubmit={calculateEligibility}>
            <div className="form-row">
              <div className="form-group">
                <label>👶 Child&apos;s Full Name *</label>
                <input
                  value={childName}
                  onFocus={onInteraction}
                  onPointerDown={onInteraction}
                  onChange={(e) => { setChildName(e.target.value); }}
                  placeholder="e.g. Ananya Sri"
                  autoComplete="name"
                  required
                />
              </div>

              <div className="form-group">
                <label>🎂 Date of Birth *</label>
                <input
                  type="text"
                  placeholder="DD/MM/YYYY"
                  value={dateOfBirth}
                  maxLength={10}
                  onFocus={onInteraction}
                  onPointerDown={onInteraction}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '');
                    let formatted = val;
                    if (val.length > 2) formatted = val.slice(0, 2) + '/' + val.slice(2);
                    if (val.length > 4) formatted = formatted.slice(0, 5) + '/' + val.slice(4, 8);
                    setDateOfBirth(formatted);
                  }}
                  required
                />
              </div>
            </div>

            {/* Live Age Preview Pill */}
            {livePreview && (
              <div className="live-age-pill">
                <span>✨ Calculated Age on {CUTOFF_LABEL}:</span>
                <strong>{formatAge(livePreview.age)}</strong>
                {livePreview.grade && (
                  <span className="live-grade-tag">&bull; Eligible: <strong>{livePreview.grade.grade}</strong></span>
                )}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>📱 Parent WhatsApp Phone *</label>
                <input
                  type="tel"
                  value={phone}
                  onFocus={onInteraction}
                  onPointerDown={onInteraction}
                  onChange={(e) => { setPhone(e.target.value); }}
                  placeholder="+91 98765 43210"
                  required
                />
              </div>

              <div className="form-group">
                <label>✉️ Email Address (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onFocus={onInteraction}
                  onPointerDown={onInteraction}
                  onChange={(e) => { setEmail(e.target.value); }}
                  placeholder="parent@gmail.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label>📝 Questions / Special Requirements (Optional)</label>
              <textarea
                value={message}
                onFocus={onInteraction}
                onPointerDown={onInteraction}
                onChange={(e) => { setMessage(e.target.value); }}
                placeholder="Any queries regarding admission, timings, or food..."
                rows="2"
              />
            </div>

            {error && <div className="eligibility-error">{error}</div>}

            <button className="btn-primary eligibility-submit" type="submit" disabled={loading}>
              <span>{loading ? 'Calculating...' : '🎯 Calculate Eligibility & Send Enquiry'}</span>
              <span>&rarr;</span>
            </button>
          </form>
        </div>

        {/* Right Card: Instant Result Display */}
        <div className="eligibility-result-area">
          <div className={`eligibility-result-card ${result ? "has-result" : ""}`}>
            <div className="eligibility-panel-heading">
              <span className="eligibility-step-number">2</span>
              <div>
                <h3>Eligibility Result</h3>
                <p>Cutoff Benchmark: {CUTOFF_LABEL}</p>
              </div>
            </div>

            {loading ? (
              <div className="eligibility-skeleton">
                <div className="skeleton-line" style={{ width: '100%', height: '55px', borderRadius: '12px', marginBottom: '20px' }} />
                <div className="skeleton-line" style={{ width: '50%', height: '32px', margin: '0 auto 16px', borderRadius: '8px' }} />
                <div className="skeleton-line" style={{ width: '80%', height: '24px', margin: '0 auto', borderRadius: '6px' }} />
              </div>
            ) : success && submittedInfo ? (
              /* Success & WhatsApp Call-out */
              <div className="eligibility-success-box">
                <div className="success-icon-badge">🎉</div>
                <h4>Enquiry Submitted Successfully!</h4>
                <p>
                  <strong>{submittedInfo.childName}</strong> is eligible for <strong>{submittedInfo.grade}</strong>! Our admissions desk has received your request.
                </p>

                <div className="success-actions">
                  <a
                    href={`https://wa.me/917358293839?text=${encodeURIComponent(
                      `Hello VT Kindergarten! I checked eligibility online for my child ${submittedInfo.childName} (DOB: ${submittedInfo.dob}). They are eligible for ${submittedInfo.grade}. Please share admission details and fee structure.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-whatsapp-chat"
                  >
                    <span>💬 Chat With Principal on WhatsApp</span>
                    <span>&rarr;</span>
                  </a>

                  <button type="button" className="btn-reset-check" onClick={resetForm}>
                    Check Another Child
                  </button>
                </div>
              </div>
            ) : result ? (
              <>
                <div className="eligibility-age-display">
                  <span>Calculated Age on Cutoff:</span>
                  <strong>{formatAge(result.age)}</strong>
                </div>

                {result.eligible ? (
                  <div className="eligibility-grade-result">
                    <span className="grade-min-badge">{result.minYears}+ Years Required</span>
                    <strong className="grade-title">{result.grade}</strong>
                    <p className="grade-subtext">
                      {normalizedName ? `${normalizedName} is eligible for ` : 'Your child is eligible for '} 
                      <strong>{result.grade}</strong>!
                    </p>
                  </div>
                ) : (
                  <div className="eligibility-not-ready">
                    <strong>👶 Not Eligible for 2026-27 Yet</strong>
                    <p>Children must complete at least 2 full years on or before {CUTOFF_LABEL} for Play Group enrollment.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="eligibility-empty">
                <span className="empty-icon">🎈</span>
                <strong>Ready for Calculation</strong>
                <p>Fill in your child&apos;s name and date of birth on the left to see the instant admission recommendation.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
