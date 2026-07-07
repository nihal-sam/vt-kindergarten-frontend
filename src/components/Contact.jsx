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
      <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
        <div>
          <div className="map-wrap" style={{ padding: 0, overflow: 'hidden', minHeight: '400px', display: 'flex', borderRadius: '16px', boxShadow: 'var(--shadow-soft)' }}>
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
          <div style={{ marginTop: 24 }}>
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
