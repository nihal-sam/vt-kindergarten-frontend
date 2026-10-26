import { useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  CUTOFF_DATE,
  CUTOFF_LABEL,
  eligibilityLevels,
  parseLocalDate,
  getAgeOnCutoff,
  getEligibleGrade,
  formatAge,
} from "../utils/ageEligibility";

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

  const resetCheck = () => {
    if (result || error) {
      setResult(null);
      setError("");
    }
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
    const isEligible = Boolean(grade);
    const formattedAge = formatAge(age);
    const eligibleClass = isEligible ? grade.grade : "Not Eligible (< 2 Years)";
    const eligibilityStatus = isEligible ? "Eligible" : "Not Eligible";

    setError("");
    setResult({
      age,
      eligible: isEligible,
      grade: grade?.grade || "",
      minYears: grade?.minYears || null,
    });

    // Send Enquiry to Supabase admissions table
    setLoading(true);
    try {
      const messageParts = [
        `Calculated Age (on ${CUTOFF_LABEL}): ${formattedAge}`,
        `Eligibility Status: ${eligibilityStatus}`,
        `Recommended Class: ${eligibleClass}`,
      ];
      if (message && message.trim()) {
        messageParts.push(`Parent Note: ${message.trim()}`);
      }
      messageParts.push(`(Source: Online Age Eligibility Calculator)`);

      // Insert enquiry into primary cloud table student_admissions (with fallback to admissions)
      let { error: supabaseError } = await supabase
        .from('student_admissions')
        .insert([{
          child_name: normalizedName,
          dob: dateOfBirth,
          phone,
          email: email?.trim() || null,
          program: eligibleClass,
          relation: eligibilityStatus || 'Eligible',
          parent_name: normalizedName,
          message: messageParts.join('\n\n'),
          status: 'pending'
        }]);

      if (supabaseError) {
        const { error: fallbackErr } = await supabase
          .from('admissions')
          .insert([{
            child_name: normalizedName,
            dob: dateOfBirth,
            phone,
            email: email?.trim() || null,
            program: eligibleClass,
            relation: eligibilityStatus || 'Eligible',
            parent_name: normalizedName,
            message: messageParts.join('\n\n'),
            status: 'pending'
          }]);
        supabaseError = fallbackErr;
      }

      if (supabaseError) {
        console.error('Supabase error:', supabaseError);
        setError('Submission failed. Please try again.');
      } else {
        setSuccess(true);
        setChildName(''); setDateOfBirth(''); setPhone(''); setEmail(''); setMessage('');
        setTimeout(() => setSuccess(false), 6000);
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="eligibility-section">
      <div className="section-header eligibility-header">
        <div className="section-tag">Age Eligibility</div>
        <h2 className="section-title">Find the Right <span>Class</span></h2>
        <p className="section-desc">
          Admission class is decided by the child&apos;s age on {CUTOFF_LABEL}.
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
                  onChange={(event) => { setChildName(event.target.value); resetCheck(); }}
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
                    resetCheck();
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
                  onChange={(event) => { setPhone(event.target.value); resetCheck(); }}
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
                  onChange={(event) => { setEmail(event.target.value); resetCheck(); }}
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
                onChange={(event) => { setMessage(event.target.value); resetCheck(); }}
                placeholder="Any questions you have?"
                rows="3"
              />
            </div>

            {error && <div className="eligibility-error">{error}</div>}

            <button className="btn-primary eligibility-submit" type="submit" disabled={loading}>
              <span>{loading ? 'Processing...' : 'Check Eligibility & Send Enquiry'}</span>
              <span className="btn-arrow">&rarr;</span>
            </button>
          </form>
        </div>

        <div className="eligibility-result-area">
          <div className={`eligibility-result-card ${result ? "has-result" : ""}`}>
            <div className="eligibility-panel-heading">
              <span className="eligibility-step-number">2</span>
              <div>
                <h3>Eligible Grade</h3>
                <p>Cutoff date: {CUTOFF_LABEL}</p>
              </div>
            </div>

            {loading ? (
              <div className="eligibility-skeleton">
                <div className="skeleton-line" style={{ width: '100%', height: '60px', borderRadius: '12px', marginBottom: '24px' }}></div>
                <div className="skeleton-line" style={{ width: '40%', height: '32px', margin: '0 auto 16px', borderRadius: '8px' }}></div>
                <div className="skeleton-line" style={{ width: '80%', height: '24px', margin: '0 auto 8px', borderRadius: '4px' }}></div>
                <div className="skeleton-line" style={{ width: '60%', height: '16px', margin: '0 auto', borderRadius: '4px' }}></div>
              </div>
            ) : result ? (
              <>
                <div className="eligibility-age-display">
                  <span>Age on cutoff</span>
                  <strong>{formatAge(result.age)}</strong>
                </div>

                {result.eligible ? (
                  <div className="eligibility-grade-result">
                    <span className="grade-badge">{result.minYears}+ years</span>
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

      {success && (
        <div className="eligibility-toast-success">
          <span className="toast-icon">✨</span> 
          <span>Enquiry sent successfully! We will contact you soon.</span>
        </div>
      )}
    </div>
  );
}
