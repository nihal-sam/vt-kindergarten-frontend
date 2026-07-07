export default function Contact() {
  return (
    <div className="contact-section">
      <div className="section-header">
        <div className="section-tag">Location</div>
        <h2 className="section-title">Find <span>Us Easily</span> 📍</h2>
        <p className="section-desc">
          Conveniently located near Reliance Smart Bazaar, Subramaniapuram, Karaikudi.
        </p>
      </div>
      <div className="contact-grid">
        <div>
          <div className="map-wrap" style={{ padding: 0, overflow: 'hidden', minHeight: '300px', display: 'flex' }}>
            <iframe 
              src="https://maps.google.com/maps?q=VT+Kindergarten,+Play+school+and+Pre+school,+11,+7th+St,+near+Reliance+Smart+Bazaar,+Subramaniapuram,+south+extension,+Vairavapuram,+Karaikkudi+(M.Corp),+Tamil+Nadu+630002&t=&z=16&ie=UTF8&output=embed" 
              width="100%" 
              height="100%" 
              style={{ border: 0, flex: 1 }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
          <div style={{ marginTop: 16 }}>
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

        <div>
          <h3 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 36, marginBottom: 16, color: 'var(--dark)' }}>
            School Information
          </h3>
          <div className="info-grid">
            <div className="info-box">
              <h4>📍 Address</h4>
              <p>VT Kindergarten, Play school and Pre school, 11, 7th St, near Reliance Smart Bazaar, Subramaniapuram, south extension, Vairavapuram, Karaikkudi (M.Corp), Tamil Nadu 630002</p>
            </div>
            <div className="info-box">
              <h4>📞 Phone</h4>
              <p>+91 73582 93839</p>
            </div>
            <div className="info-box">
              <h4>🏫 Programs</h4>
              <p>Play Group · Pre KG<br/>LKG · UKG</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
