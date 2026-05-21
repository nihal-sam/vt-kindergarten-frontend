import { useEffect, useRef } from "react";

const features = [
  { icon: '👩‍🏫', title: 'Expert Teachers', desc: 'Trained & certified early childhood educators' },
  { icon: '🛡️', title: 'Safe Environment', desc: 'CCTV monitored, child-proof facilities' },
  { icon: '🧠', title: 'Cognitive Dev.', desc: 'Science-backed learning activities' },
  { icon: '🤝', title: 'Social Skills', desc: 'Group activities & peer interaction' },
];

const highlights = [
  'Play-based learning methodology',
  'Activity-enriched curriculum',
  'Motor skills development programs',
  'Nutritious meal & snack time',
  'Parent-teacher communication',
  'Air-conditioned classrooms',
];

export default function About() {
  const sectionRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible');
      }),
      { threshold: 0.1 }
    );
    sectionRef.current?.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="about-section" ref={sectionRef}>
      <div className="about-grid">
        <div className="about-visual reveal">
          <div className="about-image-wrap">
            🏫
            <div className="about-badge-float about-badge-1">
              <span>⭐</span>
              <div>
                <strong style={{fontSize:'15px',display:'block'}}>4.9/5 Rating</strong>
                <span style={{fontSize:'12px',color:'#888'}}>Parent Reviews</span>
              </div>
            </div>
            <div className="about-badge-float about-badge-2">
              <span>🏆</span>
              <div>
                <strong style={{fontSize:'15px',display:'block'}}>Best Play School</strong>
                <span style={{fontSize:'12px',color:'#888'}}>Karaikudi 2024</span>
              </div>
            </div>
          </div>
          <div className="about-features">
            {features.map((f, i) => (
              <div className="feature-card" key={i}>
                <span className="feature-icon">{f.icon}</span>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="about-text reveal" style={{ animationDelay: '0.2s' }}>
          <div className="section-tag">About Us</div>
          <h2>Where Every Child <span>Blossoms</span> 🌸</h2>
          <p>
            VT Kindergarten Play School is located at 11, 7th Street, South Extension, Vairavapuram,
            Subramaniapuram, Karaikudi — 630002. Situated conveniently near Reliance Smart Bazaar,
            we are one of Karaikudi's most trusted early childhood education centers.
          </p>
          <p>
            Our school offers a nurturing, stimulating environment where children from 2+ to 5+ years
            build a strong foundation for lifelong learning. We believe every child is unique and deserves
            personalized attention and joyful education.
          </p>

          <div className="about-highlights">
            {highlights.map((h, i) => (
              <div className="highlight-item" key={i}>
                <div className="highlight-dot" />
                {h}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 32 }}>
            <button className="btn-primary" onClick={() => document.getElementById('enquiry')?.scrollIntoView({ behavior: 'smooth' })}>
              📩 Contact Us Today
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
