const items = [
  { emoji: "\u{1F3A8}", label: 'Art & Craft Activity', bg: 'gallery-bg-1', large: true },
  { emoji: "\u{1F4DA}", label: 'Story Time', bg: 'gallery-bg-2' },
  { emoji: "\u{1F3B5}", label: 'Music & Dance', bg: 'gallery-bg-3' },
  { emoji: "\u{1F3C3}", label: 'Sports Day', bg: 'gallery-bg-4' },
  { emoji: "\u{1F33F}", label: 'Nature Learning', bg: 'gallery-bg-5' },
  { emoji: "\u{1F9E9}", label: 'Puzzle Activities', bg: 'gallery-bg-6' },
  { emoji: "\u{1F3AD}", label: 'Drama & Role Play', bg: 'gallery-bg-7' },
];

export default function Gallery() {
  return (
    <div className="gallery-section">
      <div className="section-header">
        <div className="section-tag">Gallery</div>
        <h2 className="section-title">Life at <span>VT Kindergarten</span> {"\u{1F4F8}"}</h2>
        <p className="section-desc">
          A glimpse into our joyful, activity-filled school environment where memories are made.
        </p>
      </div>
      <div className="gallery-grid">
        {items.map((item, index) => (
          <div
            key={index}
            className={`gallery-item ${item.bg} ${item.large ? 'large' : ''}`}
            data-label={item.label}
          >
            {item.emoji}
          </div>
        ))}
      </div>
    </div>
  );
}
