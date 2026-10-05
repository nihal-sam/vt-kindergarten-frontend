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
    transform: `translate(${scene.x * 18}px, ${scene.y * 14}px) scale(${1 + scene.scroll * 0.08})`,
  }), [scene]);

  return (
    <div className="hero">
      <div className="hero-ambient-glow" />

      <div className="hero-content">
        <h1>
          Where Little
          <br />
          <em>Stars</em> Begin Their
          <br />
          <span className="hero-phrase-rotate">{phrases[phraseIdx]}</span>
        </h1>

        <p className="hero-desc">
          VT Kindergarten Pre School. We nurture every child&apos;s cognitive, social, and creative development with love and expert care.
        </p>

        <div className="hero-btns">
          <button className="btn-primary" onClick={() => scrollTo("eligibility")}>
            <span>Enquire Now</span>
            <span className="btn-arrow">&rarr;</span>
          </button>
          <button className="btn-secondary" onClick={() => scrollTo("about")}>
            <span>Learn More</span>
          </button>
        </div>

        <div className="hero-stats-card">
          <div className="stats-icon-wrap">🛡️</div>
          <div className="stats-text-wrap">
            <h3>Safe Environment</h3>
            <p>CCTV monitored, child-proof facilities</p>
          </div>
        </div>
      </div>

      <div className="hero-visual">
        <div className="hero-glow-orb" style={orbStyle} />

        <div className="hero-brand-stage" style={stageStyle}>
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
