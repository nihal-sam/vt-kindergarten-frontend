const posts = [
  { emoji: "\u{1F3A8}", bg: '#FFE8D6', label: 'Art Class Fun!' },
  { emoji: "\u{1F3B5}", bg: '#D6FFFB', label: 'Music Time' },
  { emoji: "\u{1F33F}", bg: '#D6FFE8', label: 'Nature Walk' },
  { emoji: "\u{1F3C6}", bg: '#FFF3CD', label: 'Sports Day 2024' },
  { emoji: "\u{1F4DA}", bg: '#F3E8FF', label: 'Story Time' },
  { emoji: "\u{1F3AD}", bg: '#FFE0F0', label: 'Drama Class' },
  { emoji: "\u{1F938}", bg: '#E8F5FF', label: 'Yoga for Kids' },
  { emoji: "\u{1F34E}", bg: '#FFF9E6', label: 'Healthy Lunch' },
];

export default function InstagramSection() {
  return (
    <div className="instagram-section">
      <div className="section-header">
        <div className="section-tag">{"\u{1F4F8}"} Instagram</div>
        <h2 className="section-title">Follow Our <span>Journey</span> on Instagram</h2>
        <p className="section-desc">
          Stay connected with daily activities, events, and joyful moments from VT Kindergarten.
        </p>
      </div>

      <div className="insta-grid">
        {posts.map((post, index) => (
          <div
            key={index}
            className="insta-card"
            style={{ background: post.bg }}
            onClick={() => window.open('https://www.instagram.com/reel/DVTheAzDlsU/', '_blank')}
            title={post.label}
          >
            <span style={{ fontSize: 56 }}>{post.emoji}</span>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center' }}>
        <a
          href="https://www.instagram.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="insta-follow-btn"
        >
          <span style={{ fontSize: 20 }}>{"\u{1F4F8}"}</span>
          Follow @VTKindergarten on Instagram
        </a>
      </div>
    </div>
  );
}
