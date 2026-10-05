export default function Contact() {
  return (
    <div className="contact-section">
      <div className="section-header text-center" style={{ maxWidth: '780px', margin: '0 auto 48px', textAlign: 'center' }}>
        <div className="section-tag">Get in Touch</div>
        <h2 className="section-title">Visit Our <span>Campus</span> 📍</h2>
        <p className="section-desc">
          We welcome prospective parents to tour our school, meet our certified mentors, and experience the warm, loving atmosphere at VT Kindergarten.
        </p>
      </div>

      <div className="contact-grid">
        {/* Left Column: Direct Info Cards */}
        <div className="contact-cards-column">
          {/* Card 1: Address */}
          <div className="contact-card-premium">
            <div className="contact-card-icon-wrap" style={{ background: '#FFF7ED', color: '#EA580C' }}>
              📍
            </div>
            <div className="contact-card-info">
              <h4>Campus Location</h4>
              <p>VT Kindergarten, 11, 7th St, Subramaniapuram, Karaikudi, Tamil Nadu 630002</p>
              <a 
                href="https://maps.google.com/?q=VT+Kindergarten,+Play+school+and+Pre+school,+11,+7th+St,+near+Reliance+Smart+Bazaar,+Subramaniapuram,+south+extension,+Vairavapuram,+Karaikkudi+(M.Corp),+Tamil+Nadu+630002"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-card-link"
              >
                <span>Open in Google Maps</span>
                <span>&rarr;</span>
              </a>
            </div>
          </div>

          {/* Card 2: Phone */}
          <div className="contact-card-premium">
            <div className="contact-card-icon-wrap" style={{ background: '#F0FDFA', color: '#0D9488' }}>
              📞
            </div>
            <div className="contact-card-info">
              <h4>Call Admissions Desk</h4>
              <p>Direct line for admission enquiries and school visit appointments.</p>
              <a href="tel:+917358293839" className="contact-card-link" style={{ fontSize: '17px', fontWeight: 800 }}>
                <span>+91 73582 93839</span>
              </a>
            </div>
          </div>

          {/* Card 3: WhatsApp */}
          <div className="contact-card-premium">
            <div className="contact-card-icon-wrap" style={{ background: '#DCFCE7', color: '#16A34A' }}>
              💬
            </div>
            <div className="contact-card-info">
              <h4>Instant WhatsApp Chat</h4>
              <p>Message our coordinator directly for fee structure, brochure, and admissions.</p>
              <a 
                href="https://wa.me/917358293839?text=Hello%20VT%20Kindergarten,%20I%20would%20like%20to%20inquire%20about%20admissions"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-card-link"
                style={{ color: '#16A34A' }}
              >
                <span>Chat on WhatsApp (Instant Reply) &rarr;</span>
              </a>
            </div>
          </div>

          {/* Card 4: Hours */}
          <div className="contact-card-premium">
            <div className="contact-card-icon-wrap" style={{ background: '#FAF5FF', color: '#9333EA' }}>
              ⏰
            </div>
            <div className="contact-card-info">
              <h4>School &amp; Office Hours</h4>
              <p><strong>Monday &ndash; Saturday:</strong> 9:00 AM &ndash; 5:30 PM</p>
              <p style={{ marginTop: 4, color: '#94A3B8', fontSize: '13px' }}>Campus visits are welcomed during office hours.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Google Maps Embed */}
        <div className="contact-map-column">
          <div className="contact-map-wrapper">
            <div className="contact-map-badge">
              <span>📍 VT Kindergarten Campus</span>
            </div>
            <iframe 
              src="https://maps.google.com/maps?q=VT+Kindergarten,+Play+school+and+Pre+school,+11,+7th+St,+near+Reliance+Smart+Bazaar,+Subramaniapuram,+south+extension,+Vairavapuram,+Karaikkudi+(M.Corp),+Tamil+Nadu+630002&t=&z=16&ie=UTF8&output=embed" 
              width="100%" 
              height="100%" 
              style={{ border: 0, minHeight: '440px', width: '100%', display: 'block' }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="VT Kindergarten Location Map"
            />
          </div>

          <div style={{ marginTop: 18, textAlign: 'center' }}>
            <a
              href="https://maps.google.com/?q=VT+Kindergarten,+Play+school+and+Pre+school,+11,+7th+St,+near+Reliance+Smart+Bazaar,+Subramaniapuram,+south+extension,+Vairavapuram,+Karaikkudi+(M.Corp),+Tamil+Nadu+630002"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <span>🗺️ Get Turn-by-Turn Directions in Google Maps</span>
              <span>&rarr;</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
