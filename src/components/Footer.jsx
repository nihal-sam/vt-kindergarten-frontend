function Footer() {
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <div className="footer-brand-heading">
            <img src="/assets/vt-logo.png" alt="VT Kindergarten Pre School logo" />
            <h2>VT <span>Kindergarten</span></h2>
          </div>
          <p>
            A nurturing, play-based learning environment where every child discovers
            their potential and builds the foundation for a bright future. Trusted by
            hundreds of families in Karaikudi.
          </p>
          <div className="footer-socials">
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="social-btn"
              style={{ background: 'linear-gradient(45deg,#f09433,#dc2743,#bc1888)' }}
            >
              {"\u{1F4F8}"}
            </a>
            <a href="tel:+919876543210" className="social-btn" style={{ background: '#25d366' }}>
              {"\u260E"}
            </a>
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="social-btn"
              style={{ background: '#25d366' }}
            >
              {"\u{1F4AC}"}
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Quick Links</h4>
          <ul>
            {['home', 'eligibility', 'about', 'programs', 'gallery', 'enquiry', 'contact'].map((link) => (
              <li key={link}>
                <a href={`#${link}`} onClick={(event) => { event.preventDefault(); scrollTo(link); }}>
                  {link === 'eligibility' ? 'Age Check' : link.charAt(0).toUpperCase() + link.slice(1)}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-col">
          <h4>Programs</h4>
          <ul>
            <li><a href="#programs">Play Group (2+ yrs)</a></li>
            <li><a href="#programs">Pre KG (3+ yrs)</a></li>
            <li><a href="#programs">LKG (4+ yrs)</a></li>
            <li><a href="#programs">UKG (5+ yrs)</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Contact</h4>
          <ul>
            <li><a href="tel:+919876543210">+91 98765 43210</a></li>
            <li><a href="mailto:vtkindergarten@gmail.com">Email Us</a></li>
            <li><a href="https://maps.google.com" target="_blank" rel="noopener noreferrer">Subramaniapuram, Karaikudi</a></li>
            <li><a href="#home">Mon-Sat: 9AM-1PM</a></li>
          </ul>
        </div>
      </div>

    </footer>
  );
}

export { Footer };
export default Footer;
