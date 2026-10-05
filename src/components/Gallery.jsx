import { useState } from "react";

const galleryItems = [
  {
    src: '/images/acivites/f82ff7e5-dfbf-4bf1-9058-ec135ce539f2.jpg',
    title: 'Block Building & Logic Play',
    category: 'Learning',
    badge: '🧩 Montessori'
  },
  {
    src: '/images/acivites/IMG_1263.JPG.jpeg',
    title: 'Classroom Story & Phonics Circle',
    category: 'Classroom',
    badge: '📖 Story Time'
  },
  {
    src: '/images/acivites/IMG_0172.JPG.jpeg',
    title: 'Creative Coloring & Art',
    category: 'Creative',
    badge: '🎨 Arts & Crafts'
  },
  {
    src: '/images/acivites/IMG_0133.JPG.jpeg',
    title: 'Group Motor Skills & Games',
    category: 'Play',
    badge: '🏃 Play-Way'
  },
  {
    src: '/assets/taking-care/IMG_1186.JPG.jpeg',
    title: 'Gentle Mentorship & Teacher Care',
    category: 'Classroom',
    badge: '👩‍🏫 Teacher Care'
  },
  {
    src: '/images/acivites/IMG_1243.JPG.jpeg',
    title: 'Hands-on Puzzle Discovery',
    category: 'Learning',
    badge: '🧠 Sensory'
  },
  {
    src: '/assets/taking-care/IMG_1390.JPG.jpeg',
    title: 'Joyful Play & Outdoor Activity',
    category: 'Play',
    badge: '🎈 Outdoor Fun'
  },
  {
    src: '/images/acivites/IMG_1429.JPG.jpeg',
    title: 'Festive & Cultural Celebrations',
    category: 'Creative',
    badge: '🎉 Celebration'
  },
];

const categories = ['All', 'Learning', 'Classroom', 'Creative', 'Play'];

export default function Gallery() {
  const [activeTab, setActiveTab] = useState('All');
  const [lightboxImg, setLightboxImg] = useState(null);

  const filteredItems = activeTab === 'All' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === activeTab);

  return (
    <div className="gallery-section">
      <div className="section-header text-center" style={{ maxWidth: '780px', margin: '0 auto 36px', textAlign: 'center' }}>
        <div className="section-tag">Campus Life</div>
        <h2 className="section-title">Life at <span>VT Kindergarten</span> 📸</h2>
        <p className="section-desc">
          A vibrant glimpse into our joyful, activity-filled daily school environment where smiling memories are made every day.
        </p>

        {/* Category Tabs */}
        <div className="gallery-tabs">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              className={`gallery-tab-btn ${activeTab === cat ? 'active' : ''}`}
              onClick={() => setActiveTab(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="gallery-premium-grid">
        {filteredItems.map((item, index) => (
          <div 
            key={index} 
            className="gallery-card"
            onClick={() => setLightboxImg(item)}
          >
            <div className="gallery-card-inner">
              <img 
                src={item.src} 
                alt={item.title} 
                loading="lazy" 
                className="gallery-card-img"
              />
              <div className="gallery-card-overlay">
                <span className="gallery-card-badge">{item.badge}</span>
                <h4 className="gallery-card-title">{item.title}</h4>
                <span className="gallery-card-hint">🔍 Tap to Zoom</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxImg && (
        <div className="gallery-lightbox" onClick={() => setLightboxImg(null)}>
          <div className="gallery-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="gallery-lightbox-close"
              onClick={() => setLightboxImg(null)}
              aria-label="Close image preview"
            >
              ✕
            </button>
            <img src={lightboxImg.src} alt={lightboxImg.title} />
            <div className="gallery-lightbox-caption">
              <span className="gallery-card-badge">{lightboxImg.badge}</span>
              <h3>{lightboxImg.title}</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

