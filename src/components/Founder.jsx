export default function Founder() {
  return (
    <div className="founder-section" style={{ background: 'var(--light)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <div className="section-tag" style={{ margin: '0 auto 16px' }}>Founders' Note</div>
        <h2 style={{ marginBottom: '32px' }}>Welcome to <span>VT Kindergarten</span> ✨</h2>
        
        <div style={{ background: 'white', border: '3px solid var(--primary)', padding: '40px', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-soft)', textAlign: 'left', lineHeight: '1.8', fontSize: '16px', color: 'var(--text)' }}>
          <p style={{ marginBottom: '20px' }}>
            VT Kindergarten was founded by <strong>Thiru Venkatachalam Chettiar</strong> and <strong>Mrs. Meyyammai Achi</strong> with a vision to make early education joyful, caring, and meaningful.
          </p>
          <p style={{ marginBottom: '20px' }}>
            They believed the early years mark the zenith of a child's grasping power, and thus created a nurturing space where every child can shine.
          </p>
          <p style={{ margin: 0 }}>
            By blending Montessori pedagogy with playful exploration, VT Kindergarten fosters confidence, creativity, and a lifelong love for learning.
          </p>
        </div>
      </div>
    </div>
  );
}
