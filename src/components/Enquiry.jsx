import { useState } from "react";

import { useEffect } from "react";

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function Enquiry({ prefill }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', program: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!prefill) return;

    setSuccess(false);
    setForm((current) => ({
      ...current,
      name: prefill.name || current.name,
      program: prefill.program || current.program,
      message: prefill.message || current.message,
    }));
  }, [prefill]);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) { setSuccess(true); setForm({ name: '', phone: '', email: '', program: '', message: '' }); }
      else setError(data.message || 'Submission failed.');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="enquiry-section" style={{ paddingBottom: '20px', marginBottom: '-60px', position: 'relative', zIndex: 10 }}>
      <div className="enquiry-grid">
        <div className="enquiry-info">
          <div className="section-tag">Get In Touch</div>
          <h2>Have Questions? <span>Ask Us!</span></h2>
          <p>
            We'd love to hear from you! Whether you want to schedule a school visit, ask about our programs,
            or learn about admissions, our friendly team is here to help.
          </p>

        </div>

        <div className="enquiry-form">
          {success ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <span style={{ fontSize: 64, display: 'block', marginBottom: 16 }}>{"\u2705"}</span>
              <h3 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 28, marginBottom: 12 }}>
                Enquiry Sent!
              </h3>
              <p style={{ color: '#888' }}>We'll get back to you within 24 hours.</p>
              <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => setSuccess(false)}>Send Another</button>
            </div>
          ) : (
            <>
              <form onSubmit={submit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Child Name *</label>
                    <input name="name" placeholder="Child name" value={form.name} onChange={handle} required />
                  </div>
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input name="phone" type="tel" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={handle} required />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label>Email Address</label>
                  <input name="email" type="email" placeholder="email@example.com" value={form.email} onChange={handle} />
                </div>
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label>Interested Program</label>
                  <select name="program" value={form.program} onChange={handle}>
                    <option value="">Select Program</option>
                    <option>Play Group</option>
                    <option>Pre KG</option>
                    <option>LKG</option>
                    <option>UKG</option>
                    <option>General Enquiry</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label>Message *</label>
                  <textarea name="message" placeholder="Your question or message..." value={form.message} onChange={handle} required />
                </div>
                {error && <div style={{ color: 'red', marginBottom: 12, fontSize: 14 }}>{error}</div>}
                <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                  {loading ? 'Sending...' : 'Send Enquiry'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
