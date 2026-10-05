import { useEffect, useMemo, useState } from "react";

const phrases = ["Bright Future", "Joyful Learning", "Creative Growth", "Happy Childhood"];

export default function HeroClean() {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [scene, setScene] = useState({ x: 0, y: 0, scroll: 0 });

  useEffect(() => {
    const timer = setInterval(() => setPhraseIdx((current) => (current + 1) % phrases.length), 2600);
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

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 85;
      const target = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(target, 0), behavior: "smooth" });
    }
  };

  const stageStyle = useMemo(() => ({
    transform: `
      perspective(1400px)
      rotateX(${(-scene.y * 7) + (scene.scroll * 5)}deg)
      rotateY(${scene.x * 10}deg)
      translateY(${scene.scroll * 14}px)
    `,
  }), [scene]);

  const orbStyle = useMemo(() => ({
    transform: `translate(${scene.x * 20}px, ${scene.y * 16}px) scale(${1 + scene.scroll * 0.08})`,
  }), [scene]);

  const chipOneStyle = useMemo(() => ({
    transform: `translate3d(${scene.x * -16}px, ${scene.y * -12}px, 35px)`,
  }), [scene]);

  const chipTwoStyle = useMemo(() => ({
    transform: `translate3d(${scene.x * 18}px, ${scene.y * 10}px, 45px)`,
  }), [scene]);

  const chipThreeStyle = useMemo(() => ({
    transform: `translate3d(${scene.x * 12}px, ${scene.y * -16}px, 25px)`,
  }), [scene]);

  return (
    <div className="hero">
      {/* Ambient background glow orbs */}
      <div className="hero-ambient-glow" />

      <div className="hero-content">
        {/* Live Admissions Badge */}
        <div className="hero-badge">
          <span className="hero-badge-pulse" />
          <span className="hero-badge-icon">✨</span>
          <span className="hero-badge-text">Admissions Open 2026-2027 • Karaikudi</span>
        </div>

        <h1>
          Where Little
          <br />
          <em>Stars</em> Blossom With
          <br />
          <span className="hero-phrase-rotate">{phrases[phraseIdx]}</span>
        </h1>

        <p className="hero-desc">
          VT Kindergarten Pre School — nurturing every child&apos;s cognitive, social, and emotional development through Montessori play-way learning, passionate teachers, and 100% child-safe, CCTV-monitored facilities.
        </p>

        <div className="hero-btns">
          <button className="btn-primary" onClick={() => scrollTo("eligibility")}>
            <span>🎯 Check Age Eligibility</span>
            <span className="btn-arrow">&rarr;</span>
          </button>
          <a
            href="https://wa.me/917358293839?text=Hello%20VT%20Kindergarten,%20I%20would%20like%20to%20know%20more%20about%20admissions"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            <span>💬 WhatsApp Enquiry</span>
          </a>
        </div>

        {/* 4 Trust Metrics Bar */}
        <div className="hero-trust-bar">
          <div className="hero-trust-item">
            <span className="hero-trust-icon">🛡️</span>
            <div>
              <strong>100% Child-Safe</strong>
              <small>CCTV & Child-Proof Campus</small>
            </div>
          </div>
          <div className="hero-trust-sep" />
          <div className="hero-trust-item">
            <span className="hero-trust-icon">👩‍🏫</span>
            <div>
              <strong>Expert Mentors</strong>
              <small>1:10 Teacher Ratio</small>
            </div>
          </div>
          <div className="hero-trust-sep" />
          <div className="hero-trust-item">
            <span className="hero-trust-icon">🧩</span>
            <div>
              <strong>Montessori & Phonics</strong>
              <small>Activity-Rich Curriculum</small>
            </div>
          </div>
        </div>
      </div>

      <div className="hero-visual">
        <div className="hero-glow-orb" style={orbStyle} />

        <div className="hero-brand-stage" style={stageStyle}>
          {/* Floating Glassmorphic Highlight Chips */}
          <div className="hero-float-chip chip-top-left" style={chipOneStyle}>
            <span className="chip-icon">🌟</span>
            <div className="chip-text">
              <strong>#1 Pre-School</strong>
              <small>Parent Recommended</small>
            </div>
          </div>

          <div className="hero-float-chip chip-bottom-right" style={chipTwoStyle}>
            <span className="chip-icon">🎨</span>
            <div className="chip-text">
              <strong>Joyful Learning</strong>
              <small>Sensory & Creative Play</small>
            </div>
          </div>

          <div className="hero-float-chip chip-bottom-left" style={chipThreeStyle}>
            <span className="chip-icon">❄️</span>
            <div className="chip-text">
              <strong>AC Classrooms</strong>
              <small>Safe & Clean Campus</small>
            </div>
          </div>

          <div className="hero-brand-card">
            <img 
              src="/assets/hero-elephant-bgless-v2.png" 
              alt="VT Kindergarten Mascot" 
              className="hero-brand-img"
            />
          </div>
        </div>

        <div className="hero-bubble b1">⭐</div>
        <div className="hero-bubble b2">🎈</div>
        <div className="hero-bubble b3">✨</div>
        <div className="hero-bubble b4">🌸</div>
      </div>
    </div>
  );
}
