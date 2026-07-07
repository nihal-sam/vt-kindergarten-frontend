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
              style={{ width: '100%', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', border: '6px solid white', aspectRatio: '9/16', background: '#000', position: 'relative', cursor: 'pointer' }}
              onClick={togglePlay}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <video 
                ref={videoRef}
                src="/assets/about-video.mp4" 
                loop 
                muted 
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              {!isPlaying && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', transition: 'all 0.3s ease' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '28px', paddingLeft: '6px', marginBottom: '12px', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
                    ▶
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', opacity: isHovered ? 1 : 0, transform: isHovered ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.3s ease' }}>
                    Tap video to play
                  </div>
                </div>
              )}
            </div>
            <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', color: 'white', padding: '18px 24px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 10px 30px rgba(255,107,53,0.3)' }}>
              <h3 style={{ fontFamily: "'Fredoka One', cursive", fontSize: '24px', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>☀️ Summer Camp</h3>
            </div>
          </div>
        </div>

        <div className="about-text reveal" style={{ animationDelay: '0.2s' }}>
          <div className="section-tag">About Us</div>
          <h2>Where Every Child <span>Blossoms</span> 🌸</h2>
          <p>
            VT Kindergarten, Play school and Pre school is located at 11, 7th St, near Reliance Smart Bazaar, Subramaniapuram, south extension, Vairavapuram, Karaikkudi (M.Corp), Tamil Nadu 630002.
            We are one of Karaikudi's most trusted early childhood education centers.
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
