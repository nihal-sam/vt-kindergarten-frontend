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
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15729.805568461746!2d78.761009!3d10.067341!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b005d5c5f4b0001%3A0x2a3e0f76!2sSubramaniapuram%2C%20Karaikudi%2C%20Tamil%20Nadu%20630002!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin" 
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
              href="https://maps.google.com/?q=Subramaniapuram,Karaikudi"
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
              <p>11, 7th Street, South Extension, Vairavapuram, Subramaniapuram, Karaikudi - 630002</p>
            </div>
            <div className="info-box">
              <h4>📞 Phone</h4>
              <p>+91 98765 43210<br/>+91 94321 09876</p>
            </div>
            <div className="info-box">
              <h4>⏰ Timings</h4>
              <p>Monday – Saturday<br/>9:00 AM – 1:00 PM</p>
            </div>
            <div className="info-box">
              <h4>🏫 Programs</h4>
              <p>Play Group · Pre KG<br/>LKG · UKG</p>
            </div>
            <div className="info-box">
              <h4>📧 Email</h4>
              <p>vtkindergarten@gmail.com</p>
            </div>
            <div className="info-box">
              <h4>🌟 Landmark</h4>
              <p>Near Reliance Smart Bazaar, Subramaniapuram</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
