function Footer() {
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <footer className="footer">
      <div className="footer-top" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '32px' }}>
        <div className="footer-brand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="footer-brand-heading" style={{ justifyContent: 'center' }}>
            <img src="/assets/vt-logo.png" alt="VT Kindergarten Pre School logo" />
            <h2>VT <span>Kindergarten</span></h2>
          </div>
          <p style={{ maxWidth: '600px', margin: '0 auto 24px' }}>
            A nurturing, play-based learning environment where every child discovers
            their potential and builds the foundation for a bright future. Trusted by
            hundreds of families in Karaikudi.
          </p>
        </div>

        <div className="footer-contact-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h4 style={{ fontWeight: 800, fontSize: '18px', color: 'white', marginBottom: '16px' }}>Contact Us</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'rgba(255,255,255,0.7)', fontSize: '15px' }}>
            <strong style={{ color: 'white' }}>VT Kindergarten, Play school and Pre school</strong>
            <a href="tel:+917358293839" style={{ color: 'inherit', textDecoration: 'none' }}>+91 73582 93839</a>
            <a href="mailto:vtkindergarten@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>vtkindergarten@gmail.com</a>
          </div>

          <div className="footer-socials" style={{ justifyContent: 'center' }}>
            <a href="https://wa.me/917358293839" target="_blank" rel="noopener noreferrer" className="social-btn" style={{ background: '#25d366' }} aria-label="WhatsApp">
              💬
            </a>
            <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="social-btn" style={{ background: 'linear-gradient(45deg,#f09433,#dc2743,#bc1888)' }} aria-label="Instagram">
              {"\u{1F4F8}"}
            </a>
            <a href="#gallery" className="social-btn" style={{ background: '#007bff' }} onClick={(e) => { e.preventDefault(); scrollTo('gallery'); }} aria-label="Gallery Camera">
              📷
            </a>
          </div>
        </div>
      </div>

    </footer>
  );
}

export { Footer };
export default Footer;
