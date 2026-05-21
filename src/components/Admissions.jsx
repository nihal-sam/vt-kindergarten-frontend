import { useState } from "react";

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const initialState = {
  child_name: '', dob: '', gender: '',
  program: '', parent_name: '', relation: '',
  phone: '', email: '', address: '',
  previous_school: '', message: ''
};

export default function Admissions() {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/admissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) setSuccess(true);
      else setError(data.message || 'Submission failed. Please try again.');
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admissions-section">
      <div className="section-header">
        <div className="section-tag">Admissions 2025-26</div>
        <h2 className="section-title">Enroll Your <span>Little Star</span> Today</h2>
        <p className="section-desc" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Fill in the form below to start your child's journey with VT Kindergarten Play School.
        </p>
      </div>

      <div className="admission-form-wrap">
        {success ? (
          <div className="form-success">
            <span className="success-icon">{"\u{1F389}"}</span>
            <h3>Application Submitted!</h3>
            <p>Thank you! We'll contact you within 24 hours to confirm your admission.</p>
            <button className="btn-primary" style={{ marginTop: 24 }} onClick={() => setSuccess(false)}>Submit Another</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <h3 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 24, color: 'white', marginBottom: 28 }}>
              Child's Information
            </h3>
            <div className="form-row">
              <div className="form-group">
                <label>Child's Full Name *</label>
                <input name="child_name" placeholder="Enter child's name" value={form.child_name} onChange={handle} required />
              </div>
              <div className="form-group">
                <label>Date of Birth *</label>
                <input type="date" name="dob" value={form.dob} onChange={handle} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Gender *</label>
                <select name="gender" value={form.gender} onChange={handle} required>
                  <option value="">Select Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div className="form-group">
                <label>Program Applying For *</label>
                <select name="program" value={form.program} onChange={handle} required>
                  <option value="">Select Program</option>
                  <option>Play Group (2+ yrs)</option>
                  <option>Pre KG (3+ yrs)</option>
                  <option>LKG (4+ yrs)</option>
                  <option>UKG (5+ yrs)</option>
                </select>
              </div>
            </div>

            <h3 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 24, color: 'white', margin: '28px 0 20px' }}>
              Parent / Guardian Information
            </h3>
            <div className="form-row">
              <div className="form-group">
                <label>Parent/Guardian Name *</label>
                <input name="parent_name" placeholder="Full name" value={form.parent_name} onChange={handle} required />
              </div>
              <div className="form-group">
                <label>Relation to Child *</label>
                <select name="relation" value={form.relation} onChange={handle} required>
                  <option value="">Select Relation</option>
                  <option>Father</option>
                  <option>Mother</option>
                  <option>Guardian</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phone Number *</label>
                <input name="phone" type="tel" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={handle} required />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input name="email" type="email" placeholder="email@example.com" value={form.email} onChange={handle} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group full">
                <label>Home Address *</label>
                <input name="address" placeholder="Full address" value={form.address} onChange={handle} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Previous School (if any)</label>
                <input name="previous_school" placeholder="School name" value={form.previous_school} onChange={handle} />
              </div>
              <div className="form-group">
                <label>Additional Message</label>
                <input name="message" placeholder="Any special requirements?" value={form.message} onChange={handle} />
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(255,0,0,0.15)', border: '1px solid rgba(255,0,0,0.3)', borderRadius: 10, padding: '12px 16px', color: '#ff8888', marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button className="form-submit" type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Admission Application'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
