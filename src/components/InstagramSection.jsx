export default function InstagramSection() {
  return (
    <div className="instagram-section" style={{ marginTop: '-40px', paddingBottom: '10px', marginBottom: '-80px', position: 'relative', zIndex: 10 }}>
      <div className="section-header">
        <div className="section-tag">{"\u{1F4F8}"} Our Journey</div>
        <h2 className="section-title">Follow Us <span>on Instagram</span></h2>
        <p className="section-desc">
          Stay connected with daily activities, events, and joyful moments from VT Kindergarten.
        </p>
      </div>



      <div className="mobile-carousel" style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', maxWidth: '1100px', margin: '40px auto 0', padding: '0 24px 20px' }}>
        {[
          'DYkClf4PE5-',
          'DWvdnvWDGvY',
          'DV0KTx1Dc90'
        ].map((reelId, index) => (
          <div 
            key={index} 
            style={{ 
              width: '100%', 
              borderRadius: '24px', 
              overflow: 'hidden', 
              boxShadow: '0 15px 35px rgba(0,0,0,0.1)', 
              border: '6px solid white', 
              background: '#000', 
              aspectRatio: '1 / 1', 
              position: 'relative', 
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
              cursor: 'pointer' 
            }}
            onMouseEnter={(e) => { 
              e.currentTarget.style.transform = 'translateY(-12px)'; 
              e.currentTarget.style.boxShadow = '0 30px 60px rgba(255,107,53,0.3)'; 
              e.currentTarget.style.borderColor = 'var(--primary)';
            }}
            onMouseLeave={(e) => { 
              e.currentTarget.style.transform = 'translateY(0)'; 
              e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.1)'; 
              e.currentTarget.style.borderColor = 'white';
            }}
          >
            <iframe 
              src={`https://www.instagram.com/reel/${reelId}/embed`}
              width="100%" 
              height="680" 
              frameBorder="0" 
              scrolling="no" 
              allowtransparency="true"
              style={{ display: 'block', marginTop: '-54px', pointerEvents: 'none' }}
            ></iframe>
            <a href={`https://www.instagram.com/reel/${reelId}/`} target="_blank" rel="noopener noreferrer" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }}></a>
          </div>
        ))}
      </div>
    </div>
  );
}
