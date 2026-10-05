function Footer() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 85;
      const target = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(target, 0), behavior: 'smooth' });
    }
  };

  return (
    <footer className="footer-premium">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Col 1: Brand & Bio */}
          <div className="footer-brand-col">
            <div className="footer-logo-wrap">
              <img src="/assets/vt-logo.png" alt="VT Kindergarten Logo" className="footer-logo-img" />
              <div>
                <h3 className="footer-brand-title">VT Kindergarten</h3>
                <span className="footer-brand-subtitle">Pre School &bull; Karaikudi</span>
              </div>
            </div>
            <p className="footer-brand-desc">
              Trusted by parents across Karaikudi, VT Kindergarten provides a nurturing, safe, and joyful early childhood environment where children grow with bright confidence and creativity.
            </p>
            <div className="footer-trust-tag">
              <span>🌟 Admissions Open for Academic Year 2026&ndash;2027</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="footer-col">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-nav-list">
              <li><a href="#home" onClick={(e) => { e.preventDefault(); scrollTo('home'); }}>Home</a></li>
              <li><a href="#eligibility" onClick={(e) => { e.preventDefault(); scrollTo('eligibility'); }}>Age Check &amp; Admissions</a></li>
              <li><a href="#about" onClick={(e) => { e.preventDefault(); scrollTo('about'); }}>About VT Kindergarten</a></li>
              <li><a href="#programs" onClick={(e) => { e.preventDefault(); scrollTo('programs'); }}>Academic Programs</a></li>
              <li><a href="#founder" onClick={(e) => { e.preventDefault(); scrollTo('founder'); }}>Founders&apos; Legacy</a></li>
              <li><a href="#gallery" onClick={(e) => { e.preventDefault(); scrollTo('gallery'); }}>Life at VT (Gallery)</a></li>
              <li><a href="#contact" onClick={(e) => { e.preventDefault(); scrollTo('contact'); }}>Campus Location &amp; Contact</a></li>
            </ul>
          </div>

          {/* Col 3: Programs */}
          <div className="footer-col">
            <h4 className="footer-heading">Our Classes</h4>
            <ul className="footer-nav-list">
              <li><a href="#eligibility" onClick={(e) => { e.preventDefault(); scrollTo('eligibility'); }}>🌱 Play Group (2+ Years)</a></li>
              <li><a href="#eligibility" onClick={(e) => { e.preventDefault(); scrollTo('eligibility'); }}>🌸 Pre KG (3+ Years)</a></li>
              <li><a href="#eligibility" onClick={(e) => { e.preventDefault(); scrollTo('eligibility'); }}>📖 LKG (4+ Years)</a></li>
              <li><a href="#eligibility" onClick={(e) => { e.preventDefault(); scrollTo('eligibility'); }}>🎓 UKG (5+ Years)</a></li>
            </ul>
            <div style={{ marginTop: 20 }}>
              <h4 className="footer-heading" style={{ fontSize: '14px', marginBottom: '8px' }}>Office Timings</h4>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
                Mon &ndash; Sat: 9:00 AM &ndash; 5:30 PM
              </p>
            </div>
          </div>

          {/* Col 4: Contact & Socials */}
          <div className="footer-col">
            <h4 className="footer-heading">Connect With Us</h4>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.6, marginBottom: 16 }}>
              11, 7th St, Subramaniapuram, Karaikudi, Tamil Nadu 630002
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              <a href="tel:+917358293839" className="footer-contact-link">
                📞 +91 73582 93839
              </a>
              <a href="mailto:vtkindergarten@gmail.com" className="footer-contact-link">
                ✉️ vtkindergarten@gmail.com
              </a>
            </div>

            <div className="footer-social-btns">
              <a 
                href="https://wa.me/917358293839" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="footer-social-btn btn-wa"
                title="Chat on WhatsApp"
                aria-label="WhatsApp"
              >
                💬
              </a>
              <a 
                href="https://www.instagram.com/vt_kindergarten/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="footer-social-btn btn-ig"
                title="Follow on Instagram"
                aria-label="Instagram"
              >
                📷
              </a>
              <a 
                href="mailto:vtkindergarten@gmail.com" 
                className="footer-social-btn btn-mail"
                title="Email Us"
                aria-label="Email"
              >
                ✉️
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <p className="footer-copyright">
            &copy; {new Date().getFullYear()} VT Kindergarten Pre School, Karaikudi. All rights reserved.
          </p>
          <p className="footer-tagline">
            Nurturing Little Stars with Love, Values &amp; Play 🌟
          </p>
        </div>
      </div>
    </footer>
  );
}

export { Footer };
export default Footer;
