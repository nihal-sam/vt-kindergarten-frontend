import { useEffect, useRef, useState } from "react";

const features = [
  { icon: '👩‍🏫', title: 'Expert Mentors', desc: 'Passionate educators certified in Montessori & early childhood care' },
  { icon: '🛡️', title: '360° Safety & CCTV', desc: 'Child-proof, 24/7 CCTV surveillance with sanitized smart campus' },
  { icon: '🧠', title: 'Montessori Play-Way', desc: 'Hands-on sensory exploration, phonics, and cognitive activities' },
  { icon: '🤝', title: 'Parent Partnership', desc: 'Daily milestone updates, loving guidance, and open communication' },
];

const highlights = [
  'Play-based Montessori methodology nurturing natural curiosity',
  'Activity-enriched curriculum for motor, speech & social skills',
  '100% child-safe, hygienic & fully air-conditioned smart classrooms',
  'Regular parent-teacher updates & milestone celebrations',
  'Safe pick-up & drop protocols with dedicated staff supervision',
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

  const scrollToEligibility = () => {
    const el = document.getElementById('eligibility');
    if (el) {
      const offset = 85;
      const target = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(target, 0), behavior: "smooth" });
    }
  };

  return (
    <div className="about-section" ref={sectionRef}>
      <div className="section-header text-center" style={{ maxWidth: '780px', margin: '0 auto 48px', textAlign: 'center' }}>
        <div className="section-tag">About VT Kindergarten</div>
        <h2 className="section-title">Where Every Child <span>Flourishes</span> 🌸</h2>
        <p className="section-desc">
          Recognized as Karaikudi&apos;s leading kindergarten &amp; pre-school, we provide a warm, safe, and inspiring foundation where little minds discover the joy of learning.
        </p>
      </div>

      <div className="about-grid">
        {/* Left: Video Showcase */}
        <div className="about-visual reveal">
          <div className="about-video-card" style={{ maxWidth: '340px', margin: '0 auto' }}>
            <div 
              className="about-video-wrapper"
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
                <div className="about-video-overlay">
                  <div className="about-play-button">
                    ▶
                  </div>
                  <span className="about-play-hint" style={{ opacity: isHovered ? 1 : 0.85 }}>
                    Tap to Watch Campus Tour
                  </span>
                </div>
              )}
            </div>
            <div className="about-video-badge">
              <span>🏫 Experience Our Campus Life</span>
            </div>
          </div>
        </div>

        {/* Right: Narrative & Highlights */}
        <div className="about-text reveal">
          <div className="about-intro-box">
            <h3>Caring Foundation, Safe Learning, Confident Futures ✨</h3>
            <p>
              At VT Kindergarten, education is not about rote memorization—it is about nurturing curiosity, empathy, and natural confidence. Guided by certified early childhood educators, children explore science, art, phonics, and socialization in a joyful, home-like environment.
            </p>
          </div>

          {/* 4 Pillars Grid */}
          <div className="about-features-bento">
            {features.map((f, i) => (
              <div className="about-feature-card" key={i}>
                <span className="about-feature-icon">{f.icon}</span>
                <div>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="about-highlights-list">
            {highlights.map((h, i) => (
              <div className="about-highlight-item" key={i}>
                <span className="about-check-icon">✓</span>
                <span>{h}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 32, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={scrollToEligibility}>
              <span>🎯 Check Age &amp; Enroll</span>
              <span className="btn-arrow">&rarr;</span>
            </button>
            <a href="tel:+917358293839" className="btn-secondary">
              <span>📞 Schedule a Campus Visit</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
