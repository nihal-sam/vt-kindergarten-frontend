import { useEffect, useMemo, useState } from "react";

const phrases = ["Bright Future", "Joyful Learning", "Happy Childhood", "Smart Growth"];

export default function HeroClean() {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [scene, setScene] = useState({ x: 0, y: 0, scroll: 0 });

  useEffect(() => {
    const timer = setInterval(() => setPhraseIdx((current) => (current + 1) % phrases.length), 2500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const updatePointer = (event) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      setScene((current) => ({ ...current, x, y }));
    };

    const updateScroll = () => {
      const heroHeight = Math.max(window.innerHeight, 1);
      const scroll = Math.min(window.scrollY / heroHeight, 1);
      setScene((current) => ({ ...current, scroll }));
    };

    window.addEventListener("mousemove", updatePointer);
    window.addEventListener("scroll", updateScroll, { passive: true });
    updateScroll();

    return () => {
      window.removeEventListener("mousemove", updatePointer);
      window.removeEventListener("scroll", updateScroll);
    };
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const stageStyle = useMemo(() => ({
    transform: `
      perspective(1400px)
      rotateX(${(-scene.y * 8) + (scene.scroll * 6)}deg)
      rotateY(${scene.x * 12}deg)
      translateY(${scene.scroll * 16}px)
    `,
  }), [scene]);

  const orbStyle = useMemo(() => ({
    transform: `translate(${scene.x * 18}px, ${scene.y * 14}px) scale(${1 + scene.scroll * 0.08})`,
  }), [scene]);

  const pupilStyle = useMemo(() => ({
    transform: `translate(${scene.x * 9}px, ${scene.y * 6}px)`,
  }), [scene]);

  const leftChipStyle = useMemo(() => ({
    transform: `translate3d(${scene.x * -14}px, ${scene.y * -10}px, 24px)`,
  }), [scene]);

  const rightChipStyle = useMemo(() => ({
    transform: `translate3d(${scene.x * 16}px, ${scene.y * 8}px, 30px)`,
  }), [scene]);

  const topChipStyle = useMemo(() => ({
    transform: `translate3d(${scene.x * 10}px, ${scene.y * -12}px, 18px)`,
  }), [scene]);

  const ringOneStyle = useMemo(() => ({
    transform: `rotate(${scene.scroll * 20}deg) translateZ(8px)`,
  }), [scene]);

  const ringTwoStyle = useMemo(() => ({
    transform: `rotate(${scene.scroll * -28}deg) translateZ(-8px)`,
  }), [scene]);

  return (
    <div className="hero">
      <div className="hero-bg-overlay" />

      <div className="hero-content">
        <h1>
          Where Little
          <br />
          <em>Stars</em> Begin Their
          <br />
          <span>{phrases[phraseIdx]}</span>
        </h1>
        <p className="hero-desc">
          VT Kindergarten Pre School, near Reliance Smart Bazaar, Subramaniapuram, Karaikudi.
          We nurture every child's cognitive, social, and creative development with love and expert care.
        </p>
        <div className="hero-btns">
          <button className="btn-primary" onClick={() => scrollTo("enquiry")}>
            Enquire Now
          </button>
          <button className="btn-secondary" onClick={() => scrollTo("about")}>
            Learn More
          </button>
        </div>
        <div className="hero-stats" style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'rgba(255,255,255,0.7)', padding: '16px 20px', borderRadius: '20px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.4)', maxWidth: '100%' }}>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" fill="#3b82f6" width="42" height="42" style={{ filter: 'drop-shadow(0 4px 8px rgba(59,130,246,0.3))' }}>
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
          </div>
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ fontFamily: "'Fredoka One', cursive", fontSize: '22px', color: 'var(--primary)', margin: 0, lineHeight: 1.2 }}>Safe Environment</h3>
            <p style={{ fontSize: '14px', color: '#555', fontWeight: 700, margin: '4px 0 0 0', lineHeight: 1.4 }}>CCTV monitored, child-proof facilities</p>
          </div>
        </div>
      </div>

      <div className="hero-visual">
        <div className="hero-glow-orb" style={orbStyle} />

        <div className="hero-brand-stage" style={stageStyle}>

          <div className="hero-brand-card" style={{ padding: 0, background: 'transparent', border: 'none', boxShadow: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img 
              src="/assets/hero-elephant-bgless-v2.png" 
              alt="VT Kindergarten 3D Elephant" 
              className="hero-brand-img"
              style={{ width: '130%', height: '130%', objectFit: 'contain', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.2))' }}
            />
          </div>
        </div>

        <div className="hero-bubble b1">*</div>
        <div className="hero-bubble b2">o</div>
        <div className="hero-bubble b3">+</div>
        <div className="hero-bubble b4">+</div>
        <div className="hero-bubble b5">*</div>
        <div className="hero-bubble b6">o</div>
      </div>
    </div>
  );
}
