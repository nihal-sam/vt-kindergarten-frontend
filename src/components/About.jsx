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

      {/* Instagram Reels Row */}
      <div style={{ marginTop: '100px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', width: '100%' }}>
        {[
          'DYkClf4PE5-',
          'DWvdnvWDGvY',
          'DV0KTx1Dc90'
        ].map((reelId, index) => (
          <div 
            key={index} 
            style={{ 
              width: '100%', 
              borderRadius: '24px', 
              overflow: 'hidden', 
              boxShadow: '0 15px 35px rgba(0,0,0,0.1)', 
              border: '6px solid white', 
              background: '#000', 
              height: '400px', 
              position: 'relative', 
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
              cursor: 'pointer' 
            }}
            onMouseEnter={(e) => { 
              e.currentTarget.style.transform = 'translateY(-12px)'; 
              e.currentTarget.style.boxShadow = '0 30px 60px rgba(255,107,53,0.3)'; 
              e.currentTarget.style.borderColor = 'var(--primary)';
            }}
            onMouseLeave={(e) => { 
              e.currentTarget.style.transform = 'translateY(0)'; 
              e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.1)'; 
              e.currentTarget.style.borderColor = 'white';
            }}
          >
            <iframe 
              src={`https://www.instagram.com/reel/${reelId}/embed`}
              width="100%" 
              height="580" 
              frameBorder="0" 
              scrolling="no" 
              allowtransparency="true"
              style={{ display: 'block', marginTop: '-54px', pointerEvents: 'none' }}
            ></iframe>
            <a href={`https://www.instagram.com/reel/${reelId}/`} target="_blank" rel="noopener noreferrer" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }}></a>
          </div>
        ))}
      </div>
    </div>
  );
}
