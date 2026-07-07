const images = [
  '/images/acivites/f82ff7e5-dfbf-4bf1-9058-ec135ce539f2.jpg',
  '/images/acivites/IMG_1263.JPG.jpeg',
  '/images/acivites/IMG_0172.JPG.jpeg'
];

export default function Gallery() {
  return (
    <div className="gallery-section" style={{ marginTop: '-60px', paddingTop: '20px' }}>
      <div className="section-header">
        <div className="section-tag">Gallery</div>
        <h2 className="section-title">Life at <span>VT Kindergarten</span> {"\u{1F4F8}"}</h2>
        <p className="section-desc">
          A glimpse into our joyful, activity-filled school environment where memories are made.
        </p>
      </div>
      <div className="gallery-image-row">
        {images.map((src, index) => (
          <div key={index} className="gallery-image-wrapper">
            <img src={src} alt={`VT Kindergarten Activity ${index + 1}`} loading="lazy" />
          </div>
        ))}
      </div>
    </div>
  );
}

