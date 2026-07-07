import { useMemo, useState } from "react";

const CUTOFF_DATE = new Date(2026, 2, 31);
const CUTOFF_LABEL = "31 March 2026";

const eligibilityLevels = [
  { grade: "Play Group", minYears: 2, accent: "orange" },
  { grade: "Pre KG", minYears: 3, accent: "teal" },
  { grade: "LKG", minYears: 4, accent: "yellow" },
  { grade: "UKG", minYears: 5, accent: "purple" },
];

function parseLocalDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
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

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function AgeEligibilityCalculator({ onInteraction }) {
  const [childName, setChildName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const normalizedName = childName.trim();

  const highlightedGrade = useMemo(() => {
    if (!result?.eligible) return "";
    return result.grade;
  }, [result]);

  const calculateEligibility = async (event) => {
    event.preventDefault();
    const birthDate = parseLocalDate(dateOfBirth);

    if (!normalizedName) {
      setResult(null);
      setError("Please enter the child name.");
      return;
    }

    if (!birthDate) {
      setResult(null);
      setError("Please select the child date of birth.");
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
    setResult({
      age,
      eligible: Boolean(grade),
      grade: grade?.grade || "",
      minYears: grade?.minYears || null,
    });

    if (grade) {
      setLoading(true);
      try {
        const payload = {
          name: normalizedName,
          phone,
          email,
          program: grade.grade,
          message: `${message}\n\n(System Note: Eligible for ${grade.grade}, Age on cutoff: ${formatAge(age)})`,
        };
        const res = await fetch(`${API}/enquiries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          setSuccess(true);
          setChildName(''); setDateOfBirth(''); setPhone(''); setEmail(''); setMessage('');
        } else {
          setError(data.message || 'Submission failed.');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="eligibility-section">
      <div className="section-header eligibility-header">
        <div className="section-tag">Age Eligibility</div>
        <h2 className="section-title">Find the Right <span>Class</span></h2>
        <p className="section-desc">
          Admission class is decided by the child's age on {CUTOFF_LABEL}.
        </p>
      </div>

      <div className="eligibility-shell">
        <div className="eligibility-panel">
          <div className="eligibility-panel-heading">
            <span className="eligibility-step-number">1</span>
            <div>
              <h3>Child Details</h3>
              <p>Enter the name and date of birth.</p>
            </div>
          </div>

          <form className="eligibility-form" onSubmit={calculateEligibility}>
            <div className="form-row">
              <div className="form-group">
                <label>Child Name *</label>
                <input
                  value={childName}
                  onFocus={onInteraction}
                  onPointerDown={onInteraction}
                  onChange={(event) => setChildName(event.target.value)}
                  placeholder="Child name"
                  autoComplete="name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Date of Birth *</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  max="2026-03-31"
                  onFocus={onInteraction}
                  onPointerDown={onInteraction}
                  onChange={(event) => setDateOfBirth(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  value={phone}
                  onFocus={onInteraction}
                  onPointerDown={onInteraction}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onFocus={onInteraction}
                  onPointerDown={onInteraction}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter the email ID"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Message (Optional)</label>
              <textarea
                value={message}
                onFocus={onInteraction}
                onPointerDown={onInteraction}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Any questions you have?"
                rows="3"
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            {error && <div className="eligibility-error">{error}</div>}

            <button className="btn-primary eligibility-submit" type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Check & Send Enquiry'}
            </button>
          </form>
        </div>

        <div className="eligibility-result-area">
          <div className={`eligibility-result-card ${result || success ? "has-result" : ""}`}>
            {success ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>{"\u2705"}</span>
                <h3 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 24, marginBottom: 8 }}>Enquiry Sent!</h3>
                <p>We've received your details and will contact you shortly.</p>
                {result?.grade && (
                  <p style={{ marginTop: 12, fontSize: 14, color: 'var(--primary)' }}>
                    (Eligible for {result.grade})
                  </p>
                )}
                <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => { setSuccess(false); setResult(null); }}>
                  Check Another
                </button>
              </div>
            ) : (
              <>
                <div className="eligibility-panel-heading">
                  <span className="eligibility-step-number">2</span>
                  <div>
                    <h3>Eligible Grade</h3>
                    <p>Cutoff date: {CUTOFF_LABEL}</p>
                  </div>
                </div>

                {result ? (
                  <>
                    <div className="eligibility-age-display">
                      <span>Age on cutoff</span>
                      <strong>{formatAge(result.age)}</strong>
                    </div>

                    {result.eligible ? (
                      <div className="eligibility-grade-result">
                        <span>{result.minYears}+ years</span>
                        <strong>{result.grade}</strong>
                        <p>{normalizedName} is eligible for {result.grade}.</p>
                      </div>
                    ) : (
                      <div className="eligibility-not-ready">
                        <strong>Not eligible yet</strong>
                        <p>The child must complete 2 years on {CUTOFF_LABEL} for Play Group.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="eligibility-empty">
                    <strong>Ready to check</strong>
                    <p>The result will appear here after calculation.</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="eligibility-ladder" aria-label="Admission age rules">
            {eligibilityLevels.map((level) => (
              <div
                className={`eligibility-class-pill ${level.accent} ${
                  highlightedGrade === level.grade ? "active" : ""
                }`}
                key={level.grade}
              >
                <span>{level.minYears}+</span>
                <strong>{level.grade}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
