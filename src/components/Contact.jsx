export default function Contact() {
  return (
    <div className="contact-section">
      <div className="contact-container">
        {/* Left Side: Get In Touch */}
        <div className="contact-info">
          <div className="section-tag">Get In Touch</div>
          <h2>Have Questions? <span>Ask Us!</span></h2>
          <p className="contact-desc">
            We&apos;d love to hear from you! Whether you want to schedule a school visit or learn about admissions, our friendly team is here to help.
          </p>

          <div className="contact-cards">
            <div className="contact-card">
              <div className="contact-icon orange">📍</div>
              <div className="contact-card-text">
                <h4>Address</h4>
                <p>VT Kindergarten, 11, 7th St, Subramaniapuram, Karaikkudi</p>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-icon teal">📞</div>
              <div className="contact-card-text">
                <h4>Phone Number</h4>
                <a href="tel:+917358293839" className="contact-phone-link">+91 73582 93839</a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Location Map */}
        <div className="contact-location">
          <div className="section-tag">Location</div>
          <h2>Find <span>Us Easily</span> 📍</h2>

          <div className="map-wrap">
            <iframe 
              src="https://maps.google.com/maps?q=VT+Kindergarten,+Play+school+and+Pre+school,+11,+7th+St,+near+Reliance+Smart+Bazaar,+Subramaniapuram,+south+extension,+Vairavapuram,+Karaikkudi+(M.Corp),+Tamil+Nadu+630002&t=&z=16&ie=UTF8&output=embed" 
              width="100%" 
              height="400" 
              style={{ border: 0, width: '100%', height: '100%', minHeight: '360px', display: 'block' }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="VT Kindergarten Campus Map"
            />
          </div>

          <div className="contact-map-btn-wrap">
            <a
              href="https://maps.google.com/?q=VT+Kindergarten,+Play+school+and+Pre+school,+11,+7th+St,+near+Reliance+Smart+Bazaar,+Subramaniapuram,+south+extension,+Vairavapuram,+Karaikkudi+(M.Corp),+Tamil+Nadu+630002"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <span>🗺️ Open in Google Maps</span>
              <span className="btn-arrow">&rarr;</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
