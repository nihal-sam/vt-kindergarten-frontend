export default function Contact() {
  return (
    <div className="contact-section" style={{ padding: '60px 20px', position: 'relative', zIndex: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '64px', maxWidth: '1100px', margin: '0 auto', alignItems: 'flex-start' }}>
        
        {/* Left Side: Get In Touch */}
        <div className="contact-info" style={{ flex: '1 1 400px', textAlign: 'center' }}>
          <div className="section-tag" style={{ margin: '0 auto 16px' }}>Get In Touch</div>
          <h2>Have Questions? <span>Ask Us!</span></h2>
          <p style={{ maxWidth: '400px', margin: '0 auto 32px' }}>
            We'd love to hear from you! Whether you want to schedule a school visit or learn about admissions, our friendly team is here to help.
          </p>
          <div className="contact-cards" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <div className="contact-card" style={{ width: '100%', maxWidth: '440px', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', background: 'white', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-soft)' }}>
              <div className="contact-icon orange" style={{ fontSize: '28px', flexShrink: 0, width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '14px', background: 'rgba(255,107,53,0.1)' }}>📍</div>
              <div className="contact-card-text" style={{ textAlign: 'left' }}>
                <h4 style={{ color: 'var(--primary)', marginBottom: '4px', fontSize: '16px', fontWeight: 800 }}>Address</h4>
                <p style={{ margin: 0, fontSize: '15px', color: '#888' }}>VT Kindergarten, 11, 7th St, Subramaniapuram, Karaikkudi</p>
              </div>
            </div>
            <div className="contact-card" style={{ width: '100%', maxWidth: '440px', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', background: 'white', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-soft)' }}>
              <div className="contact-icon teal" style={{ fontSize: '28px', flexShrink: 0, width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '14px', background: 'rgba(78,205,196,0.1)' }}>📞</div>
              <div className="contact-card-text" style={{ textAlign: 'left' }}>
                <h4 style={{ color: '#4ecdc4', marginBottom: '4px', fontSize: '16px', fontWeight: 800 }}>Phone Number</h4>
                <p style={{ margin: 0, fontSize: '15px', color: '#888' }}>+91 73582 93839</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Location Map */}
        <div className="contact-location" style={{ flex: '1 1 400px' }}>
          <div className="section-tag" style={{ margin: '0 0 16px' }}>Location</div>
          <h2 style={{ marginBottom: '16px' }}>Find <span>Us Easily</span> 📍</h2>
          <div className="map-wrap" style={{ padding: 0, overflow: 'hidden', minHeight: '400px', height: '100%', display: 'flex', borderRadius: '16px', boxShadow: 'var(--shadow-soft)' }}>
            <iframe 
              src="https://maps.google.com/maps?q=VT+Kindergarten,+Play+school+and+Pre+school,+11,+7th+St,+near+Reliance+Smart+Bazaar,+Subramaniapuram,+south+extension,+Vairavapuram,+Karaikkudi+(M.Corp),+Tamil+Nadu+630002&t=&z=16&ie=UTF8&output=embed" 
              width="100%" 
              height="400" 
              style={{ border: 0, flex: 1 }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <a
              href="https://maps.google.com/?q=VT+Kindergarten,+Play+school+and+Pre+school,+11,+7th+St,+near+Reliance+Smart+Bazaar,+Subramaniapuram,+south+extension,+Vairavapuram,+Karaikkudi+(M.Corp),+Tamil+Nadu+630002"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ display: 'inline-flex' }}
            >
              🗺️ Open in Google Maps
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
