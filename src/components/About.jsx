import { useEffect, useRef, useState } from "react";

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
  'Parent-teacher communication',
  'Air-conditioned classrooms',
];

export default function About() {
  const sectionRef = useRef();
  const videoRef = useRef();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

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
          <div style={{ width: '100%', maxWidth: '340px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div 
              style={{ width: '100%', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', border: '6px solid white', background: '#fff', position: 'relative' }}
            >
              <iframe 
                src="https://www.instagram.com/reel/DYkClf4PE5-/embed" 
                width="100%" 
                height="580" 
                frameBorder="0" 
                scrolling="no" 
                allowtransparency="true"
                style={{ display: 'block' }}
              ></iframe>
            </div>

          </div>
        </div>

        <div className="about-text reveal" style={{ animationDelay: '0.2s' }}>
          <div className="section-tag">About Us</div>
          <h2>Where Every Child <span>Blossoms</span> 🌸</h2>
          <p>
            At VT Kindergarten, parents have trusted us in early childhood education, and VT Kindergarten is one of the best playschools in Karaikudi, where safety, confidence-building, and holistic development are at the heart of everything we do.
          </p>
          <p>
            ✨ <strong>Our Parent’s Tagline:</strong> Safety for the children, building confidence, and nurturing growth.
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
