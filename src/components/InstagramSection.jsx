const photos = [
  '/assets/taking-care/IMG_1186.JPG.jpeg',
  '/assets/taking-care/IMG_1253.JPG.jpeg',
  '/assets/taking-care/IMG_1390.JPG.jpeg',
  '/assets/taking-care/IMG_1436.JPG.jpeg',
  '/assets/taking-care/IMG_1589.JPG.jpeg',
  '/assets/taking-care/IMG_9647.JPG.jpeg',
];

export default function InstagramSection() {
  return (
    <div className="instagram-section" style={{ marginTop: '-40px', paddingBottom: '10px', marginBottom: '-80px', position: 'relative', zIndex: 10 }}>
      <div className="section-header">
        <div className="section-tag">{"\u{1F4F8}"} Our Journey</div>
        <h2 className="section-title">Follow Our Journey <span>on Instagram</span></h2>
        <p className="section-desc">
          Stay connected with daily activities, events, and joyful moments from VT Kindergarten.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', maxWidth: '1100px', margin: '0 auto', padding: '0 24px 20px' }}>
        {photos.map((src, index) => (
          <div
            key={index}
            style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', aspectRatio: '1', background: '#f0f0f0', border: '6px solid white' }}
          >
            <img src={src} alt="Kindergarten Activity" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
          </div>
        ))}
      </div>
    </div>
  );
}
