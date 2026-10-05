import { useEffect, useRef, useState } from "react";

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

  const scrollToContact = () => {
    const el = document.getElementById('contact') || document.getElementById('eligibility');
    if (el) {
      const offset = 85;
      const target = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(target, 0), behavior: "smooth" });
    }
  };

  return (
    <div className="about-section" ref={sectionRef}>
      <div className="about-grid">
        {/* Left: Video Showcase */}
        <div className="about-visual reveal">
          <div className="about-video-card">
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
                    Tap video to play
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Narrative & Highlights */}
        <div className="about-text reveal">
          <div className="section-tag">About Us</div>
          <h2>Where Every Child <span>Blossoms</span> 🌸</h2>
          <p className="about-lead-text">
            <strong>Caring foundation, safe learning, confident futures.</strong><br /><br />
            At VT Kindergarten, parents place their trust in us for early childhood education. Recognized as one of Karaikudi&apos;s leading best playschools, we prioritize safety, confidence-building, and holistic growth in every child&apos;s journey.
          </p>
          <p className="about-feedback-box">
            ✨ <strong>Parent&apos;s feedback:</strong> Caring and Safe environment, nurturing confidence, fostering development.
          </p>

          <div className="about-highlights-list">
            {highlights.map((h, i) => (
              <div className="about-highlight-item" key={i}>
                <span className="about-check-icon">✓</span>
                <span>{h}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 32 }}>
            <button className="btn-primary" onClick={scrollToContact}>
              <span>📩 Contact Us Today</span>
              <span className="btn-arrow">&rarr;</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
