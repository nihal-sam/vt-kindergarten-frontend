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

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function AgeEligibilityCalculator({ onInteraction }) {
  const [childName, setChildName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);

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
      // 1. Scroll down to result area
      setTimeout(() => {
        const resultArea = document.querySelector('.eligibility-result-area');
        if (resultArea) {
          resultArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      // 2. Wait 3 seconds, then open the Share Modal
      setTimeout(() => {
        setShowShareModal(true);
      }, 3000);
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
                  type="text"
                  placeholder="DD/MM/YYYY"
                  value={dateOfBirth}
                  onFocus={onInteraction}
                  onPointerDown={onInteraction}
                  onChange={(event) => {
                    let val = event.target.value.replace(/\D/g, '');
                    let formatted = val;
                    if (val.length > 2) formatted = val.slice(0, 2) + '/' + val.slice(2);
                    if (val.length > 4) formatted = formatted.slice(0, 5) + '/' + val.slice(4, 8);
                    setDateOfBirth(formatted);
                  }}
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

            <button className="btn-primary eligibility-submit" type="submit">
              Check Eligibility
            </button>
          </form>
        </div>

        <div className="eligibility-result-area">
          <div className={`eligibility-result-card ${result ? "has-result" : ""}`}>
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
                )}
              </>
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

      {/* Share Modal */}
      {showShareModal && (
        <div className="share-modal-overlay">
          <div className="share-modal-content">
            <button className="share-modal-close" onClick={() => setShowShareModal(false)}>×</button>
            <div className="share-modal-icon">✨</div>
            <h3>Share Details?</h3>
            <p>Would you like to share these details with us directly?</p>
            
            <div className="share-modal-actions">
              <a 
                href={`https://wa.me/917358293839?text=${encodeURIComponent(
                  `Hello, I would like to inquire about admissions.\n\nChild Name: ${childName.trim()}\nDate of Birth: ${dateOfBirth}\nPhone: ${phone}\nEligible Grade: ${result?.grade || 'N/A'}${message ? `\nMessage: ${message}` : ''}`
                )}`}
                target="_blank" 
                rel="noopener noreferrer" 
                className="share-btn whatsapp"
                onClick={() => setShowShareModal(false)}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
              <a 
                href={`mailto:vtkindergarten@gmail.com?subject=${encodeURIComponent('Admission Inquiry - ' + childName.trim())}&body=${encodeURIComponent(
                  `Hello,\n\nI would like to inquire about admissions.\n\nChild Name: ${childName.trim()}\nDate of Birth: ${dateOfBirth}\nPhone: ${phone}\nEligible Grade: ${result?.grade || 'N/A'}${message ? `\nMessage: ${message}` : ''}`
                )}`}
                className="share-btn gmail"
                onClick={() => setShowShareModal(false)}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/></svg>
                Gmail
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
